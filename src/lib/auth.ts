import type { AstroCookies } from "astro";
import { eq } from "drizzle-orm";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db } from "./db.ts";
import { authSessions, users } from "./schema.ts";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

const COOKIE = "sid";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000; // ACC-3: 30 days on that browser

export type User = { id: number; email: string; displayName: string };

// ACC-2: a salted scrypt hash, stored as "salt:hash" in hex. The password
// itself is never stored, returned or logged.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

const sha256 = (token: string): string => createHash("sha256").update(token).digest("hex");

export function startSession(cookies: AstroCookies, userId: number, secure: boolean): void {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_MS;
  db.insert(authSessions).values({ tokenHash: sha256(token), userId, expiresAt }).run();
  cookies.set(COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    // Fly terminates TLS, so the browser sees HTTPS even though the app sees
    // HTTP; a Secure cookie on plain local HTTP would be dropped
    secure,
    expires: new Date(expiresAt),
  });
}

export function currentUser(cookies: AstroCookies): User | null {
  const token = cookies.get(COOKIE)?.value;
  if (!token) return null;
  const row = db
    .select({ id: users.id, email: users.email, displayName: users.displayName, expiresAt: authSessions.expiresAt })
    .from(authSessions)
    .innerJoin(users, eq(users.id, authSessions.userId))
    .where(eq(authSessions.tokenHash, sha256(token)))
    .get();
  if (!row || row.expiresAt < Date.now()) return null;
  return { id: row.id, email: row.email, displayName: row.displayName };
}

export function endSession(cookies: AstroCookies): void {
  const token = cookies.get(COOKIE)?.value;
  if (token) db.delete(authSessions).where(eq(authSessions.tokenHash, sha256(token))).run();
  cookies.delete(COOKIE, { path: "/" });
}

// The request reached Fly over HTTPS (Fly sets X-Forwarded-Proto), or the app
// was hit directly over HTTPS.
export const isHttps = (request: Request): boolean =>
  request.headers.get("x-forwarded-proto") === "https" || new URL(request.url).protocol === "https:";
