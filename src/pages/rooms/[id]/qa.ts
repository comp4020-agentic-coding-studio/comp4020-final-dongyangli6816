import type { APIRoute } from "astro";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../../../lib/db.ts";
import { donySegments, plannedEmotes } from "../../../lib/dony.ts";
import { broadcast, skipDonyEmotes } from "../../../lib/realtime.ts";
import { isMember } from "../../../lib/rooms.ts";
import { interactions, messages, presence, roomMembers, rooms, sets, workouts } from "../../../lib/schema.ts";

// The test hook (the contract at the top of spec/interactions.test.ts and
// spec/dony-emoji.test.ts). Only on an app run with SPOTTER_TEST_HOOKS=1, as
// CI runs it; anywhere else every request here is the same 404 as a room
// that doesn't exist, and nothing here runs. It never changes a rule: it
// moves stored times into the past, so the server sees that much time as
// gone by, and checks that would wait a minute take a moment.
const on = process.env.SPOTTER_TEST_HOOKS === "1";
const notFound = () => new Response("Not found", { status: 404 });

const memberOf = (params: Record<string, string | undefined>, userId: number | undefined) => {
  const roomId = Number(params.id);
  return on && userId !== undefined && Number.isInteger(roomId) && isMember(roomId, userId) ? roomId : undefined;
};

// Dony's visit as the server plays it, and the room's last activity. Reads
// only: it isn't anyone being seen, or the room being active.
export const GET: APIRoute = ({ params, locals, url }) => {
  const roomId = memberOf(params, locals.user?.id);
  if (roomId === undefined) return notFound();
  const now = Date.now();
  const num = (k: string) => (url.searchParams.has(k) ? Number(url.searchParams.get(k)) : undefined);
  const until = num("until") ?? now + 10 * 60_000;
  const room = db.select({ lastActiveAt: rooms.lastActiveAt }).from(rooms).where(eq(rooms.id, roomId)).get()!;
  const plan = plannedEmotes(roomId, until, num("summonedAt"));
  const dony = plan && { summonedAt: plan.summonedAt, segments: donySegments(roomId, plan.summonedAt, until), emotes: plan.emotes };
  return Response.json({ now, lastActiveAt: room.lastActiveAt, dony });
};

// op=backdate ms=<n> and user=<id> or room=1: as if it had all happened ms
// earlier. Then the room is re-sent to everyone, as after any change.
export const POST: APIRoute = async ({ params, locals, request }) => {
  const roomId = memberOf(params, locals.user?.id);
  if (roomId === undefined) return notFound();
  const form = await request.formData();
  const ms = Number(form.get("ms"));
  if (form.get("op") !== "backdate" || !Number.isFinite(ms) || ms < 0) return new Response("Bad request", { status: 400 });
  const back = <T>(column: T) => sql`${column} - ${Math.round(ms)}`;

  db.transaction((tx) => {
    if (form.get("room") === "1") {
      tx.update(rooms)
        .set({
          createdAt: back(rooms.createdAt),
          lastActiveAt: back(rooms.lastActiveAt),
          donySummonedAt: back(rooms.donySummonedAt),
          donySentBackAt: back(rooms.donySentBackAt),
        })
        .where(eq(rooms.id, roomId))
        .run();
      return;
    }
    const userId = Number(form.get("user"));
    if (!Number.isInteger(userId)) return;
    const member = and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId));
    tx.update(roomMembers).set({ joinedAt: back(roomMembers.joinedAt), lastSeenAt: back(roomMembers.lastSeenAt) }).where(member).run();
    tx.update(presence)
      .set({ stateStartedAt: back(presence.stateStartedAt) })
      .where(and(eq(presence.roomId, roomId), eq(presence.userId, userId)))
      .run();
    const open = tx
      .select({ id: workouts.id })
      .from(workouts)
      .where(and(eq(workouts.roomId, roomId), eq(workouts.userId, userId), isNull(workouts.endedAt)))
      .all()
      .map((w) => w.id);
    if (open.length) {
      tx.update(workouts).set({ startedAt: back(workouts.startedAt) }).where(inArray(workouts.id, open)).run();
      tx.update(sets)
        .set({ completedAt: back(sets.completedAt), restEndedAt: back(sets.restEndedAt) })
        .where(inArray(sets.workoutId, open))
        .run();
    }
    tx.update(interactions)
      .set({ createdAt: back(interactions.createdAt) })
      .where(and(eq(interactions.roomId, roomId), eq(interactions.fromUserId, userId)))
      .run();
    tx.update(messages)
      .set({ createdAt: back(messages.createdAt) })
      .where(and(eq(messages.roomId, roomId), eq(messages.senderId, userId)))
      .run();
  });
  skipDonyEmotes(roomId);
  broadcast(roomId);
  return new Response(null, { status: 204 });
};
