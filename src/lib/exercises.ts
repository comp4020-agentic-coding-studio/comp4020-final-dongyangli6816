// The 16 seeded exercises, two per piece of equipment (LOG-2), from the
// equipment table in docs/product/spec-4-weeks.md. Ids are fixed so
// sets logged against them stay valid across deploys.
export const EXERCISES = [
  { id: 1, name: "Run", equipment: "treadmill" },
  { id: 2, name: "Incline walk", equipment: "treadmill" },
  { id: 3, name: "Bench press", equipment: "flat-bench" },
  { id: 4, name: "Incline bench press", equipment: "flat-bench" },
  { id: 5, name: "Back squat", equipment: "squat-rack" },
  { id: 6, name: "Overhead press", equipment: "squat-rack" },
  { id: 7, name: "Dumbbell curl", equipment: "dumbbell-rack" },
  { id: 8, name: "Lateral raise", equipment: "dumbbell-rack" },
  { id: 9, name: "Deadlift", equipment: "lifting-platform" },
  { id: 10, name: "Romanian deadlift", equipment: "lifting-platform" },
  { id: 11, name: "Pull-up", equipment: "pull-up-bar" },
  { id: 12, name: "Hanging leg raise", equipment: "pull-up-bar" },
  { id: 13, name: "Lat pulldown", equipment: "cable-machine" },
  { id: 14, name: "Seated cable row", equipment: "cable-machine" },
  { id: 15, name: "Push-ups", equipment: "exercise-mat" },
  { id: 16, name: "Plank", equipment: "exercise-mat" },
] as const;
