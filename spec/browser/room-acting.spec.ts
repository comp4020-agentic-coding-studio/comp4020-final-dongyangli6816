import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { join, openRoom, person, post } from "./helpers.ts";

// Acting it out, with the room's script running (docs/product/criteria/
// room-acting.md: INT-13 to INT-16, BOT-8). The server's part (fromState,
// toState) is spec/room-acting.test.ts. Each test names its criteria.
//
// Hooks, from the design spec A.2 to A.9: a walker's avatar has `.errand`
// while away and `.at-spot` at the meeting spot; poses are the avatar's
// `data-pose` (walker: cheer, point, reach, swing, bow; a target off a
// machine: crouch, cheer, startle, recoil, sit-*, reach); a lifter's hand is
// `svg.gesture` in their avatar; flights `.map .flights svg.flight`; the
// High-five's smack `.map .flights svg.smack`; the banner arrives at the hit.
//
// Poses and frames last a fraction of a second, so each screen records, from
// its first frame, every change of class, pose, gesture, flight and banner
// with Date.now(); tests read that timeline instead of looking in time.

const BANNER_LINE = ".banner-slot .banner .banner-line";
const MAIN = ".dock button.wide";
const LAPTOP = { width: 1280, height: 900 };

async function room(browser: Browser, names: string[]) {
  const people: Record<string, BrowserContext> = {};
  for (const name of names) people[name] = await person(browser, name);
  const { path, passcode } = await openRoom(people[names[0]]);
  for (const name of names.slice(1)) await join(people[name], passcode);
  return { path, people };
}

type Seen = { t: number; who: string; cls: string; pose: string | null; gesture: boolean } | { t: number; flight: string } | { t: number; banner: string };

// a timeline of what this screen shows, kept from its first frame
function recorder() {
  const w = window as unknown as { __act?: Seen[] };
  if (w.__act) return;
  const seen: Seen[] = (w.__act = []);
  const last = new Map<string, string>();
  const flights = new WeakSet<Element>();
  let banner = "";
  const look = () => {
    const t = Date.now();
    for (const a of document.querySelectorAll<HTMLElement>(".map .avatar")) {
      const who = (a.getAttribute("aria-label") ?? "").split(",")[0].replace(" (you)", "");
      const gesture = !!a.querySelector("svg.gesture");
      const key = `${a.className}|${a.dataset.pose ?? ""}|${gesture}`;
      if (last.get(who) === key) continue;
      last.set(who, key);
      seen.push({ t, who, cls: a.className, pose: a.dataset.pose ?? null, gesture });
    }
    for (const f of document.querySelectorAll(".map .flights svg")) {
      if (flights.has(f)) continue;
      flights.add(f);
      seen.push({ t, flight: f.getAttribute("class") ?? "" });
    }
    const line = document.querySelector(".banner-slot .banner .banner-line")?.textContent?.trim() ?? "";
    if (line && line !== banner) seen.push({ t, banner: line });
    banner = line;
  };
  const start = () => {
    look();
    new MutationObserver(look).observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
  };
  if (document.documentElement) start();
  else addEventListener("DOMContentLoaded", start, { once: true });
}

async function screen(who: BrowserContext, path: string, opts: { viewport?: { width: number; height: number }; reduced?: boolean; at?: string } = {}) {
  const page = await who.newPage();
  if (opts.viewport) await page.setViewportSize(opts.viewport);
  if (opts.reduced) await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(recorder);
  await page.goto(opts.at ?? path);
  await expect(page.locator(".map-panel .conn .badge")).toHaveText("Live");
  return page;
}
const timeline = (page: Page) => page.evaluate(() => (window as unknown as { __act: Seen[] }).__act.slice());
const of = (s: Seen[], who: string) => s.filter((x): x is Extract<Seen, { who: string }> => "who" in x && x.who === who);
const firstBanner = (s: Seen[], text: string) => s.find((x): x is Extract<Seen, { banner: string }> => "banner" in x && x.banner === text);
const avatar = (page: Page, name: string) => page.locator(`.map .avatar[aria-label^="${name},"], .map .avatar[aria-label^="${name} (you),"]`);
const idOf = async (page: Page, name: string) => Number(await avatar(page, name).getAttribute("data-id"));
const interact = (who: BrowserContext, path: string, to: number, kind: string) => post(who, path, { action: "interact", to: String(to), kind });

// INT-13.1 to 13.3 (a sender not Lifting walks to a meeting spot and back),
// INT-13.9 (the target's banner comes at the hit, within 3 s), INT-13.10
// (the sender's log line at once), INT-15.1 (the target's body reacts off a
// machine at the hit), INT-13.19 (both end where their states put them).
test("Mia, idle, walks over to slap Jiwoo, who's resting: the banner and her recoil land with the swing, and Mia walks back", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo"]);
  expect((await post(people.Jiwoo, path, { exercise_id: "3", weight_kg: "40", reps: "8" })).status()).toBe(303); // resting
  const jiwoo = await screen(people.Jiwoo, path);
  const mia = await screen(people.Mia, path, { viewport: LAPTOP });
  await expect(avatar(mia, "Jiwoo")).toHaveAttribute("data-state", "resting");
  // her tile, from the avatar's --x and --y (its style also carries facing)
  const tile = (page: Page, name: string) =>
    avatar(page, name).evaluate((a) => `${(a as HTMLElement).style.getPropertyValue("--x").trim()},${(a as HTMLElement).style.getPropertyValue("--y").trim()}`);
  const home = await tile(mia, "Mia");

  const sentAt = Date.now();
  expect((await interact(people.Mia, path, await idOf(mia, "Jiwoo"), "slap")).status()).toBe(200);
  // Mia's own screen: the log line at once, before any walk could arrive
  await expect(mia.locator("section.room-log li").first()).toContainText("You slapped Jiwoo", { timeout: 2500 });
  // the banner reaches Jiwoo, then the errand's done and Mia is home
  await expect(jiwoo.locator(BANNER_LINE)).toHaveText("Mia slapped you back to work 👋", { timeout: 3500 });
  await expect(avatar(mia, "Mia"), "back home, errand over").not.toHaveClass(/\berrand\b/, { timeout: 6000 });
  // `.errand` goes as she sets off back; she's home once she stops walking
  await expect.poll(() => tile(mia, "Mia"), { message: "on her own tile again", timeout: 4000 }).toBe(home);
  await expect(avatar(mia, "Mia")).not.toHaveAttribute("data-pose", "walk");

  for (const page of [mia, jiwoo]) {
    const s = await timeline(page);
    const walker = of(s, "Mia").filter((x) => x.t >= sentAt);
    const setOff = walker.find((x) => /\berrand\b/.test(x.cls));
    expect(setOff, "Mia sets off").toBeDefined();
    expect(setOff!.t - sentAt, "within a second (timed from before the request; slack for a busy runner)").toBeLessThan(2000);
    const swing = walker.find((x) => /\bat-spot\b/.test(x.cls) && x.pose === "swing");
    expect(swing, "she swings at the meeting spot").toBeDefined();
    // the 3 s cap counts from the event reaching the screen; sentAt is before
    // the request, so its trip is allowed for
    expect(swing!.t - sentAt, "the hit within 3 s").toBeLessThan(3500);
    const recoil = of(s, "Jiwoo").find((x) => x.t >= sentAt && x.pose === "recoil");
    expect(recoil, "Jiwoo recoils").toBeDefined();
    expect(Math.abs(recoil!.t - swing!.t), "her recoil lands with the swing (a frame or two apart at most)").toBeLessThan(300);
    if (page === jiwoo) {
      const banner = firstBanner(s, "Mia slapped you back to work 👋")!;
      expect(banner.t, "no banner before the hit").toBeGreaterThanOrEqual(swing!.t - 50);
      expect(banner.t - swing!.t, "the banner with the hit").toBeLessThan(300);
    }
  }
  await expect(avatar(jiwoo, "Jiwoo")).toHaveAttribute("data-pose", "rest");
});

// INT-14.1 to 14.4 (a Lifting sender gestures from the machine; an effect
// travels and lands within a second; the banner when it lands), INT-14.5
// (the lifter never leaves the machine), and the main button untouched.
test("Tom, mid-set, cheers Priya: his hand waves over the machine, a star flies to her, and her banner comes when it lands", async ({ browser }) => {
  const { path, people } = await room(browser, ["Tom", "Priya"]);
  expect((await post(people.Tom, path, { action: "choose", exercise: "7" })).status()).toBe(303);
  const tom = await screen(people.Tom, path, { at: `${path}?exercise=7` });
  const priya = await screen(people.Priya, path, { viewport: LAPTOP });
  await expect(tom.locator(MAIN)).toHaveText("Done");
  const mainBefore = await tom.locator(MAIN).boundingBox();
  const station = await avatar(priya, "Tom").getAttribute("style");

  const sentAt = Date.now();
  expect((await interact(people.Tom, path, await idOf(priya, "Priya"), "cheer")).status()).toBe(200);
  await expect(priya.locator(BANNER_LINE)).toHaveText("Tom is hyping you up 🔥", { timeout: 2500 });

  const s = await timeline(priya);
  const tomSeen = of(s, "Tom").filter((x) => x.t >= sentAt);
  expect(tomSeen.some((x) => x.gesture), "his hand comes up over the machine").toBe(true);
  expect(tomSeen.some((x) => /\berrand\b/.test(x.cls)), "he never leaves the machine").toBe(false);
  expect(tomSeen.every((x) => /\bon-machine\b/.test(x.cls)), "on the machine throughout").toBe(true);
  const flight = s.find((x): x is Extract<Seen, { flight: string }> => "flight" in x && x.t >= sentAt && /\bflight\b/.test(x.flight));
  expect(flight, "something flies").toBeDefined();
  const banner = firstBanner(s, "Tom is hyping you up 🔥")!;
  expect(banner.t - flight!.t, "it lands within a second of setting off (slack for a busy runner)").toBeLessThanOrEqual(1500);
  expect(banner.t, "the banner comes as it lands, not before").toBeGreaterThan(flight!.t);
  expect(await avatar(priya, "Tom").getAttribute("style"), "still at his station").toBe(station);
  // Tom's Done never moved or waited
  expect(await tom.locator(MAIN).boundingBox()).toEqual(mainBefore);
  await expect(tom.locator(MAIN)).toHaveText("Done");
});

// INT-16.2 (the offerer Lifting, the accepter not: the accepter walks over),
// INT-16.3 (the offerer's side drawn over the machine), INT-16.4 (the
// banner at the smack); and both Lifting: nobody walks, the smack meets.
test("Kai, lifting, offers Jiwoo a High-five: Jiwoo walks over and they smack; two lifters smack from their machines", async ({ browser }) => {
  const { path, people } = await room(browser, ["Kai", "Jiwoo", "Tom"]);
  expect((await post(people.Kai, path, { action: "choose", exercise: "5" })).status()).toBe(303);
  const kai = await screen(people.Kai, path, { viewport: LAPTOP });
  const jiwoo = await screen(people.Jiwoo, path);
  const kaiId = await idOf(jiwoo, "Kai");
  const offer = (await (await interact(people.Kai, path, await idOf(kai, "Jiwoo"), "highfive")).json()) as { offer: number };
  await expect(jiwoo.locator(BANNER_LINE)).toHaveText("Kai wants a high-five ✋");
  const sentAt = Date.now();
  expect((await post(people.Jiwoo, path, { action: "accept", offer: String(offer.offer) })).status()).toBe(200);
  await expect(kai.locator(BANNER_LINE)).toHaveText("Jiwoo high-fived you 🙌", { timeout: 3500 });
  await expect(avatar(kai, "Jiwoo"), "Jiwoo back home").not.toHaveClass(/\berrand\b/, { timeout: 6000 });

  const s = await timeline(kai);
  const walker = of(s, "Jiwoo").filter((x) => x.t >= sentAt);
  expect(walker.some((x) => /\berrand\b/.test(x.cls)), "the accepter walks").toBe(true);
  const reach = walker.find((x) => /\bat-spot\b/.test(x.cls) && x.pose === "reach");
  expect(reach, "she reaches up at the meeting spot").toBeDefined();
  expect(of(s, "Kai").filter((x) => x.t >= sentAt).some((x) => /\berrand\b/.test(x.cls)), "the lifter stays on his machine").toBe(false);
  const smack = s.find((x): x is Extract<Seen, { flight: string }> => "flight" in x && x.t >= sentAt && /\bsmack\b/.test(x.flight));
  expect(smack, "the smack").toBeDefined();
  const banner = firstBanner(s, "Jiwoo high-fived you 🙌")!;
  expect(Math.abs(banner.t - smack!.t), "the banner with the smack").toBeLessThan(600);
  expect(smack!.t - reach!.t, "the smack 250 ms into the reach").toBeLessThan(900);

  // both Lifting: Tom on a machine too offers Kai; nobody walks, palms fly and meet
  expect((await post(people.Tom, path, { action: "choose", exercise: "3" })).status()).toBe(303);
  await expect(avatar(kai, "Tom")).toHaveAttribute("data-state", "lifting");
  const offer2 = (await (await interact(people.Tom, path, kaiId, "highfive")).json()) as { offer: number };
  await expect(kai.locator(BANNER_LINE)).toHaveText("Tom wants a high-five ✋");
  const t2 = Date.now();
  expect((await post(people.Kai, path, { action: "accept", offer: String(offer2.offer) })).status()).toBe(200);
  // (Kai, the accepter, gets no banner of his own; the offer banner just goes)
  await expect
    .poll(async () => (await timeline(jiwoo)).some((x) => "flight" in x && x.t >= t2 && /\bsmack\b/.test(x.flight)), { message: "the palms meet", timeout: 3000 })
    .toBe(true);
  const s2 = (await timeline(jiwoo)).filter((x) => x.t >= t2);
  for (const who of ["Tom", "Kai"]) {
    expect(of(s2, who).some((x) => /\berrand\b/.test(x.cls)), `${who} doesn't walk`).toBe(false);
    expect(of(s2, who).some((x) => x.gesture), `${who} raises a hand over the machine`).toBe(true);
  }
  const flights = s2.filter((x): x is Extract<Seen, { flight: string }> => "flight" in x);
  expect(flights.filter((f) => /\bflight\b/.test(f.flight)).length, "a palm from each").toBeGreaterThanOrEqual(2);
  expect(flights.some((f) => /\bsmack\b/.test(f.flight)), "and they meet").toBe(true);
});

// INT-13.11 (the walker's Start set mid-errand: her sheet doesn't wait, her
// avatar heads for her machine), INT-13.14 (the move isn't lost: it flies
// from where she was, and plays once), INT-13.23 (reduced motion: no walk,
// no flight, a still each side, the banner at the event), and the main
// button is never covered.
test("Mia taps Start set mid-errand: her sheet doesn't wait and the cheer flies from where she was; with reduced motion nobody walks", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo", "Tom"]);
  expect((await post(people.Mia, path, { exercise_id: "3", weight_kg: "40", reps: "8" })).status()).toBe(303); // resting, bench
  const mia = await screen(people.Mia, path, { at: `${path}?exercise=3` });
  const jiwoo = await screen(people.Jiwoo, path, { viewport: LAPTOP });
  const reduced = await screen(people.Tom, path, { viewport: LAPTOP, reduced: true });
  await expect(mia.locator(MAIN)).toHaveText("Start set");
  const jiwooId = await idOf(mia, "Jiwoo");

  const sentAt = Date.now();
  expect((await interact(people.Mia, path, jiwooId, "cheer")).status()).toBe(200);
  await expect(avatar(mia, "Mia")).toHaveClass(/\berrand\b/, { timeout: 2500 });
  // checked the moment it's on its way, before anything else: she taps Start set
  await expect(mia.locator(MAIN), "Start set isn't covered or moved by the walk").toBeInViewport();
  await mia.locator(MAIN).click();
  await expect(mia.locator(MAIN), "her sheet doesn't wait").toHaveText("Done", { timeout: 2500 });
  await expect(jiwoo.locator(BANNER_LINE)).toHaveText("Mia is hyping you up 🔥", { timeout: 3500 });
  await expect(avatar(jiwoo, "Mia"), "she heads for her machine").toHaveClass(/\bon-machine\b/, { timeout: 4000 });

  const s = await timeline(jiwoo);
  const fromMia = of(s, "Mia").filter((x) => x.t >= sentAt);
  expect(fromMia.some((x) => /\bat-spot\b/.test(x.cls)), "she never got there").toBe(false);
  const flight = s.find((x): x is Extract<Seen, { flight: string }> => "flight" in x && x.t >= sentAt && /\bflight\b/.test(x.flight));
  expect(flight, "the cheer flies from where she was").toBeDefined();
  const banners = s.filter((x): x is Extract<Seen, { banner: string }> => "banner" in x && x.t >= sentAt && x.banner === "Mia is hyping you up 🔥");
  expect(banners, "it plays once").toHaveLength(1);
  expect(banners[0].t, "the banner as it lands").toBeGreaterThan(flight!.t);

  // reduced motion: no walk, nothing flies; the still frames come with the event
  const r = (await timeline(reduced)).filter((x) => x.t >= sentAt);
  expect(of(r, "Mia").some((x) => /\berrand\b/.test(x.cls)), "nobody walks").toBe(false);
  expect(r.some((x) => "flight" in x), "nothing flies").toBe(false);
  expect(of(r, "Mia").some((x) => x.pose === "cheer"), "a still of her cheer").toBe(true);
  expect(of(r, "Jiwoo").some((x) => x.pose === "cheer"), "and of Jiwoo's reaction").toBe(true);
});
