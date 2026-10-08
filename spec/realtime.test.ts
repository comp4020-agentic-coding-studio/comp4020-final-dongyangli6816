import { afterEach, describe, expect, it } from "vitest";
import { Browser, createRoom, freshEmail, openEvents, signUp, type RoomEvent } from "./helpers.ts";

// GYM-13: a change made in one browser reaches every other open screen in the
// room within about a second, with no reload. Each test watches a room's
// event stream the way the room page does, and acts through ordinary posts.
const BENCH = "3";
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
  await events.next(); // the room as it is on arrival
  return events;
}

const member = (e: RoomEvent, name: string) => e.members.find((m) => m.name === name);

describe("the room, live", () => {
  it("shows a set logged in one browser on another's screen within a second", async () => {
    const { host, friend, path } = await hostAndFriend();
    const hostScreen = await watch(host, path);

    await friend.post(path, { exercise_id: BENCH, weight_kg: "40", reps: "10" });

    const seen = await hostScreen.until((e) => member(e, "Friend")?.state === "resting");
    expect(member(seen, "Friend")?.exercise).toBe("Bench press");
  });

  it("shows a chosen lift as Lifting, and a finished workout as Finished", async () => {
    const { host, friend, path } = await hostAndFriend();
    const hostScreen = await watch(host, path);

    await friend.post(path, { action: "choose", exercise: BENCH });
    await hostScreen.until((e) => member(e, "Friend")?.state === "lifting");

    await friend.post(path, { action: "finish" });
    await hostScreen.until((e) => member(e, "Friend")?.state === "finished");
  });

  it("shows Start set ending a rest as Lifting again", async () => {
    const { host, friend, path } = await hostAndFriend();
    const hostScreen = await watch(host, path);
    await friend.post(path, { exercise_id: BENCH, weight_kg: "40", reps: "10" });
    await hostScreen.until((e) => member(e, "Friend")?.state === "resting");

    const started = await friend.post(path, { action: "start", exercise_id: BENCH, weight_kg: "42.5", reps: "10" });
    // the page comes back ready for Done, with what was typed still there
    expect(started.status).toBe(200);
    expect(await started.text()).toMatch(/value="42.5"/);
    await hostScreen.until((e) => member(e, "Friend")?.state === "lifting");
  });

  it("shows people arriving and leaving", async () => {
    const host = new Browser();
    await signUp(host, freshEmail(), "correct horse", "Host");
    const { path, passcode } = await createRoom(host);
    const hostScreen = await watch(host, path);

    const friend = new Browser();
    await signUp(friend, freshEmail(), "correct horse", "Friend");
    await friend.post("/join", { passcode });
    await hostScreen.until((e) => !!member(e, "Friend"));

    await friend.post(path, { action: "leave" });
    await hostScreen.until((e) => !member(e, "Friend"));
  });

  it("tells everyone when the host ends the room", async () => {
    const { host, friend, path } = await hostAndFriend();
    const friendScreen = await watch(friend, path);
    await host.post(path, { action: "end" });
    await friendScreen.until((e) => e.closed);
  });

  it("is decided on the server: when someone turns Slacking comes from their stored rest", async () => {
    const { host, friend, path } = await hostAndFriend();
    const hostScreen = await watch(host, path);
    await friend.post(path, { exercise_id: BENCH, weight_kg: "40", reps: "10" });

    const seen = await hostScreen.until((e) => member(e, "Friend")?.state === "resting");
    // bench press rests 150 s by default, and Slacking starts 30 s past it (GYM-11)
    const slackIn = member(seen, "Friend")!.slackAt! - seen.now;
    expect(slackIn).toBeGreaterThan(175_000);
    expect(slackIn).toBeLessThanOrEqual(180_000);
  });

  it("can't be watched by anyone outside the room", async () => {
    const { path } = await hostAndFriend();
    const stranger = new Browser();
    await signUp(stranger);
    expect((await stranger.get(`${path}/events`)).status).toBe(404);
    expect((await new Browser().get(`${path}/events`)).status).toBe(404);
  });
});
