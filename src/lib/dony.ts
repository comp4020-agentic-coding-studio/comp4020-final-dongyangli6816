// Dony, the gym's member of the month (BOT-1 to BOT-5). Anyone in the room
// taps his poster to call him out, and taps it again to send him back. While
// he's out he trains like a person: blocks of lifts with sets and rests, now
// and then a rest that runs over into Slacking, a few minutes by the lockers
// between blocks, and then another block, for as long as he's out.
//
// Nothing about what he's doing is stored or kept in memory. It is planned
// from the room and the moment he was summoned, by a seeded random sequence,
// so every screen, a reload and a restart all put him in the same place
// (BOT-3). He holds no station row and isn't a member, so he never counts
// toward the 12, as host or as activity, and a person choosing a lift never
// finds his station taken: he stands at a free one, and moves off if someone
// claims it (BOT-5).
import { eq } from "drizzle-orm";
import { db } from "./db.ts";
import { EQUIPMENT, EXERCISES, type Equipment, type Exercise } from "./exercises.ts";
import { rooms } from "./schema.ts";
import type { Look } from "../sprites/avatar.ts";

export const DONY_ID = 0; // users' ids start at 1
export const POSTER_REST_MS = 30_000; // BOT-4
const SLACK_GRACE_MS = 30_000; // GYM-11, as presence.ts

export type Poster = { donySummonedAt: number | null; donySentBackAt: number | null };
export const isOut = (r: Poster): boolean =>
  r.donySummonedAt !== null && (r.donySentBackAt === null || r.donySummonedAt > r.donySentBackAt);
// He can be sent back at any moment; it's calling him out again that waits
// 30 s after a send back (BOT-4)
export const posterRestingUntil = (r: Poster): number => (isOut(r) ? 0 : (r.donySentBackAt ?? 0) + POSTER_REST_MS);

// BOT-1, BOT-4: a tap on the poster. It acts only if the poster is still as
// its tapper saw it (full for a summon, empty for a send back) and, for a
// summon, isn't resting; otherwise it does nothing, and the next redraw is
// the answer. The check and the write are one IMMEDIATE transaction, so two
// taps at the same moment are decided one after the other, and the second
// sees the first.
export function tapPoster(roomId: number, userId: number, intent: "summon" | "send-back", now = Date.now()): boolean {
  return db.transaction(
    (tx) => {
      const room = tx
        .select({ donySummonedAt: rooms.donySummonedAt, donySentBackAt: rooms.donySentBackAt, closedAt: rooms.closedAt })
        .from(rooms)
        .where(eq(rooms.id, roomId))
        .get();
      if (!room || room.closedAt || now < posterRestingUntil(room)) return false;
      if (intent === "summon" && !isOut(room)) {
        tx.update(rooms).set({ donySummonedAt: now, donySummonedBy: userId }).where(eq(rooms.id, roomId)).run();
        return true;
      }
      if (intent === "send-back" && isOut(room)) {
        tx.update(rooms).set({ donySentBackAt: now }).where(eq(rooms.id, roomId)).run();
        return true;
      }
      return false;
    },
    { behavior: "immediate" },
  );
}

// ---------- his schedule ----------

// A small seeded generator (mulberry32), so the same room and summon always
// plan the same visit.
function random(...seed: number[]): () => number {
  let h = 2166136261;
  for (const n of seed) h = Math.imul(h ^ (n | 0), 16777619) ^ Math.floor(n / 2 ** 32);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const between = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

type Segment =
  | { kind: "idle"; start: number; end: number }
  | { kind: "lift"; start: number; end: number; exercise: Exercise; n: number }
  // a rest's target is restEnd; the segment ends when he starts his next set,
  // past restEnd + 30 s when it ran over into Slacking
  | { kind: "rest"; start: number; end: number; exercise: Exercise; n: number; restEnd: number };

const S = 1000;
const MIN = 60 * S;

// One block: 4 to 6 lifts, 3 to 5 sets each (a run is one long set), rests
// near each lift's usual rest, and about one rest in eight running over into
// Slacking, at most twice (BOT-3). Then 3 to 6 minutes by the lockers.
function block(roomId: number, summonedAt: number, k: number, start: number): Segment[] {
  const r = random(roomId, summonedAt, k);
  const pool = [...EXERCISES].sort(() => r() - 0.5);
  const cardio = pool.filter((e) => e.kind === "cardio").slice(0, r() < 0.4 ? 1 : 0);
  const rest = pool.filter((e) => e.kind !== "cardio").slice(0, between(r, 4, 6) - cardio.length);
  // a run, if there is one, comes first, as a warm-up
  const lifts = [...cardio, ...rest];

  const out: Segment[] = [];
  let t = start;
  // the first block starts with him warming up for a moment
  if (k === 0) out.push({ kind: "idle", start: t, end: (t += 3 * S) });
  let slacks = 0;
  let n = 0;
  for (const [i, exercise] of lifts.entries()) {
    const sets = exercise.kind === "cardio" ? 1 : between(r, 3, 5);
    for (let set = 0; set < sets; set++, n++) {
      const liftS =
        exercise.kind === "cardio"
          ? between(r, 8, 20) * 60
          : exercise.kind === "duration"
            ? between(r, 40, 75)
            : exercise.kind === "bodyweight"
              ? between(r, 25, 45)
              : between(r, 30, 55);
      out.push({ kind: "lift", start: t, end: (t += liftS * S), exercise, n });
      const lastOfBlock = i === lifts.length - 1 && set === sets - 1;
      if (lastOfBlock) break;
      // after a run, a short breather before the next lift
      const targetS = exercise.kind === "cardio" ? between(r, 30, 60) : Math.round((exercise.defaultRestS * (0.8 + r() * 0.45)) / 5) * 5;
      const restEnd = t + targetS * S;
      const slack = exercise.kind !== "cardio" && slacks < 2 && r() < 1 / 8;
      if (slack) slacks++;
      // on time give or take, never long enough to turn Slacking; or well over
      const actual = slack ? targetS * S + SLACK_GRACE_MS + between(r, 45, 240) * S : targetS * S + between(r, -10, 20) * S;
      out.push({ kind: "rest", start: t, end: (t += actual), exercise, n, restEnd });
    }
  }
  out.push({ kind: "idle", start: t, end: (t += between(r, 3, 6) * MIN) });
  return out;
}

// The segment he's in at `now`, and when it ends. Blocks follow one another
// for as long as he's out; a visit of several hours is a few dozen segments.
function segmentAt(roomId: number, summonedAt: number, now: number): Segment {
  let start = summonedAt;
  for (let k = 0; ; k++) {
    const segments = block(roomId, summonedAt, k, start);
    const hit = segments.find((s) => now < s.end);
    if (hit) return hit;
    start = segments.at(-1)!.end;
  }
}

// ---------- in the room's view ----------

// What the room's view says about him: whether he's out, when the poster can
// be tapped again, and, while he's out, him, shaped like a member.
export type DonyView = {
  out: boolean;
  restingUntil: number;
  // nobody has called him out in this room yet: the poster's bulbs are lit
  fresh: boolean;
  member: DonyMember | null;
  // when what he's doing next changes, so the server can tell every screen
  next: number | null;
};
export type DonyMember = {
  id: number;
  name: string;
  look: Look;
  host: false;
  state: "idle" | "lifting" | "resting" | "slacking";
  away: false;
  exercise: string | null;
  station: { slot: number; equipment: string } | null;
  restEnd: number | null;
  slackAt: number | null;
  seenAt: number;
  done: null;
  dony: true;
};
// a stand-in for the type: his sprite and colours are his own (src/sprites/dony.ts)
const LOOK: Look = { skin: "2", hair: "crop", hairColour: "black", shirt: "purple" };

type Floor = { slot: number; equipment: Equipment | null; userId: number | null }[];

export function donyView(roomId: number, poster: Poster, floor: Floor, now: number): DonyView {
  const restingUntil = posterRestingUntil(poster);
  const fresh = poster.donySummonedAt === null;
  if (!isOut(poster)) return { out: false, restingUntil, fresh, member: null, next: null };
  const summonedAt = poster.donySummonedAt!;
  const seg = segmentAt(roomId, summonedAt, now);
  const base = { id: DONY_ID, name: "Dony", look: LOOK, host: false, away: false, seenAt: now, done: null, dony: true } as const;
  if (seg.kind === "idle") {
    return { out: true, restingUntil, fresh, next: seg.end, member: { ...base, state: "idle", exercise: null, station: null, restEnd: null, slackAt: null } };
  }

  // A free station with this lift's equipment: the last one, since people take
  // the first. With none free, another lift on equipment that is free, as
  // someone would when the bench is taken. With nothing free, he waits.
  const free = floor.filter((s) => s.userId === null && s.equipment);
  let exercise: Exercise = seg.exercise;
  let station = free.filter((s) => s.equipment === exercise.equipment).at(-1);
  if (!station && free.length) {
    const r = random(roomId, summonedAt, seg.n, 1);
    station = free[Math.floor(r() * free.length)];
    const options = EXERCISES.filter((e) => e.equipment === station!.equipment);
    exercise = options[Math.floor(r() * options.length)];
  }
  if (!station) {
    return { out: true, restingUntil, fresh, next: seg.end, member: { ...base, state: "idle", exercise: null, station: null, restEnd: null, slackAt: null } };
  }
  const held = { slot: station.slot, equipment: EQUIPMENT[station.equipment!] };
  if (seg.kind === "lift") {
    return { out: true, restingUntil, fresh, next: seg.end, member: { ...base, state: "lifting", exercise: exercise.name, station: held, restEnd: null, slackAt: null } };
  }
  const slackAt = seg.restEnd + SLACK_GRACE_MS;
  return {
    out: true,
    restingUntil,
    fresh,
    next: now < slackAt && slackAt < seg.end ? slackAt : seg.end,
    member: { ...base, state: now >= slackAt ? "slacking" : "resting", exercise: exercise.name, station: held, restEnd: seg.restEnd, slackAt },
  };
}
