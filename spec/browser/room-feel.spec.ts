import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { backdate, join, openRoom, person, post } from "./helpers.ts";

// How the gym room feels, with the room's script running
// (docs/product/criteria/room-feel.md: INT-9, INT-10, GYM-17, GYM-18,
// INT-12, BOT-7). The server's side (what is accepted, the limits, the
// events) is spec/room-feel.test.ts, whose contract these use to set things
// up. Four scenarios, each two or three people in their own browsers. Each
// names the criteria it covers.
//
// The page's hooks are the room design's ("Room feel", F.2 to F.11 in
// docs/design/room/spec.md):
// - a banner with a button: `.banner-slot .banner.has-act`, its line
//   `.banner-line[role=status]`, its button `.banner-act` (accessible name
//   "Slap back Mia"), live 500 ms after it appears (`data-shown`, epoch ms);
//   the room's PB banner adds `.room`.
// - the menu's answer row `.menu li.answer .act.hot`; the PB line `.menu-news`.
// - an open offer: `svg.fx.fx-offer` on the offerer, and `.map .says .say.offer`.
// - the High-five on both avatars: `svg.fx` with `fx-highfive`.
// - the flex: the avatar takes `.flexing`; the lifter's stamp is logbook's, its
//   set `.stamp [data-set]` with `data-records` (LB-4.10).
// - the sound setting: `.map-panel button.sound[data-sound]`, words in
//   `.sound-word`, kept in localStorage.

const BANNER = ".banner-slot .banner";
const MAIN = ".dock button.wide";

async function room(browser: Browser, names: string[]) {
  const people: Record<string, BrowserContext> = {};
  for (const name of names) people[name] = await person(browser, name);
  const { path, passcode } = await openRoom(people[names[0]]);
  for (const name of names.slice(1)) await join(people[name], passcode);
  return { path, passcode, people };
}

const LAPTOP = { width: 1280, height: 900 };
async function screen(who: BrowserContext, path: string, opts: { viewport?: { width: number; height: number }; at?: string } = {}) {
  const page = await who.newPage();
  if (opts.viewport) await page.setViewportSize(opts.viewport);
  await page.goto(opts.at ?? path);
  await expect(page.locator(".map-panel .conn .badge")).toHaveText("Live");
  return page;
}

const avatar = (page: Page, name: string) => page.locator(`.map .avatar[aria-label^="${name},"], .map .avatar[aria-label^="${name} (you),"]`);
const row = (page: Page, name: string) => page.locator(".people .person", { hasText: name });
const idOf = async (page: Page, name: string) => Number(await avatar(page, name).getAttribute("data-id"));
const logLines = (page: Page) => page.locator("section.room-log li:not(.joined)");
const box = async (l: Locator) => (await l.boundingBox())!;
const intersects = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

// The banner's button ignores taps for its first half second (INT-9.11),
// by design; a test taps it once it's live, read from when it appeared
async function tapBanner(page: Page) {
  const act = page.locator(`${BANNER} .banner-act`);
  await expect(act).toBeVisible();
  await page.waitForFunction(() => {
    const b = document.querySelector<HTMLElement>(".banner-slot .banner-act");
    return !!b && Date.now() - Number(b.dataset.shown) > 600;
  });
  await act.click();
}

// INT-9.1 (the banner's button by kind), INT-9.3 (Slap back's words, on the
// slapper), INT-9.4 (a reply's banner has no button), INT-9.10 (the menu's
// answer row, first and highlighted), INT-9.12 (the button's name; the
// dock untouched on a phone), INT-9.13 (a reload: no old banner, the menu
// still offers the reply)
test("Mia slaps Jiwoo, Jiwoo slaps back from the banner; Tom slaps her, and after a reload she slaps back from his menu", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo", "Tom"]);
  const jiwoo = await screen(people.Jiwoo, path);
  const mia = await screen(people.Mia, path, { viewport: LAPTOP });
  const jiwooId = await idOf(mia, "Jiwoo");
  const mainBefore = await box(jiwoo.locator(MAIN));

  // Mia slaps: Jiwoo's banner carries Slap back, clear of her dock
  expect((await post(people.Mia, path, { action: "interact", to: String(jiwooId), kind: "slap" })).status()).toBe(200);
  await expect(jiwoo.locator(`${BANNER} .banner-line`)).toHaveText("Mia slapped you back to work 👋");
  await expect(jiwoo.locator(`${BANNER} .banner-act`)).toHaveAccessibleName("Slap back Mia");
  expect(intersects(await box(jiwoo.locator(BANNER)), await box(jiwoo.locator(".dock")))).toBe(false);
  expect(await box(jiwoo.locator(MAIN)), "her dock's button didn't move").toEqual(mainBefore);
  await expect(jiwoo.locator(`${BANNER} .banner-act`)).not.toBeFocused();

  // she slaps back: it lands on Mia, on both screens
  await tapBanner(jiwoo);
  await expect(jiwoo.locator(BANNER), "her banner goes on the tap").toHaveCount(0);
  for (const page of [mia, jiwoo]) await expect(avatar(page, "Mia").locator("svg.fx.fx-slap-back")).toHaveCount(1, { timeout: 3500 });
  await expect(mia.locator(`${BANNER} .banner-line`)).toHaveText("Jiwoo returned the slap 👋");
  await expect(mia.locator(`${BANNER} .banner-act`), "a reply can't be answered").toHaveCount(0);
  await expect(logLines(mia).first()).toContainText("Jiwoo returned your slap");
  await expect(logLines(jiwoo).first()).toContainText("You returned Mia's slap");

  // Tom slaps her; she reloads: no banner, and Tom's menu leads with Slap back
  expect((await post(people.Tom, path, { action: "interact", to: String(jiwooId), kind: "slap" })).status()).toBe(200);
  await expect(jiwoo.locator(`${BANNER} .banner-line`)).toHaveText("Tom slapped you back to work 👋");
  await jiwoo.reload();
  await expect(jiwoo.locator(".map-panel .conn .badge")).toHaveText("Live");
  await expect(jiwoo.locator(BANNER), "no old banner after a reload").toHaveCount(0);
  await row(jiwoo, "Tom").click();
  const answer = jiwoo.locator(".menu .menu-acts > li").first().locator(".act");
  await expect(answer).toHaveAttribute("value", "slap-back");
  await expect(answer).toHaveClass(/\bhot\b/);
  await expect(answer).toHaveAccessibleName("Slap back Tom");
  await expect(jiwoo.locator(".menu .act.hot"), "the only highlighted row").toHaveCount(1);
  const tom = await screen(people.Tom, path, { viewport: LAPTOP });
  await answer.click();
  await expect(tom.locator(`${BANNER} .banner-line`)).toHaveText("Jiwoo returned the slap 👋");
  // and it's gone from his menu
  await row(jiwoo, "Tom").click();
  await expect(jiwoo.locator('.menu .act[value="slap-back"]')).toHaveCount(0);
});

// INT-10.1 (High-five in the menu), INT-10.2 (the open offer on every
// screen; the target's banner), INT-10.10 (a lapse: only the offerer is
// told, nothing in the log), INT-10.6 (it happens on both avatars, the
// offer goes, the offerer's banner and log line)
test("Jiwoo offers Mia a High-five and Mia leaves her hanging; then Mia offers one and Jiwoo takes it", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo", "Tom"]);
  const mia = await screen(people.Mia, path, { viewport: LAPTOP });
  // Jiwoo's page clock, so her offer's 10 s can be run past: the lapse is her
  // page's own timer, from the offer's `until`
  const jiwoo = await screen(people.Jiwoo, path);
  await jiwoo.clock.install();
  const logBefore = await logLines(mia).allInnerTexts();

  // Jiwoo offers from Mia's menu: the open offer on both screens, the banner on Mia's
  await avatar(jiwoo, "Mia").click();
  await jiwoo.locator('.menu .act[value="highfive"]:visible').click();
  for (const page of [mia, jiwoo]) {
    await expect(avatar(page, "Jiwoo").locator("svg.fx.fx-offer"), "Jiwoo's palm up").toHaveCount(1, { timeout: 2500 });
    await expect(page.locator(".map .says .say.offer")).toContainText("@Mia");
  }
  await expect(mia.locator(`${BANNER} .banner-line`)).toHaveText("Jiwoo wants a high-five ✋");
  await expect(mia.locator(`${BANNER} .banner-act`)).toHaveAccessibleName("High-five Jiwoo");

  // nobody takes it: at 10 s it lapses; Jiwoo alone is told, and nothing is logged
  await jiwoo.clock.runFor(10_500);
  await expect(jiwoo.locator("p.note")).toHaveText("Mia left you hanging ✋");
  await expect(avatar(jiwoo, "Jiwoo").locator("svg.fx.fx-offer"), "her palm goes").toHaveCount(0);
  await expect(mia.locator("p.note"), "Mia is told nothing").toHaveCount(0);
  expect(await logLines(mia).allInnerTexts(), "nothing in the log").toEqual(logBefore);

  // Tom offers Jiwoo one from his menu; she takes it from the banner, and
  // Mia (a third screen, on real time) sees both play it. (Not Mia: her
  // screen, on real time, still has Jiwoo's offer open for its 10 s.)
  const tom = await screen(people.Tom, path, { viewport: LAPTOP });
  await jiwoo.clock.resume();
  // opened from her squad row, which doesn't move (her avatar may still be
  // walking in on a screen this new, on a busy machine)
  await row(tom, "Jiwoo").click();
  await tom.locator('.menu .act[value="highfive"]:visible').click();
  await expect(avatar(mia, "Tom").locator("svg.fx.fx-offer")).toHaveCount(1, { timeout: 2500 });
  await expect(jiwoo.locator(`${BANNER} .banner-line`)).toHaveText("Tom wants a high-five ✋");
  await tapBanner(jiwoo);
  for (const page of [tom, mia]) {
    for (const who of ["Tom", "Jiwoo"]) await expect(avatar(page, who).locator('svg.fx[class*="fx-highfive"]'), `${who}'s High-five`).toHaveCount(1, { timeout: 3500 });
    await expect(page.locator(".map .says .say.offer", { hasText: "@Jiwoo" })).toHaveCount(0);
  }
  await expect(tom.locator(`${BANNER} .banner-line`)).toHaveText("Jiwoo high-fived you 🙌");
  await expect(tom.locator(`${BANNER} .banner-act`)).toHaveCount(0);
  await expect(logLines(tom).first()).toContainText("You and Jiwoo high-fived");
  // the accepter's line puts her first too, with the leaf edge (INT-10.6, F13)
  await expect(logLines(jiwoo).first()).toContainText("You and Tom high-fived");
  await expect(logLines(jiwoo).first()).toHaveClass(/\byou\b/);
  await expect(logLines(mia).first()).toContainText("Tom and Jiwoo high-fived");
});

// GYM-17.7 (the flex on the other screen; the lifter's sheet turns Resting
// at once), GYM-17.9 (the gold stamp; no banner of her own), GYM-17.11 (not
// replayed on reload), GYM-18.1 (the room banner with Cheer, no numbers),
// GYM-18.2 (Cheer from it is a Cheer: Thanks on Mia's banner), GYM-18.3,
// GYM-18.5 (the log line), GYM-18.6 (the menu's PB line, Cheer and
// High-five highlighted)
test("Mia hits a PB on bench: Tom sees her flex and the room banner, cheers from it, and Mia gets the gold stamp", async ({ browser }) => {
  // Mia's first workout with bench, in a room of her own, sets the bar
  const mia = await person(browser, "Mia");
  const own = await openRoom(mia);
  expect((await post(mia, own.path, { exercise_id: "3", weight_kg: "100", reps: "5" })).status()).toBe(303);
  await post(mia, own.path, { action: "leave" });
  const tomCtx = await person(browser, "Tom");
  const { path, passcode } = await openRoom(tomCtx);
  await join(mia, passcode);
  // the flex lasts under 2 s, so Tom's page records, from its first frame,
  // every avatar that takes .flexing, rather than the test looking in time
  await tomCtx.addInitScript(() => {
    const w = window as unknown as { __flexed: string[] };
    w.__flexed = [];
    const look = () => {
      for (const a of document.querySelectorAll(".map .avatar.flexing")) {
        const who = (a.getAttribute("aria-label") ?? "").split(",")[0];
        if (!w.__flexed.includes(who)) w.__flexed.push(who);
      }
    };
    const start = () => new MutationObserver(look).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["class"], childList: true });
    if (document.documentElement) start();
    else addEventListener("DOMContentLoaded", start, { once: true });
  });
  const flexed = (page: Page) => page.evaluate(() => (window as unknown as { __flexed: string[] }).__flexed.slice());
  const tom = await screen(tomCtx, path, { viewport: LAPTOP });
  const miaPage = await screen(mia, path, { at: `${path}?exercise=3` });
  expect(await flexed(tom), "nobody flexed before the Done").toEqual([]);

  await miaPage.locator("#weight_kg").fill("105");
  await miaPage.locator("#reps").fill("5");
  await miaPage.locator(MAIN).click();

  // Tom: the room banner with Cheer, no numbers, and Mia flexing
  await expect(tom.locator(`${BANNER}.room .banner-line`)).toHaveText("Mia hit a PB on bench press 🏆", { timeout: 2000 });
  await expect(tom.locator(`${BANNER} .banner-act`)).toHaveAccessibleName("Cheer Mia");
  await expect(tom.locator(BANNER)).not.toContainText("105");
  await expect.poll(() => flexed(tom), { message: "Mia flexed on Tom's screen" }).toEqual(["Mia"]);
  // Mia: resting at once; her stamp shows the set with logbook's Record mark
  // (LB-4.10: in words, naming the records), no banner of her own
  await expect(miaPage.locator(MAIN)).toHaveText("Start set");
  const stampSet = miaPage.locator(".stamp [data-set]");
  await expect(stampSet).toHaveText("105 kg × 5");
  await expect(stampSet).toHaveAttribute("data-records", /\bheaviest\b/);
  await expect(stampSet).toHaveAttribute("data-records", /\be1rm\b/);
  await expect(miaPage.locator(".stamp")).toContainText(/record/i);
  // no banner of the PB's for her; the PB unlocks Shades, which tells only
  // her with its own (accessories.md AV-6.1)
  await expect(miaPage.locator(`${BANNER}.room`)).toHaveCount(0);
  await expect(miaPage.locator(`${BANNER} .banner-line`)).toContainText("New: shades");
  await expect(logLines(tom).first()).toContainText("Mia hit a PB on bench press");
  await expect(logLines(miaPage).first()).toContainText("You hit a PB on bench press");

  // Tom's menu on Mia, inside the 30 s: the PB line, Cheer and High-five lit
  await row(tom, "Mia").click();
  await expect(tom.locator(".menu .menu-news")).toHaveText("Just hit a PB on bench press");
  expect(await tom.locator(".menu .act.hot").evaluateAll((es) => es.map((e) => e.getAttribute("value")))).toEqual(["cheer", "highfive"]);
  await tom.keyboard.press("Escape");

  // Tom cheers from the banner: an ordinary Cheer, Thanks on Mia's banner, clear of her dock
  await tapBanner(tom);
  await expect(miaPage.locator(`${BANNER} .banner-line`)).toHaveText("Tom is hyping you up 🔥");
  await expect(miaPage.locator(`${BANNER} .banner-act`)).toHaveAccessibleName("Thanks Tom");
  expect(intersects(await box(miaPage.locator(BANNER)), await box(miaPage.locator(".dock")))).toBe(false);
  await expect(miaPage.locator(MAIN)).toBeInViewport();

  // a reload replays no flex
  await tom.reload();
  await expect(tom.locator(".map-panel .conn .badge")).toHaveText("Live");
  await tom.waitForTimeout(500); // a replay would start with the first render
  expect(await flexed(tom), "no flex since the reload").toEqual([]);
  await expect(tom.locator(BANNER)).toHaveCount(0);
});

// INT-12.3 (three values, All sounds by default), INT-12.5 (kept in that
// browser across a reload and another room; another browser keeps its own),
// INT-12.4 (Off: no sound, the words still show), INT-12.8 (on the room
// page, in words, one tap, by keyboard), BOT-7.2 (Dony takes an offer and
// Mia hears it, with her banner)
test("Jiwoo turns sound off and it stays off in her browser; Mia keeps hers, and hears Dony take her High-five", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo"]);
  // counts every sound started (the page's sound is Web Audio, F.13)
  const counting = async (who: BrowserContext, opts: { viewport?: { width: number; height: number } } = {}) => {
    const page = await who.newPage();
    if (opts.viewport) await page.setViewportSize(opts.viewport);
    await page.addInitScript(() => {
      const w = window as unknown as { __sounds: number };
      w.__sounds = 0;
      for (const Node of [OscillatorNode, AudioBufferSourceNode]) {
        const start = Node.prototype.start;
        Node.prototype.start = function (this: AudioScheduledSourceNode, ...args: [number?]) {
          w.__sounds++;
          return start.apply(this, args);
        };
      }
    });
    await page.goto(path);
    await expect(page.locator(".map-panel .conn .badge")).toHaveText("Live");
    await page.locator(".map-panel .map-sign").click(); // a tap lets the page play sound
    return page;
  };
  const sounds = (page: Page) => page.evaluate(() => (window as unknown as { __sounds: number }).__sounds);
  const jiwoo = await counting(people.Jiwoo);
  const mia = await counting(people.Mia, { viewport: LAPTOP });
  const sound = (page: Page) => page.locator(".map-panel button.sound");

  // the default, in words; one tap a step, by pointer or key
  await expect(sound(jiwoo)).toHaveAttribute("data-sound", "all");
  await expect(sound(jiwoo)).toContainText("All sounds");
  await sound(jiwoo).click();
  await expect(sound(jiwoo)).toContainText("Rest timer only");
  await sound(jiwoo).focus();
  await jiwoo.keyboard.press("Enter");
  await expect(sound(jiwoo)).toHaveAttribute("data-sound", "off");
  await expect(sound(jiwoo)).toContainText("Sound off");

  // Off: a cheer to her shows its banner and plays nothing
  const before = await sounds(jiwoo);
  expect((await post(people.Mia, path, { action: "interact", to: String(await idOf(mia, "Jiwoo")), kind: "cheer" })).status()).toBe(200);
  await expect(jiwoo.locator(`${BANNER} .banner-line`)).toHaveText("Mia is hyping you up 🔥");
  await jiwoo.waitForTimeout(300); // a sound would start with the banner
  expect(await sounds(jiwoo), "nothing with sound off").toBe(before);

  // kept after a reload, and in another room on the same browser
  await jiwoo.reload();
  await expect(sound(jiwoo)).toContainText("Sound off");
  const other = await openRoom(people.Jiwoo);
  await jiwoo.goto(other.path);
  await expect(sound(jiwoo)).toContainText("Sound off");
  // Mia's browser keeps its own
  await expect(sound(mia)).toContainText("All sounds");

  // Mia offers Dony a High-five: he takes it about a second later, she hears it
  expect((await post(people.Mia, path, { action: "dony", intent: "summon" })).status()).toBe(303);
  const dony = avatar(mia, "Dony");
  await expect(dony).toHaveCount(1, { timeout: 3000 });
  // offered from her own menu, so her page knows of it (and plays its
  // confirmation); what's counted is what comes once Dony takes it
  await avatar(mia, "Dony").click();
  await mia.locator('.menu .act[value="highfive"]:visible').click();
  await expect(avatar(mia, "Mia").locator("svg.fx.fx-offer")).toHaveCount(1, { timeout: 2500 });
  const heard = await sounds(mia);
  await expect(mia.locator(`${BANNER} .banner-line`)).toHaveText("Dony high-fived you 🙌", { timeout: 3000 });
  await expect(dony.locator('svg.fx[class*="fx-highfive"]')).toHaveCount(1);
  await expect(logLines(mia).first()).toContainText("You and Dony high-fived");
  expect(await sounds(mia), "Mia hears it").toBeGreaterThan(heard);
});

// INT-10.18 (F12): an open offer's bubble draws under every avatar, so a
// neighbour's tag it overlaps is still what's on top; and a preset from the
// offerer replaces the bubble but leaves the raised palm. Idle people stand
// together by the cooler, so in a room of five some offerer's bubble overlaps
// a neighbour's tag; the test finds such an overlap before checking which is
// on top, so the check can't pass for want of one.
test("an open offer's bubble never covers a neighbour's tag, and a preset from the offerer leaves the palm up", async ({ browser }) => {
  const names = ["Tom", "Mia", "Jiwoo", "Priya", "Kai"];
  const { path, people } = await room(browser, names);
  const tom = await screen(people.Tom, path, { viewport: LAPTOP });
  const ids: Record<string, number> = {};
  for (const n of names) ids[n] = await idOf(tom, n);
  // each of four makes an offer, until one's bubble overlaps another's tag
  const offerers = ["Priya", "Kai", "Mia", "Jiwoo"];
  let covered: { offerer: string; tag: string } | null = null;
  for (const [i, offerer] of offerers.entries()) {
    const target = offerers[(i + 1) % offerers.length];
    expect((await post(people[offerer], path, { action: "interact", to: String(ids[target]), kind: "highfive" })).status()).toBe(200);
    const bubble = tom.locator(`.map .says.offers .say.offer[data-id="${ids[offerer]}"]`);
    await expect(bubble).toBeVisible({ timeout: 2500 });
    const b = await box(bubble);
    for (const n of names) {
      if (n === offerer) continue;
      if (intersects(b, await box(avatar(tom, n).locator(".tag")))) {
        covered = { offerer, tag: n };
        break;
      }
    }
    if (covered) break;
  }
  expect(covered, "some offer's bubble overlaps a neighbour's tag in this crowd").not.toBeNull();
  const { offerer, tag } = covered!;

  // at every point the two share, what's on top is the tag
  const misses = await tom.evaluate(
    ({ bubbleSel, tagSel }) => {
      const t = document.querySelector(tagSel)!.getBoundingClientRect();
      const b = document.querySelector(bubbleSel)!.getBoundingClientRect();
      const x0 = Math.max(t.left, b.left), x1 = Math.min(t.right, b.right);
      const y0 = Math.max(t.top, b.top), y1 = Math.min(t.bottom, b.bottom);
      const out: string[] = [];
      for (const fx of [0.2, 0.5, 0.8])
        for (const fy of [0.2, 0.5, 0.8]) {
          const x = x0 + (x1 - x0) * fx, y = y0 + (y1 - y0) * fy;
          const hit = document.elementFromPoint(x, y);
          if (!hit?.closest(".avatar .tag")) out.push(`${Math.round(x)},${Math.round(y)}: ${hit?.className}`);
        }
      return out;
    },
    { bubbleSel: `.map .says.offers .say.offer[data-id="${ids[offerer]}"]`, tagSel: `.map .avatar[data-id="${ids[tag]}"] .tag` },
  );
  expect(misses, `${tag}'s tag draws over ${offerer}'s offer bubble`).toEqual([]);

  // the offerer sends a preset: its bubble replaces the offer's; the palm stays up
  const palm = avatar(tom, offerer).locator("svg.fx.fx-offer");
  await expect(palm).toHaveCount(1);
  expect((await post(people[offerer], path, { action: "say", to: String(ids.Tom), preset: "hype-1" })).status()).toBe(200);
  await expect(tom.locator(".map .says .say", { hasText: "One more rep!" })).toBeVisible({ timeout: 2500 });
  await expect(tom.locator(`.map .says.offers .say.offer[data-id="${ids[offerer]}"]`), "the preset replaces the offer's bubble").toHaveCount(0);
  await expect(palm, "the palm is still up").toHaveCount(1);
});
