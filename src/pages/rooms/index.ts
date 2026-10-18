import type { APIRoute } from "astro";
import { log, who } from "../../lib/log.ts";
import { createRoom } from "../../lib/rooms.ts";

export const POST: APIRoute = ({ locals, redirect }) => {
  if (!locals.user) return redirect("/signin", 303);
  const room = createRoom(locals.user.id);
  log("room.create", { ...who(locals.user), room: room.id });
  return redirect(`/rooms/${room.id}`, 303);
};
