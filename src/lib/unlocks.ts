import { and, asc, eq, inArray, isNotNull, isNull, ne } from "drizzle-orm";
import { db } from "./db.ts";
import { exerciseById } from "./exercises.ts";
import { isWorking, midnight, monday } from "./logbook.ts";
import { log } from "./log.ts";
import { SLACK_GRACE_S } from "./presence.ts";
import { interactions, messages, personalBests, sets, userUnlocks, users, workouts } from "./schema.ts";
import { ACCESSORIES, accessoryById, NOTHING, SLOTS, type AccId, type Wear } from "../sprites/accessories.ts";
import { announce, tell } from "./realtime.ts";
import { saveWear, wearOf } from "./avatars.ts";

// AV-5: which accessories a person has earned, worked out from what is
// stored (no timer, no counter kept in memory), and recorded the first time
// each is true, for good (AV-5.16). docs/product/criteria/accessories.md.

// The goals (D1, D16), and the counts that only go up (AV-4.3, D8).
const GOALS: Partial<Record<AccId, number>> = {
  "hype-band": 5,
  "star-shades": 3,
  "mirror-shades": 3,
  bandana: 3,
  nightcap: 60,
  "silver-medal": 10,
  "gold-medal": 30,
  "gold-chain": 5,
};
export const LONG_HAUL: readonly AccId[] = ["silver-medal", "gold-medal", "gold-chain", "crown"];
export const isLongHaul = (id: string): boolean => (LONG_HAUL as readonly string[]).includes(id);
export const STREAK_WEEKS = 4;

// Sydney calendar days (the server runs in TZ=Australia/Sydney, LB-6)
const day = (ms: number): number => midnight(ms);

type Facts = Record<AccId, number | boolean>;

// Everything the conditions need, read in one go. A working set is Normal
// or Failure, or from before set types (LB-4.8).
function facts(userId: number): { met: Set<AccId>; progress: Partial<Record<AccId, number>> } {
  const mine = db
    .select({
      id: sets.id,
      workoutId: sets.workoutId,
      roomId: workouts.roomId,
      exerciseId: sets.exerciseId,
      setType: sets.setType,
      completedAt: sets.completedAt,
      restTargetS: sets.restTargetS,
      restEndedAt: sets.restEndedAt,
      endedAt: workouts.endedAt,
    })
    .from(sets)
    .innerJoin(workouts, eq(workouts.id, sets.workoutId))
    .where(eq(workouts.userId, userId))
    .orderBy(asc(sets.completedAt), asc(sets.id))
    .all();
  const working = mine.filter(isWorking);

  // AV-5.2: a finished workout holding a working set
  const finished = new Set(working.filter((s) => s.endedAt !== null).map((s) => s.workoutId));
  // AV-5.3: a set of theirs that was a PB
  const pb = db.select({ id: personalBests.setId }).from(personalBests).where(eq(personalBests.userId, userId)).get();
  // AV-5.4: accepted Cheers sent, Dony included (D5); replies are other kinds
  const cheers = db
    .select({ id: interactions.id })
    .from(interactions)
    .where(and(eq(interactions.fromUserId, userId), eq(interactions.kind, "cheer")))
    .all().length;
  // AV-5.7: accepted hype presets sent
  const hype = db
    .select({ key: messages.presetKey })
    .from(messages)
    .where(eq(messages.senderId, userId))
    .all()
    .filter((m) => m.key.startsWith("hype-")).length;
  // AV-5.5: a High-five that happened, offered or accepted (Dony accepting
  // one counts for the offerer)
  const fiveDone = fiveHappened(userId);

  // AV-5.6 and AV-5.8: each rest, from a set to when it ended (a skip or a
  // Start set stores restEndedAt; else the next set in that workout; else
  // the workout's end). Slacking is the time past target + 30 s; on time is
  // ending before that point. Only a rest that has ended counts (AV-5.6).
  let slackMs = 0;
  let onTime = 0;
  // each set's next set in its workout, in one pass from the end
  const nextAt = new Map<number, number>();
  const following = new Map<number, number>();
  for (let i = mine.length - 1; i >= 0; i--) {
    const s = mine[i];
    if (following.has(s.workoutId)) nextAt.set(s.id, following.get(s.workoutId)!);
    following.set(s.workoutId, s.completedAt);
  }
  mine.forEach((s) => {
    const ended = s.restEndedAt ?? nextAt.get(s.id) ?? s.endedAt;
    if (ended === null || ended === undefined || s.restTargetS <= 0) return;
    const slackAt = s.completedAt + (s.restTargetS + SLACK_GRACE_S) * 1000;
    slackMs += Math.max(0, ended - slackAt);
    if (isWorking(s) && ended < slackAt) onTime++;
  });

  // AV-5.9: different machines with a working set
  const machines = new Set(working.map((s) => exerciseById(s.exerciseId)?.equipment).filter(Boolean)).size;

  // AV-5.11: days with a working set
  const days = new Set(working.map((s) => day(s.completedAt)));

  // AV-5.10, AV-5.12: days on which someone else (never Dony, who has no
  // sets) logged a working set in the same room on the same day
  const together = togetherDays(userId, working);

  // AV-5.14: the streak as history counts it (LB-6.3: any workout with a
  // set, warm-ups included), at its best at any time
  const weeks = [...new Set(mine.map((s) => monday(s.completedAt)))].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  weeks.forEach((w, i) => {
    // the Monday after the previous one (8 days on, then back to Monday, so a
    // daylight-saving change can't throw it)
    run = i > 0 && monday(weeks[i - 1] + 8 * 86_400_000) === w ? run + 1 : 1;
    best = Math.max(best, run);
  });

  const f: Facts = {
    cap: true, beanie: true, "pink-beanie": true, "bucket-hat": true, headphones: true, glasses: true, towel: true,
    sweatband: working.length > 0,
    shades: !!pb,
    "bronze-medal": finished.size > 0,
    "hype-band": cheers,
    "star-shades": hype,
    "heart-shades": fiveDone,
    "mirror-shades": onTime,
    bandana: machines,
    "squad-cap": together > 0,
    nightcap: Math.floor(slackMs / 1000),
    "silver-medal": days.size,
    "gold-medal": days.size,
    "gold-chain": together,
    crown: best >= STREAK_WEEKS,
  };
  const met = new Set<AccId>();
  const progress: Partial<Record<AccId, number>> = {};
  for (const a of ACCESSORIES) {
    const v = f[a.id];
    const goal = GOALS[a.id];
    if (typeof v === "number" && goal !== undefined) {
      progress[a.id] = Math.min(v, goal);
      if (v >= goal) met.add(a.id);
    } else if (v) met.add(a.id);
  }
  return { met, progress };
}

// A High-five that happened, offered or accepted. Dony's acceptance is
// decided and stored with the offer, a second ahead (BOT-7.3), so it counts
// from the offer.
function fiveHappened(userId: number): boolean {
  const done = and(eq(interactions.kind, "highfive"), isNotNull(interactions.doneAt));
  return (
    !!db.select({ id: interactions.id }).from(interactions).where(and(done, eq(interactions.fromUserId, userId))).get() ||
    !!db.select({ id: interactions.id }).from(interactions).where(and(done, eq(interactions.toUserId, userId))).get()
  );
}

function togetherDays(userId: number, working: { roomId: number | null; completedAt: number }[]): number {
  const mineByRoom = new Map<number, Set<number>>();
  for (const s of working) {
    if (s.roomId === null) continue;
    if (!mineByRoom.has(s.roomId)) mineByRoom.set(s.roomId, new Set());
    mineByRoom.get(s.roomId)!.add(day(s.completedAt));
  }
  if (mineByRoom.size === 0) return 0;
  const others = db
    .select({ roomId: workouts.roomId, completedAt: sets.completedAt, setType: sets.setType })
    .from(sets)
    .innerJoin(workouts, eq(workouts.id, sets.workoutId))
    .where(and(inArray(workouts.roomId, [...mineByRoom.keys()]), ne(workouts.userId, userId)))
    .all()
    .filter(isWorking);
  const shared = new Set<number>();
  for (const o of others) if (mineByRoom.get(o.roomId!)?.has(day(o.completedAt))) shared.add(day(o.completedAt));
  return shared.size;
}

export type Unlocked = { acc: AccId; earnedAt: number; workoutId: number | null; quiet: boolean };

export function unlocksOf(userId: number): Map<AccId, Unlocked> {
  const rows = db.select().from(userUnlocks).where(eq(userUnlocks.userId, userId)).all();
  return new Map(rows.map((r) => [r.acc as AccId, { acc: r.acc as AccId, earnedAt: r.earnedAt, workoutId: r.workoutId, quiet: r.quiet }]));
}

// The person's open workout, else none: what a new unlock is listed under
function openWorkoutOf(userId: number, roomId: number | null): number | null {
  return (
    db
      .select({ id: workouts.id })
      .from(workouts)
      .where(and(eq(workouts.userId, userId), isNull(workouts.endedAt), roomId === null ? undefined : eq(workouts.roomId, roomId)))
      .orderBy(asc(workouts.startedAt))
      .get()?.id ?? null
  );
}

// AV-5.15: work out and record. Returns what was newly unlocked and is to be
// told (not quiet, not a starter), in AV-6.4's order: long-haul first, then
// the table's. A first check of an account from before accessories records
// everything quietly (AV-5.17). `workoutId` is the workout an unlock belongs
// to (AV-6.6); by default the person's open one.
export function checkUnlocks(userId: number, workoutId?: number | null, roomId: number | null = null, now = Date.now()): AccId[] {
  return db.transaction(
    (tx) => {
      const u = tx.select({ checked: users.unlocksCheckedAt }).from(users).where(eq(users.id, userId)).get();
      if (!u) return [];
      const quiet = u.checked === null;
      const have = new Set(
        tx
          .select({ acc: userUnlocks.acc })
          .from(userUnlocks)
          .where(eq(userUnlocks.userId, userId))
          .all()
          .map((r) => r.acc),
      );
      const { met } = facts(userId);
      const fresh = ACCESSORIES.filter((a) => a.kind !== "starter" && met.has(a.id) && !have.has(a.id)).map((a) => a.id);
      const into = workoutId === undefined ? openWorkoutOf(userId, roomId) : workoutId;
      for (const acc of fresh) {
        tx.insert(userUnlocks).values({ userId, acc, earnedAt: now, workoutId: quiet ? null : into, roomId: quiet ? null : roomId, quiet }).onConflictDoNothing().run();
      }
      if (quiet) tx.update(users).set({ unlocksCheckedAt: now }).where(eq(users.id, userId)).run();
      // summary spec, Not decided 1: one recorded with no workout open goes on
      // the next workout they finish
      if (workoutId) {
        tx.update(userUnlocks)
          .set({ workoutId })
          .where(and(eq(userUnlocks.userId, userId), isNull(userUnlocks.workoutId), eq(userUnlocks.quiet, false)))
          .run();
      }
      for (const acc of fresh) log("acc.unlock", { uid: userId, acc, told: quiet || acc === "nightcap" ? "quiet" : "told" });
      if (quiet) return [];
      return order(fresh);
    },
    { behavior: "immediate" },
  );
}

export const order = (ids: AccId[]): AccId[] => [...ids.filter(isLongHaul), ...ids.filter((a) => !isLongHaul(a))];

// The editor's view of every accessory (AV-4.2 to 4.4)
export type AccState =
  | { state: "starter" }
  | { state: "earned"; earnedAt: number }
  | { state: "locked"; progress?: { n: number; goal: number } };
export function accessoryStates(userId: number): Map<AccId, AccState> {
  checkUnlocks(userId, null);
  const have = unlocksOf(userId);
  const { progress } = facts(userId);
  const out = new Map<AccId, AccState>();
  for (const a of ACCESSORIES) {
    if (a.kind === "starter") out.set(a.id, { state: "starter" });
    else if (have.has(a.id)) out.set(a.id, { state: "earned", earnedAt: have.get(a.id)!.earnedAt });
    else {
      const goal = GOALS[a.id];
      // D8: the crown shows no count; neither do the one-step ones
      out.set(a.id, goal !== undefined && a.id !== "crown" ? { state: "locked", progress: { n: progress[a.id] ?? 0, goal } } : { state: "locked" });
    }
  }
  return out;
}

export const canWear = (userId: number, id: string): boolean => {
  const a = accessoryById(id);
  if (!a) return false;
  return a.kind === "starter" || unlocksOf(userId).has(a.id);
};

// AV-4.8: a posted wear, all three slots. Each field is "none", an id of that
// slot the person may wear, or missing (none); anything else refuses it all.
export function readWear(userId: number, form: FormData): { wear: Wear } | { reason: "unknown" | "slot" | "locked" | "duplicate" } {
  const wear: Wear = { ...NOTHING };
  for (const slot of SLOTS) {
    const values = form.getAll(slot).map(String);
    if (values.length > 1) return { reason: "duplicate" };
    const v = values[0];
    if (v === undefined || v === "none") continue;
    const a = accessoryById(v);
    if (!a) return { reason: "unknown" };
    if (a.slot !== slot) return { reason: "slot" };
    if (!canWear(userId, a.id)) return { reason: "locked" };
    wear[slot] = a.id;
  }
  return { wear };
}

// A workout's unlocks, in the order earned (AV-6.6), never the quiet ones
export function unlockedIn(workoutId: number): Unlocked[] {
  // ties (one step, two unlocks) in AV-6.4's order: long-haul, then the table
  const rank = (id: string) => (isLongHaul(id) ? 0 : 100) + ACCESSORIES.findIndex((a) => a.id === id);
  return db
    .select()
    .from(userUnlocks)
    .where(and(eq(userUnlocks.workoutId, workoutId), eq(userUnlocks.quiet, false)))
    .orderBy(asc(userUnlocks.earnedAt))
    .all()
    .map((r) => ({ acc: r.acc as AccId, earnedAt: r.earnedAt, workoutId: r.workoutId, quiet: r.quiet }))
    .sort((a, b) => a.earnedAt - b.earnedAt || rank(a.acc) - rank(b.acc));
}

// ---------------------------------------------------------------------------
// Telling (AV-6). After an action that could earn something: work out the
// unlocks of the person who acted and, for a Done, of anyone it may have
// completed a day together with (AV-5.13), tell each earner on their own
// streams, and tell the room of long-haul ones. A long-haul unlock on a PB
// Done rides on the PB's own event instead (AV-6.8): `onPb` gets those ids.
// ---------------------------------------------------------------------------
type Person = { id: number; name: string };
export function earned(
  me: Person,
  roomId: number | null,
  opts: { together?: boolean; onPb?: OnPb; workoutId?: number | null } = {},
): AccId[] {
  const mine = checkUnlocks(me.id, opts.workoutId, roomId);
  tellUnlocks(me, roomId, mine, opts.onPb);
  if (opts.together && roomId !== null) {
    for (const other of othersTrainingToday(me.id, roomId)) tellUnlocks(other, roomId, checkUnlocks(other.id, undefined, roomId));
  }
  return mine;
}

// onPb gets the long-haul ids and the earner's own telling, to send after
// the PB's event
type OnPb = (longHaul: AccId[], tellEarner: () => void) => void;
function tellUnlocks(who: Person, roomId: number | null, accs: AccId[], onPb?: OnPb): void {
  const told = accs.filter((a) => a !== "nightcap");
  if (!told.length) return;
  const at = Date.now();
  const big = told.filter(isLongHaul);
  // on a PB Done the PB's event carries the long-haul ones (AV-6.8), and the
  // earner hears of the unlock after it, so their log puts it on top (X.5)
  if (big.length && roomId !== null && onPb) {
    onPb(big, () => tell(who.id, "unlock", { accs: told, at }));
    return;
  }
  tell(who.id, "unlock", { accs: told, at });
  if (!big.length || roomId === null) return;
  for (const acc of big) announce(roomId, "trophy", { from: who, acc, at });
}

// Members of the room (never Dony) with a working set here today, besides me
function othersTrainingToday(userId: number, roomId: number): Person[] {
  const today = day(Date.now());
  const rows = db
    .select({ id: users.id, name: users.displayName, completedAt: sets.completedAt, setType: sets.setType })
    .from(sets)
    .innerJoin(workouts, eq(workouts.id, sets.workoutId))
    .innerJoin(users, eq(users.id, workouts.userId))
    .where(and(eq(workouts.roomId, roomId), ne(workouts.userId, userId)))
    .all()
    .filter((r) => isWorking(r) && day(r.completedAt) === today);
  const seen = new Map<number, Person>();
  for (const r of rows) seen.set(r.id, { id: r.id, name: r.name });
  return [...seen.values()];
}

// Wear it (AV-6.2): one accessory into its slot, replacing what's there.
// The nightcap has no Wear it (AV-6.15); anything not unlocked is refused.
export function wearOne(userId: number, id: string): { ok: true; wear: Wear } | { ok: false; reason: "invalid" | "locked" } {
  const a = accessoryById(id);
  if (!a || a.id === "nightcap") return { ok: false, reason: "invalid" };
  if (!canWear(userId, a.id)) return { ok: false, reason: "locked" };
  const wear = { ...wearOf(userId), [a.slot]: a.id };
  saveWear(userId, wear);
  return { ok: true, wear };
}
