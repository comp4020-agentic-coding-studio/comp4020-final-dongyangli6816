// What a move is and how it reads: the kinds, the presets' words, the emoji,
// the limits, Slap's one rule, and the room log's wording (int.md). Shared by
// the server (interactions.ts) and the room page's script. Pure: no database
// here, since it also runs in the browser.
import type { State } from "./presence.ts";

export const KINDS = ["cheer", "poke", "slap"] as const;
export type Kind = (typeof KINDS)[number];
// INT-9: the answer each of the three takes (F2); an answer takes none
export const REPLY = { cheer: "thanks", poke: "poke-back", slap: "slap-back" } as const;
export type Reply = (typeof REPLY)[Kind];
// everything that plays on an avatar as a reaction
export type Move = Kind | Reply | "highfive";

// The copy bank's presets (system.md section 3), by key, in its order
export const PRESETS = {
  "hype-1": "One more rep! 💪",
  "hype-2": "Light weight!",
  "hype-3": "Let's gooo 🔥",
  "hype-4": "Lock in 🔒",
  "hype-5": "That's a W set 🏆",
  "nudge-1": "Put the phone down 📵",
  "nudge-2": "Rest's over, mate ⏰",
  "nudge-3": "I can see you 👀",
  "nudge-4": "Bro is scrolling 💀",
  "nudge-5": "Water break or nap? 😴",
} as const;
export type PresetKey = keyof typeof PRESETS;

// The eight emoji (D3), in tray order; src/sprites/emoji.ts draws them
export const EMOJI_KEYS = ["hi", "flex", "fire", "clap", "haha", "dead", "eyes", "love"] as const;
export type EmojiKey = (typeof EMOJI_KEYS)[number];

export const INTERACT_MS = 10_000; // INT-4: per sender per target
export const PRESET_MS = 2_000; // D6: per sender
export const EMOTE_MS = 1_000; // D6: per sender, from any tab
export const LOG_SIZE = 50; // D7
export const REPLY_MS = 30_000; // INT-9.5 (R2)
export const OFFER_MS = 10_000; // INT-10.5 (R3)
export const PB_MS = 30_000; // GYM-18.6 (R5)

export const isKind = (s: string): s is Kind => (KINDS as readonly string[]).includes(s);
export const isPreset = (s: string): s is PresetKey => Object.hasOwn(PRESETS, s);
export const isEmoji = (s: string): s is EmojiKey => (EMOJI_KEYS as readonly string[]).includes(s);

export type Person = { id: number; name: string };
export type Refusal =
  | "self"
  | "gone"
  | "target-lifting"
  | "target-finished"
  | "rate-limit"
  // INT-9, INT-10 (the contract in spec/room-feel.test.ts)
  | "too-late"
  | "answered"
  | "nothing-to-answer"
  | "target-away"
  | "too-slow";

// INT-2.4, INT-2.5: Slap is the only move with a state rule (D5)
export const slapRefusal = (state: State): Refusal | null =>
  state === "lifting" ? "target-lifting" : state === "finished" ? "target-finished" : null;

// A completed High-five is logged with `from` as the one who offered it.
// A PB has no `to` and never any numbers (GYM-18.5, F5).
export type LogEntry =
  | { kind: Move; from: Person; to: Person; at: number }
  | { kind: "say"; from: Person; to: Person; text: string; at: number }
  | { kind: "pb"; from: Person; exercise: string; at: number };

// The log's words for one entry, to the person reading it (INT-5.22, D28;
// room spec F.10)
export function logLine(e: LogEntry, me: number): { who: string; rest: string; to?: string; text?: string } {
  const name = (p: Person, start: boolean) => (p.id === me ? (start ? "You" : "you") : p.name);
  const who = name(e.from, true);
  if (e.kind === "say") return { who, rest: "", to: `@${name(e.to, false)}`, text: e.text };
  if (e.kind === "pb") return { who, rest: ` hit a PB on ${e.exercise.toLowerCase()}` };
  // "You and Ji-woo high-fived", whichever of the two offered (F.10)
  if (e.kind === "highfive" && e.to.id === me) return { who: "You", rest: ` and ${e.from.name} high-fived` };
  const to = name(e.to, false);
  // the target's, as a possessive: "Mia's", "your"
  const theirs = e.to.id === me ? "your" : `${e.to.name}'s`;
  const REST: Record<Move, string> = {
    cheer: ` cheered ${to}`,
    poke: ` poked ${to}`,
    slap: ` slapped ${to}`,
    thanks: ` thanked ${to}`,
    "poke-back": ` poked ${to} back`,
    "slap-back": ` returned ${theirs} slap`,
    highfive: ` and ${to} high-fived`,
  };
  return { who, rest: REST[e.kind] };
}

// Which icon a log entry carries (room spec F.10)
export const LOG_ICON: Record<LogEntry["kind"], string> = {
  say: "say",
  cheer: "cheer",
  poke: "poke",
  slap: "slap",
  thanks: "thanks",
  "poke-back": "poke",
  "slap-back": "slap",
  highfive: "high-five",
  pb: "pb",
};

// A log line's time on the right: "now", "1 min", "2 h" (room spec I.9)
export function ago(at: number, now: number): string {
  const min = Math.floor((now - at) / 60_000);
  return min < 1 ? "now" : min < 60 ? `${min} min` : `${Math.floor(min / 60)} h`;
}
