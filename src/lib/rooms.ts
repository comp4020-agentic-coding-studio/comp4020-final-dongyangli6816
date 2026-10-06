import { and, eq, isNull } from "drizzle-orm";
import { db } from "./db.ts";
import { newPasscode } from "./passcode.ts";
import { roomMembers, rooms } from "./schema.ts";

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
  return room.id;
}

export function isMember(roomId: number, userId: number): boolean {
  return !!db
    .select({ userId: roomMembers.userId })
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId), isNull(roomMembers.leftAt)))
    .get();
}
