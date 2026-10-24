import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { backdate, join, openRoom, person, post } from "./helpers.ts";

// Interactions, presets and emoji with the room's script running
// (docs/product/criteria/int.md, INT-1 to INT-5, INT-8, BOT-6). The server's
// side (what is accepted, the limits, the events) is spec/interactions.test.ts
// and spec/dony-emoji.test.ts, whose contract these use to set things up.
// Each test names the criteria it covers.
//
// The page's hooks are the room design's ("Interactions, Oct 22", I.2 to I.9
// in docs/design/room/spec.md, and mockup.html):
// - the menu: `.menu[role=menu]`, its name in `.menu-name`, the state in
//   `.menu-name .chip.state-<state>`; actions `.act[value=cheer|poke|slap|
//   message]`, highlighted `.hot` with `.cur` (▶) showing, unavailable
//   `aria-disabled="true"` with the reason in `.menu-why`; presets
//   `.preset[value=<key>]` after Message, in two `.presets[role=group]`.
//   Others' avatars and squad rows (`.people .person`) carry
//   `aria-haspopup="menu"` and `aria-expanded`.
// - a reaction: `svg.fx.fx-<kind>` inside the target's `.avatar`.
// - a banner: `.banner-slot .banner[role=status]`, on the target's screens only.
// - a refusal: `p.note[role=status]`; a failure: `p.error[role=alert]`.
// - a preset bubble: `.map .says .say`, with `.to` "@Name"; on the back row `.below`.
// - the emoji tab `.dock button.emote` (aria-label "Send an emoji"), the tray
//   `.tray` with eight `button[value=<key>]`, cooling `[data-cooling]`; a pop
//   `.map .pops svg.pop` holding `<use href="…#em-<key>">`; its failure
//   `p.error.emote-error[role=alert]`.
// - the dock's own button is `.dock button.wide` (Choose, Done, Start set, Save).
// - the room log: `section.panel.room-log`, lines `li`, `li.you`, `li.joined`,
//   `details.older > summary` "Show older (n more)", empty `p.empty`.
// - `#sheet-news` (role=status) announces your own emoji and presets to you.
//
// Time: the server's waits (Away, turning Slacking, the poster's rest, Dony's
// schedule, the 10 s limit) are moved past with the test hook's backdate
// (contract at the top of spec/interactions.test.ts). The page's own timers
// (a menu's 10 s coming back) are moved with Playwright's clock. What stays
// in real time is short: 1 s, 3 s, 4 s and 5 s displays, and "within a second".

const BANNER = ".banner-slot .banner";
const MAIN = ".dock button.wide";
const EMOTE = ".dock button.emote";

// ---------- people and rooms ----------

async function room(browser: Browser, names: string[]) {
  const people: Record<string, BrowserContext> = {};
  for (const name of names) people[name] = await person(browser, name);
  const { path, passcode } = await openRoom(people[names[0]]);
  for (const name of names.slice(1)) await join(people[name], passcode);
  return { path, passcode, people };
}

// A screen in the room. `record` keeps a timeline of what appears (below);
// `stale` cuts the room's live stream from the start, so the page keeps its
// first render: a menu that still shows what was true when it opened, for
// sends the server must refuse.
type ScreenOpts = { reduced?: boolean; viewport?: { width: number; height: number }; at?: string; record?: boolean; stale?: boolean };
async function screen(who: BrowserContext, path: string, opts: ScreenOpts = {}) {
  const page = await who.newPage();
  if (opts.viewport) await page.setViewportSize(opts.viewport);
  if (opts.reduced) await page.emulateMedia({ reducedMotion: "reduce" });
  if (opts.record) await page.addInitScript(recorder);
  if (opts.stale) await page.route("**/events", (route) => route.abort());
  await page.goto(opts.at ?? path);
  if (!opts.stale) await expect(page.locator(".map-panel .conn .badge")).toHaveText("Live");
  return page;
}
const recorded = (who: BrowserContext, path: string, opts: ScreenOpts = {}) => screen(who, path, { ...opts, record: true });
const LAPTOP = { width: 1280, height: 900 };

const avatar = (page: Page, name: string) =>
  page.locator(`.map .avatar[aria-label^="${name},"], .map .avatar[aria-label^="${name} (you),"]`);
const row = (page: Page, name: string) => page.locator(".people .person", { hasText: name });
const menu = (page: Page) => page.locator(".menu");
const act = (page: Page, kind: string) => page.locator(`.menu .act[value="${kind}"]`);
const idOf = async (page: Page, name: string) => Number(await avatar(page, name).getAttribute("data-id"));

const choose = (who: BrowserContext, path: string, exercise: string) => post(who, path, { action: "choose", exercise });
const logSet = (who: BrowserContext, path: string, exercise: string) => post(who, path, { exercise_id: exercise, weight_kg: "40", reps: "8" });
const finish = (who: BrowserContext, path: string) => post(who, path, { action: "finish" });
// the contract's sends, as another person's page would make them
const interact = (who: BrowserContext, path: string, to: number, kind: string) => post(who, path, { action: "interact", to: String(to), kind });
const sayTo = (who: BrowserContext, path: string, to: number, preset: string) => post(who, path, { action: "say", to: String(to), preset });
const emote = (who: BrowserContext, path: string, emoji: string) => post(who, path, { action: "emote", emoji });

type Box = { x: number; y: number; width: number; height: number };
// The overlay's tile and its sender's, read together. It follows a walking
// sender a step behind (every 125 ms), so mid-walk the two agree only in
// moments; the poll waits for them to agree, which they do for good once the
// sender stops (a walk across the map takes about 1.5 s). An overlay anywhere
// else never does.
const onSendersTile = (page: Page, overlay: string, name: string) =>
  expect
    .poll(
      () =>
        page.evaluate(
          ({ overlay, name }) => {
            const tile = (el: Element | null) => (el ? `${(el as HTMLElement).style.getPropertyValue("--x").trim()},${(el as HTMLElement).style.getPropertyValue("--y").trim()}` : "none");
            const who = [...document.querySelectorAll(".map .avatar")].find((a) => /^[^,]+/.exec(a.getAttribute("aria-label") ?? "")?.[0].replace(" (you)", "") === name) ?? null;
            return tile(document.querySelector(overlay)) === tile(who);
          },
          { overlay, name },
        ),
      { timeout: 2500, intervals: [50] },
    )
    .toBe(true);
// an element's box once it has stayed the same for ms, every frame
const settled = (page: Page, sel: string, ms = 500) =>
  page.evaluate(
    ({ sel, ms }) =>
      new Promise<Box>((resolve, reject) => {
        let last = "";
        let since = performance.now();
        const giveUp = performance.now() + 5000;
        const tick = () => {
          const r = document.querySelector(sel)!.getBoundingClientRect();
          const key = `${r.x},${r.y},${r.width},${r.height}`;
          if (key !== last) {
            last = key;
            since = performance.now();
          }
          if (performance.now() - since >= ms) resolve({ x: r.x, y: r.y, width: r.width, height: r.height });
          else if (performance.now() > giveUp) reject(new Error(`${sel} never held still`));
          else requestAnimationFrame(tick);
        };
        tick();
      }),
    { sel, ms },
  );
const intersects = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const box = async (l: Locator) => (await l.boundingBox())!;

// every element under a point in the dock's button stays inside it, for ms
const dockHitDuring = (page: Page, ms: number) =>
  page.evaluate(
    ({ ms, sel }) =>
      new Promise<string[]>((resolve) => {
        const misses: string[] = [];
        const end = performance.now() + ms;
        const tick = () => {
          const b = document.querySelector(sel)!;
          const r = b.getBoundingClientRect();
          for (const [x, y] of [[r.x + r.width / 2, r.y + r.height / 2], [r.x + 4, r.y + 4], [r.right - 4, r.y + 4], [r.x + 4, r.bottom - 4], [r.right - 4, r.bottom - 4]]) {
            const hit = document.elementFromPoint(x, y);
            if (!hit || !b.contains(hit)) misses.push(`${Math.round(x)},${Math.round(y)}: ${hit?.className || hit?.tagName}`);
          }
          if (performance.now() < end) requestAnimationFrame(tick);
          else resolve(misses);
        };
        tick();
      }),
    { ms, sel: MAIN },
  );

// Records, from the page's first frame, every reaction, pop and bubble that
// appears on the map and every banner, with Date.now(), so a test can assert
// that something never showed, not only that it isn't there now.
// An element counts again whenever what it shows changes (a banner reused
// with new words, a pop given a new picture). Also samples, every frame, the
// machine frames of whoever has a reaction on them (INT-3.8).
function recorder() {
  const w = window as unknown as { __int?: unknown[]; __frames?: unknown[] };
  if (w.__int) return;
  const seen: unknown[] = (w.__int = []);
  const frames: unknown[] = (w.__frames = []);
  const last = new WeakMap<Element, string>();
  const shown = (el: Element | null) => !!el && getComputedStyle(el).visibility !== "hidden" && getComputedStyle(el).display !== "none";
  const SEL = ".map svg.fx, .map .pops svg.pop, .map .says .say, .banner-slot .banner";
  // Appearances are caught by a MutationObserver, on every DOM change as it
  // happens, so none can come and go unseen. (Sampled once a frame, this
  // missed one banner of four in some runs, a different one each time.)
  const look = () => {
    const t = Date.now();
    for (const el of document.querySelectorAll(SEL)) {
      const use = el.querySelector("use")?.getAttribute("href") ?? null;
      const text = el.textContent?.trim() ?? "";
      const key = `${use}|${text}`;
      if (last.get(el) === key) continue;
      last.set(el, key);
      seen.push({
        t,
        what: el.matches("svg.fx") ? "fx" : el.matches("svg.pop") ? "pop" : el.matches(".say") ? "say" : "banner",
        cls: el.getAttribute("class"),
        on: el.closest(".avatar")?.getAttribute("aria-label") ?? null,
        use,
        text,
      });
    }
  };
  const start = () => {
    look();
    new MutationObserver(look).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["href"] });
  };
  if (document.documentElement) start();
  else addEventListener("DOMContentLoaded", start, { once: true });
  // the machine's frames under a reaction (INT-3.8) are a matter of frames
  const sample = () => {
    const t = Date.now();
    for (const a of document.querySelectorAll(".map .avatar.on-machine, .map .avatar[data-pose]")) {
      const f1 = a.querySelector("svg.av .frame-1");
      if (!f1) continue;
      const fx = a.querySelector("svg.fx");
      frames.push({ t, id: a.getAttribute("data-id"), frame: shown(f1) ? 1 : 2, fx: fx?.querySelector("use")?.getAttribute("href") ?? (fx ? "?" : null) });
    }
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
}
type Seen = { t: number; what: "fx" | "pop" | "say" | "banner"; cls: string; on: string | null; use: string | null; text: string };
type FrameSample = { t: number; id: string; frame: 1 | 2; fx: string | null };
const seenOn = (page: Page) => page.evaluate(() => (window as unknown as { __int: unknown[] }).__int.slice()) as Promise<Seen[]>;
const framesOn = (page: Page) => page.evaluate(() => (window as unknown as { __frames: unknown[] }).__frames.slice()) as Promise<FrameSample[]>;
const emojiOf = (s: Seen) => s.use?.replace(/.*#em-/, "") ?? null;

// Dony out, his visit picked through the test hook (spec/dony-emoji.test.ts):
// summons him as anyone would, previews earlier summon times, and moves the
// room back to the first whose visit passes the test.
type Visit = { summonedAt: number; segments: { kind: string; start: number; end: number; slackAt: number | null }[]; emotes: { at: number; emoji: string; why: string }[] };
async function summonFitting(who: BrowserContext, path: string, fits: (v: Visit, now: number) => boolean, tries = 400): Promise<Visit> {
  expect((await post(who, path, { action: "dony", intent: "summon" })).status()).toBe(303);
  const read = async (q: string) => {
    const res = await who.request.get(`${path}/qa${q}`);
    expect(res.status(), "the test hook (SPOTTER_TEST_HOOKS=1, spec/dony-emoji.test.ts)").toBe(200);
    return ((await res.json()) as { dony: Visit }).dony;
  };
  const real = await read("");
  for (let j = 1; j <= tries; j++) {
    const ms = 20 * 60_000 + j * 7_919;
    const now = Date.now();
    const v = await read(`?summonedAt=${real.summonedAt - ms}&until=${now + 3 * 60_000}`);
    if (!fits(v, now)) continue;
    await backdate(who, path, { room: true }, ms);
    return v;
  }
  throw new Error(`no visit in ${tries} fits this check`);
}
// none of his own emoji from just before now to spanMs ahead
const quiet = (spanMs: number) => (v: Visit, now: number) => !v.emotes.some((e) => e.why === "own" && e.at >= now - 2000 && e.at < now + spanMs);

// What is painted where, top first, with the map's overlays (pops and
// bubbles, which are pointer-events: none by design, I.6 and I.8) made
// hit-testable for the moment it takes to look.
async function paintedAt(page: Page, points: [number, number][]): Promise<string[][]> {
  return page.evaluate((points) => {
    const style = document.createElement("style");
    style.textContent = ".map .pops, .map .pops *, .map .says, .map .says * { pointer-events: auto !important; }";
    document.head.append(style);
    try {
      return points.map(([x, y]) =>
        document.elementsFromPoint(x, y).map((e) => {
          if (e.closest(".map .pops svg.pop")) return "pop";
          const say = e.closest(".map .says .say");
          if (say) return `say:${say.textContent?.trim()}`;
          if (e.closest(".map .avatar .tag")) return `tag:${e.closest(".avatar")!.getAttribute("aria-label")}`;
          if (e.closest(".map .avatar")) return `avatar:${e.closest(".avatar")!.getAttribute("aria-label")}`;
          return e.tagName.toLowerCase();
        }),
      );
    } finally {
      style.remove();
    }
  }, points);
}
// every avatar and tag overlapping a pop is painted over it
async function popsUnderAvatars(page: Page): Promise<string[]> {
  const pops = await page.locator(".map .pops svg.pop").all();
  const wrong: string[] = [];
  for (const pop of pops) {
    const b = await box(pop);
    const grid: [number, number][] = [];
    for (const fx of [0.2, 0.5, 0.8]) for (const fy of [0.2, 0.5, 0.8]) grid.push([b.x + b.width * fx, b.y + b.height * fy]);
    for (const stack of await paintedAt(page, grid)) {
      const p = stack.indexOf("pop");
      const a = stack.findIndex((e) => e.startsWith("avatar:") || e.startsWith("tag:"));
      if (p >= 0 && a > p) wrong.push(stack[a]);
    }
  }
  return wrong;
}

// ======================================================================
// INT-1: the menu
// ======================================================================

// INT-1.1, INT-1.9, INT-2.14 (Slacking: Poke and Slap), INT-2.15 (the cursor)
test("tapping someone else opens a menu naming them, with their state and four moves, and changes nobody else's screen", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo", "Tom"]);
  const mia = await screen(people.Mia, path, { viewport: LAPTOP });
  const tom = await recorded(people.Tom, path);
  const jiwoo = avatar(mia, "Jiwoo");
  // Jiwoo logs a bench set (150 s rest); the hook moves it 190 s back: Slacking
  // (GYM-11). The move takes her last-seen back too, so she opens the room
  // after it, and is seen again: Slacking, not Away.
  await logSet(people.Jiwoo, path, "3");
  await backdate(people.Mia, path, { user: await idOf(mia, "Jiwoo") }, 190_000);
  await screen(people.Jiwoo, path);
  await expect(jiwoo).toHaveAttribute("data-state", "slacking", { timeout: 2000 });
  await expect(jiwoo).toHaveAttribute("aria-label", "Jiwoo, slacking, flat bench 2");
  await expect(jiwoo).toHaveAttribute("aria-haspopup", "menu");
  await expect(jiwoo).toHaveAttribute("aria-expanded", "false");

  await jiwoo.click();
  await expect(menu(mia)).toBeVisible();
  await expect(jiwoo).toHaveAttribute("aria-expanded", "true");
  await expect(mia.locator(".menu .menu-name")).toContainText("Jiwoo");
  const chip = mia.locator(".menu .menu-name .chip.state-slacking");
  await expect(chip).toContainText("Slacking");
  await expect(chip.locator("svg")).toHaveCount(1);
  await expect(mia.locator(".menu .act")).toHaveText(["Cheer", "Poke", "Slap", "Message"]);
  // no emoji in the menu (D1)
  await expect(mia.locator(".menu .tray, .menu [value='fire'], .menu [value='hi']")).toHaveCount(0);
  // Poke and Slap highlighted, with the cursor showing; Cheer and Message not
  for (const kind of ["poke", "slap"]) {
    await expect(act(mia, kind)).toHaveClass(/\bhot\b/);
    await expect(act(mia, kind).locator(".cur")).toBeVisible();
  }
  for (const kind of ["cheer", "message"]) {
    await expect(act(mia, kind)).not.toHaveClass(/\bhot\b/);
    await expect(act(mia, kind).locator(".cur")).toBeHidden();
  }
  // nothing was sent: nothing appeared on Tom's screen, and no menu
  await tom.waitForTimeout(800);
  expect(await seenOn(tom)).toEqual([]);
  await expect(tom.locator(".menu")).toHaveCount(0);
  await expect(avatar(tom, "Jiwoo")).toHaveAttribute("aria-expanded", "false");
});

// INT-2.14 (Lifting: Cheer; anyone else: nothing), INT-2.13 and INT-2.15
// (Slap unavailable with the reason in words, no cursor; tapping it sends
// nothing), INT-2.4 and INT-2.5 (the words), INT-1.11 (Dony)
test("the menu highlights the move that fits, and shows Slap unavailable with the reason on someone mid-set or done", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Kai", "Lena", "Sam", "Noor"]);
  await choose(people.Kai, path, "5"); // Lifting
  await finish(people.Noor, path); // Finished
  await logSet(people.Lena, path, "9"); // Resting
  // Sam stays Idle
  const mia = await screen(people.Mia, path, { viewport: LAPTOP });
  const watcher = await recorded(people.Sam, path);

  const open = async (name: string) => {
    await mia.keyboard.press("Escape");
    await avatar(mia, name).click();
    await expect(menu(mia)).toBeVisible();
    await expect(mia.locator(".menu .menu-name")).toContainText(name);
  };
  const hot = async () => mia.locator(".menu .act.hot").allTextContents();

  await open("Kai");
  expect(await hot()).toEqual(["Cheer"]);
  await expect(mia.locator(".menu .menu-name .chip.state-lifting")).toContainText("Lifting");
  await expect(act(mia, "slap")).toHaveAttribute("aria-disabled", "true");
  await expect(act(mia, "slap").locator(".cur")).toBeHidden();
  await expect(mia.locator(".menu .menu-why")).toHaveText("Kai is mid-set. Cheer instead?");
  await expect(act(mia, "slap")).toBeVisible();
  for (const kind of ["cheer", "poke", "message"]) await expect(act(mia, kind)).not.toHaveAttribute("aria-disabled", "true");
  // a person can tap it (aria-disabled, not disabled); Playwright won't, unforced
  await act(mia, "slap").click({ force: true });
  await expect(menu(mia), "a tap on an unavailable move keeps the menu open").toBeVisible();

  await open("Noor");
  expect(await hot()).toEqual([]);
  await expect(act(mia, "slap")).toHaveAttribute("aria-disabled", "true");
  await expect(mia.locator(".menu .menu-why")).toHaveText("Noor's done for today. Cheer instead?");

  for (const name of ["Lena", "Sam"]) {
    await open(name);
    expect(await hot(), name).toEqual([]);
    await expect(act(mia, "slap")).not.toHaveAttribute("aria-disabled", "true");
  }

  // Dony: the same menu, naming him and his state
  await post(people.Mia, path, { action: "dony", intent: "summon" });
  const dony = mia.locator('.map .avatar[data-look="dony"]');
  await expect(dony).toHaveCount(1, { timeout: 2000 });
  await expect(dony).toHaveAttribute("aria-haspopup", "menu");
  await mia.keyboard.press("Escape");
  await dony.click();
  await expect(mia.locator(".menu .menu-name")).toContainText("Dony");
  await expect(mia.locator(".menu .menu-name .chip")).toHaveClass(/state-(idle|lifting|resting|slacking)/);
  await expect(mia.locator(".menu .act")).toHaveText(["Cheer", "Poke", "Slap", "Message"]);
  // and his squad row opens it too
  await mia.keyboard.press("Escape");
  await row(mia, "Dony").click();
  await expect(mia.locator(".menu .menu-name")).toContainText("Dony");

  // nothing Mia tapped reached anyone
  expect((await seenOn(watcher)).filter((s) => s.what !== "pop")).toEqual([]);
});

// INT-1.2, INT-1.9 (keyboard), D26 (Tab and the arrows)
test("the menu works by keyboard: opens with Enter or Space, keeps focus, Tab and arrows move, Escape returns to the avatar", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo", "Tom"]);
  await logSet(people.Jiwoo, path, "3"); // Resting: nothing highlighted, focus starts on Cheer
  const mia = await screen(people.Mia, path, { viewport: LAPTOP });
  const tom = await recorded(people.Tom, path);
  const jiwoo = avatar(mia, "Jiwoo");
  const focused = () => mia.evaluate(() => document.activeElement?.closest(".menu") ? (document.activeElement as HTMLElement).getAttribute("value") ?? document.activeElement!.textContent!.trim() : `outside: ${document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.tagName}`);

  for (const key of ["Enter", "Space"]) {
    await jiwoo.focus();
    await mia.keyboard.press(key);
    await expect(menu(mia)).toBeVisible();
    expect(await focused(), `${key} moves focus into the menu`).toBe("cheer");
    // Tab, then the arrows, round and round, never out
    const tabbed: string[] = [];
    for (let i = 0; i < 5; i++) {
      await mia.keyboard.press("Tab");
      tabbed.push(await focused());
    }
    expect(tabbed).toEqual(["poke", "slap", "message", "cheer", "poke"]);
    await mia.keyboard.press("Shift+Tab");
    expect(await focused()).toBe("cheer");
    await mia.keyboard.press("Shift+Tab");
    expect(await focused(), "Shift+Tab wraps too").toBe("message");
    await mia.keyboard.press("ArrowDown");
    expect(await focused()).toBe("cheer");
    await mia.keyboard.press("ArrowDown");
    expect(await focused()).toBe("poke");
    await mia.keyboard.press("ArrowUp");
    expect(await focused()).toBe("cheer");
    await mia.keyboard.press("Escape");
    await expect(menu(mia)).toBeHidden();
    await expect(jiwoo).toBeFocused();
    await expect(jiwoo).toHaveAttribute("aria-expanded", "false");
  }
  expect(await seenOn(tom), "nothing was sent").toEqual([]);

  // Enter on an action does it, and so does Space
  await jiwoo.focus();
  await mia.keyboard.press("Enter");
  await mia.keyboard.press("Enter"); // Cheer
  await expect(menu(mia)).toBeHidden();
  await expect(tom.locator(`.map .avatar[aria-label^="Jiwoo,"] svg.fx.fx-cheer`)).toHaveCount(1, { timeout: 1500 });
});

// INT-1.3, INT-1.4 (phone), INT-1.12 (phone: pinned above the dock and the tab)
test("on a phone the menu sits above the dock, and a tap on Start set closes it and starts the set in the same tap", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo"]);
  await logSet(people.Mia, path, "3"); // Mia Resting: Start set in her dock
  const mia = await screen(people.Mia, path, { at: `${path}?exercise=3` });
  await expect(mia.locator(MAIN)).toHaveText("Start set");

  // from the map, then from the squad row scrolled into view: the menu is pinned the same.
  // The button is measured where the page is, just before the tap: scrolling
  // the big rest timer away brings the dock's timer copy beside it (room spec
  // 3.3), which is the scroll's doing, not the menu's.
  for (const how of ["map", "row"] as const) {
    if (how === "row") await row(mia, "Jiwoo").scrollIntoViewIfNeeded();
    // the timer copy's observer settles after a scroll: the button holds still for 500 ms
    const mainBefore = await settled(mia, MAIN);
    if (how === "map") await avatar(mia, "Jiwoo").click();
    else await row(mia, "Jiwoo").click();
    await expect(menu(mia)).toBeVisible();
    const m = await box(menu(mia));
    const dock = await box(mia.locator(".dock"));
    const tab = await box(mia.locator(EMOTE));
    const vw = mia.viewportSize()!.width;
    expect(Math.round(m.x), `${how}: 16 px from the left`).toBe(16);
    expect(Math.round(vw - (m.x + m.width)), `${how}: 16 px from the right`).toBe(16);
    expect(Math.round(dock.y - (m.y + m.height)), `${how}: 56 px above the dock`).toBe(56);
    expect(intersects(m, dock), `${how}: not over the dock`).toBe(false);
    expect(intersects(m, tab), `${how}: not over the emoji tab`).toBe(false);
    expect(m.y, `${how}: on the screen`).toBeGreaterThanOrEqual(0);
    // the dock's button keeps its place, size and label, and nothing covers it
    expect(await box(mia.locator(MAIN)), `${how}: the button as it was before the tap`).toEqual(mainBefore);
    await expect(mia.locator(MAIN)).toHaveText("Start set");
    expect(await dockHitDuring(mia, 200)).toEqual([]);
    await mia.keyboard.press("Escape");
  }

  // a tap outside on Start set: the menu closes and the set starts
  await avatar(mia, "Jiwoo").click();
  await expect(menu(mia)).toBeVisible();
  await mia.locator(MAIN).click();
  await expect(menu(mia)).toBeHidden();
  await expect(mia.locator(MAIN)).toHaveText("Done");
  await expect(mia.locator(".sheet .tab")).toContainText("Lifting");
});

// INT-1.3 (Escape, a tap elsewhere, an action; and Choose acts through it),
// INT-1.12 (laptop: beside the avatar, clear of the tag; from a row, under it)
test("on a laptop the menu opens beside the avatar or under the row, and closes on Escape, a tap away or an action", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo"]);
  await choose(people.Jiwoo, path, "5"); // on squat rack 3, the back row
  const mia = await screen(people.Mia, path, { viewport: LAPTOP });
  const jiwoo = avatar(mia, "Jiwoo");

  await jiwoo.click();
  const m = await box(menu(mia));
  const map = await box(mia.locator(".map-panel .map"));
  const tag = await box(jiwoo.locator(".tag"));
  const sprite = await box(jiwoo);
  expect(intersects(m, tag), "clear of her tag").toBe(false);
  expect(intersects(m, sprite), "beside her, not over her").toBe(false);
  const gap = Math.min(Math.abs(m.x - (sprite.x + sprite.width)), Math.abs(sprite.x - (m.x + m.width)));
  expect(gap, "beside her").toBeLessThanOrEqual(48);
  expect(m.y).toBeLessThan(sprite.y + sprite.height);
  expect(m.y + m.height).toBeGreaterThan(sprite.y);
  expect(intersects(m, map), "on the map").toBe(true);
  // a tap on the map away from it closes it
  await mia.mouse.click(map.x + map.width - 8, map.y + map.height - 8);
  await expect(menu(mia)).toBeHidden();

  // from the squad row, under the row
  await row(mia, "Jiwoo").click();
  const r = await box(row(mia, "Jiwoo"));
  const m2 = await box(menu(mia));
  expect(m2.y).toBeGreaterThanOrEqual(r.y + r.height - 1);
  expect(m2.y - (r.y + r.height)).toBeLessThanOrEqual(24);
  // an action closes it
  await act(mia, "poke").click();
  await expect(menu(mia)).toBeHidden();

  // Mia is Idle: a tap on Choose with the menu open closes it and chooses
  await mia.selectOption("#exercise", "7");
  await jiwoo.click();
  await expect(menu(mia)).toBeVisible();
  await mia.locator(MAIN).click();
  await expect(menu(mia)).toBeHidden();
  await expect(mia.locator(MAIN)).toHaveText("Done");
});

// INT-1.4 and INT-1.12 at 1280 px (the menu never meets the dock)
test("on a laptop the menu never covers the dock or the emoji tab", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo", "Tom", "Priya"]);
  await choose(people.Mia, path, "7");
  await logSet(people.Tom, path, "3"); // at the cooler, near the bottom of the map
  const mia = await screen(people.Mia, path, { viewport: LAPTOP, at: `${path}?exercise=7` });
  for (const name of ["Jiwoo", "Tom", "Priya"]) {
    for (const from of ["map", "row"]) {
      await (from === "map" ? avatar(mia, name) : row(mia, name)).click();
      await expect(menu(mia)).toBeVisible();
      const m = await box(menu(mia));
      expect(intersects(m, await box(mia.locator(".dock"))), `${name} from the ${from}: the dock`).toBe(false);
      expect(intersects(m, await box(mia.locator(EMOTE))), `${name} from the ${from}: the tab`).toBe(false);
      await mia.keyboard.press("Escape");
    }
  }
});

// INT-1.5, INT-3.4 (Mia mid-set, cheering: nothing about her set changes)
test("cheering mid-set leaves the sender's panel as it was, stopwatch running, and Done logs the set as before", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo"]);
  const mia = await screen(people.Mia, path);
  await mia.selectOption("#exercise", "1"); // a run: timed
  await mia.locator(MAIN).click();
  await expect(mia.locator(MAIN)).toHaveText("Done");
  await mia.fill("#distance_km", "2");
  await mia.locator(".sw-toggle").click();
  const sheet = async () => ({
    lifting: /Lifting/.test((await mia.locator(".sheet .tab").textContent()) ?? ""),
    km: await mia.inputValue("#distance_km"),
    main: await box(mia.locator(MAIN)),
    label: await mia.locator(MAIN).textContent(),
  });
  const seconds = async () => Number(await mia.inputValue("#minutes")) * 60 + Number(await mia.inputValue("#seconds"));
  await expect.poll(seconds, { timeout: 3000 }).toBeGreaterThanOrEqual(1);
  const before = await sheet();
  const t0 = await seconds();

  await avatar(mia, "Jiwoo").click();
  await act(mia, "cheer").click();
  await expect(mia.locator(`.map .avatar[aria-label^="Jiwoo,"] svg.fx.fx-cheer`)).toHaveCount(1, { timeout: 1500 });
  expect(await sheet()).toEqual(before);
  await expect.poll(seconds, { timeout: 3000 }).toBeGreaterThan(t0);

  await mia.locator(MAIN).click();
  await expect(mia.locator(".dock .stamp")).toContainText("Set 1 logged");
  await expect(mia.locator(".dock .stamp")).toContainText("2 km");
});

// INT-1.6, INT-2.13 (Slap's availability follows her state), INT-2.6 (from the page)
test("an open menu updates in place when its person's state changes, without closing", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo"]);
  await logSet(people.Jiwoo, path, "3"); // Resting
  const mia = await screen(people.Mia, path, { viewport: LAPTOP });
  await avatar(mia, "Jiwoo").click();
  await expect(mia.locator(".menu .menu-name .chip.state-resting")).toBeVisible();
  await expect(act(mia, "slap")).not.toHaveAttribute("aria-disabled", "true");
  const el = await menu(mia).elementHandle();

  await post(people.Jiwoo, path, { action: "start", exercise_id: "3", weight_kg: "40", reps: "8" });
  await expect(mia.locator(".menu .menu-name .chip.state-lifting")).toBeVisible({ timeout: 1500 });
  await expect(act(mia, "slap")).toHaveAttribute("aria-disabled", "true");
  await expect(mia.locator(".menu .menu-why")).toHaveText("Jiwoo is mid-set. Cheer instead?");
  await expect(mia.locator(".menu .act.hot")).toHaveText(["Cheer"]);
  expect(await el!.evaluate((m) => m.isConnected), "the same menu, not closed and reopened").toBe(true);
});

// INT-1.7
test("the menu closes when its person leaves, and focus goes to the next avatar, or to the dock's button", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo", "Tom"]);
  const mia = await screen(people.Mia, path, { viewport: LAPTOP });
  // tab order on the map: avatars in join order (spec/browser/animations.spec.ts)
  await avatar(mia, "Jiwoo").focus();
  await mia.keyboard.press("Enter");
  await expect(menu(mia)).toBeVisible();
  await post(people.Jiwoo, path, { action: "leave" });
  await expect(menu(mia)).toBeHidden({ timeout: 1500 });
  await expect(avatar(mia, "Tom")).toBeFocused();

  await avatar(mia, "Tom").press("Enter");
  await expect(menu(mia)).toBeVisible();
  await post(people.Tom, path, { action: "leave" });
  await expect(menu(mia)).toBeHidden({ timeout: 1500 });
  await expect(mia.locator(MAIN)).toBeFocused();
});

// INT-1.7 (the room closes: the page does what it does today)
test("the menu goes with the room when the host ends it", async ({ browser }) => {
  const { path, passcode, people } = await room(browser, ["Mia", "Jiwoo"]);
  const jiwoo = await screen(people.Jiwoo, path, { viewport: LAPTOP });
  await avatar(jiwoo, "Mia").click();
  await expect(menu(jiwoo)).toBeVisible();
  await post(people.Mia, path, { action: "end" });
  await expect(jiwoo).toHaveURL(new RegExp(`/\\?ended=${passcode}`), { timeout: 3000 });
});

// INT-1.8, INT-1.10 (your own row opens nothing; others' rows open the menu)
test("your own avatar and row open nothing, and your avatar still jumps to the dock", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo"]);
  const mia = await screen(people.Mia, path);
  const me = mia.locator(".map .avatar.me");
  await expect(me).not.toHaveAttribute("aria-haspopup", /.+/);
  await me.click();
  await expect(mia.locator(MAIN)).toBeFocused();
  await expect(menu(mia)).toHaveCount(0);
  await expect(mia.locator(".tray")).toBeHidden();
  await expect(mia.locator(".people .me .person, .people .me[aria-haspopup]")).toHaveCount(0);
  await mia.locator(".people .me").click();
  await expect(menu(mia)).toHaveCount(0);
  // others' rows are buttons that open it, by tap and by keyboard
  await expect(row(mia, "Jiwoo")).toHaveAttribute("aria-haspopup", "menu");
  await row(mia, "Jiwoo").focus();
  await mia.keyboard.press("Enter");
  await expect(mia.locator(".menu .menu-name")).toContainText("Jiwoo");
  expect(await mia.evaluate(() => !!document.activeElement?.closest(".menu"))).toBe(true);
});

// ======================================================================
// INT-3: reactions and banners
// ======================================================================

// INT-3.1 (it plays on every screen, Mia's and Jiwoo's included), INT-3.2
// (the four wordings), INT-3.3 (two tabs; nobody else), INT-3.4 (no focus,
// not over the dock), INT-3.5 (4 s, newest replaces)
test("the target gets a banner in each wording on every tab of theirs, and everyone sees the reaction", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo", "Tom", "Priya", "Sam", "Kai"]);
  const id = async (page: Page, name: string) => idOf(page, name);
  const jiwoo1 = await recorded(people.Jiwoo, path);
  const jiwoo2 = await recorded(people.Jiwoo, path);
  const tom = await recorded(people.Tom, path);
  const mia = await recorded(people.Mia, path);
  const target = await id(tom, "Jiwoo");
  const fx = (page: Page, kind: string) => page.locator(`.map .avatar[aria-label^="Jiwoo"] svg.fx.fx-${kind}`);
  await jiwoo1.locator(MAIN).focus();
  const mainBefore = await box(jiwoo1.locator(MAIN));

  const cases: [string, BrowserContext, string, string][] = [
    ["cheer", people.Mia, "Mia", "Mia is hyping you up 🔥"],
    ["poke", people.Tom, "Tom", "Tom poked you 👉"], // Idle: the plain wording
    ["slap", people.Priya, "Priya", "Priya slapped you back to work 👋"],
  ];
  for (const [kind, who, , words] of cases) {
    expect((await interact(who, path, target, kind)).status()).toBe(200);
    for (const page of [jiwoo1, jiwoo2]) await expect(page.locator(BANNER)).toHaveText(words, { timeout: 1000 });
    for (const page of [jiwoo1, mia, tom]) await expect(fx(page, kind)).toHaveCount(1, { timeout: 1000 });
  }
  // the banner took no focus, moved nothing, and sits clear of the dock
  await expect(jiwoo1.locator(MAIN)).toBeFocused();
  expect(await box(jiwoo1.locator(MAIN))).toEqual(mainBefore);
  expect(intersects(await box(jiwoo1.locator(BANNER)), await box(jiwoo1.locator(".dock")))).toBe(false);
  await expect(jiwoo1.locator(BANNER)).toHaveAttribute("role", "status");
  await expect(jiwoo1.locator(BANNER)).toHaveCount(1);

  // Resting: Poke's other wording
  await logSet(people.Jiwoo, path, "3");
  await expect(avatar(tom, "Jiwoo")).toHaveAttribute("data-state", "resting", { timeout: 1500 });
  const pokedAt = Date.now();
  expect((await interact(people.Sam, path, target, "poke")).status()).toBe(200);
  await expect(jiwoo2.locator(BANNER)).toHaveText("Sam poked you. Rest's over? 👉", { timeout: 1000 });
  // it goes after 4 s, give or take the frame it came in
  await expect(jiwoo2.locator(BANNER)).toHaveCount(0, { timeout: 5500 });
  expect(Date.now() - pokedAt).toBeGreaterThanOrEqual(3800);

  // nobody but Jiwoo ever had a banner
  for (const page of [tom, mia]) expect((await seenOn(page)).filter((s) => s.what === "banner"), "no banner for others").toEqual([]);
  // and each of hers was one at a time: the newest replaced the last
  const banners = (await seenOn(jiwoo1)).filter((s) => s.what === "banner").map((s) => s.text);
  expect(banners).toEqual(cases.map((c) => c[3]).concat("Sam poked you. Rest's over? 👉"));
});

// INT-3.5 (a new banner restarts the 4 s), INT-3.15 (phone: fixed at the top,
// scrolled to the fields), INT-3.4 (Start set still works while it shows)
test("on a phone the banner is pinned to the top of the screen while scrolled down, and the newest restarts its 4 s", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo", "Tom"]);
  await logSet(people.Jiwoo, path, "3");
  const jiwoo = await screen(people.Jiwoo, path, { viewport: { width: 390, height: 660 }, at: `${path}?exercise=3` });
  const target = await idOf(jiwoo, "Jiwoo");
  await jiwoo.locator("#weight_kg").scrollIntoViewIfNeeded();
  await jiwoo.evaluate(() => window.scrollBy(0, 200));
  const scrolled = await jiwoo.evaluate(() => window.scrollY);
  expect(scrolled).toBeGreaterThan(0);

  expect((await interact(people.Mia, path, target, "cheer")).status()).toBe(200);
  const banner = jiwoo.locator(BANNER);
  await expect(banner).toHaveText("Mia is hyping you up 🔥", { timeout: 1000 });
  const b = await box(banner);
  expect(Math.round(b.y), "8 px from the top of the screen").toBe(8);
  expect(intersects(b, await box(jiwoo.locator(".dock")))).toBe(false);
  expect(await jiwoo.evaluate(() => window.scrollY), "the page didn't scroll").toBe(scrolled);

  // 3 s in, Tom's poke replaces it and runs its own 4 s
  await jiwoo.waitForTimeout(3000);
  const tomAt = Date.now();
  expect((await interact(people.Tom, path, target, "poke")).status()).toBe(200);
  await expect(banner).toHaveText("Tom poked you. Rest's over? 👉", { timeout: 1000 });
  await expect(banner).toHaveCount(1);
  await jiwoo.waitForTimeout(Math.max(0, tomAt + 3000 - Date.now()));
  await expect(banner, "still there 3 s after the newest, 6 s after the first").toHaveText("Tom poked you. Rest's over? 👉");
  // Start set works through it
  await jiwoo.locator(MAIN).click();
  await expect(jiwoo.locator(MAIN)).toHaveText("Done");
});

// INT-3.15 (laptop: centred at the top of the map panel)
test("on a laptop the banner is centred at the top of the map panel", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo"]);
  const jiwoo = await screen(people.Jiwoo, path, { viewport: LAPTOP });
  expect((await interact(people.Mia, path, await idOf(jiwoo, "Jiwoo"), "cheer")).status()).toBe(200);
  const b = await box(jiwoo.locator(BANNER));
  const panel = await box(jiwoo.locator(".map-panel"));
  expect(Math.abs(b.x + b.width / 2 - (panel.x + panel.width / 2))).toBeLessThanOrEqual(2);
  expect(b.y).toBeGreaterThanOrEqual(panel.y);
  expect(b.y - panel.y).toBeLessThanOrEqual(48);
});

// INT-3.6, INT-5.6 (a bubble's time left; one 5 s old shows none), INT-8.10
// (an emoji within its 3 s is not shown to a page that opens), INT-3.7 (with
// her page closed, no banner then or later, and she finds it in the log)
test("a page opened after the fact plays no old reaction, banner or emoji, and shows a bubble only for its time left", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo", "Tom"]);
  const tom = await recorded(people.Tom, path);
  const jiwooId = await idOf(tom, "Jiwoo");
  const miaId = await idOf(tom, "Mia");
  // Jiwoo has no page open: poked, slapped, a preset to her, Mia's emoji
  expect((await interact(people.Mia, path, jiwooId, "poke")).status()).toBe(200);
  expect((await interact(people.Tom, path, jiwooId, "slap")).status()).toBe(200);
  expect((await emote(people.Mia, path, "fire")).status()).toBe(200);
  const saidAt = Date.now();
  expect((await sayTo(people.Mia, path, jiwooId, "nudge-1")).status()).toBe(200);
  expect((await sayTo(people.Tom, path, miaId, "hype-1")).status()).toBe(200);
  // the reaction played for Tom, who was watching
  await expect(tom.locator(`.map .avatar[aria-label^="Jiwoo"] svg.fx`)).not.toHaveCount(0, { timeout: 1000 });

  // 2 s later Jiwoo opens the room: the bubbles, for their last 3 s; nothing else
  await tom.waitForTimeout(Math.max(0, saidAt + 2000 - Date.now()));
  const jiwoo = await recorded(people.Jiwoo, path);
  await expect(jiwoo.locator(".map .says .say")).toHaveCount(2);
  await expect(jiwoo.locator(".map .says .say", { hasText: "Put the phone down 📵" })).toContainText("@Jiwoo");
  await expect(jiwoo.locator(".map .says .say")).toHaveCount(0, { timeout: 4000 });
  expect(Date.now() - saidAt).toBeGreaterThanOrEqual(4600);
  const seen = await seenOn(jiwoo);
  expect(seen.filter((s) => s.what !== "say"), "no reaction, banner or pop").toEqual([]);
  // she finds them in the log instead
  const log = jiwoo.locator(".room-log li:not(.joined)");
  await expect(log.filter({ hasText: "Mia poked you" })).toHaveCount(1);
  await expect(log.filter({ hasText: "Tom slapped you" })).toHaveCount(1);

  // a reload 6 s after: no bubble at all
  await jiwoo.reload();
  await expect(jiwoo.locator(".map-panel .conn .badge")).toHaveText("Live");
  await jiwoo.waitForTimeout(500);
  expect(await seenOn(jiwoo)).toEqual([]);
});

// INT-3.8 (over the machine, which keeps playing; the tag stays), INT-3.9
// and INT-8.14 (reduced motion: still, and the banner still comes)
test("a reaction plays over someone on a machine without stopping it, and with reduced motion holds still", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo", "Tom"]);
  await choose(people.Jiwoo, path, "5"); // the squat rack
  const tom = await recorded(people.Tom, path, { viewport: LAPTOP });
  const reduced = await recorded(people.Jiwoo, path, { reduced: true, viewport: LAPTOP });
  const jiwoo = avatar(tom, "Jiwoo");
  await expect(jiwoo).toHaveAttribute("data-pose", "squat-rack", { timeout: 5000 });
  const tagBefore = await box(jiwoo.locator(".tag"));
  const target = await idOf(tom, "Jiwoo");

  expect((await interact(people.Mia, path, target, "slap")).status()).toBe(409); // Lifting: refused
  expect((await interact(people.Mia, path, target, "cheer")).status()).toBe(200);
  const fx = jiwoo.locator("svg.fx.fx-cheer");
  await expect(fx).toHaveCount(1, { timeout: 1000 });
  expect(await box(jiwoo.locator(".tag")), "her tag stays put").toEqual(tagBefore);
  await expect(jiwoo).toHaveAttribute("data-pose", "squat-rack");
  await expect(fx, "under a second").toHaveCount(0, { timeout: 1200 });
  // the rack's two frames kept swapping while the reaction was on her
  const during = (await framesOn(tom)).filter((f) => f.id === String(target) && f.fx);
  expect(new Set(during.map((f) => f.frame)), "the machine kept playing under the reaction").toEqual(new Set([1, 2]));

  // reduced motion: her banner comes, and the reaction holds one frame, still
  await expect(reduced.locator(BANNER)).toHaveText("Mia is hyping you up 🔥", { timeout: 1000 });
  const held = (await seenOn(reduced)).filter((s) => s.what === "fx");
  expect(held.length, "the reaction is shown").toBeGreaterThan(0);
  expect(new Set(held.map((s) => s.use)).size, "one frame, not a sequence").toBe(1);
  const moving = await reduced.evaluate(() =>
    document.getAnimations().filter((a) => a.playState === "running" && ((a.effect as KeyframeEffect | null)?.target as Element | null)?.closest?.(".map svg.fx, .banner-slot")).length,
  );
  expect(moving, "nothing moves").toBe(0);
});

// INT-3.10 and INT-5.16 (a failed send: the red line, nothing anywhere),
// INT-3.14 (a refusal: the calm dashed line, role=status, where the menu was)
test("a refusal shows a calm line where the menu was, and a failed send the red one, with nothing played", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Kai", "Tom"]);
  const tom = await recorded(people.Tom, path);
  // Mia's page has its first render only: Kai as Idle, Slap offered
  const mia = await screen(people.Mia, path, { stale: true });
  await choose(people.Kai, path, "5"); // now Lifting, on the server
  await avatar(mia, "Kai").click();
  await expect(act(mia, "slap")).not.toHaveAttribute("aria-disabled", "true");
  await act(mia, "slap").click();
  await expect(menu(mia), "the menu closes at once").toBeHidden();
  const note = mia.locator("p.note");
  await expect(note).toHaveText("Kai is mid-set. Cheer instead?", { timeout: 1500 });
  await expect(note).toHaveAttribute("role", "status");
  expect(await note.evaluate((n) => getComputedStyle(n).borderTopStyle)).toBe("dashed");
  const colours = await note.evaluate((n) => [getComputedStyle(n).color, getComputedStyle(n).backgroundColor, getComputedStyle(n).borderTopColor]);
  for (const c of colours) expect(c, "never red").not.toMatch(/rgb\(163, 36, 27\)|rgb\(255, 107, 94\)/);
  // on a phone: just above the dock, on the left, clear of the tab and the button
  const n = await box(note);
  const dock = await box(mia.locator(".dock"));
  expect(n.y + n.height).toBeLessThanOrEqual(dock.y + 1);
  expect(dock.y - (n.y + n.height)).toBeLessThanOrEqual(24);
  expect(intersects(n, await box(mia.locator(EMOTE)))).toBe(false);
  expect(intersects(n, await box(mia.locator(MAIN)))).toBe(false);
  expect(n.x).toBeLessThan(dock.x + dock.width / 2);
  const shownAt = Date.now();
  await expect(note).toHaveCount(0, { timeout: 5000 });
  expect(Date.now() - shownAt, "about 4 s").toBeGreaterThanOrEqual(3000);
  // and nothing played anywhere
  expect((await seenOn(tom)).filter((s) => s.what === "fx")).toEqual([]);

  // a failure: no connection for the send; nothing played or logged
  const live = await screen(people.Mia, path);
  await live.route(`**${path}`, (route) => (route.request().method() === "POST" ? route.abort() : route.continue()));
  await avatar(live, "Tom").click();
  await act(live, "cheer").click();
  const error = live.locator("p.error[role=alert]", { hasText: "That didn't send. Try again." });
  await expect(error).toBeVisible({ timeout: 1500 });
  expect(await error.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe("rgb(163, 36, 27)");
  // a preset fails the same way
  await expect(error).toHaveCount(0, { timeout: 5000 });
  await avatar(live, "Tom").click();
  await act(live, "message").click();
  await live.locator('.menu .preset[value="hype-1"]').click();
  await expect(live.locator("p.error[role=alert]", { hasText: "That didn't send. Try again." })).toBeVisible({ timeout: 1500 });
  await live.waitForTimeout(800);
  expect(await seenOn(tom), "nothing played or showed").toEqual([]);
  await expect(tom.locator(".room-log li", { hasText: "One more rep" })).toHaveCount(0);
  await expect(live.locator(".room-log li", { hasText: "One more rep" })).toHaveCount(0);
});

// INT-3.14 (the refusal's words for Lifting, Finished and gone, on a laptop beside the target)
test("a refused slap or a target who has gone shows the server's reason beside them on a laptop", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Kai", "Noor", "Tom"]);
  // the page as it first rendered: all three Idle, Slap offered on each
  const mia = await screen(people.Mia, path, { viewport: LAPTOP, stale: true });
  await choose(people.Kai, path, "5");
  await finish(people.Noor, path);
  await post(people.Tom, path, { action: "leave" });
  for (const [name, words] of [
    ["Kai", "Kai is mid-set. Cheer instead?"],
    ["Noor", "Noor's done for today. Cheer instead?"],
    ["Tom", "Tom's left the gym."],
  ] as const) {
    const target = await box(avatar(mia, name));
    await avatar(mia, name).click();
    await act(mia, "slap").click();
    const note = mia.locator("p.note");
    await expect(note).toHaveText(words, { timeout: 1500 });
    const n = await box(note);
    const gap = Math.min(Math.abs(n.x - (target.x + target.width)), Math.abs(target.x - (n.x + n.width)));
    expect(gap, `${name}: beside them`).toBeLessThanOrEqual(64);
    expect(intersects(n, await box(mia.locator(".map-panel .map"))), `${name}: on the map`).toBe(true);
    await expect(note).toHaveCount(0, { timeout: 5000 });
  }
});

// INT-3.16 (no sound for an emoji, and none for a banner with sound off).
// The page's sound is Web Audio (system.md 11); this counts oscillators started.
// INT-3.16 as the user settled it on 22 Oct: interactions and emoji make no
// sound. The page's only sound is Web Audio (system.md 11); this counts every
// oscillator started, and checks the counter is live by starting one itself.
test("interactions, presets and emoji, anyone's or Dony's, start no sound", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo"]);
  const page = await people.Jiwoo.newPage();
  await page.addInitScript(() => {
    const w = window as unknown as { __sounds: number };
    w.__sounds = 0;
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...args: Parameters<typeof start>) {
      w.__sounds++;
      return start.apply(this, args);
    };
  });
  await page.goto(path);
  await expect(page.locator(".map-panel .conn .badge")).toHaveText("Live");
  await page.locator(".map-panel .map-sign").click(); // a tap lets the page make sound at all
  const sounds = () => page.evaluate(() => (window as unknown as { __sounds: number }).__sounds);
  const jiwooId = await idOf(page, "Jiwoo");
  // to her: a cheer (banner), a preset; from anyone: emoji, Dony's Hi
  await post(people.Mia, path, { action: "dony", intent: "summon" });
  await expect(page.locator('.map .pops svg.pop use[href$="#em-hi"]')).toHaveCount(1, { timeout: 4000 });
  expect((await interact(people.Mia, path, jiwooId, "cheer")).status()).toBe(200);
  await expect(page.locator(BANNER)).toBeVisible({ timeout: 1000 });
  expect((await sayTo(people.Mia, path, jiwooId, "nudge-1")).status()).toBe(200);
  expect((await emote(people.Mia, path, "fire")).status()).toBe(200);
  await page.locator(EMOTE).click();
  await page.locator('.tray button[value="clap"]').click();
  await expect(page.locator(".map .says .say")).toHaveCount(1, { timeout: 1000 });
  await page.waitForTimeout(500);
  expect(await sounds(), "no sound for any of it").toBe(0);
  // the counter itself works
  await page.evaluate(() => {
    const a = new AudioContext();
    const o = a.createOscillator();
    o.start();
    o.stop();
  });
  expect(await sounds()).toBe(1);
});

// INT-3.18 (emoji inside text are the phone's glyphs; the eight sent are pixel art)
test("emoji in banners, bubbles and the log are text, and the sent emoji are pixel art", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo"]);
  const jiwoo = await screen(people.Jiwoo, path);
  const target = await idOf(jiwoo, "Jiwoo");
  expect((await interact(people.Mia, path, target, "poke")).status()).toBe(200);
  await expect(jiwoo.locator(BANNER)).toContainText("👉", { timeout: 1000 });
  await expect(jiwoo.locator(`${BANNER} img`)).toHaveCount(0);
  expect((await sayTo(people.Mia, path, target, "nudge-1")).status()).toBe(200);
  await expect(jiwoo.locator(".map .says .say")).toContainText("📵", { timeout: 1000 });
  await expect(jiwoo.locator(".room-log li", { hasText: "Put the phone down 📵" })).toHaveCount(1);
  // the tray and a pop draw the art
  await jiwoo.locator(EMOTE).click();
  for (const key of ["hi", "flex", "fire", "clap", "haha", "dead", "eyes", "love"]) {
    await expect(jiwoo.locator(`.tray button[value="${key}"] svg use`)).toHaveAttribute("href", new RegExp(`#em-${key}$`));
  }
  await jiwoo.locator('.tray button[value="fire"]').click();
  await expect(jiwoo.locator(".map .pops svg.pop use")).toHaveAttribute("href", /#em-fire$/, { timeout: 1000 });
});

// INT-3.11 (browser: Dony reacts on every screen, and nobody gets a banner)
test("cheering Dony plays his reaction on every screen, and gives nobody a banner", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const mia = await screen(people.Mia, path);
  const tom = await recorded(people.Tom, path);
  await post(people.Mia, path, { action: "dony", intent: "summon" });
  const dony = mia.locator('.map .avatar[data-look="dony"]');
  await expect(dony).toHaveCount(1, { timeout: 2000 });
  await dony.click();
  await act(mia, "cheer").click();
  for (const page of [mia, tom]) await expect(page.locator('.map .avatar[data-look="dony"] svg.fx.fx-cheer')).toHaveCount(1, { timeout: 1500 });
  await mia.waitForTimeout(500);
  expect((await seenOn(tom)).filter((s) => s.what === "banner")).toEqual([]);
  await expect(mia.locator(BANNER)).toHaveCount(0);
});

// ======================================================================
// INT-4: the limit on the page
// ======================================================================

// INT-4.5 (a double tap: one cheer, no message), INT-4.7 (unavailable for 10 s
// with the words, back by itself; Message and the emoji tab stay)
test("a double-tapped Cheer sends one, and the menu shows the 10 s until they come back by themselves", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo", "Tom"]);
  const mia = await people.Mia.newPage();
  await mia.setViewportSize(LAPTOP);
  // the page's own clock, so its 10 s can be moved past rather than waited out
  await mia.clock.install();
  await mia.goto(path);
  await expect(mia.locator(".map-panel .conn .badge")).toHaveText("Live");
  const tom = await recorded(people.Tom, path);
  await avatar(mia, "Jiwoo").click();
  const tappedAt = Date.now();
  await act(mia, "cheer").dblclick();
  await expect(tom.locator(`.map .avatar[aria-label^="Jiwoo"] svg.fx.fx-cheer`)).toHaveCount(1, { timeout: 1500 });
  await mia.waitForTimeout(800);
  expect((await seenOn(tom)).filter((s) => s.what === "fx")).toHaveLength(1);
  await expect(mia.locator("p.note")).toHaveCount(0);
  await expect(mia.locator(".room-log li", { hasText: "You cheered Jiwoo" })).toHaveCount(1);

  // reloaded and reopened within the 10 s: still unavailable
  await mia.clock.install();
  await mia.reload();
  await expect(mia.locator(".map-panel .conn .badge")).toHaveText("Live");
  await avatar(mia, "Jiwoo").click();
  for (const kind of ["cheer", "poke", "slap"]) await expect(act(mia, kind)).toHaveAttribute("aria-disabled", "true");
  await expect(act(mia, "message")).not.toHaveAttribute("aria-disabled", "true");
  await expect(mia.locator(".menu .menu-why")).toHaveText("Easy, give them 10 seconds.");
  await expect(mia.locator(EMOTE)).not.toHaveAttribute("aria-disabled", "true");
  for (const kind of ["cheer", "poke", "slap"]) await expect(act(mia, kind).locator(".cur")).toBeHidden();
  // and back without reopening, at 10 s: the page's clock moves 8.5 s on
  // (still unavailable), then past 10 s from the tap (available again)
  await mia.clock.runFor(Math.max(0, tappedAt + 8_500 - Date.now()));
  await expect(act(mia, "cheer")).toHaveAttribute("aria-disabled", "true");
  await mia.clock.runFor(2_000);
  await expect(act(mia, "cheer")).not.toHaveAttribute("aria-disabled", "true", { timeout: 1000 });
  await expect(act(mia, "poke")).not.toHaveAttribute("aria-disabled", "true");
  await expect(act(mia, "slap")).not.toHaveAttribute("aria-disabled", "true");
  await expect(mia.locator(".menu .menu-why")).toBeHidden();
});

// ======================================================================
// INT-5: presets, bubbles and the room log
// ======================================================================

// INT-5.1 (ten presets, two groups, no confirm), INT-5.4 (the bubble above the
// sender, addressed, on every screen), INT-5.5 (5 s; a new one replaces;
// others' together), INT-5.7 (the log, live, on every screen), INT-5.11
// (only the addressee's screen reader hears it; no banner)
test("Message offers the ten presets, and one tap puts an addressed bubble over the sender on every screen", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo", "Tom"]);
  const mia = await screen(people.Mia, path);
  const jiwoo = await recorded(people.Jiwoo, path);
  const tom = await recorded(people.Tom, path);
  await avatar(mia, "Jiwoo").click();
  await act(mia, "message").click();
  // the same box, its four moves swapped for the presets (room spec I.2)
  for (const kind of ["cheer", "poke", "slap", "message"]) await expect(act(mia, kind), `${kind} gives way to the presets`).toBeHidden();
  const groups = mia.locator(".menu .presets[role=group]");
  await expect(groups).toHaveCount(2);
  await expect(mia.locator(".menu-group")).toHaveText(["Hype", "Nudge"]);
  await expect(groups.nth(0).locator(".preset")).toHaveText(["One more rep! 💪", "Light weight!", "Let's gooo 🔥", "Lock in 🔒", "That's a W set 🏆"]);
  await expect(groups.nth(1).locator(".preset")).toHaveText(["Put the phone down 📵", "Rest's over, mate ⏰", "I can see you 👀", "Bro is scrolling 💀", "Water break or nap? 😴"]);

  const sentAt = Date.now();
  await mia.locator('.menu .preset[value="nudge-1"]').click();
  await expect(menu(mia)).toBeHidden();
  for (const page of [mia, jiwoo, tom]) {
    const bubble = page.locator(".map .says .say");
    await expect(bubble).toHaveCount(1, { timeout: 1000 });
    await expect(bubble).toContainText("Put the phone down 📵");
    await expect(bubble.locator(".to")).toHaveText("@Jiwoo");
    // above Mia: on her tile
    await onSendersTile(page, ".map .says .say", "Mia");
    await expect(page.locator(".room-log li").first()).toContainText('"Put the phone down 📵"', { timeout: 1000 });
  }
  await expect(mia.locator(".room-log li").first()).toContainText("You @Jiwoo");
  await expect(tom.locator(".room-log li").first()).toContainText("Mia @Jiwoo");
  // only Jiwoo hears it, once; no banner for anyone
  await expect(jiwoo.locator("#sheet-news")).toContainText("Mia: Put the phone down");
  await expect(tom.locator("#sheet-news")).not.toContainText("Put the phone down");
  expect((await seenOn(jiwoo)).filter((s) => s.what === "banner")).toEqual([]);

  // Tom's bubble shows at the same time as Mia's
  expect((await sayTo(people.Tom, path, await idOf(tom, "Mia"), "hype-3")).status()).toBe(200);
  await expect(jiwoo.locator(".map .says .say")).toHaveCount(2, { timeout: 1000 });
  // Mia's next preset (after her 2 s) replaces hers and runs its own 5 s
  await mia.waitForTimeout(Math.max(0, sentAt + 2600 - Date.now()));
  const secondAt = Date.now();
  expect((await sayTo(people.Mia, path, await idOf(mia, "Tom"), "nudge-3")).status()).toBe(200);
  const mias = jiwoo.locator(".map .says .say", { hasText: "@Tom" });
  await expect(mias).toHaveCount(1, { timeout: 1000 });
  await expect(jiwoo.locator(".map .says .say", { hasText: "Put the phone down" })).toHaveCount(0);
  await jiwoo.waitForTimeout(Math.max(0, secondAt + 4000 - Date.now()));
  await expect(mias, "still there at 4 s").toHaveCount(1);
  await expect(mias).toHaveCount(0, { timeout: 2000 });
  expect(Date.now() - secondAt).toBeGreaterThanOrEqual(4600);
});

// INT-5.9, INT-5.21 (newest first, five, then "Show older (n more)"; new at
// the top without being announced), INT-5.22 (you, and the leaf edge), INT-5.23
// ("You walked in", only with entries on both sides)
test("the room log starts empty, fills newest first, keeps the rest behind Show older, and marks you and when you came", async ({ browser }) => {
  const { path, passcode, people } = await room(browser, ["Mia", "Jiwoo", "Tom", "Priya"]);
  const mia = await screen(people.Mia, path);
  await expect(mia.locator(".room-log .empty")).toHaveText("Quiet in here. Tap someone on the map to cheer them on 👀");
  await expect(mia.locator(".room-log li.joined")).toHaveCount(0);
  const ids = { Mia: await idOf(mia, "Mia"), Jiwoo: await idOf(mia, "Jiwoo"), Tom: await idOf(mia, "Tom"), Priya: await idOf(mia, "Priya") };
  // six from before Sam joins
  for (const [from, to, kind] of [
    ["Jiwoo", "Tom", "cheer"],
    ["Tom", "Priya", "poke"],
    ["Priya", "Jiwoo", "slap"],
    ["Jiwoo", "Mia", "poke"],
    ["Tom", "Mia", "cheer"],
    ["Priya", "Tom", "cheer"],
  ] as const) expect((await interact(people[from], path, ids[to], kind)).status()).toBe(200);
  await expect(mia.locator(".room-log .empty")).toHaveCount(0, { timeout: 1000 });
  const lines = mia.locator(".room-log > ol > li");
  await expect(lines).toHaveCount(5);
  await expect(lines.first()).toContainText("Priya cheered Tom");
  await expect(mia.locator(".room-log .older > summary")).toHaveText("Show older (1 more)");
  await expect(mia.locator(".room-log li", { hasText: "Tom cheered you" })).toHaveClass(/\byou\b/);
  await expect(mia.locator(".room-log li", { hasText: "Jiwoo poked you" })).toHaveClass(/\byou\b/);
  await expect(mia.locator(".room-log li", { hasText: "Priya cheered Tom" })).not.toHaveClass(/\byou\b/);
  const edge = (l: Element) => `${getComputedStyle(l).borderLeftWidth} ${getComputedStyle(l).borderLeftColor} ${getComputedStyle(l).boxShadow}`;
  expect(await mia.locator(".room-log li.you").first().evaluate(edge), "a leaf edge on lines about you only").not.toBe(
    await mia.locator(".room-log li:not(.you):not(.joined)").first().evaluate(edge),
  );
  // the log isn't announced
  await expect(mia.locator(".room-log [aria-live]:not([aria-live=off]), .room-log[role=log], .room-log [role=status]")).toHaveCount(0);

  // Sam walks in, and Mia cheers Sam after: the line sits between
  const sam = await person(browser, "Sam");
  await join(sam, passcode);
  const samPage = await screen(sam, path);
  await expect(samPage.locator(".room-log li.joined")).toHaveCount(0); // nothing after yet
  expect((await interact(people.Mia, path, await idOf(samPage, "Sam"), "cheer")).status()).toBe(200);
  await expect(samPage.locator(".room-log li").first()).toContainText("Mia cheered you", { timeout: 1000 });
  await expect(samPage.locator(".room-log li").first()).toHaveClass(/\byou\b/);
  await expect(mia.locator(".room-log li").first()).toContainText("You cheered Sam");
  await samPage.reload();
  const joined = samPage.locator(".room-log li.joined");
  await samPage.locator(".room-log .older > summary").click();
  await expect(joined).toHaveCount(1);
  await expect(joined).toHaveText(/You walked in · \d{1,2}:\d\d\s?[ap]m/);
  const texts = await samPage.locator(".room-log li").allTextContents();
  const at = texts.findIndex((t) => t.startsWith("You walked in"));
  expect(texts[at - 1]).toContain("Mia cheered you");
  expect(texts[at + 1]).toContain("Priya cheered Tom");
});

// INT-5.18 (overlapping bubbles: newer on top), INT-5.19 (back row: below;
// with a pop, the bubble steps over it), INT-8.7 (a pop never hides a bubble)
test("bubbles on the back row hang below, the newer of two draws on top, and an emoji never hides one", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo", "Tom", "Priya"]);
  await choose(people.Mia, path, "1"); // treadmill 1, the back row, column 1
  await choose(people.Tom, path, "3"); // flat bench 2, the back row, column 3
  const page = await screen(people.Priya, path);
  const id = { Jiwoo: await idOf(page, "Jiwoo"), Priya: await idOf(page, "Priya") };
  expect((await sayTo(people.Mia, path, id.Jiwoo, "nudge-1")).status()).toBe(200);
  await page.waitForTimeout(100);
  expect((await sayTo(people.Tom, path, id.Jiwoo, "nudge-4")).status()).toBe(200);
  const miaSay = page.locator(".map .says .say", { hasText: "Put the phone down" });
  const tomSay = page.locator(".map .says .say", { hasText: "Bro is scrolling" });
  await expect(miaSay).toHaveClass(/\bbelow\b/, { timeout: 1000 });
  await expect(tomSay).toHaveClass(/\bbelow\b/);
  // below them: under the tag
  expect((await box(miaSay)).y).toBeGreaterThan((await box(avatar(page, "Mia").locator(".tag"))).y);
  // two tiles apart at 1x, the two overlap (INT-5.18's premise), and Tom's,
  // the newer, is on top where they do
  const a = await box(miaSay);
  const b = await box(tomSay);
  expect(intersects(a, b), "the premise: two tiles apart at 1x, the two bubbles overlap").toBe(true);
  const x = (Math.max(a.x, b.x) + Math.min(a.x + a.width, b.x + b.width)) / 2;
  const y = (Math.max(a.y, b.y) + Math.min(a.y + a.height, b.y + b.height)) / 2;
  const [stack] = await paintedAt(page, [[x, y]]);
  expect(stack.find((e) => e.startsWith("say:")), "the newer on top").toContain("Bro is scrolling");
  // neither moved over a name tag
  for (const name of ["Mia", "Tom"]) {
    const tag = await box(avatar(page, name).locator(".tag"));
    expect(intersects(a, tag) || intersects(b, tag), `no bubble over ${name}'s tag`).toBe(false);
  }
  // the log keeps both in full
  await expect(page.locator(".room-log li", { hasText: "Put the phone down 📵" })).toHaveCount(1);
  await expect(page.locator(".room-log li", { hasText: "Bro is scrolling 💀" })).toHaveCount(1);

  // Jiwoo, off the back row: a preset, then her emoji; both show
  expect((await sayTo(people.Jiwoo, path, id.Priya, "hype-2")).status()).toBe(200);
  expect((await emote(people.Jiwoo, path, "fire")).status()).toBe(200);
  const bubble = page.locator(".map .says .say", { hasText: "Light weight!" });
  const pop = page.locator(".map .pops svg.pop");
  await expect(pop).toHaveCount(1, { timeout: 1000 });
  await expect(bubble).toBeVisible();
  await expect(bubble).not.toHaveClass(/\bbelow\b/);
  expect(intersects(await box(bubble), await box(pop)), "the bubble steps up over the pop").toBe(false);
  expect((await box(bubble)).y + (await box(bubble)).height).toBeLessThanOrEqual((await box(pop)).y + 1);
});

// ======================================================================
// INT-8: emoji on the page
// ======================================================================

// INT-8.1 (in every panel state, two taps, the state kept), INT-8.2 (the
// eight, words, no confirm, tray closes), INT-8.20 (52 x 48 on the dock's
// border; the button unmoved), INT-8.21 (the tray: above the tab, 48 px
// clear, 4 x 2 of 64 px, in order), INT-8.4 (nothing moves the main button;
// tapping it with the tray open closes the tray and acts), INT-8.3 (the pop
// over the sender on every screen, 3 s), INT-8.22 (the tab wears it for 1 s)
for (const width of [390, 1280]) {
  test(`at ${width} px the emoji tab rides the dock in every state, and two taps send one without touching the set`, async ({ browser }) => {
    test.setTimeout(60_000);
    const { path, people } = await room(browser, ["Mia", "Tom"]);
    const viewport = { width, height: width === 390 ? 844 : 900 };
    const mia = await screen(people.Mia, path, { viewport });
    const tom = await recorded(people.Tom, path);

    // a different emoji in each state, so a pop left from the last can't pass
    const check = async (label: string, main: string, key: string, waitOut = false) => {
      await expect(mia.locator(MAIN)).toHaveText(main);
      const tab = mia.locator(EMOTE);
      await expect(tab, label).toBeVisible();
      await expect(tab).toHaveAttribute("aria-label", "Send an emoji");
      const t = await box(tab);
      const dock = await box(mia.locator(".dock"));
      const btn = await box(mia.locator(MAIN));
      expect([Math.round(t.width), Math.round(t.height)], `${label}: 52 x 48`).toEqual([52, 48]);
      expect(t.y + t.height, `${label}: rises out of the dock's top border`).toBeLessThanOrEqual(dock.y + 6);
      expect(t.x + t.width, `${label}: on the right`).toBeGreaterThan(dock.x + dock.width / 2);
      expect(intersects(t, btn), `${label}: off the button`).toBe(false);
      // the main button is as wide as the dock lets it be, with or without the tab
      const without = await mia.evaluate((sel) => {
        const tab = document.querySelector<HTMLElement>(".dock button.emote")!;
        const b = document.querySelector(sel)!;
        tab.style.display = "none";
        const r = b.getBoundingClientRect();
        tab.style.display = "";
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }, MAIN);
      const round = (b: Box) => [b.x, b.y, b.width, b.height].map((v) => Math.round(v));
      expect(round(btn), `${label}: the button is where it would be without the tab`).toEqual(round(without));

      // the tray: above the tab, right-aligned, 48 px clear of the dock
      await tab.click();
      const tray = mia.locator(".tray");
      await expect(tray).toBeVisible();
      await expect(tab).toHaveAttribute("aria-expanded", "true");
      const buttons = tray.locator("button");
      await expect(buttons).toHaveText(["Hi", "Flex", "Fire", "Clap", "Haha", "Dead", "Eyes", "Love"]);
      const boxes = await Promise.all((await buttons.all()).map(box));
      for (const b of boxes) expect([Math.round(b.width), Math.round(b.height)]).toEqual([64, 64]);
      expect(new Set(boxes.slice(0, 4).map((b) => Math.round(b.y))).size, "Hi to Clap on one row").toBe(1);
      expect(new Set(boxes.slice(4).map((b) => Math.round(b.y))).size, "Haha to Love on the next").toBe(1);
      expect(boxes[4].y).toBeGreaterThan(boxes[0].y);
      const tr = await box(tray);
      expect(dock.y - (tr.y + tr.height), `${label}: 48 px above the dock`).toBeGreaterThanOrEqual(47);
      expect(Math.abs(tr.x + tr.width - (t.x + t.width)), `${label}: right-aligned over the tab`).toBeLessThanOrEqual(16);
      expect(tr.x).toBeGreaterThanOrEqual(0);
      expect(round(await box(mia.locator(MAIN))), `${label}: the tray moved nothing`).toEqual(round(btn));
      expect(await dockHitDuring(mia, 150), `${label}: nothing over the button with the tray open`).toEqual([]);

      // one tap sends; the tray closes; the pop goes over Mia on both screens
      const sentAt = Date.now();
      await tray.locator(`button[value="${key}"]`).click();
      await expect(tray).toBeHidden();
      for (const page of [mia, tom]) {
        const pop = page.locator(".map .pops svg.pop");
        await expect(pop).toHaveCount(1, { timeout: 1000 });
        await expect(pop.locator("use")).toHaveAttribute("href", new RegExp(`#em-${key}$`));
        await onSendersTile(page, ".map .pops svg.pop", "Mia");
      }
      // the tab wears it for the second, then its icon again
      await expect(tab).toHaveAttribute("aria-label", `Send an emoji (sent: ${key})`);
      await expect(tab).toHaveAttribute("aria-disabled", "true");
      await expect(tab.locator("use")).toHaveAttribute("href", new RegExp(`#em-${key}$`));
      await expect(tab).toHaveAttribute("aria-label", "Send an emoji", { timeout: 1500 });
      await expect(tab).not.toHaveAttribute("aria-disabled", "true");
      await expect(mia.locator(".dock .stamp:has-text('Sent')")).toHaveCount(0);
      // the pop goes at 3 s (waited out once; the 3 s is INT-8.3's, the same in every state)
      if (waitOut) {
        await expect(tom.locator(".map .pops svg.pop")).toHaveCount(0, { timeout: 3500 });
        expect(Date.now() - sentAt).toBeGreaterThanOrEqual(2800);
      }
      await expect(mia.locator(MAIN), `${label}: still ${main}`).toHaveText(main);
    };

    // Choose (Idle)
    await check("Idle", "Choose", "fire", true);
    // Done (Lifting), with the tray open the dock's button closes it and acts
    await mia.selectOption("#exercise", "3");
    await mia.locator(MAIN).click();
    await check("Lifting", "Done", "flex");
    await mia.fill("#weight_kg", "40");
    await mia.fill("#reps", "8");
    await mia.locator(EMOTE).click();
    await expect(mia.locator(".tray")).toBeVisible();
    await mia.locator(MAIN).click();
    await expect(mia.locator(".tray")).toBeHidden();
    await expect(mia.locator(".dock .stamp")).toContainText("Set 1 logged");
    // Start set (Resting); the stamp from Done stays untouched by an emoji
    await check("Resting", "Start set", "clap");
    // Save (editing a set)
    const href = (await mia.locator(".log a[href*='edit=']").first().getAttribute("href"))!;
    await mia.goto(`${path}?edit=${href.match(/edit=(\d+)/)![1]}`);
    await expect(mia.locator(".map-panel .conn .badge")).toHaveText("Live");
    await check("Editing", "Save", "love");
  });
}

// INT-8.1 (Slacking, and a pending button), INT-8.5 (the rest keeps counting)
test("a slacker can send an emoji and stays slacking, and so can someone whose Done is still on its way", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  await logSet(people.Mia, path, "3"); // bench: 150 s rest
  const tom = await screen(people.Tom, path);
  // the hook moves her set 190 s back: Slacking (GYM-11)
  await backdate(people.Tom, path, { user: await idOf(tom, "Mia") }, 190_000);
  const mia = await screen(people.Mia, path, { at: `${path}?exercise=3` });
  await expect(avatar(tom, "Mia")).toHaveAttribute("data-state", "slacking", { timeout: 2000 });
  await expect(mia.locator(".rest")).toHaveClass(/slacking/);
  await mia.locator(EMOTE).click();
  await mia.locator('.tray button[value="dead"]').click();
  await expect(tom.locator(".map .pops svg.pop use")).toHaveAttribute("href", /#em-dead$/, { timeout: 1000 });
  await mia.waitForTimeout(1500);
  await expect(avatar(tom, "Mia")).toHaveAttribute("data-state", "slacking");
  await expect(mia.locator(".rest")).toHaveClass(/slacking/);
  await expect(mia.locator(MAIN)).toHaveText("Start set");

  // pending: Start set tapped and the answer held back; the tab still sends
  await mia.waitForTimeout(500);
  await mia.route(`**${path}*`, async (route) => {
    const body = route.request().postData() ?? "";
    if (route.request().method() === "POST" && /action=start|name="action"\r?\n\r?\nstart/.test(body)) {
      await new Promise((r) => setTimeout(r, 3000));
    }
    await route.continue();
  });
  await mia.locator(MAIN).click();
  await expect(mia.locator(MAIN)).toBeDisabled();
  await mia.locator(EMOTE).click();
  await mia.locator('.tray button[value="flex"]').click();
  await expect(tom.locator(".map .pops svg.pop use")).toHaveAttribute("href", /#em-flex$/, { timeout: 1000 });
  await expect(mia.locator(MAIN)).toHaveText("Done", { timeout: 5000 });
});

// INT-8.6 (scrolled away: the tab tells you; the stamp untouched), INT-8.13
// (you hear "Sent: fire"; others' and Dony's aren't announced), INT-8.8
// (browser: within the second, the tray cools and nothing more shows)
test("with the map scrolled away the tab shows what went, the stamp is untouched, and only you hear it", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const mia = await screen(people.Mia, path, { viewport: { width: 390, height: 660 } });
  const tom = await recorded(people.Tom, path);
  await mia.selectOption("#exercise", "3");
  await mia.locator(MAIN).click();
  await mia.fill("#weight_kg", "40");
  await mia.fill("#reps", "8");
  await mia.locator(MAIN).click();
  const stamp = mia.locator(".dock .stamp");
  await expect(stamp).toContainText("Set 1 logged");
  const stampText = await stamp.textContent();
  await mia.locator("#weight_kg").scrollIntoViewIfNeeded();
  await mia.evaluate(() => window.scrollBy(0, 400));
  await expect(mia.locator(".map-panel .map")).not.toBeInViewport();

  const news = mia.locator("#sheet-news");
  await mia.locator(EMOTE).click();
  await mia.locator('.tray button[value="fire"]').click();
  await expect(stamp, "the stamp untouched (it shows for 4 s after Done)").toHaveText(stampText!);
  await expect(mia.locator(EMOTE)).toHaveAttribute("aria-label", "Send an emoji (sent: fire)");
  await expect(news).toHaveText("Sent: fire", { timeout: 1000 });
  expect(intersects(await box(mia.locator(EMOTE)), await box(mia.locator(MAIN)))).toBe(false);
  // within the second the tab is unavailable: a tap on it sends nothing, and
  // if the tray opens it is cooling, and a tap on an emoji sends nothing
  await mia.locator(EMOTE).click({ force: true });
  const tray = mia.locator(".tray");
  if (await tray.isVisible()) {
    await expect(tray).toHaveAttribute("data-cooling", /.*/);
    await tray.locator('button[value="haha"]').click({ force: true });
  }
  await mia.waitForTimeout(1200);
  await expect(mia.locator(EMOTE)).toHaveAttribute("aria-label", "Send an emoji");
  const pops = (await seenOn(tom)).filter((s) => s.what === "pop");
  expect(pops.map((p) => p.use?.replace(/.*#em-/, ""))).toEqual(["fire"]);
  await expect(mia.locator("p.note, p.error")).toHaveCount(0);

  // Tom's emoji isn't announced to Mia, and her squad list doesn't change:
  // the same rows, the same elements (not redrawn), the same chips
  const rows = await mia.locator(".people > li").elementHandles();
  const chips = await mia.locator(".people .chips").allTextContents();
  await news.evaluate((n) => (n.textContent = ""));
  expect((await emote(people.Tom, path, "love")).status()).toBe(200);
  // Tom's pop, beside Mia's own if it's still up (INT-8.7: everyone's together)
  await expect(mia.locator('.map .pops svg.pop:has(use[href$="#em-love"])')).toHaveCount(1, { timeout: 1000 });
  await mia.waitForTimeout(300);
  await expect(news).toHaveText("");
  const after = await mia.locator(".people > li").elementHandles();
  expect(after.length).toBe(rows.length);
  for (const [i, r] of rows.entries()) expect(await r.evaluate((el, other) => el === other, after[i])).toBe(true);
  expect(await mia.locator(".people .chips").allTextContents()).toEqual(chips);
});

// INT-8.7 (newest replaces; everyone's together), INT-8.15 (goes with its sender),
// INT-8.23 (under every avatar, 32 x 32, 4 px above the tag; beside it on the back row)
test("pops sit under avatars, 32 px, just over the tag or beside it on the back row; newer replaces; they leave with their sender", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom", "Priya"]);
  await choose(people.Tom, path, "5"); // squat rack 3, the back row, column 6
  for (const width of [390, 1280]) {
    const page = await screen(people.Priya, path, { viewport: { width, height: 900 } });
    await page.waitForTimeout(1100); // past the last emoji's second
    expect((await emote(people.Mia, path, "hi")).status()).toBe(200);
    expect((await emote(people.Tom, path, "flex")).status()).toBe(200);
    const pops = page.locator(".map .pops svg.pop");
    await expect(pops).toHaveCount(2, { timeout: 1000 });
    const miaPop = page.locator('.map .pops svg.pop:has(use[href$="#em-hi"])');
    const tomPop = page.locator('.map .pops svg.pop:has(use[href$="#em-flex"])');
    for (const p of [miaPop, tomPop]) {
      const b = await box(p);
      expect([Math.round(b.width), Math.round(b.height)], `${width}: 32 x 32`).toEqual([32, 32]);
    }
    const miaTag = await box(avatar(page, "Mia").locator(".tag"));
    const mp = await box(miaPop);
    expect(Math.round(miaTag.y - (mp.y + mp.height)), `${width}: 4 px above her tag`).toBe(4);
    expect(Math.abs(mp.x + mp.width / 2 - (miaTag.x + miaTag.width / 2)), `${width}: centred`).toBeLessThanOrEqual(1);
    // the back row: beside Tom's tag, on the side away from the nearer wall (west, as he's in column 6)
    await expect(tomPop).toHaveClass(/\bbeside\b/);
    const tomTag = await box(avatar(page, "Tom").locator(".tag"));
    const tp = await box(tomPop);
    expect(intersects(tp, tomTag)).toBe(false);
    expect(tp.x + tp.width).toBeLessThanOrEqual(tomTag.x + 1);
    // under every avatar: wherever a pop and an avatar overlap, the avatar is painted on top
    expect(await popsUnderAvatars(page)).toEqual([]);
    // Mia's next one replaces hers
    await page.waitForTimeout(1100);
    expect((await emote(people.Mia, path, "love")).status()).toBe(200);
    await expect(page.locator('.map .pops svg.pop:has(use[href$="#em-love"])')).toHaveCount(1, { timeout: 1000 });
    await expect(miaPop).toHaveCount(0);
    await expect(pops).toHaveCount(2);
    await page.close();
  }
  // she leaves mid-pop: it goes with her, long before its 3 s are up
  const page = await screen(people.Priya, path);
  await page.waitForTimeout(1100);
  expect((await emote(people.Mia, path, "dead")).status()).toBe(200);
  const deadPop = page.locator('.map .pops svg.pop:has(use[href$="#em-dead"])');
  await expect(deadPop).toHaveCount(1, { timeout: 1000 });
  const popAt = Date.now();
  await post(people.Mia, path, { action: "leave" });
  await expect(deadPop).toHaveCount(0, { timeout: 1500 });
  expect(Date.now() - popAt, "gone with her, not timed out").toBeLessThan(2700);
});

// INT-8.12 (keyboard), INT-8.21 (Hi focused first)
test("the emoji tray works by keyboard, and every emoji is named by its word", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const mia = await screen(people.Mia, path);
  const tom = await screen(people.Tom, path);
  // Tab reaches the tab just before the dock's button
  await mia.locator(MAIN).focus();
  await mia.keyboard.press("Shift+Tab");
  const tab = mia.locator(EMOTE);
  await expect(tab).toBeFocused();
  expect(await tab.evaluate((t) => getComputedStyle(t).outlineStyle !== "none" || getComputedStyle(t).boxShadow !== "none")).toBe(true);
  await mia.keyboard.press("Enter");
  const focused = () => mia.evaluate(() => document.activeElement?.closest(".tray") ? (document.activeElement as HTMLElement).textContent!.trim() : "outside");
  expect(await focused()).toBe("Hi");
  for (const name of ["Hi", "Flex", "Fire", "Clap", "Haha", "Dead", "Eyes", "Love"]) await expect(mia.getByRole("button", { name, exact: true })).toHaveCount(1);
  await mia.keyboard.press("ArrowRight");
  expect(await focused()).toBe("Flex");
  await mia.keyboard.press("ArrowDown");
  expect(await focused()).toBe("Dead");
  await mia.keyboard.press("ArrowLeft");
  expect(await focused()).toBe("Haha");
  await mia.keyboard.press("ArrowUp");
  expect(await focused()).toBe("Hi");
  await mia.keyboard.press("Escape");
  await expect(mia.locator(".tray")).toBeHidden();
  await expect(tab).toBeFocused();
  // Space opens, Space sends
  await mia.keyboard.press("Space");
  await mia.keyboard.press("ArrowRight");
  await mia.keyboard.press("ArrowRight");
  await mia.keyboard.press("Space");
  await expect(tom.locator(".map .pops svg.pop use")).toHaveAttribute("href", /#em-fire$/, { timeout: 1000 });
  // number keys do nothing (the pop is still Fire, not replaced)
  await mia.waitForTimeout(1100);
  for (const key of ["1", "2", "3"]) await mia.locator("body").press(key);
  await mia.waitForTimeout(600);
  await expect(tom.locator(".map .pops svg.pop use")).toHaveAttribute("href", /#em-fire$/);
});

// INT-8.16 (a failed emoji: nothing anywhere, the red line left of the tab, 4 s)
test("a failed emoji shows the red line beside the tab for 4 s, and nothing anywhere else", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const mia = await recorded(people.Mia, path);
  const tom = await recorded(people.Tom, path);
  await mia.route(`**${path}`, (route) => (route.request().method() === "POST" ? route.abort() : route.continue()));
  await mia.locator(EMOTE).click();
  const failedAt = Date.now();
  await mia.locator('.tray button[value="fire"]').click();
  const error = mia.locator("p.error.emote-error[role=alert]");
  await expect(error).toHaveText("That didn't send. Try again.", { timeout: 1500 });
  const e = await box(error);
  const t = await box(mia.locator(EMOTE));
  const dock = await box(mia.locator(".dock"));
  expect(e.x + e.width).toBeLessThanOrEqual(t.x + 1);
  expect(e.y + e.height).toBeLessThanOrEqual(dock.y + 1);
  expect(intersects(e, await box(mia.locator(MAIN)))).toBe(false);
  await expect(mia.locator("dialog[open], [role=dialog], [role=alertdialog]")).toHaveCount(0);
  await expect(error).toHaveCount(0, { timeout: 5000 });
  expect(Date.now() - failedAt).toBeGreaterThanOrEqual(3500);
  for (const page of [mia, tom]) expect((await seenOn(page)).filter((s) => s.what === "pop")).toEqual([]);
});

// INT-8.18 (browser: twelve sending as fast as allowed, Dony out; the dock never covered)
test("in a room of twelve all sending emoji, nothing covers the dock and Done answers", async ({ browser }) => {
  test.setTimeout(90_000);
  const names = Array.from({ length: 12 }, (_, i) => `P${i}`);
  const { path, people } = await room(browser, names);
  await post(people.P0, path, { action: "dony", intent: "summon" });
  const page = await screen(people.P11, path);
  await page.selectOption("#exercise", "3");
  await page.locator(MAIN).click();
  await expect(page.locator(MAIN)).toHaveText("Done");
  const keys = ["hi", "flex", "fire", "clap", "haha", "dead", "eyes", "love"];
  const statuses: number[] = [];
  const spam = (async () => {
    for (let round = 0; round < 4; round++) {
      const sent = await Promise.all(names.slice(0, 11).map((n, i) => emote(people[n], path, keys[(i + round) % 8])));
      statuses.push(...sent.map((r) => r.status()));
      await new Promise((r) => setTimeout(r, 1100));
    }
  })();
  // the room fills with pops (so the check below is of a busy map, not an empty one)
  await expect(page.locator(".map .pops svg.pop")).toHaveCount(11, { timeout: 2000 });
  expect(await dockHitDuring(page, 3000)).toEqual([]);
  await spam;
  expect(statuses.filter((s) => s === 200).length, "every send a second apart is accepted").toBe(44);
  await page.fill("#weight_kg", "40");
  await page.fill("#reps", "8");
  await page.locator(MAIN).click();
  await expect(page.locator(".dock .stamp")).toContainText("Set 1 logged", { timeout: 2000 });
  // and in that room no pop was painted over any tag or avatar
  for (let i = 0; i < 11; i++) await emote(people[`P${i}`], path, "fire");
  await expect(page.locator(".map .pops svg.pop")).not.toHaveCount(0, { timeout: 1000 });
  expect(await popsUnderAvatars(page)).toEqual([]);
});

// ======================================================================
// BOT-6: Dony's emoji on the page
// ======================================================================

// BOT-6.2, BOT-6.1 (exactly as a person's: the same pop, no banner, no
// announcement, the squad list unchanged), BOT-6.10 (sent back mid-pop: it
// goes with him), BOT-6.11 (not announced), BOT-6.6 (a reload mid-pop shows nothing)
test("Dony waves Hi on landing on every screen like a person's pop, and it goes with him when he's sent back", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const mia = await recorded(people.Mia, path);
  const tom = await recorded(people.Tom, path);
  await mia.locator(".map .poster").click();
  const hi = '.map .pops svg.pop use[href$="#em-hi"]';
  for (const page of [mia, tom]) await expect(page.locator(hi)).toHaveCount(1, { timeout: 4000 });
  const shownAt = Date.now();
  // above him, as a person's would be, following him as he walks
  await onSendersTile(mia, ".map .pops svg.pop", "Dony");
  // a screen opened while it shows doesn't show it
  const late = await recorded(people.Tom, path);
  await late.waitForTimeout(300);
  expect(Date.now() - shownAt, "checked while his Hi still shows elsewhere").toBeLessThan(2700);
  await expect(tom.locator(hi)).toHaveCount(1);
  expect((await seenOn(late)).filter((s) => s.what === "pop")).toEqual([]);
  // no banner, no announcement
  for (const page of [mia, tom]) {
    expect((await seenOn(page)).filter((s) => s.what === "banner")).toEqual([]);
    await expect(page.locator("#sheet-news")).toHaveText("");
  }
  // sent back mid-pop: it goes with him
  await mia.locator(".map .poster").click();
  await expect(mia.locator(".map .pops svg.pop")).toHaveCount(0, { timeout: 1000 });
  expect(Date.now() - shownAt, "gone with him, before its 3 s were up").toBeLessThan(2900);
  await expect(mia.locator(".room-log li")).toHaveCount(0);
});

// BOT-6.7 (browser: his answer pops about a second after his reaction)
test("Dony answers a cheer with a pop about a second after his reaction", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const mia = await screen(people.Mia, path);
  const tom = await recorded(people.Tom, path);
  await summonFitting(people.Mia, path, quiet(20_000));
  const dony = mia.locator('.map .avatar[data-look="dony"]');
  await expect(dony).toHaveCount(1, { timeout: 2000 });
  await dony.click();
  await act(mia, "cheer").click();
  await expect(tom.locator('.map .avatar[data-look="dony"] svg.fx.fx-cheer')).toHaveCount(1, { timeout: 1500 });
  await expect(tom.locator('.map .pops svg.pop:is(:has(use[href$="#em-love"]), :has(use[href$="#em-flex"]))')).toHaveCount(1, { timeout: 2500 });
  const seen = await seenOn(tom);
  const fx = seen.find((s) => s.what === "fx" && s.on?.startsWith("Dony"))!;
  const answers = seen.filter((s) => s.what === "pop" && s.t > fx.t);
  expect(answers.map(emojiOf)).toHaveLength(1);
  expect(["love", "flex"]).toContain(emojiOf(answers[0]));
  expect(answers[0].t - fx.t).toBeGreaterThanOrEqual(500);
  expect(answers[0].t - fx.t).toBeLessThanOrEqual(2000);
  // and on Mia's screen too
  await expect(mia.locator('.map .pops svg.pop:is(:has(use[href$="#em-love"]), :has(use[href$="#em-flex"]))')).toHaveCount(1);
});

// INT-8.14 (reduced motion: a pop appears and goes without moving)
test("with reduced motion an emoji appears and goes without moving", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const page = await screen(people.Tom, path, { reduced: true });
  expect((await emote(people.Mia, path, "fire")).status()).toBe(200);
  const pop = page.locator(".map .pops svg.pop");
  await expect(pop).toHaveCount(1, { timeout: 1000 });
  // where it is, every frame for a second
  const places = await page.evaluate(
    () =>
      new Promise<string[]>((resolve) => {
        const out = new Set<string>();
        const end = performance.now() + 1000;
        const tick = () => {
          const p = document.querySelector(".map .pops svg.pop");
          if (p) {
            const r = p.getBoundingClientRect();
            out.add(`${Math.round(r.x)},${Math.round(r.y)},${getComputedStyle(p).opacity}`);
          }
          if (performance.now() < end) requestAnimationFrame(tick);
          else resolve([...out]);
        };
        tick();
      }),
  );
  expect(places, "one place, fully shown, the whole time").toHaveLength(1);
  const running = await page.evaluate(
    () => document.getAnimations().filter((a) => a.playState === "running" && ((a.effect as KeyframeEffect | null)?.target as Element | null)?.closest?.(".map .pops")).length,
  );
  expect(running).toBe(0);
  await expect(pop).toHaveCount(0, { timeout: 3000 });
});

// BOT-6.4 (his emoji stays its 3 s when his state changes under it). A visit
// is planned from its summon time (BOT-3), so the hook previews earlier
// summon times and moves the room to one whose visit has one of his own emoji
// 2 to 25 s from now with a change of state 0.3 to 2.2 s after it. Measured
// on 22 Oct: about 1 candidate in 300 fits, so it looks at up to 5000 (a few
// seconds of previews; about 17 fit). About 15 s, at most 30.
test("Dony's emoji stays its full 3 s when what he's doing changes under it", async ({ browser }) => {
  test.setTimeout(60_000);
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const page = await recorded(people.Tom, path);
  let due: { at: number; emoji: string } | undefined;
  await summonFitting(
    people.Mia,
    path,
    (v, now) => {
      const changes = v.segments.flatMap((s) => [s.end, ...(s.slackAt ? [s.slackAt] : [])]);
      due = v.emotes.find((e) => e.why === "own" && e.at > now + 2_000 && e.at < now + 25_000 && changes.some((c) => c > e.at + 300 && c < e.at + 2_200));
      return !!due;
    },
    5000,
  );
  const pop = page.locator(".map .pops svg.pop");
  await expect(pop.locator(`use[href$="#em-${due!.emoji}"]`)).toHaveCount(1, { timeout: due!.at - Date.now() + 1500 });
  const shownAt = Date.now();
  const dony = page.locator('.map .avatar[data-look="dony"]');
  const before = await dony.getAttribute("data-state");
  await expect(dony, "his state changes under it").not.toHaveAttribute("data-state", before!, { timeout: 2500 });
  // 2.6 s after it showed: the change came first, the pop is still there
  await page.waitForTimeout(Math.max(0, shownAt + 2600 - Date.now()));
  await expect(pop, "still showing after his change, 2.6 s in").toHaveCount(1);
  await expect(pop).toHaveCount(0, { timeout: 1500 });
});
