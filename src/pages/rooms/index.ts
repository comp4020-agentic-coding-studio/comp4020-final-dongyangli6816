import type { APIRoute } from "astro";
import { createRoom } from "../../lib/rooms.ts";

export const POST: APIRoute = ({ locals, redirect }) => {
  if (!locals.user) return redirect("/signin", 303);
  const room = createRoom(locals.user.id);
  return redirect(`/rooms/${room.id}`, 303);
};
