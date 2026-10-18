# ADR 0006: Who can see and change what

Status: accepted, 17 Oct 2026. Draft by the agent; edit before citing.

## Context

This is the access decision for Crit 10. Two people open Spotter from its
URL in separate browsers, and the app has to tell them apart, decide on the
server what each may see and change, and leave a log of who did what that
can be read without touching the app.

Spotter is a semi-private gym: no public rooms, a passcode to get in, a
squad of friends inside (README, "What I read and looked at"). Inside a room
the point is to be seen: everyone's avatar and state are on every screen
(GYM-13), so the squad knows who is resting too long. Outside a room the
point is the opposite: a person's logbook is theirs.

So there are two questions: what counts as a person, and, for each thing
the app stores, who may see it and who may change it.

## Options

1. **Accounts, with rights by ownership and room membership.** A person is
   an email account. Everything a person makes (sets, workouts, their look)
   belongs to them; a room is shared by whoever is in it now; the host has
   one extra right.
2. **Anonymous browsers.** A person is a cookie handed out on first visit,
   with a display name and no password. Quicker to get in, but history
   (LOG-7) would be lost with the cookie, and the crit's second browser
   would be a new person every time it cleared its storage.
3. **Accounts with roles** (admin, member, viewer). Nothing in the spec needs
   a role beyond host, and every extra role is another rule to get wrong.

## Decision

Option 1.

**A person is an email account** (ACC-1). The session cookie `sid` holds a
random token whose hash is stored server-side (`src/lib/auth.ts`); the
middleware turns it into `locals.user` once per request, and every page and
endpoint takes the user from there, never from the form or the URL. There
are no guests. Dony (BOT-1 to 5) is not a person: he has no account, holds
no rights and appears in no logbook.

**Who can see and change what:**

| Thing | Who sees it | Who changes it | Enforced at |
| --- | --- | --- | --- |
| A room: who's in, their states, stations | Its members now | Members, through their own actions | `isMember` at `src/pages/rooms/[id].astro:65` and `src/pages/rooms/[id]/events.ts:11` |
| A room's live stream | Its members now, for as long as they are members | — | Hung up on leave, close and sign-out; re-checked every 20 s at `src/lib/realtime.ts:109` |
| Ending a room | — | Its host only | `src/lib/rooms.ts:113`, answered with 403 |
| A set | Its owner (and the room sees what they're lifting) | Its owner, while the workout is open | `ownOpenSet` at `src/lib/workouts.ts:108`, which matches set, owner, room and an open workout in one query |
| A finished workout, history | Its owner only | Nobody (it's a record) | `src/lib/workouts.ts:221` and `:241` |
| A person's look | Everyone in a room with them | The person | `saveLook(user.id, …)` in `src/pages/avatar.astro` |
| A room's passcode | Its members | — | Shown only on the room page, behind `isMember` |

**Someone outside a room can't tell it exists.** A non-member asking for a
room, its stream or someone else's workout gets the same 404 as for one
that doesn't exist, and a wrong passcode gets one generic message (ROOM-2).

**Every check is on the server.** The pages hide what you can't do, but
hiding isn't the protection: a hand-made POST with another person's
`set_id`, or a non-host posting `action=end`, is refused by the lines above.

**Guessing is limited** (`src/lib/limit.ts`): ten wrong passwords per email
and address in 15 minutes, and ten wrong passcodes per account a minute
(ROOM-7), then 429. Only failures count.

**Who did what is logged** (OPS-1, OPS-2; `src/lib/log.ts`). Every request
and every action leaves one JSON line on stdout with the person's id and
display name, which Fly keeps and `flyctl logs` shows. Refusals are logged
too (`room.denied`, `set.denied`, `room.end_denied`, `workout.denied`,
`stream.denied`, `signin_limited`), so a refused attempt is visible, not
just a missing success. Logs never hold a password, session token, passcode
or full email address; a failed sign-in shows the email masked
(`m***@anu.edu.au`), and an invite's path is logged as `/join/[code]`.

## Consequences

- **Checked over HTTP**, against the running app:
  - someone else's set can't be edited or deleted, and someone else's
    workout summary is a 404 (`spec/logging.test.ts`);
  - a non-member can't see a room or open its stream
    (`spec/core-loop.test.ts`, `spec/realtime.test.ts`);
  - only the host can end a room (`spec/rooms.test.ts`);
  - `spec/access.test.ts`: `next` can't send you off-site after signing in;
    a stream ends when its person leaves, the room is ended, or they sign
    out; and both limits.

  The three stream tests fail against the code before this decision, which
  only checked membership when a stream opened.
- **Signing out hangs up on every one of that person's streams**, including
  ones on their other devices. Those reconnect within 2 seconds with their
  own cookie, so it barely shows.
- **The limits live in memory.** A restart forgets them, which only ever
  helps the person trying; on one small machine that is acceptable.
- **Known gaps, accepted for now:**
  - Sign-up says an email is taken, which tells someone that it has an
    account; sign-in is careful not to. Fixing it needs email confirmation,
    which Spotter doesn't have.
  - An invite link joins whoever opens it on a GET (ROOM-3), so a link
    posted somewhere can pull a signed-in person into a room. That is the
    point of an invite, and joining a room only costs leaving it.
  - A person can be in two open rooms at once, but has one presence row, so
    acting in one moves their avatar out of the other.
  - A host who leaves stays host; the room can then only be ended by
    emptying or idling out (ROOM-6).
- **Not covered by a test:** what the log lines say. The HTTP tests can't
  read the server's output, so the lines were checked by hand, by two people
  in two browsers with `flyctl logs` open (see `PROCESS.md`).
