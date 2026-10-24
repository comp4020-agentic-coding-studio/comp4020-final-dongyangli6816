import { expect, test, type Browser, type BrowserContext } from "@playwright/test";

// Shared by the browser checks: people in their own browsers, and rooms.

export const origin = () => new URL(test.info().project.use.baseURL!).origin;
export const fresh = () => `b${Date.now()}${Math.random().toString(36).slice(2, 8)}@example.test`;

// a signed-up person in their own browser (own cookies)
export async function person(browser: Browser, name: string): Promise<BrowserContext> {
  const context = await browser.newContext();
  const res = await context.request.post("/signup", {
    form: { email: fresh(), password: "correct horse", display_name: name },
    headers: { origin: origin() },
    maxRedirects: 0,
  });
  expect(res.status()).toBe(303);
  return context;
}

export async function openRoom(host: BrowserContext): Promise<{ path: string; passcode: string }> {
  const res = await host.request.post("/rooms", { headers: { origin: origin() }, maxRedirects: 0 });
  const path = new URL(res.headers().location, origin()).pathname;
  const html = await (await host.request.get(path)).text();
  return { path, passcode: html.match(/class="passcode"[^>]*>([A-Z0-9]{6})</)![1] };
}

export const join = (who: BrowserContext, passcode: string) => who.request.get(`/join/${passcode}`, { maxRedirects: 0 });

export const post = (who: BrowserContext, path: string, form: Record<string, string>) =>
  who.request.post(path, { form, headers: { origin: origin() }, maxRedirects: 0 });

// The test hook (contract at the top of spec/interactions.test.ts), through a
// person's own request context: as if everything one member did in the room,
// or the room's own events and Dony's summon, had happened ms earlier.
export async function backdate(who: BrowserContext, path: string, target: { user: number } | { room: true }, ms: number) {
  const form: Record<string, string> = { op: "backdate", ms: String(Math.round(ms)) };
  if ("user" in target) form.user = String(target.user);
  else form.room = "1";
  const res = await who.request.post(`${path}/qa`, { form, headers: { origin: origin() }, maxRedirects: 0 });
  expect(res.status(), "the test hook (SPOTTER_TEST_HOOKS=1, spec/interactions.test.ts)").toBe(204);
}
