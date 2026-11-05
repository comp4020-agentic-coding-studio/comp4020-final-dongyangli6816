import { sql } from "drizzle-orm";
import { type AnySQLiteColumn, index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// The data model in docs/product/spec-4-weeks.md, as far as it is built.
// Interactions and messages arrived with INT (week 12).
// Times are Unix milliseconds.

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // stored lowercased, so uniqueness is case-insensitive (ACC-1)
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  // AV-1: the look, as JSON (src/sprites/avatar.ts); never an image. Null
  // for accounts from before avatars, which get one rolled on first read.
  avatar: text("avatar"),
  createdAt: integer("created_at").notNull(),
});

// The cookie holds the raw token; only its SHA-256 hash is stored (ACC-3).
export const authSessions = sqliteTable("auth_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
});

export const rooms = sqliteTable(
  "rooms",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    passcode: text("passcode").notNull(),
    hostUserId: integer("host_user_id").notNull().references(() => users.id),
    createdAt: integer("created_at").notNull(),
    lastActiveAt: integer("last_active_at").notNull(),
    closedAt: integer("closed_at"),
    // BOT-1, BOT-4: Dony's poster. He is out while the last summon is newer
    // than the last send back; everything he does follows from these (dony.ts)
    donySummonedAt: integer("dony_summoned_at"),
    donySummonedBy: integer("dony_summoned_by").references(() => users.id),
    donySentBackAt: integer("dony_sent_back_at"),
  },
  // a passcode is unique among open rooms only, so closed rooms free theirs (ROOM-1, ROOM-6)
  (t) => [uniqueIndex("rooms_open_passcode").on(t.passcode).where(sql`closed_at is null`)],
);

export const roomMembers = sqliteTable(
  "room_members",
  {
    roomId: integer("room_id").notNull().references(() => rooms.id),
    userId: integer("user_id").notNull().references(() => users.id),
    joinedAt: integer("joined_at").notNull(),
    leftAt: integer("left_at"),
    lastSeenAt: integer("last_seen_at").notNull(),
  },
  (t) => [uniqueIndex("room_members_pk").on(t.roomId, t.userId)],
);

export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  equipment: text("equipment").notNull(),
  // which numbers a set of it records; see EXERCISES in exercises.ts
  kind: text("kind", { enum: ["weight", "bodyweight", "duration", "cardio"] }).notNull().default("weight"),
  defaultRestS: integer("default_rest_s").notNull().default(90),
});

export const workouts = sqliteTable(
  "workouts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id),
    roomId: integer("room_id").references(() => rooms.id),
    startedAt: integer("started_at").notNull(),
    endedAt: integer("ended_at"),
    // LB-3: the plan loaded in this workout, while it's open. A reference, not
    // a copy, so renaming or deleting the plan shows at once (LB-3.22)
    planId: integer("plan_id").references((): AnySQLiteColumn => plans.id, { onDelete: "set null" }),
    // LB-3.4: the plan this finished workout was saved as, so it's saved once
    savedPlanId: integer("saved_plan_id").references((): AnySQLiteColumn => plans.id, { onDelete: "set null" }),
  },
  (t) => [index("workouts_user").on(t.userId, t.startedAt)],
);

export const sets = sqliteTable(
  "sets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workoutId: integer("workout_id").notNull().references(() => workouts.id),
    exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
    // the exercise's kind decides which of these four are filled: weight and
    // reps (weight added to bodyweight for a bodyweight lift), a duration, or
    // a distance and a duration
    weightKg: real("weight_kg"),
    reps: integer("reps"),
    durationS: integer("duration_s"),
    distanceM: integer("distance_m"),
    completedAt: integer("completed_at").notNull(),
    restTargetS: integer("rest_target_s").notNull(),
    // set when the rest after this set was skipped; the target stays as the
    // rest to start with next time
    restEndedAt: integer("rest_ended_at"),
    slackS: integer("slack_s"),
    // LB-2: null on sets from before types and RPE, which read as normal sets
    // with no RPE everywhere (LB-0.3)
    setType: text("set_type", { enum: ["normal", "warmup", "failure"] }),
    rpe: real("rpe"),
  },
  (t) => [index("sets_workout").on(t.workoutId)],
);

// What each person is doing in the gym right now (GYM-9, GYM-12): one row per
// person, written when they choose a lift or finish, removed when they leave.
// No row means Idle. Resting and Slacking are not stored here: they follow
// from the newest set's completed_at and rest_target_s, which the rest
// buttons already change, so there is one place a rest is kept (presence.ts).
export const presence = sqliteTable("presence", {
  userId: integer("user_id").primaryKey().references(() => users.id),
  roomId: integer("room_id").notNull().references(() => rooms.id),
  state: text("state", { enum: ["lifting", "finished"] }).notNull(),
  exerciseId: integer("exercise_id").references(() => exercises.id),
  stateStartedAt: integer("state_started_at").notNull(),
});

// GYM-3, GYM-8: the room's twelve stations, each holding at most one piece of
// equipment and at most one person. Seeded when the room is created, so a
// station is always a row and claiming one is an update (stations.ts).
export const stations = sqliteTable(
  "stations",
  {
    roomId: integer("room_id").notNull().references(() => rooms.id),
    slot: integer("slot").notNull(),
    equipment: text("equipment"),
    placedAt: integer("placed_at"),
    lastUsedAt: integer("last_used_at"),
    userId: integer("user_id").references(() => users.id),
  },
  (t) => [
    uniqueIndex("stations_pk").on(t.roomId, t.slot),
    // a person holds at most one station in a room: the database refuses a
    // second, whatever the code above it does (ADR 0004)
    uniqueIndex("stations_one_each").on(t.roomId, t.userId).where(sql`user_id is not null`),
  ],
);

// INT-1 to INT-4: one row per accepted Cheer, Poke or Slap. The 10 s limit
// (INT-4) and Dony's answers (BOT-6.7, BOT-6.8) are worked out from these
// rows' times, so both survive a restart. `to_user_id` is 0 for Dony (dony.ts),
// who is no user, so it carries no foreign key.
export const interactions = sqliteTable(
  "interactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    roomId: integer("room_id").notNull().references(() => rooms.id),
    fromUserId: integer("from_user_id").notNull().references(() => users.id),
    toUserId: integer("to_user_id").notNull(),
    // a reply (INT-9) is one of the last three; a High-five (INT-10) is the
    // offer, from the one who offered it
    kind: text("kind", { enum: ["cheer", "poke", "slap", "highfive", "thanks", "poke-back", "slap-back"] }).notNull(),
    // the target's state when it was accepted, which picks Poke's banner
    targetState: text("target_state").notNull(),
    createdAt: integer("created_at").notNull(),
    // a reply: the interaction it answers, at most one reply each (INT-9.6)
    answersId: integer("answers_id"),
    // a High-five: when it was accepted, so it happened (INT-10.6); an offer
    // with none is open for 10 s from created_at, then lapsed (INT-10.10).
    // Only its target accepts, so done_at is also their interaction with
    // the offerer, for the 10 s limit (F10).
    doneAt: integer("done_at"),
  },
  (t) => [
    index("interactions_room").on(t.roomId, t.createdAt),
    index("interactions_pair").on(t.fromUserId, t.toUserId, t.createdAt),
    uniqueIndex("interactions_one_reply").on(t.answersId).where(sql`answers_id is not null`),
  ],
);

// GYM-17: one row per set that was a personal best when it was logged.
// Stored, not worked out again later, so an edit or delete never takes back
// an announcement already made (R4) and the room log keeps it.
export const personalBests = sqliteTable(
  "personal_bests",
  {
    setId: integer("set_id").primaryKey(),
    roomId: integer("room_id").notNull().references(() => rooms.id),
    userId: integer("user_id").notNull().references(() => users.id),
    exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("personal_bests_room").on(t.roomId, t.createdAt)],
);

// INT-5: one row per accepted preset, addressed to one person (D8). Kept
// after the room closes, shown nowhere (D12). `body` stays empty until free
// text (INT-6); a preset is stored by its key.
export const messages = sqliteTable(
  "messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    roomId: integer("room_id").notNull().references(() => rooms.id),
    senderId: integer("sender_id").notNull().references(() => users.id),
    toUserId: integer("to_user_id").notNull(),
    presetKey: text("preset_key").notNull(),
    body: text("body"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("messages_room").on(t.roomId, t.createdAt), index("messages_sender").on(t.senderId, t.createdAt)],
);

// LB-2.19 to LB-2.27 (D4): one note per exercise per workout, private to its
// writer, shown again under Last time.
export const exerciseNotes = sqliteTable(
  "exercise_notes",
  {
    workoutId: integer("workout_id").notNull().references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
    body: text("body").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [uniqueIndex("exercise_notes_pk").on(t.workoutId, t.exerciseId)],
);

// LB-3 (D9, D12): a plan is made from a finished workout and holds its
// exercises in order, each with a number of sets. No target weights.
export const plans = sqliteTable(
  "plans",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id),
    name: text("name").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("plans_user").on(t.userId, t.createdAt)],
);

export const planExercises = sqliteTable(
  "plan_exercises",
  {
    planId: integer("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
    sets: integer("sets").notNull(),
  },
  (t) => [uniqueIndex("plan_exercises_pk").on(t.planId, t.position)],
);
