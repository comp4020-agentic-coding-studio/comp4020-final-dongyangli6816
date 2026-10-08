import { afterEach, describe, expect, it } from "vitest";
import { Browser, createRoom, freshEmail, openEvents, signUp, type RoomEvent } from "./helpers.ts";

// GYM-2 to GYM-5 and ADR 0004: the room's twelve stations. Choosing a lift
// claims a station with its equipment, delivering or swapping it in when
// needed, and two people choosing at once never share one. Each test reads
// the room from its event stream, as a screen in the room would.
const LIFTS = {
  run: { id: "1", equipment: "Treadmill" },
  bench: { id: "3", equipment: "Flat bench" },
  squat: { id: "5", equipment: "Squat rack" },
  curl: { id: "7", equipment: "Dumbbell rack" },
  deadlift: { id: "9", equipment: "Lifting platform" },
  pullUp: { id: "11", equipment: "Pull-up bar" },
  pulldown: { id: "13", equipment: "Cable machine" },
  plank: { id: "16", equipment: "Exercise mat" },
};
const ALL = Object.values(LIFTS);

const streams: { close: () => void }[] = [];
afterEach(() => streams.splice(0).forEach((s) => s.close()));

async function room(people: number) {
  const host = new Browser();
  await signUp(host, freshEmail(), "correct horse", "P0");
  const { path, passcode } = await createRoom(host);
  const rest = await Promise.all(
    Array.from({ length: people - 1 }, async (_, i) => {
      const b = new Browser();
      await signUp(b, freshEmail(), "correct horse", `P${i + 1}`);
      await b.post("/join", { passcode });
      return b;
    }),
  );
  const screen = await openEvents(host, path);
  streams.push(screen);
  return { path, people: [host, ...rest], screen };
}

const choose = (b: Browser, path: string, lift: { id: string }) => b.post(path, { action: "choose", exercise: lift.id });
const named = (e: RoomEvent) => Object.fromEntries(e.members.map((m) => [m.name, m]));
const floor = (e: RoomEvent) => e.stations.map((s) => s.equipment);

// Everyone holds a station with their lift's equipment, and nobody shares one.
function expectEveryoneOnTheirEquipment(e: RoomEvent, wanted: Map<string, string>) {
  const slots = new Set<number>();
  for (const [name, equipment] of wanted) {
    const station = named(e)[name].station;
    expect(station?.equipment, `${name}'s station`).toBe(equipment);
    expect(e.stations[station!.slot - 1].equipment).toBe(equipment.toLowerCase().replace(/ /g, "-"));
    slots.add(station!.slot);
  }
  expect(slots.size).toBe(wanted.size);
}

describe("the gym's stations", () => {
  it("open with the treadmill, bench, squat rack and dumbbell rack, and eight empty", async () => {
    const { screen } = await room(1);
    const e = await screen.next();
    expect(floor(e)).toEqual(["treadmill", "flat-bench", "squat-rack", "dumbbell-rack", ...Array(8).fill(null)]);
  });

  it("deliver equipment that isn't on the floor to an empty station, and everyone sees it", async () => {
    const { path, people, screen } = await room(2);
    await screen.next();
    await choose(people[1], path, LIFTS.deadlift);
    const e = await screen.until((e) => named(e).P1.station !== null);
    expect(named(e).P1.station).toEqual({ slot: 5, equipment: "Lifting platform" });
    expect(floor(e)[4]).toBe("lifting-platform");
  });

  it("use the free one first, and keep one station per person", async () => {
    const { path, people, screen } = await room(1);
    await choose(people[0], path, LIFTS.bench);
    await choose(people[0], path, LIFTS.squat);
    const e = await screen.until((e) => named(e).P0.station?.equipment === "Squat rack");
    expect(named(e).P0.station?.slot).toBe(3);
    // the bench stays where it was, free for the next person
    expect(floor(e).slice(0, 4)).toEqual(["treadmill", "flat-bench", "squat-rack", "dumbbell-rack"]);
  });

  it("never give two people choosing the one free bench at the same moment the same station", async () => {
    const { path, people, screen } = await room(2);
    await Promise.all(people.map((b) => choose(b, path, LIFTS.bench)));
    const e = await screen.until((e) => e.members.every((m) => m.station));
    const [a, b] = e.members.map((m) => m.station!);
    expect(a.equipment).toBe("Flat bench");
    expect(b.equipment).toBe("Flat bench");
    expect(a.slot).not.toBe(b.slot);
    // one took the bench on the floor, the other had a second one delivered
    expect([a.slot, b.slot]).toContain(2);
  });

  it("put all twelve people in a full room on their equipment, whatever they choose and in any order", async () => {
    const { path, people, screen } = await room(12);
    // two rounds of everyone choosing at once: the second has to swap out
    // equipment, and must never take what someone is still using
    for (const round of [0, 1]) {
      const wanted = new Map<string, string>();
      await Promise.all(
        people.map((b, i) => {
          const lift = ALL[(i * 3 + round * 5) % ALL.length];
          wanted.set(`P${i}`, lift.equipment);
          return choose(b, path, lift);
        }),
      );
      const e = await screen.until((e) => e.members.length === 12 && [...wanted].every(([n, eq]) => named(e)[n]?.station?.equipment === eq), 3000);
      expectEveryoneOnTheirEquipment(e, wanted);
    }
  });

  it("never swap out equipment someone is using", async () => {
    const { path, people, screen } = await room(12);
    // one after the other, so every station is held and the first person's
    // equipment has gone longest without a new claim
    const wanted = new Map<string, string>();
    for (const [i, b] of people.entries()) {
      const lift = ALL[i % ALL.length];
      wanted.set(`P${i}`, lift.equipment);
      await choose(b, path, lift);
    }
    // the last one switches: nothing free has a lifting platform and nothing
    // is empty, so the only station that may be swapped is the one they let go
    const last = people.length - 1;
    await choose(people[last], path, LIFTS.deadlift);
    wanted.set(`P${last}`, LIFTS.deadlift.equipment);
    const e = await screen.until((e) => named(e)[`P${last}`]?.station?.equipment === "Lifting platform", 3000);
    expectEveryoneOnTheirEquipment(e, wanted);
  });

  it("keep someone's station while they rest, and free it when they finish", async () => {
    const { path, people, screen } = await room(1);
    await people[0].post(path, { exercise_id: LIFTS.curl.id, weight_kg: "12", reps: "10" });
    let e = await screen.until((e) => named(e).P0.state === "resting");
    expect(named(e).P0.station).toEqual({ slot: 4, equipment: "Dumbbell rack" });
    await people[0].post(path, { action: "finish" });
    e = await screen.until((e) => named(e).P0.state === "finished");
    expect(named(e).P0.station).toBeNull();
    expect(floor(e)[3]).toBe("dumbbell-rack");
  });
});
