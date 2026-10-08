import { and, count, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "./db.ts";
import { EQUIPMENT, exerciseById, type Equipment } from "./exercises.ts";
import { parseLook, type Look } from "../sprites/avatar.ts";
import { lookOf } from "./avatars.ts";
import { presence, roomMembers, rooms, sets, users, workouts } from "./schema.ts";
import { claimStation, releaseStation, roomStations } from "./stations.ts";

export const SLACK_GRACE_S = 30; // GYM-11
export const AWAY_MS = 60_000; // GYM-14
// past half an hour over, a rest is no longer a rest, just a gap (as on the room page)
const GAP_MS = 30 * 60_000;

export type State = "idle" | "lifting" | "resting" | "slacking" | "finished";

export type MemberView = {
  id: number;
  name: string;
  look: Look;
  host: boolean;
  state: State;
  away: boolean;
  exercise: string | null;
  // the station they hold (GYM-3), kept while resting, slacking or Away
  station: { slot: number; equipment: string } | null;
  // when this person's rest runs out, and when they turn Slacking, if
  // they're resting: lets a screen tick and flip them over on time without
  // asking the server again
  restEnd: number | null;
  slackAt: number | null;
  seenAt: number;
  // what a finished workout came to
  done: { sets: number; startedAt: number; endedAt: number } | null;
};

export type RoomView = {
  now: number;
  closed: boolean;
  members: MemberView[];
  // GYM-8: what is on each of the twelve stations
  stations: { slot: number; equipment: Equipment | null }[];
};

// Choosing a lift (or logging a set of it) puts the person on it, on a
// station with its equipment (GYM-4).
export function setLifting(userId: number, roomId: number, exerciseId: number): void {
  const exercise = exerciseById(exerciseId);
  if (exercise) claimStation(userId, roomId, exercise.equipment);
  const row = { roomId, state: "lifting" as const, exerciseId, stateStartedAt: Date.now() };
  db.insert(presence)
    .values({ userId, ...row })
    .onConflictDoUpdate({ target: presence.userId, set: row })
    .run();
}

export function setFinished(userId: number, roomId: number): void {
  releaseStation(roomId, userId);
  const row = { roomId, state: "finished" as const, exerciseId: null, stateStartedAt: Date.now() };
  db.insert(presence)
    .values({ userId, ...row })
    .onConflictDoUpdate({ target: presence.userId, set: row })
    .run();
}

// Leaving a room, or the room closing, makes the person Idle again.
export function clearPresence(roomId: number, userId?: number): void {
  db.delete(presence)
    .where(userId === undefined ? eq(presence.roomId, roomId) : and(eq(presence.roomId, roomId), eq(presence.userId, userId)))
    .run();
}

// GYM-9, GYM-11, GYM-12, GYM-14: everyone in the room and what they're doing,
// decided from stored timestamps alone, so it's the same after a restart and
// for someone whose phone is locked.
export function roomView(roomId: number, now = Date.now()): RoomView {
  const room = db.select({ hostUserId: rooms.hostUserId, closedAt: rooms.closedAt }).from(rooms).where(eq(rooms.id, roomId)).get();
  if (!room || room.closedAt) return { now, closed: true, members: [], stations: [] };
  const floor = roomStations(roomId);

  const members = db
    .select({
      id: users.id,
      name: users.displayName,
      avatar: users.avatar,
      lastSeenAt: roomMembers.lastSeenAt,
      state: presence.state,
      exerciseId: presence.exerciseId,
    })
    .from(roomMembers)
    .innerJoin(users, eq(users.id, roomMembers.userId))
    .leftJoin(presence, and(eq(presence.userId, roomMembers.userId), eq(presence.roomId, roomId)))
    .where(and(eq(roomMembers.roomId, roomId), isNull(roomMembers.leftAt)))
    .orderBy(roomMembers.joinedAt)
    .all();

  // each person's newest set in their open workout here: the one whose rest
  // may be running
  const latest = new Map<number, { exerciseId: number; completedAt: number; restTargetS: number; restEndedAt: number | null }>();
  const recent = db
    .select({
      userId: workouts.userId,
      exerciseId: sets.exerciseId,
      completedAt: sets.completedAt,
      restTargetS: sets.restTargetS,
      restEndedAt: sets.restEndedAt,
    })
    .from(sets)
    .innerJoin(workouts, eq(workouts.id, sets.workoutId))
    .where(and(eq(workouts.roomId, roomId), isNull(workouts.endedAt)))
    .orderBy(desc(sets.completedAt), desc(sets.id))
    .all();
  for (const s of recent) if (!latest.has(s.userId)) latest.set(s.userId, s);

  return {
    now,
    closed: false,
    stations: floor.map(({ slot, equipment }) => ({ slot, equipment })),
    members: members.map((m) => {
      const set = latest.get(m.id);
      const restEnd = set ? set.completedAt + set.restTargetS * 1000 : 0;
      const resting =
        m.state !== "finished" && !!set && set.restTargetS > 0 && set.restEndedAt === null && now < restEnd + GAP_MS;
      const slackAt = resting ? restEnd + SLACK_GRACE_S * 1000 : null;
      const state: State =
        m.state === "finished"
          ? "finished"
          : slackAt !== null
            ? now >= slackAt
              ? "slacking"
              : "resting"
            : m.state === "lifting"
              ? "lifting"
              : "idle";
      const exerciseId = state === "idle" || state === "finished" ? undefined : (m.exerciseId ?? set?.exerciseId);
      const done = state === "finished" ? lastFinished(m.id, roomId) : null;
      return {
        id: m.id,
        name: m.name,
        // an account from before avatars gets one rolled and kept (avatars.ts)
        look: parseLook(m.avatar) ?? lookOf(m.id),
        host: m.id === room.hostUserId,
        state,
        away: now - m.lastSeenAt > AWAY_MS,
        exercise: (exerciseId && exerciseById(exerciseId)?.name) || null,
        station: held(floor, m.id),
        restEnd: resting ? restEnd : null,
        slackAt,
        seenAt: m.lastSeenAt,
        done,
      };
    }),
  };
}

// The person's newest finished workout in the room, for "12 sets · 48 min".
function lastFinished(userId: number, roomId: number): MemberView["done"] {
  const w = db
    .select({ id: workouts.id, startedAt: workouts.startedAt, endedAt: workouts.endedAt })
    .from(workouts)
    .where(and(eq(workouts.userId, userId), eq(workouts.roomId, roomId), isNotNull(workouts.endedAt)))
    .orderBy(desc(workouts.endedAt))
    .get();
  if (!w?.endedAt) return null;
  const n = db.select({ n: count() }).from(sets).where(eq(sets.workoutId, w.id)).get()?.n ?? 0;
  return { sets: n, startedAt: w.startedAt, endedAt: w.endedAt };
}

function held(floor: { slot: number; equipment: Equipment | null; userId: number | null }[], userId: number) {
  const s = floor.find((f) => f.userId === userId);
  return s?.equipment ? { slot: s.slot, equipment: EQUIPMENT[s.equipment] } : null;
}
