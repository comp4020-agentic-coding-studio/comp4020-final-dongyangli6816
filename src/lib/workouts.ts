import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "./db.ts";
import type { Exercise, Kind } from "./exercises.ts";
import { exercises, rooms, sets, workouts } from "./schema.ts";

export const MAX_REST_S = 600;

// What one set records. Which fields are filled depends on the exercise's
// kind (exercises.ts); the rest are null.
export type SetValues = {
  weightKg: number | null;
  reps: number | null;
  durationS: number | null;
  distanceM: number | null;
};

// LOG-3, per kind: reads a set form into values, or says which field is wrong.
// Field names are the form's: weight_kg, reps, minutes, seconds, distance_km.
export function readSet(kind: Kind, form: FormData): { values: SetValues } | { error: string; field: string } {
  const num = (name: string) => Number(form.get(name) ?? "");
  const blank = (name: string) => String(form.get(name) ?? "").trim() === "";
  const empty: SetValues = { weightKg: null, reps: null, durationS: null, distanceM: null };

  if (kind === "weight" || kind === "bodyweight") {
    // added weight on a bodyweight lift is optional
    const weightKg = kind === "bodyweight" && blank("weight_kg") ? 0 : num("weight_kg");
    const reps = num("reps");
    if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > 1000) {
      return { error: kind === "weight" ? "Weight is 0 to 1000 kg." : "Added weight is 0 to 1000 kg.", field: "weight_kg" };
    }
    if (!Number.isInteger(reps) || reps < 1 || reps > 1000) return { error: "Reps is a whole number from 1.", field: "reps" };
    return { values: { ...empty, weightKg, reps } };
  }

  const minutes = blank("minutes") ? 0 : num("minutes");
  const seconds = blank("seconds") ? 0 : num("seconds");
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 600) return { error: "Minutes is 0 to 600.", field: "minutes" };
  if (!Number.isInteger(seconds) || seconds < 0 || seconds > 59) return { error: "Seconds is 0 to 59.", field: "seconds" };
  const durationS = minutes * 60 + seconds;
  if (durationS < 1) return { error: "Time is at least 1 second.", field: "minutes" };
  if (kind === "duration") return { values: { ...empty, durationS } };

  const km = num("distance_km");
  if (!Number.isFinite(km) || km < 0.01 || km > 1000) return { error: "Distance is 0.01 to 1000 km.", field: "distance_km" };
  return { values: { ...empty, durationS, distanceM: Math.round(km * 1000) } };
}

// LOG-1: a workout belongs to one person and, optionally, the room it was done
// in. Logging a set uses the person's open workout there, or starts one.
function openWorkout(userId: number, roomId: number): number {
  const open = openWorkoutId(userId, roomId);
  if (open) return open;
  return db.insert(workouts).values({ userId, roomId, startedAt: Date.now() }).returning({ id: workouts.id }).get().id;
}

export function openWorkoutId(userId: number, roomId: number): number | undefined {
  return db
    .select({ id: workouts.id })
    .from(workouts)
    .where(and(eq(workouts.userId, userId), eq(workouts.roomId, roomId), isNull(workouts.endedAt)))
    .get()?.id;
}

// LOG-4: the rest after a set starts from the person's last choice for that
// exercise, or the exercise's default the first time.
export function logSet(userId: number, roomId: number, exercise: Exercise, values: SetValues): void {
  const now = Date.now();
  db.transaction(() => {
    const workoutId = openWorkout(userId, roomId);
    const restTargetS = lastSet(userId, exercise.id)?.restTargetS ?? exercise.defaultRestS;
    db.insert(sets)
      .values({ workoutId, exerciseId: exercise.id, ...values, completedAt: now, restTargetS })
      .run();
    db.update(rooms).set({ lastActiveAt: now }).where(eq(rooms.id, roomId)).run();
  });
}

// The person's newest set in their open workout here: the one whose rest is
// running, if any.
function latestOpenSet(userId: number, roomId: number) {
  return db
    .select({ id: sets.id, restTargetS: sets.restTargetS, completedAt: sets.completedAt })
    .from(sets)
    .innerJoin(workouts, eq(workouts.id, sets.workoutId))
    .where(and(eq(workouts.userId, userId), eq(workouts.roomId, roomId), isNull(workouts.endedAt)))
    .orderBy(desc(sets.completedAt), desc(sets.id))
    .get();
}

// ±15 s moves the rest target (and so the next set's starting rest); skip
// ends this rest without changing what is remembered.
export function adjustRest(userId: number, roomId: number, delta: "-15" | "15" | "skip"): void {
  const latest = latestOpenSet(userId, roomId);
  if (!latest) return;
  if (delta === "skip") {
    db.update(sets).set({ restEndedAt: Date.now() }).where(eq(sets.id, latest.id)).run();
    return;
  }
  const restTargetS = Math.min(MAX_REST_S, Math.max(0, latest.restTargetS + Number(delta)));
  db.update(sets).set({ restTargetS, restEndedAt: null }).where(eq(sets.id, latest.id)).run();
}

// LOG-8: only a set in the person's open workout in this room can be changed
// here, so an id from someone else's workout does nothing.
function ownOpenSet(userId: number, roomId: number, setId: number) {
  return db
    .select({ id: sets.id, exerciseId: sets.exerciseId })
    .from(sets)
    .innerJoin(workouts, eq(workouts.id, sets.workoutId))
    .where(and(eq(sets.id, setId), eq(workouts.userId, userId), eq(workouts.roomId, roomId), isNull(workouts.endedAt)))
    .get();
}

export function setToEdit(userId: number, roomId: number, setId: number) {
  const own = ownOpenSet(userId, roomId, setId);
  if (!own) return undefined;
  return db.select().from(sets).where(eq(sets.id, own.id)).get();
}

export function editSet(userId: number, roomId: number, setId: number, values: SetValues): boolean {
  if (!ownOpenSet(userId, roomId, setId)) return false;
  db.update(sets).set(values).where(eq(sets.id, setId)).run();
  return true;
}

export function deleteSet(userId: number, roomId: number, setId: number): boolean {
  if (!ownOpenSet(userId, roomId, setId)) return false;
  db.delete(sets).where(eq(sets.id, setId)).run();
  return true;
}

// Ends the person's open workout in a room. A workout with no sets left in it
// is removed rather than kept as an empty page of the logbook. Returns the id
// of the finished workout, or undefined when there was nothing to keep.
export function finishWorkout(userId: number, roomId: number): number | undefined {
  return db.transaction((tx) => {
    const open = tx
      .select({ id: workouts.id })
      .from(workouts)
      .where(and(eq(workouts.userId, userId), eq(workouts.roomId, roomId), isNull(workouts.endedAt)))
      .get();
    if (!open) return undefined;
    const hasSets = tx.select({ id: sets.id }).from(sets).where(eq(sets.workoutId, open.id)).get();
    if (!hasSets) {
      tx.delete(workouts).where(eq(workouts.id, open.id)).run();
      return undefined;
    }
    tx.update(workouts).set({ endedAt: Date.now() }).where(eq(workouts.id, open.id)).run();
    return open.id;
  });
}

// LOG-3: a set form pre-fills from the person's last set of that exercise.
export function lastSet(userId: number, exerciseId: number) {
  return db
    .select({
      weightKg: sets.weightKg,
      reps: sets.reps,
      durationS: sets.durationS,
      distanceM: sets.distanceM,
      restTargetS: sets.restTargetS,
    })
    .from(sets)
    .innerJoin(workouts, eq(workouts.id, sets.workoutId))
    .where(and(eq(workouts.userId, userId), eq(sets.exerciseId, exerciseId)))
    .orderBy(desc(sets.completedAt), desc(sets.id))
    .get();
}

const setColumns = {
  id: sets.id,
  workoutId: sets.workoutId,
  exerciseId: sets.exerciseId,
  name: exercises.name,
  kind: exercises.kind,
  weightKg: sets.weightKg,
  reps: sets.reps,
  durationS: sets.durationS,
  distanceM: sets.distanceM,
  completedAt: sets.completedAt,
  restTargetS: sets.restTargetS,
  restEndedAt: sets.restEndedAt,
};

export function setsInOpenWorkout(userId: number, roomId: number) {
  return db
    .select(setColumns)
    .from(sets)
    .innerJoin(workouts, eq(workouts.id, sets.workoutId))
    .innerJoin(exercises, eq(exercises.id, sets.exerciseId))
    .where(and(eq(workouts.userId, userId), eq(workouts.roomId, roomId), isNull(workouts.endedAt)))
    .orderBy(sets.completedAt, sets.id)
    .all();
}

// The open workout's start, for the workout clock.
export function openWorkoutStart(userId: number, roomId: number): number | undefined {
  return db
    .select({ startedAt: workouts.startedAt })
    .from(workouts)
    .where(and(eq(workouts.userId, userId), eq(workouts.roomId, roomId), isNull(workouts.endedAt)))
    .get()?.startedAt;
}

function setsOf(workoutIds: number[]) {
  return db
    .select(setColumns)
    .from(sets)
    .innerJoin(exercises, eq(exercises.id, sets.exerciseId))
    .where(inArray(sets.workoutId, workoutIds))
    .orderBy(sets.completedAt, sets.id)
    .all();
}

// LOG-7: the person's workouts, newest first, each with its sets.
export function history(userId: number) {
  const list = db.select().from(workouts).where(eq(workouts.userId, userId)).orderBy(desc(workouts.startedAt)).all();
  if (list.length === 0) return [];
  const rows = setsOf(list.map((w) => w.id));
  return list.map((w) => ({ ...w, sets: rows.filter((r) => r.workoutId === w.id) }));
}

// LOG-6: one of the person's own workouts with its sets and the room it was
// in, or undefined for anyone else's.
export function workoutSummary(userId: number, workoutId: number) {
  const w = db
    .select({
      id: workouts.id,
      roomId: workouts.roomId,
      startedAt: workouts.startedAt,
      endedAt: workouts.endedAt,
      passcode: rooms.passcode,
      roomClosedAt: rooms.closedAt,
    })
    .from(workouts)
    .leftJoin(rooms, eq(rooms.id, workouts.roomId))
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .get();
  return w && { ...w, sets: setsOf([w.id]) };
}
