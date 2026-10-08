// The squad list's words (GYM-15), shared by the room page's server render
// and its script, so a row reads the same before and after a live update.
// Pure: no database here, since it also runs in the browser.
import { clock, minutes } from "./logbook.ts";
import type { MemberView, State } from "./presence.ts";

export const STATE_WORD: Record<State, string> = {
  idle: "Idle",
  lifting: "Lifting",
  resting: "Resting",
  slacking: "Slacking",
  finished: "Finished",
};

// The state shown at `now`: Resting turns Slacking at the server's slackAt
// without waiting for the next message.
export const stateAt = (m: MemberView, now: number): State =>
  m.state === "resting" && m.slackAt !== null && now >= m.slackAt ? "slacking" : m.state;

// What they're doing, under their name: "Rest 1:24 left · Bench press".
// Each part is [text, keep-on-one-line].
export function whatParts(m: MemberView, now: number): [string, boolean][] {
  const state = stateAt(m, now);
  const lift: [string, boolean][] = m.exercise ? [[` · ${m.exercise}`, false]] : [];
  const offline: [string, boolean][] = m.away ? [[`Offline ${Math.max(1, Math.floor((now - m.seenAt) / 60_000))} min`, true]] : [];
  const sep: [string, boolean][] = offline.length ? [[" · ", false]] : [];
  switch (state) {
    case "lifting":
      return [...offline, ...sep, [m.exercise ?? "Lifting", false]];
    case "resting":
      return [...offline, ...sep, ["Rest ", false], [`${clock((m.restEnd! - now) / 1000)} left`, true], ...lift];
    case "slacking":
      return [...offline, ...sep, [`${clock((now - m.restEnd!) / 1000)} over rest`, true], ...lift];
    case "finished":
      return m.done ? [[`${m.done.sets} sets · ${minutes(m.done.startedAt, m.done.endedAt)} min`, true]] : [["Done", false]];
    case "idle":
      return offline.length ? offline : [["No station yet", false]];
  }
}
