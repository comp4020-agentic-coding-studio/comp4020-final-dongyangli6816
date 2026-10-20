import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { join, openRoom, person, post } from "./helpers.ts";

// Avatar animations (docs/product/criteria/animations.md) with the page's
// script and styles running. Each test names the criterion it covers.
//
// The hooks these checks read are the criteria file's contract (the QA
// report, round one), most of them already in today's markup:
// - `button.avatar[data-pose]`: `stand` (Idle, Finished), `rest` (Resting),
//   `sit` (Slacking), `walk` while walking (`stand` if the walk is cut, D1),
//   and the station's equipment id while Lifting on the machine. `--x` and
//   `--y` are the tile it stands on; on a station that is the station's tile.
// - an animation's two drawings are `g.frame-1` (the still frame) and
//   `g.frame-2` inside `svg.av`; exactly one of them shows at any moment.
// - the bob moves `g.av-top` by translateY(2) in sprite units, as today.
// - on the machine, `svg.av` lies inside the station's tile.
// - `.front`: a machine's front parts, drawn over the person, outside `svg.av`.
// - `.station .bar`: the bar or handle in its resting place on the flat bench,
//   squat rack, lifting platform and cable machine, shown only while nobody is
//   on the machine.
// - `svg.av .glow`: a Slacking person's phone screen.

const MACHINES = [
  { equipment: "treadmill", exercise: "1", slot: 1, ms: 250 },
  { equipment: "flat-bench", exercise: "3", slot: 2, ms: 400 },
  { equipment: "squat-rack", exercise: "5", slot: 3, ms: 400 },
  { equipment: "dumbbell-rack", exercise: "7", slot: 4, ms: 400 },
  // the next four are delivered to the empty stations in slot order
  { equipment: "lifting-platform", exercise: "9", slot: 5, ms: 400 },
  { equipment: "pull-up-bar", exercise: "11", slot: 6, ms: 400 },
  { equipment: "cable-machine", exercise: "13", slot: 7, ms: 400 },
  { equipment: "exercise-mat", exercise: "15", slot: 8, ms: 400 },
];
const WITH_BAR = ["flat-bench", "squat-rack", "lifting-platform", "cable-machine"];
const TILE: Record<number, [number, number]> = {
  1: [1, 1], 2: [3, 1], 3: [6, 1], 4: [8, 1], 5: [1, 3], 6: [3, 3], 7: [6, 3], 8: [8, 3], 9: [1, 5], 10: [3, 5], 11: [6, 5], 12: [8, 5],
};
const COOLER: [number, number] = [1, 7]; // the first rest spot
const LOCKERS: [number, number] = [8, 7]; // the first idle spot
const IDLE_SPOTS = ["8,7", "6,7", "7,8", "8,8", "6,8", "7,7"];

// ---------- people and rooms ----------

async function room(browser: Browser, names: string[]) {
  const people: BrowserContext[] = [];
  for (const name of names) people.push(await person(browser, name));
  const { path, passcode } = await openRoom(people[0]);
  for (const p of people.slice(1)) await join(p, passcode);
  return { path, people };
}

// a screen in the room, live, recording the map from its first frame
async function screen(who: BrowserContext, path: string, opts: { reduced?: boolean; viewport?: { width: number; height: number } } = {}) {
  const page = await who.newPage();
  if (opts.viewport) await page.setViewportSize(opts.viewport);
  if (opts.reduced) await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(probe);
  await page.goto(path);
  await expect(page.locator(".map-panel .conn .badge")).toHaveText("Live");
  return page;
}

const choose = (who: BrowserContext, path: string, exercise: string) => post(who, path, { action: "choose", exercise });
const logSet = (who: BrowserContext, path: string, exercise: string) =>
  post(who, path, { exercise_id: exercise, weight_kg: "40", reps: "8" });
// a set, then its rest cut to 15 s, the shortest the server counts as a rest
// (a 0 s rest is no rest at all), so Slacking starts 45 s after it (GYM-11).
// Returns its slack point, from the moment before the set was posted, so it
// is never later than the server's and a check against it is never lenient.
const SHORT_REST_MS = 15_000;
async function logSetWithShortRest(who: BrowserContext, path: string, exercise: string, defaultRestS: number) {
  const loggedAt = Date.now();
  await logSet(who, path, exercise);
  for (let i = 0; i < (defaultRestS - SHORT_REST_MS / 1000) / 15; i++) await post(who, path, { action: "rest", delta: "-15" });
  return loggedAt + SHORT_REST_MS + 30_000;
}

const avatar = (page: Page, name: string) =>
  page.locator(`.map .avatar[aria-label^="${name},"], .map .avatar[aria-label^="${name} (you),"]`);
const idOf = async (page: Page, name: string) => (await avatar(page, name).getAttribute("data-id"))!;
const onMachine = (page: Page, name: string, equipment: string, timeout = 5000) =>
  expect(avatar(page, name)).toHaveAttribute("data-pose", equipment, { timeout });
// standing on a tile (arrived, not just headed there)
const atTile = (page: Page, name: string, [x, y]: [number, number], timeout = 5000) =>
  expect(avatar(page, name)).toHaveAttribute("style", new RegExp(`--x: ${x}; --y: ${y}(;|$)`), { timeout });

// ---------- the probe: what the map shows, every frame ----------

type Box = [number, number, number, number]; // left, top, right, bottom
type AvatarSample = {
  t: number; kind: "avatar"; id: string; x: number; y: number; pose: string; state: string; cls: string; label: string;
  frame: number; bob: number | null; glow: string | null; av: Box | null; tag: Box | null;
};
type StationSample = { t: number; kind: "station"; slot: number; equipment: string | null; bar: boolean | null; box: Box };
type GoneSample = { t: number; kind: "gone"; id: string };
type Sample = AvatarSample | StationSample | GoneSample;

// Runs in the page. Records each avatar and station whenever anything about
// it changes, with Date.now(), so the tests can read the timeline after.
// frame: 0 no frames, 1 or 2 the one showing, -1 both, -2 neither.
function probe() {
  const w = window as unknown as { __qa?: { read: () => Promise<unknown[]>; clear: () => Promise<void> } };
  if (w.__qa) return;
  const log: unknown[] = [];
  const last = new Map<string, string>();
  const shown = (el: Element | null): boolean => {
    if (!el) return false;
    if (getComputedStyle(el).visibility === "hidden") return false;
    for (let e: Element | null = el; e && !e.classList.contains("map"); e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === "none" || Number(cs.opacity) === 0) return false;
    }
    return true;
  };
  const box = (el: Element | null) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [r.left, r.top, r.right, r.bottom].map((v) => Math.round(v * 10) / 10);
  };
  const frameOf = (svg: Element | null) => {
    const f1 = svg?.querySelector(".frame-1") ?? null;
    const f2 = svg?.querySelector(".frame-2") ?? null;
    if (!f1 && !f2) return 0;
    const a = shown(f1);
    const b = shown(f2);
    return a && !b ? 1 : b && !a ? 2 : a && b ? -1 : -2;
  };
  const bobOf = (svg: Element | null) => {
    const top = [...(svg?.querySelectorAll(".av-top") ?? [])].find(shown);
    if (!top) return null;
    const t = getComputedStyle(top).transform;
    return t === "none" ? 0 : Math.round(new DOMMatrix(t).f * 10) / 10;
  };
  const record = (key: string, sample: Record<string, unknown>, t: number) => {
    const j = JSON.stringify(sample);
    if (last.get(key) === j) return;
    last.set(key, j);
    log.push({ t, ...sample });
  };
  const tick = () => {
    const t = Date.now();
    const seen = new Set<string>();
    for (const a of document.querySelectorAll<HTMLElement>(".map .avatar")) {
      const svg = a.querySelector("svg.av");
      const glow = svg?.querySelector(".glow");
      const id = a.dataset.id ?? "";
      seen.add(id);
      record(`a${id}`, {
        kind: "avatar", id,
        x: Number(a.style.getPropertyValue("--x")), y: Number(a.style.getPropertyValue("--y")),
        pose: a.dataset.pose ?? "", state: a.dataset.state ?? "", cls: a.className, label: a.getAttribute("aria-label") ?? "",
        frame: frameOf(svg), bob: bobOf(svg), glow: glow ? getComputedStyle(glow).fill : null,
        av: box(svg), tag: box(a.querySelector(".tag")),
      }, t);
    }
    for (const key of last.keys()) {
      if (key.startsWith("a") && !seen.has(key.slice(1))) {
        last.delete(key);
        log.push({ t, kind: "gone", id: key.slice(1) });
      }
    }
    for (const s of document.querySelectorAll<HTMLElement>(".map .station")) {
      const bar = s.querySelector(".bar");
      record(`s${s.dataset.slot}`, {
        kind: "station", slot: Number(s.dataset.slot), equipment: s.dataset.equipment ?? null,
        bar: bar ? shown(bar) : null, box: box(s),
      }, t);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  // Both wait two frames, so the probe has ticked since the call: read() sees
  // the page as it is now, and clear() leaves a fresh sample of everything as
  // the baseline (clear forgets what was last seen, so the tick records all).
  const twoFrames = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  w.__qa = {
    read: () => twoFrames().then(() => log.slice()),
    clear: () => {
      log.splice(0);
      last.clear();
      return twoFrames();
    },
  };
}

const samples = (page: Page) => page.evaluate(() => (window as unknown as { __qa: { read: () => Promise<unknown[]> } }).__qa.read()) as Promise<Sample[]>;
const clearSamples = (page: Page) => page.evaluate(() => (window as unknown as { __qa: { clear: () => Promise<void> } }).__qa.clear());
const trackOf = (log: Sample[], id: string) => log.filter((s): s is AvatarSample => s.kind === "avatar" && s.id === id);
const stationBox = (log: Sample[], slot: number) =>
  log.filter((s): s is StationSample => s.kind === "station" && s.slot === slot).at(-1)!.box;
const barOf = (log: Sample[], slot: number) =>
  log.filter((s): s is StationSample => s.kind === "station" && s.slot === slot).at(-1)?.bar;

const within = (inner: Box | null, outer: Box, slack = 1) =>
  !!inner && inner[0] >= outer[0] - slack && inner[1] >= outer[1] - slack && inner[2] <= outer[2] + slack && inner[3] <= outer[3] + slack;
const tileKey = (s: { x: number; y: number }) => `${s.x},${s.y}`;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

// times between changes of a value, skipping samples where it is undefined
function intervals<T>(track: AvatarSample[], value: (s: AvatarSample) => T | undefined): number[] {
  const at: number[] = [];
  let prev: T | undefined;
  for (const s of track) {
    const v = value(s);
    if (v === undefined) continue;
    if (prev !== undefined && v !== prev) at.push(s.t);
    prev = v;
  }
  return at.slice(1).map((t, i) => t - at[i]);
}
const frameSwaps = (track: AvatarSample[]) => intervals(track, (s) => (s.frame === 1 || s.frame === 2 ? s.frame : undefined));
const bobSwaps = (track: AvatarSample[]) => intervals(track, (s) => s.bob ?? undefined);

// the tiles an avatar stood on, in order, each once per visit
function tilesOf(track: AvatarSample[]): string[] {
  const out: string[] = [];
  for (const s of track) if (out.at(-1) !== tileKey(s)) out.push(tileKey(s));
  return out;
}
const adjacent = (a: string, b: string) => {
  const [ax, ay] = a.split(",").map(Number);
  const [bx, by] = b.split(",").map(Number);
  return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
};

// What showed while walking: the samples after the last one at `from` and
// before the first at `to` (from the start of the track if it never showed
// `from`), and the first sample at `to`.
function walkOf(track: AvatarSample[], from: string, to: string) {
  const arrived = track.findIndex((s) => tileKey(s) === to);
  const end = arrived < 0 ? track.length : arrived;
  let start = 0;
  for (let i = end - 1; i >= 0; i--) if (tileKey(track[i]) === from) { start = i + 1; break; }
  return { walking: track.slice(start, end), arrived: arrived < 0 ? undefined : track[arrived] };
}

// GYM-10.17: what a walk must show, whether the walk frames were drawn or cut (D1)
function expectAWalk(walking: AvatarSample[], what: string) {
  expect(walking.length, `${what}: a walk was seen`).toBeGreaterThan(0);
  const poses = new Set(walking.map((s) => s.pose));
  expect([...poses], `${what}: shows the walk, holding nothing`).toHaveLength(1);
  const pose = [...poses][0];
  expect(["walk", "stand"], `${what}: shows the walk, holding nothing`).toContain(pose);
  const tiles = tilesOf(walking);
  for (let i = 1; i < tiles.length; i++) expect(adjacent(tiles[i - 1], tiles[i]), `${what}: steps ${tiles[i - 1]} to ${tiles[i]}`).toBe(true);
  if (pose === "walk") {
    // one frame per tile, so both frames show whenever the walk crosses two
    // tiles or more; a walk turned back after one tile shows only one
    const frames = walking.filter((s) => s.frame === 1 || s.frame === 2);
    if (tiles.length >= 2) expect(new Set(frames.map((s) => s.frame)).size, `${what}: both walk frames show`).toBe(2);
    // one stride per tile: the frame changes with each tile stepped
    const swaps = frameSwaps(walking).length + 1;
    expect(Math.abs(swaps - (tiles.length - 1)), `${what}: ${swaps} frame changes over ${tiles.length - 1} tiles`).toBeLessThanOrEqual(2);
  } else {
    // the walk cut for time: the standing figure, without the bob
    expect(new Set(walking.map((s) => s.bob)).size, `${what}: no bob while walking`).toBe(1);
  }
}

// How long (ms) the machine's resting bar and the person disagree: bar shown
// with her on the machine, or hidden with her off it (GYM-10.13).
function barDisagreesMs(log: Sample[], id: string, slot: number, equipment: string, from = 0): number {
  const box = stationBox(log, slot);
  let on: boolean | undefined;
  let bar: boolean | null | undefined;
  let since = 0;
  let bad = 0;
  for (const s of log) {
    if (s.t < from) continue;
    const mine = (s.kind === "avatar" || s.kind === "gone") && s.id === id;
    const its = s.kind === "station" && s.slot === slot;
    if (!mine && !its) continue;
    if (on !== undefined && typeof bar === "boolean" && on === bar) bad += s.t - since;
    if (s.kind === "avatar") on = s.pose === equipment && within(s.av, box);
    if (s.kind === "gone") on = false;
    if (s.kind === "station") bar = s.bar;
    since = s.t;
  }
  return bad;
}

// the tag's gap above its station's tile, and how far off centre it is
function tagPlace(s: AvatarSample, station: Box) {
  return { gap: station[1] - s.tag![3], offCentre: (s.tag![0] + s.tag![2]) / 2 - (station[0] + station[2]) / 2 };
}

const effectiveOpacity = (el: Locator) =>
  el.evaluate((e) => {
    let o = 1;
    for (let n: Element | null = e; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return o;
  });

// the front parts drawn over a station's tile
const frontsOver = (page: Page, slot: number) =>
  page.evaluate((slot) => {
    const st = document.querySelector(`.map .station[data-slot="${slot}"]`)!.getBoundingClientRect();
    return [...document.querySelectorAll(".map .front")]
      .filter((f) => !f.closest("svg.av"))
      .map((f) => {
        const r = f.getBoundingClientRect();
        let o = 1;
        for (let n: Element | null = f; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
        return { box: [r.left, r.top, r.right, r.bottom] as Box, opacity: o, station: [st.left, st.top, st.right, st.bottom] as Box };
      })
      .filter((f) => f.box[0] < f.station[2] && f.box[2] > f.station[0] && f.box[1] < f.station[3] && f.box[3] > f.station[1]);
  }, slot);

// Samples, every frame for ms, whether the element on top at each point is
// inside `inside`; returns the misses.
const coveredDuring = (page: Page, inside: string, points: [number, number][], ms: number) =>
  page.evaluate(
    ({ inside, points, ms }) =>
      new Promise<string[]>((resolve) => {
        const misses: string[] = [];
        const end = performance.now() + ms;
        const tick = () => {
          const target = document.querySelector(inside);
          for (const [x, y] of points) {
            const hit = document.elementFromPoint(x, y);
            if (!target || !hit || !target.contains(hit)) misses.push(`${x},${y}: ${hit?.className ?? hit?.tagName}`);
          }
          if (performance.now() < end) requestAnimationFrame(tick);
          else resolve(misses);
        };
        tick();
      }),
    { inside, points, ms },
  );
const pointsIn = (b: { x: number; y: number; width: number; height: number }, inset = 3): [number, number][] => [
  [b.x + b.width / 2, b.y + b.height / 2],
  [b.x + inset, b.y + inset],
  [b.x + b.width - inset, b.y + inset],
  [b.x + inset, b.y + b.height - inset],
  [b.x + b.width - inset, b.y + b.height - inset],
];

// ======================================================================
// GYM-10: the exercise animations
// ======================================================================

// GYM-10.1 (browser), GYM-10.19 (until GYM-6: delivered equipment is there at once)
test("someone who chooses a lift plays its machine's animation on every screen once they reach it, and after a reload", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const [mia, tom] = people;
  const miaPage = await screen(mia, path);
  const tomPage = await screen(tom, path);

  // deadlift: the lifting platform isn't on the floor, so it's delivered to station 5
  await miaPage.selectOption("#exercise", "9");
  await miaPage.locator(".dock button").click();

  for (const page of [miaPage, tomPage]) {
    await onMachine(page, "Mia", "lifting-platform");
    const log = await samples(page);
    const track = trackOf(log, await idOf(page, "Mia"));
    const last = track.at(-1)!;
    expect(tileKey(last)).toBe(TILE[5].join(","));
    expect(last.cls).toContain("on-station");
    expect(within(last.av, stationBox(log, 5))).toBe(true);
    // she walked there from the lockers, and went straight on: no waiting
    expect(tilesOf(track)[0]).toBe(LOCKERS.join(","));
  }

  await tomPage.reload();
  await expect(tomPage.locator(".map-panel .conn .badge")).toHaveText("Live");
  const first = trackOf(await samples(tomPage), await idOf(tomPage, "Mia"))[0];
  expect(first.pose).toBe("lifting-platform");
  expect(tileKey(first)).toBe(TILE[5].join(","));
});

// GYM-10.2, GYM-10.3 to GYM-10.10 (each machine shows its own animation), GYM-10.13 (the bar only in her hands)
test("each of the eight machines plays two different drawings, 250 ms a frame on the treadmill and 400 ms on the rest", async ({ browser }) => {
  test.setTimeout(60_000);
  const names = MACHINES.map((_, i) => `P${i}`);
  const { path, people } = await room(browser, [...names, "Viewer"]);
  for (const [i, m] of MACHINES.entries()) await choose(people[i], path, m.exercise);
  const page = await screen(people[8], path);
  for (const [i, m] of MACHINES.entries()) await onMachine(page, `P${i}`, m.equipment);

  const ids = await Promise.all(names.map((n) => idOf(page, n)));
  await clearSamples(page);
  // at least five swaps each: 2 s on the slowest
  let probeLog: Sample[] = [];
  await expect
    .poll(async () => {
      probeLog = await samples(page);
      return Math.min(...ids.map((id) => frameSwaps(trackOf(probeLog, id)).length));
    }, { timeout: 5000, intervals: [250] })
    .toBeGreaterThanOrEqual(5);

  for (const [i, m] of MACHINES.entries()) {
    const track = trackOf(probeLog, ids[i]);
    const swaps = frameSwaps(track);
    expect(track.every((s) => s.frame === 1 || s.frame === 2), `${m.equipment}: one frame shows at a time`).toBe(true);
    expect(median(swaps), `${m.equipment}: ${swaps.join(", ")} ms between frames`).toBeGreaterThanOrEqual(m.ms - 30);
    expect(median(swaps), `${m.equipment}: ${swaps.join(", ")} ms between frames`).toBeLessThanOrEqual(m.ms + 30);
    expect(Math.min(...swaps), `${m.equipment}: no frame is cut short`).toBeGreaterThan(m.ms * 0.6);
    // two drawings, not one that moves
    const [one, two] = await avatar(page, `P${i}`).evaluate((a) =>
      [".frame-1", ".frame-2"].map((f) => a.querySelector(`svg.av ${f}`)!.innerHTML),
    );
    expect(one, `${m.equipment}: the frames differ`).not.toBe(two);
    expect(within(track.at(-1)!.av, stationBox(probeLog, m.slot)), `${m.equipment}: drawn on the station's tile`).toBe(true);
    if (WITH_BAR.includes(m.equipment)) expect(barOf(probeLog, m.slot), `${m.equipment}: its bar is in her hands, not on the rack`).toBe(false);
  }
});

// GYM-10.13
test("the bench's bar is in her hands only while she's on it, and back in its rack the moment she leaves", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const [mia, tom] = people;
  const page = await screen(tom, path);
  await expect(page.locator('.map .station[data-slot="2"] .bar')).toHaveCount(1);
  const start = Date.now();

  await choose(mia, path, "3");
  await onMachine(page, "Mia", "flat-bench");
  // Done: she walks to the cooler
  await logSet(mia, path, "3");
  await atTile(page, "Mia", COOLER);
  // back to the bench, then she leaves the room from it
  await post(mia, path, { action: "start", exercise_id: "3", weight_kg: "40", reps: "8" });
  await onMachine(page, "Mia", "flat-bench");
  const id = await idOf(page, "Mia");
  await post(mia, path, { action: "leave" });
  await expect(avatar(page, "Mia")).toHaveCount(0, { timeout: 5000 });
  await expect(page.locator('.map .station[data-slot="2"] .bar')).toBeVisible();

  const log = await samples(page);
  expect(log.some((s) => s.kind === "station" && s.slot === 2 && s.bar === false), "the bar left the rack while she lifted").toBe(true);
  expect(barDisagreesMs(log, id, 2, "flat-bench", start)).toBeLessThanOrEqual(50);
});

// GYM-10.16
test("Start set turns her Lifting at once, and her avatar walks from the cooler to her station and starts there", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const [mia, tom] = people;
  const miaPage = await screen(mia, path);
  const tomPage = await screen(tom, path);
  await miaPage.selectOption("#exercise", "7"); // dumbbell curl: station 4
  await miaPage.locator(".dock button").click();
  await miaPage.fill("#weight_kg", "12");
  await miaPage.locator(".dock button").click();
  await expect(miaPage.locator(".dock button")).toHaveText("Start set");
  await atTile(tomPage, "Mia", COOLER);
  await atTile(miaPage, "Mia", COOLER);
  await clearSamples(tomPage);

  await clearSamples(miaPage);
  await miaPage.locator(".dock button").click();
  // her own sheet at once: Done is there to tap before her avatar arrives
  await expect(miaPage.locator(".sheet .tab")).toContainText("Lifting", { timeout: 1000 });
  await expect(miaPage.locator(".dock button")).toHaveText("Done", { timeout: 1000 });
  await expect(miaPage.locator(".dock button")).toBeEnabled();
  const doneAt = Date.now();
  // everyone else within a second
  await expect(avatar(tomPage, "Mia").locator(".tag")).toHaveClass(/state-lifting/, { timeout: 1000 });
  await expect(tomPage.locator(".people li", { hasText: "Mia" })).toContainText("Lifting", { timeout: 1000 });

  for (const [who, page] of [["Tom's screen", tomPage], ["her own screen", miaPage]] as const) {
    await onMachine(page, "Mia", "dumbbell-rack");
    const track = trackOf(await samples(page), await idOf(page, "Mia"));
    const { walking, arrived } = walkOf(track, COOLER.join(","), TILE[4].join(","));
    expectAWalk(walking, `${who}: cooler to station 4`);
    expect(arrived?.pose, `${who}: the animation starts on arrival`).toBe("dumbbell-rack");
    if (page === miaPage) expect(arrived!.t, "Done was there before she arrived").toBeGreaterThan(doneAt);
  }
});

// GYM-10.17
test("a walk shows the walk and holds nothing, and the bottle only comes out at the cooler", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const [mia, tom] = people;
  await choose(mia, path, "3");
  const page = await screen(tom, path);
  await onMachine(page, "Mia", "flat-bench");
  await clearSamples(page);

  await logSet(mia, path, "3"); // Done: to the cooler
  await atTile(page, "Mia", COOLER);
  const track = trackOf(await samples(page), await idOf(page, "Mia"));
  const { walking, arrived } = walkOf(track, TILE[2].join(","), COOLER.join(","));
  expectAWalk(walking, "station 2 to the cooler");
  expect(arrived?.pose).toBe("rest");
  // 125 ms a tile
  const steps = intervals(walking, (s) => tileKey(s));
  expect(median(steps), `${steps.join(", ")} ms a tile`).toBeGreaterThanOrEqual(95);
  expect(median(steps), `${steps.join(", ")} ms a tile`).toBeLessThanOrEqual(155);
});

// GYM-10.18
test("choosing another lift mid-walk sends her to the new machine from where she is, never playing the old one", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const [mia, tom] = people;
  const page = await screen(tom, path);
  const mias = avatar(page, "Mia");

  await choose(mia, path, "3"); // the bench, station 2
  // she has left the lockers and is on her way up the middle aisle
  await expect
    .poll(() => mias.evaluate((a: HTMLElement) => Number(a.style.getPropertyValue("--y"))), { intervals: [20], timeout: 3000 })
    .toBeLessThanOrEqual(4);
  await choose(mia, path, "5"); // the squat rack, station 3
  await onMachine(page, "Mia", "squat-rack");

  const track = trackOf(await samples(page), await idOf(page, "Mia"));
  expect(track.map((s) => s.pose)).not.toContain("flat-bench");
  const tiles = tilesOf(track);
  expect(tiles).not.toContain(TILE[2].join(","));
  for (let i = 1; i < tiles.length; i++) expect(adjacent(tiles[i - 1], tiles[i]), `steps ${tiles[i - 1]} to ${tiles[i]}`).toBe(true);
  expect(tiles.at(-1)).toBe(TILE[3].join(","));
});

// GYM-10.18
test("tapping Done straight after Start set sends her back to the cooler without ever playing the machine", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const [mia, tom] = people;
  await logSet(mia, path, "7"); // a curl set: resting at the cooler, station 4 held
  const page = await screen(tom, path);
  const mias = avatar(page, "Mia");
  await expect(mias).toHaveAttribute("data-pose", "rest");

  await post(mia, path, { action: "start", exercise_id: "7", weight_kg: "40", reps: "8" });
  await expect
    .poll(() => mias.evaluate((a: HTMLElement) => `${Number(a.style.getPropertyValue("--x"))},${Number(a.style.getPropertyValue("--y"))}`), { intervals: [20], timeout: 3000 })
    .not.toBe(COOLER.join(","));
  await logSet(mia, path, "7");
  await expect(mias).toHaveAttribute("data-state", "resting", { timeout: 1000 });
  // back at the cooler
  await atTile(page, "Mia", COOLER);

  const track = trackOf(await samples(page), await idOf(page, "Mia"));
  expect(track.map((s) => s.pose)).not.toContain("dumbbell-rack");
  const tiles = tilesOf(track);
  expect(tiles).not.toContain(TILE[4].join(","));
  expect(tiles.at(-1)).toBe(COOLER.join(","));
  // out and back is one walk, holding nothing, from leaving the cooler to
  // getting back to it
  const left = track.findIndex((s) => tileKey(s) !== COOLER.join(","));
  const back = track.findIndex((s, i) => i > left && tileKey(s) === COOLER.join(","));
  expectAWalk(track.slice(left, back), "towards station 4 and back to the cooler");
});

// GYM-10.20
test("changing to another machine frees the bench at once; the other exercise on the same machine changes nothing on the map", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const [mia, tom] = people;
  await choose(mia, path, "3");
  const page = await screen(tom, path);
  await onMachine(page, "Mia", "flat-bench");
  const id = await idOf(page, "Mia");

  await choose(mia, path, "5"); // back squat: the squat rack, station 3
  // the bench shows unoccupied, its bar back, within a second
  await expect(page.locator('.map .station[data-slot="2"] .bar')).toBeVisible({ timeout: 1000 });
  await onMachine(page, "Mia", "squat-rack");
  let log = await samples(page);
  expect(tilesOf(trackOf(log, id)).at(-1)).toBe(TILE[3].join(","));
  expect(barOf(log, 3)).toBe(false);

  // overhead press: the same rack, the same station
  await clearSamples(page);
  await expect.poll(async () => frameSwaps(trackOf(await samples(page), id)).length, { timeout: 3000 }).toBeGreaterThanOrEqual(2);
  await choose(mia, path, "6");
  await expect(avatar(page, "Mia")).toHaveAttribute("aria-label", "Mia, lifting, overhead press on squat rack 3", { timeout: 1000 });
  await expect.poll(async () => frameSwaps(trackOf(await samples(page), id)).length, { timeout: 3000 }).toBeGreaterThanOrEqual(6);
  log = await samples(page);
  const track = trackOf(log, id);
  expect(new Set(track.map(tileKey))).toEqual(new Set([TILE[3].join(",")]));
  expect(new Set(track.map((s) => s.pose))).toEqual(new Set(["squat-rack"]));
  // nothing restarts: the frames keep their 400 ms beat through the change
  const swaps = frameSwaps(track);
  for (const gap of swaps) expect(gap, `${swaps.join(", ")} ms between frames`).toBeGreaterThanOrEqual(340);
  for (const gap of swaps) expect(gap, `${swaps.join(", ")} ms between frames`).toBeLessThanOrEqual(460);
});

// GYM-10.21 (browser)
test("opening, reloading or reconnecting draws everyone in place straight away, with no walk replayed", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom", "Ji-woo"]);
  const [mia, tom, jiwoo] = people;
  await choose(mia, path, "3");
  await logSet(jiwoo, path, "7"); // Ji-woo resting at the cooler

  const page = await screen(tom, path);
  for (const load of ["open", "reload"]) {
    if (load === "reload") {
      await page.reload();
      await expect(page.locator(".map-panel .conn .badge")).toHaveText("Live");
    }
    // nobody moves in the first second
    await page.waitForTimeout(1000);
    const log = await samples(page);
    const mias = trackOf(log, await idOf(page, "Mia"));
    const jiwoos = trackOf(log, await idOf(page, "Ji-woo"));
    expect(mias[0], `${load}: Mia on the bench from the first frame`).toMatchObject({ pose: "flat-bench", x: TILE[2][0], y: TILE[2][1] });
    expect(jiwoos[0], `${load}: Ji-woo at the cooler from the first frame`).toMatchObject({ pose: "rest", x: COOLER[0], y: COOLER[1] });
    expect(tilesOf(mias), `${load}: Mia doesn't walk`).toHaveLength(1);
    expect(tilesOf(jiwoos), `${load}: Ji-woo doesn't walk`).toHaveLength(1);
  }

  // a screen whose stream is down while Mia logs a set
  const late = await tom.newPage();
  await late.addInitScript(probe);
  await late.route("**/events", (route) => route.abort());
  await late.goto(path);
  await expect(avatar(late, "Mia")).toHaveAttribute("data-pose", "flat-bench");
  await logSet(mia, path, "3");
  // the badge says Live from the first render, so wait for the stream itself
  const reconnected = late.waitForResponse((r) => new URL(r.url()).pathname === `${path}/events` && r.status() === 200, { timeout: 10_000 });
  await late.unroute("**/events");
  await reconnected;
  await atTile(late, "Mia", COOLER, 2000);
  await expect(avatar(late, "Mia")).toHaveAttribute("data-pose", "rest");
  const tiles = tilesOf(trackOf(await samples(late), await idOf(late, "Mia")));
  expect(tiles[0]).toBe(TILE[2].join(","));
  expect(tiles, "on reconnect she is placed at the cooler, not walked there").toHaveLength(2);
});

// GYM-10.22. Staying put is the behaviour, so it watches for 1.5 s.
test("a cardio Done keeps her running on the treadmill, with no walk to the cooler", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const [mia, tom] = people;
  await choose(mia, path, "1");
  const page = await screen(tom, path);
  await onMachine(page, "Mia", "treadmill");
  await clearSamples(page);

  await post(mia, path, { exercise_id: "1", distance_km: "1", minutes: "5", seconds: "0" });
  await page.waitForTimeout(1500);
  const track = trackOf(await samples(page), await idOf(page, "Mia"));
  expect(new Set(track.map(tileKey))).toEqual(new Set([TILE[1].join(",")]));
  expect(new Set(track.map((s) => s.pose))).toEqual(new Set(["treadmill"]));
  expect(new Set(track.map((s) => s.state))).toEqual(new Set(["lifting"]));
  expect(frameSwaps(track).length, "still running").toBeGreaterThanOrEqual(3);
});

// GYM-10.23
test("with reduced motion every animation holds its still frame, nobody bobs or walks, and states still read", async ({ browser }) => {
  test.setTimeout(60_000);
  const names = MACHINES.map((_, i) => `P${i}`);
  const { path, people } = await room(browser, [...names, "Rester", "Viewer"]);
  for (const [i, m] of MACHINES.entries()) await choose(people[i], path, m.exercise);
  await logSet(people[8], path, "8"); // a lateral raise set: resting at the cooler
  const page = await screen(people[9], path, { reduced: true });
  for (const [i, m] of MACHINES.entries()) await onMachine(page, `P${i}`, m.equipment);
  await clearSamples(page);
  // 1.2 s: three frames at 400 ms, five at 250
  await page.waitForTimeout(1200);
  const log = await samples(page);

  for (const [i, m] of MACHINES.entries()) {
    const track = trackOf(log, await idOf(page, `P${i}`));
    expect(new Set(track.map((s) => s.frame)), `${m.equipment}: only the still frame`).toEqual(new Set([1]));
  }
  for (const name of ["Rester", "Viewer"]) {
    const track = trackOf(log, await idOf(page, name));
    expect(new Set(track.map((s) => s.bob)), `${name} doesn't bob`).toEqual(new Set([0]));
  }
  // nothing on the map runs a CSS animation: no machine part moves either
  const running = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.playState === "running")
      .map((a) => (a.effect as KeyframeEffect | null)?.target as Element | null)
      .filter((t) => t?.closest(".map .station, .map .avatar"))
      .map((t) => t!.outerHTML.slice(0, 80)),
  );
  expect(running).toEqual([]);

  // a change of state jumps, without a walk
  await clearSamples(page);
  await logSet(people[1], path, "3"); // P1 off the bench to the cooler
  await atTile(page, "P1", COOLER, 2000);
  await expect(avatar(page, "P1")).toHaveAttribute("data-pose", "rest");
  const tiles = tilesOf(trackOf(await samples(page), await idOf(page, "P1")));
  // P1 joined before Rester, so P1 takes the first rest spot
  expect(tiles).toEqual([TILE[2].join(","), COOLER.join(",")]);
  // and the state still reads from the name, the tag and the list
  await expect(avatar(page, "P1")).toHaveAttribute("aria-label", "P1, resting, flat bench 2");
  await expect(avatar(page, "P1").locator(".tag")).toHaveClass(/state-resting/);
  await expect(page.locator(".people li", { hasText: "P1" })).toContainText("Resting");
});

// GYM-10.24 (browser part: the dock is never covered)
test("with twelve avatars animating on a phone, nothing on the map covers the dock", async ({ browser }) => {
  test.setTimeout(60_000);
  const lifts = ["1", "3", "5", "7", "9", "11", "13", "15", "4", "6", "8", "2"];
  const names = lifts.map((_, i) => `P${i}`);
  const { path, people } = await room(browser, names);
  for (const [i, ex] of lifts.entries()) await choose(people[i], path, ex);
  // P11 chose an incline walk; where Choose's redirect lands, so the sheet has its fields
  const page = await screen(people[11], `${path}?exercise=2`);
  await onMachine(page, "P11", "treadmill");
  await onMachine(page, "P10", "dumbbell-rack");
  // shorten the screen until the dock sits over the bottom row of stations
  const mapTop = (await page.locator(".map-panel .map").boundingBox())!.y;
  const dockHeight = (await page.locator(".dock").boundingBox())!.height;
  await page.setViewportSize({ width: 390, height: Math.round(mapTop + 5.5 * 32 + dockHeight) });
  await expect(page.locator(".map-panel .map")).toHaveCSS("width", "320px");
  const dock = (await page.locator(".dock button").boundingBox())!;
  expect(await coveredDuring(page, ".dock", pointsIn(dock, 6), 1500)).toEqual([]);
  // and Done answers
  await page.fill("#distance_km", "1");
  await page.fill("#minutes", "5");
  await page.locator(".dock button").click();
  await expect(page.locator(".dock .stamp")).toContainText("Set 1 logged", { timeout: 2000 });
});

// ======================================================================
// GYM-9: the other states
// ======================================================================

// GYM-9.1
test("Idle and Finished stand by the lockers with a 2-pixel bob at 400 ms, told apart only by the tag", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom", "Ji-woo"]);
  const [, tom, jiwoo] = people;
  await logSet(tom, path, "3");
  await post(tom, path, { action: "finish" });
  const page = await screen(jiwoo, path);
  await clearSamples(page);
  await expect.poll(async () => bobSwaps(trackOf(await samples(page), await idOf(page, "Tom"))).length, { timeout: 4000 }).toBeGreaterThanOrEqual(4);
  const log = await samples(page);
  for (const [name, state] of [["Mia", "idle"], ["Tom", "finished"]]) {
    const track = trackOf(log, await idOf(page, name));
    expect(IDLE_SPOTS, `${name} by the lockers`).toContain(tileKey(track.at(-1)!));
    expect(new Set(track.map((s) => s.pose)), `${name} standing`).toEqual(new Set(["stand"]));
    expect(new Set(track.map((s) => s.bob)), `${name} bobs 2 sprite pixels`).toEqual(new Set([0, 2]));
    const swaps = bobSwaps(track);
    expect(median(swaps), `${name}: ${swaps.join(", ")} ms`).toBeGreaterThanOrEqual(370);
    expect(median(swaps), `${name}: ${swaps.join(", ")} ms`).toBeLessThanOrEqual(430);
    await expect(avatar(page, name).locator(".tag")).toHaveClass(new RegExp(`state-${state}`));
  }
});

// GYM-9.2
test("someone Resting stands at the cooler with the bottle and the same bob", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const [mia, tom] = people;
  await logSet(mia, path, "5");
  const page = await screen(tom, path);
  const id = await idOf(page, "Mia");
  await clearSamples(page);
  await expect.poll(async () => bobSwaps(trackOf(await samples(page), id)).length, { timeout: 4000 }).toBeGreaterThanOrEqual(4);
  const track = trackOf(await samples(page), id);
  expect(tileKey(track.at(-1)!)).toBe(COOLER.join(","));
  expect(new Set(track.map((s) => s.pose))).toEqual(new Set(["rest"]));
  expect(new Set(track.map((s) => s.bob))).toEqual(new Set([0, 2]));
  const swaps = bobSwaps(track);
  expect(median(swaps)).toBeGreaterThanOrEqual(370);
  expect(median(swaps)).toBeLessThanOrEqual(430);
});

// GYM-9.3
test("a station held from the cooler shows unoccupied, bar in place, and still marked as hers on her screen", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia"]);
  const [mia] = people;
  await choose(mia, path, "5");
  // where Choose's redirect lands, so the sheet has the set's fields
  const page = await screen(mia, `${path}?exercise=5`);
  await onMachine(page, "Mia", "squat-rack");
  await expect(page.locator('.map .station[data-slot="3"] .bar')).toBeHidden();

  await page.fill("#weight_kg", "80");
  await page.locator(".dock button").click(); // Done
  await atTile(page, "Mia", COOLER);
  await expect(avatar(page, "Mia")).toHaveAttribute("data-pose", "rest");
  const station = page.locator('.map .station[data-slot="3"]');
  await expect(station).toHaveClass(/mine/);
  await expect(station.locator(".bar")).toBeVisible();
  const log = await samples(page);
  const box = stationBox(log, 3);
  const onIt = log.filter((s): s is AvatarSample => s.kind === "avatar").filter((s) => s === trackOf(log, s.id).at(-1) && within(s.av, box));
  expect(onIt, "nobody is drawn on the rack").toEqual([]);
});

// ======================================================================
// GYM-11: Slacking (and GYM-11.4: Lifting never turns Slacking)
// ======================================================================

// GYM-11.1, GYM-11.2, GYM-11.3, GYM-11.4 (browser), GYM-15.5 (Slacking).
// One room for all of them, since each needs a rest to run 30 s over, and the
// shortest rest is 15 s: the test takes about 55 s.
test("a rest that runs over walks her to her machine to sit with a glowing phone, and Start set puts her straight on it", async ({ browser }) => {
  test.setTimeout(120_000);
  const { path, people } = await room(browser, ["Mia", "Tom", "Ji-woo", "Priya"]);
  const [mia, tom, jiwoo, priya] = people;
  await choose(tom, path, "5"); // Tom lifting on the squat rack, station 3
  const tomPage = await screen(tom, path);
  const priyaPage = await screen(priya, path, { reduced: true });
  await onMachine(tomPage, "Tom", "squat-rack");

  // Mia's bench rest ends in 15 s, so she turns Slacking 45 s from now
  const slackPoint = await logSetWithShortRest(mia, path, "3", 150);
  // Ji-woo's rest is as short, but she starts her next set straight away
  const jiwooSlackPoint = await logSetWithShortRest(jiwoo, path, "13", 90);
  await post(jiwoo, path, { action: "start", exercise_id: "13", weight_kg: "40", reps: "8" });
  await onMachine(tomPage, "Ji-woo", "cable-machine");
  const jiwooId = await idOf(tomPage, "Ji-woo");
  const id = await idOf(tomPage, "Mia");

  await expect(avatar(tomPage, "Mia")).toHaveAttribute("data-state", "slacking", { timeout: 50_000 });
  await expect(avatar(tomPage, "Mia")).toHaveAttribute("data-pose", "sit", { timeout: 5000 });
  await expect(avatar(priyaPage, "Mia")).toHaveAttribute("data-pose", "sit", { timeout: 2000 });
  // let the glow swap a few times
  await expect.poll(async () => intervals(trackOf(await samples(tomPage), id), (s) => (s.pose === "sit" ? s.glow ?? undefined : undefined)).length, { timeout: 4000 }).toBeGreaterThanOrEqual(3);
  const log = await samples(tomPage);
  const track = trackOf(log, id);

  await test.step("GYM-11.1: within a second she walks from the cooler and sits in front of her machine, bar in place", async () => {
    const turned = track.find((s) => s.state === "slacking")!.t - slackPoint;
    expect.soft(turned, "ms after her slack point").toBeLessThanOrEqual(1000);
    expect.soft(await avatar(tomPage, "Mia").locator(".tag").getAttribute("class")).toMatch(/state-slacking/);
    const { walking, arrived } = walkOf(track, COOLER.join(","), TILE[2].join(","));
    expectAWalk(walking, "cooler to station 2");
    expect.soft(arrived?.pose).toBe("sit");
    const sitting = track.at(-1)!;
    expect.soft(sitting.cls).toContain("on-station");
    const box = stationBox(log, 2);
    expect.soft(sitting.av![3], "in front of the bench: her feet in the aisle").toBeGreaterThan(box[3] + 4);
    expect.soft(barOf(log, 2), "the bench's bar is in place behind her").toBe(true);
  });

  await test.step("GYM-15.5: her tag sits where a lifter's does", async () => {
    const hers = tagPlace(track.at(-1)!, stationBox(log, 2));
    const toms = tagPlace(trackOf(log, await idOf(tomPage, "Tom")).at(-1)!, stationBox(log, 3));
    expect.soft(Math.abs(hers.offCentre)).toBeLessThanOrEqual(1);
    expect.soft(Math.abs(hers.gap - toms.gap)).toBeLessThanOrEqual(0.5);
  });

  await test.step("GYM-11.2: she doesn't bob, and her phone glows and dims at 400 ms; still lit under reduced motion", async () => {
    const sitting = track.filter((s) => s.pose === "sit");
    expect.soft(new Set(sitting.map((s) => s.bob)).size, "no bob").toBeLessThanOrEqual(1);
    const glows = intervals(sitting, (s) => s.glow ?? undefined);
    expect.soft(median(glows), `${glows.join(", ")} ms`).toBeGreaterThanOrEqual(370);
    expect.soft(median(glows), `${glows.join(", ")} ms`).toBeLessThanOrEqual(430);
    const fills = [...new Set(sitting.map((s) => s.glow!))];
    expect.soft(fills).toHaveLength(2);
    const still = trackOf(await samples(priyaPage), await idOf(priyaPage, "Mia")).filter((s) => s.pose === "sit");
    const stillFills = [...new Set(still.map((s) => s.glow))];
    expect.soft(stillFills, "reduced motion: the glow doesn't change").toHaveLength(1);
    const lum = (c: string) => c.match(/\d+/g)!.slice(0, 3).map(Number).reduce((a, b) => a + b, 0);
    const lit = fills.sort((a, b) => lum(b) - lum(a))[0];
    expect.soft(stillFills[0], "reduced motion: the glow stays on").toBe(lit);
    // and Priya saw her placed at her station from the cooler, not walked there
    expect.soft(tilesOf(trackOf(await samples(priyaPage), await idOf(priyaPage, "Mia"))).slice(-2)).toEqual([COOLER.join(","), TILE[2].join(",")]);
  });

  await test.step("GYM-11.4: Ji-woo, Lifting past her old slack point, stays Lifting on her machine", async () => {
    const hers = trackOf(log, jiwooId).filter((s) => s.t >= jiwooSlackPoint);
    expect.soft(hers.length).toBeGreaterThan(0);
    expect.soft(new Set(hers.map((s) => s.state))).toEqual(new Set(["lifting"]));
    expect.soft(new Set(hers.map((s) => s.pose))).toEqual(new Set(["cable-machine"]));
  });

  await test.step("GYM-11.3: Start set puts her on the machine with no walk", async () => {
    await clearSamples(tomPage);
    const at = Date.now();
    await post(mia, path, { action: "start", exercise_id: "3", weight_kg: "40", reps: "8" });
    await expect(avatar(tomPage, "Mia")).toHaveAttribute("data-pose", "flat-bench", { timeout: 1500 });
    const after = await samples(tomPage);
    const hers = trackOf(after, id);
    expect.soft(new Set(hers.map(tileKey)), "she doesn't leave her station").toEqual(new Set([TILE[2].join(",")]));
    const on = hers.find((s) => s.pose === "flat-bench")!;
    expect.soft(on.t - at, "ms to get on").toBeLessThanOrEqual(1000);
    expect.soft(within(on.av, stationBox(after, 2))).toBe(true);
    expect.soft(barOf(after, 2), "the bar is in her hands").toBe(false);
  });
});

// ======================================================================
// GYM-14: Away
// ======================================================================

// GYM-14.1, GYM-14.2, GYM-14.3. Away comes 60 s after someone was last
// seen, so the test waits that out once: about 65 s.
test("someone Away stays in place, faded, still moving, and comes back without a replay", async ({ browser }) => {
  test.setTimeout(100_000);
  const { path, people } = await room(browser, ["Mia", "Tom", "Ji-woo"]);
  const [mia, tom, jiwoo] = people;
  await choose(mia, path, "5"); // the squat rack: it has front parts
  await logSet(jiwoo, path, "7"); // a curl set: resting for 60 s, Slacking from 90 s
  const lastSeen = Date.now();
  const page = await screen(tom, path);
  // time is the behaviour: Away is decided by the server 60 s after their last visit
  await page.waitForTimeout(Math.max(0, lastSeen + 61_000 - Date.now()));
  await page.reload();
  await expect(page.locator(".map-panel .conn .badge")).toHaveText("Live");
  const mias = avatar(page, "Mia");
  const jiwoos = avatar(page, "Ji-woo");
  await expect(mias).toHaveClass(/away/);
  await expect(jiwoos).toHaveClass(/away/);
  const id = await idOf(page, "Mia");
  const jiwooId = await idOf(page, "Ji-woo");
  await expect.poll(async () => Math.min(frameSwaps(trackOf(await samples(page), id)).length, bobSwaps(trackOf(await samples(page), jiwooId)).length), { timeout: 4000 }).toBeGreaterThanOrEqual(3);
  const log = await samples(page);

  await test.step("GYM-14.1: Lifting and Away, she keeps playing on her machine, faded; the machine's front parts are not", async () => {
    const track = trackOf(log, id);
    expect.soft(new Set(track.map((s) => s.pose))).toEqual(new Set(["squat-rack"]));
    expect.soft(within(track.at(-1)!.av, stationBox(log, 3))).toBe(true);
    expect.soft(await effectiveOpacity(mias.locator("svg.av"))).toBeCloseTo(0.5, 1);
    const fronts = await frontsOver(page, 3);
    expect.soft(fronts.length, "the rack has front parts over her").toBeGreaterThan(0);
    for (const f of fronts) expect.soft(f.opacity, "front parts aren't faded").toBe(1);
    expect.soft(await mias.locator(".tag svg").count(), "the phone-off icon on her tag").toBeGreaterThan(0);
    await expect.soft(page.locator(".people li", { hasText: "Mia" })).toContainText("Away");
  });

  await test.step("GYM-14.2: Resting and Away, she stays at the cooler with the bottle and the bob, faded", async () => {
    const track = trackOf(log, jiwooId);
    expect.soft(tileKey(track.at(-1)!)).toBe(COOLER.join(","));
    expect.soft(new Set(track.map((s) => s.pose))).toEqual(new Set(["rest"]));
    expect.soft(new Set(track.map((s) => s.bob))).toEqual(new Set([0, 2]));
    expect.soft(await effectiveOpacity(jiwoos.locator("svg.av"))).toBeCloseTo(0.5, 1);
  });

  await test.step("GYM-14.3: back, she is drawn unfaded where she is, with nothing replayed", async () => {
    await clearSamples(page);
    const back = await mia.newPage();
    await back.goto(path);
    await expect(mias).not.toHaveClass(/away/, { timeout: 2000 });
    await expect.poll(async () => frameSwaps(trackOf(await samples(page), id)).length, { timeout: 3000 }).toBeGreaterThanOrEqual(2);
    const track = trackOf(await samples(page), id);
    expect.soft(new Set(track.map(tileKey))).toEqual(new Set([TILE[3].join(",")]));
    expect.soft(new Set(track.map((s) => s.pose))).toEqual(new Set(["squat-rack"]));
    expect.soft(await effectiveOpacity(mias.locator("svg.av"))).toBe(1);
  });
});

// ======================================================================
// GYM-15: accessibility, tags and tapping
// ======================================================================

// GYM-15.1 (browser)
test("an avatar's name stays the same through the walk and the animation, and nothing on the map is announced", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const [mia, tom] = people;
  const page = await screen(tom, path);
  await choose(mia, path, "3");
  await onMachine(page, "Mia", "flat-bench");
  await expect.poll(async () => frameSwaps(trackOf(await samples(page), await idOf(page, "Mia"))).length, { timeout: 3000 }).toBeGreaterThanOrEqual(2);
  const track = trackOf(await samples(page), await idOf(page, "Mia"));
  const labels = new Set(track.filter((s) => s.state === "lifting").map((s) => s.label));
  expect(labels).toEqual(new Set(["Mia, lifting, bench press on flat bench 2"]));
  const loud = await page.evaluate(() =>
    [...document.querySelectorAll(".map [aria-live], .map [role=status], .map [role=alert], .map [role=log]")].map((e) => e.outerHTML.slice(0, 80)),
  );
  expect(loud).toEqual([]);
  // every drawing inside an avatar is hidden from assistive technology
  const exposed = await avatar(page, "Mia").evaluate((a) =>
    [...a.querySelectorAll("svg")].filter((s) => !s.closest('[aria-hidden="true"]')).length,
  );
  expect(exposed).toBe(0);
  // the map's whole accessibility tree, mid-animation: the poster and the two
  // avatars, by name, and nothing a frame, a front part or a machine adds
  await expect(page.locator(".map")).toMatchAriaSnapshot(`
    - button "Call Dony out of his poster"
    - button "Mia, lifting, bench press on flat bench 2"
    - button "Tom (you), idle, no station yet"
  `);
});

// GYM-15.3
test("tapping anywhere on someone on a machine, front parts included, selects them, with a 44 px hit area at 1x and 2x", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const [mia, tom] = people;
  await choose(mia, path, "5"); // the squat rack, station 3: uprights in front of her
  const page = await screen(tom, path);
  const mias = avatar(page, "Mia");
  for (const [scale, viewport] of [[1, { width: 390, height: 844 }], [2, { width: 1280, height: 900 }]] as const) {
    await page.setViewportSize(viewport);
    await expect(page.locator(".map-panel .map")).toHaveCSS("width", `${320 * scale}px`);
    await onMachine(page, "Mia", "squat-rack");
    const hit = (await mias.boundingBox())!;
    expect(hit.width, `${scale}x hit width`).toBeGreaterThanOrEqual(44);
    expect(hit.height, `${scale}x hit height`).toBeGreaterThanOrEqual(44);

    const station = (await page.locator('.map .station[data-slot="3"]').boundingBox())!;
    const fronts = await frontsOver(page, 3);
    expect(fronts.length, `${scale}x: the rack's front parts over her`).toBeGreaterThan(0);
    const points: [string, number, number][] = [
      ["the middle of her tile", station.x + station.width / 2, station.y + station.height / 2],
      ["her tag", ...((b) => [b.x + b.width / 2, b.y + b.height / 2] as [number, number])((await mias.locator(".tag").boundingBox())!)],
      ...fronts.map((f, i): [string, number, number] => {
        const l = Math.max(f.box[0], f.station[0]), r = Math.min(f.box[2], f.station[2]);
        const t = Math.max(f.box[1], f.station[1]), b = Math.min(f.box[3], f.station[3]);
        return [`front part ${i + 1}`, (l + r) / 2, (t + b) / 2];
      }),
    ];
    for (const [where, x, y] of points) {
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await page.mouse.click(x, y);
      await expect(mias, `${scale}x: a tap on ${where} selects her`).toBeFocused();
    }
  }
});

// GYM-15.4
test("tabbing to someone on a machine shows the whole focus ring over the machine, in today's tab order", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom", "Priya"]);
  const [mia, tom, priya] = people;
  await choose(mia, path, "5"); // the squat rack, station 3
  await choose(tom, path, "7"); // the dumbbell rack next to it, station 4
  const page = await screen(priya, path);
  await onMachine(page, "Mia", "squat-rack");
  await onMachine(page, "Tom", "dumbbell-rack");

  await page.locator(".map .poster").focus();
  const order: string[] = [];
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Tab");
    order.push((await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))) ?? "");
  }
  expect(order).toEqual(["Mia, lifting, back squat on squat rack 3", "Tom, lifting, dumbbell curl on dumbbell rack 4", "Priya (you), idle, no station yet"]);

  for (const name of ["Mia", "Tom"]) {
    const who = avatar(page, name);
    await page.locator(".map .poster").focus();
    for (let i = 0; i < (name === "Mia" ? 1 : 2); i++) await page.keyboard.press("Tab");
    await expect(who).toBeFocused();
    const sides = await ringCoverage(page, who);
    for (const [side, share] of Object.entries(sides)) expect(share, `${name}: the ring's ${side} side shows`).toBeGreaterThanOrEqual(0.9);
  }
});

// The share of each side of an element's focus ring that shows in the
// Night focus colour (--focus, #f2c94c), at the best offset 1 to 8 px out.
async function ringCoverage(page: Page, el: Locator): Promise<Record<string, number>> {
  const b = (await el.boundingBox())!;
  const pad = 10;
  const clip = { x: Math.floor(b.x - pad), y: Math.floor(b.y - pad), width: Math.ceil(b.width + 2 * pad), height: Math.ceil(b.height + 2 * pad) };
  const png = (await page.screenshot({ clip })).toString("base64");
  return page.evaluate(
    async ({ png, inner }) => {
      const img = await createImageBitmap(await (await fetch(`data:image/png;base64,${png}`)).blob());
      const canvas = new OffscreenCanvas(img.width, img.height);
      const g = canvas.getContext("2d")!;
      g.drawImage(img, 0, 0);
      const px = g.getImageData(0, 0, img.width, img.height).data;
      const yellow = (x: number, y: number) => {
        const i = (y * img.width + x) * 4;
        return Math.abs(px[i] - 242) < 40 && Math.abs(px[i + 1] - 201) < 40 && Math.abs(px[i + 2] - 76) < 50;
      };
      const share = (line: (d: number) => [number, number][]) => {
        let best = 0;
        for (let d = 1; d <= 8; d++) {
          const pts = line(d).filter(([x, y]) => x >= 0 && y >= 0 && x < img.width && y < img.height);
          best = Math.max(best, pts.filter(([x, y]) => yellow(x, y)).length / Math.max(1, pts.length));
        }
        return best;
      };
      const { l, t, r, b } = inner;
      const xs = Array.from({ length: r - l }, (_, i) => l + i);
      const ys = Array.from({ length: b - t }, (_, i) => t + i);
      return {
        top: share((d) => xs.map((x) => [x, t - d])),
        bottom: share((d) => xs.map((x) => [x, b - 1 + d])),
        left: share((d) => ys.map((y) => [l - d, y])),
        right: share((d) => ys.map((y) => [r - 1 + d, y])),
      };
    },
    { png, inner: { l: Math.round(b.x - clip.x), t: Math.round(b.y - clip.y), r: Math.round(b.x + b.width - clip.x), b: Math.round(b.y + b.height - clip.y) } },
  );
}

// GYM-15.5 (browser)
test("tags sit just above the station, centred, in the same place on all eight machines, still, and never drawn over", async ({ browser }) => {
  test.setTimeout(60_000);
  const names = MACHINES.map((_, i) => `P${i}`);
  const { path, people } = await room(browser, [...names, "Viewer"]);
  for (const [i, m] of MACHINES.entries()) await choose(people[i], path, m.exercise);
  const page = await screen(people[8], path);
  for (const [i, m] of MACHINES.entries()) await onMachine(page, `P${i}`, m.equipment);
  await clearSamples(page);
  await page.waitForTimeout(1000); // both frames on every machine, at least twice
  const log = await samples(page);

  const gaps: number[] = [];
  for (const [i, m] of MACHINES.entries()) {
    const track = trackOf(log, await idOf(page, `P${i}`));
    const places = new Set(track.map((s) => JSON.stringify(s.tag)));
    expect(places.size, `${m.equipment}: the tag never moves`).toBe(1);
    const { gap, offCentre } = tagPlace(track.at(-1)!, stationBox(log, m.slot));
    expect(Math.abs(offCentre), `${m.equipment}: centred`).toBeLessThanOrEqual(1);
    expect(gap, `${m.equipment}: just above the tile`).toBeGreaterThanOrEqual(-1);
    expect(gap, `${m.equipment}: just above the tile`).toBeLessThanOrEqual(8);
    gaps.push(gap);
    const tag = (await avatar(page, `P${i}`).locator(".tag").boundingBox())!;
    expect(await coveredDuring(page, `.map .avatar[data-id="${await idOf(page, `P${i}`)}"] .tag`, pointsIn(tag), 300), `${m.equipment}: nothing over the tag`).toEqual([]);
  }
  expect(Math.max(...gaps) - Math.min(...gaps), "the same place on every machine").toBeLessThanOrEqual(0.5);

  // P1 leaves the bench for the cooler, walking past P5's tag (station 6) in the aisle
  const p5 = await idOf(page, "P5");
  const tag = (await avatar(page, "P5").locator(".tag").boundingBox())!;
  const watching = coveredDuring(page, `.map .avatar[data-id="${p5}"] .tag`, pointsIn(tag), 2500);
  await logSet(people[1], path, "3");
  expect(await watching, "a walker never draws over a tag").toEqual([]);
});

// GYM-15.7
test("resizing between 2x and 1x keeps the animation going, the person on the machine and the front parts in line", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const [mia, tom] = people;
  await choose(mia, path, "5");
  const page = await screen(tom, path, { viewport: { width: 1280, height: 900 } });
  const id = await idOf(page, "Mia");
  const measure = async (scale: number) => {
    await expect(page.locator(".map-panel .map")).toHaveCSS("width", `${320 * scale}px`);
    await onMachine(page, "Mia", "squat-rack");
    await clearSamples(page);
    await expect.poll(async () => frameSwaps(trackOf(await samples(page), id)).length, { timeout: 3000 }).toBeGreaterThanOrEqual(3);
    const log = await samples(page);
    const track = trackOf(log, id);
    const box = stationBox(log, 3);
    const av = track.at(-1)!.av!;
    expect(within(av, box), `${scale}x: on the machine`).toBe(true);
    expect(av[2] - av[0], `${scale}x: square pixels`).toBeCloseTo(av[3] - av[1], 0);
    expect(av[2] - av[0], `${scale}x: drawn at ${scale}x`).toBeCloseTo(32 * scale, 0);
    const swaps = frameSwaps(track);
    expect(median(swaps), `${scale}x: still 400 ms`).toBeGreaterThanOrEqual(370);
    expect(median(swaps), `${scale}x: still 400 ms`).toBeLessThanOrEqual(430);
    const fronts = await frontsOver(page, 3);
    expect(fronts.length, `${scale}x: front parts over her`).toBeGreaterThan(0);
    const size = box[2] - box[0];
    return fronts.map((f) => f.box.map((v, i) => (v - box[i % 2]) / size));
  };
  const big = await measure(2);
  await page.setViewportSize({ width: 390, height: 844 });
  const small = await measure(1);
  expect(small.length).toBe(big.length);
  for (const [i, f] of small.entries()) for (const [j, v] of f.entries()) expect(v, "front parts line up at both scales").toBeCloseTo(big[i][j], 1);
});

// ======================================================================
// BOT-2: Dony
// ======================================================================

// BOT-2.1
test("Dony on a machine plays its animation as a person would: pose, timing, still frame and tag place", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom", "Ji-woo"]);
  const [mia, tom, jiwoo] = people;
  // only the dumbbell rack is left free, so that's where he lifts
  await choose(mia, path, "1");
  await choose(tom, path, "3");
  await choose(jiwoo, path, "5");
  const page = await screen(tom, path);
  const still = await screen(jiwoo, path, { reduced: true });
  await post(mia, path, { action: "dony", intent: "summon" });
  const dony = page.locator('.map .avatar[data-look="dony"]');
  await expect(dony).toHaveAttribute("data-pose", "dumbbell-rack", { timeout: 10_000 });
  await expect(still.locator('.map .avatar[data-look="dony"]')).toHaveAttribute("data-pose", "dumbbell-rack", { timeout: 2000 });
  const id = (await dony.getAttribute("data-id"))!;
  await clearSamples(page);
  await clearSamples(still);
  await expect.poll(async () => frameSwaps(trackOf(await samples(page), id)).length, { timeout: 4000 }).toBeGreaterThanOrEqual(4);
  const log = await samples(page);
  const track = trackOf(log, id);

  const swaps = frameSwaps(track);
  expect(median(swaps), `${swaps.join(", ")} ms`).toBeGreaterThanOrEqual(370);
  expect(median(swaps), `${swaps.join(", ")} ms`).toBeLessThanOrEqual(430);
  expect(within(track.at(-1)!.av, stationBox(log, 4))).toBe(true);
  const his = tagPlace(track.at(-1)!, stationBox(log, 4));
  const toms = tagPlace(trackOf(log, await idOf(page, "Tom")).at(-1)!, stationBox(log, 2));
  expect(Math.abs(his.offCentre)).toBeLessThanOrEqual(1);
  expect(Math.abs(his.gap - toms.gap), "his tag sits where a person's does").toBeLessThanOrEqual(0.5);
  expect(new Set(trackOf(await samples(still), id).map((s) => s.frame)), "reduced motion: his still frame").toEqual(new Set([1]));
});

// BOT-2.2, BOT-2.3
test("Dony hops out in his own frame, walks like anyone, stands with the same bob, and walks back to hop in", async ({ browser }) => {
  // the four machines on the floor are all held, so he can't lift: he stays Idle
  const { path, people } = await room(browser, ["Mia", "Tom", "Ji-woo", "Priya"]);
  for (const [i, ex] of ["1", "3", "5", "7"].entries()) await choose(people[i], path, ex);
  const page = await screen(people[0], path);
  await page.locator(".map .poster").click();
  const dony = page.locator('.map .avatar[data-look="dony"]');
  await expect(dony).toHaveAttribute("style", new RegExp(`--x: ${LOCKERS[0]}; --y: ${LOCKERS[1]}(;|$)`), { timeout: 5000 });
  const id = (await dony.getAttribute("data-id"))!;
  await expect.poll(async () => bobSwaps(trackOf(await samples(page), id).filter((s) => tileKey(s) === LOCKERS.join(","))).length, { timeout: 4000 }).toBeGreaterThanOrEqual(4);
  let track = trackOf(await samples(page), id);

  await test.step("BOT-2.3: the hop at the poster's foot, then the walk", async () => {
    const hop = track.filter((s) => /\bhop\b/.test(s.cls));
    expect.soft(hop.length, "he hops").toBeGreaterThan(0);
    expect.soft(new Set(hop.map(tileKey))).toEqual(new Set(["5,1"]));
    const { walking } = walkOf(track.filter((s) => !/\bhop\b/.test(s.cls)), "5,1", LOCKERS.join(","));
    expectAWalk(walking, "poster to the lockers");
  });

  await test.step("BOT-2.2: Idle, he stands with a person's bob", async () => {
    const standing = track.filter((s) => tileKey(s) === LOCKERS.join(","));
    expect.soft(new Set(standing.map((s) => s.pose))).toEqual(new Set(["stand"]));
    expect.soft(new Set(standing.map((s) => s.bob))).toEqual(new Set([0, 2]));
    const swaps = bobSwaps(standing);
    expect.soft(median(swaps)).toBeGreaterThanOrEqual(370);
    expect.soft(median(swaps)).toBeLessThanOrEqual(430);
  });

  await test.step("BOT-2.3: sent back, he walks to the poster and hops in", async () => {
    await clearSamples(page);
    await page.locator(".map .poster").click();
    await expect(dony).toHaveCount(0, { timeout: 5000 });
    const log = await samples(page);
    track = trackOf(log, id);
    const { walking } = walkOf(track.filter((s) => !/\bhop\b/.test(s.cls)), LOCKERS.join(","), "5,1");
    expectAWalk(walking, "lockers to the poster");
    expect.soft(track.some((s) => /\bhop\b/.test(s.cls) && tileKey(s) === "5,1"), "he hops in at (5,1)").toBe(true);
  });
});

// BOT-2.5
test("Dony sent back mid-set leaves the machine at once, bar back in place, and walks to the poster from there", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom", "Ji-woo"]);
  const [mia, tom, jiwoo] = people;
  // only the bench is left free
  await choose(mia, path, "1");
  await choose(tom, path, "5");
  await choose(jiwoo, path, "7");
  const page = await screen(tom, path);
  await post(mia, path, { action: "dony", intent: "summon" });
  const dony = page.locator('.map .avatar[data-look="dony"]');
  await expect(dony).toHaveAttribute("data-pose", "flat-bench", { timeout: 10_000 });
  await expect(page.locator('.map .station[data-slot="2"] .bar')).toBeHidden();
  const id = (await dony.getAttribute("data-id"))!;
  await clearSamples(page);

  const at = Date.now();
  await post(tom, path, { action: "dony", intent: "send-back" });
  await expect(dony).toHaveCount(0, { timeout: 5000 });
  const log = await samples(page);
  const track = trackOf(log, id);
  const off = track.find((s) => s.pose !== "flat-bench")!;
  expect(off.t - at, "ms until he's off the bench").toBeLessThanOrEqual(1000);
  expect(barDisagreesMs(log, id, 2, "flat-bench", at)).toBeLessThanOrEqual(50);
  const tiles = tilesOf(track);
  expect(tiles[0]).toBe(TILE[2].join(","));
  for (let i = 1; i < tiles.length; i++) expect(adjacent(tiles[i - 1], tiles[i]), `steps ${tiles[i - 1]} to ${tiles[i]}`).toBe(true);
  expect(tiles.at(-1)).toBe("5,1");
});

// ======================================================================
// AV-3: the avatar editor
// ======================================================================

// AV-3.1
test("the editor's preview stands with the gym's bob, and every choice changes it at once", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const page = await mia.newPage();
  await page.goto("/avatar");
  const preview = page.locator(".preview svg.av");

  // the bob: 2 sprite pixels, 400 ms a frame
  const bob = await preview.evaluate(
    (svg) =>
      new Promise<{ t: number; y: number }[]>((resolve) => {
        const out: { t: number; y: number }[] = [];
        const end = performance.now() + 2000;
        const tick = () => {
          const top = svg.querySelector(".av-top")!;
          const tf = getComputedStyle(top).transform;
          const y = tf === "none" ? 0 : Math.round(new DOMMatrix(tf).f * 10) / 10;
          if (out.at(-1)?.y !== y) out.push({ t: performance.now(), y });
          if (performance.now() < end) requestAnimationFrame(tick);
          else resolve(out);
        };
        tick();
      }),
  );
  expect(new Set(bob.map((b) => b.y))).toEqual(new Set([0, 2]));
  const gaps = bob.slice(2).map((b, i) => b.t - bob[i + 1].t);
  expect(median(gaps), `${gaps.map(Math.round).join(", ")} ms`).toBeGreaterThanOrEqual(370);
  expect(median(gaps), `${gaps.map(Math.round).join(", ")} ms`).toBeLessThanOrEqual(430);

  // a new account's look is random (AV-3), so each pick is one it isn't wearing
  const saved = JSON.parse((await page.locator("form.editor").getAttribute("data-saved"))!) as Record<string, string>;
  const other = (now: string, a: string, b: string) => (now === a ? b : a);
  const fill = (sel: string) => preview.locator(sel).first().evaluate((e) => getComputedStyle(e).fill);
  const shown = (style: string) => preview.locator(`.hair-${style}`).evaluate((e) => getComputedStyle(e).display !== "none");

  for (const [field, key, sel, a, b] of [
    ["skin", "skin", "path.s", "1", "6"],
    ["hair_colour", "hairColour", `.hair-${saved.hair} path.h`, "black", "silver"],
    ["shirt", "shirt", "path.t", "grey", "white"],
  ] as const) {
    const before = await fill(sel);
    await page.locator(`input[name="${field}"][value="${other(saved[key], a, b)}"]`).check();
    await expect.poll(() => fill(sel), { timeout: 200, message: `${field} changes the preview at once` }).not.toBe(before);
  }
  const style = other(saved.hair, "crop", "curls");
  expect(await shown(style)).toBe(false);
  await page.locator(`input[name="hair"][value="${style}"]`).check();
  await expect.poll(() => shown(style), { timeout: 200 }).toBe(true);
  expect(await shown(saved.hair)).toBe(false);
});
