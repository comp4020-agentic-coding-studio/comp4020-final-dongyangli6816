import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { join, openRoom, origin, person, post } from "./helpers.ts";

// Avatar accessories with the pages' scripts running
// (docs/product/criteria/accessories.md: AV-4, AV-6, AV-7). The server's
// side (what unlocks, what is refused, the events) is
// spec/accessories.test.ts, whose contract these use to set things up. Four
// scenarios, two people each in their own browser. Each names the criteria
// it covers.
//
// Hooks: the editor's as the contract and avatar spec A.3 give them
// (fieldset[data-slot], radios name=head|face|neck, value none|<id>,
// [data-acc][data-state], the preview `.preview svg.av[data-wear]` and its
// `g.acc.acc-<id>` groups). The room's banners are the room design's
// (`.banner-slot .banner`, its line `.banner-line`, its one button
// `.banner-act`, live 500 ms after `data-shown`; the room's banner adds
// `.room`). Every server-drawn avatar carries data-wear="<head>,<face>,<neck>";
// the room's script keeps `data-look` on the map's avatar, which ends in the
// same three ids. Copy is asserted by the criteria's words, not the emoji.

const BANNER = ".banner-slot .banner";
const MAIN = ".dock button.wide";
const LAPTOP = { width: 1280, height: 900 };
const DAY = 24 * 60 * 60 * 1000;

async function room(browser: Browser, names: string[]) {
  const people: Record<string, BrowserContext> = {};
  for (const name of names) people[name] = await person(browser, name);
  const { path, passcode } = await openRoom(people[names[0]]);
  for (const name of names.slice(1)) await join(people[name], passcode);
  return { path, people };
}

// A page for this person. On `astro dev` (a worktree's server) the dev
// toolbar floats over the dock and takes its taps; a built app (CI) has none.
async function open(who: BrowserContext): Promise<Page> {
  const page = await who.newPage();
  await page.addInitScript(() => {
    new MutationObserver(() => document.querySelector("astro-dev-toolbar")?.remove()).observe(document, { childList: true, subtree: true });
  });
  return page;
}

async function screen(who: BrowserContext, path: string, opts: { viewport?: { width: number; height: number }; at?: string } = {}) {
  const page = await open(who);
  if (opts.viewport) await page.setViewportSize(opts.viewport);
  await page.goto(opts.at ?? path);
  await expect(page.locator(".map-panel .conn .badge")).toHaveText("Live");
  return page;
}

const avatar = (page: Page, name: string) => page.locator(`.map .avatar[aria-label^="${name},"], .map .avatar[aria-label^="${name} (you),"]`);
// what an avatar on the map wears, from its own drawing
const worn = (page: Page, name: string) =>
  avatar(page, name).evaluate((a) => (a.matches("[data-wear]") ? a : a.querySelector("[data-wear]"))?.getAttribute("data-wear") ?? null);
const logLines = (page: Page) => page.locator("section.room-log li:not(.joined)");
const box = async (l: Locator) => (await l.boundingBox())!;
const intersects = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

// The banner's button ignores taps for its first half second (INT-9.11)
async function tapBanner(page: Page) {
  const act = page.locator(`${BANNER} .banner-act`);
  await expect(act).toBeVisible();
  await page.waitForFunction(() => {
    const b = document.querySelector<HTMLElement>(".banner-slot .banner-act");
    return !!b && Date.now() - Number(b.dataset.shown) > 600;
  });
  await act.click();
}

// Done from the page: the sheet open on an exercise, these numbers. If she's
// resting, she taps Start set first, as she would.
async function logSet(page: Page, weight: string, reps = "8") {
  await page.locator("#weight_kg").fill(weight);
  await page.locator("#reps").fill(reps);
  if ((await page.locator(MAIN).textContent())?.trim() === "Start set") await page.locator(MAIN).click();
  await expect(page.locator(MAIN)).toHaveText("Done");
  await page.locator(MAIN).click();
  await expect(page.locator(MAIN)).toHaveText("Start set");
}

// Mia's earlier days: one finished workout of one bench set each, moved
// back k days (the contract's test hook), so the next working set today is
// day n + 1
async function earlierDays(who: BrowserContext, path: string, n: number) {
  for (let k = n; k >= 1; k--) {
    expect((await post(who, path, { exercise_id: "3", weight_kg: "40", reps: "8" })).status()).toBe(303);
    const fin = await post(who, path, { action: "finish" });
    const workout = fin.headers().location.match(/^\/workouts\/(\d+)/)![1];
    const res = await who.request.post(`${path}/qa`, { form: { op: "backdate", ms: String(k * DAY), workout }, headers: { origin: origin() }, maxRedirects: 0 });
    expect(res.status(), "the test hook (SPOTTER_TEST_HOOKS=1)").toBe(204);
  }
}

// AV-6.1 (the earner's banner, with Wear it, clear of the dock, never
// focused), AV-6.4 (two at once: one banner naming both, Wear it puts on
// the first), AV-6.5 (the newest replaces the current), AV-6.2 (Wear it: the
// banner goes, she and the other screen draw it within a second), AV-6.7
// (a quick unlock: nothing on the other screen), AV-5.10, AV-5.13 (the Squad
// cap for both, the one who didn't act told too), AV-7.7
test("Mia and Jiwoo each log a first set: both are told of the Squad cap, and Mia wears hers from the banner while Jiwoo watches", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Jiwoo"]);
  const mia = await screen(people.Mia, path, { at: `${path}?exercise=3` });
  const jiwoo = await screen(people.Jiwoo, path, { viewport: LAPTOP, at: `${path}?exercise=7` });
  expect(await worn(jiwoo, "Mia"), "Mia wears nothing to start").toBe(",,");
  const mainBefore = await box(mia.locator(MAIN));

  // Mia's first working set: the Sweatband, told only to her
  await mia.locator("#weight_kg").fill("40");
  await mia.locator("#reps").fill("8");
  await mia.locator(MAIN).click();
  await expect(mia.locator(`${BANNER} .banner-line`)).toContainText("New: sweatband");
  await expect(mia.locator(`${BANNER} .banner-act`)).toHaveAccessibleName("Wear it: sweatband");
  await expect(mia.locator(`${BANNER} .banner-act`)).not.toBeFocused();
  await expect(mia.locator(BANNER)).toBeVisible();
  await expect(mia.locator(".dock")).toBeVisible();
  expect(intersects(await box(mia.locator(BANNER)), await box(mia.locator(".dock"))), "the banner is clear of the dock").toBe(false);
  expect(await box(mia.locator(MAIN)), "the dock's button didn't move").toEqual(mainBefore);
  await expect(jiwoo.locator(BANNER), "nothing on Jiwoo's screen").toHaveCount(0);

  // Jiwoo's first: one banner naming both of hers; Mia's Sweatband banner
  // is replaced by her Squad cap one
  await logSet(jiwoo, "10");
  await expect(jiwoo.locator(`${BANNER} .banner-line`)).toContainText(/New: sweatband and squad cap/i);
  await expect(mia.locator(`${BANNER} .banner-line`)).toContainText(/New: squad cap/i);
  await expect(mia.locator(BANNER), "the newest replaced it: one banner").toHaveCount(1);

  // Mia taps Wear it: the banner goes, both screens draw the Squad cap on her
  await tapBanner(mia);
  const tapped = Date.now();
  await expect(mia.locator(BANNER), "the banner goes on the tap").toHaveCount(0);
  await expect(mia.locator("#sheet-news"), "her screen reader hears it").toHaveText("Wearing the squad cap");
  await expect.poll(() => worn(jiwoo, "Mia"), { timeout: 1000, message: "Jiwoo's map within a second" }).toBe("squad-cap,,");
  expect(Date.now() - tapped).toBeLessThan(1500);
  await expect.poll(() => worn(mia, "Mia")).toBe("squad-cap,,");
  // Jiwoo taps Wear it on hers: the first named, the Sweatband
  await tapBanner(jiwoo);
  await expect.poll(() => worn(mia, "Jiwoo")).toBe("sweatband,,");
});

// AV-6.1 (the PB's unlock banner on her screen, her stamp still carries the
// record mark), AV-6.7 (Tom sees the PB, never the Shades), AV-6.12 (a
// reload shows no unlock banner again), AV-4.13
test("Mia beats her bench: she's told of Shades, Tom only sees the PB, and her reload brings no banner back", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  expect((await post(people.Mia, path, { exercise_id: "3", weight_kg: "40", reps: "8" })).status()).toBe(303);
  const tom = await screen(people.Tom, path, { viewport: LAPTOP });
  const mia = await screen(people.Mia, path, { at: `${path}?exercise=3` });
  await expect(mia.locator(BANNER)).toHaveCount(0);

  await logSet(mia, "45");
  await expect(mia.locator(`${BANNER} .banner-line`)).toContainText("New: shades");
  await expect(mia.locator(`${BANNER} .banner-act`)).toHaveAccessibleName("Wear it: shades");
  await expect(mia.locator(".stamp [data-set]")).toHaveAttribute("data-records", /\bheaviest\b/);
  await expect(tom.locator(`${BANNER}.room .banner-line`)).toContainText("Mia hit a PB on bench press");
  await expect(tom.locator(BANNER), "nothing about the shades").not.toContainText(/shades|unlocked/i);
  await expect(logLines(tom).first()).toContainText("Mia hit a PB on bench press");
  await expect(logLines(tom)).not.toContainText([/unlocked/i]);

  await mia.reload();
  await expect(mia.locator(".map-panel .conn .badge")).toHaveText("Live");
  await mia.waitForTimeout(500); // a replay would come with the first render
  await expect(mia.locator(BANNER), "no unlock banner after a reload").toHaveCount(0);
  expect(await worn(mia, "Mia"), "never put on by itself").toBe(",,");
});

// AV-6.7 (a long-haul unlock: Tom's room banner with Cheer, which is a
// Cheer to Mia; Mia's own banner, not the room's), AV-6.8 (with a PB: one
// combined banner), AV-6.9 (the log lines), AV-6.10 (the fanfare plays on
// Tom's screen)
test("Mia's tenth day is also a PB: Tom gets one banner for both and cheers her from it", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  await earlierDays(people.Mia, path, 9); // 40 kg x 8 on each
  const tom = await open(people.Tom);
  await tom.setViewportSize(LAPTOP);
  await tom.addInitScript(() => {
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
  await tom.goto(path);
  await expect(tom.locator(".map-panel .conn .badge")).toHaveText("Live");
  await tom.locator(".map-panel .map-sign").click(); // a tap lets the page play sound
  const sounds = () => tom.evaluate(() => (window as unknown as { __sounds: number }).__sounds);
  const mia = await screen(people.Mia, path, { at: `${path}?exercise=3` });
  const miaLaptop = await screen(people.Mia, path, { viewport: LAPTOP }); // her other screen
  const heard = await sounds();

  await logSet(mia, "45");
  const line = tom.locator(`${BANNER}.room .banner-line`);
  await expect(line).toContainText("Mia hit a PB on bench press and unlocked the silver medal");
  await expect(tom.locator(BANNER), "one banner, not two").toHaveCount(1);
  await expect(tom.locator(`${BANNER} .banner-act`)).toHaveAccessibleName("Cheer Mia");
  await expect.poll(sounds, { message: "the fanfare plays for Tom" }).toBeGreaterThan(heard);
  // Mia: her own banner, long-haul first
  await expect(mia.locator(`${BANNER} .banner-line`)).toContainText(/New: silver medal and shades/i);
  await expect(mia.locator(`${BANNER}.room`), "not the room's banner").toHaveCount(0);
  // two lines from one Done, the unlock above the PB (room spec X.5)
  await expect(logLines(tom).nth(0)).toContainText("Mia unlocked the silver medal");
  await expect(logLines(tom).nth(1)).toContainText("Mia hit a PB on bench press");
  for (const page of [miaLaptop, mia]) {
    await expect(logLines(page).nth(0)).toContainText("You unlocked the silver medal");
    await expect(logLines(page).nth(1)).toContainText("You hit a PB on bench press");
    await expect(logLines(page), "one line each").toHaveCount(2);
  }
  // the unlock line is its own kind, not the PB's (room spec X.5)
  for (const page of [tom, mia, miaLaptop]) {
    await expect(page.locator("section.room-log li.unlock"), "the unlock's own line kind").toHaveCount(1);
    await expect(page.locator("section.room-log li.pb")).toHaveCount(1);
  }

  // Tom's Cheer from the banner is a Cheer to Mia
  await tapBanner(tom);
  await expect(mia.locator(`${BANNER} .banner-line`)).toContainText("Tom is hyping you up");
});

// AV-4.7 (the preview follows a pick before Save, and without the page's
// script), AV-4.10 (each slot a named group; arrows move within one; a
// locked one is text, never a stop), AV-4.5 (Save: the success state),
// AV-7.7 (Tom's map draws it within a second, no reload)
test("Mia picks a cap and glasses in the editor by keyboard and saves; Tom's map draws them at once", async ({ browser }) => {
  const { path, people } = await room(browser, ["Mia", "Tom"]);
  const tom = await screen(people.Tom, path, { viewport: LAPTOP });
  expect(await worn(tom, "Mia")).toBe(",,");
  const page = await open(people.Mia);
  await page.goto("/avatar");
  const preview = page.locator(".preview svg.av");
  await expect(preview.locator("g.acc-cap")).toBeHidden();

  // groups by name; a locked one is read as text, not a choice
  await expect(page.getByRole("group", { name: "Head" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Face" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Neck" })).toBeVisible();
  await expect(page.locator('[data-acc="crown"]')).toContainText("Locked");
  await expect(page.locator('[data-acc="crown"]')).toContainText(/crown, locked: train 4 weeks in a row/i);
  expect(await page.locator('[data-acc="crown"] input, [data-acc="crown"] [tabindex]').count(), "no keyboard stop on a locked one").toBe(0);

  // Head: None to Cap by the arrow key; the preview follows before Save
  await page.getByRole("radio", { name: "None" }).first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('input[name="head"][value="cap"]')).toBeChecked();
  await expect(page.locator('input[name="head"][value="cap"]')).toBeFocused();
  await expect(preview.locator("g.acc-cap")).toBeVisible();
  await page.getByRole("group", { name: "Face" }).getByRole("radio", { name: "Glasses" }).check();
  await expect(preview.locator("g.acc-glasses")).toBeVisible();
  await expect(page.locator("form.editor .status-line")).toHaveText("Not saved yet.");
  expect(await worn(tom, "Mia"), "nothing on Tom's map before Save").toBe(",,");

  await page.locator(".actions button").click();
  await expect(page.locator(".bubble")).toContainText("Saved");
  await expect.poll(() => worn(tom, "Mia"), { timeout: 1000, message: "Tom's map within a second" }).toBe("cap,glasses,");

  // and with no script: the preview still follows a pick
  const noJs = await browser.newContext({ javaScriptEnabled: false, storageState: await people.Mia.storageState() });
  const plain = await noJs.newPage();
  await plain.goto("/avatar");
  await expect(plain.locator(".preview svg.av g.acc-towel")).toBeHidden();
  await plain.locator('input[name="neck"][value="towel"]').check();
  await expect(plain.locator(".preview svg.av g.acc-towel")).toBeVisible();
  await noJs.close();
});
