import type { APIRoute } from "astro";
import { endSession } from "../lib/auth.ts";
import { log, who } from "../lib/log.ts";
import { dropUser } from "../lib/realtime.ts";

export const POST: APIRoute = ({ cookies, locals, redirect }) => {
  endSession(cookies);
  if (locals.user) {
    log("signout", who(locals.user));
    // a room left open in another tab stops showing it; that tab reconnects
    // with its own cookie, if it still has one
    dropUser(locals.user.id);
  }
  return redirect("/", 303);
};
