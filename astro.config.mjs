import node from "@astrojs/node";
import { defineConfig } from "astro/config";

// Every page is rendered on the server per request: the app's state lives in
// SQLite on /data, so there is nothing to prerender. Astro's origin check
// (on by default) refuses cross-site form POSTs.
export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  server: { host: true, port: Number(process.env.PORT ?? 8080) },
  trailingSlash: "ignore",
});
