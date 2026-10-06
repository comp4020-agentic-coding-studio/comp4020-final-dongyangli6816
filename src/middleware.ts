import { defineMiddleware } from "astro:middleware";
import { currentUser } from "./lib/auth.ts";

// Resolves the session cookie to a user once per request.
export const onRequest = defineMiddleware((context, next) => {
  context.locals.user = currentUser(context.cookies);
  return next();
});
