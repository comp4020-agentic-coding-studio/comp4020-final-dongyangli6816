import { and, eq, isNull, lt } from "drizzle-orm";
import { db } from "./db.ts";
import { newPasscode } from "./passcode.ts";
import { clearPresence } from "./presence.ts";
import { broadcast } from "./realtime.ts";
import { roomMembers, rooms, workouts } from "./schema.ts";
import { finishWorkout } from "./workouts.ts";

export const ROOM_IDLE_MS = 4 * 3_600_000; // ROOM-6

// ROOM-1: any signed-in user can create a room and becomes its host. The
// partial unique index on open passcodes is the real guard; a collision just
// draws another code.
export function createRoom(hostUserId: number): { id: number; passcode: string } {
  const now = Date.now();
  for (;;) {
    try {
      return db.transaction((tx) => {
        const room = tx
          .insert(rooms)
          .values({ passcode: newPasscode(), hostUserId, createdAt: now, lastActiveAt: now })
          .returning({ id: rooms.id, passcode: rooms.passcode })
          .get();
        tx.insert(roomMembers).values({ roomId: room.id, userId: hostUserId, joinedAt: now, lastSeenAt: now }).run();
        return room;
      });
    } catch (err) {
      if (!(err instanceof Error && /UNIQUE constraint failed: rooms\.passcode/.test(err.message))) throw err;
    }
  }
}

// ROOM-2: joins the open room with this passcode, or returns null. Rejoining
// a room you left brings you back rather than adding a second membership.
export function joinRoom(userId: number, passcode: string): number | null {
  sweepIdleRooms();
  const room = db
    .select({ id: rooms.id })
    .from(rooms)
    .where(and(eq(rooms.passcode, passcode), isNull(rooms.closedAt)))
    .get();
  if (!room) return null;
  const now = Date.now();
  db.insert(roomMembers)
    .values({ roomId: room.id, userId, joinedAt: now, lastSeenAt: now })
    .onConflictDoUpdate({ target: [roomMembers.roomId, roomMembers.userId], set: { leftAt: null, lastSeenAt: now } })
    .run();
  db.update(rooms).set({ lastActiveAt: now }).where(eq(rooms.id, room.id)).run();
  broadcast(room.id);
  return room.id;
}

export function isMember(roomId: number, userId: number): boolean {
  return !!db
    .select({ userId: roomMembers.userId })
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId), isNull(roomMembers.leftAt)))
    .get();
}

// ROOM-5: leaving finishes the person's workout there and keeps every set.
// The last one out closes the room (ROOM-6), which frees its passcode.
// Returns the finished workout, if it had any sets.
export function leaveRoom(userId: number, roomId: number): number | undefined {
  const workoutId = db.transaction(() => {
    const workoutId = finishWorkout(userId, roomId);
    clearPresence(roomId, userId);
    db.update(roomMembers)
      .set({ leftAt: Date.now() })
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
      .run();
    const anyoneLeft = db
      .select({ userId: roomMembers.userId })
      .from(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), isNull(roomMembers.leftAt)))
      .get();
    if (!anyoneLeft) closeRoom(roomId);
    return workoutId;
  });
  broadcast(roomId);
  return workoutId;
}

// The host can end the room for everyone. Returns undefined, and does
// nothing, for anyone else; otherwise the host's finished workout, if any.
export function endRoom(userId: number, roomId: number): { workoutId: number | undefined } | undefined {
  const ended = db.transaction(() => {
    const room = db.select({ hostUserId: rooms.hostUserId }).from(rooms).where(eq(rooms.id, roomId)).get();
    if (room?.hostUserId !== userId) return undefined;
    const workoutId = finishWorkout(userId, roomId);
    closeRoom(roomId);
    return { workoutId };
  });
  // everyone still watching is told the room closed, and goes home
  if (ended) broadcast(roomId);
  return ended;
}

// Closing marks everyone still in as left and finishes their workouts there,
// so nobody's sets are lost and nobody is left in a room that isn't open.
function closeRoom(roomId: number): void {
  const now = Date.now();
  db.transaction(() => {
    const open = db
      .select({ userId: workouts.userId })
      .from(workouts)
      .where(and(eq(workouts.roomId, roomId), isNull(workouts.endedAt)))
      .all();
    for (const w of open) finishWorkout(w.userId, roomId);
    db.update(roomMembers)
      .set({ leftAt: now })
      .where(and(eq(roomMembers.roomId, roomId), isNull(roomMembers.leftAt)))
      .run();
    clearPresence(roomId);
    db.update(rooms).set({ closedAt: now }).where(and(eq(rooms.id, roomId), isNull(rooms.closedAt))).run();
  });
}

// ROOM-6: a room nobody has been active in for four hours closes. Checked on
// the requests that would show or join a room, at most once a minute; the
// throttle is the only thing kept in memory, and the decision itself comes
// from the stored last_active_at, so a restart changes nothing.
let lastSweep = 0;
export function sweepIdleRooms(now = Date.now()): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  const idle = db
    .select({ id: rooms.id })
    .from(rooms)
    .where(and(isNull(rooms.closedAt), lt(rooms.lastActiveAt, now - ROOM_IDLE_MS)))
    .all();
  for (const r of idle) {
    closeRoom(r.id);
    broadcast(r.id);
  }
}

// A member's visit or action counts as activity in the room.
export function touchRoom(roomId: number, userId: number): void {
  const now = Date.now();
  db.update(rooms).set({ lastActiveAt: now }).where(eq(rooms.id, roomId)).run();
  db.update(roomMembers)
    .set({ lastSeenAt: now })
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
    .run();
}

// Whether this person was ever in the room, left or not: someone the room was
// closed on is told so, rather than shown a 404.
export function wasMember(roomId: number, userId: number): boolean {
  return !!db
    .select({ userId: roomMembers.userId })
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
    .get();
}
