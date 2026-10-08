import { describe, expect, it } from "vitest";
import { Browser, createRoom, freshEmail, signUp } from "./helpers.ts";

// ROOM-3: invite links of the form /join/K7M2QX work, and survive signing up
// first. ROOM-4: a room holds at most twelve, and the thirteenth is told so.

async function openRoom() {
  const host = new Browser();
  await signUp(host);
  return { host, ...(await createRoom(host)) };
}

describe("invite links", () => {
  it("take someone signed in straight into the room", async () => {
    const { path, passcode } = await openRoom();
    const friend = new Browser();
    await signUp(friend);
    const res = await friend.get(`/join/${passcode}`);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(path);
    expect((await friend.get(path)).status).toBe(200);
  });

  it("survive signing up first", async () => {
    const { path, passcode } = await openRoom();
    const newcomer = new Browser();
    const invite = await newcomer.get(`/join/${passcode}`);
    expect(invite.status).toBe(200);
    const html = await invite.text();
    expect(html).toContain(passcode);
    const signupHref = `/signup?next=${encodeURIComponent(`/join/${passcode}`)}`;
    expect(html).toContain(signupHref.replace(/&/g, "&amp;"));

    const signedUp = await newcomer.request(signupHref, {
      method: "POST",
      body: new URLSearchParams({ email: freshEmail(), password: "correct horse", display_name: "Newcomer" }),
    });
    expect(signedUp.headers.get("location")).toBe(`/join/${passcode}`);
    const joined = await newcomer.follow(signedUp);
    expect(joined.headers.get("location")).toBe(path);
  });

  it("say nothing about a room to someone signed out, and give the one error to someone signed in", async () => {
    // a code no open room has: signed out, it's shown back as an invite like any other
    expect((await new Browser().get("/join/ZZZZZZ")).status).toBe(200);
    const someone = new Browser();
    await signUp(someone);
    const res = await someone.get("/join/ZZZZZZ");
    expect(res.status).toBe(404);
    expect(await res.text()).toContain("No open room has that passcode");
  });
});

describe("a full room", () => {
  it("lets twelve in, tells the thirteenth it's full, and lets them in once someone leaves", async () => {
    const { host, path, passcode } = await openRoom();
    const others = await Promise.all(
      Array.from({ length: 11 }, async () => {
        const b = new Browser();
        await signUp(b);
        expect((await b.post("/join", { passcode })).headers.get("location")).toBe(path);
        return b;
      }),
    );

    const thirteenth = new Browser();
    await signUp(thirteenth);
    const byCode = await thirteenth.post("/join", { passcode });
    expect(byCode.status).toBe(409);
    expect(await byCode.text()).toContain("full: 12 of 12 are in.");
    expect((await thirteenth.get(`/join/${passcode}`)).status).toBe(409);
    // someone already in can still open the link and land in the room
    expect((await others[0].get(`/join/${passcode}`)).headers.get("location")).toBe(path);

    await others[0].post(path, { action: "leave" });
    expect((await thirteenth.post("/join", { passcode })).headers.get("location")).toBe(path);
    expect((await host.get(path)).status).toBe(200);
  });
});
