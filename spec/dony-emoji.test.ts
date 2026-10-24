import { describe, expect, it, type TestContext } from "vitest";
import { backdate, Browser, createRoom, freshEmail, signUp, watchRoom, type RoomEvent, type RoomWatch } from "./helpers.ts";

// Dony's emoji (docs/product/criteria/int.md, BOT-6), and what interactions
// with him do (INT-3.11, INT-5.15), checked over HTTP against the running app.
// Sending, refusals and the stream's events are the contract at the top of
// spec/interactions.test.ts; Dony's emoji arrive as `emote` events from
// {"id": dony.member.id, "name": "Dony"}, and for his the event's `at` is the
// time his schedule gives it (or, for an answer, the time it was worked out to).
//
// ===========================================================================
// THE TEST HOOK, Dony's part (QA round one, 22 Oct; the rest of the hook, and
// when it exists at all, is the contract at the top of spec/interactions.test.ts).
// His own emoji come about one every 2 minutes, so a check needs to know when
// the next is due, and to put a visit where one is due soon.
//
//   GET /rooms/<id>/qa?summonedAt=<ms>&until=<ms>
//   Members only. Reads and changes nothing, and isn't anyone being seen or
//   the room being active.
//   200 {
//     "now": <server time>,
//     "lastActiveAt": <the room's stored last-active time (ROOM-6)>,
//     "dony": null | {
//       "summonedAt": <ms>,
//       "segments": [{ "kind": "idle" | "lift" | "rest", "start", "end",
//                      "slackAt": <ms, when a rest that runs over turns
//                                  Slacking> | null }],
//       "emotes": [{ "at", "emoji", "why": "landing" | "own" | "answer" }]
//     }
//   }
//   `dony` is his visit as the server plays it in this room as it is now,
//   from `summonedAt` (by default the summon of the visit he's on; null if
//   he's in his poster and no summonedAt is given) up to `until` (by default
//   now + 10 minutes): his schedule's segments (the warm-up first, an idle
//   one), and every emoji of his in that span, his answers included, as
//   worked out from the interactions stored for him. With a summonedAt other
//   than his real one, it's the visit he would have had from that summon:
//   a preview, nothing stored.
//
// So a check summons him as anyone would, previews other summon times, picks
// one whose visit it needs, and moves the room back to it with
// `op=backdate room=1` (the summon moves with the room). Visits depend only
// on the room and the summon time (BOT-3), so the preview is what he then does.
// ===========================================================================

type Segment = { kind: "idle" | "lift" | "rest"; start: number; end: number; slackAt: number | null };
type Planned = { at: number; emoji: string; why: "landing" | "own" | "answer" };
type Visit = { summonedAt: number; segments: Segment[]; emotes: Planned[] };
type QA = { now: number; lastActiveAt: number; dony: Visit | null };
type DonyRoom = RoomEvent & { dony: { out: boolean; member: { id: number; name: string; state: string } | null } };

const S = 1000;
const MIN = 60 * S;
const wait = (ms: number) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

const FITS: Record<string, string[]> = {
  idle: ["hi", "haha"],
  lifting: ["flex", "fire"],
  resting: ["clap", "haha", "love"],
  slacking: ["dead", "eyes"],
};
const ANSWERS: Record<string, string[]> = { cheer: ["love", "flex"], poke: ["eyes"], slap: ["haha", "dead"] };

async function qa(b: Browser, path: string, q: { summonedAt?: number; until?: number } = {}): Promise<QA> {
  const params = new URLSearchParams();
  if (q.summonedAt !== undefined) params.set("summonedAt", String(q.summonedAt));
  if (q.until !== undefined) params.set("until", String(q.until));
  const res = await b.get(`${path}/qa?${params}`);
  if (res.status !== 200) {
    throw new Error(
      `GET ${path}/qa answered ${res.status}: these checks need the test hook, so the app must run with SPOTTER_TEST_HOOKS=1 (the contract at the top of spec/dony-emoji.test.ts)`,
    );
  }
  return (await res.json()) as QA;
}

const segmentAt = (v: Visit, t: number) => v.segments.find((s) => t >= s.start && t < s.end);
function stateAt(v: Visit, t: number): string {
  const s = segmentAt(v, t);
  expect(s, `his schedule covers ${t}`).toBeDefined();
  if (s!.kind === "idle") return "idle";
  if (s!.kind === "lift") return "lifting";
  return s!.slackAt !== null && t >= s!.slackAt ? "slacking" : "resting";
}
const own = (v: Visit) => v.emotes.filter((e) => e.why === "own");

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
  return { path, b, watch };
}

const donyOf = (e: RoomEvent) => (e as DonyRoom).dony?.member ?? null;
const donyEmotes = (w: RoomWatch) => w.all("emote").filter((e) => e.from.name === "Dony");
const interact = (b: Browser, path: string, to: number, kind: string) => b.post(path, { action: "interact", to: String(to), kind });

// his visit over a fixed span, so two reads of it can be compared
const span = (summonedAt: number) => ({ until: summonedAt + 60 * MIN });
const ownBetween = (v: Visit, from: number, to: number) => own(v).filter((e) => e.at >= from && e.at < to);

// Summons Dony as anyone would, then puts his visit where the check needs it:
// previews earlier summon times through the hook (each `ms` before the real
// one, which is "now" for the preview), takes the first whose visit passes
// the test, and moves the room back by that much. Returns the visit as the
// server now plays it, read back after the move.
async function summonFitting(
  b: Browser,
  path: string,
  test: (v: Visit, now: number) => boolean,
): Promise<{ visit: Visit; dony: number; summonedAt: number; at: number }> {
  expect((await b.post(path, { action: "dony", intent: "summon" })).status).toBe(303);
  const real = (await qa(b, path)).dony!;
  expect(real, "he's out").not.toBeNull();
  for (let j = 1; j <= 2000; j++) {
    const ms = 20 * MIN + j * 7_919;
    const now = Date.now();
    const { dony } = await qa(b, path, { summonedAt: real.summonedAt - ms, until: now + 3 * MIN });
    // the preview is of the visit as it will be once moved, seen from now
    if (!dony || !test(dony, now)) continue;
    await backdate(b, path, { room: true }, ms);
    const moved = (await qa(b, path, span(real.summonedAt - ms))).dony!;
    expect(moved.summonedAt, "the summon moved back with the room").toBe(real.summonedAt - ms);
    const w = await watchRoom(b, path);
    const seen = await w.next("room", (e) => donyOf(e) !== null, 2000).finally(() => w.close());
    // `at`: the moment the visit was judged against, so a check reads its
    // windows from there, not from a later now that setup has moved on
    return { visit: moved, dony: donyOf(seen)!.id, summonedAt: moved.summonedAt, at: now };
  }
  throw new Error("no summon time in 2000 gives the visit this check needs");
}

describe("Dony's emoji, live", () => {
  // BOT-6.2, BOT-6.1 (to every stream, from him), BOT-6.10 (nothing once he's
  // back, and interactions can't reach him), BOT-6.12 (nothing before he's
  // ever been out). The poster's 30 s rest is moved past by the hook. The
  // landing Hi is real time: about 8 s.
  it.concurrent("waves Hi within his warm-up on every screen, fresh each summon, and nothing while he's in his poster", async (ctx) => {
      const { path, b, watch } = await gym(ctx, ["Mia", "Tom"]);
      const mia = await watch("Mia");
      const tom = await watch("Tom");
      // never out: nothing from him
      expect(await tom.during("emote", 1500)).toEqual([]);

      for (const visit of [1, 2]) {
        const summonedAt = Date.now();
        await b.Mia.post(path, { action: "dony", intent: "summon" });
        const out = await tom.next("room", (e) => donyOf(e) !== null, 2000);
        const dony = donyOf(out)!;
        for (const w of [mia, tom]) {
          const hi = await w.next("emote", (e) => e.from.name === "Dony", 4000);
          expect(hi, `visit ${visit}`).toMatchObject({ emoji: "hi", from: { id: dony.id, name: "Dony" } });
          expect(hi.at - summonedAt, `visit ${visit}: within his 3 s warm-up`).toBeLessThanOrEqual(3500);
          expect(hi.arrivedAt - summonedAt).toBeLessThanOrEqual(4000);
        }
        await wait(500);
        await b.Tom.post(path, { action: "dony", intent: "send-back" });
        await tom.next("room", (e) => donyOf(e) === null, 2000);
        const sentBack = donyEmotes(tom).length;
        // in his poster: he can't be reached, and sends nothing
        for (const kind of ["cheer", "poke", "slap"]) {
          const res = await interact(b.Mia, path, dony.id, kind);
          expect(res.status, `${kind} Dony in his poster`).toBe(409);
          expect(await res.json()).toEqual({ ok: false, reason: "gone" });
        }
        expect((await b.Mia.post(path, { action: "say", to: String(dony.id), preset: "hype-1" })).status).toBe(409);
        await wait(1000);
        expect(donyEmotes(tom).length, "nothing while he's in his poster").toBe(sentBack);
        // the poster's 30 s rest, moved past
        if (visit === 1) await backdate(b.Mia, path, { room: true }, 31_000);
      }
  }, 30_000);

  // BOT-6.5 (two streams agree; one opened later in the visit), BOT-6.4 live
  // (it fits the state he's in when it falls), BOT-6.1 (to every stream),
  // BOT-6.6 (none sent twice; his landing Hi, skipped over by the move, is
  // never sent late). About 9 s.
  it.concurrent("sends his own emoji when his schedule says, the same on every stream, fitting what he's doing", async (ctx) => {
    const { path, b, watch } = await gym(ctx, ["Mia", "Tom"]);
    const mia = await watch("Mia");
    const { visit, at } = await summonFitting(b.Mia, path, (v, now) => {
      return ownBetween(v, now + 4 * S, now + 7 * S).length === 1 && ownBetween(v, now - 5 * S, now + 20 * S).length === 1;
    });
    const [due] = ownBetween(visit, at + 4 * S, at + 7 * S);
    expect(due, "the emoji the hook found is still in his schedule").toBeDefined();
    // Tom opens the room later in the visit, just before it falls
    await wait(due.at - 2 * S - Date.now());
    const tom = await watch("Tom");

    const seen = await Promise.all([mia, tom].map((w) => w.next("emote", (e) => e.from.name === "Dony", due.at - Date.now() + 1500)));
    for (const e of seen) {
      expect(e.emoji).toBe(due.emoji);
      expect(e.at).toBe(due.at);
      expect(Math.abs(e.arrivedAt - due.at)).toBeLessThan(1000);
    }
    expect(FITS[stateAt(visit, due.at)]).toContain(due.emoji);
    // and only once; and his landing Hi, 20 minutes back, was never sent late
    await wait(2000);
    expect(donyEmotes(mia).map((e) => e.at)).toEqual([due.at]);
    expect(donyEmotes(tom).map((e) => e.at)).toEqual([due.at]);
  }, 30_000);

  // BOT-6.6: one that falls while nobody's stream is open is missed, never
  // sent late. About 8 s.
  it.concurrent("misses an emoji that fell while nobody was watching, rather than sending it late", async (ctx) => {
    const { path, b, watch } = await gym(ctx, ["Mia"]);
    const { visit, at } = await summonFitting(b.Mia, path, (v, now) => {
      return ownBetween(v, now + 2 * S, now + 4 * S).length === 1 && ownBetween(v, now, now + 15 * S).length === 1;
    });
    const [due] = ownBetween(visit, at + 2 * S, at + 4 * S);
    await wait(due.at + 1500 - Date.now());
    const mia = await watch("Mia");
    expect(await mia.during("emote", 2500)).toEqual([]);
    // the stream itself carries emoji: Mia's own arrives
    expect((await b.Mia.post(path, { action: "emote", emoji: "fire" })).status).toBe(200);
    await mia.next("emote", (e) => e.from.name === "Mia");
  }, 30_000);

  // BOT-6.11 (his emoji isn't room activity), INT-5.13 (a person's is). About 5 s.
  it.concurrent("doesn't count his emoji as room activity, and does count a person's", async (ctx) => {
    const { path, b, watch } = await gym(ctx, ["Mia", "Tom"]);
    const tom = await watch("Tom");
    await summonFitting(b.Mia, path, (v, now) => ownBetween(v, now + 2 * S, now + 4 * S).length === 1);
    const before = await qa(b.Tom, path);
    await tom.next("emote", (e) => e.from.name === "Dony" && e.emoji !== "hi", 10 * S);
    const after = await qa(b.Tom, path);
    expect(after.lastActiveAt, "his emoji moved nothing").toBe(before.lastActiveAt);

    const sent = Date.now();
    expect((await b.Mia.post(path, { action: "emote", emoji: "fire" })).status).toBe(200);
    expect((await qa(b.Tom, path)).lastActiveAt).toBeGreaterThanOrEqual(sent - 50);
  }, 30_000);
});

describe("Dony's emoji over a visit", () => {
  // BOT-6.3, BOT-6.4 (fits his state), BOT-6.9 (at least 1 s apart), BOT-6.2
  // (Hi on landing, the first of every visit). Read from his schedule through
  // the hook, over twenty hour-long visits in one room.
  it("lands with Hi, then about one every 2 minutes, never two within 60 s, one per segment at most, each fitting his state", async (ctx) => {
    const { path, b } = await gym(ctx, ["Mia"]);
    const t0 = Date.now();
    let total = 0;
    const tenMinuteCounts: number[] = [];
    for (let v = 0; v < 20; v++) {
      const summonedAt = t0 - 2 * 60 * MIN - v * 3_917_000;
      const { dony } = await qa(b.Mia, path, { summonedAt, until: summonedAt + 60 * MIN });
      expect(dony, "a visit").not.toBeNull();
      const visit = dony!;
      const emotes = [...visit.emotes].sort((a, b) => a.at - b.at);
      // landing: Hi, first, within the warm-up, once
      expect(emotes[0]).toMatchObject({ emoji: "hi", why: "landing" });
      expect(emotes[0].at - summonedAt).toBeGreaterThanOrEqual(0);
      expect(emotes[0].at - summonedAt).toBeLessThanOrEqual(3 * S);
      expect(emotes.filter((e) => e.why === "landing")).toHaveLength(1);
      expect(visit.segments[0]).toMatchObject({ kind: "idle", start: summonedAt });
      expect(emotes.filter((e) => e.why === "answer"), "nobody has interacted with him").toEqual([]);

      const mine = emotes.filter((e) => e.why === "own");
      for (const [i, e] of mine.entries()) {
        expect(e.at, "not in the warm-up").toBeGreaterThanOrEqual(visit.segments[0].end);
        expect(FITS[stateAt(visit, e.at)], `visit ${v}, ${e.emoji} at +${e.at - summonedAt} ms`).toContain(e.emoji);
        if (i) expect(e.at - mine[i - 1].at, "never two within 60 s").toBeGreaterThanOrEqual(60 * S);
      }
      for (const s of visit.segments) expect(mine.filter((e) => e.at >= s.start && e.at < s.end).length, "one per set, rest or spell by the lockers").toBeLessThanOrEqual(1);
      for (let i = 1; i < emotes.length; i++) expect(emotes[i].at - emotes[i - 1].at, "at least 1 s apart").toBeGreaterThanOrEqual(S);

      total += mine.length;
      for (let w = 0; w < 6; w++) tenMinuteCounts.push(mine.filter((e) => e.at >= summonedAt + w * 10 * MIN && e.at < summonedAt + (w + 1) * 10 * MIN).length);
    }
    // about one every 2 minutes: 30 an hour, so 600 over twenty hours, give
    // or take a quarter; about five in ten minutes
    expect(total).toBeGreaterThanOrEqual(450);
    expect(total).toBeLessThanOrEqual(750);
    // and in a 10-minute stretch, about five: most stretches have two to eight
    const typical = tenMinuteCounts.filter((n) => n >= 2 && n <= 8).length / tenMinuteCounts.length;
    expect(typical).toBeGreaterThanOrEqual(0.75);
  }, 60_000);
});

describe("interactions with Dony", () => {
  // BOT-6.7 (answers, about a second after, by kind), BOT-6.8 (at most one
  // every 10 s, counted from his last answer), INT-3.11 and BOT-6.7 (his
  // schedule unchanged), INT-5.15 (presets are accepted and never answered),
  // BOT-6.9 (every pair at least 1 s apart). His 10 s between answers is the
  // stored interactions' times, so the hook moves the senders back rather
  // than waiting; each answer's second is real time. About 8 s.
  it.concurrent("answers a cheer, a poke and a slap about a second later, at most once every 10 s, and never a preset, with his schedule untouched", async (ctx) => {
    const { path, b, watch } = await gym(ctx, ["Mia", "Tom", "Priya", "Sam", "Ava", "Kai"]);
    const ava = await watch("Ava");
    // a visit with none of his own emoji in the next 20 s, and him slappable
    // (Idle, Resting or Slacking) for all of them. Also none in the 40 s
    // before: moving the senders back moves his past answers back with them
    // (about 16 s in all below) but not his own emoji, and an answer moved to
    // within 1 s of one of his own would be dropped (BOT-6.9)
    const { visit, dony, summonedAt } = await summonFitting(b.Mia, path, (v, now) => {
      if (ownBetween(v, now - 40 * S, now + 20 * S).length) return false;
      for (let t = now; t <= now + 20 * S; t += 500) if (stateAt(v, t) === "lifting") return false;
      return true;
    });
    const start = Date.now();
    const ids: Record<string, number> = {};
    for (const m of (await ava.next("room", () => true, 2000)).members) ids[m.name] = m.id;

    // a preset: accepted, never answered
    expect((await b.Kai.post(path, { action: "say", to: String(dony), preset: "hype-3" })).status).toBe(200);
    await ava.next("say", (e) => e.to.name === "Dony");

    // Mia cheers: an answer, about a second after
    expect((await interact(b.Mia, path, dony, "cheer")).status).toBe(200);
    const cheer = await ava.next("interaction", (e) => e.to.name === "Dony");
    const first = await ava.next("emote", (e) => e.from.name === "Dony", 2500);
    expect(ANSWERS.cheer).toContain(first.emoji);
    expect(first.arrivedAt - cheer.arrivedAt).toBeGreaterThanOrEqual(500);
    expect(first.arrivedAt - cheer.arrivedAt).toBeLessThanOrEqual(2000);

    // Tom, Priya and Sam cheer him at once, under 10 s after his answer:
    // accepted, their reactions play, and no answer
    const three = await Promise.all(["Tom", "Priya", "Sam"].map((n) => interact(b[n], path, dony, "cheer")));
    expect(three.map((r) => r.status)).toEqual([200, 200, 200]);
    for (let i = 0; i < 3; i++) await ava.next("interaction", (e) => e.to.name === "Dony" && e.from.name !== "Mia");
    // His answers are worked out from the interactions stored for him, so
    // moving the senders back moves his past answers back with them. Each
    // step reads his last answer as the server now has it, and moves everyone
    // so that now is a set time after it.
    const people = ["Mia", "Tom", "Priya", "Sam", "Kai", "Ava"];
    const lastAnswer = async () => {
      const answers = (await qa(b.Mia, path, span(summonedAt))).dony!.emotes.filter((e) => e.why === "answer");
      return answers.at(-1)!.at;
    };
    const nowAfterLastAnswer = async (ms: number) => {
      const move = ms - (Date.now() - (await lastAnswer()));
      expect(move, "the hook only moves time forward").toBeGreaterThanOrEqual(0);
      for (const n of people) await backdate(b.Mia, path, { user: ids[n] }, move);
    };
    // the hook can only move stored times into the past, so a step that comes
    // after real waiting may already be past `ms`: then it moves nothing, and
    // the check is that now is still past `ms` and not far beyond it
    const nowAtLeastAfterLastAnswer = async (ms: number) => {
      const elapsed = Date.now() - (await lastAnswer());
      if (elapsed < ms) await nowAfterLastAnswer(ms);
      else expect(elapsed, "still close to the 10 s edge").toBeLessThan(ms + 3_000);
    };

    // 9 s after his answer: Kai cheers too. 2.5 s on, none of the four
    // (the three at once, and Kai's) has an answer
    await nowAfterLastAnswer(9_000);
    expect((await interact(b.Kai, path, dony, "cheer")).status).toBe(200);
    await wait(2500);
    expect(donyEmotes(ava), "no answer within 10 s of his last").toHaveLength(1);

    // past 10 s after it (about 11.5 s, after the wait above; Kai's cheer,
    // 2.5 s ago and unanswered, doesn't count): Priya pokes, answered
    await nowAtLeastAfterLastAnswer(10_100);
    expect((await interact(b.Priya, path, dony, "poke")).status).toBe(200);
    const poke = await ava.next("interaction", (e) => e.to.name === "Dony" && e.from.name === "Priya");
    const second = await ava.next("emote", (e) => e.from.name === "Dony", 2500);
    expect(second.emoji).toBe("eyes");
    expect(second.arrivedAt - poke.arrivedAt).toBeGreaterThanOrEqual(500);

    // and again: Ava slaps (he is slappable throughout, as the visit was picked)
    await nowAfterLastAnswer(10_100);
    expect((await interact(b.Ava, path, dony, "slap")).status).toBe(200);
    const third = await ava.next("emote", (e) => e.from.name === "Dony", 2500);
    expect(ANSWERS.slap).toContain(third.emoji);

    // his schedule and his own emoji are as they were planned: the answers
    // changed nothing
    const after = (await qa(b.Mia, path, span(summonedAt))).dony!;
    expect(after.segments).toEqual(visit.segments);
    expect(own(after)).toEqual(own(visit));
    expect(after.emotes.filter((e) => e.why === "answer")).toHaveLength(3);
    const all = donyEmotes(ava).filter((e) => e.arrivedAt >= start);
    expect(all.map((e) => e.emoji)).toEqual([first.emoji, second.emoji, third.emoji]);
    for (let i = 1; i < all.length; i++) expect(all[i].at - all[i - 1].at).toBeGreaterThanOrEqual(S);
  }, 30_000);

  // BOT-6.9: an answer that would fall within a second of one of his own:
  // only one of them shows. About 7 s.
  it.concurrent("never sends an answer and one of his own within a second of each other", async (ctx) => {
    const { path, b, watch } = await gym(ctx, ["Mia", "Tom"]);
    const tom = await watch("Tom");
    const { visit, dony, at } = await summonFitting(b.Mia, path, (v, now) => {
      const due = ownBetween(v, now + 3 * S, now + 5 * S);
      return due.length === 1 && ownBetween(v, now - 2 * S, now + 20 * S).length === 1;
    });
    const [due] = ownBetween(visit, at + 3 * S, at + 5 * S);
    // cheer him a second before his own is due: his answer would land on it
    expect(due.at - Date.now(), "time left to cheer him before his own").toBeGreaterThan(1200);
    await wait(due.at - 1000 - Date.now());
    expect((await interact(b.Mia, path, dony, "cheer")).status).toBe(200);
    await wait(due.at + 3000 - Date.now());
    const near = donyEmotes(tom).filter((e) => Math.abs(e.at - due.at) < 2500);
    expect(near, "one of the two, not both").toHaveLength(1);
  }, 30_000);
});
