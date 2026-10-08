import { expect, test } from "@playwright/test";
import { join, openRoom, person, post } from "./helpers.ts";

// The room with its script running (docs/design/room/spec.md): the things the
// HTTP checks in spec/ can't see, because they happen in the browser. Each
// one is a bug that shipped once, or a promise only a page can keep.

test("the stopwatch runs after choosing a run (it broke after in-place swaps, 3bff11c)", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const { path } = await openRoom(mia);
  const page = await mia.newPage();
  await page.goto(path);
  // choosing swaps the sheet in place, as a person would do it
  await page.selectOption("#exercise", "1");
  await page.locator(".dock button").click();
  await page.locator(".sw-toggle").click();
  await page.waitForTimeout(2200);
  const seconds = Number(await page.inputValue("#minutes")) * 60 + Number(await page.inputValue("#seconds"));
  expect(seconds).toBeGreaterThanOrEqual(1);
});

test("a set logged in one browser shows in the other within a second", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const tom = await person(browser, "Tom");
  const { path, passcode } = await openRoom(mia);
  await join(tom, passcode);
  const miaPage = await mia.newPage();
  const tomPage = await tom.newPage();
  await Promise.all([miaPage.goto(path), tomPage.goto(path)]);
  await expect(tomPage.locator(".map-panel .conn .badge")).toHaveText("Live");

  await miaPage.selectOption("#exercise", "3"); // bench press
  await miaPage.locator(".dock button").click();
  await miaPage.fill("#weight_kg", "60");
  await miaPage.locator(".dock button").click();

  await expect(tomPage.locator(".people li", { hasText: "Mia" })).toContainText("Resting", { timeout: 1500 });
  // and on the map she heads for the water cooler
  await expect(tomPage.locator('.map .avatar[data-state="resting"]')).toHaveCount(1, { timeout: 1500 });
});

test("someone on their station stays put (avatars used to walk out and back)", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const { path } = await openRoom(mia);
  await post(mia, path, { action: "choose", exercise: "5" });
  const page = await mia.newPage();
  await page.goto(path);
  const avatar = page.locator(".map .avatar.me");
  await expect(avatar).toHaveClass(/on-station/);
  const tiles = new Set<string>();
  for (let i = 0; i < 15; i++) {
    tiles.add(await avatar.evaluate((b: HTMLElement) => `${b.style.getPropertyValue("--x")},${b.style.getPropertyValue("--y")}`));
    await page.waitForTimeout(200);
  }
  expect([...tiles]).toEqual(["6,1"]);
});

test("the map is drawn at a whole 2x on a phone", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const { path } = await openRoom(mia);
  const page = await mia.newPage();
  await page.goto(path);
  await expect(page.locator(".map-panel .map")).toHaveCSS("width", "320px");
});

test("Done says what it logged, and a run comes back empty", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const { path } = await openRoom(mia);
  const page = await mia.newPage();
  await page.goto(path);
  await page.selectOption("#exercise", "1"); // run
  await page.locator(".dock button").click();
  await page.fill("#distance_km", "2");
  await page.fill("#minutes", "10");
  await page.locator(".dock button").click();

  await expect(page.locator(".dock .stamp")).toContainText("Set 1 logged");
  await expect(page.locator(".set-done")).toContainText("Set 1 logged");
  await expect(page.locator("#distance_km")).toHaveValue("");
  await expect(page.locator("#minutes")).toHaveValue("");
});

test("squad heads aren't redrawn every second (they used to flicker)", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const { path } = await openRoom(mia);
  const page = await mia.newPage();
  await page.goto(path);
  await expect(page.locator(".map-panel .conn .badge")).toHaveText("Live");
  const head = await page.locator(".people .av").first().elementHandle();
  await page.waitForTimeout(2500);
  expect(await head!.evaluate((svg) => svg.isConnected && svg === document.querySelector(".people .av"))).toBe(true);
});

test("Start set ends the rest and brings Done back", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const { path } = await openRoom(mia);
  const page = await mia.newPage();
  await page.goto(path);
  await page.selectOption("#exercise", "3");
  await page.locator(".dock button").click();
  await page.fill("#weight_kg", "60");
  await page.locator(".dock button").click();
  await expect(page.locator(".rest .timer")).toBeVisible();
  await expect(page.locator(".dock button")).toHaveText("Start set");

  await page.locator(".dock button").click();
  await expect(page.locator(".rest")).toHaveCount(0);
  await expect(page.locator(".sheet .tab")).toContainText("Lifting");
  await expect(page.locator(".dock button")).toHaveText("Done");
});

test("people arriving and leaving show on the map and in the list, live", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const tom = await person(browser, "Tom");
  const { path, passcode } = await openRoom(mia);
  const page = await mia.newPage();
  await page.goto(path);
  await expect(page.locator(".map-panel .conn .badge")).toHaveText("Live");

  await join(tom, passcode);
  await expect(page.locator(".people li", { hasText: "Tom" })).toBeVisible({ timeout: 1500 });
  await expect(page.locator(".map .avatar")).toHaveCount(2);
  await expect(page.locator(".spots .count")).toHaveText("2 of 12 in");

  await post(tom, path, { action: "leave" });
  await expect(page.locator(".people li", { hasText: "Tom" })).toHaveCount(0, { timeout: 1500 });
  await expect(page.locator(".map .avatar")).toHaveCount(1);
});

test("equipment someone has delivered appears on everyone's map", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const tom = await person(browser, "Tom");
  const { path, passcode } = await openRoom(mia);
  await join(tom, passcode);
  const page = await mia.newPage();
  await page.goto(path);
  await expect(page.locator(".map-panel .conn .badge")).toHaveText("Live");
  await expect(page.locator('.station[data-slot="5"]')).not.toHaveAttribute("data-equipment");

  await post(tom, path, { action: "choose", exercise: "9" }); // deadlift: not on the floor
  await expect(page.locator('.station[data-slot="5"]')).toHaveAttribute("data-equipment", "lifting-platform", {
    timeout: 1500,
  });
});

test("when the host ends the room, everyone else is sent home", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const tom = await person(browser, "Tom");
  const { path, passcode } = await openRoom(mia);
  await join(tom, passcode);
  const page = await tom.newPage();
  await page.goto(path);
  await expect(page.locator(".map-panel .conn .badge")).toHaveText("Live");

  await post(mia, path, { action: "end" });
  await expect(page).toHaveURL(new RegExp(`/\\?ended=${passcode}`), { timeout: 3000 });
});

test("a dropped connection says Reconnecting, and logging still works", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const { path } = await openRoom(mia);
  const page = await mia.newPage();
  // the event stream never gets through
  await page.route("**/events", (route) => route.abort());
  await page.goto(path);
  await expect(page.locator(".map-panel .conn")).toContainText("Reconnecting", { timeout: 6000 });
  await page.selectOption("#exercise", "3");
  await page.locator(".dock button").click();
  await expect(page.locator(".dock button")).toHaveText("Done");
});

test("your own avatar is a shortcut to the sheet's button", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const { path } = await openRoom(mia);
  const page = await mia.newPage();
  await page.goto(path);
  await page.locator(".map .avatar.me").click();
  await expect(page.locator(".dock button")).toBeFocused();
});
