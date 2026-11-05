import { describe, expect, it, type TestContext } from "vitest";
import {
  backdate,
  Browser,
  createRoom,
  freshEmail,
  roomLogOf,
  signUp,
  watchRoom,
  type InteractionEvent,
  type RoomEvent,
  type RoomWatch,
  type Who,
} from "./helpers.ts";

// How the gym room feels (docs/product/criteria/room-feel.md): answering an
// interaction (INT-9), the High-five (INT-10), personal bests (GYM-17), the
// room's PB moment (GYM-18) and Dony's part in them (BOT-7), the parts the
// server decides, checked over HTTP against the running app. Each test names
// the criteria it covers. INT-11 and INT-12 (reactions, sound) are the page's:
// nothing about the sound setting reaches the server, so nothing here.
//
// ===========================================================================
// THE CONTRACT (QA round one, 4 Nov 2026; settled by the user). It extends the
// contract at the top of spec/interactions.test.ts (sending, answers, events,
// the test hook) and spec/dony-emoji.test.ts (reading Dony's visit). The build
// meets this; the tests hold it to it. Anything not written here is the
// build's choice.
// ===========================================================================
//
// Same transport: a form POST to /rooms/<id>, JSON answer; events on
// /rooms/<id>/events.
//
// Requests:
//   action=reply     answers=<interaction id>
//       Answer one Cheer / Poke / Slap addressed to me. The kind follows from
//       what it answers: cheer -> thanks, poke -> poke-back, slap -> slap-back.
//   action=interact  to=<id>  kind=highfive
//       Offer a High-five. If `to` already has an open offer to me, this
//       accepts theirs instead (INT-10.7).
//   action=accept    offer=<offer id>
//       Accept an open High-five offer made to me (banner button, or
//       High-five in the offerer's menu).
//   `answers` and `offer` are decimal ids from the events / room view below;
//   anything else is `invalid` (400).
//
// Answers:
//   200 {"ok":true,"at"}                             reply accepted
//   200 {"ok":true,"at","offer":<id>,"until":<at+10000>}   offer made
//   200 {"ok":true,"at","offer":<id>,"done":true}    High-five happened (by
//                                                    accept, or a crossing offer)
// New refusal keys (all 409, store nothing, send no event):
//   too-late           a reply 30 s or more after what it answers, or once a
//                      newer interaction from the same sender to me exists
//                      (INT-9.5, INT-9.7)
//   answered           that interaction already has a reply, or that offer is
//                      already done (INT-9.6, INT-10.7)
//   nothing-to-answer  the id is a reply itself, isn't addressed to me,
//                      doesn't exist, or (for accept) isn't an offer to me
//                      (INT-9.4, INT-9.16, INT-9.17, INT-10.8)
//   target-away        a High-five offer to someone shown Away (INT-10.3)
//   too-slow           accepting 10 s or more after the offer (INT-10.5)
// Reused keys: `gone` (the other person left: replies and accepts too,
// INT-9.14, INT-10.11), `target-lifting` / `target-finished` (Slap back, by
// the original slapper's state now, INT-9.9), `rate-limit` (an offer within
// 10 s of any interaction to that person). Replies and acceptances are never
// `rate-limit`, but start the sender's 10 s on that person (F10).
//
// Events (new or changed):
//   interaction  gains `id`, and `kind` may be thanks | poke-back | slap-back
//                with `answers: <id>`. A reply's own event has no further reply.
//   highfive     {"id","from","to","at","until"}: an offer, open until `until`.
//   highfive     {"id","from","to","at","done":<ms>}: it happened. Nothing is
//                sent for a lapse; screens work it out from `until`.
//   pb           {"from":{"id","name"},"exercise":{"id","name"},"at"}: no
//                numbers. Dony's too, at his planned time, from
//                {"id": dony.member.id, "name": "Dony"}.
//   The `room` view gains three room-wide lists, so a reload or reconnect
//   draws them (INT-9.13, INT-10.12, GYM-18.6); each screen picks the ones
//   about its viewer:
//     offers:     [{id, from, to, until}]  High-five offers still open
//     answerable: [{id, from, to, kind, until}]  Cheers, Pokes and Slaps
//                 still answerable (newest per sender-target pair, no reply
//                 yet, under 30 s); `kind` is the reply it takes
//     pbs:        [{userId, exercise: {id, name}, until}]  PBs under 30 s old
//   The lists are only re-sent with the next `room` event; screens drop
//   entries at `until` themselves.
//   The Done (`action=log`) redirect carries `&pb=1` when the set was a PB,
//   so the page that answers it draws the gold stamp (GYM-17.9, 17.10).
//
// Personal best:
//   A Done that is a PB is answered as any Done (the same redirect). The
//   room page it leads to shows the logged stamp with "New PB 🏆". The rule
//   (GYM-17.1 to 17.5) is decided in the same transaction as storing the
//   set; "earlier workout" means any earlier workout, in any room.
//
// First render, room log lines: "Ji-woo thanked Mia", "Ji-woo poked Mia
// back", "Ji-woo returned Mia's slap", "Mia and Ji-woo high-fived", "Mia hit
// a PB on bench press" (and "You" / "you" for the viewer).
//
// Test hook (changes):
//   op=backdate user=<id>  also moves that member's High-five offers and the
//                          sets that decide PBs, which already move. No other
//                          change in what it does.
//   GET /rooms/<id>/qa     adds `dony.pb: {"at","exercise"} | null`, his
//                          planned PB for that visit, so a test waits for it
//                          instead of 4 to 8 minutes; combined with `room=1`
//                          backdating, it arrives in seconds.
// ===========================================================================

type Json = { ok: boolean; at?: number; reason?: string; offer?: number; until?: number; done?: boolean };
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

const interact = async (b: Browser, path: string, to: number, kind: string) =>
  answer(await b.post(path, { action: "interact", to: String(to), kind }));
const reply = async (b: Browser, path: string, answers: number | string) =>
  answer(await b.post(path, { action: "reply", answers: String(answers) }));
const offer = (b: Browser, path: string, to: number) => interact(b, path, to, "highfive");
const accept = async (b: Browser, path: string, id: number | string) =>
  answer(await b.post(path, { action: "accept", offer: String(id) }));

function accepted(a: Answer, what = "the request") {
  expect(a.status, `${what}: ${a.text.slice(0, 160)}`).toBe(200);
  expect(a.body?.ok, what).toBe(true);
  expect(typeof a.body?.at, `${what}: the server's time`).toBe("number");
  return a.body!;
}
function refused(a: Answer, status: number, reason: string, what = "the request") {
  expect({ status: a.status, body: a.body }, what).toEqual({ status, body: { ok: false, reason } });
}
// an offer made: its id, and open for 10 s from its time
function offered(a: Answer, what = "the offer") {
  const body = accepted(a, what);
  expect(typeof body.offer, `${what}: an offer id`).toBe("number");
  expect(body.done, `${what}: not a High-five yet`).toBeUndefined();
  expect(body.until, `${what}: open 10 s`).toBe(body.at! + 10_000);
  return body.offer!;
}
function happened(a: Answer, what = "the High-five") {
  const body = accepted(a, what);
  expect(body.done, what).toBe(true);
  expect(typeof body.offer, `${what}: the offer it completes`).toBe("number");
  return body.offer!;
}

const S = 1000;
const MIN = 60 * S;
const wait = (ms: number) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

// ---------- people and rooms ----------

// A room with these people in it, the first its host, each in their own
// browser. ids come from the room's own stream, as the page gets them.
// Streams opened here close when the test ends.
async function gym(ctx: TestContext, names: string[]) {
  const b: Record<string, Browser> = {};
  for (const name of names) {
    b[name] = new Browser();
    await signUp(b[name], freshEmail(), "correct horse", name);
  }
  const { path, passcode } = await createRoom(b[names[0]]);
  for (const name of names.slice(1)) await b[name].post("/join", { passcode });
  const watch = async (name: string) => {
    const w = await watchRoom(b[name], path);
    ctx.onTestFinished(() => w.close());
    await w.next("room", () => true, 2000);
    return w;
  };
  // ids, from a stream that closes straight away, so nobody is kept from Away
  const probe = await watchRoom(b[names[0]], path);
  const first = await probe.next("room", () => true, 2000);
  probe.close();
  const id: Record<string, number> = {};
  for (const m of first.members) id[m.name] = m.id;
  return { path, passcode, b, id, watch };
}

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

const member = (e: RoomEvent, name: string) => e.members.find((m) => m.name === name);
// what a person is doing, as everyone else sees it (not whether they're Away)
const doing = (e: RoomEvent, name: string) => {
  const m = member(e, name) as (RoomEvent["members"][number] & { restEnd?: number | null }) | undefined;
  expect(m, `${name} is in the room`).toBeDefined();
  return { state: m!.state, exercise: m!.exercise, station: m!.station, slackAt: m!.slackAt, restEnd: m!.restEnd ?? null };
};
// the lists' `from` / `to`: the contract doesn't say whether they're an id or
// {id, name}, so read either
const idOf = (w: number | Who) => (typeof w === "number" ? w : w.id);
const offersIn = (e: RoomEvent) => (e.offers ?? []).map((o) => ({ id: o.id, from: idOf(o.from), to: idOf(o.to), until: o.until }));
const answerableIn = (e: RoomEvent) =>
  (e.answerable ?? []).map((a) => ({ id: a.id, from: idOf(a.from), to: idOf(a.to), kind: a.kind, until: a.until }));

// an accepted interaction as the stream carries it, with its id
async function sent(w: RoomWatch, from: number, to: number, kind: InteractionEvent["kind"]) {
  const e = await w.next("interaction", (e) => e.from.id === from && e.to.id === to && e.kind === kind, 2000);
  expect(typeof e.id, `${kind}: the event carries its id`).toBe("number");
  return e as InteractionEvent & { id: number; arrivedAt: number };
}

const choose = (b: Browser, path: string, exercise: string) => b.post(path, { action: "choose", exercise });
const lift = (b: Browser, path: string, exercise: string, weight: string, reps: string) =>
  b.post(path, { action: "log", exercise_id: exercise, weight_kg: weight, reps });
const finish = (b: Browser, path: string) => b.post(path, { action: "finish" });

const RUN = "1";
const BENCH = "3";
const PULL_UP = "11";
const PLANK = "16";

// ===========================================================================
// INT-9: answering an interaction
// ===========================================================================

describe("answering an interaction", () => {
  // INT-9.2 (stored, linked, on another member's stream, in the log), INT-9.3
  // (the three kinds and their log lines), INT-9.13 (what is answerable is in
  // the room view, for a screen that opens later), INT-9.15 (the replier's
  // and the sender's workouts unchanged)
  it("answers a cheer with Thanks, a poke with Poke back and a slap with Slap back, live, stored and logged", async (ctx) => {
    const g = await gym(ctx, ["Ava", "Mia", "Tom", "Priya", "Jiwoo"]);
    const { path, b, id } = g;
    await lift(b.Mia, path, BENCH, "40", "8"); // Mia resting
    const ava = await g.watch("Ava");
    // Jiwoo idle while they land (a slap is refused on someone Lifting, int.md D5)
    accepted(await interact(b.Mia, path, id.Jiwoo, "cheer"), "Mia cheers");
    accepted(await interact(b.Tom, path, id.Jiwoo, "poke"), "Tom pokes");
    accepted(await interact(b.Priya, path, id.Jiwoo, "slap"), "Priya slaps");
    const cheer = await sent(ava, id.Mia, id.Jiwoo, "cheer");
    const poke = await sent(ava, id.Tom, id.Jiwoo, "poke");
    const slap = await sent(ava, id.Priya, id.Jiwoo, "slap");
    await choose(b.Jiwoo, path, "7"); // then she starts a set: she replies mid-set

    // a screen opened now is told what Jiwoo can still answer, until when
    const open = answerableIn(await now(b.Ava, path)).filter((a) => a.to === id.Jiwoo);
    expect(open.map(({ until: _, ...a }) => a).sort((x, y) => x.id - y.id)).toEqual(
      [
        { id: cheer.id, from: id.Mia, to: id.Jiwoo, kind: "thanks" },
        { id: poke.id, from: id.Tom, to: id.Jiwoo, kind: "poke-back" },
        { id: slap.id, from: id.Priya, to: id.Jiwoo, kind: "slap-back" },
      ].sort((x, y) => x.id - y.id),
    );
    // each answerable for 30 s from when it was accepted
    for (const e of [cheer, poke, slap]) {
      const until = open.find((a) => a.id === e.id)!.until;
      expect(Math.abs(until - (e.at + 30_000)), `${e.kind}: until 30 s after it`).toBeLessThan(1000);
    }
    const before = await now(b.Ava, path);

    const replies = [
      { to: cheer, kind: "thanks", who: "Mia" },
      { to: poke, kind: "poke-back", who: "Tom" },
      { to: slap, kind: "slap-back", who: "Priya" },
    ] as const;
    for (const r of replies) {
      const sentAt = Date.now();
      accepted(await reply(b.Jiwoo, path, r.to.id), `Jiwoo's ${r.kind}`);
      const e = await sent(ava, id.Jiwoo, id[r.who], r.kind);
      expect(e.answers, `${r.kind} is linked to what it answers`).toBe(r.to.id);
      expect(e.arrivedAt - sentAt, `${r.kind}: on Ava's stream within a second (2 s for a busy runner)`).toBeLessThan(2000);
    }
    // answered: nothing of Jiwoo's is answerable any more
    expect(answerableIn(await now(b.Ava, path)).filter((a) => a.to === id.Jiwoo)).toEqual([]);
    // logged, newest first, for a third person
    expect((await logOf(b.Ava, path))!.slice(0, 3)).toEqual(["Jiwoo returned Priya's slap", "Jiwoo poked Tom back", "Jiwoo thanked Mia"]);
    // and from the point of view of those in it
    expect(await logOf(b.Mia, path)).toContain("Jiwoo thanked you");
    expect(await logOf(b.Jiwoo, path)).toContain("You returned Priya's slap");
    // nobody's workout moved: Jiwoo still mid-set, Mia still resting
    const after = await now(b.Ava, path);
    for (const name of ["Mia", "Tom", "Priya", "Jiwoo"]) expect(doing(after, name), name).toEqual(doing(before, name));
  }, 30_000);

  // INT-9.15: whatever the replier is doing (Idle, Resting, Slacking,
  // Finished, Away), she can reply, and it changes nothing about her. Slacking
  // comes 30 s after a rest's end: the hook moves Lena 200 s back past her
  // 150 s bench rest; Away is 60 s unseen: Omar is moved 61 s back.
  it("accepts a reply from someone in any state, Away included, and changes nothing about them", async (ctx) => {
    const g = await gym(ctx, ["Ava", "Mia", "Kai", "Lena", "Noor", "Omar"]);
    const { path, b, id } = g;
    await lift(b.Kai, path, BENCH, "40", "8"); // Kai resting
    await lift(b.Lena, path, BENCH, "40", "8");
    await backdate(b.Ava, path, { user: id.Lena }, 200_000); // Lena slacking
    await finish(b.Noor, path); // Noor finished
    await backdate(b.Ava, path, { user: id.Omar }, 61_000); // Omar away
    const ava = await g.watch("Ava");
    const repliers = { Kai: "resting", Lena: "slacking", Noor: "finished", Omar: "idle" };
    const cheers: Record<string, number> = {};
    for (const name of Object.keys(repliers)) {
      accepted(await interact(b.Mia, path, id[name], "cheer"), `Mia cheers ${name}`);
      cheers[name] = (await sent(ava, id.Mia, id[name], "cheer")).id;
    }
    const before = await now(b.Ava, path);
    for (const [name, state] of Object.entries(repliers)) expect(member(before, name)?.state, `${name} to start`).toBe(state);
    expect(member(before, "Omar")?.away, "Omar is Away").toBe(true);

    for (const name of Object.keys(repliers)) accepted(await reply(b[name], path, cheers[name]), `${name} thanks Mia`);
    const after = await now(b.Ava, path);
    for (const name of [...Object.keys(repliers), "Mia"]) expect(doing(after, name), name).toEqual(doing(before, name));
  }, 30_000);

  // INT-9.4 (a reply can't be answered), INT-9.6 (one reply per interaction;
  // of two at once, exactly one), INT-9.8 (a reply is never refused by the
  // 10 s limit, but counts toward it)
  it("takes one reply per interaction, never a reply to a reply, and never refuses a reply for the 10 s limit", async (ctx) => {
    const g = await gym(ctx, ["Ava", "Mia", "Tom", "Jiwoo"]);
    const { path, b, id } = g;
    const ava = await g.watch("Ava");

    // two replies at the same moment: exactly one goes
    accepted(await interact(b.Mia, path, id.Jiwoo, "cheer"));
    const cheer = await sent(ava, id.Mia, id.Jiwoo, "cheer");
    const both = await Promise.all([reply(b.Jiwoo, path, cheer.id), reply(b.Jiwoo, path, cheer.id)]);
    expect(both.map((a) => a.status).sort()).toEqual([200, 409]);
    refused(both.find((a) => a.status === 409)!, 409, "answered", "the second of two at once");
    // and a later one too
    refused(await reply(b.Jiwoo, path, cheer.id), 409, "answered", "a later reply to the same cheer");
    const thanks = await sent(ava, id.Jiwoo, id.Mia, "thanks");
    // Mia can't answer the Thanks
    refused(await reply(b.Mia, path, thanks.id), 409, "nothing-to-answer", "a reply to a reply");
    expect(await ava.during("interaction", 500), "nothing more was sent").toEqual([]);
    expect((await logOf(b.Ava, path))!.filter((l) => l === "Jiwoo thanked Mia")).toHaveLength(1);

    // Jiwoo slapped Tom a moment ago; Tom slaps her; her Slap back still goes
    accepted(await interact(b.Jiwoo, path, id.Tom, "slap"), "Jiwoo slaps Tom");
    accepted(await interact(b.Tom, path, id.Jiwoo, "slap"), "Tom slaps Jiwoo");
    const slap = await sent(ava, id.Tom, id.Jiwoo, "slap");
    accepted(await reply(b.Jiwoo, path, slap.id), "Slap back within 10 s of her own slap");
    // and Jiwoo's Thanks to Mia, her only interaction with Mia, starts her 10 s on Mia
    refused(await interact(b.Jiwoo, path, id.Mia, "poke"), 429, "rate-limit", "a poke straight after her Thanks");
  }, 30_000);

  // INT-9.5 (30 s, counted on the server from the stored time; clearly
  // inside and clearly outside, by the hook), INT-9.7 (only the newest from
  // each sender is answerable; two senders each answerable on their own)
  it("takes a reply within 30 s, to the newest interaction from each sender", async (ctx) => {
    const g = await gym(ctx, ["Ava", "Mia", "Tom", "Priya", "Jiwoo"]);
    const { path, b, id } = g;
    const ava = await g.watch("Ava");
    accepted(await interact(b.Mia, path, id.Jiwoo, "slap"));
    const old = await sent(ava, id.Mia, id.Jiwoo, "slap");
    accepted(await interact(b.Tom, path, id.Jiwoo, "slap"));
    const fresh = await sent(ava, id.Tom, id.Jiwoo, "slap");
    // Mia's slap 31 s ago, Tom's 25 s ago (each sender's own times move)
    await Promise.all([backdate(b.Ava, path, { user: id.Mia }, 31_000), backdate(b.Ava, path, { user: id.Tom }, 25_000)]);
    refused(await reply(b.Jiwoo, path, old.id), 409, "too-late", "Slap back 31 s on");
    accepted(await reply(b.Jiwoo, path, fresh.id), "Slap back 25 s on");
    expect(answerableIn(await now(b.Ava, path)).filter((a) => a.to === id.Jiwoo)).toEqual([]);

    // Priya cheers, then (11 s later, by the hook) pokes: only the poke can be answered
    accepted(await interact(b.Priya, path, id.Jiwoo, "cheer"));
    const cheer = await sent(ava, id.Priya, id.Jiwoo, "cheer");
    await backdate(b.Ava, path, { user: id.Priya }, 11_000);
    accepted(await interact(b.Priya, path, id.Jiwoo, "poke"));
    const poke = await sent(ava, id.Priya, id.Jiwoo, "poke");
    expect(answerableIn(await now(b.Ava, path)).filter((a) => a.to === id.Jiwoo).map((a) => [a.id, a.kind])).toEqual([[poke.id, "poke-back"]]);
    refused(await reply(b.Jiwoo, path, cheer.id), 409, "too-late", "Thanks for a cheer since followed by a poke");
    accepted(await reply(b.Jiwoo, path, poke.id), "Poke back");
    await sent(ava, id.Jiwoo, id.Priya, "poke-back");

    expect(await ava.during("interaction", 300), "nothing more").toEqual([]);
    const kinds = ava.all("interaction").filter((e) => e.from.id === id.Jiwoo).map((e) => `${e.kind}>${e.to.name}`);
    expect(kinds, "only the two accepted replies were sent").toEqual(["slap-back>Tom", "poke-back>Priya"]);
    const log = (await logOf(b.Ava, path))!;
    expect(log).not.toContain("Jiwoo returned Mia's slap");
    expect(log).not.toContain("Jiwoo thanked Priya");
  }, 30_000);

  // INT-9.9 (Slap back follows Slap's rule, by the slapper's state when it
  // arrives, and stays answerable; Thanks has no state rule), INT-9.14 (the
  // sender left)
  it("refuses Slap back while the slapper is mid-set or finished, takes it once they rest, and refuses any reply to someone who left", async (ctx) => {
    const g = await gym(ctx, ["Ava", "Mia", "Tom", "Priya", "Sam", "Jiwoo"]);
    const { path, b, id } = g;
    const ava = await g.watch("Ava");
    const got: Record<string, number> = {};
    for (const [who, kind] of [["Mia", "slap"], ["Tom", "slap"], ["Priya", "cheer"], ["Sam", "poke"]] as const) {
      accepted(await interact(b[who], path, id.Jiwoo, kind), `${who} ${kind}s Jiwoo`);
      got[who] = (await sent(ava, id[who], id.Jiwoo, kind)).id;
    }
    await choose(b.Mia, path, BENCH); // Mia lifting
    await finish(b.Tom, path); // Tom finished
    await finish(b.Priya, path); // Priya finished
    await b.Sam.post(path, { action: "leave" }); // Sam gone

    refused(await reply(b.Jiwoo, path, got.Mia), 409, "target-lifting", "Slap back on Mia, mid-set");
    refused(await reply(b.Jiwoo, path, got.Tom), 409, "target-finished", "Slap back on Tom, finished");
    accepted(await reply(b.Jiwoo, path, got.Priya), "Thanks to Priya, finished");
    refused(await reply(b.Jiwoo, path, got.Sam), 409, "gone", "Poke back to Sam, who left");
    // Mia logs her set: resting, and her slap can still be returned
    await lift(b.Mia, path, BENCH, "40", "8");
    accepted(await reply(b.Jiwoo, path, got.Mia), "Slap back on Mia, resting now");
  }, 30_000);

  // INT-9.16 (nothing of Dony's can be answered), INT-9.17 (not addressed to
  // the replier, no such id, malformed, a non-member, the signed out, a
  // closed room: refused, nothing stored or sent)
  it("refuses a reply to anything not addressed to you, to Dony, and from outside the room", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom", "Jiwoo"]);
    const { path, b, id } = g;
    const tom = await g.watch("Tom");
    await b.Mia.post(path, { action: "dony", intent: "summon" });
    const out = await tom.next("room", (e) => (e as { dony?: { member: unknown } }).dony?.member != null, 2000);
    const dony = (out as unknown as { dony: { member: { id: number } } }).dony.member.id;

    accepted(await interact(b.Mia, path, id.Jiwoo, "slap"));
    const slap = await sent(tom, id.Mia, id.Jiwoo, "slap");
    accepted(await interact(b.Jiwoo, path, dony, "cheer"), "Jiwoo cheers Dony");
    const toDony = await sent(tom, id.Jiwoo, dony, "cheer");
    refused(await reply(b.Tom, path, slap.id), 409, "nothing-to-answer", "Tom answers Mia's slap to Jiwoo");
    refused(await reply(b.Mia, path, slap.id), 409, "nothing-to-answer", "Mia answers her own slap");
    refused(await reply(b.Jiwoo, path, toDony.id), 409, "nothing-to-answer", "Jiwoo answers her own cheer to Dony");
    refused(await reply(b.Mia, path, toDony.id), 409, "nothing-to-answer", "Mia answers Jiwoo's cheer to Dony");
    refused(await reply(b.Jiwoo, path, 999_999_999), 409, "nothing-to-answer", "no such interaction");
    for (const bad of ["", "abc", "1.5", "0x1"]) refused(await reply(b.Jiwoo, path, bad), 400, "invalid", `answers "${bad}"`);

    const stranger = new Browser();
    await signUp(stranger, freshEmail(), "correct horse", "Stranger");
    const there = await stranger.post(path, { action: "reply", answers: String(slap.id) });
    const nowhere = await stranger.post("/rooms/999999999", { action: "reply", answers: String(slap.id) });
    expect(there.status, "a non-member").toBe(404);
    expect(await there.text()).toBe(await nowhere.text());
    const signedOut = await new Browser().post(path, { action: "reply", answers: String(slap.id) });
    expect(signedOut.status).toBe(303);
    expect(signedOut.headers.get("location")).toMatch(/^\/signin\b/);
    expect(await tom.during("interaction", 500), "nothing was sent").toEqual([]);

    // the room closes: her slap is no longer answerable from anywhere
    await b.Mia.post(path, { action: "end" });
    expect((await b.Jiwoo.post(path, { action: "reply", answers: String(slap.id) })).status, "to a closed room").not.toBe(200);
  }, 30_000);
});

// ===========================================================================
// INT-10: the High-five
// ===========================================================================

describe("the High-five", () => {
  // INT-10.2 (offered: stored with its time, on another member's stream),
  // INT-10.12 (an open offer is in the room view for a screen that opens
  // later), INT-10.6 (accepted: on every stream, the offer goes, the log line),
  // INT-10.13 (nobody's workout changes: Jiwoo mid-set, Mia resting)
  it("offers a High-five to everyone's screen, and makes it happen when the other person accepts", async (ctx) => {
    const g = await gym(ctx, ["Tom", "Mia", "Jiwoo"]);
    const { path, b, id } = g;
    await lift(b.Mia, path, BENCH, "40", "8"); // resting
    await choose(b.Jiwoo, path, "7"); // lifting
    const tom = await g.watch("Tom");
    const before = await now(b.Tom, path);

    const sentAt = Date.now();
    const made = await offer(b.Mia, path, id.Jiwoo);
    const offerId = offered(made);
    const e = await tom.next("highfive", (e) => e.id === offerId, 2000);
    expect(e).toMatchObject({ id: offerId, from: { id: id.Mia, name: "Mia" }, to: { id: id.Jiwoo, name: "Jiwoo" }, until: made.body!.at! + 10_000 });
    expect(e.done).toBeUndefined();
    expect(e.arrivedAt - sentAt, "on Tom's stream within a second (2 s for a busy runner)").toBeLessThan(2000);
    expect(offersIn(await now(b.Tom, path))).toEqual([{ id: offerId, from: id.Mia, to: id.Jiwoo, until: made.body!.at! + 10_000 }]);

    expect(happened(await accept(b.Jiwoo, path, offerId))).toBe(offerId);
    const done = await tom.next("highfive", (e) => e.id === offerId && e.done !== undefined, 2000);
    expect(done).toMatchObject({ from: { id: id.Mia }, to: { id: id.Jiwoo } });
    expect(typeof done.done).toBe("number");
    expect(offersIn(await now(b.Tom, path)), "the offer is gone").toEqual([]);
    expect((await logOf(b.Tom, path))![0]).toBe("Mia and Jiwoo high-fived");
    expect((await logOf(b.Mia, path))![0]).toBe("You and Jiwoo high-fived");
    const after = await now(b.Tom, path);
    for (const name of ["Mia", "Jiwoo"]) expect(doing(after, name), name).toEqual(doing(before, name));
  }, 30_000);

  // INT-10.3 (refused to someone Away: nothing stored or sent), INT-10.4 (an
  // offer starts the offerer's 10 s on that person, so nothing else to them
  // until it's up)
  it("refuses an offer to someone Away, and counts an offer toward the 10 s limit", async (ctx) => {
    const g = await gym(ctx, ["Tom", "Mia", "Jiwoo", "Kai"]);
    const { path, b, id } = g;
    await backdate(b.Tom, path, { user: id.Kai }, 61_000);
    const tom = await g.watch("Tom");
    expect(member(await now(b.Tom, path), "Kai")?.away, "Kai is Away").toBe(true);
    refused(await offer(b.Mia, path, id.Kai), 409, "target-away", "an offer to Kai, Away");
    expect(await tom.during("highfive", 500)).toEqual([]);
    expect(offersIn(await now(b.Tom, path))).toEqual([]);

    const o = offered(await offer(b.Mia, path, id.Jiwoo));
    await tom.next("highfive", (e) => e.id === o, 2000);
    for (const kind of ["highfive", "cheer", "poke", "slap"]) {
      refused(await interact(b.Mia, path, id.Jiwoo, kind), 429, "rate-limit", `Mia's ${kind} within 10 s of her offer`);
    }
    await tom.during("highfive", 300);
    expect(tom.all("highfive"), "one offer sent, no more").toHaveLength(1);
  }, 30_000);

  // INT-10.5 (accepted inside 10 s, refused outside it, as the hook moves the
  // offer), INT-10.10 (a lapsed offer: refused, gone from the room view,
  // never in the log, no event)
  it("happens if accepted within 10 s, and lapses quietly after", async (ctx) => {
    const g = await gym(ctx, ["Ava", "Mia", "Tom", "Jiwoo"]);
    const { path, b, id } = g;
    const ava = await g.watch("Ava");
    const late = offered(await offer(b.Mia, path, id.Jiwoo), "Mia's offer");
    const inTime = offered(await offer(b.Tom, path, id.Jiwoo), "Tom's offer");
    await Promise.all([backdate(b.Ava, path, { user: id.Mia }, 11_000), backdate(b.Ava, path, { user: id.Tom }, 8_000)]);
    refused(await accept(b.Jiwoo, path, late), 409, "too-slow", "accepting Mia's, 11 s on");
    happened(await accept(b.Jiwoo, path, inTime), "accepting Tom's, 8 s on");
    expect(offersIn(await now(b.Ava, path)), "neither is open").toEqual([]);
    await ava.during("highfive", 500);
    expect(ava.all("highfive").filter((e) => e.done !== undefined).map((e) => e.id), "only Tom's happened").toEqual([inTime]);
    const log = (await logOf(b.Ava, path))!;
    expect(log).toContain("Tom and Jiwoo high-fived");
    expect(log.filter((l) => /Mia/.test(l)), "nothing of Mia's lapsed offer").toEqual([]);
  }, 30_000);

  // INT-10.7 (crossing offers: exactly one High-five; a double accept: one),
  // INT-10.8 (only the person it's for can accept; anyone else's High-five
  // is their own offer)
  it("makes exactly one High-five of crossing offers or a double accept, and only for the person it's for", async (ctx) => {
    const g = await gym(ctx, ["Ava", "Mia", "Jiwoo", "Tom", "Priya"]);
    const { path, b, id } = g;
    const ava = await g.watch("Ava");

    // crossing: one makes the offer, the other completes it
    const crossing = await Promise.all([offer(b.Mia, path, id.Jiwoo), offer(b.Jiwoo, path, id.Mia)]);
    const doneOnes = crossing.filter((a) => a.body?.done === true);
    expect(doneOnes, "exactly one completes the other").toHaveLength(1);
    const first = offered(crossing.find((a) => a !== doneOnes[0])!, "the offer that arrived first");
    expect(happened(doneOnes[0])).toBe(first);

    // Tom's offer to Priya: Ava can't take it; Priya's double accept makes one
    const tomsOffer = offered(await offer(b.Tom, path, id.Priya));
    refused(await accept(b.Ava, path, tomsOffer), 409, "nothing-to-answer", "Ava accepts Tom's offer to Priya");
    const twice = await Promise.all([accept(b.Priya, path, tomsOffer), accept(b.Priya, path, tomsOffer)]);
    expect(twice.map((a) => a.status).sort()).toEqual([200, 409]);
    refused(twice.find((a) => a.status === 409)!, 409, "answered", "the second of two accepts at once");

    // Mia offers Jiwoo again (her 10 s on Jiwoo moved past); Tom's High-five
    // on Mia is his own offer, and leaves Mia's to Jiwoo open
    await Promise.all([backdate(b.Ava, path, { user: id.Mia }, 11_000), backdate(b.Ava, path, { user: id.Jiwoo }, 11_000)]);
    const miaToJiwoo = offered(await offer(b.Mia, path, id.Jiwoo), "Mia offers Jiwoo again");
    offered(await offer(b.Tom, path, id.Mia), "Tom's High-five on Mia is his own offer");
    expect(offersIn(await now(b.Ava, path)).find((o) => o.id === miaToJiwoo), "Mia's offer to Jiwoo is still open").toMatchObject({
      from: id.Mia,
      to: id.Jiwoo,
    });

    await ava.during("highfive", 500);
    expect(ava.all("highfive").filter((e) => e.done !== undefined), "two High-fives in all").toHaveLength(2);
  }, 30_000);

  // INT-10.9 (never refused by the 10 s limit, and counts toward it)
  it("accepts a High-five within 10 s of your own interaction, and counts it as your latest", async (ctx) => {
    const g = await gym(ctx, ["Ava", "Mia", "Jiwoo", "Tom", "Priya"]);
    const { path, b, id } = g;
    accepted(await interact(b.Jiwoo, path, id.Mia, "cheer"), "Jiwoo cheers Mia");
    const mias = offered(await offer(b.Mia, path, id.Jiwoo));
    happened(await accept(b.Jiwoo, path, mias), "Jiwoo accepts, within 10 s of her cheer");
    // Priya, who never interacted with Tom, accepts his offer: then her 10 s on him has started
    const toms = offered(await offer(b.Tom, path, id.Priya));
    happened(await accept(b.Priya, path, toms));
    refused(await interact(b.Priya, path, id.Tom, "poke"), 429, "rate-limit", "Priya pokes Tom straight after accepting");
  }, 30_000);

  // INT-10.11 (an offer ends when either leaves; accepting it is `gone`)
  it("ends an offer when the offerer leaves", async (ctx) => {
    const g = await gym(ctx, ["Ava", "Mia", "Jiwoo"]);
    const { path, b, id } = g;
    const ava = await g.watch("Ava");
    const o = offered(await offer(b.Mia, path, id.Jiwoo));
    await b.Mia.post(path, { action: "leave" });
    refused(await accept(b.Jiwoo, path, o), 409, "gone", "accepting after Mia left");
    expect(offersIn(await now(b.Ava, path))).toEqual([]);
    await ava.during("highfive", 300);
    expect(ava.all("highfive").filter((e) => e.done !== undefined)).toEqual([]);
  }, 30_000);
});

// ===========================================================================
// GYM-17 and GYM-18: personal bests, and the room's moment for one
// ===========================================================================

const isPb = (res: Response) => /[?&]pb=1(&|$)/.test(res.headers.get("location") ?? "");

// Mia's first workout with these sets, in a room of her own she then leaves
// (which closes it): her history, before the room the test watches
async function history(sets: Record<string, string>[]) {
  const mia = new Browser();
  await signUp(mia, freshEmail(), "correct horse", "Mia");
  const own = await createRoom(mia);
  const results: boolean[] = [];
  for (const s of sets) {
    const res = await mia.post(own.path, { action: "log", ...s });
    expect(res.status, "Done").toBe(303);
    results.push(isPb(res));
  }
  await mia.post(own.path, { action: "leave" });
  return { mia, firstWorkout: results };
}

// Mia, with that history, joins Tom's room; Tom watches
async function pbRoom(ctx: TestContext, sets: Record<string, string>[]) {
  const { mia, firstWorkout } = await history(sets);
  const tomB = new Browser();
  await signUp(tomB, freshEmail(), "correct horse", "Tom");
  const { path, passcode } = await createRoom(tomB);
  await mia.post("/join", { passcode });
  const tom = await watchRoom(tomB, path);
  ctx.onTestFinished(() => tom.close());
  const first = await tom.next("room", () => true, 2000);
  const ids = Object.fromEntries(first.members.map((m) => [m.name, m.id]));
  const done = async (s: Record<string, string>) => {
    const res = await mia.post(path, { action: "log", ...s });
    expect(res.status, "Done").toBe(303);
    return isPb(res);
  };
  return { mia, tomB, path, tom, ids, firstWorkout, done };
}

describe("personal bests", () => {
  // GYM-17.1 (weight then reps; equal is never one), GYM-17.3 (the first
  // workout with an exercise sets the bar; later sets in the same workout
  // count as earlier sets), GYM-17.4 (two in one workout), GYM-17.10 (said
  // in the Done's own answer), GYM-18.1 (the event on another member's
  // stream: who and the exercise, no numbers), GYM-18.5 (the log line, no
  // numbers), GYM-18.6 (in the room view for 30 s), GYM-18.9 (nothing counts
  // them), and "any earlier workout, in any room"
  it("finds a PB by weight then reps, from a person's second workout on, and tells the room without numbers", async (ctx) => {
    const r = await pbRoom(ctx, [
      { exercise_id: BENCH, weight_kg: "90", reps: "5" },
      { exercise_id: BENCH, weight_kg: "100", reps: "5" },
      { exercise_id: BENCH, weight_kg: "97.5", reps: "12" },
    ]);
    expect(r.firstWorkout, "nothing in a first workout is a PB").toEqual([false, false, false]);

    const results = [];
    for (const [w, reps] of [["100", "5"], ["97.5", "12"], ["100", "6"], ["100", "6"], ["102.5", "1"]]) {
      results.push(await r.done({ exercise_id: BENCH, weight_kg: w, reps }));
    }
    // equal to the old best; equal to an older lighter set; more reps at the
    // best weight; equal to this workout's own earlier PB; heavier
    expect(results).toEqual([false, false, true, false, true]);

    await r.tom.during("pb", 500);
    const pbs = r.tom.all("pb");
    expect(pbs, "one event per PB").toHaveLength(2);
    for (const e of pbs) {
      const { arrivedAt: _, ...data } = e;
      expect(Object.keys(data).sort(), "who, what and when: no numbers").toEqual(["at", "exercise", "from"]);
      expect(data).toMatchObject({ from: { id: r.ids.Mia, name: "Mia" }, exercise: { id: Number(BENCH), name: "Bench press" } });
      expect(Object.keys(data.exercise).sort()).toEqual(["id", "name"]);
    }
    const fresh = (await now(r.tomB, r.path)).pbs ?? [];
    expect(fresh.length, "Mia's PBs, in the room view").toBeGreaterThanOrEqual(1);
    for (const p of fresh) {
      expect(Object.keys(p).sort()).toEqual(["exercise", "until", "userId"]);
      expect(p).toMatchObject({ userId: r.ids.Mia, exercise: { id: Number(BENCH), name: "Bench press" } });
    }
    const latest = Math.max(...fresh.map((p) => p.until));
    expect(Math.abs(latest - (pbs[1].at + 30_000)), "fresh for 30 s from the newest PB").toBeLessThan(1000);

    const tomLog = (await logOf(r.tomB, r.path))!;
    expect(tomLog.filter((l) => /PB/.test(l))).toEqual(["Mia hit a PB on bench press", "Mia hit a PB on bench press"]);
    expect((await logOf(r.mia, r.path))!.filter((l) => /PB/.test(l))).toEqual(["You hit a PB on bench press", "You hit a PB on bench press"]);
  }, 30_000);

  // GYM-17.2: each kind by what it measures
  it("finds bodyweight, duration and cardio PBs by what each measures", async (ctx) => {
    const r = await pbRoom(ctx, [
      { exercise_id: PULL_UP, reps: "8", weight_kg: "" },
      { exercise_id: PLANK, minutes: "1", seconds: "0" },
      { exercise_id: RUN, distance_km: "5", minutes: "25", seconds: "0" },
    ]);
    const pull = [];
    for (const [reps, kg] of [["8", ""], ["8", "5"], ["9", ""], ["7", "20"]]) pull.push(await r.done({ exercise_id: PULL_UP, reps, weight_kg: kg }));
    // equal; same reps, more added weight; more reps; fewer reps, however heavy
    expect(pull, "pull-ups").toEqual([false, true, true, false]);
    const plank = [];
    for (const [m, s] of [["1", "0"], ["0", "59"], ["1", "5"]]) plank.push(await r.done({ exercise_id: PLANK, minutes: m, seconds: s }));
    expect(plank, "plank").toEqual([false, false, true]);
    const run = [];
    for (const [km, m] of [["5", "25"], ["5", "24"], ["4", "15"], ["5.5", "30"]]) run.push(await r.done({ exercise_id: RUN, distance_km: km, minutes: m, seconds: "0" }));
    // equal; same distance faster; shorter, however fast; further, however slow
    expect(run, "runs").toEqual([false, true, false, true]);
  }, 30_000);

  // GYM-17.5: two Dones at once with the same new best: exactly one PB
  it("makes exactly one of two simultaneous Dones with the same new best a PB", async (ctx) => {
    const r = await pbRoom(ctx, [{ exercise_id: BENCH, weight_kg: "100", reps: "5" }]);
    const both = await Promise.all([r.done({ exercise_id: BENCH, weight_kg: "110", reps: "5" }), r.done({ exercise_id: BENCH, weight_kg: "110", reps: "5" })]);
    expect(both.filter(Boolean)).toHaveLength(1);
    await r.tom.during("pb", 500);
    expect(r.tom.all("pb")).toHaveLength(1);
  }, 30_000);

  // GYM-17.6: editing or deleting a set announces nothing, and edited values
  // count as earlier sets (deleted ones don't)
  it("never announces a PB on an edit or a delete, and judges later Dones against the edited sets", async (ctx) => {
    const r = await pbRoom(ctx, [{ exercise_id: BENCH, weight_kg: "100", reps: "5" }]);
    expect(await r.done({ exercise_id: BENCH, weight_kg: "100", reps: "5" })).toBe(false);
    const setId = (await (await r.mia.get(r.path)).text()).match(/\?edit=(\d+)/)![1];
    const edited = await r.mia.post(r.path, { action: "edit", set_id: setId, weight_kg: "110", reps: "5" });
    expect(edited.status).toBe(303);
    expect(isPb(edited), "an edit is never a PB").toBe(false);
    expect(await r.done({ exercise_id: BENCH, weight_kg: "105", reps: "5" }), "under the edited 110").toBe(false);
    const deleted = await r.mia.post(r.path, { action: "delete", set_id: setId });
    expect(deleted.status).toBe(303);
    expect(isPb(deleted)).toBe(false);
    expect(await r.done({ exercise_id: BENCH, weight_kg: "107.5", reps: "5" }), "the 110 is gone, so this beats 105").toBe(true);
    await r.tom.during("pb", 500);
    expect(r.tom.all("pb"), "only the Done").toHaveLength(1);
  }, 30_000);

  // GYM-18.2 (a Cheer from the PB moment is a plain Cheer: Thanks follows,
  // and the 10 s limit holds)
  it("takes a Cheer on someone's PB as any Cheer", async (ctx) => {
    const r = await pbRoom(ctx, [{ exercise_id: BENCH, weight_kg: "100", reps: "5" }]);
    expect(await r.done({ exercise_id: BENCH, weight_kg: "105", reps: "5" })).toBe(true);
    await r.tom.next("pb", () => true, 2000);
    accepted(await interact(r.tomB, r.path, r.ids.Mia, "cheer"), "Tom cheers Mia's PB");
    expect(answerableIn(await now(r.tomB, r.path)).filter((a) => a.from === r.ids.Tom && a.to === r.ids.Mia).map((a) => a.kind)).toEqual(["thanks"]);
    refused(await interact(r.tomB, r.path, r.ids.Mia, "cheer"), 429, "rate-limit", "a second cheer within 10 s");
  }, 30_000);
});

// ===========================================================================
// BOT-7: Dony and the High-five, and his PB
// ===========================================================================

type QA = {
  now: number;
  lastActiveAt: number;
  dony: null | {
    summonedAt: number;
    segments: { kind: "idle" | "lift" | "rest"; start: number; end: number }[];
    emotes: { at: number; emoji: string; why: string }[];
    pb: { at: number; exercise: unknown } | null;
  };
};
async function qa(b: Browser, path: string, summonedAt?: number): Promise<QA> {
  const res = await b.get(`${path}/qa${summonedAt === undefined ? "" : `?summonedAt=${summonedAt}`}`);
  if (res.status !== 200) {
    throw new Error(`GET ${path}/qa answered ${res.status}: these checks need the test hook, so the app must run with SPOTTER_TEST_HOOKS=1`);
  }
  return (await res.json()) as QA;
}
const donyId = (e: RoomEvent) => (e as unknown as { dony?: { member: { id: number } | null } }).dony?.member?.id ?? null;
const fromDony = (who: Who) => who.name === "Dony";

// Summons Dony and moves the visit on until none of his own emoji fall near
// now, so his answers (which keep a second clear of his own, BOT-6.9) aren't
// dropped. His landing Hi and the first 20 minutes are skipped over.
async function summonQuiet(b: Browser, path: string, w: RoomWatch) {
  expect((await b.post(path, { action: "dony", intent: "summon" })).status).toBe(303);
  const out = await w.next("room", (e) => donyId(e) !== null, 2000);
  const dony = donyId(out)!;
  let moved = 0;
  for (let j = 0; j < 400; j++) {
    const step = j === 0 ? 20 * MIN : 7_919;
    await backdate(b, path, { room: true }, step);
    moved += step;
    const v = (await qa(b, path)).dony!;
    const t = Date.now();
    if (!v.emotes.some((e) => e.why === "own" && e.at > t - 40 * S && e.at < t + 40 * S)) return { dony, moved };
  }
  throw new Error("no quiet stretch of his visit found");
}

describe("Dony and the High-five", () => {
  // BOT-7.2 (he accepts about a second after an offer; others within his
  // 10 s lapse; no emoji answer for it; the log line), BOT-7.1 (he never
  // offers, replies or interacts), BOT-7.7 (his acceptance isn't room
  // activity)
  it("accepts one of three offers about a second later, and leaves the others hanging", async (ctx) => {
    const g = await gym(ctx, ["Ava", "Mia", "Tom", "Priya"]);
    const { path, b } = g;
    const ava = await g.watch("Ava");
    const { dony } = await summonQuiet(b.Ava, path, ava);
    const offersSent = Date.now();

    const three = await Promise.all(["Mia", "Tom", "Priya"].map((n) => offer(b[n], path, dony)));
    const offers = three.map((a, i) => offered(a, `${["Mia", "Tom", "Priya"][i]}'s offer to Dony`));
    const activeAfterOffers = (await qa(b.Ava, path)).lastActiveAt;
    const done = await ava.next("highfive", (e) => e.done !== undefined && e.to.id === dony, 4000);
    expect(offers).toContain(done.id);
    const offeredAt = Math.max(...three.map((a) => a.body!.at!));
    expect(done.done! - Math.min(...three.map((a) => a.body!.at!)), "about a second after").toBeGreaterThanOrEqual(500);
    expect(done.done! - offeredAt).toBeLessThanOrEqual(2500);
    // 3 s on, still one; no emoji answer for it; nothing he started
    await ava.during("highfive", 2500);
    expect(ava.all("highfive").filter((e) => e.done !== undefined), "one High-five between them").toHaveLength(1);
    expect(ava.all("emote").filter((e) => fromDony(e.from) && e.at >= offersSent), "no emoji answer").toEqual([]);
    expect(ava.all("interaction").filter((e) => fromDony(e.from)), "he sends no interaction or reply").toEqual([]);
    expect(ava.all("highfive").filter((e) => fromDony(e.from)), "he offers nothing").toEqual([]);
    expect((await qa(b.Ava, path)).lastActiveAt, "his acceptance isn't room activity").toBe(activeAfterOffers);
    const who = done.from.name;
    expect((await logOf(b.Ava, path))![0]).toBe(`${who} and Dony high-fived`);
  }, 60_000);

  // BOT-7.4: his emoji answers and his acceptances share one 10 s cap
  it("shares one cap between his emoji answers and his High-fives", async (ctx) => {
    const g = await gym(ctx, ["Ava", "Mia", "Tom", "Priya", "Kai"]);
    const { path, b, id } = g;
    const ava = await g.watch("Ava");
    const { dony } = await summonQuiet(b.Ava, path, ava);

    // Tom's cheer gets an emoji answer; Mia's offer straight after lapses
    const cheerAt = accepted(await interact(b.Tom, path, dony, "cheer")).at!;
    await ava.next("emote", (e) => fromDony(e.from) && e.at >= cheerAt, 3500);
    offered(await offer(b.Mia, path, dony));
    await ava.during("highfive", 2500);
    expect(ava.all("highfive").filter((e) => e.done !== undefined), "no High-five within 10 s of his answer").toEqual([]);

    // 12 s later (everyone who sent him something moved back together, his
    // answer with them): Priya's offer is accepted, and Kai's cheer after it
    // gets no emoji answer
    await Promise.all(["Tom", "Mia"].map((n) => backdate(b.Ava, path, { user: id[n] }, 12_000)));
    offered(await offer(b.Priya, path, dony));
    await ava.next("highfive", (e) => e.done !== undefined && e.from.name === "Priya", 4000);
    const kaiAt = accepted(await interact(b.Kai, path, dony, "cheer")).at!;
    await ava.during("emote", 2500);
    expect(ava.all("emote").filter((e) => fromDony(e.from) && e.at >= kaiAt), "no emoji answer within 10 s of his High-five").toEqual([]);
  }, 60_000);
});

// Summons Dony, then puts his visit where his planned PB falls between lo
// and hi ms from now. His plan is drawn from the room and the summon time
// (spec/dony-emoji.test.ts), so moving the room changes it: this previews
// earlier summon times through the hook, takes the first whose PB fits, and
// moves the room back by that much. Returns his PB as the server now plans it.
async function summonWithPb(b: Browser, path: string, lo: number, hi: number) {
  expect((await b.post(path, { action: "dony", intent: "summon" })).status).toBe(303);
  const real = (await qa(b, path)).dony!;
  expect(real, "he's out").not.toBeNull();
  expect(real.pb, "a PB is planned for this visit").not.toBeNull();
  // BOT-7.5 (F11): between 4 and 8 minutes after landing; on the Done of
  // the first set that ends in that window if there is one; past 8 only when
  // he is by the lockers (idle) for the whole window, and then at the start
  // of his next lift, never past 10 minutes
  const off = (t: number) => t - real.summonedAt;
  const at = off(real.pb!.at);
  expect(at, "at least 4 minutes after landing").toBeGreaterThanOrEqual(4 * MIN);
  const windowSet = real.segments.find((g) => g.kind === "lift" && off(g.end) >= 4 * MIN && off(g.end) <= 8 * MIN);
  if (windowSet) expect(real.pb!.at, "on the Done of his first set ending 4 to 8 minutes in").toBe(windowSet.end);
  else if (at > 8 * MIN) {
    const lockers = real.segments.some((g) => g.kind === "idle" && off(g.start) <= 4 * MIN && off(g.end) >= 8 * MIN);
    expect(lockers, "past 8 minutes only after a lockers spell covering the window").toBe(true);
    expect(at, "never past 10 minutes").toBeLessThanOrEqual(10 * MIN);
    expect(real.segments.some((g) => g.kind === "lift" && g.start === real.pb!.at), "as his next lift starts").toBe(true);
  }
  for (let j = 1; j <= 3000; j++) {
    const ms = 3 * MIN + ((j * 2_111) % (7 * MIN));
    const now = Date.now();
    const { dony } = await qa(b, path, real.summonedAt - ms);
    const pb = dony?.pb;
    if (!pb || pb.at - now < lo || pb.at - now > hi) continue;
    await backdate(b, path, { room: true }, ms);
    const moved = (await qa(b, path)).dony!;
    expect(moved.summonedAt, "the summon moved back with the room").toBe(real.summonedAt - ms);
    expect(moved.pb, "the PB is the one previewed").toEqual(pb);
    return moved.pb!;
  }
  throw new Error("no summon time in 3000 puts his PB where this check needs it");
}

describe("Dony's PB", () => {
  // BOT-7.5 (once per visit, 4 to about 8 minutes in, at the same server
  // time on two streams, fresh in the room view, never in the room log),
  // BOT-7.7 (not room activity). BOT-7.5's restart half isn't covered here.
  it("hits a planned PB 4 to 8 minutes into his visit, on every stream at once, and never in the log", async (ctx) => {
    const g = await gym(ctx, ["Ava", "Mia"]);
    const { path, b } = g;
    const ava = await g.watch("Ava");
    const mia = await g.watch("Mia");
    const pb = await summonWithPb(b.Ava, path, 2 * S, 8 * S);
    const dony = donyId(await now(b.Ava, path))!;
    // read only through /qa from here to the second read: a room page GET is
    // room activity (ROOM-6)
    const read = await qa(b.Ava, path);
    expect(pb.at - read.now, "his PB is still ahead").toBeGreaterThan(500);
    const seen = await Promise.all([ava, mia].map((w) => w.next("pb", (e) => fromDony(e.from), 10 * S)));
    expect((await qa(b.Ava, path)).lastActiveAt, "not room activity").toBe(read.lastActiveAt);
    for (const e of seen) {
      expect(e).toMatchObject({ from: { id: dony, name: "Dony" }, at: pb.at });
      expect(Object.keys(e).filter((k) => k !== "arrivedAt").sort()).toEqual(["at", "exercise", "from"]);
    }
    expect(((await now(b.Ava, path)).pbs ?? []).map((p) => p.userId), "his PB is fresh for the menus").toContain(dony);
    expect((await logOf(b.Ava, path))!.filter((l) => /PB/.test(l)), "never in the room log").toEqual([]);
    await ava.during("pb", 1500);
    expect(ava.all("pb"), "once").toHaveLength(1);
  }, 60_000);

  // BOT-7.5 (F11), over many summon times: every planned PB falls 4 to 8
  // minutes after landing, or (after a lockers spell covering that window)
  // as his next lift starts, never past 10. Previews only; nothing is stored.
  it("plans every PB 4 to 8 minutes after landing, over 200 summon times", async (ctx) => {
    const g = await gym(ctx, ["Ava"]);
    const { path, b } = g;
    expect((await b.Ava.post(path, { action: "dony", intent: "summon" })).status).toBe(303);
    const real = (await qa(b.Ava, path)).dony!;
    const late: number[] = [];
    for (let j = 0; j < 200; j++) {
      const s = real.summonedAt - j * 61_337;
      const v = (await qa(b.Ava, path, s)).dony!;
      expect(v.pb, `visit ${j}: a PB is planned`).not.toBeNull();
      const at = v.pb!.at - s;
      expect(at, `visit ${j}: at least 4 minutes in`).toBeGreaterThanOrEqual(4 * MIN);
      if (at <= 8 * MIN) continue;
      late.push(at);
      expect(at, `visit ${j}: never past 10 minutes`).toBeLessThanOrEqual(10 * MIN);
      expect(v.segments.some((x) => x.kind === "idle" && x.start - s <= 4 * MIN && x.end - s >= 8 * MIN), `visit ${j}: past 8 only after a lockers spell`).toBe(true);
    }
    expect(late.length, "past 8 minutes is the rare case").toBeLessThan(40);
  }, 60_000);

  // BOT-7.6: a PB that falls while nobody's stream is open is missed, never
  // sent late
  it("misses his PB if nobody was watching when it fell", async (ctx) => {
    const g = await gym(ctx, ["Ava", "Mia"]);
    const { path, b } = g;
    const pb = await summonWithPb(b.Ava, path, -8 * S, -1 * S);
    expect(Date.now() - pb.at, "it has fallen").toBeGreaterThan(0);
    const ava = await g.watch("Ava");
    expect(await ava.during("pb", 2500)).toEqual([]);
  }, 60_000);
});
