import { defineMiddleware } from "astro:middleware";
import { currentUser } from "./lib/auth.ts";
import { sweepIdleRooms } from "./lib/rooms.ts";

// Resolves the session cookie to a user once per request, and closes rooms
// that have sat idle for four hours (ROOM-6; throttled inside).
export const onRequest = defineMiddleware((context, next) => {
  context.locals.user = currentUser(context.cookies);
  sweepIdleRooms();
  return next();
});
