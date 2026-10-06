import type { APIRoute } from "astro";
import { endSession } from "../lib/auth.ts";

export const POST: APIRoute = ({ cookies, redirect }) => {
  endSession(cookies);
  return redirect("/", 303);
};
