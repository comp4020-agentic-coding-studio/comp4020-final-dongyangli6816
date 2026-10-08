import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// The data model in docs/product/spec-4-weeks.md, as far as it is built.
// stations, interactions and messages arrive with the gym (weeks 10–11).
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
