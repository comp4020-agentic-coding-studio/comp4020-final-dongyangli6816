import { describe, expect, it, type TestContext } from "vitest";
import { backdate, Browser, createRoom, freshEmail, roomLogOf, signUp, watchRoom, type RoomEvent } from "./helpers.ts";

// Equipment delivery (docs/product/criteria/delivery.md, GYM-6 and GYM-7),
// the parts the server decides, checked over HTTP against the running app.
// The worker himself is drawn only by a live page's script, so his walk is
// round two's (spec/browser/delivery.spec.ts). Each test names the criteria
// it covers.
//
// ===========================================================================
// THE CONTRACT (agreed by the user, 4 Nov). The build meets this; the tests
// hold it to it. Anything not written here is the build's choice.
// ===========================================================================
//
// No new requests. Choosing a lift (action=choose), logging a set, Start set
// (action=start) and every other room action are sent and answered exactly
// as today. A run (a delivery or a swap) can't be asked for, cancelled or
// hurried, so there is nothing new to refuse.
//
// One new field per station. The `room` event on /rooms/<id>/events reports
// each station as
//   { slot: number, equipment: string | null, placedAt: number | null }
// placedAt is when the station's current equipment was put there, ms since
// epoch, on the server's clock:
//   - a new room's four opening pieces: the room's creation time;
//   - a delivery to an empty station, or a swap: the time of the claim;
//   - a claim of equipment already on the floor, a repeat claim of equipment
//     the person already holds, Start set, finishing, leaving, Away:
//     unchanged;
//   - an empty station: null.
// Screens compare it with the event's existing `now` field (server time), so
// a wrong device clock doesn't matter.
//
// First render: each station element in the server's HTML of /rooms/<id>
// carries data-placed-at beside its existing data-slot and data-equipment:
// `.station[data-slot][data-equipment][data-placed-at]` (data-equipment and
// data-placed-at absent on an empty station). The worker, when drawn, has
// class `worker`; the server's HTML never contains an element with class
// `worker`. Only a live page's script draws him, on seeing a station change.
//
// Log: the existing `station.claim` line gains `carried_out` (the equipment
// taken away) on a swap. Nothing is logged per screen or per worker. (Judged
// by reading the log; not an HTTP test.)
//
// Test hook: none new. The existing backdate hook (POST /rooms/<id>/qa,
// op=backdate, see spec/helpers.ts `backdate`) is enough for making someone
// Away (GYM-6.11) and moving Dony's visit a full block into the past
// (GYM-6.33). backdate never changes a station's placedAt; a test may rely
// on that.
// ===========================================================================

// Exercise ids are the seeded ones (spec/stations.test.ts); equipment ids as
// the room reports them.
const LIFTS = {
  run: "1", // treadmill
  bench: "3", // flat-bench
  squat: "5", // squat-rack
  curl: "7", // dumbbell-rack
  deadlift: "9", // lifting-platform
  romanian: "10", // the other exercise on the lifting platform
  pullUp: "11", // pull-up-bar
  pulldown: "13", // cable-machine
  plank: "16", // exercise-mat
};
const OPENING = ["treadmill", "flat-bench", "squat-rack", "dumbbell-rack", ...Array<null>(8).fill(null)];

// A room with these people in it, the first its host, each in their own
// browser. ids come from the room's own stream, as the page gets them.
// Streams opened here close when the test ends.
async function gym(ctx: TestContext, names: string[]) {
  const b: Record<string, Browser> = {};
  await Promise.all(
    names.map(async (name) => {
      b[name] = new Browser();
      await signUp(b[name], freshEmail(), "correct horse", name);
    }),
  );
  const { path, passcode } = await createRoom(b[names[0]]);
  for (const name of names.slice(1)) await b[name].post("/join", { passcode });
  const watch = async (name: string) => {
    const w = await watchRoom(b[name], path);
    ctx.onTestFinished(() => w.close());
    return w;
  };
  const first = await now(b[names[0]], path);
  const id: Record<string, number> = {};
  for (const m of first.members) id[m.name] = m.id;
  return { path, b, id, watch };
}

// the room as it is now, from a fresh stream's first event (closed at once,
// so nobody is kept from Away)
async function now(b: Browser, path: string): Promise<RoomEvent> {
  const w = await watchRoom(b, path);
  try {
    return await w.next("room", () => true, 2000);
  } finally {
    w.close();
  }
}

const choose = (b: Browser, path: string, exercise: string) => b.post(path, { action: "choose", exercise });
const logSet = (b: Browser, path: string, exercise: string) => b.post(path, { exercise_id: exercise, weight_kg: "40", reps: "8" });
const member = (e: RoomEvent, name: string) => e.members.find((m) => m.name === name);
const floor = (e: RoomEvent) => e.stations.map((s) => s.equipment);
// every station as stored: what's on it, and since when. A placed time is a
// number on a station with equipment and null on an empty one, so comparing
// two layouts can't pass with the field missing from both.
function layout(e: RoomEvent) {
  return e.stations.map((s) => {
    if (s.equipment === null) expect(s.placedAt, `empty station ${s.slot}'s placedAt`).toBeNull();
    else expect(typeof s.placedAt, `station ${s.slot}'s placedAt`).toBe("number");
    return { slot: s.slot, equipment: s.equipment, placedAt: s.placedAt };
  });
}

// ---------- the first render ----------

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
function stationsOf(html: string) {
  return [...html.matchAll(/<div\b[^>]*class="station\b[^"]*"[^>]*>/g)].map((m) => {
    const placed = attr(m[0], "data-placed-at");
    return {
      slot: Number(attr(m[0], "data-slot")),
      equipment: attr(m[0], "data-equipment") ?? null,
      placedAt: placed === undefined ? null : Number(placed),
    };
  });
}
const hasWorker = (html: string) => /<[a-z][^>]*\sclass="(?:[^"]*\s)?worker(?:\s[^"]*)?"/.test(html);
const avatarLabels = (html: string) => [...html.matchAll(/<button[^>]*class="avatar[^"]*"[^>]*aria-label="([^"]+)"/g)].map((m) => m[1]);
// the squad list's rows, by member id, and the headcount line
const squadIds = (html: string) => [...(html.match(/<ul class="people"[\s\S]*?<\/ul>/)?.[0] ?? "").matchAll(/<li\b[^>]*data-id="(\d+)"/g)].map((m) => Number(m[1]));
const headcount = (html: string) => html.match(/\d+ of 12 in/)?.[0] ?? null;
const squadRowOf = (html: string, id: number) => {
  const li = html.match(new RegExp(`<li\\b[^>]*data-id="${id}"[^>]*>([\\s\\S]*?)</li>`))?.[1] ?? "";
  // as spec/animations.test.ts reads it: span.what may hold a span of its own
  const what = li.match(/<span class="what"[^>]*>([\s\S]*?)<\/span>\s*<\/span>|<span class="what"[^>]*>([\s\S]*?)<\/span>/)?.[0];
  return what?.replace(/<[^>]+>/g, "").trim() ?? null;
};

// ===========================================================================

describe("where equipment comes from", () => {
  // GYM-6.18 (HTTP): the opening four are in place on the first render and
  // the first update, placed when the room was made; nothing is on its way
  it("opens a new room with its four pieces already in place, placed at its creation, and no worker", async (ctx) => {
    const { path, b } = await gym(ctx, ["Mia"]);
    const html = await (await b.Mia.get(path)).text();
    const e = await now(b.Mia, path);

    expect(floor(e)).toEqual(OPENING);
    const created = e.stations[0].placedAt;
    expect(typeof created, "the treadmill's placedAt").toBe("number");
    // the four were placed together, when the room was made: a moment ago
    for (const s of e.stations.slice(0, 4)) expect(s.placedAt, `station ${s.slot}`).toBe(created);
    expect(e.now - created!).toBeGreaterThanOrEqual(0);
    expect(e.now - created!).toBeLessThan(10_000);
    for (const s of e.stations.slice(4)) expect(s.placedAt, `empty station ${s.slot}`).toBeNull();

    // the first render says the same, and draws no worker bringing them
    expect(stationsOf(html)).toEqual(layout(e));
    expect(hasWorker(html)).toBe(false);
  });

  // GYM-6.4 (HTTP), GYM-7.3, GYM-6.3 (the room reports stations and people,
  // never runs)
  it("answers a choice that needs a delivery at once, and another member's stream has the equipment on its station, placed at the claim", async (ctx) => {
    const { path, b, watch } = await gym(ctx, ["Mia", "Tom"]);
    const tom = await watch("Tom");
    const before = await tom.next("room", () => true, 2000);
    expect(floor(before)[4], "station 5 starts empty").toBeNull();

    const sent = Date.now();
    const res = await choose(b.Mia, path, LIFTS.deadlift);
    const answeredIn = Date.now() - sent;
    expect(res.status, "answered as a choice is today").toBe(303);
    expect(answeredIn, "the answer doesn't wait for the run").toBeLessThan(1000);

    const e = await tom.next("room", (e) => member(e, "Mia")?.station !== null, 1000);
    expect(e.arrivedAt - sent, "on Tom's stream within a second").toBeLessThan(1000);
    expect(member(e, "Mia")?.station).toEqual({ slot: 5, equipment: "Lifting platform" });
    const placed = e.stations[4];
    expect(placed.equipment).toBe("lifting-platform");
    // placed at the claim: after the room Tom saw before it, by the time of this update
    expect(placed.placedAt).toBeGreaterThanOrEqual(before.now);
    expect(placed.placedAt).toBeLessThanOrEqual(e.now);
    // every other station as it was
    expect(layout(e).filter((s) => s.slot !== 5)).toEqual(layout(before).filter((s) => s.slot !== 5));

    // nothing about the run itself: the room is stations and people, as before
    expect(Object.keys(e).sort()).toEqual(Object.keys(before).sort());
    for (const s of e.stations) expect(Object.keys(s).sort()).toEqual(["equipment", "placedAt", "slot"]);
  });

  // GYM-6.2 (HTTP), GYM-6.19 (HTTP), GYM-6.29 (HTTP): someone who opens the
  // room a moment after a claim gets it drawn in place, with no worker
  it("draws a claim made a moment ago in place for someone opening the room: the machine down, Mia on it, no worker, nothing else changed", async (ctx) => {
    const { path, b, id } = await gym(ctx, ["Mia", "Tom", "Jiwoo"]);
    const beforeHtml = await (await b.Jiwoo.get(path)).text();
    expect(squadIds(beforeHtml).length).toBe(3);
    expect(headcount(beforeHtml)).toBe("3 of 12 in");

    // Jiwoo opens the room straight after the claim, while the run would
    // still be playing on a live screen
    await choose(b.Mia, path, LIFTS.deadlift);
    const html = await (await b.Jiwoo.get(path)).text();
    const e = await now(b.Jiwoo, path);

    // the platform already on station 5, placed when the stream says, and Mia on it
    const station5 = stationsOf(html).find((s) => s.slot === 5);
    expect(station5).toEqual({ slot: 5, equipment: "lifting-platform", placedAt: e.stations[4].placedAt });
    expect(typeof station5?.placedAt).toBe("number");
    expect(avatarLabels(html)).toContain("Mia, lifting, deadlift on lifting platform 5");
    expect(squadRowOf(html, id.Mia)).toBe("Deadlift · lifting platform 5");
    // no worker, and nothing said about a delivery
    expect(hasWorker(html)).toBe(false);
    // (in the markup a person reads, not the page's style or script)
    const markup = html.replace(/<(style|script)\b[\s\S]*?<\/\1>/g, "");
    expect(markup).not.toMatch(/on its way|waiting for (the )?equipment/i);
    // the worker is nobody: the same squad rows, the same count, no new log line
    expect(squadIds(html)).toEqual(squadIds(beforeHtml));
    expect(headcount(html)).toBe("3 of 12 in");
    expect(roomLogOf(html)).toEqual(roomLogOf(beforeHtml));
  });
});

describe("a swap", () => {
  // GYM-6.11 (HTTP): with every station held but one, including by someone
  // Resting and someone made Away by the test hook, a swap takes only the
  // free one, though theirs have gone unused far longer. Twelve people, so a
  // few seconds.
  it("carries out only equipment nobody holds, never that of someone Resting or Away", async (ctx) => {
    const holders = ["Mia", "Rest", "Away", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10"];
    const { path, b, id } = await gym(ctx, [...holders, "Tom"]);
    // the four opening pieces held: Rest Resting on the bench, Away Lifting
    // on the squat rack (made Away below)
    await choose(b.Mia, path, LIFTS.run);
    await logSet(b.Rest, path, LIFTS.bench);
    await choose(b.Away, path, LIFTS.squat);
    await choose(b.P3, path, LIFTS.curl);
    // seven deliveries fill all but one empty station
    const delivered = [LIFTS.deadlift, LIFTS.pullUp, LIFTS.pulldown, LIFTS.plank, LIFTS.run, LIFTS.bench, LIFTS.squat];
    for (const [i, lift] of delivered.entries()) await choose(b[`P${i + 4}`], path, lift);
    // Tom has the last empty station delivered a dumbbell rack, then wants a
    // platform: nothing free has one, nothing is empty, so the only station
    // that may be swapped is the one he lets go of, the newest on the floor
    await choose(b.Tom, path, LIFTS.curl);
    await backdate(b.Mia, path, { user: id.Away }, 61_000);

    const before = await now(b.Mia, path);
    expect(member(before, "Rest")?.state).toBe("resting");
    expect(member(before, "Away")?.away, "Away is Away").toBe(true);
    expect(member(before, "Away")?.station?.equipment).toBe("Squat rack");
    expect(floor(before).every((eq) => eq !== null), "every station holds equipment").toBe(true);
    const free = member(before, "Tom")!.station!.slot;
    expect(before.stations[free - 1].equipment).toBe("dumbbell-rack");
    const held = before.members.filter((m) => m.name !== "Tom").map((m) => m.station?.slot);
    expect(new Set(held).size, "eleven other stations held").toBe(11);

    await choose(b.Tom, path, LIFTS.deadlift);
    const after = await now(b.Mia, path);
    expect(member(after, "Tom")?.station).toEqual({ slot: free, equipment: "Lifting platform" });
    const swapped = after.stations[free - 1];
    expect(swapped.equipment).toBe("lifting-platform");
    // a swap is placed at the claim
    expect(swapped.placedAt).toBeGreaterThanOrEqual(before.now);
    expect(swapped.placedAt).toBeLessThanOrEqual(after.now);
    // every held station exactly as it was, Resting's and Away's included
    expect(layout(after).filter((s) => s.slot !== free)).toEqual(layout(before).filter((s) => s.slot !== free));
    expect(member(after, "Rest")?.station).toEqual(member(before, "Rest")?.station);
    expect(member(after, "Away")?.station).toEqual(member(before, "Away")?.station);
  }, 30_000);
});

describe("claims that cause no run", () => {
  // GYM-6.39 (HTTP): a double tap delivers once; choosing the same lift
  // again, or the other exercise on the same machine, changes nothing stored
  it("delivers once for a double tap, and not at all for a repeat or the other exercise on the same machine", async (ctx) => {
    const { path, b } = await gym(ctx, ["Mia"]);
    await Promise.all([choose(b.Mia, path, LIFTS.deadlift), choose(b.Mia, path, LIFTS.deadlift)]);
    const first = await now(b.Mia, path);
    expect(floor(first).filter((eq) => eq === "lifting-platform"), "one platform delivered").toHaveLength(1);
    expect(floor(first).filter((eq) => eq !== null)).toHaveLength(5);
    expect(member(first, "Mia")?.station?.equipment).toBe("Lifting platform");

    await choose(b.Mia, path, LIFTS.deadlift);
    expect(layout(await now(b.Mia, path)), "the same lift again").toEqual(layout(first));

    await choose(b.Mia, path, LIFTS.romanian);
    const other = await now(b.Mia, path);
    expect(member(other, "Mia")?.exercise, "she's on the other exercise").not.toBe(member(first, "Mia")?.exercise);
    expect(member(other, "Mia")?.station?.slot).toBe(member(first, "Mia")?.station?.slot);
    expect(layout(other), "the other exercise on the same machine").toEqual(layout(first));
  });

  // GYM-6.15 (HTTP): back to a platform still on its way gets it back, with
  // no new run
  it("gives Mia her platform back with no new run when she chooses deadlift again after a bench", async (ctx) => {
    const { path, b } = await gym(ctx, ["Mia"]);
    await choose(b.Mia, path, LIFTS.deadlift);
    const delivered = await now(b.Mia, path);
    expect(member(delivered, "Mia")?.station).toEqual({ slot: 5, equipment: "Lifting platform" });

    await choose(b.Mia, path, LIFTS.bench);
    const onBench = await now(b.Mia, path);
    expect(member(onBench, "Mia")?.station).toEqual({ slot: 2, equipment: "Flat bench" });

    await choose(b.Mia, path, LIFTS.deadlift);
    const back = await now(b.Mia, path);
    expect(member(back, "Mia")?.station).toEqual({ slot: 5, equipment: "Lifting platform" });
    expect(layout(back)).toEqual(layout(delivered));
  });

  // GYM-7.8 (HTTP): Start set keeps her station and its equipment
  it("changes no station when someone Resting taps Start set", async (ctx) => {
    const { path, b } = await gym(ctx, ["Mia"]);
    await logSet(b.Mia, path, LIFTS.pullUp); // a pull-up bar delivered to 5, then Resting on it
    const resting = await now(b.Mia, path);
    expect(member(resting, "Mia")?.state).toBe("resting");
    expect(member(resting, "Mia")?.station).toEqual({ slot: 5, equipment: "Pull-up bar" });

    await b.Mia.post(path, { action: "start", exercise_id: LIFTS.pullUp, weight_kg: "", reps: "8" });
    const lifting = await now(b.Mia, path);
    expect(member(lifting, "Mia")?.state).toBe("lifting");
    expect(member(lifting, "Mia")?.station).toEqual({ slot: 5, equipment: "Pull-up bar" });
    expect(layout(lifting)).toEqual(layout(resting));
  });

  // GYM-6.33 (HTTP): Dony out for over a block (moved there by the hook)
  // leaves the stored layout as it was
  it("never changes the layout while Dony trains, even a full block into his visit", async (ctx) => {
    const { path, b } = await gym(ctx, ["Mia"]);
    const before = await now(b.Mia, path);
    expect((await b.Mia.post(path, { action: "dony", intent: "summon" })).status).toBe(303);
    // a block is 45 to 60 minutes and 3 to 6 Idle between blocks (BOT-3)
    await backdate(b.Mia, path, { room: true }, 70 * 60_000);
    const later = await now(b.Mia, path);
    const dony = (later as RoomEvent & { dony?: { member: { state: string } | null } }).dony?.member;
    expect(dony, "Dony is out").toBeTruthy();
    expect(layout(later)).toEqual(layout(before));
  });
});

describe("logging while equipment is on its way", () => {
  // GYM-7.2 (HTTP): Done straight after a choice that needed a delivery
  it("accepts and stores a set logged straight after a choice that needed a delivery, and starts the rest", async (ctx) => {
    const { path, b, watch } = await gym(ctx, ["Mia", "Tom"]);
    const tom = await watch("Tom");
    await tom.next("room", () => true, 2000);

    await choose(b.Mia, path, LIFTS.pulldown); // a cable machine delivered to 5
    const logged = await b.Mia.post(path, { exercise_id: LIFTS.pulldown, weight_kg: "45", reps: "12" });
    expect(logged.status, "answered as a set is today").toBe(303);

    const e = await tom.next("room", (e) => member(e, "Mia")?.state === "resting", 1000);
    expect(member(e, "Mia")?.station).toEqual({ slot: 5, equipment: "Cable machine" });
    expect(member(e, "Mia")?.exercise).toBe("Lat pulldown");
    const history = await (await b.Mia.get("/history")).text();
    expect(history).toContain("Lat pulldown");
    expect(history).toContain("45 kg × 12");
  });
});
