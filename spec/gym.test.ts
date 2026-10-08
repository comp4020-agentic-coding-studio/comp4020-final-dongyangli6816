import { describe, expect, it } from "vitest";
import { Browser, createRoom, freshEmail, signUp } from "./helpers.ts";

// GYM-1, GYM-2, GYM-8, GYM-9: the room page draws the gym from the server,
// so it's there with no script and after a reload: twelve stations, the
// opening four pieces of equipment, and a button for everyone on the floor
// that says who they are and what they're doing.

const stationsOf = (html: string) =>
  [...html.matchAll(/class="station[^"]*"[^>]*data-slot="(\d+)"(?: data-equipment="([\w-]+)")?/g)].map((m) => ({
    slot: Number(m[1]),
    equipment: m[2] ?? null,
  }));
const avatarLabels = (html: string) => [...html.matchAll(/class="avatar[^"]*"[^>]*aria-label="([^"]+)"/g)].map((m) => m[1]);

describe("the gym map", () => {
  it("draws twelve stations with the opening four, and everyone in the room", async () => {
    const host = new Browser();
    await signUp(host, freshEmail(), "correct horse", "Mia");
    const { path, passcode } = await createRoom(host);
    const friend = new Browser();
    await signUp(friend, freshEmail(), "correct horse", "Tom");
    await friend.get(`/join/${passcode}`);

    const html = await (await host.get(path)).text();
    expect(stationsOf(html)).toEqual([
      { slot: 1, equipment: "treadmill" },
      { slot: 2, equipment: "flat-bench" },
      { slot: 3, equipment: "squat-rack" },
      { slot: 4, equipment: "dumbbell-rack" },
      ...Array.from({ length: 8 }, (_, i) => ({ slot: i + 5, equipment: null })),
    ]);
    expect(avatarLabels(html)).toEqual(["Mia (you), idle, no station yet", "Tom, idle, no station yet"]);
  });

  it("shows delivered equipment, and who is on it, after a reload", async () => {
    const host = new Browser();
    await signUp(host, freshEmail(), "correct horse", "Mia");
    const { path } = await createRoom(host);
    await host.post(path, { action: "choose", exercise: "9" }); // deadlift

    const html = await (await host.get(path)).text();
    expect(stationsOf(html)[4]).toEqual({ slot: 5, equipment: "lifting-platform" });
    expect(avatarLabels(html)).toEqual(["Mia (you), lifting, deadlift on lifting platform 5"]);
  });
});
