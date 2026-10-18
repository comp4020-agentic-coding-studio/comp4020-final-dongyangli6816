import type { User } from "./auth.ts";

// OPS-1, OPS-2: one JSON object per line on stdout, which Fly keeps and
// `flyctl logs` shows. Every line about a person carries their id and display
// name, so two people in one room read apart. Never pass a password, a
// session token, a passcode or a full email address in `fields`.

type Fields = Record<string, string | number | boolean | null | undefined>;

const line = (event: string, fields: Fields) => JSON.stringify({ t: new Date().toISOString(), event, ...fields });

// who did it, as the first fields of a line
export const who = (user: Pick<User, "id" | "displayName"> | null | undefined): Fields =>
  user ? { uid: user.id, user: user.displayName } : { uid: null };

export function log(event: string, fields: Fields = {}): void {
  console.log(line(event, fields));
}

export function logError(event: string, err: unknown, fields: Fields = {}): void {
  const e = err instanceof Error ? err : new Error(String(err));
  console.error(line(event, { level: "error", ...fields, error: e.message, stack: e.stack }));
}

// "mia@anu.edu.au" -> "m***@anu.edu.au": enough to spot one email trying
// again and again, not enough to read the address off the logs
export const maskEmail = (email: string): string => {
  const at = email.lastIndexOf("@");
  return at < 1 ? "***" : `${email[0]}***${email.slice(at)}`;
};
