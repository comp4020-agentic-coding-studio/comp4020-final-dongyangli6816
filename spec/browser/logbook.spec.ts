import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { join, openRoom, person, post } from "./helpers.ts";

// The logbook refactor (docs/product/criteria/logbook.md) with the page's
// script running, people in their own browsers. The HTTP side is in
// spec/logbook*.test.ts; these are the four round-one scenarios. Each test
// names the criteria it covers.

const BENCH = "3";
const LATERAL = "8";
const PLANK = "16";

const dock = (p: Page) => p.locator(".sheet .dock button.wide");
const squadRow = (p: Page, name: string) => p.locator(".people li", { hasText: name });

// A page for this person. On `astro dev` (a worktree's server) the dev
// toolbar floats over the dock and takes its taps; a built app (CI) has none.
async function open(who: BrowserContext): Promise<Page> {
  const page = await who.newPage();
  await page.addInitScript(() => {
    new MutationObserver(() => document.querySelector("astro-dev-toolbar")?.remove()).observe(document, { childList: true, subtree: true });
  });
  return page;
}
// The room as this person's browser has it: at the address the server last
// sent them to (the contract, settled 2), waiting for the live stream.
async function inRoom(who: BrowserContext, at: string): Promise<Page> {
  const page = await open(who);
  await page.goto(at);
  await expect(page.locator(".map-panel .conn .badge")).toHaveText("Live");
  return page;
}
// a room action over HTTP, answering where the server sends her
async function act(who: BrowserContext, path: string, form: Record<string, string>): Promise<string> {
  const res = await post(who, path, form);
  expect(res.status(), JSON.stringify(form)).toBe(303);
  return res.headers().location;
}

// The dock's main button: that nothing covers its middle, and its box on the
// screen (the dock is pinned to the screen's foot, where a thumb finds it).
async function dockBox(p: Page) {
  return dock(p).evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    const covered = !hit || !(hit === el || el.contains(hit));
    return { covered, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  });
}
const uncovered = { covered: false };

// sets over HTTP, then finish; she stays in the room, Finished
async function session(who: BrowserContext, path: string, sets: Record<string, string>[]) {
  for (const s of sets) await act(who, path, s);
  return (await act(who, path, { action: "finish" })).match(/^\/workouts\/(\d+)/)![1];
}
const bench = (w: string, r: string) => ({ exercise_id: BENCH, weight_kg: w, reps: r });

// Scenario 1. LB-1.9 (twelve sets, all shown, the dock uncovered), LB-1.7 in
// the browser, LB-0.6 (the type by keyboard, by its accessible name), LB-2.11,
// LB-4.10 (the stamp announces the record), LB-4.13 (Tom sees only Resting),
// LB-0.1 (Done and Start set in the same place)
test("Mia logs a warm-up and a record against twelve sets of last time; Tom sees only her rest", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const tom = await person(browser, "Tom");
  const { path, passcode } = await openRoom(mia);
  await join(tom, passcode);
  await session(mia, path, Array.from({ length: 12 }, () => bench("60", "5")));
  const at = await act(mia, path, { action: "choose", exercise: BENCH });
  const [miaPage, tomPage] = await Promise.all([inRoom(mia, at), inRoom(tom, path)]);

  // Last time: all twelve, the first working set to match
  await expect(miaPage.locator("[data-last] [data-set]")).toHaveCount(12);
  await expect(miaPage.locator("[data-last] [data-match]")).toHaveCount(1);
  await expect(miaPage.locator("[data-last] li").first()).toHaveClass(/match/);
  await expect(dock(miaPage)).toHaveText("Done");
  const lifting = await dockBox(miaPage);
  expect(lifting, "twelve sets of Last time don't cover Done").toMatchObject(uncovered);

  // a warm-up, picked by keyboard: from Normal, one arrow along
  await miaPage.getByRole("radio", { name: "Normal" }).focus();
  await miaPage.keyboard.press("ArrowRight");
  await expect(miaPage.getByRole("radio", { name: "Warm-up" })).toBeChecked();
  await miaPage.fill("#weight_kg", "40");
  await miaPage.fill("#reps", "10");
  await dock(miaPage).click();
  await expect(miaPage.locator(".dock .stamp")).toContainText("Warm-up logged");
  await expect(dock(miaPage)).toHaveText("Start set");
  expect(await dockBox(miaPage), "Start set where Done was").toEqual(lifting);
  await expect(miaPage.getByRole("radio", { name: "Normal" }), "the next set starts at Normal").toBeChecked();
  await expect(miaPage.locator("[data-last] li").first(), "a warm-up doesn't move the set to match").toHaveClass(/match/);
  await expect(squadRow(tomPage, "Mia")).toContainText("Resting");

  // the next set, heavier than any of last time's, with an RPE
  await miaPage.fill("#weight_kg", "65");
  await miaPage.fill("#reps", "5");
  await dock(miaPage).click();
  await expect(dock(miaPage)).toHaveText("Done");
  await expect(squadRow(tomPage, "Mia")).toContainText("Lifting");
  await miaPage.fill("#rpe", "8");
  await dock(miaPage).click();
  const stamp = miaPage.locator(".dock .stamp");
  await expect(stamp).toContainText("Set 1 logged");
  await expect(stamp).toHaveAttribute("role", "status");
  await expect(stamp).toContainText(/New\s*Record/);
  await expect(stamp).toContainText("heaviest");
  await expect(miaPage.locator("[data-last] li").nth(1), "working set 2 to match next").toHaveClass(/match/);
  expect(await dockBox(miaPage), "Start set still in its place").toEqual(lifting);

  // Tom: Mia resting, and not a word about records
  await expect(squadRow(tomPage, "Mia")).toContainText("Resting");
  await expect(tomPage.locator("body")).not.toContainText(/record/i);
});

// Scenario 2. LB-3.1 (browser), LB-0.7 (pending, then a failure, on Save
// plan), LB-3.11 (one tap to /plans from the summary and home), LB-3.9
// (rename, and delete asks once more)
test("Mia saves a plan from her summary through a dropped connection, then renames and deletes it", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const { path } = await openRoom(mia);
  const workout = await session(mia, path, [bench("60", "8"), bench("60", "8")]);
  const page = await open(mia);
  await page.goto(`/workouts/${workout}`);
  const save = page.locator(".save-plan button");

  // the first try waits on a slow connection: disabled, its label kept. Then
  // the phone loses its connection (and keeps it lost, as the page may
  // quietly retry): the error beside the button, and the name she typed kept
  // (one tap may send the save more than once: every one is held, then dropped)
  let offline = false;
  const waiting: (() => void)[] = [];
  await page.route(`**/workouts/${workout}*`, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    if (!offline) await new Promise<void>((r) => waiting.push(r));
    return route.abort("internetdisconnected");
  });
  await page.fill("#plan-name", "Push day");
  await save.click();
  await expect(save).toBeDisabled();
  await expect(save).toHaveText("Save plan");
  await expect.poll(() => waiting.length).toBeGreaterThan(0);
  await mia.setOffline(true);
  offline = true;
  waiting.splice(0).forEach((go) => go());
  await expect(page.locator(".save-plan"), "the error beside it, still on the summary").toContainText("That didn't save. Try again.");
  await expect(page.locator("#plan-name")).toHaveValue("Push day");
  await page.unroute(`**/workouts/${workout}*`);
  await mia.setOffline(false);

  // the second try lands, confirmed in place, naming the plan
  await save.click();
  await expect(page.locator(".save-plan [role=status]")).toContainText("Saved as Push day");

  // one tap to the plans page, from the summary and from home
  await page.locator(".save-plan a.to-plans").click();
  await expect(page).toHaveURL(/\/plans$/);
  await page.goto("/");
  await page.locator("a.to-plans").click();
  await expect(page).toHaveURL(/\/plans$/);

  const card = page.locator("article.plan");
  await expect(card.locator("h2")).toHaveText("Push day");
  await card.getByText("Rename").click();
  await card.locator('input[name="name"]').fill("Chest");
  await card.getByRole("button", { name: "Save name" }).click();
  await expect(page.locator("article.plan h2")).toHaveText("Chest");

  // delete asks once more
  await page.locator("article.plan").getByText("Delete", { exact: true }).click();
  await expect(page.locator("article.plan")).toContainText("Keep it");
  await expect(page.locator("article.plan h2"), "nothing deleted yet").toHaveText("Chest");
  await page.locator("article.plan").getByRole("button", { name: "Delete plan" }).click();
  await expect(page.locator("article.plan")).toHaveCount(0);
  await expect(page.locator("main")).toContainText("Deleted Chest");
});

// Scenario 3. LB-3.12 to LB-3.17 in the browser, LB-3.25 (Tom can't tell a
// plan is loaded), LB-0.1 (the dock's box is the same with and without a
// plan, at 390 and 1280 px)
test("Mia works through a plan in one tap per exercise while Tom sees only her moves", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const tom = await person(browser, "Tom");
  const first = await openRoom(mia);
  const workout = await session(mia, first.path, [bench("60", "8"), { exercise_id: LATERAL, weight_kg: "8", reps: "12" }, { exercise_id: LATERAL, weight_kg: "8", reps: "12" }]);
  expect((await post(mia, `/workouts/${workout}`, { action: "save-plan", name: "Push day" })).status()).toBe(303);
  await post(mia, first.path, { action: "leave" });
  const { path, passcode } = await openRoom(mia);
  await join(tom, passcode);
  const [miaPage, tomPage] = await Promise.all([inRoom(mia, path), inRoom(tom, path)]);
  await expect(squadRow(tomPage, "Mia")).toContainText("Idle");

  // the dock without a plan, at both widths
  const narrow = await dockBox(miaPage);
  expect(narrow).toMatchObject(uncovered);
  await miaPage.setViewportSize({ width: 1280, height: 800 });
  const wide = await dockBox(miaPage);
  await miaPage.setViewportSize({ width: 390, height: 844 });

  // Idle with plans, Load a plan is open already (room spec L.4)
  await expect(miaPage.locator("details.plan-offer")).toHaveAttribute("open", "");
  await miaPage.locator(".plan-offer button").click();
  const benchItem = miaPage.locator(`[data-plan-item][data-exercise="${BENCH}"]`);
  const lateralItem = miaPage.locator(`[data-plan-item][data-exercise="${LATERAL}"]`);
  await expect(benchItem).toContainText("0 of 1");
  await expect(benchItem).toHaveAttribute("data-next", "");
  await expect(miaPage.locator("#exercise"), "Up next is preselected").toHaveValue(BENCH);
  await expect(dock(miaPage)).toHaveText("Choose");
  expect(await dockBox(miaPage), "the dock at 390 px, with the plan").toEqual(narrow);
  // At 1280 px the dock is the foot of the sticky sheet (room spec 3.x), so a
  // taller sheet moves it down: only its size and that nothing covers it are
  // held here. Whether its place must hold too is a gap between LB-0.1 and
  // the room design (round-two report).
  await miaPage.setViewportSize({ width: 1280, height: 800 });
  const wideWithPlan = await dockBox(miaPage);
  expect({ covered: wideWithPlan.covered, w: wideWithPlan.w, h: wideWithPlan.h }, "the dock at 1280 px, with the plan").toEqual({ covered: false, w: wide.w, h: wide.h });
  await miaPage.setViewportSize({ width: 390, height: 844 });

  // Tom: nothing changed
  await expect(squadRow(tomPage, "Mia")).toContainText("Idle");
  await expect(tomPage.locator("body")).not.toContainText("Push day");

  // one tap: Choose takes Up next
  await dock(miaPage).click();
  await expect(dock(miaPage)).toHaveText("Done");
  await expect(squadRow(tomPage, "Mia")).toContainText("Bench press");
  await dock(miaPage).click();
  await expect(dock(miaPage)).toHaveText("Start set");
  await expect(benchItem).toContainText("1 of 1");
  await expect(lateralItem).toHaveAttribute("data-next", "");
  await expect(squadRow(tomPage, "Mia")).toContainText("Resting");

  // during the rest, the plan's next exercise in one tap: a Choose, still resting
  await lateralItem.locator("button").click();
  await expect(squadRow(tomPage, "Mia"), "her station moves to the dumbbell rack").toContainText("dumbbell rack");
  await expect(squadRow(tomPage, "Mia")).toContainText("Resting");
  await expect(dock(miaPage)).toHaveText("Start set");
  await expect(miaPage.locator(".sheet .switch .lift")).toHaveText("Lateral raise");
  await expect(tomPage.locator("body")).not.toContainText("Push day");
});

// Scenario 4. LB-5.7 (the exercise name reached by keyboard from history),
// LB-5.9 (the chart fits at 360 and 1280 px), LB-2.20 (a note kept by Start
// set; one typed and left behind by a change of exercise is dropped)
test("Mia reaches her bench page by keyboard, reads the chart at both widths, and keeps one note but not another", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const { path } = await openRoom(mia);
  await session(mia, path, [bench("60", "8"), bench("62.5", "8")]);
  await session(mia, path, [bench("65", "5"), bench("67.5", "5")]);
  const page = await open(mia);
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/history");
  await page.locator(`a[href="/exercises/${BENCH}"]`).first().focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/exercises/${BENCH}$`));
  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await expect(page.locator("figure.chart svg"), `${width}: the chart`).toBeVisible();
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    expect(fits, `${width}: no sideways scroll`).toBe(true);
    const chart = await page.locator("figure.chart").boundingBox();
    expect(chart!.x + chart!.width, `${width}: the chart inside the screen`).toBeLessThanOrEqual(width);
  }

  // in the room, after her first bench set: a note kept by Start set
  const at = await act(mia, path, bench("70", "3"));
  const room = await inRoom(mia, at);
  await expect(dock(room)).toHaveText("Start set");
  await room.locator(".ex-note summary").click();
  await room.locator("#note").fill("seat on 4");
  await dock(room).click();
  await expect(dock(room)).toHaveText("Done");
  await expect(room.locator(".sheet [data-note]").first()).toHaveText("seat on 4");

  // typed but never saved, then a change of exercise and back: dropped
  await dock(room).click();
  await expect(dock(room)).toHaveText("Start set");
  await room.locator(".ex-note summary").click();
  await room.locator("#note").fill("left shoulder grumpy");
  await room.locator(".sheet .switch summary").click();
  await room.locator(".sheet .switch select").selectOption(PLANK);
  await room.locator(".sheet .switch .actions button").click();
  await expect(room.locator(".sheet .switch .lift")).toHaveText("Plank");
  await room.locator(".sheet .switch summary").click();
  await room.locator(".sheet .switch .recent button", { hasText: "Bench press" }).click();
  await expect(room.locator(".sheet .switch .lift")).toHaveText("Bench press");
  await expect(room.locator(".sheet [data-note]").first()).toHaveText("seat on 4");
});
