import type { APIRoute } from "astro";
import { subscribe } from "../../../lib/realtime.ts";
import { isMember } from "../../../lib/rooms.ts";

// GYM-13: the room as a stream of Server-Sent Events, one `room` event with
// everyone in it after every change. Only members can open it; anyone else
// gets the same 404 as the room page, so the room's existence stays hidden.
export const GET: APIRoute = ({ params, locals, request }) => {
  const roomId = Number(params.id);
  if (!locals.user || !Number.isInteger(roomId) || !isMember(roomId, locals.user.id)) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(subscribe(roomId, locals.user.id, request.signal), {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
};
