import type { APIRoute } from "astro";
import { endSession } from "../lib/auth.ts";
import { log, who } from "../lib/log.ts";

export const POST: APIRoute = ({ cookies, locals, redirect }) => {
  endSession(cookies);
  if (locals.user) log("signout", who(locals.user));
  return redirect("/", 303);
};
