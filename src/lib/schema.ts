import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// The week-9 slice of the data model in docs/spotter-spec-4-weeks.md.
// presence, stations, interactions and messages arrive with the gym (weeks 10–11).
// Times are Unix milliseconds.

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // stored lowercased, so uniqueness is case-insensitive (ACC-1)
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
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
    weightKg: real("weight_kg").notNull(),
    reps: integer("reps").notNull(),
    completedAt: integer("completed_at").notNull(),
    restTargetS: integer("rest_target_s").notNull(),
    slackS: integer("slack_s"),
  },
  (t) => [index("sets_workout").on(t.workoutId)],
);
