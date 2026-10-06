import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "./db.ts";
import { exercises, sets, workouts } from "./schema.ts";

export const DEFAULT_REST_S = 90; // LOG-4

// LOG-1: a workout belongs to one person and, optionally, the room it was done
// in. Logging a set uses the person's open workout there, or starts one.
function openWorkout(userId: number, roomId: number): number {
  const open = db
    .select({ id: workouts.id })
    .from(workouts)
    .where(and(eq(workouts.userId, userId), eq(workouts.roomId, roomId), isNull(workouts.endedAt)))
    .get();
  if (open) return open.id;
  return db.insert(workouts).values({ userId, roomId, startedAt: Date.now() }).returning({ id: workouts.id }).get().id;
}

export function logSet(userId: number, roomId: number, exerciseId: number, weightKg: number, reps: number): void {
  db.transaction(() => {
    const workoutId = openWorkout(userId, roomId);
    db.insert(sets)
      .values({ workoutId, exerciseId, weightKg, reps, completedAt: Date.now(), restTargetS: DEFAULT_REST_S })
      .run();
  });
}

export function finishWorkout(userId: number, roomId: number): void {
  db.update(workouts)
    .set({ endedAt: Date.now() })
    .where(and(eq(workouts.userId, userId), eq(workouts.roomId, roomId), isNull(workouts.endedAt)))
    .run();
}

// LOG-3: weight and reps pre-fill from the person's last set of that exercise.
export function lastSet(userId: number, exerciseId: number): { weightKg: number; reps: number } | undefined {
  return db
    .select({ weightKg: sets.weightKg, reps: sets.reps })
    .from(sets)
    .innerJoin(workouts, eq(workouts.id, sets.workoutId))
    .where(and(eq(workouts.userId, userId), eq(sets.exerciseId, exerciseId)))
    .orderBy(desc(sets.completedAt), desc(sets.id))
    .get();
}

export function setsInOpenWorkout(userId: number, roomId: number) {
  return db
    .select({ name: exercises.name, weightKg: sets.weightKg, reps: sets.reps, completedAt: sets.completedAt })
    .from(sets)
    .innerJoin(workouts, eq(workouts.id, sets.workoutId))
    .innerJoin(exercises, eq(exercises.id, sets.exerciseId))
    .where(and(eq(workouts.userId, userId), eq(workouts.roomId, roomId), isNull(workouts.endedAt)))
    .orderBy(sets.completedAt, sets.id)
    .all();
}

// LOG-7: the person's workouts, newest first, each with its sets.
export function history(userId: number) {
  const list = db.select().from(workouts).where(eq(workouts.userId, userId)).orderBy(desc(workouts.startedAt)).all();
  if (list.length === 0) return [];
  const rows = db
    .select({ workoutId: sets.workoutId, name: exercises.name, weightKg: sets.weightKg, reps: sets.reps })
    .from(sets)
    .innerJoin(exercises, eq(exercises.id, sets.exerciseId))
    .where(inArray(sets.workoutId, list.map((w) => w.id)))
    .orderBy(sets.completedAt, sets.id)
    .all();
  return list.map((w) => ({ ...w, sets: rows.filter((r) => r.workoutId === w.id) }));
}
