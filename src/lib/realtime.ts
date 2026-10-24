import { DONY_ID, plannedEmotes } from "./dony.ts";
import { log } from "./log.ts";
import { AWAY_MS, roomView } from "./presence.ts";
import { isMember, touchRoom } from "./rooms.ts";

// GYM-13: the open event streams, per room. Only the connections live in
// memory; every message is the whole room read fresh from the database, so a
// stream that missed something, or reconnects after a restart, is right again
// with the next one. Nothing here decides anything, except that a stream
// only stays open while its person is still in the room (ADR 0006).

const PING_MS = 20_000; // keeps the stream open through Fly's proxy, and the person not Away

type Client = { userId: number; send: (chunk: string) => boolean; end: (reason: string) => void };
const streams = new Map<number, Set<Client>>();

// Dony (BOT-3) changes what he's doing on his own, with nobody posting
// anything, so each message also sets one timer per room for his next
// change. The timer only says when to look again; what he's doing is still
// read fresh from the database, so a timer lost to a restart costs nothing
// but a late redraw.
const donyTimers = new Map<number, ReturnType<typeof setTimeout>>();

// Sends everyone watching the room what it looks like now. Called after
// anything changes it.
export function broadcast(roomId: number): void {
  clearTimeout(donyTimers.get(roomId));
  donyTimers.delete(roomId);
  const clients = streams.get(roomId);
  if (!clients?.size) return;
  const { donyNext, ...view } = roomView(roomId);
  const chunk = `event: room\ndata: ${JSON.stringify(view)}\n\n`;
  for (const c of clients) c.send(chunk);
  // everyone has been told it closed; nobody is in it to watch any more
  if (view.closed) return drop(roomId, undefined, "room_closed");
  donyEmotes(roomId);
  if (donyNext) {
    // capped, so a long rest by the lockers doesn't hold a timer for minutes
    const wait = Math.min(Math.max(donyNext - view.now, 0) + 50, 10 * 60_000);
    const timer = setTimeout(() => broadcast(roomId), wait);
    timer.unref();
    donyTimers.set(roomId, timer);
  }
}

// INT-3, INT-5, INT-8: one small event to everyone watching the room, beside
// the room itself: an interaction, a preset or an emoji. Nothing is re-read,
// so a room of twelve sending emoji never redraws anyone's room.
export function announce(roomId: number, event: "interaction" | "say" | "emote", data: object): void {
  const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of streams.get(roomId) ?? []) c.send(chunk);
}

// BOT-6: Dony's emoji, sent at the times his schedule gives them. Only the
// time up to which they've gone out lives in memory, per room, and only
// while someone is watching: one that falls while nobody's stream is open,
// or across a restart, is missed rather than sent late, and none goes twice
// (BOT-6.6). What he sends is worked out fresh each time (dony.ts).
const donyEmoteTimers = new Map<number, ReturnType<typeof setTimeout>>();
const donyEmotedTo = new Map<number, number>();
export function donyEmotes(roomId: number): void {
  clearTimeout(donyEmoteTimers.get(roomId));
  donyEmoteTimers.delete(roomId);
  if (!streams.get(roomId)?.size) return;
  const now = Date.now();
  const from = donyEmotedTo.get(roomId) ?? now;
  donyEmotedTo.set(roomId, now);
  const plan = plannedEmotes(roomId, now + 15 * 60_000);
  if (!plan) return;
  for (const e of plan.emotes) {
    if (e.at > from && e.at <= now) announce(roomId, "emote", { emoji: e.emoji, from: { id: DONY_ID, name: "Dony" }, at: e.at });
  }
  const next = plan.emotes.find((e) => e.at > now);
  if (next) {
    const timer = setTimeout(() => donyEmotes(roomId), Math.min(next.at - now + 5, 10 * 60_000));
    timer.unref();
    donyEmoteTimers.set(roomId, timer);
  }
}

// What Dony would have sent up to now is missed, not sent late: after the
// test hook moves the room's times (qa.ts), as after a restart (BOT-6.6).
export function skipDonyEmotes(roomId: number): void {
  if (streams.get(roomId)?.size) donyEmotedTo.set(roomId, Date.now());
}

// Hangs up on whoever should no longer be watching: one person who left the
// room, or everyone when it closed. Their page reconnects, is refused, and
// reloads to say why.
export function drop(roomId: number, userId?: number, reason = "left"): void {
  for (const c of [...(streams.get(roomId) ?? [])]) if (userId === undefined || c.userId === userId) c.end(reason);
}

// Signing out hangs up on that person's streams in every room.
export function dropUser(userId: number, reason = "signout"): void {
  for (const roomId of [...streams.keys()]) drop(roomId, userId, reason);
}

export const openStreams = (): number => [...streams.values()].reduce((n, s) => n + s.size, 0);

// One person's stream of a room: the room as it is now, then again after
// every change. Their visits count as being seen, so while it's open they
// aren't Away; once it closes, the others are told when they become Away.
export function subscribe(roomId: number, userId: number, signal: AbortSignal): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let client: Client | undefined;
  let ping: ReturnType<typeof setInterval> | undefined;
  const opened = Date.now();

  const close = (reason = "gone") => {
    if (!client) return;
    log("stream.close", { uid: userId, room: roomId, reason, s: Math.round((Date.now() - opened) / 1000) });
    streams.get(roomId)?.delete(client);
    if (!streams.get(roomId)?.size) {
      streams.delete(roomId);
      donyEmotedTo.delete(roomId);
    }
    client = undefined;
    clearInterval(ping);
    setTimeout(() => broadcast(roomId), AWAY_MS + 1000).unref();
  };

  return new ReadableStream({
    start(controller) {
      client = {
        userId,
        send: (chunk) => {
          try {
            controller.enqueue(encoder.encode(chunk));
            return true;
          } catch {
            close(); // the browser went away mid-write
            return false;
          }
        },
        end: (reason) => {
          close(reason);
          try {
            controller.close();
          } catch {
            // already closed
          }
        },
      };
      if (!streams.has(roomId)) {
        streams.set(roomId, new Set());
        // what Dony sent before anyone was watching is missed (BOT-6.6)
        donyEmotedTo.set(roomId, Date.now());
      }
      streams.get(roomId)!.add(client);
      log("stream.open", { uid: userId, room: roomId, watching: streams.get(roomId)!.size });
      touchRoom(roomId, userId);
      client.send("retry: 2000\n\n");
      // the newcomer gets the room, and everyone else sees them back from Away
      broadcast(roomId);
      ping = setInterval(() => {
        // a stream left open by someone no longer in the room keeps nothing
        // alive (ROOM-6) and shows them nothing
        if (!isMember(roomId, userId)) return client?.end("not_member");
        touchRoom(roomId, userId);
        client?.send(": ping\n\n");
      }, PING_MS);
      signal.addEventListener("abort", () => client?.end("gone"));
    },
    cancel: () => close(),
  });
}
