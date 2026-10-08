import { eq } from "drizzle-orm";
import { db } from "./db.ts";
import { users } from "./schema.ts";
import { parseLook, randomLook, type Look } from "../sprites/avatar.ts";

// AV-1, AV-3: a person's look. An account from before avatars (or with a
// look that no longer parses) gets a random one, stored, so it stays the same
// from then on.
export function lookOf(userId: number): Look {
  const row = db.select({ avatar: users.avatar }).from(users).where(eq(users.id, userId)).get();
  return parseLook(row?.avatar ?? null) ?? saveLook(userId, randomLook());
}

export function saveLook(userId: number, look: Look): Look {
  db.update(users).set({ avatar: JSON.stringify(look) }).where(eq(users.id, userId)).run();
  return look;
}
