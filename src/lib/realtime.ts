import { AWAY_MS, roomView } from "./presence.ts";
import { touchRoom } from "./rooms.ts";

// GYM-13: the open event streams, per room. Only the connections live in
// memory; every message is the whole room read fresh from the database, so a
// stream that missed something, or reconnects after a restart, is right again
// with the next one. Nothing here decides anything.

const PING_MS = 20_000; // keeps the stream open through Fly's proxy, and the person not Away

type Client = { userId: number; send: (chunk: string) => boolean };
const streams = new Map<number, Set<Client>>();

const message = (roomId: number) => `event: room\ndata: ${JSON.stringify(roomView(roomId))}\n\n`;

// Sends everyone watching the room what it looks like now. Called after
// anything changes it.
export function broadcast(roomId: number): void {
  const clients = streams.get(roomId);
  if (!clients?.size) return;
  const chunk = message(roomId);
  for (const c of clients) c.send(chunk);
}

export const openStreams = (): number => [...streams.values()].reduce((n, s) => n + s.size, 0);

// One person's stream of a room: the room as it is now, then again after
// every change. Their visits count as being seen, so while it's open they
// aren't Away; once it closes, the others are told when they become Away.
export function subscribe(roomId: number, userId: number, signal: AbortSignal): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let client: Client | undefined;
  let ping: ReturnType<typeof setInterval> | undefined;

  const close = () => {
    if (!client) return;
    streams.get(roomId)?.delete(client);
    if (!streams.get(roomId)?.size) streams.delete(roomId);
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
      };
      if (!streams.has(roomId)) streams.set(roomId, new Set());
      streams.get(roomId)!.add(client);
      touchRoom(roomId, userId);
      client.send("retry: 2000\n\n");
      // the newcomer gets the room, and everyone else sees them back from Away
      broadcast(roomId);
      ping = setInterval(() => {
        touchRoom(roomId, userId);
        client?.send(": ping\n\n");
      }, PING_MS);
      signal.addEventListener("abort", () => {
        close();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel: close,
  });
}
