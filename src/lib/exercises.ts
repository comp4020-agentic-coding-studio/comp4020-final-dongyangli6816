// The 16 seeded exercises, two per piece of equipment (LOG-2), from the
// equipment table in docs/product/spec-4-weeks.md. Ids are fixed so
// sets logged against them stay valid across deploys.
//
// The kind decides what a set records, the way Hevy and Strong split their
// exercise types (docs/adr/0002-exercise-kinds.md):
//   weight      weight × reps
//   bodyweight  reps, plus any weight added to the body (usually 0)
//   duration    a hold, in seconds
//   cardio      a distance and the time it took
// defaultRestS is the rest timer's first value for a lift; after that the
// person's own last choice for it wins (LOG-4). Cardio starts no rest timer.
export type Kind = "weight" | "bodyweight" | "duration" | "cardio";

export const EXERCISES = [
  { id: 1, name: "Run", equipment: "treadmill", kind: "cardio", defaultRestS: 0 },
  { id: 2, name: "Incline walk", equipment: "treadmill", kind: "cardio", defaultRestS: 0 },
  { id: 3, name: "Bench press", equipment: "flat-bench", kind: "weight", defaultRestS: 150 },
  { id: 4, name: "Incline bench press", equipment: "flat-bench", kind: "weight", defaultRestS: 120 },
  { id: 5, name: "Back squat", equipment: "squat-rack", kind: "weight", defaultRestS: 180 },
  { id: 6, name: "Overhead press", equipment: "squat-rack", kind: "weight", defaultRestS: 150 },
  { id: 7, name: "Dumbbell curl", equipment: "dumbbell-rack", kind: "weight", defaultRestS: 60 },
  { id: 8, name: "Lateral raise", equipment: "dumbbell-rack", kind: "weight", defaultRestS: 60 },
  { id: 9, name: "Deadlift", equipment: "lifting-platform", kind: "weight", defaultRestS: 180 },
  { id: 10, name: "Romanian deadlift", equipment: "lifting-platform", kind: "weight", defaultRestS: 120 },
  { id: 11, name: "Pull-up", equipment: "pull-up-bar", kind: "bodyweight", defaultRestS: 120 },
  { id: 12, name: "Hanging leg raise", equipment: "pull-up-bar", kind: "bodyweight", defaultRestS: 60 },
  { id: 13, name: "Lat pulldown", equipment: "cable-machine", kind: "weight", defaultRestS: 90 },
  { id: 14, name: "Seated cable row", equipment: "cable-machine", kind: "weight", defaultRestS: 90 },
  { id: 15, name: "Push-ups", equipment: "exercise-mat", kind: "bodyweight", defaultRestS: 60 },
  { id: 16, name: "Plank", equipment: "exercise-mat", kind: "duration", defaultRestS: 60 },
] as const satisfies readonly { id: number; name: string; equipment: string; kind: Kind; defaultRestS: number }[];

export type Exercise = (typeof EXERCISES)[number];

export const exerciseById = (id: number): Exercise | undefined => EXERCISES.find((e) => e.id === id);
