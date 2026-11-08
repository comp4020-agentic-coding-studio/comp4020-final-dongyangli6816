import { eq } from "drizzle-orm";
import { db } from "./db.ts";
import { users } from "./schema.ts";
import { parseLook, randomLook, type Look } from "../sprites/avatar.ts";
import { asWear, NOTHING, type Wear } from "../sprites/accessories.ts";

// AV-1, AV-3: a person's look. An account from before avatars (or with a
// look that no longer parses) gets a random one, stored, so it stays the same
// from then on.
export function lookOf(userId: number): Look {
  const row = db.select({ avatar: users.avatar, wear: users.wear }).from(users).where(eq(users.id, userId)).get();
  const look = parseLook(row?.avatar ?? null) ?? saveLook(userId, randomLook());
  // AV-7.5, AV-7.6: what they wear, wherever they're drawn
  return { ...look, wear: parseWear(row?.wear ?? null) };
}

export function saveLook(userId: number, look: Look): Look {
  db.update(users).set({ avatar: JSON.stringify(look) }).where(eq(users.id, userId)).run();
  return look;
}

// AV-4: what someone wears. A stored id they've since lost the right to
// can't happen (unlocks are kept), but a bad row reads as nothing.
export function wearOf(userId: number): Wear {
  const row = db.select({ wear: users.wear }).from(users).where(eq(users.id, userId)).get();
  return parseWear(row?.wear ?? null);
}
export function parseWear(json: string | null): Wear {
  if (!json) return { ...NOTHING };
  try {
    return asWear(JSON.parse(json));
  } catch {
    return { ...NOTHING };
  }
}
export function saveWear(userId: number, wear: Wear): void {
  db.update(users).set({ wear: JSON.stringify(wear) }).where(eq(users.id, userId)).run();
}
