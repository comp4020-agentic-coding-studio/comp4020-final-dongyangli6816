import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { join, openRoom, person, post } from "./helpers.ts";

// Equipment delivery (docs/product/criteria/delivery.md, GYM-6 and GYM-7) with
// the page's script running: the gym worker, as two or more people in their
// own browsers see him. The server's side is spec/delivery.test.ts.
//
// What these read, from docs/design/room/spec.md D.5 to D.11 and D.15:
// - `.map .crew` (aria-hidden, inert), one `.worker` per run inside it, his
//   tile in `--x`/`--y`, what he carries as `svg.load[data-equipment]`, his
//   frames as `svg.body use[href]`, `.sway-l`/`.sway-r` on a swap's walk out;
// - `.station[data-slot][data-equipment]`, `.mine` on your own station;
// - the claimer's docket `.dock .eta`, and the one announcement in
//   `#sheet-news`.
// Timings are read from the page's own clock, sampled every frame by the
// probe below, against the criteria's ceilings (2.5 s down, 4.5 s gone, 5.5 s
// for a crowd), not the design's exact numbers.

const DOOR = "4,9";
const TILE: Record<number, string> = {
  1: "1,1", 2: "3,1", 3: "6,1", 4: "8,1", 5: "1,3", 6: "3,3", 7: "6,3", 8: "8,3", 9: "1,5", 10: "3,5", 11: "6,5", 12: "8,5",
};
const STATION_TILES = new Set(Object.values(TILE));
const COOLER = "1,7";
const LINE = "Equipment's on its way. Start whenever";

// ---------- people and rooms ----------

async function room(browser: Browser, names: string[]) {
  const people: Record<string, BrowserContext> = {};
  await Promise.all(names.map(async (n) => (people[n] = await person(browser, n))));
  const { path, passcode } = await openRoom(people[names[0]]);
  for (const n of names.slice(1)) await join(people[n], passcode);
  return { path, people };
}

// a live screen in the room, recording the map from its first frame
async function screen(who: BrowserContext, path: string, opts: { reduced?: boolean; width?: number } = {}) {
  const page = await who.newPage();
  if (opts.width) await page.setViewportSize({ width: opts.width, height: 900 });
  if (opts.reduced) await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(probe);
  await page.goto(path);
  await expect(page.locator(".map-panel .conn .badge")).toHaveText("Live");
  return page;
}

const choose = (who: BrowserContext, path: string, exercise: string) => post(who, path, { action: "choose", exercise });
// Choose as a person does it, on their own page
async function chooseOn(page: Page, exercise: string) {
  await page.selectOption("#exercise", exercise);
  await page.locator(".dock button.wide").click();
}

// ---------- the probe: workers, stations and the claimer's line, every frame ----------

type Worker = { id: number; x: number; y: number; load: string | null; body: string; cls: string; passes: boolean };
type Frame = {
  t: number;
  workers: Worker[];
  crew: boolean;
  stations: Record<number, string | null>;
  avatars: Record<string, { x: number; y: number; pose: string; state: string }>;
  eta: boolean;
  news: string;
};

function probe() {
  const w = window as unknown as { __dq?: Frame[] };
  if (w.__dq) return;
  const log: Frame[] = [];
  w.__dq = log;
  const ids = new WeakMap<Element, number>();
  let next = 1;
  let last = "";
  const tick = () => {
    const workers: Worker[] = [...document.querySelectorAll<HTMLElement>(".map .crew .worker")].map((el) => {
      if (!ids.has(el)) ids.set(el, next++);
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return {
        id: ids.get(el)!,
        x: Number(el.style.getPropertyValue("--x")),
        y: Number(el.style.getPropertyValue("--y")),
        load: el.querySelector("svg.load")?.getAttribute("data-equipment") ?? null,
        body: [...el.querySelectorAll("svg.body use")].map((u) => u.getAttribute("href")).join(" "),
        cls: el.className,
        // a tap at his centre lands on something that isn't him
        passes: !hit || !hit.closest(".crew"),
      };
    });
    const stations: Record<number, string | null> = {};
    for (const s of document.querySelectorAll<HTMLElement>(".map .station")) stations[Number(s.dataset.slot)] = s.dataset.equipment ?? null;
    const avatars: Frame["avatars"] = {};
    for (const a of document.querySelectorAll<HTMLElement>(".map .avatar")) {
      const name = (a.getAttribute("aria-label") ?? "").split(",")[0].replace(" (you)", "");
      avatars[name] = { x: Number(a.style.getPropertyValue("--x")), y: Number(a.style.getPropertyValue("--y")), pose: a.dataset.pose ?? "", state: a.dataset.state ?? "" };
    }
    const eta = document.querySelector<HTMLElement>(".dock .eta");
    const frame = {
      workers,
      crew: !!document.querySelector(".map .crew .worker"),
      stations,
      avatars,
      eta: !!eta && eta.getClientRects().length > 0 && getComputedStyle(eta).visibility !== "hidden",
      news: document.querySelector("#sheet-news")?.textContent?.trim() ?? "",
    };
    const key = JSON.stringify(frame);
    if (key !== last) {
      last = key;
      log.push({ t: performance.now(), ...frame });
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const framesOf = (page: Page) => page.evaluate(() => (window as unknown as { __dq: Frame[] }).__dq.slice());
// waits until the probe's log shows this person on this tile in this pose
const logShows = (page: Page, name: string, tile: string, pose: string) =>
  expect
    .poll(async () => {
      const a = (await framesOf(page)).at(-1)!.avatars[name];
      return a ? `${tileOf(a)} ${a.pose}` : "";
    }, { timeout: 6000, intervals: [50] })
    .toBe(`${tile} ${pose}`);
const everWorker = async (page: Page) => (await framesOf(page)).some((f) => f.workers.length > 0);
// waits until this many workers have come and all have gone again
async function runsDone(page: Page, count: number, timeout = 7000) {
  await expect
    .poll(async () => {
      const log = await framesOf(page);
      const seen = new Set(log.flatMap((f) => f.workers.map((w) => w.id)));
      return seen.size >= count && log.at(-1)!.workers.length === 0;
    }, { timeout, intervals: [100] })
    .toBe(true);
}

// each worker's track: where he was, and what he carried, frame by frame
function tracks(log: Frame[]) {
  const by = new Map<number, (Worker & { t: number })[]>();
  for (const f of log) for (const w of f.workers) by.set(w.id, [...(by.get(w.id) ?? []), { ...w, t: f.t }]);
  return [...by.values()].map((track) => {
    const first = track[0];
    const lastSeen = track.at(-1)!;
    const goneAt = log.find((f) => f.t > lastSeen.t && !f.workers.some((w) => w.id === first.id))?.t ?? Infinity;
    return { track, appeared: first.t, goneAt };
  });
}
const tileOf = (w: { x: number; y: number }) => `${w.x},${w.y}`;
function tilesOf(track: { x: number; y: number }[]) {
  const out: string[] = [];
  for (const s of track) if (out.at(-1) !== tileOf(s)) out.push(tileOf(s));
  return out;
}
const adjacent = (a: string, b: string) => {
  const [ax, ay] = a.split(",").map(Number);
  const [bx, by] = b.split(",").map(Number);
  return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
};
// GYM-6.5, loosely: in at the door and out at it, one tile a step, and onto
// no station but his own
function expectAisleWalk(track: { x: number; y: number }[], slot: number, what: string) {
  const tiles = tilesOf(track);
  expect(tiles[0], `${what}: appears on the door mat`).toBe(DOOR);
  expect(tiles.at(-1), `${what}: leaves from the door mat`).toBe(DOOR);
  for (let i = 1; i < tiles.length; i++) expect(adjacent(tiles[i - 1], tiles[i]), `${what}: steps ${tiles[i - 1]} to ${tiles[i]}`).toBe(true);
  const others = tiles.filter((t) => STATION_TILES.has(t) && t !== TILE[slot]);
  expect(others, `${what}: crosses no other station`).toEqual([]);
}
// the first frame a station shows something other than what it showed at `from`
function changeAt(log: Frame[], slot: number, from: number) {
  const before = [...log].reverse().find((f) => f.t <= from)?.stations[slot] ?? log[0].stations[slot];
  const f = log.find((f) => f.t > from && f.stations[slot] !== before);
  return f ? { t: f.t, was: before, now: f.stations[slot] } : undefined;
}

// GYM-7.5, 6.6, 6.32 (D10, design D.9 as revised 5 Nov): from the moment a
// screen learns of her claim (her avatar turns Lifting) until the last worker
// for her station has gone, the claimer stands where she was, never on the
// station's aisle tile; she sets off only after, and reaches the machine after.
// Returns the frame she arrived in.
function expectWaitsForTheWorker(log: Frame[], name: string, slot: number, equipment: string, lastGone: number, what: string) {
  const learned = log.find((f) => f.avatars[name]?.state === "lifting");
  expect(learned, `${what}: ${name} turns Lifting`).toBeDefined();
  const spot = tileOf(learned!.avatars[name]);
  const [sx, sy] = TILE[slot].split(",").map(Number);
  const aisle = `${sx},${sy + 1}`;
  expect(spot, `${what}: ${name} wasn't already by the station`).not.toBe(aisle);
  const during = log.filter((f) => f.t >= learned!.t && f.t < lastGone && f.avatars[name]);
  expect(during.length, `${what}: frames while the worker was on the map`).toBeGreaterThan(0);
  expect(during.filter((f) => tileOf(f.avatars[name]) !== spot).map((f) => `${Math.round(f.t - learned!.t)} ms: ${tileOf(f.avatars[name])}`), `${what}: ${name} stays on ${spot} while a worker is on the map`).toEqual([]);
  expect([...new Set(during.map((f) => f.avatars[name].pose))], `${what}: ${name} stands while she waits`).toEqual(["stand"]);
  const arrived = log.find((f) => f.t >= learned!.t && f.avatars[name] && tileOf(f.avatars[name]) === TILE[slot] && f.avatars[name].pose === equipment);
  expect(arrived, `${what}: ${name} reaches the ${equipment}`).toBeDefined();
  expect(arrived!.t, `${what}: ${name} reaches it after the last worker has gone`).toBeGreaterThan(lastGone);
  return arrived!;
}

// ======================================================================

// S1. GYM-6.2, 6.4, 6.5, 6.6 (and D10's order), 6.7, 6.8, 6.26, 6.28, 6.29, 6.37, 6.38, 7.1,
// 7.4 (390 px), 7.5, 7.6, 7.9
test("a delivery: Mia chooses Deadlift, both screens play one worker carrying a platform to station 5, and only Mia gets the line", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const tomPage = await screen(people.Tom, path);
  const miaPage = await screen(people.Mia, path);

  // GYM-6.38: a choice that never reaches the server sends no worker
  const roomUrl = (u: URL) => u.pathname === path;
  await miaPage.route(roomUrl, (r) => (r.request().method() === "POST" ? r.abort() : r.continue()));
  await chooseOn(miaPage, "9");
  await tomPage.waitForTimeout(1000);
  expect(await everWorker(tomPage), "no worker for a choice that failed").toBe(false);
  await expect(tomPage.locator('.map .station[data-slot="5"]')).not.toHaveAttribute("data-equipment");
  await miaPage.unroute(roomUrl);
  await miaPage.goto(path);
  await expect(miaPage.locator(".map-panel .conn .badge")).toHaveText("Live");

  await chooseOn(miaPage, "9"); // deadlift: station 5 is empty, so a platform is delivered

  // GYM-7.1, 7.4, 7.6, 6.8, checked the moment Mia's worker is up and the
  // platform not yet down
  // (the worker comes with the room update, which can land a moment before
  // her panel's in-place swap; both well inside the put-down)
  await expect(miaPage.locator(".dock button.wide")).toHaveText("Done", { timeout: 2000 });
  await expect(miaPage.locator(".map .crew .worker")).toHaveCount(1, { timeout: 2000 });
  const mid = await miaPage.evaluate(() => {
    const done = document.querySelector<HTMLElement>(".dock button.wide")!;
    const r = done.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const st = document.querySelector<HTMLElement>('.map .station[data-slot="5"]')!;
    return {
      down: st.dataset.equipment ?? null,
      mine: st.classList.contains("mine"),
      done: { text: done.textContent?.trim(), disabled: (done as HTMLButtonElement).disabled, box: [r.x, r.y, r.width, r.height], onTop: hit === done || done.contains(hit) },
      tab: document.querySelector(".sheet .tab")?.textContent?.trim(),
      // its two lines, as two spans (D.10)
      eta: [...document.querySelectorAll(".dock .eta span")].map((e) => e.textContent?.trim()).join(" ") || null,
    };
  });
  expect(mid.down, "the platform isn't down yet").toBeNull();
  expect(mid.mine, "her station is marked hers before the put-down").toBe(true);
  expect(mid.tab).toContain("Lifting");
  expect(mid.done).toMatchObject({ text: "Done", disabled: false, onTop: true });
  expect(mid.eta).toBe("Equipment's on its way. Start whenever 🚚");

  // GYM-6.29 on Tom's screen, while the platform is still being carried
  await expect(tomPage.locator(".map .crew .worker")).toHaveCount(1, { timeout: 2000 });
  const seen = await tomPage.evaluate(() => ({
    down: document.querySelector<HTMLElement>('.map .station[data-slot="5"]')!.dataset.equipment ?? null,
    labels: [...document.querySelectorAll(".map .avatar")].map((a) => a.getAttribute("aria-label")),
    row: [...document.querySelectorAll(".people li")].find((li) => li.textContent?.includes("Mia"))?.textContent?.replace(/\s+/g, " ") ?? "",
    rows: document.querySelectorAll(".people li").length,
    crew: { hidden: document.querySelector(".map .crew")?.getAttribute("aria-hidden"), inert: document.querySelector(".map .crew")?.hasAttribute("inert") },
    focusable: document.querySelectorAll(".map .crew :is(a, button, input, [tabindex])").length,
  }));
  expect(seen.down).toBeNull();
  expect(seen.labels).toContain("Mia, lifting, deadlift on lifting platform 5");
  expect(seen.row).toContain("lifting platform 5");
  expect(seen.rows, "the worker is not in the squad").toBe(2);
  expect(seen.crew).toEqual({ hidden: "true", inert: true });
  expect(seen.focusable).toBe(0);

  await runsDone(miaPage, 1);
  await runsDone(tomPage, 1);
  // Done keeps its box once the line has gone
  const after = await miaPage.locator(".dock button.wide").boundingBox();
  expect([after!.x, after!.y, after!.width, after!.height], "Done's box with and without a run").toEqual(mid.done.box);

  for (const [who, page] of [["Mia", miaPage], ["Tom", tomPage]] as const) {
    const log = await framesOf(page);
    const runs = tracks(log);
    expect(runs, `${who}: one worker`).toHaveLength(1);
    const { track, appeared, goneAt } = runs[0];
    expectAisleWalk(track, 5, who);
    expect(track[0].load, `${who}: he carries a platform in`).toBe("lifting-platform");
    expect(track.every((w) => w.passes), `${who}: taps go through him`).toBe(true);
    const down = changeAt(log, 5, appeared)!;
    expect(down, `${who}: the platform goes down`).toMatchObject({ was: null, now: "lifting-platform" });
    // GYM-6.6: the empty bay until he's on the station's tile
    const onTile = track.find((w) => tileOf(w) === TILE[5]);
    expect(onTile, `${who}: he steps onto station 5`).toBeDefined();
    expect(onTile!.t, `${who}: nothing down before he gets there`).toBeLessThanOrEqual(down.t);
    expect(down.t - appeared, `${who}: down within 2.5 s`).toBeLessThanOrEqual(2500);
    expect(goneAt - appeared, `${who}: gone within 4.5 s`).toBeLessThanOrEqual(4500);
  }

  // GYM-7.5 and GYM-7.6 on Mia's own screen
  let mine = await framesOf(miaPage);
  const downAt = changeAt(mine, 5, tracks(mine)[0].appeared)!.t;
  // she waits by the lockers until the worker has gone, then walks over (on
  // both screens)
  for (const [who, page] of [["Mia", miaPage], ["Tom", tomPage]] as const) {
    await logShows(page, "Mia", TILE[5], "lifting-platform");
    const log = await framesOf(page);
    expectWaitsForTheWorker(log, "Mia", 5, "lifting-platform", tracks(log)[0].goneAt, `${who}'s screen`);
  }
  mine = await framesOf(miaPage);
  expect(mine.some((f) => f.t < downAt && f.eta), "the line shows while he carries").toBe(true);
  expect(mine.filter((f) => f.t >= downAt + 200 && f.eta), "and goes at the put-down").toEqual([]);
  const announced = mine.filter((f, i) => f.news.includes(LINE) && !(mine[i - 1]?.news ?? "").includes(LINE));
  expect(announced, "announced once").toHaveLength(1);
  expect(mine.filter((f) => f.t >= downAt).some((f) => f.news && !f.news.includes(LINE)), "nothing more at the put-down").toBe(false);
  // GYM-7.9 on Tom's
  const his = await framesOf(tomPage);
  expect(his.some((f) => f.eta || f.news.includes("on its way")), "Tom gets no line").toBe(false);
});

// S2. GYM-6.9, 6.10, 6.7 (a swap), 6.11 (on screen), 7.5, 7.7
test("a swap in a full room: one trip in with a cable machine and out with the bench, and Tom's Done mid-run sends him to the cooler", async ({ browser }) => {
  test.setTimeout(60_000);
  const holders = ["Mia", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10"];
  const { path, people } = await room(browser, [...holders, "Tom"]);
  // every station held but the bench on 2, the oldest piece nobody holds
  const lifts = ["1", "5", "7", "9", "11", "16", "1", "5", "7", "9", "11"];
  for (const [i, n] of holders.entries()) await choose(people[n], path, lifts[i]);
  const miaPage = await screen(people.Mia, path);
  const tomPage = await screen(people.Tom, path);
  const start = await framesOf(miaPage);
  expect(Object.values(start[0].stations).every((e) => e !== null), "every station holds equipment").toBe(true);
  expect(start[0].stations[2]).toBe("flat-bench");

  await chooseOn(tomPage, "13"); // lat pulldown: no free cable machine, nothing empty
  await expect(tomPage.locator(".dock button.wide")).toHaveText("Done");
  await tomPage.fill("#weight_kg", "40");
  await tomPage.locator(".dock button.wide").click(); // Done, before the put-down
  await expect(tomPage.locator(".dock button.wide")).toHaveText("Start set");
  await expect(miaPage.locator(".people li", { hasText: "Tom" })).toContainText("Rest", { timeout: 1500 });

  await runsDone(miaPage, 1);
  await runsDone(tomPage, 1);
  for (const [who, page] of [["Mia", miaPage], ["Tom", tomPage]] as const) {
    const log = await framesOf(page);
    const runs = tracks(log);
    expect(runs, `${who}: one worker, one trip`).toHaveLength(1);
    const { track, appeared, goneAt } = runs[0];
    expectAisleWalk(track, 2, who);
    const swap = changeAt(log, 2, appeared)!;
    expect(swap, `${who}: straight from the bench to the cable machine`).toMatchObject({ was: "flat-bench", now: "cable-machine" });
    expect(log.filter((f) => f.t >= appeared).map((f) => f.stations[2]).filter((e) => e !== "flat-bench" && e !== "cable-machine"), `${who}: never empty`).toEqual([]);
    // he brings the new piece and takes the old one away
    expect(track.filter((w) => w.t < swap.t).map((w) => w.load)).toEqual(expect.arrayContaining(["cable-machine"]));
    expect(new Set(track.filter((w) => w.t < swap.t).map((w) => w.load)), `${who}: carries only the cable machine in`).toEqual(new Set(["cable-machine"]));
    expect(new Set(track.filter((w) => w.t > swap.t).map((w) => w.load)), `${who}: carries only the bench out`).toEqual(new Set(["flat-bench"]));
    expect(track.some((w) => w.t > swap.t && /\bsway-[lr]\b/.test(w.cls)), `${who}: staggers out`).toBe(true);
    expect(goneAt - appeared, `${who}: gone within 4.5 s`).toBeLessThanOrEqual(4500);
    // GYM-6.11 on screen: nobody else's station changed
    for (let s = 1; s <= 12; s++) if (s !== 2) expect(log.at(-1)!.stations[s], `${who}: station ${s}`).toBe(log[0].stations[s]);
  }

  const tomLog = await framesOf(tomPage);
  const tomSwap = changeAt(tomLog, 2, tracks(tomLog)[0].appeared)!.t;
  expect(tomLog.find((f) => f.avatars.Tom?.state === "resting")!.t, "Tom's Done came before the put-down on his screen").toBeLessThan(tomSwap);
  // GYM-7.7: Tom never played the machine, went to the cooler, and his line went with the Lifting dock
  await expect(tomPage.locator(".dock .eta")).toHaveCount(0);
  await expect.poll(async () => {
    const a = (await framesOf(tomPage)).at(-1)!.avatars.Tom;
    return `${tileOf(a)} ${a.pose}`;
  }, { timeout: 5000 }).toBe(`${COOLER} rest`);
  // GYM-7.5, 7.7 (D10), on both screens: Lifting, he stands where he was
  // while the worker is out; Done sends him to the cooler at once, without
  // waiting for the worker, and he never goes near station 2
  for (const [who, page] of [["Tom", tomPage], ["Mia", miaPage]] as const) {
    await logShows(page, "Tom", COOLER, "rest");
    const log = await framesOf(page);
    const { goneAt } = tracks(log)[0];
    const learned = log.find((f) => f.avatars.Tom?.state === "lifting")!;
    const rested = log.find((f) => f.avatars.Tom?.state === "resting")!;
    expect(learned, `${who}: Tom turns Lifting`).toBeDefined();
    expect(rested.t, `${who}: Tom turns Resting while the worker is still out`).toBeLessThan(goneAt);
    const spot = tileOf(learned.avatars.Tom);
    const lifting = log.filter((f) => f.t >= learned.t && f.t < rested.t && f.avatars.Tom);
    expect(lifting.filter((f) => tileOf(f.avatars.Tom) !== spot), `${who}: Tom stays on ${spot} while Lifting and waiting`).toEqual([]);
    const moved = log.find((f) => f.t > rested.t && f.avatars.Tom && tileOf(f.avatars.Tom) !== spot);
    expect(moved, `${who}: Tom sets off for the cooler`).toBeDefined();
    expect(moved!.t, `${who}: at once, before the worker has gone`).toBeLessThan(goneAt);
    const near = log.filter((f) => f.t >= learned.t && f.avatars.Tom && ["3,1", "3,2"].includes(tileOf(f.avatars.Tom)));
    expect(near, `${who}: Tom never goes to station 2 or its aisle tile`).toEqual([]);
    expect(log.filter((f) => f.avatars.Tom?.pose === "cable-machine"), `${who}: Tom never plays the cable machine`).toEqual([]);
  }
});

// S3. GYM-6.19, 6.20, 6.21 (the clear cases), 6.24, 6.37, 7.4 (1280 px), 7.6
// (none after a reload), 7.8
test("no replay: Ji-woo opening or reloading mid-run sees the equipment already down and no worker, and later updates bring none", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom", "Ji-woo"]);
  const miaPage = await screen(people.Mia, path, { width: 1280 });
  const tomPage = await screen(people.Tom, path);

  await chooseOn(miaPage, "11"); // pull-up: a bar delivered to station 5
  await expect(miaPage.locator(".dock button.wide")).toHaveText("Done", { timeout: 2000 });
  await expect(miaPage.locator(".map .crew .worker")).toHaveCount(1, { timeout: 2000 });
  const doneMid = await miaPage.locator(".dock button.wide").boundingBox();
  // Ji-woo opens the room while the run plays on the others' screens
  const jiPage = await people["Ji-woo"].newPage();
  await jiPage.addInitScript(probe);
  await jiPage.goto(path);
  expect((await framesOf(miaPage)).at(-1)!.workers.length, "the run still playing for Mia when Ji-woo's page loaded").toBe(1);
  await expect(jiPage.locator(".map-panel .conn .badge")).toHaveText("Live");
  let ji = await framesOf(jiPage);
  expect(ji[0].stations[5], "the bar is down from her first frame").toBe("pull-up-bar");
  expect(ji[0].avatars.Mia, "Mia on it from her first frame").toMatchObject({ x: 1, y: 3, pose: "pull-up-bar" });

  await runsDone(miaPage, 1);
  const doneAfter = await miaPage.locator(".dock button.wide").boundingBox();
  expect(doneAfter, "Done's box at 1280 px with and without a run").toEqual(doneMid);
  // GYM-6.37: Mia's own screen played it once, panel swap and all
  expect(tracks(await framesOf(miaPage)), "Mia's screen: one worker").toHaveLength(1);

  // Tom's claim, and Ji-woo reloads straight after it
  await choose(people.Tom, path, "16"); // plank: a mat delivered to station 6
  await jiPage.reload();
  await expect(jiPage.locator(".map-panel .conn .badge")).toHaveText("Live");
  ji = await framesOf(jiPage);
  expect(ji[0].stations[6], "after a reload, the mat is down from the first frame").toBe("exercise-mat");
  await runsDone(tomPage, 1); // Tom's own screen did play it: a live screen seeing a fresh change

  // updates that change no station: a set, Start set, an emoji
  await post(people.Mia, path, { exercise_id: "11", reps: "8", weight_kg: "" });
  await expect(jiPage.locator(".people li", { hasText: "Mia" })).toContainText("Rest", { timeout: 1500 });
  await post(people.Mia, path, { action: "start", exercise_id: "11", reps: "8", weight_kg: "" });
  await expect(jiPage.locator(".map .avatar", { hasText: "Mia" })).toHaveAttribute("data-state", "lifting", { timeout: 1500 });
  expect((await post(people["Ji-woo"], path, { action: "emote", emoji: "fire" })).status()).toBe(200);
  await expect(miaPage.locator(".map .avatar", { hasText: "Mia" })).toHaveAttribute("data-state", "lifting", { timeout: 1500 });
  await jiPage.waitForTimeout(500);

  ji = await framesOf(jiPage);
  expect(ji.some((f) => f.workers.length > 0), "no worker on Ji-woo's screen, ever").toBe(false);
  expect(ji.some((f) => f.eta), "no line on Ji-woo's screen").toBe(false);
  const mia = await framesOf(miaPage);
  expect(tracks(mia), "Mia's screen: one worker for hers, one for Tom's, none for the set or Start set").toHaveLength(2);
});

// S4. GYM-6.12, 6.13, 6.15/6.39 (a repeat claim), 6.16 (and D10's wait), 6.17, 6.25, 6.32
test("a rush: two claims at once walk in single file, Mia's switch turns her worker round, and reduced motion shows no worker at all", async ({ browser }) => {
  test.setTimeout(60_000);
  const holders = ["Priya", "Ji-woo", "P4", "P5", "P6", "P7", "P8", "P9", "P10", "P11"];
  const { path, people } = await room(browser, ["Mia", "Tom", ...holders]);
  // stations 1 to 10 held, every mat among them; 11 and 12 empty
  const lifts = ["1", "3", "5", "7", "9", "16", "9", "16", "1", "5"];
  for (const [i, n] of holders.entries()) await choose(people[n], path, lifts[i]);
  const priyaPage = await screen(people.Priya, path);
  const jiPage = await screen(people["Ji-woo"], path, { reduced: true });
  const before = (await framesOf(priyaPage))[0];
  expect([before.stations[11], before.stations[12]]).toEqual([null, null]);

  // Mia and Tom choose in the same moment: a cable machine and a pull-up bar
  await Promise.all([choose(people.Mia, path, "13"), choose(people.Tom, path, "12")]);
  // Mia switches to push-ups once her worker is on his way up the walkway
  // (before he's anywhere near her station): no free mat, nothing empty, so
  // her own station is swapped for a mat; Tom repeats his choice
  await expect
    .poll(async () => (await framesOf(priyaPage)).at(-1)!.workers.some((w) => w.load === "cable-machine" && w.y <= 7), { intervals: [20], timeout: 3000 })
    .toBe(true);
  const switchedAt = await priyaPage.evaluate(() => performance.now());
  await choose(people.Mia, path, "15");
  await choose(people.Tom, path, "12");

  await runsDone(priyaPage, 3);
  const log = await framesOf(priyaPage);
  const runs = tracks(log).sort((a, b) => a.appeared - b.appeared);
  expect(runs.map((r) => r.track[0].load).sort(), "three workers: the cable machine, the bar, the mat; none for Tom's repeat").toEqual(["cable-machine", "exercise-mat", "pull-up-bar"]);
  const cable = runs.find((r) => r.track[0].load === "cable-machine")!;
  const bar = runs.find((r) => r.track[0].load === "pull-up-bar")!;
  const mat = runs.find((r) => r.track[0].load === "exercise-mat")!;
  const slotOf = (eq: string) => (log.at(-1)!.stations[11] === eq ? 11 : 12);
  const miaSlot = slotOf("exercise-mat");
  const tomSlot = slotOf("pull-up-bar");
  expect(new Set([miaSlot, tomSlot])).toEqual(new Set([11, 12]));

  // GYM-6.12, 6.13: the first two at once, a step apart, never on one tile on the way in
  expect(Math.abs(cable.appeared - bar.appeared), "the two start a step apart").toBeGreaterThanOrEqual(100);
  // on the way in: before Mia's switch, both were walking in (after it, hers
  // turns round, and one walking out may share a tile with one walking in)
  const until = switchedAt;
  expect(log.filter((f) => f.t < until && f.workers.length === 2).length, "both were on the floor before the switch").toBeGreaterThan(0);
  for (const f of log.filter((f) => f.t < until)) {
    const a = f.workers.find((w) => w.id === cable.track[0].id);
    const b = f.workers.find((w) => w.id === bar.track[0].id);
    if (a && b) expect(tileOf(a), `two workers on one tile on the way in, at ${Math.round(f.t - runs[0].appeared)} ms`).not.toBe(tileOf(b));
  }

  // GYM-6.16: the cable machine is never put down; he carries it back out
  expect(log.some((f) => f.stations[miaSlot] === "cable-machine"), "the cable machine never lands").toBe(false);
  expect(cable.track.at(-1)!.load, "he leaves still carrying it").toBe("cable-machine");
  expectAisleWalk(cable.track, miaSlot, "the turned-round worker");
  expect(tilesOf(cable.track), "he turns before reaching the station").not.toContain(TILE[miaSlot]);
  // and the mat comes on its own run, as a delivery to what this screen showed: empty
  expect(changeAt(log, miaSlot, mat.appeared), "the mat goes down on the empty bay").toMatchObject({ was: null, now: "exercise-mat" });
  expect(mat.appeared - cable.appeared, "the second run doesn't wait for the first").toBeLessThan(cable.goneAt - cable.appeared);
  expectAisleWalk(bar.track, tomSlot, "Tom's worker");
  expectAisleWalk(mat.track, miaSlot, "the mat worker");
  // GYM-6.13, 6.17: everything settled and gone within 5.5 s of the first appearing
  expect(Math.max(...runs.map((r) => r.goneAt)) - runs[0].appeared).toBeLessThanOrEqual(5500);
  expect(log.at(-1)!.stations[miaSlot]).toBe("exercise-mat");
  expect(log.at(-1)!.stations[tomSlot]).toBe("pull-up-bar");
  // GYM-6.16, 6.32 (D10): Mia waits where she was until both workers for her
  // station have gone, the turned-round one included, then walks to her mat
  await logShows(priyaPage, "Mia", TILE[miaSlot], "exercise-mat");
  const settled = await framesOf(priyaPage);
  const bothGone = Math.max(cable.goneAt, mat.goneAt);
  expectWaitsForTheWorker(settled, "Mia", miaSlot, "exercise-mat", bothGone, "Priya's screen, after the turn-round");

  // GYM-6.25: reduced motion, no worker at all, the same floor at the end
  const ji = await framesOf(jiPage);
  expect(ji.some((f) => f.crew), "no worker under reduced motion").toBe(false);
  await expect(jiPage.locator(".map .crew .worker")).toHaveCount(0);
  expect(ji.at(-1)!.stations).toEqual(log.at(-1)!.stations);
  const [tx, ty] = TILE[tomSlot].split(",");
  await expect(jiPage.locator('.map .avatar[aria-label^="Tom,"]'), "Tom on his bar").toHaveAttribute("style", new RegExp(`--x: ${tx}; --y: ${ty}(;|$)`));
  expect(ji.filter((f) => f.avatars.Tom && tileOf(f.avatars.Tom) !== TILE[tomSlot] && f.avatars.Tom.state === "lifting").length, "and straight there, no waiting tile").toBeLessThanOrEqual(1);
});
