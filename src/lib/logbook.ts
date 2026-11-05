// Numbers the pages derive from logged sets. Pure functions over what
// workouts.ts returns, so history, home, the summary and the gym agree on
// every figure.
import type { Kind } from "./exercises.ts";

export type SetType = "normal" | "warmup" | "failure";
export const SET_TYPES: readonly SetType[] = ["normal", "warmup", "failure"];
export const isSetType = (v: string): v is SetType => (SET_TYPES as readonly string[]).includes(v);

export type LoggedSet = {
  name: string;
  kind: Kind;
  weightKg: number | null;
  reps: number | null;
  durationS: number | null;
  distanceM: number | null;
  // LB-2: null on sets from before types and RPE (a normal set, no RPE)
  setType?: SetType | null;
  rpe?: number | null;
};

// LB-2.10: a warm-up counts in Sets and Volume but never in records, plan
// counts or the chart. Sets from before types are working sets (LB-4.8).
export const isWorking = (s: Pick<LoggedSet, "setType">): boolean => s.setType !== "warmup";

// LB-2.14 (D6): 1 to 10 in half steps. "" is no RPE.
export function readRpe(text: string): { rpe: number | null } | { error: string } {
  const t = text.trim();
  if (t === "") return { rpe: null };
  const n = Number(t);
  if (!Number.isFinite(n) || n < 1 || n > 10 || !Number.isInteger(n * 2)) return { error: "RPE is 1 to 10." };
  return { rpe: n };
}

// " @ 8", " @ 8.5", or nothing
export const rpeSuffix = (rpe: number | null | undefined): string => (rpe == null ? "" : ` @ ${rpe}`);

// LOG-6: volume is the sum of weight × reps. A bodyweight lift counts only
// the weight added to it, as Hevy does for partial-bodyweight lifts; holds and
// cardio add nothing.
export const volume = (sets: readonly LoggedSet[]): number =>
  Math.round(sets.reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0));

// Total cardio distance, in km.
export const distanceKm = (sets: readonly LoggedSet[]): number =>
  sets.reduce((sum, s) => sum + (s.distanceM ?? 0), 0) / 1000;

export const kg = (n: number): string => n.toLocaleString("en-AU");
export const km = (n: number): string => n.toLocaleString("en-AU", { maximumFractionDigits: 2 });

// 90 -> "1:30", 3725 -> "1:02:05"
export function clock(totalS: number): string {
  const s = Math.max(0, Math.round(totalS));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

// minutes per km, "5:00"
export const pace = (durationS: number, distanceM: number): string => clock(durationS / (distanceM / 1000));

// One set the way a lifter writes it: "62.5 kg × 7", "BW + 10 kg × 8",
// "BW × 12", "1:30", "5 km · 25:00 · 5:00 /km". It goes by the fields that are
// filled, so a set logged before kinds existed still reads as it was entered.
// LB-2.16: with an RPE, " @ 8" follows the whole set ("100 kg × 5 @ 8",
// "5 km · 25:00 · 5:00 /km @ 8"); without, as before.
export function setLabel(s: LoggedSet): string {
  return bareLabel(s) + rpeSuffix(s.rpe);
}

function bareLabel(s: LoggedSet): string {
  if (s.distanceM !== null && s.durationS !== null) {
    return `${km(s.distanceM / 1000)} km · ${clock(s.durationS)} · ${pace(s.durationS, s.distanceM)} /km`;
  }
  if (s.durationS !== null) return clock(s.durationS);
  if (s.kind === "bodyweight") return s.weightKg ? `BW + ${s.weightKg} kg × ${s.reps}` : `BW × ${s.reps}`;
  return `${s.weightKg} kg × ${s.reps}`;
}

// Consecutive sets of one exercise. A lift that comes back after another one
// starts a new run, so the log stays in the order things were done.
export function runs<S extends LoggedSet>(sets: readonly S[]): { name: string; sets: S[] }[] {
  const out: { name: string; sets: S[] }[] = [];
  for (const s of sets) {
    const last = out.at(-1);
    if (last?.name === s.name) last.sets.push(s);
    else out.push({ name: s.name, sets: [s] });
  }
  return out;
}

// Every set of each exercise, in the order each was first done.
export function byExercise<S extends LoggedSet>(sets: readonly S[]): { name: string; sets: S[] }[] {
  const groups = new Map<string, S[]>();
  for (const s of sets) groups.set(s.name, [...(groups.get(s.name) ?? []), s]);
  return [...groups].map(([name, sets]) => ({ name, sets }));
}

// The best set of one exercise, by what its kind measures: the longest
// distance for cardio, the longest hold, the most reps on a bodyweight lift
// (added weight breaks a tie), the heaviest weight otherwise (reps break a
// tie). The earliest wins a full tie.
export function topSet<S extends LoggedSet>(sets: readonly S[]): S {
  return sets.reduce((best, s) => (beats(s, best) ? s : best));
}

// That ranking as a pair, bigger first then the tie-break
const score = (s: Omit<LoggedSet, "name">): [number, number] =>
  s.distanceM !== null
    ? [s.distanceM, -(s.durationS ?? 0)]
    : s.durationS !== null
      ? [s.durationS, 0]
      : s.kind === "bodyweight"
        ? [s.reps ?? 0, s.weightKg ?? 0]
        : [s.weightKg ?? 0, s.reps ?? 0];

// Whether one set is strictly better than another of the same exercise; a
// tie is not (GYM-17.1, F3: the same "Best" history shows)
function beats(s: Omit<LoggedSet, "name">, than: Omit<LoggedSet, "name">): boolean {
  const [a, b] = score(s);
  const [x, y] = score(than);
  return a > x || (a === x && b > y);
}

// The best set without the pace or RPE, for tight columns: "100 kg × 5",
// "5 km · 25:00". Warm-ups are left out unless there's nothing else (decided
// 4 Nov, D31: the Best line follows LB-2.10, and writes no RPE).
export function bestLabel(sets: readonly LoggedSet[]): string {
  const working = sets.filter(isWorking);
  const top = { ...topSet(working.length ? working : sets), rpe: null };
  if (top.distanceM !== null && top.durationS !== null) return `${km(top.distanceM / 1000)} km · ${clock(top.durationS)}`;
  return setLabel(top);
}

export const minutes = (fromMs: number, toMs: number): number => Math.max(1, Math.round((toMs - fromMs) / 60000));

// How a workout is named on history and its summary: a day label and a time
// range. Calendar dates in the server's time zone.
const DAY = 86_400_000;
export const midnight = (ms: number): number => new Date(ms).setHours(0, 0, 0, 0);
const fmt = (ms: number, o: Intl.DateTimeFormatOptions) => new Date(ms).toLocaleString("en-AU", o);

// "Today", "Yesterday", "Tue 6 Oct", or with the year if it isn't this one
export function dayLabel(ms: number, now = Date.now()): string {
  const ago = Math.round((midnight(now) - midnight(ms)) / DAY);
  if (ago === 0) return "Today";
  if (ago === 1) return "Yesterday";
  const year = new Date(ms).getFullYear() === new Date(now).getFullYear() ? undefined : "numeric";
  return fmt(ms, { weekday: "short", day: "numeric", month: "short", year }).replace(",", "");
}

// "Wed 4 Nov", always a date (never "Today"): a plan named after its day
// keeps meaning that day (LB-3.1)
export const dateLabel = (ms: number): string => fmt(ms, { weekday: "short", day: "numeric", month: "short" }).replace(",", "");

export const timeOfDay =(ms: number): string => fmt(ms, { hour: "numeric", minute: "2-digit" });

// ---------------------------------------------------------------------------
// LB-4: personal records. Worked out from stored sets every time they are
// shown, never stored, so an edit or a restart can't leave a stale mark
// (LB-4.9).

// LB-4.5 (D14): Epley, for 1 to 10 reps, rounded to 0.1 kg; none above 10.
export function e1rm(weightKg: number | null, reps: number | null): number | null {
  if (weightKg === null || reps === null || reps < 1 || reps > 10) return null;
  const raw = reps === 1 ? weightKg : weightKg * (1 + reps / 30);
  return Math.round(raw * 10) / 10;
}

export type RecordKey = "heaviest" | "e1rm" | "reps" | "added" | "hold" | "distance" | "time";

// The record types per kind (criteria Terms), in the order they're named.
export const RECORD_TYPES: Record<Kind, readonly RecordKey[]> = {
  weight: ["heaviest", "e1rm", "reps"],
  bodyweight: ["reps", "added"],
  duration: ["hold"],
  cardio: ["distance", "time"],
};

export const RECORD_NAMES: Record<RecordKey, string> = {
  heaviest: "heaviest",
  e1rm: "best e1RM",
  reps: "most reps",
  added: "heaviest added",
  hold: "longest hold",
  distance: "longest distance",
  time: "longest time",
};

// What a set measures for one record type, or null when it lacks the field
// (LB-4.6, LB-4.7).
export function recordValue(key: RecordKey, s: LoggedSet): number | null {
  switch (key) {
    case "heaviest":
      return s.reps !== null ? s.weightKg : null;
    case "e1rm":
      return e1rm(s.weightKg, s.reps);
    case "reps":
      return s.reps;
    case "added":
      return s.weightKg !== null && s.weightKg > 0 && s.reps !== null ? s.weightKg : null;
    case "hold":
      return s.distanceM === null ? s.durationS : null;
    case "distance":
      return s.distanceM;
    case "time":
      return s.distanceM !== null ? s.durationS : null;
  }
}

// How a record's value reads: "116.7 kg", "12 reps", "1:30", "5 km", "25:00"
export function recordText(key: RecordKey, v: number): string {
  if (key === "heaviest" || key === "e1rm" || key === "added") return `${kg(v)} kg`;
  if (key === "reps") return `${v} reps`;
  if (key === "distance") return `${km(v / 1000)} km`;
  return clock(v);
}

export type OrderedSet = LoggedSet & { id: number; exerciseId: number; completedAt: number };

// LB-4.1 to LB-4.4, LB-4.11: for every set of one person, the records it set
// when it was logged. A working set sets a record when it beats, strictly,
// every earlier working set of the same exercise that measured that type;
// the first set to measure a type sets nothing (D16). Pass all of the
// person's sets of the exercises shown, in any order.
export function recordsBySet(all: readonly OrderedSet[]): Map<number, RecordKey[]> {
  const out = new Map<number, RecordKey[]>();
  const best = new Map<string, number>();
  const ordered = [...all].sort((a, b) => a.completedAt - b.completedAt || a.id - b.id);
  for (const s of ordered) {
    if (!isWorking(s)) continue;
    const got: RecordKey[] = [];
    for (const key of RECORD_TYPES[s.kind]) {
      const v = recordValue(key, s);
      if (v === null) continue;
      const k = `${s.exerciseId}:${key}`;
      const prev = best.get(k);
      if (prev !== undefined && v > prev) got.push(key);
      if (prev === undefined || v > prev) best.set(k, v);
    }
    if (got.length) out.set(s.id, got);
  }
  return out;
}

// LB-5.2: the current record for each type of one exercise, with the set that
// holds it (the earliest to reach the value). A lone first set already holds
// the current best, though it was never marked as a record.
export function currentRecords<S extends OrderedSet>(kind: Kind, all: readonly S[]): { key: RecordKey; value: number; set: S }[] {
  const ordered = all.filter(isWorking).sort((a, b) => a.completedAt - b.completedAt || a.id - b.id);
  return RECORD_TYPES[kind].flatMap((key) => {
    let top: { value: number; set: S } | undefined;
    for (const s of ordered) {
      const v = recordValue(key, s);
      if (v !== null && (!top || v > top.value)) top = { value: v, set: s };
    }
    return top ? [{ key, ...top }] : [];
  });
}

// "New record: heaviest, best e1RM"
export const recordMark = (keys: readonly RecordKey[]): string =>
  `New record: ${keys.map((k) => RECORD_NAMES[k]).join(", ")}`;

// LB-5.3 (D19): what the chart plots for one workout's sets of an exercise,
// or null when nothing in it can be plotted.
export function chartValue(kind: Kind, sets: readonly LoggedSet[]): number | null {
  const key: RecordKey = kind === "weight" ? "e1rm" : kind === "bodyweight" ? "reps" : kind === "duration" ? "hold" : "distance";
  const vals = sets
    .filter(isWorking)
    .map((s) => recordValue(key, s))
    .filter((v): v is number => v !== null);
  return vals.length ? Math.max(...vals) : null;
}

// ---------------------------------------------------------------------------
// LB-6: weeks run Monday 00:00 to Monday 00:00 in the server's time zone
// (Australia/Sydney, D21), and a workout belongs to the week it started in.

export function monday(ms: number): number {
  const d = new Date(midnight(ms));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

const prevMonday = (m: number): number => {
  const d = new Date(m);
  d.setDate(d.getDate() - 7);
  return d.getTime();
};

// LB-6.5 (D22): consecutive weeks with a workout, ending with this week if it
// has one, else with last week. `starts` are the counted workouts' starts.
export function streak(starts: readonly number[], now = Date.now()): number {
  const weeks = new Set(starts.map(monday));
  let wk = monday(now);
  if (!weeks.has(wk)) wk = prevMonday(wk);
  let n = 0;
  while (weeks.has(wk)) {
    n++;
    wk = prevMonday(wk);
  }
  return n;
}

// "6:42 – 7:38 pm": the first am/pm goes when both match
export function timeRange(from: number, to: number): [string, string] {
  const a = timeOfDay(from);
  const b = timeOfDay(to);
  const suffix = (t: string) => t.slice(-2);
  return [suffix(a) === suffix(b) ? a.slice(0, -3) : a, b];
}
