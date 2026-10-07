// Numbers the pages derive from logged sets. Pure functions over what
// workouts.ts returns, so history, home and the gym agree on every figure.

type LoggedSet = { name: string; weightKg: number; reps: number };

// LOG-6: volume is the sum of weight × reps; bodyweight sets add nothing.
export const volume = (sets: readonly LoggedSet[]): number =>
  Math.round(sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0));

export const kg = (n: number): string => n.toLocaleString("en-AU");

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

// The heaviest set; most reps breaks a tie, then the earliest.
export const topSet = <S extends LoggedSet>(sets: readonly S[]): S =>
  sets.reduce((best, s) => (s.weightKg > best.weightKg || (s.weightKg === best.weightKg && s.reps > best.reps) ? s : best));

// "Top 82.5 kg × 8", or "Best 12 reps" for bodyweight lifts.
export function topLabel(sets: readonly LoggedSet[]): string {
  const top = topSet(sets);
  return top.weightKg === 0 ? `Best ${top.reps} reps` : `Top ${top.weightKg} kg × ${top.reps}`;
}

export const minutes = (fromMs: number, toMs: number): number => Math.max(1, Math.round((toMs - fromMs) / 60000));
