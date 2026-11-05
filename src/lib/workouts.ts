import { and, asc, desc, eq, inArray, isNotNull, isNull, ne } from "drizzle-orm";
import { db } from "./db.ts";
import type { Exercise, Kind } from "./exercises.ts";
import { isSetType, isWorking, readRpe, recordsBySet, type SetType } from "./logbook.ts";
import { exerciseNotes, exercises, personalBests, planExercises, plans, rooms, sets, workouts } from "./schema.ts";

export const MAX_REST_S = 600;

// What one set records. Which fields are filled depends on the exercise's
// kind (exercises.ts); the rest are null.
export type SetValues = {
  weightKg: number | null;
  reps: number | null;
  durationS: number | null;
  distanceM: number | null;
};

// LB-2: how a set was done, beside what it measured
export type SetMarks = { setType: SetType; rpe: number | null };
export const NORMAL: SetMarks = { setType: "normal", rpe: null };

// LB-2.1, LB-2.7, LB-2.13, LB-2.14: a set form's type and RPE. A missing or
// empty type is Normal; an empty RPE is none.
export function readMarks(form: FormData): { marks: SetMarks } | { error: string; field: string } {
  const type = String(form.get("set_type") ?? "").trim() || "normal";
  if (!isSetType(type)) return { error: "Set type is Normal, Warm-up or Failure.", field: "set_type" };
  const rpe = readRpe(String(form.get("rpe") ?? ""));
  if ("error" in rpe) return { error: rpe.error, field: "rpe" };
  return { marks: { setType: type, rpe: rpe.rpe } };
}

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
// in. It starts when they walk into the room, so the workout clock counts the
// whole session, not just from the first set; logging a set uses it, or
// starts one if they finished and carried on. One that ends with no sets is
// removed (finishWorkout).
export function openWorkout(userId: number, roomId: number, at = Date.now()): number {
  const open = openWorkoutId(userId, roomId);
  if (open) return open;
  return db.insert(workouts).values({ userId, roomId, startedAt: at }).returning({ id: workouts.id }).get().id;
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
//
// GYM-17: whether the set is a personal best is decided in the same
// IMMEDIATE transaction that stores it, from the person's earlier sets as
// stored at that moment, so of two Dones at once only the first can be one
// (GYM-17.5), and Done costs no second request (GYM-17.10). Returns the
// set's id and whether it was a PB.
export function logSet(
  userId: number,
  roomId: number,
  exercise: Exercise,
  values: SetValues,
  marks: SetMarks = NORMAL,
): { id: number; pb: boolean } {
  const now = Date.now();
  return db.transaction(
    (tx) => {
      const workoutId = openWorkout(userId, roomId, now);
      const restTargetS = lastSet(userId, exercise.id)?.restTargetS ?? exercise.defaultRestS;
      const id = tx
        .insert(sets)
        .values({ workoutId, exerciseId: exercise.id, ...values, ...marks, completedAt: now, restTargetS })
        .returning({ id: sets.id })
        .get().id;
      // GYM-17 (settled 5 Nov with logbook D18): a personal best is a set
      // that sets at least one of the logbook's records, worked out the
      // logbook's way (LB-4: per record type, working sets only, the first
      // set of a type sets nothing), read in this transaction with the set
      const pb = recordsBySet(setsForRecords(userId, [exercise.id])).has(id);
      if (pb) tx.insert(personalBests).values({ setId: id, roomId, userId, exerciseId: exercise.id, createdAt: now }).run();
      tx.update(rooms).set({ lastActiveAt: now }).where(eq(rooms.id, roomId)).run();
      return { id, pb };
    },
    { behavior: "immediate" },
  );
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

export function editSet(userId: number, roomId: number, setId: number, values: SetValues, marks: SetMarks = NORMAL): boolean {
  if (!ownOpenSet(userId, roomId, setId)) return false;
  db.update(sets)
    .set({ ...values, ...marks })
    .where(eq(sets.id, setId))
    .run();
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
  setType: sets.setType,
  rpe: sets.rpe,
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

// LOG-7: the person's workouts, newest first, each with its sets. A workout
// still open with nothing logged yet isn't one to show.
export function history(userId: number) {
  const list = db.select().from(workouts).where(eq(workouts.userId, userId)).orderBy(desc(workouts.startedAt)).all();
  if (list.length === 0) return [];
  const rows = setsOf(list.map((w) => w.id));
  return list.map((w) => ({ ...w, sets: rows.filter((r) => r.workoutId === w.id) })).filter((w) => w.sets.length > 0);
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
  return w && { ...w, sets: setsOf([w.id]), notes: notesIn(w.id), savedPlan: savedPlanOf(w.id) };
}

// ---------------------------------------------------------------------------
// LB-4: every set the person has logged of these exercises, for working out
// which sets were records (logbook.ts recordsBySet). Records are never stored.
export function setsForRecords(userId: number, exerciseIds: readonly number[]) {
  if (exerciseIds.length === 0) return [];
  return db
    .select(setColumns)
    .from(sets)
    .innerJoin(workouts, eq(workouts.id, sets.workoutId))
    .innerJoin(exercises, eq(exercises.id, sets.exerciseId))
    .where(and(eq(workouts.userId, userId), inArray(sets.exerciseId, [...new Set(exerciseIds)])))
    .orderBy(sets.completedAt, sets.id)
    .all();
}

// LB-1.1, LB-1.3: the sets of an exercise from the person's previous session
// of it, the newest workout before this one that has a set of it (today's
// sets are never in Last time), with that workout's note for it (LB-1.4).
export function lastSession(userId: number, exerciseId: number, openWorkout?: number) {
  const prev = db
    .select({ workoutId: sets.workoutId, startedAt: workouts.startedAt })
    .from(sets)
    .innerJoin(workouts, eq(workouts.id, sets.workoutId))
    .where(
      and(
        eq(workouts.userId, userId),
        eq(sets.exerciseId, exerciseId),
        openWorkout === undefined ? undefined : ne(sets.workoutId, openWorkout),
      ),
    )
    .orderBy(desc(sets.completedAt), desc(sets.id))
    .get();
  if (!prev) return undefined;
  const rows = setsOf([prev.workoutId]).filter((s) => s.exerciseId === exerciseId);
  const note = notesIn(prev.workoutId).get(exerciseId);
  return { workoutId: prev.workoutId, startedAt: rows[0]?.completedAt ?? prev.startedAt, sets: rows, note };
}

// ---------------------------------------------------------------------------
// LB-2.19 to LB-2.27: exercise notes, one per exercise per workout.
export const MAX_NOTE = 140;

export function readNote(text: string): { note: string } | { error: string } {
  const note = text.trim();
  return [...note].length > MAX_NOTE ? { error: "Notes are up to 140 characters." } : { note };
}

// workout id -> exercise id -> note
export function notesOf(workoutIds: readonly number[]): Map<number, Map<number, string>> {
  const out = new Map<number, Map<number, string>>();
  if (workoutIds.length === 0) return out;
  for (const n of db.select().from(exerciseNotes).where(inArray(exerciseNotes.workoutId, [...workoutIds])).all()) {
    if (!out.has(n.workoutId)) out.set(n.workoutId, new Map());
    out.get(n.workoutId)!.set(n.exerciseId, n.body);
  }
  return out;
}

// One workout's notes, by exercise id
export const notesIn = (workoutId: number): Map<number, string> => notesOf([workoutId]).get(workoutId) ?? new Map();

// Saves (or, for "", removes) the note for an exercise in the person's open
// workout here. False when there's no set of it there yet (LB-2.19).
export function saveNote(userId: number, roomId: number, exerciseId: number, note: string): boolean {
  const workoutId = openWorkoutId(userId, roomId);
  if (!workoutId) return false;
  const has = db
    .select({ id: sets.id })
    .from(sets)
    .where(and(eq(sets.workoutId, workoutId), eq(sets.exerciseId, exerciseId)))
    .get();
  if (!has) return false;
  const key = and(eq(exerciseNotes.workoutId, workoutId), eq(exerciseNotes.exerciseId, exerciseId));
  if (note === "") db.delete(exerciseNotes).where(key).run();
  else
    db.insert(exerciseNotes)
      .values({ workoutId, exerciseId, body: note, updatedAt: Date.now() })
      .onConflictDoUpdate({ target: [exerciseNotes.workoutId, exerciseNotes.exerciseId], set: { body: note, updatedAt: Date.now() } })
      .run();
  return true;
}

// ---------------------------------------------------------------------------
// LB-3: plans.
export const MAX_PLANS = 20;
export const MAX_PLAN_NAME = 30;
const MAX_PLANNED_SETS = 10;

export function readPlanName(text: string, fallback?: string): { name: string } | { error: string } {
  const name = text.trim();
  if ([...name].length > MAX_PLAN_NAME) return { error: "Names are up to 30 characters." };
  if (name === "") return fallback === undefined ? { error: "Give it a name." } : { name: fallback };
  return { name };
}

const ownPlan = (userId: number, planId: number) =>
  Number.isInteger(planId)
    ? db.select().from(plans).where(and(eq(plans.id, planId), eq(plans.userId, userId))).get()
    : undefined;

function planItems(planIds: readonly number[]) {
  if (planIds.length === 0) return [];
  return db
    .select({ planId: planExercises.planId, exerciseId: planExercises.exerciseId, name: exercises.name, sets: planExercises.sets })
    .from(planExercises)
    .innerJoin(exercises, eq(exercises.id, planExercises.exerciseId))
    .where(inArray(planExercises.planId, [...planIds]))
    .orderBy(asc(planExercises.planId), asc(planExercises.position))
    .all();
}

// LB-3.8: newest first, each with its exercises in order
export function plansOf(userId: number) {
  const list = db.select().from(plans).where(eq(plans.userId, userId)).orderBy(desc(plans.createdAt), desc(plans.id)).all();
  const items = planItems(list.map((p) => p.id));
  return list.map((p) => ({ ...p, items: items.filter((i) => i.planId === p.id) }));
}

function savedPlanOf(workoutId: number) {
  return db
    .select({ id: plans.id, name: plans.name })
    .from(workouts)
    .innerJoin(plans, eq(plans.id, workouts.savedPlanId))
    .where(eq(workouts.id, workoutId))
    .get();
}

export type SavePlan =
  | { ok: true; planId: number; name: string }
  | { ok: false; reason: "not-found" | "open" | "only-warmups" | "full" };

// LB-3.1 to LB-3.7: a plan from one of the person's finished workouts: its
// exercises in the order first done, each with its working sets (at most
// 10); exercises with only warm-ups left out. Saved once (LB-3.4).
export function saveAsPlan(userId: number, workoutId: number, name: string): SavePlan {
  return db.transaction((tx) => {
    const w = tx
      .select()
      .from(workouts)
      .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
      .get();
    if (!w) return { ok: false, reason: "not-found" };
    if (w.endedAt === null) return { ok: false, reason: "open" };
    const saved = savedPlanOf(w.id);
    if (saved) return { ok: true, planId: saved.id, name: saved.name };
    const counts = new Map<number, number>();
    for (const s of setsOf([w.id])) {
      if (!counts.has(s.exerciseId)) counts.set(s.exerciseId, 0);
      if (isWorking(s)) counts.set(s.exerciseId, counts.get(s.exerciseId)! + 1);
    }
    const items = [...counts].filter(([, n]) => n > 0);
    if (items.length === 0) return { ok: false, reason: "only-warmups" };
    const have = tx.select({ id: plans.id }).from(plans).where(eq(plans.userId, userId)).all().length;
    if (have >= MAX_PLANS) return { ok: false, reason: "full" };
    const planId = tx.insert(plans).values({ userId, name, createdAt: Date.now() }).returning({ id: plans.id }).get().id;
    tx.insert(planExercises)
      .values(items.map(([exerciseId, n], i) => ({ planId, position: i + 1, exerciseId, sets: Math.min(n, MAX_PLANNED_SETS) })))
      .run();
    tx.update(workouts).set({ savedPlanId: planId }).where(eq(workouts.id, w.id)).run();
    return { ok: true, planId, name };
  });
}

export function renamePlan(userId: number, planId: number, name: string): boolean {
  if (!ownPlan(userId, planId)) return false;
  db.update(plans).set({ name }).where(eq(plans.id, planId)).run();
  return true;
}

// LB-3.9: deleting a plan unloads it wherever it's loaded and frees "Save as
// plan" on the workout it came from; no set changes.
export function deletePlan(userId: number, planId: number): boolean {
  if (!ownPlan(userId, planId)) return false;
  db.transaction((tx) => {
    tx.update(workouts).set({ planId: null }).where(eq(workouts.planId, planId)).run();
    tx.update(workouts).set({ savedPlanId: null }).where(eq(workouts.savedPlanId, planId)).run();
    tx.delete(planExercises).where(eq(planExercises.planId, planId)).run();
    tx.delete(plans).where(eq(plans.id, planId)).run();
  });
  return true;
}

// LB-3.12, LB-3.21: load a plan into the person's open workout here (opening
// one, as entering does), or clear it (planId null).
export function loadPlan(userId: number, roomId: number, planId: number | null): boolean {
  if (planId !== null && !ownPlan(userId, planId)) return false;
  const workoutId = openWorkout(userId, roomId);
  db.update(workouts).set({ planId }).where(eq(workouts.id, workoutId)).run();
  return true;
}

// LB-3.13 to LB-3.20: the plan loaded in the open workout here, each
// exercise with its done count (working sets in this workout, whenever
// logged), and Up next: the first in plan order that isn't done.
export function loadedPlan(userId: number, roomId: number) {
  const w = db
    .select({ id: workouts.id, planId: workouts.planId })
    .from(workouts)
    .where(and(eq(workouts.userId, userId), eq(workouts.roomId, roomId), isNull(workouts.endedAt), isNotNull(workouts.planId)))
    .get();
  if (!w?.planId) return undefined;
  const plan = db.select().from(plans).where(eq(plans.id, w.planId)).get();
  if (!plan) return undefined;
  const done = new Map<number, number>();
  for (const s of setsOf([w.id])) if (isWorking(s)) done.set(s.exerciseId, (done.get(s.exerciseId) ?? 0) + 1);
  const items = planItems([plan.id]).map((i) => ({ ...i, done: done.get(i.exerciseId) ?? 0 }));
  const next = items.find((i) => i.done < i.sets);
  return { id: plan.id, name: plan.name, items, next: next?.exerciseId, complete: !next };
}

// ---------------------------------------------------------------------------
// LB-5: every set of one exercise by the person, grouped by workout, newest
// workout first, with each workout's note for it.
export function exerciseLog(userId: number, exerciseId: number) {
  const rows = setsForRecords(userId, [exerciseId]);
  const ids = [...new Set(rows.map((r) => r.workoutId))];
  if (ids.length === 0) return [];
  const ws = db.select().from(workouts).where(inArray(workouts.id, ids)).orderBy(desc(workouts.startedAt)).all();
  const notes = notesOf(ids);
  return ws.map((w) => ({ ...w, sets: rows.filter((r) => r.workoutId === w.id), note: notes.get(w.id)?.get(exerciseId) }));
}

// LB-6.7: worked out from stored workouts each time; a workout counts once it
// has a set (LB-6.3).
export function workoutStarts(userId: number): number[] {
  return db
    .selectDistinct({ id: workouts.id, startedAt: workouts.startedAt })
    .from(workouts)
    .innerJoin(sets, eq(sets.workoutId, workouts.id))
    .where(eq(workouts.userId, userId))
    .all()
    .map((w) => w.startedAt);
}
