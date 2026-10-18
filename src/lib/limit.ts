// ROOM-7 and sign-in: how many failed tries one key has had in the last
// window. Kept in memory, like the idle sweep's throttle: a restart forgets
// the count, which on one small machine only ever helps the person trying.
// Only failures are counted, so nobody using the app normally meets a limit.

const tries = new Map<string, number[]>();

const recent = (key: string, windowMs: number, now: number): number[] => {
  const kept = (tries.get(key) ?? []).filter((t) => now - t < windowMs);
  if (kept.length) tries.set(key, kept);
  else tries.delete(key);
  return kept;
};

// true once key has failed max times within the window
export const tooMany = (key: string, max: number, windowMs: number, now = Date.now()): boolean =>
  recent(key, windowMs, now).length >= max;

export function failed(key: string, windowMs: number, now = Date.now()): void {
  tries.set(key, [...recent(key, windowMs, now), now]);
}

// Fly puts the visitor's address in Fly-Client-IP; run locally, there's none
export const clientIp = (request: Request, fallback: string): string =>
  request.headers.get("fly-client-ip") ?? fallback;

// ROOM-7: ten wrong passcodes a minute per account, typed or from a link,
// so passcodes can't be guessed by brute force
const JOIN_TRIES = 10;
const JOIN_WINDOW_MS = 60_000;
export const joinLimited = (userId: number): boolean => tooMany(`join:${userId}`, JOIN_TRIES, JOIN_WINDOW_MS);
export const joinFailed = (userId: number): void => failed(`join:${userId}`, JOIN_WINDOW_MS);
