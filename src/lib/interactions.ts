// Interactions, presets and emoji (docs/product/criteria/int.md). Cheer,
// Poke and Slap (INT-1 to INT-4) and presets (INT-5) are stored, so their
// limits, the room log and Dony's answers are all read from the database and
// survive a restart. Emoji (INT-8) are not stored at all (D7): only their
// 1 s limit is kept, in memory, which a restart forgets (it only ever helps
// the person sending).
//
// Who may do what is decided here, on the server (ADR 0006); the page only
// shows it.
import { and, desc, eq, gt, inArray, isNull, max } from "drizzle-orm";
import { db } from "./db.ts";
import { DONY_ID } from "./dony.ts";
import type { MemberView, RoomView, State } from "./presence.ts";
import {
  EMOTE_MS,
  INTERACT_MS,
  LOG_SIZE,
  PRESET_MS,
  PRESETS,
  slapRefusal,
  type EmojiKey,
  type Kind,
  type LogEntry,
  type Person,
  type PresetKey,
  type Refusal,
} from "./moves.ts";
import { interactions, messages, roomMembers, users } from "./schema.ts";
import { stateAt } from "./squad.ts";

type Target = Person & { state: State };

// The target as the room shows them now: a member, or Dony while he's out.
// Anyone else is "gone", whether they left, are elsewhere or never existed
// (INT-2.9), so the answer says nothing about them beyond this room.
function targetIn(view: RoomView, to: number, now: number): Target | undefined {
  const m: MemberView | undefined = view.members.find((m) => m.id === to) ?? (view.dony.member?.id === to ? view.dony.member : undefined);
  return m && { id: m.id, name: m.name, state: stateAt(m, now) };
}

// The room log (INT-5.8) orders interactions and presets by when they were
// stored, but they live in two tables, so two stored in the same millisecond
// had no order between them. Each is stamped at least 1 ms after the room's
// latest, in the same IMMEDIATE transaction, so the log's order is the order
// they were accepted.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
function stampAfter(tx: Tx, roomId: number, now: number): number {
  const hit = tx.select({ at: max(interactions.createdAt) }).from(interactions).where(eq(interactions.roomId, roomId)).get()?.at;
  const said = tx.select({ at: max(messages.createdAt) }).from(messages).where(eq(messages.roomId, roomId)).get()?.at;
  return Math.max(now, (hit ?? -Infinity) + 1, (said ?? -Infinity) + 1);
}

// ---------- interactions ----------

export type InteractionEvent = { kind: Kind; from: Person; to: Person; targetState: State; at: number };

// INT-2, INT-4: checks and stores one interaction in one IMMEDIATE
// transaction, so of several sent at the same moment exactly one is accepted
// (INT-4.4), and the 10 s are counted from the stored times (INT-4.6).
export function interact(
  view: RoomView,
  roomId: number,
  from: Person,
  to: number,
  kind: Kind,
  now = Date.now(),
): { ok: true; event: InteractionEvent } | { ok: false; reason: Refusal } {
  if (to === from.id) return { ok: false, reason: "self" };
  const target = targetIn(view, to, now);
  if (!target) return { ok: false, reason: "gone" };
  if (kind === "slap") {
    const no = slapRefusal(target.state);
    if (no) return { ok: false, reason: no };
  }
  return db.transaction(
    (tx) => {
      const recent = tx
        .select({ id: interactions.id })
        .from(interactions)
        .where(
          and(
            eq(interactions.roomId, roomId),
            eq(interactions.fromUserId, from.id),
            eq(interactions.toUserId, to),
            gt(interactions.createdAt, now - INTERACT_MS),
          ),
        )
        .get();
      if (recent) return { ok: false as const, reason: "rate-limit" as const };
      const at = stampAfter(tx, roomId, now);
      tx.insert(interactions)
        .values({ roomId, fromUserId: from.id, toUserId: to, kind, targetState: target.state, createdAt: at })
        .run();
      return { ok: true as const, event: { kind, from, to: { id: target.id, name: target.name }, targetState: target.state, at } };
    },
    { behavior: "immediate" },
  );
}

// INT-4.7: when the viewer's 10 s on each person they've interacted with
// runs out, for those still running, so a reload shows the menu right
export function limitsFrom(roomId: number, userId: number, now = Date.now()): Record<number, number> {
  const rows = db
    .select({ to: interactions.toUserId, at: interactions.createdAt })
    .from(interactions)
    .where(and(eq(interactions.roomId, roomId), eq(interactions.fromUserId, userId), gt(interactions.createdAt, now - INTERACT_MS)))
    .all();
  const out: Record<number, number> = {};
  for (const r of rows) out[r.to] = Math.max(out[r.to] ?? 0, r.at + INTERACT_MS);
  return out;
}

// ---------- presets ----------

export type SayEvent = { preset: PresetKey; text: string; from: Person; to: Person; at: number };

// INT-5: presets go to anyone in any state (D4), one per sender every 2 s (D6)
export function say(
  view: RoomView,
  roomId: number,
  from: Person,
  to: number,
  preset: PresetKey,
  now = Date.now(),
): { ok: true; event: SayEvent } | { ok: false; reason: Refusal } {
  if (to === from.id) return { ok: false, reason: "self" };
  const target = targetIn(view, to, now);
  if (!target) return { ok: false, reason: "gone" };
  return db.transaction(
    (tx) => {
      const recent = tx
        .select({ id: messages.id })
        .from(messages)
        .where(and(eq(messages.roomId, roomId), eq(messages.senderId, from.id), gt(messages.createdAt, now - PRESET_MS)))
        .get();
      if (recent) return { ok: false as const, reason: "rate-limit" as const };
      const at = stampAfter(tx, roomId, now);
      tx.insert(messages).values({ roomId, senderId: from.id, toUserId: to, presetKey: preset, createdAt: at }).run();
      return {
        ok: true as const,
        event: { preset, text: PRESETS[preset], from, to: { id: target.id, name: target.name }, at },
      };
    },
    { behavior: "immediate" },
  );
}

// ---------- emoji ----------

export type EmoteEvent = { emoji: EmojiKey; from: Person; at: number };

// D6: one a second per person, from any tab or device. Kept in memory, as
// emoji themselves aren't stored (D7). Checked and set in one synchronous
// step, so of two at the same moment exactly one goes.
const lastEmote = new Map<number, number>();
export function emote(from: Person, emoji: EmojiKey, now = Date.now()): { ok: true; event: EmoteEvent } | { ok: false; reason: Refusal } {
  if (now - (lastEmote.get(from.id) ?? -Infinity) < EMOTE_MS) return { ok: false, reason: "rate-limit" };
  lastEmote.set(from.id, now);
  if (lastEmote.size > 1000) for (const [id, t] of lastEmote) if (now - t >= EMOTE_MS) lastEmote.delete(id);
  return { ok: true, event: { emoji, from, at: now } };
}

// ---------- the room log ----------

// INT-5.8: the newest 50 presets and interactions in the room, newest first,
// from before you joined too (D7). Names are read now, so they stay after
// someone leaves; Dony's id is 0 and his name is his own.
export function roomLog(roomId: number, limit = LOG_SIZE): LogEntry[] {
  const hits = db
    .select({ kind: interactions.kind, from: interactions.fromUserId, to: interactions.toUserId, at: interactions.createdAt, id: interactions.id })
    .from(interactions)
    .where(eq(interactions.roomId, roomId))
    .orderBy(desc(interactions.createdAt), desc(interactions.id))
    .limit(limit)
    .all();
  const said = db
    .select({ preset: messages.presetKey, from: messages.senderId, to: messages.toUserId, at: messages.createdAt, id: messages.id })
    .from(messages)
    .where(eq(messages.roomId, roomId))
    .orderBy(desc(messages.createdAt), desc(messages.id))
    .limit(limit)
    .all();
  const ids = [...new Set([...hits, ...said].flatMap((r) => [r.from, r.to]))].filter((id) => id !== DONY_ID);
  const names = new Map<number, string>([[DONY_ID, "Dony"]]);
  if (ids.length) for (const u of db.select({ id: users.id, name: users.displayName }).from(users).where(inArray(users.id, ids)).all()) names.set(u.id, u.name);
  const person = (id: number): Person => ({ id, name: names.get(id) ?? "Someone" });
  // no two share a time in a room (stampAfter), so time alone orders them
  const rows: LogEntry[] = [
    ...hits.map((r) => ({ kind: r.kind, from: person(r.from), to: person(r.to), at: r.at }) as LogEntry),
    ...said.map((r) => ({ kind: "say", from: person(r.from), to: person(r.to), text: PRESETS[r.preset as PresetKey] ?? "", at: r.at }) as LogEntry),
  ];
  return rows.sort((a, b) => b.at - a.at).slice(0, limit);
}

// When this person last joined the room: the log's "You walked in" line (D14)
export function joinedAt(roomId: number, userId: number): number | undefined {
  return db
    .select({ at: roomMembers.joinedAt })
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId), isNull(roomMembers.leftAt)))
    .get()?.at;
}
