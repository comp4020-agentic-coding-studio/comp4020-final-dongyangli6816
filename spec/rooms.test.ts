import { describe, expect, it } from "vitest";
import { Browser, createRoom, freshEmail, signUp } from "./helpers.ts";

// A room can be left and closed (ROOM-5, ROOM-6), and nothing anyone logged
// in it is lost when it is.
const BENCH = "3";

async function hostAndFriend() {
  const host = new Browser();
  await signUp(host);
  const room = await createRoom(host);
  const friend = new Browser();
  await signUp(friend, freshEmail(), "correct horse", "Friend");
  await friend.post("/join", { passcode: room.passcode });
  return { host, friend, ...room };
}

describe("leaving a room", () => {
  it("keeps the room open for the others, and the leaver's sets in their history", async () => {
    const { host, friend, path } = await hostAndFriend();
    await friend.post(path, { exercise_id: BENCH, weight_kg: "40", reps: "10" });

    const left = await friend.post(path, { action: "leave" });
    expect(left.status).toBe(303);
    expect(left.headers.get("location")).toMatch(/^\/workouts\/\d+/);
    expect(await (await friend.get("/history")).text()).toContain("Bench press");

    const hostView = await (await host.get(path)).text();
    expect(hostView).not.toContain("Friend");
  });

  it("closes the room when the last person leaves, freeing the passcode", async () => {
    const host = new Browser();
    await signUp(host);
    const { path, passcode } = await createRoom(host);
    const left = await host.post(path, { action: "leave" });
    expect(left.headers.get("location")).toMatch(/^\/\?left=/);

    const someone = new Browser();
    await signUp(someone);
    expect((await someone.post("/join", { passcode })).status).toBe(404);
  });
});

describe("ending a room", () => {
  it("only the host can end it", async () => {
    const { friend, path } = await hostAndFriend();
    expect((await friend.post(path, { action: "end" })).status).toBe(403);
    expect((await friend.get(path)).status).toBe(200);
  });

  it("closes it for everyone and finishes their workouts, sets kept", async () => {
    const { host, friend, path, passcode } = await hostAndFriend();
    await friend.post(path, { exercise_id: BENCH, weight_kg: "40", reps: "10" });

    expect((await host.post(path, { action: "end" })).status).toBe(303);

    const back = await friend.get(path);
    expect(back.status).toBe(303);
    expect(back.headers.get("location")).toBe(`/?ended=${passcode}&logged=1`);
    const history = await (await friend.get("/history")).text();
    expect(history).toContain("Bench press");
    expect(history).not.toContain("Still on the floor");

    const home = await (await friend.get("/")).text();
    expect(home).not.toContain(`href="${path}"`);
  });
});
