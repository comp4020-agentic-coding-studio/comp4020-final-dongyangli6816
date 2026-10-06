import { defineConfig } from "drizzle-kit";

// `pnpm db:generate` writes SQL migrations into drizzle/; the app applies them
// at startup (src/lib/db.ts), so a fresh /data volume builds itself.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
});
