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
