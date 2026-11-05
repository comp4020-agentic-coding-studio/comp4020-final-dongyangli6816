import { describe, expect, it, type TestContext } from "vitest";
import { backdate, Browser, createRoom, freshEmail, signUp, watchRoom, type RoomEvent, type RoomWatch, type Who } from "./helpers.ts";

// Acting it out (docs/product/criteria/room-acting.md, INT-13 to INT-16,
// BOT-8): avatars walk over, gesture and react, all drawn on each screen.
// The server's only part is to say, on each event, what state the people in
// it were in, so every screen draws the same thing. Checked over HTTP
// against the running app; each test names the criteria it covers. The
// walking, gestures, flights and timing are the browser tests'.
//
// ===========================================================================
// THE CONTRACT (QA round one, 5 Nov 2026; settled by the user). Addendum to
// the room-feel contract at the top of spec/room-feel.test.ts. No new
// requests, answers, refusals, stored data or test hooks.
// ===========================================================================
//
// Events (changed):
//   interaction  gains `fromState`: the sender's state when the server
//                accepted it (idle, lifting, resting, slacking, finished),
//                as `targetState` already is the target's. Replies too.
//                (INT-13.20)
//   highfive     with `done` gains `fromState` (the offerer's) and `toState`
//                (the accepter's), each as the room shows them at the moment
//                it happened; for Dony's acceptance, at his acceptance,
//                worked out from his schedule. An offer (no `done`) carries
//                neither. (INT-16, BOT-8.5)
//   Everything else about where avatars stand, walk or gesture is worked out
//   on each screen; the `room` event is unchanged, and no walk ever changes a
//   member's state, station, rest or slacking time on the server.
// ===========================================================================

type State = "idle" | "lifting" | "resting" | "slacking" | "finished";
const S = 1000;
const MIN = 60 * S;

async function gym(ctx: TestContext, names: string[]) {
  const b: Record<string, Browser> = {};
  for (const name of names) {
    b[name] = new Browser();
    await signUp(b[name], freshEmail(), "correct horse", name);
  }
  const { path } = await createRoom(b[names[0]]);
  const passcode = (await (await b[names[0]].get(path)).text()).match(/class="passcode"[^>]*>([A-Z0-9]{6})</)![1];
  for (const name of names.slice(1)) await b[name].post("/join", { passcode });
  const watch = async (name: string) => {
    const w = await watchRoom(b[name], path);
    ctx.onTestFinished(() => w.close());
    await w.next("room", () => true, 2000);
    return w;
  };
  const probe = await watchRoom(b[names[0]], path);
  const first = await probe.next("room", () => true, 2000);
  probe.close();
  const id: Record<string, number> = {};
  for (const m of first.members) id[m.name] = m.id;
  return { path, b, id, watch };
}

async function now(b: Browser, path: string): Promise<RoomEvent> {
  const w = await watchRoom(b, path);
  try {
    return await w.next("room", () => true, 2000);
  } finally {
    w.close();
  }
}
const member = (e: RoomEvent, name: string) => e.members.find((m) => m.name === name);
// everything the room view says about a person, but for when it was read
const view = (e: RoomEvent, name: string) => {
  const m = member(e, name) as Record<string, unknown> | undefined;
  expect(m, `${name} is in the room`).toBeDefined();
  return m;
};

const interact = (b: Browser, path: string, to: number, kind: string) => b.post(path, { action: "interact", to: String(to), kind });
const ok = async (res: Response, what: string) => {
  const text = await res.text();
  expect(res.status, `${what}: ${text.slice(0, 160)}`).toBe(200);
  return JSON.parse(text) as { ok: true; at: number; offer?: number; done?: boolean };
};
const choose = (b: Browser, path: string, exercise: string) => b.post(path, { action: "choose", exercise });
const logSet = (b: Browser, path: string) => b.post(path, { exercise_id: "3", weight_kg: "40", reps: "8" }); // bench: 150 s rest
const finish = (b: Browser, path: string) => b.post(path, { action: "finish" });

// The five senders, one in each state; Away (Omar, idle) is a flag, not a
// state, so he says idle. Slacking comes 30 s past a rest's end: Sam's bench
// set is moved 200 s back.
async function senders(ctx: TestContext, extra: string[] = []) {
  const g = await gym(ctx, ["Ava", "Idle", "Lifter", "Rester", "Slacker", "Done", "Omar", "Jiwoo", ...extra]);
  const { path, b, id } = g;
  await choose(b.Lifter, path, "7");
  await logSet(b.Rester, path);
  await logSet(b.Slacker, path);
  await backdate(b.Ava, path, { user: id.Slacker }, 200_000);
  await finish(b.Done, path);
  await backdate(b.Ava, path, { user: id.Omar }, 61_000);
  const before = await now(b.Ava, path);
  const expected: Record<string, State> = { Idle: "idle", Lifter: "lifting", Rester: "resting", Slacker: "slacking", Done: "finished", Omar: "idle" };
  for (const [n, s] of Object.entries(expected)) expect(member(before, n)?.state, `${n} to start`).toBe(s);
  expect(member(before, "Omar")?.away, "Omar is Away").toBe(true);
  return { ...g, expected };
}

describe("the sender's state on every interaction", () => {
  // INT-13.20: every interaction event says the sender's state at acceptance,
  // for each of the five states (and Away, which is not a state); the
  // target's state is still there beside it
  it("says the sender's state at acceptance on every Cheer, Poke and Slap, whatever it is", async (ctx) => {
    const { path, b, id, watch, expected } = await senders(ctx);
    const ava = await watch("Ava");
    const kinds = ["cheer", "poke", "slap"];
    for (const [i, n] of Object.keys(expected).entries()) await ok(await interact(b[n], path, id.Jiwoo, kinds[i % 3]), `${n} to Jiwoo`);
    for (const [n, state] of Object.entries(expected)) {
      const e = await ava.next("interaction", (e) => e.from.id === id[n], 2000);
      expect(e.fromState, `${n}'s ${e.kind}`).toBe(state);
      expect(e.targetState, "the target's state, as before").toBe("idle");
    }
  }, 30_000);

  // INT-13.20 (replies too): Thanks, Poke back and Slap back carry the
  // replier's state, whatever it is
  it("says the replier's state on every Thanks, Poke back and Slap back", async (ctx) => {
    const { path, b, id, watch, expected } = await senders(ctx);
    const ava = await watch("Ava");
    // Jiwoo (idle) sends each of them something; each answers it
    const kinds = ["cheer", "poke", "slap"];
    const replies: Record<string, string> = { cheer: "thanks", poke: "poke-back", slap: "slap-back" };
    const sentKind: Record<string, string> = {};
    for (const [i, n] of Object.keys(expected).entries()) {
      // Slap is refused on the Lifting and Finished: they get a cheer and a poke
      const kind = n === "Lifter" ? "cheer" : n === "Done" ? "poke" : kinds[i % 3];
      sentKind[n] = kind;
      await ok(await interact(b.Jiwoo, path, id[n], kind), `Jiwoo ${kind}s ${n}`);
      const e = await ava.next("interaction", (e) => e.from.id === id.Jiwoo && e.to.id === id[n], 2000);
      expect(typeof e.id).toBe("number");
      await ok(await b[n].post(path, { action: "reply", answers: String(e.id) }), `${n} answers`);
      const r = await ava.next("interaction", (e) => e.from.id === id[n] && e.to.id === id.Jiwoo, 2000);
      expect(r.kind, `${n}'s reply`).toBe(replies[kind]);
      expect(r.fromState, `${n}'s ${r.kind}`).toBe(expected[n]);
    }
    // three kinds of reply were covered
    expect(new Set(Object.values(sentKind))).toEqual(new Set(kinds));
  }, 30_000);

  // INT-13.20 (at acceptance, not later): the state is the one when the
  // server accepted it, so a sender who taps Start set straight after still
  // reads as she was
  it("keeps the state from acceptance, not what the sender did after", async (ctx) => {
    const { path, b, id, watch } = await gym(ctx, ["Ava", "Mia", "Jiwoo"]);
    await logSet(b.Mia, path); // resting
    const ava = await watch("Ava");
    await ok(await interact(b.Mia, path, id.Jiwoo, "cheer"), "Mia cheers, resting");
    await b.Mia.post(path, { action: "start", exercise_id: "3", weight_kg: "40", reps: "8" });
    await ava.next("room", (e) => member(e, "Mia")?.state === "lifting", 2000);
    const e = ava.all("interaction").find((e) => e.from.id === id.Mia)!;
    expect(e.fromState, "her state when it was accepted").toBe("resting");
  }, 30_000);
});

describe("an errand changes nothing on the server", () => {
  // INT-13.19 (HTTP part): a move from someone in each state, and to someone
  // on a machine, changes nothing the room view says about anyone: state,
  // station, rest's end, slacking time. The walk itself is drawn on screens
  // and never reaches the server, so what can be checked here is that the
  // server, now telling everyone the sender's state, doesn't also move them
  // (to the target, or off their station). Read from another member's
  // stream before and after. (INT-13.17's 10 s is room-feel's and int.md's
  // checks, unchanged: nothing new reaches the server to change it.)
  it("leaves everyone's state, station and timers as they were after moves from every state", async (ctx) => {
    const { path, b, id, watch, expected } = await senders(ctx, ["Kai"]);
    await choose(b.Kai, path, "5"); // a target on a machine
    const ava = await watch("Ava");
    const before = await now(b.Ava, path);
    for (const n of Object.keys(expected)) {
      // Slap on Jiwoo (idle) is allowed from anyone; a cheer to Kai, lifting
      await ok(await interact(b[n], path, id.Jiwoo, "slap"), `${n} slaps Jiwoo`);
      await ok(await interact(b[n], path, id.Kai, "cheer"), `${n} cheers Kai`);
    }
    for (const n of Object.keys(expected)) await ava.next("interaction", (e) => e.from.id === id[n] && e.to.id === id.Kai, 2000);
    const after = await now(b.Ava, path);
    const sentBy = Object.keys(expected);
    for (const n of [...sentBy, "Jiwoo", "Kai"]) {
      // a send counts as the sender being seen (int.md INT-5.13): their
      // `away` and `seenAt` may move, forward only, and only for senders;
      // everything else is the same, for everyone
      const { away: awayWas, seenAt: seenWas, ...was } = view(before, n)! as Record<string, unknown>;
      const { away: awayIs, seenAt: seenIs, ...is } = view(after, n)! as Record<string, unknown>;
      expect(is, n).toEqual(was);
      if (sentBy.includes(n)) {
        if (typeof seenWas === "number") expect(seenIs as number, `${n} seen no earlier`).toBeGreaterThanOrEqual(seenWas);
      } else {
        expect({ away: awayIs, seenAt: seenIs }, `${n}, who sent nothing`).toEqual({ away: awayWas, seenAt: seenWas });
      }
    }
  }, 40_000);
});

// ===========================================================================
// High-fives: both people's states when it happened
// ===========================================================================

type QA = {
  now: number;
  lastActiveAt: number;
  dony: null | { summonedAt: number; segments: { kind: "idle" | "lift" | "rest"; start: number; end: number; slackAt: number | null }[]; emotes: { at: number; why: string }[] };
};
async function qa(b: Browser, path: string, q = ""): Promise<QA> {
  const res = await b.get(`${path}/qa${q}`);
  if (res.status !== 200) throw new Error(`GET ${path}/qa answered ${res.status}: these checks need SPOTTER_TEST_HOOKS=1`);
  return (await res.json()) as QA;
}

describe("a High-five, acted out", () => {
  // INT-16 (what each screen decides who walks from): a done High-five says
  // the offerer's and the accepter's states; an offer says neither. Every
  // pairing the design's table distinguishes: offerer not Lifting, offerer
  // Lifting with the accepter not, both Lifting
  it("says both people's states when it happens, and neither on the offer", async (ctx) => {
    const { path, b, id, watch } = await gym(ctx, ["Ava", "Mia", "Jiwoo", "Tom", "Priya", "Kai", "Lena"]);
    await logSet(b.Mia, path); // resting
    await choose(b.Tom, path, "7"); // lifting
    await choose(b.Kai, path, "5"); // lifting
    await choose(b.Lena, path, "9"); // lifting
    const ava = await watch("Ava");
    const pairs: [string, string, State, State][] = [
      ["Mia", "Jiwoo", "resting", "idle"],
      ["Tom", "Priya", "lifting", "idle"],
      ["Kai", "Lena", "lifting", "lifting"],
    ];
    for (const [from, to, fromState, toState] of pairs) {
      const o = await ok(await interact(b[from], path, id[to], "highfive"), `${from} offers ${to}`);
      const offerEvent = await ava.next("highfive", (e) => e.id === o.offer && e.done === undefined, 2000);
      expect(offerEvent.fromState, "an offer carries no states").toBeUndefined();
      expect(offerEvent.toState).toBeUndefined();
      await ok(await b[to].post(path, { action: "accept", offer: String(o.offer) }), `${to} accepts`);
      const done = await ava.next("highfive", (e) => e.id === o.offer && e.done !== undefined, 2000);
      expect({ fromState: done.fromState, toState: done.toState }, `${from} and ${to}`).toEqual({ fromState, toState });
    }
  }, 30_000);

  // INT-16 with crossing offers (room-feel INT-10.7): whichever arrived
  // second completes the first; `fromState` is that first offer's offerer's
  it("says the states the right way round when two offers cross", async (ctx) => {
    const { path, b, id, watch } = await gym(ctx, ["Ava", "Mia", "Jiwoo"]);
    await choose(b.Mia, path, "7"); // lifting
    await logSet(b.Jiwoo, path); // resting
    const ava = await watch("Ava");
    const [a, c] = await Promise.all([interact(b.Mia, path, id.Jiwoo, "highfive"), interact(b.Jiwoo, path, id.Mia, "highfive")]);
    const answers = [await a.json(), await c.json()] as { done?: boolean; offer: number }[];
    const doneIdx = answers.findIndex((x) => x.done === true);
    expect(doneIdx, "one completes the other").toBeGreaterThanOrEqual(0);
    const done = await ava.next("highfive", (e) => e.done !== undefined, 2000);
    const states: Record<string, State> = { Mia: "lifting", Jiwoo: "resting" };
    expect(done.fromState, `the offerer ${done.from.name}'s state`).toBe(states[done.from.name]);
    expect(done.toState, `the accepter ${done.to.name}'s state`).toBe(states[done.to.name]);
    expect(done.from.id).not.toBe(done.to.id);
  }, 30_000);
});

// ===========================================================================
// Dony
// ===========================================================================

const donyId = (e: RoomEvent) => (e as unknown as { dony?: { member: { id: number } | null } }).dony?.member?.id ?? null;
function donyStateAt(v: NonNullable<QA["dony"]>, t: number): State {
  const s = v.segments.find((g) => t >= g.start && t < g.end);
  expect(s, `his schedule covers ${t}`).toBeDefined();
  if (s!.kind === "idle") return "idle";
  if (s!.kind === "lift") return "lifting";
  return s!.slackAt !== null && t >= s!.slackAt ? "slacking" : "resting";
}

// Summons Dony and moves the visit until none of his own emoji fall near now
// (his acceptance shares his answer cap, BOT-7.4, and keeps clear of his own)
async function summonQuiet(b: Browser, path: string, w: RoomWatch) {
  expect((await b.post(path, { action: "dony", intent: "summon" })).status).toBe(303);
  const dony = donyId(await w.next("room", (e) => donyId(e) !== null, 2000))!;
  for (let j = 0; j < 400; j++) {
    await backdate(b, path, { room: true }, j === 0 ? 20 * MIN : 7_919);
    const v = (await qa(b, path)).dony!;
    const t = Date.now();
    if (!v.emotes.some((e) => e.why === "own" && e.at > t - 40 * S && e.at < t + 40 * S)) return dony;
  }
  throw new Error("no quiet stretch of his visit found");
}

describe("Dony accepting a High-five", () => {
  // BOT-8.5 (his acceptance says his state then, from his schedule),
  // BOT-8.4 (accepting changes nothing about his schedule), INT-16
  // (the offerer's state too)
  it("says his state from his schedule when he accepts, and leaves his schedule as it was", async (ctx) => {
    const { path, b, watch } = await gym(ctx, ["Ava", "Mia"]);
    const ava = await watch("Ava");
    const dony = await summonQuiet(b.Ava, path, ava);
    await choose(b.Mia, path, "7"); // Mia lifting: the case where Dony would walk if he isn't
    const before = (await qa(b.Ava, path)).dony!;
    await ok(await interact(b.Mia, path, dony, "highfive"), "Mia offers Dony");
    const done = await ava.next("highfive", (e) => e.done !== undefined && e.to.id === dony, 4000);
    expect(done.fromState, "Mia's state").toBe("lifting");
    expect(done.toState, "his state at his acceptance, from his schedule").toBe(donyStateAt(before, done.done!));
    const after = (await qa(b.Ava, path)).dony!;
    expect(after.segments, "his schedule is unchanged").toEqual(before.segments);
    expect((done.from as Who).id).not.toBe(dony);
  }, 60_000);
});
