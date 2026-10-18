import { afterEach, describe, expect, it } from "vitest";
import { Browser, createRoom, freshEmail, openEvents, signUp } from "./helpers.ts";

// ADR 0006: who can see and change what, decided on the server. Checked the
// way someone poking at the app from outside its pages would.

describe("after signing in, you stay on this site", () => {
  const offSite = ["//evil.example", "/\\evil.example", "https://evil.example"];

  it("ignores a next that points at another host, on sign-in", async () => {
    const { email, password } = await signUp(new Browser());
    for (const next of offSite) {
      const res = await new Browser().post(`/signin?next=${encodeURIComponent(next)}`, { email, password });
      expect(res.headers.get("location")).toBe("/");
    }
  });

  it("ignores it on sign-up, and still follows a path on this site", async () => {
    for (const next of offSite) {
      const res = await new Browser().post(`/signup?next=${encodeURIComponent(next)}`, {
        email: freshEmail(),
        password: "correct horse",
        display_name: "Tester",
      });
      expect(res.headers.get("location")).toBe("/avatar?new=1&next=/");
    }
    const res = await new Browser().post("/signup?next=/history", {
      email: freshEmail(),
      password: "correct horse",
      display_name: "Tester",
    });
    expect(res.headers.get("location")).toBe("/history");
  });

  it("ignores it when saving a look, and never links to it", async () => {
    const b = new Browser();
    await signUp(b);
    const page = await (await b.get("/avatar?new=1&next=//evil.example")).text();
    expect(page).not.toContain("evil.example");
  });
});

// ends within ms, or the test fails
const endsWithin = (ended: Promise<void>, ms = 2000) =>
  Promise.race([
    ended.then(() => "ended"),
    new Promise((resolve) => setTimeout(() => resolve("still open"), ms)),
  ]);

describe("a room's live stream stops once you're no longer in it", () => {
  const streams: { close: () => void }[] = [];
  afterEach(() => streams.splice(0).forEach((s) => s.close()));

  async function hostAndFriend() {
    const host = new Browser();
    await signUp(host, freshEmail(), "correct horse", "Host");
    const room = await createRoom(host);
    const friend = new Browser();
    await signUp(friend, freshEmail(), "correct horse", "Friend");
    await friend.post("/join", { passcode: room.passcode });
    return { host, friend, ...room };
  }

  async function watch(b: Browser, path: string) {
    const events = await openEvents(b, path);
    streams.push(events);
    await events.next();
    return events;
  }

  it("hangs up on someone who leaves, and not on the others", async () => {
    const { host, friend, path } = await hostAndFriend();
    const hostScreen = await watch(host, path);
    const friendScreen = await watch(friend, path);
    await friend.post(path, { action: "leave" });
    expect(await endsWithin(friendScreen.ended)).toBe("ended");
    expect(await endsWithin(hostScreen.ended, 300)).toBe("still open");
  });

  it("hangs up on everyone when the host ends the room", async () => {
    const { host, friend, path } = await hostAndFriend();
    const hostScreen = await watch(host, path);
    const friendScreen = await watch(friend, path);
    await host.post(path, { action: "end" });
    expect(await endsWithin(friendScreen.ended)).toBe("ended");
    expect(await endsWithin(hostScreen.ended)).toBe("ended");
  });

  it("hangs up on someone who signs out", async () => {
    const { host, friend, path } = await hostAndFriend();
    const hostScreen = await watch(host, path);
    const friendScreen = await watch(friend, path);
    await friend.post("/signout", {});
    expect(await endsWithin(friendScreen.ended)).toBe("ended");
    expect(await endsWithin(hostScreen.ended, 300)).toBe("still open");
  });
});

describe("passwords and passcodes can't be guessed by brute force", () => {
  it("stops sign-in after ten wrong passwords, even with the right one", async () => {
    const { email, password } = await signUp(new Browser());
    for (let i = 0; i < 10; i++) {
      expect((await new Browser().post("/signin", { email, password: `wrong-${i}` })).status).toBe(400);
    }
    const res = await new Browser().post("/signin", { email, password });
    expect(res.status).toBe(429);
    expect(await res.text()).toContain("Too many tries. Give it 15 minutes");
  });

  it("doesn't count right passwords, or other people's tries", async () => {
    const mine = await signUp(new Browser());
    const theirs = await signUp(new Browser());
    for (let i = 0; i < 10; i++) await new Browser().post("/signin", { email: theirs.email, password: "wrong" });
    for (let i = 0; i < 12; i++) {
      expect((await new Browser().post("/signin", { email: mine.email, password: mine.password })).status).toBe(303);
    }
  });

  it("stops joining after ten wrong passcodes, typed or from a link (ROOM-7)", async () => {
    const host = new Browser();
    await signUp(host);
    const { passcode } = await createRoom(host);
    const guesser = new Browser();
    await signUp(guesser);
    for (let i = 0; i < 5; i++) expect((await guesser.post("/join", { passcode: "ZZZZZ2" })).status).toBe(404);
    for (let i = 0; i < 5; i++) expect((await guesser.get("/join/ZZZZZ3")).status).toBe(404);

    const typed = await guesser.post("/join", { passcode });
    expect(typed.status).toBe(429);
    expect(await typed.text()).toContain("Too many tries. Give it a minute.");
    expect((await guesser.get(`/join/${passcode}`)).status).toBe(429);
  });
});
