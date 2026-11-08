// Interactions, presets and emoji (docs/product/criteria/int.md). Cheer,
// Poke and Slap (INT-1 to INT-4) and presets (INT-5) are stored, so their
// limits, the room log and Dony's answers are all read from the database and
// survive a restart. Emoji (INT-8) are not stored at all (D7): only their
// 1 s limit is kept, in memory, which a restart forgets (it only ever helps
// the person sending).
//
// Who may do what is decided here, on the server (ADR 0006); the page only
// shows it.
import { and, desc, eq, gt, inArray, isNotNull, isNull, lte, max, or } from "drizzle-orm";
import { db } from "./db.ts";
import { DONY_ANSWER_EVERY_MS, DONY_ANSWER_MS, DONY_ID, lastDonyAnswer } from "./dony.ts";
import { exerciseById } from "./exercises.ts";
import type { MemberView, RoomView, State } from "./presence.ts";
import {
  EMOTE_MS,
  INTERACT_MS,
  isKind,
  KINDS,
  LOG_SIZE,
  OFFER_MS,
  PB_MS,
  PRESET_MS,
  PRESETS,
  REPLY,
  REPLY_MS,
  slapRefusal,
  type EmojiKey,
  type Kind,
  type LogEntry,
  type Move,
  type Person,
  type PresetKey,
  type Refusal,
  type Reply,
} from "./moves.ts";
import { interactions, messages, personalBests, roomMembers, users, userUnlocks } from "./schema.ts";
import { stateAt } from "./squad.ts";

type Target = Person & { state: State };

// The target as the room shows them now: a member, or Dony while he's out.
// Anyone else is "gone", whether they left, are elsewhere or never existed
// (INT-2.9), so the answer says nothing about them beyond this room.
// Someone's state as the room shows it now; Idle for someone not in it
const stateOf = (view: RoomView, id: number, now: number): State => targetIn(view, id, now)?.state ?? "idle";

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

export type InteractionEvent = {
  id: number;
  kind: Kind | Reply;
  from: Person;
  to: Person;
  targetState: State;
  // INT-13.20: the sender's state when it was accepted, so every screen
  // agrees whether they walk over or act from their machine
  fromState: State;
  at: number;
  // a reply: the interaction it answers (INT-9)
  answers?: number;
};

// A High-five: an offer, open until `until`, or one that happened at `done`.
// `taken`: an offer to Dony that he accepts at `until` (BOT-7.2), so no
// screen tells its offerer they were left hanging.
export type HighFiveEvent = {
  id: number;
  from: Person;
  to: Person;
  at: number;
  until?: number;
  done?: number;
  taken?: boolean;
  // INT-16, BOT-8.5: on a done one, both people's states at that moment, so
  // every screen agrees who walks to whom
  fromState?: State;
  toState?: State;
};

type Answer<E> = { ok: true; event: E } | { ok: false; reason: Refusal };

// INT-4 with F10: whether `from` has interacted with `to` in the last 10 s.
// Anything they sent counts (replies and offers included), and so does a
// High-five of `to`'s that `from` accepted, at the moment they accepted it.
function limited(tx: Tx, roomId: number, from: number, to: number, now: number): boolean {
  const since = now - INTERACT_MS;
  const sent = tx
    .select({ id: interactions.id })
    .from(interactions)
    .where(and(eq(interactions.roomId, roomId), eq(interactions.fromUserId, from), eq(interactions.toUserId, to), gt(interactions.createdAt, since)))
    .get();
  if (sent) return true;
  const accepted = tx
    .select({ id: interactions.id })
    .from(interactions)
    .where(and(eq(interactions.roomId, roomId), eq(interactions.fromUserId, to), eq(interactions.toUserId, from), eq(interactions.kind, "highfive"), gt(interactions.doneAt, since)))
    .get();
  return !!accepted;
}

// INT-2, INT-4: checks and stores one interaction in one IMMEDIATE
// transaction, so of several sent at the same moment exactly one is accepted
// (INT-4.4), and the 10 s are counted from the stored times (INT-4.6).
export function interact(view: RoomView, roomId: number, from: Person, to: number, kind: Kind, now = Date.now()): Answer<InteractionEvent> {
  if (to === from.id) return { ok: false, reason: "self" };
  const target = targetIn(view, to, now);
  if (!target) return { ok: false, reason: "gone" };
  if (kind === "slap") {
    const no = slapRefusal(target.state);
    if (no) return { ok: false, reason: no };
  }
  return db.transaction(
    (tx) => {
      if (limited(tx, roomId, from.id, to, now)) return { ok: false as const, reason: "rate-limit" as const };
      const at = stampAfter(tx, roomId, now);
      const id = tx
        .insert(interactions)
        .values({ roomId, fromUserId: from.id, toUserId: to, kind, targetState: target.state, createdAt: at })
        .returning({ id: interactions.id })
        .get().id;
      return { ok: true as const, event: { id, kind, from, to: { id: target.id, name: target.name }, targetState: target.state, fromState: stateOf(view, from.id, now), at } };
    },
    { behavior: "immediate" },
  );
}

// ---------- replies (INT-9) ----------

// The Cheer, Poke or Slap a reply can still answer: addressed to `to`, from
// `from`, the newest of the three between them (INT-9.7), with no reply yet
// (INT-9.6), under 30 s old (INT-9.5).
function answerable(tx: Tx, roomId: number, now: number) {
  const rows = tx
    .select({ id: interactions.id, from: interactions.fromUserId, to: interactions.toUserId, kind: interactions.kind, at: interactions.createdAt })
    .from(interactions)
    .where(and(eq(interactions.roomId, roomId), inArray(interactions.kind, KINDS), gt(interactions.createdAt, now - REPLY_MS)))
    .orderBy(desc(interactions.createdAt), desc(interactions.id))
    .all();
  const answered = new Set(
    rows.length
      ? tx
          .select({ id: interactions.answersId })
          .from(interactions)
          .where(inArray(interactions.answersId, rows.map((r) => r.id)))
          .all()
          .map((r) => r.id)
      : [],
  );
  const seen = new Set<string>();
  const out: { id: number; from: number; to: number; kind: Kind; at: number }[] = [];
  for (const r of rows) {
    const pair = `${r.from}:${r.to}`;
    if (seen.has(pair)) continue; // an older one between the same two
    seen.add(pair);
    if (!answered.has(r.id)) out.push({ ...r, kind: r.kind as Kind });
  }
  return out;
}

// INT-9: answers one interaction addressed to `from`. Never refused by the
// 10 s limit, but stored as `from`'s interaction with its sender, so it
// counts toward it (F10). A Slap back is refused by Slap's own rule, by the
// slapper's state now (INT-9.9).
export function reply(view: RoomView, roomId: number, from: Person, answers: number, now = Date.now()): Answer<InteractionEvent> {
  return db.transaction(
    (tx) => {
      const orig = tx
        .select({ id: interactions.id, from: interactions.fromUserId, to: interactions.toUserId, kind: interactions.kind, at: interactions.createdAt })
        .from(interactions)
        .where(and(eq(interactions.id, answers), eq(interactions.roomId, roomId)))
        .get();
      if (!orig || orig.to !== from.id || !isKind(orig.kind)) return { ok: false as const, reason: "nothing-to-answer" as const };
      const done = tx.select({ id: interactions.id }).from(interactions).where(eq(interactions.answersId, orig.id)).get();
      if (done) return { ok: false as const, reason: "answered" as const };
      if (!answerable(tx, roomId, now).some((a) => a.id === orig.id)) return { ok: false as const, reason: "too-late" as const };
      const target = targetIn(view, orig.from, now);
      if (!target) return { ok: false as const, reason: "gone" as const };
      const kind = REPLY[orig.kind];
      if (kind === "slap-back") {
        const no = slapRefusal(target.state);
        if (no) return { ok: false as const, reason: no };
      }
      const at = stampAfter(tx, roomId, now);
      const id = tx
        .insert(interactions)
        .values({ roomId, fromUserId: from.id, toUserId: target.id, kind, targetState: target.state, createdAt: at, answersId: orig.id })
        .returning({ id: interactions.id })
        .get().id;
      return {
        ok: true as const,
        event: { id, kind, from, to: { id: target.id, name: target.name }, targetState: target.state, fromState: stateOf(view, from.id, now), at, answers: orig.id },
      };
    },
    { behavior: "immediate" },
  );
}

// ---------- the High-five (INT-10) ----------

type Offer = { id: number; from: number; to: number; at: number; doneAt: number | null };

// The High-five from `from` to `to` that is still open at `now`: not yet
// accepted (or, Dony's, accepted later than now) and under 10 s old.
function openOffer(tx: Tx, roomId: number, from: number, to: number, now: number): Offer | undefined {
  return tx
    .select({ id: interactions.id, from: interactions.fromUserId, to: interactions.toUserId, at: interactions.createdAt, doneAt: interactions.doneAt })
    .from(interactions)
    .where(
      and(
        eq(interactions.roomId, roomId),
        eq(interactions.kind, "highfive"),
        eq(interactions.fromUserId, from),
        eq(interactions.toUserId, to),
        gt(interactions.createdAt, now - OFFER_MS),
        or(isNull(interactions.doneAt), gt(interactions.doneAt, now)),
      ),
    )
    .get();
}

function accepting(tx: Tx, offer: Offer, now: number) {
  tx.update(interactions).set({ doneAt: now }).where(eq(interactions.id, offer.id)).run();
}

// INT-10.2 to INT-10.4, INT-10.7: an offer. Refused while the target is Away;
// counts as an interaction (the 10 s limit). If the target already has an
// open offer to the sender, this accepts theirs instead, so two crossing
// offers make one High-five. An offer to Dony is decided at once, from what
// he has already answered (BOT-7.2), and stored with the moment he accepts.
export function offerHighFive(view: RoomView, roomId: number, from: Person, to: number, now = Date.now()): Answer<HighFiveEvent> {
  if (to === from.id) return { ok: false, reason: "self" };
  const member = view.members.find((m) => m.id === to);
  const target = targetIn(view, to, now);
  if (!target) return { ok: false, reason: "gone" };
  if (member?.away) return { ok: false, reason: "target-away" };
  return db.transaction(
    (tx) => {
      const theirs = to === DONY_ID ? undefined : openOffer(tx, roomId, to, from.id, now);
      if (theirs && theirs.doneAt === null) {
        accepting(tx, theirs, now);
        return { ok: true as const, event: { id: theirs.id, from: { id: target.id, name: target.name }, to: from, at: theirs.at, done: now, fromState: target.state, toState: stateOf(view, from.id, now) } };
      }
      if (limited(tx, roomId, from.id, to, now)) return { ok: false as const, reason: "rate-limit" as const };
      const at = stampAfter(tx, roomId, now);
      const doneAt = to === DONY_ID ? donyAccepts(roomId, view, at) : null;
      const id = tx
        .insert(interactions)
        .values({ roomId, fromUserId: from.id, toUserId: to, kind: "highfive", targetState: target.state, createdAt: at, doneAt })
        .returning({ id: interactions.id })
        .get().id;
      return {
        ok: true as const,
        // open 10 s like any offer; one Dony takes ends early, with his done event
        event: { id, from, to: { id: target.id, name: target.name }, at, until: at + OFFER_MS, ...(doneAt !== null && { taken: true }) },
      };
    },
    { behavior: "immediate" },
  );
}

// INT-10.5 to INT-10.9: accepting an offer made to `from`. Never refused by
// the 10 s limit; the moment it's accepted counts as `from`'s interaction
// with the offerer (F10).
export function acceptHighFive(view: RoomView, roomId: number, from: Person, offerId: number, now = Date.now()): Answer<HighFiveEvent> {
  return db.transaction(
    (tx) => {
      const offer = tx
        .select({ id: interactions.id, from: interactions.fromUserId, to: interactions.toUserId, at: interactions.createdAt, doneAt: interactions.doneAt, kind: interactions.kind })
        .from(interactions)
        .where(and(eq(interactions.id, offerId), eq(interactions.roomId, roomId)))
        .get();
      if (!offer || offer.kind !== "highfive" || offer.to !== from.id) return { ok: false as const, reason: "nothing-to-answer" as const };
      if (offer.doneAt !== null) return { ok: false as const, reason: "answered" as const };
      if (now - offer.at >= OFFER_MS) return { ok: false as const, reason: "too-slow" as const };
      const offerer = targetIn(view, offer.from, now);
      if (!offerer) return { ok: false as const, reason: "gone" as const };
      accepting(tx, offer, now);
      return { ok: true as const, event: { id: offer.id, from: { id: offerer.id, name: offerer.name }, to: from, at: offer.at, done: now, fromState: offerer.state, toState: stateOf(view, from.id, now) } };
    },
    { behavior: "immediate" },
  );
}

// BOT-7.2: Dony accepts about a second after the offer, unless he answered
// anything (an emoji answer or an accepted High-five) in the 10 s before
// the offer came; the moment he accepts, or null when he leaves you hanging
function donyAccepts(roomId: number, view: RoomView, at: number): number | null {
  if (!view.dony.out) return null;
  const last = lastDonyAnswer(roomId, at);
  return at - last < DONY_ANSWER_EVERY_MS ? null : at + DONY_ANSWER_MS;
}

// BOT-7.2, BOT-7.3: the High-fives Dony accepted whose moment falls in
// (after, upTo], as the events every screen gets at that moment
export function donyFives(roomId: number, after: number, upTo: number): (HighFiveEvent & { done: number })[] {
  const rows = db
    .select({ id: interactions.id, from: interactions.fromUserId, at: interactions.createdAt, done: interactions.doneAt })
    .from(interactions)
    .where(and(eq(interactions.roomId, roomId), eq(interactions.kind, "highfive"), eq(interactions.toUserId, DONY_ID), gt(interactions.doneAt, after), lte(interactions.doneAt, upTo)))
    .all();
  if (!rows.length) return [];
  const names = new Map(db.select({ id: users.id, name: users.displayName }).from(users).where(inArray(users.id, rows.map((r) => r.from))).all().map((u) => [u.id, u.name]));
  return rows.map((r) => ({ id: r.id, from: { id: r.from, name: names.get(r.from) ?? "Someone" }, to: { id: DONY_ID, name: "Dony" }, at: r.at, done: r.done! }));
}

// ---------- what the room view carries (contract: offers, answerable, pbs) ----------

// The open offers, the answerable interactions and the fresh PBs, room-wide,
// between people in the room now (and Dony while he's out); each screen
// picks out the ones about its viewer. Read from what is stored, so a
// reload, a reconnect or a restart draws the same (INT-9.13, INT-10.12,
// GYM-18.6).
export type Moments = {
  offers: { id: number; from: number; to: number; until: number; taken?: boolean }[];
  answerable: { id: number; from: number; to: number; kind: Reply; until: number }[];
  pbs: { userId: number; exercise: { id: number; name: string }; until: number }[];
};
export function moments(roomId: number, present: Set<number>, donyPb: { at: number; exercise: { id: number; name: string } } | null, now = Date.now()): Moments {
  const here = (id: number) => present.has(id);
  const offers = db
    .select({ id: interactions.id, from: interactions.fromUserId, to: interactions.toUserId, at: interactions.createdAt, doneAt: interactions.doneAt })
    .from(interactions)
    .where(and(eq(interactions.roomId, roomId), eq(interactions.kind, "highfive"), gt(interactions.createdAt, now - OFFER_MS), or(isNull(interactions.doneAt), gt(interactions.doneAt, now))))
    .all()
    .filter((o) => here(o.from) && here(o.to))
    .map((o) => ({ id: o.id, from: o.from, to: o.to, until: o.at + OFFER_MS, ...(o.doneAt !== null && { taken: true }) }));
  const answerableNow = db.transaction((tx) => answerable(tx, roomId, now));
  const answerableList = answerableNow
    .filter((a) => here(a.from) && here(a.to))
    .map((a) => ({ id: a.id, from: a.from, to: a.to, kind: REPLY[a.kind], until: a.at + REPLY_MS }));
  const pbs = db
    .select({ userId: personalBests.userId, exerciseId: personalBests.exerciseId, at: personalBests.createdAt })
    .from(personalBests)
    .where(and(eq(personalBests.roomId, roomId), gt(personalBests.createdAt, now - PB_MS)))
    .orderBy(desc(personalBests.createdAt))
    .all()
    .filter((p) => here(p.userId))
    .map((p) => ({ userId: p.userId, exercise: { id: p.exerciseId, name: exerciseById(p.exerciseId)?.name ?? "" }, until: p.at + PB_MS }));
  // one per person: their newest
  const fresh = pbs.filter((p, i) => pbs.findIndex((q) => q.userId === p.userId) === i);
  if (donyPb && here(DONY_ID) && donyPb.at <= now && now < donyPb.at + PB_MS) fresh.push({ userId: DONY_ID, exercise: donyPb.exercise, until: donyPb.at + PB_MS });
  return { offers, answerable: answerableList, pbs: fresh };
}

// INT-4.7: when the viewer's 10 s on each person they've interacted with
// runs out, for those still running, so a reload shows the menu right
export function limitsFrom(roomId: number, userId: number, now = Date.now()): Record<number, number> {
  const rows = db
    .select({ to: interactions.toUserId, at: interactions.createdAt })
    .from(interactions)
    .where(and(eq(interactions.roomId, roomId), eq(interactions.fromUserId, userId), gt(interactions.createdAt, now - INTERACT_MS)))
    .all();
  // High-fives they accepted count from the moment they accepted (F10)
  const accepted = db
    .select({ to: interactions.fromUserId, at: interactions.doneAt })
    .from(interactions)
    .where(and(eq(interactions.roomId, roomId), eq(interactions.toUserId, userId), eq(interactions.kind, "highfive"), gt(interactions.doneAt, now - INTERACT_MS)))
    .all();
  const out: Record<number, number> = {};
  for (const r of [...rows, ...accepted]) if (r.at !== null && r.at <= now) out[r.to] = Math.max(out[r.to] ?? 0, r.at + INTERACT_MS);
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
// someone leaves; Dony's id is 0 and his name is his own. Replies are in it
// (INT-9.2); a High-five only once it happened, at the moment it did
// (INT-10.6, R3); PBs without numbers (GYM-18.5), never Dony's (BOT-5).
export function roomLog(roomId: number, limit = LOG_SIZE, now = Date.now()): LogEntry[] {
  const hits = db
    .select({ kind: interactions.kind, from: interactions.fromUserId, to: interactions.toUserId, at: interactions.createdAt, id: interactions.id })
    .from(interactions)
    .where(and(eq(interactions.roomId, roomId), inArray(interactions.kind, [...KINDS, "thanks", "poke-back", "slap-back"])))
    .orderBy(desc(interactions.createdAt), desc(interactions.id))
    .limit(limit)
    .all();
  const fives = db
    .select({ from: interactions.fromUserId, to: interactions.toUserId, at: interactions.doneAt })
    .from(interactions)
    .where(and(eq(interactions.roomId, roomId), eq(interactions.kind, "highfive"), isNotNull(interactions.doneAt), lte(interactions.doneAt, now)))
    .orderBy(desc(interactions.doneAt))
    .limit(limit)
    .all();
  const pbs = db
    .select({ from: personalBests.userId, exerciseId: personalBests.exerciseId, at: personalBests.createdAt })
    .from(personalBests)
    .where(eq(personalBests.roomId, roomId))
    .orderBy(desc(personalBests.createdAt))
    .limit(limit)
    .all();
  const said = db
    .select({ preset: messages.presetKey, from: messages.senderId, to: messages.toUserId, at: messages.createdAt, id: messages.id })
    .from(messages)
    .where(eq(messages.roomId, roomId))
    .orderBy(desc(messages.createdAt), desc(messages.id))
    .limit(limit)
    .all();
  // AV-6.9: long-haul unlocks made in this room, never quick or quiet ones
  const trophies = db
    .select({ from: userUnlocks.userId, acc: userUnlocks.acc, at: userUnlocks.earnedAt })
    .from(userUnlocks)
    .where(and(eq(userUnlocks.roomId, roomId), eq(userUnlocks.quiet, false), inArray(userUnlocks.acc, ["silver-medal", "gold-medal", "gold-chain", "crown"])))
    .orderBy(desc(userUnlocks.earnedAt))
    .limit(limit)
    .all();
  const ids = [...new Set([...hits, ...said, ...fives].flatMap((r) => [r.from, r.to]).concat(pbs.map((p) => p.from), trophies.map((t) => t.from)))].filter((id) => id !== DONY_ID);
  const names = new Map<number, string>([[DONY_ID, "Dony"]]);
  if (ids.length) for (const u of db.select({ id: users.id, name: users.displayName }).from(users).where(inArray(users.id, ids)).all()) names.set(u.id, u.name);
  const person = (id: number): Person => ({ id, name: names.get(id) ?? "Someone" });
  // stampAfter keeps interactions and presets apart in time; a High-five or
  // PB on the same millisecond as another entry goes after it
  const rows: LogEntry[] = [
    ...hits.map((r) => ({ kind: r.kind as Move, from: person(r.from), to: person(r.to), at: r.at }) as LogEntry),
    ...fives.map((r) => ({ kind: "highfive", from: person(r.from), to: person(r.to), at: r.at! }) as LogEntry),
    ...pbs.map((r) => ({ kind: "pb", from: person(r.from), exercise: exerciseById(r.exerciseId)?.name ?? "", at: r.at }) as LogEntry),
    ...said.map((r) => ({ kind: "say", from: person(r.from), to: person(r.to), text: PRESETS[r.preset as PresetKey] ?? "", at: r.at }) as LogEntry),
    ...trophies.map((r) => ({ kind: "trophy", from: person(r.from), acc: r.acc, at: r.at }) as LogEntry),
  ];
  // a PB and the unlock it made share a time: the unlock above it (room spec X.10.7)
  return rows.sort((a, b) => b.at - a.at || Number(b.kind === "trophy") - Number(a.kind === "trophy")).slice(0, limit);
}

// When this person last joined the room: the log's "You walked in" line (D14)
export function joinedAt(roomId: number, userId: number): number | undefined {
  return db
    .select({ at: roomMembers.joinedAt })
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId), isNull(roomMembers.leftAt)))
    .get()?.at;
}
