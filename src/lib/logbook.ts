// Numbers the pages derive from logged sets. Pure functions over what
// workouts.ts returns, so history, home, the summary and the gym agree on
// every figure.
import type { Kind } from "./exercises.ts";

export type LoggedSet = {
  name: string;
  kind: Kind;
  weightKg: number | null;
  reps: number | null;
  durationS: number | null;
  distanceM: number | null;
};

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
export function setLabel(s: LoggedSet): string {
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
  const score = (s: S): [number, number] =>
    s.distanceM !== null
      ? [s.distanceM, -(s.durationS ?? 0)]
      : s.durationS !== null
        ? [s.durationS, 0]
        : s.kind === "bodyweight"
          ? [s.reps ?? 0, s.weightKg ?? 0]
          : [s.weightKg ?? 0, s.reps ?? 0];
  return sets.reduce((best, s) => {
    const [a, b] = score(s);
    const [x, y] = score(best);
    return a > x || (a === x && b > y) ? s : best;
  });
}

// The best set without the pace, for tight columns: "100 kg × 5", "5 km · 25:00"
export function bestLabel(sets: readonly LoggedSet[]): string {
  const top = topSet(sets);
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

export const timeOfDay = (ms: number): string => fmt(ms, { hour: "numeric", minute: "2-digit" });

// "6:42 – 7:38 pm": the first am/pm goes when both match
export function timeRange(from: number, to: number): [string, string] {
  const a = timeOfDay(from);
  const b = timeOfDay(to);
  const suffix = (t: string) => t.slice(-2);
  return [suffix(a) === suffix(b) ? a.slice(0, -3) : a, b];
}
