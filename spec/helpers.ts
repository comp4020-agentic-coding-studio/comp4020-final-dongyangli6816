import { inject } from "vitest";

export const baseUrl = inject("baseUrl");

// One browser: keeps its own cookies across requests, follows nothing on its
// own (so tests see each redirect), and sends the Origin header a real form
// post carries, since the app refuses cross-site POSTs.
export class Browser {
  private cookies = new Map<string, string>();

  async request(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    if (this.cookies.size) headers.set("cookie", [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "));
    if (init.method === "POST") headers.set("origin", new URL(baseUrl).origin);
    const res = await fetch(new URL(path, baseUrl), { ...init, headers, redirect: "manual" });
    for (const line of res.headers.getSetCookie()) {
      const [pair, ...attrs] = line.split(";");
      const [name, value] = pair.split("=");
      const expired = attrs.some((a) => /expires=Thu, 01 Jan 1970/i.test(a) || /max-age=0/i.test(a.trim()));
      if (expired || value === "") this.cookies.delete(name.trim());
      else this.cookies.set(name.trim(), value);
    }
    return res;
  }

  get = (path: string) => this.request(path);
  post = (path: string, fields: Record<string, string>) =>
    this.request(path, { method: "POST", body: new URLSearchParams(fields) });

  // the page at path, following the redirect a form post answers with
  async follow(res: Response): Promise<Response> {
    const to = res.headers.get("location");
    return to ? this.get(to) : res;
  }
}

// CI starts every run on an empty /data, but a local database keeps earlier
// runs' accounts, so every account a test makes is new.
export const freshEmail = (): string => `t${Date.now()}${Math.random().toString(36).slice(2, 8)}@example.test`;

export async function signUp(b: Browser, email = freshEmail(), password = "correct horse", name = "Tester") {
  const res = await b.post("/signup", { email, password, display_name: name });
  return { res, email, password };
}

export async function createRoom(b: Browser): Promise<{ path: string; passcode: string }> {
  const res = await b.post("/rooms", {});
  const path = res.headers.get("location")!;
  const html = await (await b.get(path)).text();
  const passcode = html.match(/class="passcode"[^>]*>([A-Z0-9]{6})</)![1];
  return { path, passcode };
}

// A room's live stream (GYM-13) as this browser sees it. next() resolves with
// the next `room` event, or rejects if none arrives within ms; ended resolves
// when the server hangs up; close() hangs up from this end.
export type RoomEvent = {
  now: number;
  closed: boolean;
  members: {
    id: number;
    name: string;
    look: { skin: string; hair: string; hairColour: string; shirt: string };
    host: boolean;
    state: string;
    away: boolean;
    exercise: string | null;
    station: { slot: number; equipment: string } | null;
    slackAt: number | null;
  }[];
  stations: { slot: number; equipment: string | null }[];
};

export async function openEvents(b: Browser, roomPath: string) {
  const hangUp = new AbortController();
  const res = await b.request(`${roomPath}/events`, { signal: hangUp.signal });
  const queue: RoomEvent[] = [];
  const waiting: ((e: RoomEvent) => void)[] = [];
  let ended: Promise<void> = Promise.resolve();
  if (res.ok && res.body) {
    ended = (async () => {
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        for await (const chunk of res.body!) {
          buffer += decoder.decode(chunk as Uint8Array, { stream: true });
          let end;
          while ((end = buffer.indexOf("\n\n")) >= 0) {
            const block = buffer.slice(0, end);
            buffer = buffer.slice(end + 2);
            if (!/^event: room$/m.test(block)) continue;
            const data = JSON.parse(block.match(/^data: (.*)$/m)![1]) as RoomEvent;
            const w = waiting.shift();
            if (w) w(data);
            else queue.push(data);
          }
        }
      } catch {
        // hung up
      }
    })();
  }
  return {
    res,
    next: (ms = 1000) =>
      new Promise<RoomEvent>((resolve, reject) => {
        const queued = queue.shift();
        if (queued) return resolve(queued);
        const timer = setTimeout(() => {
          waiting.splice(waiting.indexOf(done), 1);
          reject(new Error(`no room event within ${ms} ms`));
        }, ms);
        const done = (e: RoomEvent) => {
          clearTimeout(timer);
          resolve(e);
        };
        waiting.push(done);
      }),
    // the next event that passes the test, skipping any before it
    async until(test: (e: RoomEvent) => boolean, ms = 1000): Promise<RoomEvent> {
      const deadline = Date.now() + ms;
      for (;;) {
        const e = await this.next(Math.max(1, deadline - Date.now()));
        if (test(e)) return e;
      }
    },
    ended,
    close: () => hangUp.abort(),
  };
}

// Every event on a room's live stream, not only `room` ones: the room's
// interactions, presets and emoji (docs/product/criteria/int.md) travel as
// their own small events beside it. Each event is kept with when it arrived
// (Date.now() on this side), so a test can say "within a second".
export type Who = { id: number; name: string };
export type InteractionEvent = {
  kind: "cheer" | "poke" | "slap";
  from: Who;
  to: Who;
  // the target's state when the server accepted it (Poke's banner wording)
  targetState: "idle" | "lifting" | "resting" | "slacking" | "finished";
  at: number;
};
export type SayEvent = { preset: string; text: string; from: Who; to: Who; at: number };
export type EmoteEvent = { emoji: string; from: Who; at: number };
export type StreamEvents = { room: RoomEvent; interaction: InteractionEvent; say: SayEvent; emote: EmoteEvent };
type Arrived = { [K in keyof StreamEvents]: { name: K; data: StreamEvents[K]; t: number } }[keyof StreamEvents];

export async function watchRoom(b: Browser, roomPath: string) {
  const hangUp = new AbortController();
  const res = await b.request(`${roomPath}/events`, { signal: hangUp.signal });
  const arrived: Arrived[] = [];
  const cursor: Partial<Record<keyof StreamEvents, number>> = {};
  let wake: (() => void)[] = [];
  let ended: Promise<void> = Promise.resolve();
  if (res.ok && res.body) {
    ended = (async () => {
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        for await (const chunk of res.body!) {
          buffer += decoder.decode(chunk as Uint8Array, { stream: true });
          let end;
          while ((end = buffer.indexOf("\n\n")) >= 0) {
            const block = buffer.slice(0, end);
            buffer = buffer.slice(end + 2);
            const name = block.match(/^event: (.*)$/m)?.[1];
            const data = block.match(/^data: (.*)$/m)?.[1];
            if (!name || data === undefined) continue;
            arrived.push({ name, data: JSON.parse(data), t: Date.now() } as Arrived);
            const w = wake;
            wake = [];
            w.forEach((f) => f());
          }
        }
      } catch {
        // hung up
      }
    })();
  }
  const changed = (ms: number) =>
    new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), Math.max(1, ms));
      wake.push(() => {
        clearTimeout(timer);
        resolve(true);
      });
    });
  return {
    res,
    // the next event of this kind that passes the test, skipping others of
    // its kind before it; rejects if none arrives within ms
    async next<K extends keyof StreamEvents>(
      name: K,
      test: (e: StreamEvents[K]) => boolean = () => true,
      ms = 1000,
    ): Promise<StreamEvents[K] & { arrivedAt: number }> {
      const deadline = Date.now() + ms;
      for (;;) {
        for (let i = cursor[name] ?? 0; i < arrived.length; i++) {
          const a = arrived[i];
          if (a.name !== name) continue;
          cursor[name] = i + 1;
          if (test(a.data as StreamEvents[K])) return { ...(a.data as StreamEvents[K]), arrivedAt: a.t };
        }
        cursor[name] = arrived.length;
        if (Date.now() >= deadline || !(await changed(deadline - Date.now()))) {
          throw new Error(`no matching ${name} event within ${ms} ms`);
        }
      }
    },
    // everything of this kind that has arrived so far, from the start
    all<K extends keyof StreamEvents>(name: K): (StreamEvents[K] & { arrivedAt: number })[] {
      return arrived.filter((a) => a.name === name).map((a) => ({ ...(a.data as StreamEvents[K]), arrivedAt: a.t }));
    },
    // what of this kind arrives in the next ms (waits them out)
    async during<K extends keyof StreamEvents>(name: K, ms: number): Promise<StreamEvents[K][]> {
      const from = arrived.length;
      await new Promise((r) => setTimeout(r, ms));
      return arrived.slice(from).filter((a) => a.name === name).map((a) => a.data as StreamEvents[K]);
    },
    ended,
    close: () => hangUp.abort(),
  };
}
export type RoomWatch = Awaited<ReturnType<typeof watchRoom>>;

// The text of each line in the room log (INT-5.8) as the room's first render
// draws it (docs/design/room/spec.md I.9): newest first, the five showing and
// the older ones behind "Show older" together, without the time on the right
// or the "You walked in" divider. null if the page has no room log.
export function roomLogOf(html: string): string[] | null {
  const section = html.match(/<section[^>]*class="[^"]*\broom-log\b[^"]*"[^>]*>[\s\S]*?<\/section>/)?.[0];
  if (!section) return null;
  return [...section.matchAll(/<li\b([^>]*)>([\s\S]*?)<\/li>/g)]
    .filter((m) => !/class="[^"]*\bjoined\b/.test(m[1]))
    .map((m) => plainText(m[2].replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<span[^>]*class="[^"]*\bt\b[^"]*"[^>]*>[\s\S]*?<\/span>/g, "")));
}

export const plainText = (html: string): string =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;|&#34;|&#x22;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();

// The test hook (contract at the top of spec/interactions.test.ts): as if
// everything one member did in the room (`user`), or the room's own events and
// Dony's summon (`room`), had happened ms earlier. Only on an app run with
// SPOTTER_TEST_HOOKS=1.
export async function backdate(b: Browser, roomPath: string, target: { user: number } | { room: true }, ms: number): Promise<void> {
  const fields: Record<string, string> = { op: "backdate", ms: String(Math.round(ms)) };
  if ("user" in target) fields.user = String(target.user);
  else fields.room = "1";
  const res = await b.post(`${roomPath}/qa`, fields);
  if (res.status !== 204) {
    throw new Error(
      `POST ${roomPath}/qa answered ${res.status}: this check needs the test hook, so the app must run with SPOTTER_TEST_HOOKS=1 (the contract at the top of spec/interactions.test.ts)`,
    );
  }
}
