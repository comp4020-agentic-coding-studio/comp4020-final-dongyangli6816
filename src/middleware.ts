import { defineMiddleware } from "astro:middleware";
import { currentUser } from "./lib/auth.ts";
import { log, logError, who } from "./lib/log.ts";
import { sweepIdleRooms } from "./lib/rooms.ts";

// Resolves the session cookie to a user once per request, and closes rooms
// that have sat idle for four hours (ROOM-6; throttled inside). Every request
// but README's images leaves one `http` line (OPS-1), and anything that
// throws leaves an `error` line before Astro answers 500.
export const onRequest = defineMiddleware(async (context, next) => {
  const started = Date.now();
  const user = (context.locals.user = currentUser(context.cookies));
  const { pathname } = context.url;
  // an invite's path is its passcode, which stays out of the logs
  const path = pathname.startsWith("/join/") ? "/join/[code]" : pathname;
  const fields = () => ({ ...who(user), method: context.request.method, path, ms: Date.now() - started });
  try {
    sweepIdleRooms();
    const response = await next();
    if (!pathname.startsWith("/docs/")) log("http", { ...fields(), status: response.status });
    return response;
  } catch (err) {
    logError("error", err, fields());
    throw err;
  }
});
