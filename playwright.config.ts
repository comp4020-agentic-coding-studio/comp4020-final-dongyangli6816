import { defineConfig } from "@playwright/test";

// Browser checks (spec/browser/): what only shows up with the page's script
// running, against the running app like the rest of spec/. APP_URL says where
// it is, as for `pnpm test`. CI uses the Chromium Playwright installs;
// locally, the Chrome already on the machine.
export default defineConfig({
  testDir: "spec/browser",
  timeout: 30_000,
  workers: 2,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.APP_URL ?? "http://localhost:8080",
    channel: process.env.CI ? undefined : "chrome",
    // a phone: the layout the gym is designed for first
    viewport: { width: 390, height: 844 },
    screenshot: "only-on-failure",
  },
});
