import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "./db.ts";
import { OPENING_EQUIPMENT, type Equipment } from "./exercises.ts";
import { stations } from "./schema.ts";

export const SLOTS = 12; // ROOM-4: one per person a room can hold

export type Claim = { slot: number; arrived: "already" | "delivery" | "swap" };

// GYM-2: a room opens with the treadmill, flat bench, squat rack and dumbbell
// rack on slots 1 to 4 and eight empty stations. Inserting does nothing for
// a room that has its rows, so rooms opened before stations existed get them
// the first time they're looked at.
export function seedStations(roomId: number, now = Date.now()): void {
  db.insert(stations)
    .values(
      Array.from({ length: SLOTS }, (_, i) => ({
        roomId,
        slot: i + 1,
        equipment: OPENING_EQUIPMENT[i] ?? null,
        placedAt: OPENING_EQUIPMENT[i] ? now : null,
      })),
    )
    .onConflictDoNothing()
    .run();
}

// GYM-4, GYM-5 (ADR 0004): the person lets go of the station they hold, then
// takes, in this order, (1) a station with this equipment that nobody is
// using, (2) an empty station, which has it delivered, or (3) the station
// whose equipment has gone unused longest, which has it swapped. Equipment
// someone is using is never a candidate.
//
// It all happens in one IMMEDIATE transaction: SQLite takes the write lock
// before the first read, so two people choosing at the same moment are
// decided one after the other, and the second sees the first one's claim and
// falls through to the next rule. The unique index on (room, person) and the
// `user_id is null` guard on the update are there in case that ever stops
// being true. With twelve stations and at most twelve people, someone who
// has let go of their own always finds one.
export function claimStation(userId: number, roomId: number, equipment: Equipment, now = Date.now()): Claim {
  seedStations(roomId, now);
  return db.transaction(
    (tx) => {
      const held = tx
        .select({ slot: stations.slot, equipment: stations.equipment })
        .from(stations)
        .where(and(eq(stations.roomId, roomId), eq(stations.userId, userId)))
        .get();
      // already on one with this equipment: stay put
      if (held?.equipment === equipment) return { slot: held.slot, arrived: "already" as const };
      if (held) {
        tx.update(stations)
          .set({ userId: null, lastUsedAt: now })
          .where(and(eq(stations.roomId, roomId), eq(stations.slot, held.slot)))
          .run();
      }

      const free = and(eq(stations.roomId, roomId), isNull(stations.userId));
      const first = (where: ReturnType<typeof and>) =>
        tx.select({ slot: stations.slot }).from(stations).where(where).orderBy(asc(stations.slot)).get();
      const ready = first(and(free, eq(stations.equipment, equipment)));
      const empty = ready ? undefined : first(and(free, isNull(stations.equipment)));
      // unused longest: last used, or placed if nobody has used it yet
      const oldest =
        ready || empty
          ? undefined
          : tx
              .select({ slot: stations.slot })
              .from(stations)
              .where(free)
              .orderBy(sql`coalesce(${stations.lastUsedAt}, ${stations.placedAt}, 0)`, asc(stations.slot))
              .get();
      const target = ready ?? empty ?? oldest;
      if (!target) throw new Error(`no free station in room ${roomId}`); // can't happen: see above

      const arrived = ready ? "already" : empty ? "delivery" : "swap";
      const claimed = tx
        .update(stations)
        .set({ userId, lastUsedAt: now, ...(ready ? {} : { equipment, placedAt: now }) })
        .where(and(eq(stations.roomId, roomId), eq(stations.slot, target.slot), isNull(stations.userId)))
        .run();
      if (claimed.changes !== 1) throw new Error(`station ${target.slot} in room ${roomId} was taken mid-claim`);
      return { slot: target.slot, arrived };
    },
    { behavior: "immediate" },
  );
}

// Finishing or leaving lets go of the station; the equipment stays where it is.
export function releaseStation(roomId: number, userId?: number, now = Date.now()): void {
  db.update(stations)
    .set({ userId: null, lastUsedAt: now })
    .where(
      userId === undefined
        ? and(eq(stations.roomId, roomId), sql`${stations.userId} is not null`)
        : and(eq(stations.roomId, roomId), eq(stations.userId, userId)),
    )
    .run();
}

export function roomStations(roomId: number) {
  seedStations(roomId);
  return db
    .select({ slot: stations.slot, equipment: stations.equipment, userId: stations.userId })
    .from(stations)
    .where(eq(stations.roomId, roomId))
    .orderBy(stations.slot)
    .all() as { slot: number; equipment: Equipment | null; userId: number | null }[];
}
