import Database from "better-sqlite3";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { EXERCISES } from "./exercises.ts";
import * as schema from "./schema.ts";

// One SQLite file on the volume (/data in the container, ./data locally): the
// only storage that survives a restart. Opened, migrated and seeded once per
// process, so a cold start on a fresh volume builds everything it needs.
const dataDir = process.env.DATA_DIR ?? "./data";
mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(join(dataDir, "spotter.db"));
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

migrate(db, { migrationsFolder: process.env.MIGRATIONS_DIR ?? "./drizzle" });
// upserted, so a deploy that changes an exercise's kind or rest updates it
db.insert(schema.exercises)
  .values([...EXERCISES])
  .onConflictDoUpdate({
    target: schema.exercises.id,
    set: {
      name: sql`excluded.name`,
      equipment: sql`excluded.equipment`,
      kind: sql`excluded.kind`,
      defaultRestS: sql`excluded.default_rest_s`,
    },
  })
  .run();
