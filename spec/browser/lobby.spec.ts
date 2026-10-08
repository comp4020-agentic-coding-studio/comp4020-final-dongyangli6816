import { expect, test } from "@playwright/test";
import { fresh, openRoom, person } from "./helpers.ts";

// The lobby with its script and styles running (docs/design/avatar,
// docs/design/join): the avatar editor's live preview, invites through sign
// up, and the passcode field.

test("the avatar preview follows a choice before it's saved", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const page = await mia.newPage();
  await page.goto("/avatar");
  const shirt = page.locator(".preview .av rect.t").first();
  await page.locator('input[name="shirt"][value="grey"]').check();
  // grey is #8c8f94: the preview is recoloured by CSS alone (AV-2)
  await expect(shirt).toHaveCSS("fill", "rgb(140, 143, 148)");
  await expect(page.locator("form.editor .status-line")).toHaveText("Not saved yet.");

  await page.locator(".actions button").click();
  await expect(page.locator(".bubble")).toContainText("Saved");
  await expect(page.locator('input[name="shirt"][value="grey"]')).toBeChecked();
});

test("Randomise rolls a look in the page, without saving it", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const page = await mia.newPage();
  await page.goto("/avatar");
  const before = await page.locator("form.editor").evaluate((f) => [...new FormData(f as HTMLFormElement)].join());
  let posted = false;
  page.on("request", (r) => r.method() === "POST" && (posted = true));
  // a roll can land on the same look, so roll until it doesn't (or give up)
  for (let i = 0; i < 5; i++) {
    await page.locator(".shuffle").click();
    const after = await page.locator("form.editor").evaluate((f) => [...new FormData(f as HTMLFormElement)].join());
    if (after !== before) break;
  }
  await expect(page.locator("form.editor .status-line")).toHaveText("Not saved yet.");
  expect(posted).toBe(false);
});

test("an invite link survives signing up, in the browser", async ({ browser }) => {
  const host = await person(browser, "Mia");
  const { path, passcode } = await openRoom(host);
  const newcomer = await browser.newContext();
  const page = await newcomer.newPage();
  await page.goto(`/join/${passcode}`);
  await expect(page.locator("h1")).toHaveText("You're invited");
  await page.locator("a.button.wide", { hasText: "Sign up" }).click();
  await page.fill("#display_name", "Tom");
  await page.fill("#email", fresh());
  await page.fill("#password", "correct horse");
  await page.locator('main form button[type="submit"]').click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  await expect(page.locator(".people li", { hasText: "Tom" })).toBeVisible();
});

test("the passcode field drops the characters a passcode never uses", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const page = await mia.newPage();
  await page.goto("/join");
  await page.locator("#passcode").pressSequentially("k7o0m2il1qx");
  await expect(page.locator("#passcode")).toHaveValue("K7M2QX");
});

test("home's avatar tile and link open the editor", async ({ browser }) => {
  const mia = await person(browser, "Mia");
  const page = await mia.newPage();
  await page.goto("/");
  await expect(page.locator(".player .av")).toBeVisible();
  await page.locator(".edit-link").click();
  await expect(page).toHaveURL(/\/avatar$/);
  await expect(page.locator("h1")).toHaveText("Your avatar");
});
