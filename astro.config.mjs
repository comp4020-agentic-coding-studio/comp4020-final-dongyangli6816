import node from "@astrojs/node";
import { defineConfig } from "astro/config";

// Every page is rendered on the server per request: the app's state lives in
// SQLite on /data, so there is nothing to prerender. Astro's origin check
// (on by default) refuses cross-site form POSTs.
//
// Fly's proxy terminates TLS, so the app sees plain http and the browser's
// `Origin: https://...` never matches. Astro only trusts X-Forwarded-Proto and
// X-Forwarded-Host for hosts listed here, so list the deployed one.
export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  server: { host: true, port: Number(process.env.PORT ?? 8080) },
  trailingSlash: "ignore",
  security: {
    allowedDomains: [
      { hostname: "comp4020-final-dongyangli6816.fly.dev", protocol: "https" },
    ],
  },
});
