import { describe, expect, it } from "vitest";
import { Browser, createRoom, freshEmail, signUp } from "./helpers.ts";

// The promises of the week-9 slice (docs/product/spec-4-weeks.md),
// checked against the running app the way a browser would use it.

describe("a stranger's trace is still there when they come back", () => {
  it("keeps a logged set in history after signing out and back in", async () => {
    const b = new Browser();
    const { email, password } = await signUp(b);
    const { path } = await createRoom(b);

    // Bench press is exercise 3 in the seeded list
    const logged = await b.post(path, { exercise_id: "3", weight_kg: "62.5", reps: "7" });
    expect(logged.status).toBe(303);

    await b.post("/signout", {});
    expect((await b.get("/history")).status).toBe(303); // signed out: sent to sign in

    const back = await b.post("/signin", { email, password });
    expect(back.status).toBe(303);
    const history = await (await b.get("/history")).text();
    expect(history).toContain("Bench press");
    expect(history).toContain("62.5");
  });

  it("pre-fills weight and reps from the person's last set of that exercise", async () => {
    const b = new Browser();
    await signUp(b);
    const { path } = await createRoom(b);
    await b.post(path, { exercise_id: "5", weight_kg: "100", reps: "5" });

    const page = await (await b.get(`${path}?exercise=5`)).text();
    expect(page).toMatch(/name="weight_kg"[^>]*value="100"/);
    expect(page).toMatch(/name="reps"[^>]*value="5"/);
  });
});

describe("accounts", () => {
  it("refuses a second account for the same email in any letter case", async () => {
    const email = freshEmail();
    expect((await signUp(new Browser(), email)).res.status).toBe(303);
    expect((await signUp(new Browser(), email.toUpperCase())).res.status).toBe(400);
  });

  it("refuses a password under 8 characters and a display name under 2", async () => {
    expect((await signUp(new Browser(), freshEmail(), "short")).res.status).toBe(400);
    expect((await signUp(new Browser(), freshEmail(), "long enough", "A")).res.status).toBe(400);
  });

  it("never sends the password back, and the session cookie is HttpOnly", async () => {
    const b = new Browser();
    const password = `secret-${Math.random().toString(36).slice(2)}`;
    const { res } = await signUp(b, freshEmail(), password);
    expect(res.headers.getSetCookie().join("\n")).toMatch(/sid=[^;]+;.*HttpOnly/i);
    for (const path of ["/", "/history"]) {
      expect(await (await b.get(path)).text()).not.toContain(password);
    }
  });
});

describe("rooms are closed to anyone without the passcode", () => {
  it("joins with the passcode, in any case and with stray spaces", async () => {
    const host = new Browser();
    await signUp(host);
    const { path, passcode } = await createRoom(host);
    expect(passcode).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);

    const friend = new Browser();
    await signUp(friend, freshEmail(), "correct horse", "Friend");
    const joined = await friend.post("/join", { passcode: ` ${passcode.toLowerCase()} ` });
    expect(joined.headers.get("location")).toBe(path);
    expect(await (await friend.get(path)).text()).toContain("Tester");
  });

  it("gives one generic error for a wrong code, and hides the room from non-members", async () => {
    const host = new Browser();
    await signUp(host);
    const { path } = await createRoom(host);

    const stranger = new Browser();
    await signUp(stranger);
    const wrong = await stranger.post("/join", { passcode: "ZZZZZZ" });
    expect(wrong.status).toBe(404);
    expect(await wrong.text()).toContain("No open room has that passcode");
    expect((await stranger.get(path)).status).toBe(404);
  });
});
