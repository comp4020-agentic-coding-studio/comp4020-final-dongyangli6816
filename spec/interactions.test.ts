import { describe, expect, it, type TestContext } from "vitest";
import {
  backdate,
  Browser,
  createRoom,
  freshEmail,
  plainText,
  roomLogOf,
  signUp,
  watchRoom,
  type RoomEvent,
  type RoomWatch,
} from "./helpers.ts";

// Interactions, preset messages and emoji (docs/product/criteria/int.md,
// INT-1 to INT-5 and INT-8), the parts the server decides, checked over HTTP
// against the running app. Each test names the criteria it covers.
//
// ===========================================================================
// THE CONTRACT (QA round one, 22 Oct). The build meets this; the tests hold
// it to it. Anything not written here is the build's choice.
// ===========================================================================
//
// Sending: a form POST to the room page, /rooms/<id>, as every room action is
// (the Origin header a real form carries, as today). The page's script sends
// these with fetch; there is no no-script path, so the answer is always JSON.
//
//   action=interact  to=<user id>  kind=cheer|poke|slap
//   action=say       to=<user id>  preset=<key>
//   action=emote                   emoji=<key>
//
//   `to` is a member's id as the room's `room` event gives it (members[].id),
//   or Dony's (dony.member.id) while he is out, written in decimal digits;
//   anything else in `to` ("", "abc", "1.5", "0x1") is malformed.
//   Preset keys, in the copy bank's order (system.md section 3):
//     hype-1 "One more rep! 💪"     nudge-1 "Put the phone down 📵"
//     hype-2 "Light weight!"        nudge-2 "Rest's over, mate ⏰"
//     hype-3 "Let's gooo 🔥"         nudge-3 "I can see you 👀"
//     hype-4 "Lock in 🔒"            nudge-4 "Bro is scrolling 💀"
//     hype-5 "That's a W set 🏆"     nudge-5 "Water break or nap? 😴"
//   Emoji keys: hi flex fire clap haha dead eyes love (src/sprites/emoji.ts).
//
// Answers, to a signed-in member of an open room (content-type JSON):
//   200 {"ok":true,"at":<the server's time of acceptance, ms since epoch>}
//   400 {"ok":false,"reason":"invalid"}   unknown kind, preset or emoji; a
//                                         missing or malformed `to`
//   400 {"ok":false,"reason":"self"}      an interaction or preset to yourself
//   409 {"ok":false,"reason":"target-lifting"}   Slap on someone Lifting
//   409 {"ok":false,"reason":"target-finished"}  Slap on someone Finished
//   409 {"ok":false,"reason":"gone"}      `to` is nobody in this room now
//                                         (left, never joined, elsewhere, no
//                                         such id, Dony while in his poster):
//                                         the same answer, byte for byte
//   429 {"ok":false,"reason":"rate-limit"}  any of the three limits (D6)
// Everyone else is answered as the room page answers them today: signed out,
// 303 to /signin?next=...; not a member, or no such room, the same 404; a
// closed room, what the room page does for it (never a 200).
// A refused request stores nothing and sends no event.
//
// Events, on the room's stream (/rooms/<id>/events), to every open stream in
// the room and no other, beside the existing `room` event:
//   event: interaction  {"kind","from":{"id","name"},"to":{"id","name"},
//                        "targetState","at"}
//       targetState: the target's state when it was accepted (idle, lifting,
//       resting, slacking, finished), which picks Poke's banner wording
//   event: say          {"preset","text","from":{"id","name"},
//                        "to":{"id","name"},"at"}
//   event: emote        {"emoji","from":{"id","name"},"at"}
//       Dony's too: from is {"id": dony.member.id, "name": "Dony"}
// An emote is its own small event: it is not followed by a `room` event
// (int.md, "Existing behaviour": broadcast), and nor are the others unless
// something in the room view changed. One case always does (INT-5.13): any
// accepted send from someone the room shows as Away shows them back, which
// takes a `room` event.
//
// The test hook. Only when the app runs with SPOTTER_TEST_HOOKS=1 (CI starts
// the container with it); otherwise every request below answers 404, and the
// app behaves exactly as it does in production. It never changes a rule (60 s
// Away, 30 s slack grace, 30 s poster rest, the 10 s / 2 s / 1 s limits, 3 s
// pops): it only moves stored times into the past, so the server sees that
// much time as gone by. Members only (anyone else: the room's 404).
//
//   POST /rooms/<id>/qa  op=backdate  ms=<n>  and one of:
//     user=<id>  everything that member has stored in this room, as if it all
//                happened n ms earlier: when they joined and were last seen
//                (GYM-14 Away, the log's "You walked in"), their state's start
//                time, their open workout's start, every set's logged time and
//                its rest's end (Resting, Rest up, Slacking come n ms sooner),
//                and the stored times of the interactions and presets they
//                sent (so their 10 s and 2 s limits run out n ms sooner).
//                The emoji limit is kept in memory, so it isn't moved.
//     room=1     the room's own times: created, last active (ROOM-6), Dony's
//                summon and send-back (BOT-1, BOT-4: his schedule runs n ms
//                further on, the poster's 30 s rest ends n ms sooner).
//   204, and the room is re-sent to every stream, as after any change. It
//   counts as nobody being seen and the room not being active (it moves
//   last-seen and last-active back, never to now). Anything whose time the
//   move skips over (a pop due, one of Dony's emoji, his answer to something
//   now further back) is missed, as after a restart: never sent late.
//
//   GET /rooms/<id>/qa?summonedAt=<ms>&until=<ms>  reads Dony's visit
//     (the contract at the top of spec/dony-emoji.test.ts).
//
// The room's first render (GET /rooms/<id>), from docs/design/room/spec.md I.9:
//   section.panel.room-log, titled "Room log" (h2), the next panel after
//   section.panel.squad. One li per entry, newest first (the newest five, then
//   the rest of the newest 50 inside details.older); an entry's time in
//   span.t; li.joined for the "You walked in" line. A line reads
//   "Mia cheered Ji-woo" / "Mia poked Ji-woo" / "Mia slapped Ji-woo", or for a
//   preset `Mia @Ji-woo "Put the phone down 📵"`; to the viewer, their own
//   name is "You"/"you". With no entries: p.empty with the empty line.
//   The map's .pops layer holds no pop in a first render.
// ===========================================================================

type Json = { ok: boolean; at?: number; reason?: string };
type Answer = { status: number; body: Json | null; text: string };

async function answer(res: Response): Promise<Answer> {
  const text = await res.text();
  let body: Json | null = null;
  try {
    body = JSON.parse(text);
  } catch {
    // not JSON: a redirect, a 404 page, or the room page itself
  }
  return { status: res.status, body, text };
}

const interact = async (b: Browser, path: string, to: number | string, kind: string) =>
  answer(await b.post(path, { action: "interact", to: String(to), kind }));
const say = async (b: Browser, path: string, to: number | string, preset: string) =>
  answer(await b.post(path, { action: "say", to: String(to), preset }));
const emote = async (b: Browser, path: string, emoji: string) => answer(await b.post(path, { action: "emote", emoji }));

function accepted(a: Answer, what = "the request") {
  expect(a.status, `${what}: ${a.text.slice(0, 120)}`).toBe(200);
  expect(a.body?.ok, what).toBe(true);
  expect(typeof a.body?.at, `${what}: the server's time`).toBe("number");
  expect(Math.abs(a.body!.at! - Date.now()), `${what}: at is the server's time now`).toBeLessThan(5000);
  return a.body!.at!;
}
function refused(a: Answer, status: number, reason: string, what = "the request") {
  expect({ status: a.status, body: a.body }, what).toEqual({ status, body: { ok: false, reason } });
}

const PRESETS: Record<string, string> = {
  "hype-1": "One more rep! 💪",
  "hype-2": "Light weight!",
  "hype-3": "Let's gooo 🔥",
  "hype-4": "Lock in 🔒",
  "hype-5": "That's a W set 🏆",
  "nudge-1": "Put the phone down 📵",
  "nudge-2": "Rest's over, mate ⏰",
  "nudge-3": "I can see you 👀",
  "nudge-4": "Bro is scrolling 💀",
  "nudge-5": "Water break or nap? 😴",
};
const EMOJI = ["hi", "flex", "fire", "clap", "haha", "dead", "eyes", "love"];
const PAST = { cheer: "cheered", poke: "poked", slap: "slapped" } as const;

const wait = (ms: number) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

// ---------- people and rooms ----------

// A room with these people in it, the first its host, each in their own
// browser. ids come from the room's own stream, as the page gets them.
// Streams opened here close when the test ends.
async function gym(ctx: TestContext, names: string[]) {
  const b: Record<string, Browser> = {};
  const emails: Record<string, string> = {};
  for (const name of names) {
    b[name] = new Browser();
    emails[name] = (await signUp(b[name], freshEmail(), "correct horse", name)).email;
  }
  const { path, passcode } = await createRoom(b[names[0]]);
  for (const name of names.slice(1)) await b[name].post("/join", { passcode });
  const watch = async (name: string) => {
    const w = await watchRoom(b[name], path);
    ctx.onTestFinished(() => w.close());
    return w;
  };
  // ids, from a stream that closes straight away, so nobody is kept from Away
  const probe = await watchRoom(b[names[0]], path);
  const first = await probe.next("room", () => true, 2000);
  probe.close();
  const id: Record<string, number> = {};
  for (const m of first.members) id[m.name] = m.id;
  return { path, passcode, b, emails, id, watch };
}

const member = (e: RoomEvent, name: string) => e.members.find((m) => m.name === name);
// Dony in the room's view while he's out (spec/dony.test.ts)
const donyOf = (e: RoomEvent) => (e as RoomEvent & { dony?: { member: { id: number; state: string } | null } }).dony?.member ?? null;
// what a person is doing, as everyone else sees it
const doing = (e: RoomEvent, name: string) => {
  const m = member(e, name) as (RoomEvent["members"][number] & { restEnd?: number | null }) | undefined;
  expect(m, `${name} is in the room`).toBeDefined();
  return { state: m!.state, exercise: m!.exercise, station: m!.station, slackAt: m!.slackAt, restEnd: m!.restEnd ?? null };
};
// the room as it is now, from a fresh stream's first event
async function now(b: Browser, path: string): Promise<RoomEvent> {
  const w = await watchRoom(b, path);
  try {
    return await w.next("room", () => true, 2000);
  } finally {
    w.close();
  }
}
const logOf = async (b: Browser, path: string) => roomLogOf(await (await b.get(path)).text());

const choose = (b: Browser, path: string, exercise: string) => b.post(path, { action: "choose", exercise });
const logSet = (b: Browser, path: string, exercise: string) => b.post(path, { exercise_id: exercise, weight_kg: "40", reps: "8" });
const finish = (b: Browser, path: string) => b.post(path, { action: "finish" });

// ===========================================================================
// INT-2: what is allowed when
// ===========================================================================

describe("who can be cheered, poked, slapped and messaged", () => {
  // INT-2.1, INT-2.2, INT-2.3 (Idle, Resting), INT-2.4, INT-2.5 (refusals),
  // INT-2.7 (the sender's state never matters), INT-5.3 (presets to anyone,
  // from anyone), INT-3.1 (accepted ones reach another member's stream),
  // INT-2.12 and INT-8.5 for these states (nobody's workout changes)
  it("accepts Cheer, Poke and presets on anyone, refuses Slap only on Lifting and Finished, whatever the sender is doing", async (ctx) => {
    const g = await gym(ctx, ["Ava", "Mia", "Tom", "Priya", "Sam", "Jiwoo", "Kai", "Lena", "Noor"]);
    const { path, b, id } = g;
    // the senders: Mia Lifting, Tom Resting, Priya Finished, Sam Idle
    await choose(b.Mia, path, "7");
    await logSet(b.Tom, path, "8");
    await finish(b.Priya, path);
    // the targets: Jiwoo Idle, Kai Lifting, Lena Resting, Noor Finished
    await choose(b.Kai, path, "5");
    await logSet(b.Lena, path, "3");
    await finish(b.Noor, path);
    const states = { Mia: "lifting", Tom: "resting", Priya: "finished", Sam: "idle", Jiwoo: "idle", Kai: "lifting", Lena: "resting", Noor: "finished" };
    const before = await now(b.Ava, path);
    for (const [name, state] of Object.entries(states)) expect(member(before, name)?.state, `${name} to start`).toBe(state);

    const ava = await g.watch("Ava");
    await ava.next("room");

    for (const target of ["Jiwoo", "Kai", "Lena", "Noor"]) {
      accepted(await interact(b.Mia, path, id[target], "cheer"), `Mia (lifting) cheers ${target}`);
      accepted(await interact(b.Tom, path, id[target], "poke"), `Tom (resting) pokes ${target}`);
    }
    accepted(await interact(b.Priya, path, id.Jiwoo, "slap"), "Priya (finished) slaps Jiwoo (idle)");
    accepted(await interact(b.Priya, path, id.Lena, "slap"), "Priya slaps Lena (resting)");
    refused(await interact(b.Priya, path, id.Kai, "slap"), 409, "target-lifting", "Priya slaps Kai (lifting)");
    refused(await interact(b.Priya, path, id.Noor, "slap"), 409, "target-finished", "Priya slaps Noor (finished)");
    // presets: separate limits, so the same senders send straight away
    accepted(await say(b.Sam, path, id.Jiwoo, "hype-1"), "Sam (idle) to Jiwoo");
    accepted(await say(b.Mia, path, id.Kai, "nudge-1"), "Mia (lifting) to Kai (lifting)");
    accepted(await say(b.Tom, path, id.Lena, "nudge-4"), "Tom (resting) to Lena (resting)");
    accepted(await say(b.Priya, path, id.Noor, "hype-5"), "Priya (finished) to Noor (finished)");

    // every accepted one reaches another member's stream, and nothing else does
    const seen: string[] = [];
    for (let i = 0; i < 10; i++) {
      const e = await ava.next("interaction", () => true, 2000);
      seen.push(`${e.from.name} ${e.kind} ${e.to.name}`);
      expect(e.from.id).toBe(id[e.from.name]);
      expect(e.to.id).toBe(id[e.to.name]);
    }
    expect(seen.sort()).toEqual(
      [
        ...["Jiwoo", "Kai", "Lena", "Noor"].flatMap((t) => [`Mia cheer ${t}`, `Tom poke ${t}`]),
        "Priya slap Jiwoo",
        "Priya slap Lena",
      ].sort(),
    );
    const said: string[] = [];
    for (let i = 0; i < 4; i++) {
      const e = await ava.next("say", () => true, 2000);
      said.push(`${e.from.name}>${e.to.name}: ${e.text}`);
    }
    expect(said.sort()).toEqual(["Mia>Kai: Put the phone down 📵", "Priya>Noor: That's a W set 🏆", "Sam>Jiwoo: One more rep! 💪", "Tom>Lena: Bro is scrolling 💀"]);
    expect(await ava.during("interaction", 500)).toEqual([]);

    // stored: every accepted one is in the room log, and the refused ones aren't
    const log = (await logOf(b.Ava, path))!;
    expect(log, "the room log").not.toBeNull();
    for (const t of ["Jiwoo", "Kai", "Lena", "Noor"]) {
      expect(log).toContain(`Mia cheered ${t}`);
      expect(log).toContain(`Tom poked ${t}`);
    }
    expect(log).toContain("Priya slapped Jiwoo");
    expect(log).toContain("Priya slapped Lena");
    expect(log).not.toContain("Priya slapped Kai");
    expect(log).not.toContain("Priya slapped Noor");
    expect(log).toContain('Mia @Kai "Put the phone down 📵"');

    // and nobody's workout changed, sender or target
    const after = await now(b.Ava, path);
    for (const name of Object.keys(states)) expect(doing(after, name), name).toEqual(doing(before, name));
  }, 30_000);

  // INT-2.3 (Away, and Slacking), INT-2.2 and INT-2.1 (Away), INT-2.4 and
  // INT-2.5 (Away makes no difference), INT-2.7 (an Away sender), INT-5.3
  // (Away targets), INT-2.12 (a slacker's rest and slacking time unchanged),
  // INT-8.5 (a slacker who sends an emoji is still Slacking), INT-5.13 (an
  // Away sender is back, for everyone, after sending). Away comes 60 s after
  // someone was last seen: the hook moves everyone's times 61 s back instead
  // (Jiwoo's 4 minutes, past her bench rest's end plus 30 s), so a few seconds.
  it("treats Away people like anyone else, and leaves a slacker slacking", async (ctx) => {
      const g = await gym(ctx, ["Ava", "Mia", "Tom", "Priya", "Sam", "Jiwoo", "Kai", "Lena", "Noor", "Omar"]);
      const { path, b, id } = g;
      await logSet(b.Jiwoo, path, "3"); // a bench set: rests 150 s, Slacking from 180 s
      await choose(b.Kai, path, "5"); // Lifting
      await logSet(b.Lena, path, "9"); // Resting (deadlift: 180 s)
      await finish(b.Noor, path); // Finished
      // Omar stays Idle; nobody has the room open
      for (const name of ["Mia", "Tom", "Priya", "Sam", "Kai", "Lena", "Noor", "Omar"]) await backdate(b.Ava, path, { user: id[name] }, 61_000);
      await backdate(b.Ava, path, { user: id.Jiwoo }, 240_000);
      const ava = await g.watch("Ava");
      const before = await ava.next("room", () => true, 2000);
      const targets = { Jiwoo: "slacking", Kai: "lifting", Lena: "resting", Noor: "finished", Omar: "idle" };
      for (const [name, state] of Object.entries(targets)) {
        expect(member(before, name)?.state, `${name} to start`).toBe(state);
        expect(member(before, name)?.away, `${name} is Away`).toBe(true);
      }
      for (const name of ["Mia", "Tom", "Priya", "Sam"]) expect(member(before, name)?.away, `${name} is Away`).toBe(true);
      const jiwoo = doing(before, "Jiwoo");

      for (const t of Object.keys(targets)) {
        accepted(await interact(b.Mia, path, id[t], "cheer"), `cheer ${t}`);
        accepted(await interact(b.Tom, path, id[t], "poke"), `poke ${t}`);
      }
      accepted(await interact(b.Priya, path, id.Jiwoo, "slap"), "slap Jiwoo, Slacking and Away");
      accepted(await interact(b.Priya, path, id.Lena, "slap"), "slap Lena, Resting and Away");
      accepted(await interact(b.Priya, path, id.Omar, "slap"), "slap Omar, Idle and Away");
      refused(await interact(b.Priya, path, id.Kai, "slap"), 409, "target-lifting", "slap Kai, Lifting and Away");
      refused(await interact(b.Priya, path, id.Noor, "slap"), 409, "target-finished", "slap Noor, Finished and Away");
      accepted(await say(b.Sam, path, id.Jiwoo, "nudge-4"), "a preset to Jiwoo, Slacking and Away");

      // INT-5.13: each sender is back for everyone within a second
      await ava.next("room", (e) => ["Mia", "Tom", "Priya", "Sam"].every((n) => member(e, n)?.away === false), 1500);

      // INT-2.12: Jiwoo is exactly as she was, still slacking from the same moment
      expect(doing(await now(b.Ava, path), "Jiwoo")).toEqual(jiwoo);

      // INT-8.5: and her own emoji changes nothing either
      accepted(await emote(b.Jiwoo, path, "dead"), "Jiwoo's emoji");
      const later = await now(b.Ava, path);
      expect(doing(later, "Jiwoo")).toEqual(jiwoo);
      // her logbook: still the one set
      const page = await (await b.Jiwoo.get(path)).text();
      expect(plainText(page)).toMatch(/\b1 set\b/);
  }, 20_000);

  // INT-2.6
  it("decides a slap by the target's state when it arrives, not by what the sender saw", async (ctx) => {
    const { path, b, id } = await gym(ctx, ["Mia", "Tom", "Jiwoo"]);
    await logSet(b.Jiwoo, path, "3"); // Resting
    // while she rests, a slap lands
    accepted(await interact(b.Tom, path, id.Jiwoo, "slap"), "Tom's slap, Jiwoo resting");
    // she taps Start set; Mia's slap, sent from a menu that still showed Resting, arrives after
    await b.Jiwoo.post(path, { action: "start", exercise_id: "3", weight_kg: "40", reps: "8" });
    refused(await interact(b.Mia, path, id.Jiwoo, "slap"), 409, "target-lifting");
  }, 20_000);

  // INT-2.8
  it("refuses an interaction or a preset to yourself, and stores nothing", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom"]);
    const { path, b, id } = g;
    const tom = await g.watch("Tom");
    for (const kind of ["cheer", "poke", "slap"]) refused(await interact(b.Mia, path, id.Mia, kind), 400, "self", kind);
    refused(await say(b.Mia, path, id.Mia, "hype-1"), 400, "self", "preset");
    expect(await tom.during("interaction", 600)).toEqual([]);
    expect(tom.all("say")).toEqual([]);
    expect(await logOf(b.Tom, path)).toEqual([]);
  }, 20_000);

  // INT-2.9
  it("answers the same for someone who left, never joined, is elsewhere or doesn't exist", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom", "Jiwoo"]);
    const { path, b, id } = g;
    const jiwoo = await g.watch("Jiwoo");
    await b.Tom.post(path, { action: "leave" });
    // Lena is in another room; Noor was in one, and left it, so she is in none
    const lena = new Browser();
    await signUp(lena, freshEmail(), "correct horse", "Lena");
    const elsewhere = await createRoom(lena);
    const noor = new Browser();
    await signUp(noor, freshEmail(), "correct horse", "Noor");
    const gone = await createRoom(noor);
    const idIn = async (who: Browser, at: string) => (await now(who, at)).members[0].id;
    const lenaId = await idIn(lena, elsewhere.path);
    const noorId = await idIn(noor, gone.path);
    await noor.post(gone.path, { action: "leave" });

    const answers: Answer[] = [];
    for (const to of [id.Tom, lenaId, noorId, 999_999_999]) {
      for (const kind of ["cheer", "poke", "slap"]) answers.push(await interact(b.Mia, path, to, kind));
      answers.push(await say(b.Mia, path, to, "nudge-1"));
    }
    for (const a of answers) refused(a, 409, "gone");
    expect(new Set(answers.map((a) => a.text)).size, "every answer is the same").toBe(1);
    expect(await jiwoo.during("interaction", 500)).toEqual([]);
    expect(jiwoo.all("say")).toEqual([]);
  }, 30_000);

  // INT-2.10, INT-5.12, INT-8.11 (non-members and the signed out)
  it("gives a non-member the same 404 as a room that doesn't exist, and sends the signed out to sign in", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Jiwoo"]);
    const { path, b, id } = g;
    const jiwoo = await g.watch("Jiwoo");
    const stranger = new Browser();
    await signUp(stranger, freshEmail(), "correct horse", "Stranger");
    const nowhere = "/rooms/999999999";
    const sends: Record<string, string>[] = [
      { action: "interact", to: String(id.Jiwoo), kind: "cheer" },
      { action: "say", to: String(id.Jiwoo), preset: "nudge-1" },
      { action: "emote", emoji: "fire" },
    ];
    for (const fields of sends) {
      const there = await stranger.post(path, fields);
      const missing = await stranger.post(nowhere, fields);
      expect(there.status, fields.action).toBe(404);
      expect(await there.text()).toBe(await missing.text());
      expect(missing.status).toBe(404);

      const signedOut = await new Browser().post(path, fields);
      expect(signedOut.status, `${fields.action}, signed out`).toBe(303);
      expect(signedOut.headers.get("location")).toMatch(/^\/signin\b/);
    }
    // and the log can't be read from outside either
    expect((await stranger.get(path)).status).toBe(404);
    expect(await jiwoo.during("interaction", 500)).toEqual([]);
    expect(jiwoo.all("say")).toEqual([]);
    expect(jiwoo.all("emote")).toEqual([]);
    expect(await logOf(b.Mia, path)).toEqual([]);
  }, 20_000);

  // INT-2.11, INT-8.11 (a closed room), INT-5.17
  it("refuses an unknown kind, a bad target and a closed room, and a closed room's log is shown nowhere", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom", "Jiwoo"]);
    const { path, b, id } = g;
    const tom = await g.watch("Tom");
    for (const kind of ["hug", "message", "", "CHEER"]) refused(await interact(b.Mia, path, id.Jiwoo, kind), 400, "invalid", `kind "${kind}"`);
    refused(await answer(await b.Mia.post(path, { action: "interact", to: String(id.Jiwoo) })), 400, "invalid", "no kind");
    for (const to of ["", "abc", "1.5", "0x1"]) refused(await interact(b.Mia, path, to, "cheer"), 400, "invalid", `to "${to}"`);
    refused(await answer(await b.Mia.post(path, { action: "interact", kind: "cheer" })), 400, "invalid", "no target");
    expect(await tom.during("interaction", 500)).toEqual([]);

    // something stored before it closes, so there is something not to show
    accepted(await interact(b.Mia, path, id.Jiwoo, "slap"));
    accepted(await say(b.Mia, path, id.Jiwoo, "nudge-3"));
    await b.Mia.post(path, { action: "end" });
    const toClosed: Record<string, string>[] = [
      { action: "interact", to: String(id.Jiwoo), kind: "cheer" },
      { action: "say", to: String(id.Jiwoo), preset: "hype-1" },
      { action: "emote", emoji: "hi" },
    ];
    for (const fields of toClosed) {
      const res = await b.Tom.post(path, fields);
      expect(res.status, `${fields.action} to a closed room`).not.toBe(200);
      const text = await res.text();
      expect(text).not.toContain("Mia slapped");
      expect(text).not.toContain("I can see you");
    }
    // the room page and its stream show none of it
    for (const who of [b.Mia, b.Tom, b.Jiwoo]) {
      const page = await who.get(path);
      expect(page.status).not.toBe(200);
      const text = await page.text();
      expect(text).not.toContain("slapped");
      expect(text).not.toContain("I can see you");
      expect((await who.get(`${path}/events`)).status).toBe(404);
    }
  }, 20_000);
});

// ===========================================================================
// INT-3: what everyone sees, the server's part
// ===========================================================================

describe("an accepted interaction, live", () => {
  // INT-3.1 (HTTP), INT-3.2 (the state Poke's banner is chosen by). Real
  // time, no hook: the "within a second" promise is checked as it happens.
  it("reaches every stream in the room within a second, the sender's and the target's included, and no other room", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom", "Jiwoo"]);
    const { path, b, id } = g;
    const streams = { Mia: await g.watch("Mia"), Tom: await g.watch("Tom"), Jiwoo: await g.watch("Jiwoo") };
    const other = await gym(ctx, ["Lena"]);
    const otherStream = await other.watch("Lena");
    for (const s of Object.values(streams)) await s.next("room");

    const sent = Date.now();
    accepted(await interact(b.Mia, path, id.Jiwoo, "poke"));
    for (const [name, s] of Object.entries(streams)) {
      const e = await s.next("interaction", () => true, 1000);
      expect(e.arrivedAt - sent, `${name}'s stream`).toBeLessThan(1000);
      expect(e).toMatchObject({ kind: "poke", from: { id: id.Mia, name: "Mia" }, to: { id: id.Jiwoo, name: "Jiwoo" }, targetState: "idle" });
    }
    // Poke on someone resting: the other wording
    await logSet(b.Jiwoo, path, "3");
    accepted(await interact(b.Tom, path, id.Jiwoo, "poke"));
    expect(await streams.Jiwoo.next("interaction", (e) => e.from.name === "Tom", 1000)).toMatchObject({ targetState: "resting" });
    expect(await otherStream.during("interaction", 300)).toEqual([]);
  }, 20_000);

  // INT-3.11 (HTTP part: an interaction leaves Dony's schedule as it was) is
  // in spec/dony-emoji.test.ts, with his answers.
});

// ===========================================================================
// INT-4: the 10-second limit
// ===========================================================================

describe("one interaction per sender per target every 10 s", () => {
  // INT-4.1
  it("refuses a second interaction of any kind to the same person within 10 s, and stores nothing", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom", "Jiwoo"]);
    const { path, b, id } = g;
    const tom = await g.watch("Tom");
    accepted(await interact(b.Mia, path, id.Jiwoo, "cheer"));
    await tom.next("interaction");
    for (const kind of ["slap", "poke", "cheer"]) refused(await interact(b.Mia, path, id.Jiwoo, kind), 429, "rate-limit", kind);
    expect(await tom.during("interaction", 600)).toEqual([]);
    expect(await logOf(b.Tom, path)).toEqual(["Mia cheered Jiwoo"]);
  }, 20_000);

  // INT-4.2. The hook moves Mia's stored times back instead of waiting 10 s.
  // Every step is measured from her accepted poke's `at` (the server's own
  // time), so the edges are exact: the hook moves her to 9.5 s after it,
  // allowing 0.5 s for the request's own trip, then past 10 s. Refused tries
  // in between must not restart the count. About a second.
  it("counts the 10 s from the last accepted one, on the server; refused tries don't restart it", async (ctx) => {
    const { path, b, id } = await gym(ctx, ["Mia", "Jiwoo"]);
    const at = accepted(await interact(b.Mia, path, id.Jiwoo, "poke"));
    // as if it were 9.5 s after the poke: still refused, several times
    await backdate(b.Mia, path, { user: id.Mia }, 9_500 - (Date.now() - at));
    for (const kind of ["cheer", "slap", "poke"]) refused(await interact(b.Mia, path, id.Jiwoo, kind), 429, "rate-limit", `${kind} at 9.5 s`);
    // the refused ones didn't restart it: 0.6 s more and it's past 10 s
    await backdate(b.Mia, path, { user: id.Mia }, 600);
    accepted(await interact(b.Mia, path, id.Jiwoo, "cheer"), "at 10.1 s, after three refused tries");
    // and a new 10 s from that one
    refused(await interact(b.Mia, path, id.Jiwoo, "poke"), 429, "rate-limit", "straight after the new one");
  }, 20_000);

  // INT-4.2, the one real-time check of the 10 s limit, so a hook can't hide
  // a limit kept by a clock that only the hook moves. About 10.5 s; runs
  // alongside the other waits.
  it.concurrent("lets a second interaction through after 10 real seconds", async (ctx) => {
    const { path, b, id } = await gym(ctx, ["Mia", "Jiwoo"]);
    accepted(await interact(b.Mia, path, id.Jiwoo, "poke"));
    const answeredAt = Date.now();
    await wait(answeredAt + 9_000 - Date.now());
    refused(await interact(b.Mia, path, id.Jiwoo, "cheer"), 429, "rate-limit", "at 9 s");
    await wait(answeredAt + 10_100 - Date.now());
    accepted(await interact(b.Mia, path, id.Jiwoo, "cheer"), "after 10 s");
  }, 20_000);

  // INT-4.3
  it("is per target and per sender", async (ctx) => {
    const { path, b, id } = await gym(ctx, ["Mia", "Tom", "Priya", "Jiwoo"]);
    accepted(await interact(b.Mia, path, id.Jiwoo, "cheer"));
    accepted(await interact(b.Mia, path, id.Tom, "cheer"), "Mia to Tom straight after");
    const [tom, priya] = await Promise.all([interact(b.Tom, path, id.Jiwoo, "poke"), interact(b.Priya, path, id.Jiwoo, "poke")]);
    accepted(tom, "Tom pokes Jiwoo");
    accepted(priya, "Priya pokes Jiwoo in the same moment");
  }, 20_000);

  // INT-4.4
  it("accepts exactly one of several sent at the same moment", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Jiwoo", "Tom", "Priya", "Ava"]);
    const { path, b, id } = g;
    const ava = await g.watch("Ava");
    // a second tab of Mia's: her own session, signed in separately
    const tab2 = new Browser();
    await tab2.post("/signin", { email: g.emails.Mia, password: "correct horse" });
    for (const target of ["Jiwoo", "Tom", "Priya"]) {
      const answers = await Promise.all(
        [b.Mia, tab2, b.Mia, tab2, b.Mia].map((who, i) => interact(who, path, id[target], ["cheer", "poke", "slap", "cheer", "poke"][i])),
      );
      expect(answers.filter((a) => a.status === 200).length, `to ${target}`).toBe(1);
      for (const a of answers.filter((a) => a.status !== 200)) refused(a, 429, "rate-limit");
    }
    await wait(600);
    expect(ava.all("interaction").length).toBe(3);
  }, 20_000);

  // INT-4.6 needs the server restarted between two requests; no test here
  // can do that to the running app (see the QA report: round two, by hand).
});

// ===========================================================================
// INT-5: presets and the room log
// ===========================================================================

describe("presets", () => {
  // INT-5.2 (the ten are accepted, with the copy bank's words), INT-5.7
  // (the event carries what the bubble and the log show)
  it("accepts each of the ten presets by key, with the copy bank's words", async (ctx) => {
    const g = await gym(ctx, ["Ava", "S1", "S2", "S3", "S4", "S5", "Jiwoo"]);
    const { path, b, id } = g;
    const ava = await g.watch("Ava");
    const keys = Object.keys(PRESETS);
    const senders = ["S1", "S2", "S3", "S4", "S5"];
    // two rounds of five senders; between them, each sender's 2 s passes (the hook)
    for (const round of [0, 1]) {
      if (round) for (const s of senders) await backdate(b.Ava, path, { user: id[s] }, 2_100);
      for (const [i, s] of senders.entries()) accepted(await say(b[s], path, id.Jiwoo, keys[round * 5 + i]), keys[round * 5 + i]);
    }
    const got: Record<string, string> = {};
    for (let i = 0; i < 10; i++) {
      const e = await ava.next("say", () => true, 2000);
      expect(e.to).toEqual({ id: id.Jiwoo, name: "Jiwoo" });
      got[e.preset] = e.text;
    }
    expect(got).toEqual(PRESETS);
  }, 20_000);

  // INT-5.2 (anything else is refused)
  it("refuses an unknown preset, free text and an empty message, and stores nothing", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Jiwoo"]);
    const { path, b, id } = g;
    const jiwoo = await g.watch("Jiwoo");
    for (const preset of ["hype-6", "nudge-0", "Put the phone down 📵", "<b>hi</b>", "", "HYPE-1"]) {
      refused(await say(b.Mia, path, id.Jiwoo, preset), 400, "invalid", `preset "${preset}"`);
    }
    refused(await answer(await b.Mia.post(path, { action: "say", to: String(id.Jiwoo) })), 400, "invalid", "no preset");
    refused(await answer(await b.Mia.post(path, { action: "say", to: String(id.Jiwoo), text: "hello" })), 400, "invalid", "free text");
    expect(await jiwoo.during("say", 600)).toEqual([]);
    expect(await logOf(b.Jiwoo, path)).toEqual([]);
    // and the limit wasn't spent on any of them
    accepted(await say(b.Mia, path, id.Jiwoo, "hype-2"));
  }, 20_000);

  // INT-5.10, edges as in INT-4.2: the hook moves Mia to 1.5 s after her
  // accepted preset (0.5 s for the request's trip), then past 2 s. Under a second.
  it("allows one preset per sender every 2 s, to anyone, counted from the last accepted one", async (ctx) => {
    const { path, b, id } = await gym(ctx, ["Mia", "Jiwoo", "Tom"]);
    const at = accepted(await say(b.Mia, path, id.Jiwoo, "nudge-1"));
    refused(await say(b.Mia, path, id.Tom, "hype-1"), 429, "rate-limit", "to someone else, straight away");
    await backdate(b.Mia, path, { user: id.Mia }, 1_500 - (Date.now() - at));
    refused(await say(b.Mia, path, id.Tom, "hype-1"), 429, "rate-limit", "at 1.5 s");
    refused(await say(b.Mia, path, id.Jiwoo, "hype-2"), 429, "rate-limit", "at 1.5 s, again");
    await backdate(b.Mia, path, { user: id.Mia }, 600);
    accepted(await say(b.Mia, path, id.Tom, "hype-1"), "at 2.1 s, after refused tries");
    refused(await say(b.Mia, path, id.Tom, "hype-3"), 429, "rate-limit", "a new 2 s from that one");
  }, 20_000);

  // INT-5.10 (the three limits are separate), INT-8.8 (the emoji one too)
  it("keeps the three limits apart: a slap, a preset and an emoji all go at once", async (ctx) => {
    const { path, b, id } = await gym(ctx, ["Mia", "Jiwoo"]);
    accepted(await interact(b.Mia, path, id.Jiwoo, "slap"), "slap");
    accepted(await say(b.Mia, path, id.Jiwoo, "nudge-1"), "a preset straight after the slap");
    accepted(await emote(b.Mia, path, "fire"), "an emoji straight after the preset");
    refused(await interact(b.Mia, path, id.Jiwoo, "cheer"), 429, "rate-limit", "but a cheer is still within the slap's 10 s");
  }, 20_000);

  // INT-5.7 (stored: kept after a reload and a sign-out; the server restart is
  // round two's), INT-5.8 (newest 50, from before you joined, interactions as
  // lines, no emoji, names kept after leaving), INT-5.15 (a preset to Dony),
  // INT-8.10 (the log and the first render hold no emoji)
  it("keeps the newest 50 presets and interactions, emoji never, for everyone who comes in later", async (ctx) => {
    const names = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];
    const g = await gym(ctx, names);
    const { path, passcode, b, id } = g;
    const p1 = await g.watch("P1");
    await p1.next("room");
    // emoji first: none of these may ever be in the log
    for (const n of names) accepted(await emote(b[n], path, "fire"), `${n}'s emoji`);
    // 56 interactions, one per ordered pair, the kinds in turn
    const lines: string[] = [];
    const kinds = ["cheer", "poke", "slap"] as const;
    let k = 0;
    for (const from of names) {
      for (const to of names) {
        if (from === to) continue;
        const kind = kinds[k++ % 3];
        accepted(await interact(b[from], path, id[to], kind), `${from} ${kind} ${to}`);
        lines.push(`${from} ${PAST[kind]} ${to}`);
      }
    }
    // Dony out, cheered, a preset, and sent back
    await b.P1.post(path, { action: "dony", intent: "summon" });
    const out = (await p1.next("room", (e) => donyOf(e) != null, 2000)) as RoomEvent;
    const dony = donyOf(out)!.id;
    accepted(await interact(b.P2, path, dony, "cheer"), "P2 cheers Dony");
    lines.push("P2 cheered Dony");
    accepted(await say(b.P3, path, dony, "hype-2"), "P3's preset to Dony");
    lines.push('P3 @Dony "Light weight!"');
    await b.P1.post(path, { action: "dony", intent: "send-back" });
    // P8 leaves: her lines keep her name
    await b.P8.post(path, { action: "leave" });
    const newest50 = lines.slice(-50).reverse();

    // someone who joins now sees the same 50, from before they came (Late,
    // who is in none of them, so no line says "you")
    const late = new Browser();
    const { email: lateEmail } = await signUp(late, freshEmail(), "correct horse", "Late");
    await late.post("/join", { passcode });
    const html = await (await late.get(path)).text();
    expect(roomLogOf(html)).toEqual(newest50);
    // a reload, and a sign-out and back in, change nothing
    expect(await logOf(late, path)).toEqual(newest50);
    await late.post("/signout", {});
    await late.post("/signin", { email: lateEmail, password: "correct horse" });
    expect(await logOf(late, path)).toEqual(newest50);
    // and to P2 the same lines call P2 "you" (INT-5.22's words, in the first render)
    const asP2 = newest50.map((l) => l.replace(/^P2 /, "You ").replace(/ P2$/, " you"));
    expect(asP2).toContain("You cheered Dony");
    expect(await logOf(b.P2, path)).toEqual(asP2);
    // no emoji in the log, and no pop in a first render
    const section = html.match(/<section[^>]*\broom-log\b[\s\S]*?<\/section>/)![0];
    expect(section).not.toMatch(/em-(hi|flex|fire|clap|haha|dead|eyes|love)\b/);
    expect(html).not.toMatch(/class="[^"]*\bpop\b/);
  }, 60_000);

  // INT-5.20 (HTTP), INT-5.9 (the empty line, in the first render)
  it("draws the room log as its own panel straight after the squad, with the empty line when nothing's been sent", async (ctx) => {
    const { path, b } = await gym(ctx, ["Mia"]);
    const html = await (await b.Mia.get(path)).text();
    const squadAt = html.search(/<section[^>]*class="[^"]*\bpanel\b[^"]*\bsquad\b/);
    expect(squadAt, "the squad panel").toBeGreaterThan(-1);
    const nextPanel = html.slice(squadAt + 1).match(/<section[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/h2>/)!;
    expect(nextPanel[1].split(/\s+/)).toEqual(expect.arrayContaining(["panel", "room-log"]));
    expect(plainText(nextPanel[2])).toBe("Room log");
    expect(roomLogOf(html)).toEqual([]);
    const section = html.match(/<section[^>]*\broom-log\b[\s\S]*?<\/section>/)![0];
    expect(plainText(section)).toContain("Quiet in here. Tap someone on the map to cheer them on 👀");
  }, 20_000);
});

// ===========================================================================
// INT-8: emoji, the server's part
// ===========================================================================

describe("emoji", () => {
  // INT-8.9 (the eight), INT-8.3 (HTTP side: to the whole room, from its
  // sender, nobody addressed), INT-8.10 (not stored), and the contract's
  // "own small event": no room re-send for an emoji
  // Eight senders, one emoji each (the emoji limit lives in memory, so the
  // hook can't move it; one sender would take 8 s). About 2 s.
  it("sends each of the eight to every stream as its own small event, and never stores them", async (ctx) => {
    const senders = ["E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8"];
    const g = await gym(ctx, ["Tom", "Mia", ...senders]);
    const { path, b, id } = g;
    const tom = await g.watch("Tom");
    const mia = await g.watch("Mia");
    await tom.next("room");
    await mia.next("room");
    await wait(500); // the room events for the streams opening have gone out
    const roomEvents = tom.all("room").length;
    for (const [i, key] of EMOJI.entries()) {
      const from = senders[i];
      const sent = Date.now();
      accepted(await emote(b[from], path, key), key);
      for (const s of [tom, mia]) {
        const e = await s.next("emote", () => true, 1000);
        expect(e.arrivedAt - sent).toBeLessThan(1000);
        expect(e).toMatchObject({ emoji: key, from: { id: id[from], name: from } });
        expect(e).not.toHaveProperty("to");
      }
    }
    await wait(800);
    expect(tom.all("room").length, "no room re-send for an emoji").toBe(roomEvents);
    expect(await logOf(b.Tom, path)).toEqual([]);
  }, 30_000);

  // INT-8.9 (anything else is refused)
  it("refuses anything but the eight, and shows nothing", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom"]);
    const { path, b } = g;
    const tom = await g.watch("Tom");
    for (const emoji of ["🔥", "slap", "heart", "Fire", "", "<img>", "fire "]) refused(await emote(b.Mia, path, emoji), 400, "invalid", `emoji "${emoji}"`);
    refused(await answer(await b.Mia.post(path, { action: "emote" })), 400, "invalid", "no emoji");
    expect(await tom.during("emote", 600)).toEqual([]);
    accepted(await emote(b.Mia, path, "fire"), "and the limit wasn't spent");
  }, 20_000);

  // INT-8.8 (HTTP). In real time: emoji aren't stored (D7), so their limit
  // can't be moved by the hook. About 4 s; runs alongside the other waits.
  it.concurrent("allows one emoji a second per person, from any tab, counted from the last accepted one", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom"]);
    const { path, b } = g;
    const tom = await g.watch("Tom");
    const tab2 = new Browser();
    await tab2.post("/signin", { email: g.emails.Mia, password: "correct horse" });

    const sentAt = Date.now();
    accepted(await emote(b.Mia, path, "fire"));
    const answeredAt = Date.now();
    refused(await emote(tab2, path, "haha"), 429, "rate-limit", "from her other tab, straight away");
    await wait(sentAt + 500 - Date.now());
    refused(await emote(b.Mia, path, "haha"), 429, "rate-limit", "at 0.5 s");
    await wait(sentAt + 850 - Date.now());
    refused(await emote(b.Mia, path, "haha"), 429, "rate-limit", "at 0.85 s");
    await wait(answeredAt + 1030 - Date.now());
    accepted(await emote(tab2, path, "love"), "at 1.03 s, after refused tries, from the other tab");
    await wait(1100);

    // two at the same moment from two tabs: exactly one, several times over
    for (let i = 0; i < 2; i++) {
      if (i) await wait(1100);
      const both = await Promise.all([emote(b.Mia, path, "clap"), emote(tab2, path, "eyes")]);
      expect(both.map((a) => a.status).sort(), `round ${i + 1}`).toEqual([200, 429]);
    }
    await wait(500);
    expect(tom.all("emote").map((e) => e.emoji).slice(0, 2)).toEqual(["fire", "love"]);
    expect(tom.all("emote").length, "only the accepted ones showed").toBe(4);
  }, 20_000);

  // INT-8.5 (Lifting and Resting; Slacking is in the Away test above)
  it("changes nothing about the sender's workout", async (ctx) => {
    const { path, b } = await gym(ctx, ["Ava", "Mia", "Tom"]);
    await choose(b.Mia, path, "5"); // Lifting
    await logSet(b.Tom, path, "3"); // Resting
    const before = await now(b.Ava, path);
    accepted(await emote(b.Mia, path, "flex"));
    accepted(await emote(b.Tom, path, "clap"));
    const after = await now(b.Ava, path);
    expect(doing(after, "Mia")).toEqual(doing(before, "Mia"));
    expect(doing(after, "Tom")).toEqual(doing(before, "Tom"));
    expect(plainText(await (await b.Tom.get(path)).text())).toMatch(/\b1 set\b/);
  }, 20_000);
});
