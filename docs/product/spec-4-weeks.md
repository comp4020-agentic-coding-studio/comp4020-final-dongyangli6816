# Spotter: four-week course spec

Oct 6, 2026 · @Dongyang · supersedes the scope (not the idea) of
`spec-mvp.md`

## What this document is

The MVP spec describes a product to run for a public user base over about 20
weeks. This document cuts it down to what one person can build, deploy and
argue for between **6 October and 9 November 2026**, inside the COMP8020 final
project's fixed setup. It keeps the core idea, drops everything that only
matters at launch scale, and ignores the MVP spec's stack entirely.

The idea it keeps is from `idea.md`: friends who can't train together any more
train "together" in a shared cartoon gym. Each person's avatar shows what they
are doing right now (lifting, resting or slacking), so the friend who keeps you
honest can see you rest too long and do something about it.

## Constraints from the course

These are fixed by the brief, `fly.toml`, the `Dockerfile` and `spec/README.md`,
and everything below has to fit them.

| Constraint | Consequence for Spotter |
| --- | --- |
| **Multi-user:** two or more people in their own browsers act on shared state, and the app tells them apart | Rooms with several members; every avatar belongs to one account |
| **Real-time:** a change shows up in every other open session within about a second, with no reload | Avatar states, equipment deliveries, interactions and messages are pushed to everyone in the room |
| **Persists:** what people do survives sessions, restarts and redeploys | Accounts, rooms, equipment layout, workouts, sets and each person's current state live in a database on the volume |
| One `shared-cpu-1x` machine with **256 MB** of memory | One small Node process; no game engine, no second service |
| One volume at **`/data`**, the only storage that survives a restart; no separate database server | SQLite file at `/data/spotter.db`; no Supabase, no Postgres |
| The machine **stops when idle** and starts on the next request | No state may live only in memory or in a timer; everything must be derivable from the database after a cold start |
| The app serves HTTP on `0.0.0.0:$PORT`; Fly terminates TLS | Plain HTTP server; cookies marked `Secure` work because the browser sees HTTPS |
| `/` answers 200; `/readme/` serves `README.md` in full, headings in the server-sent HTML | README rendered from Markdown on the server, never by client script |
| CI deploys every push to `main` once the repo is public, and a red check blocks the deploy | `pnpm check` must stay green on `main` |
| No email service in the course setup | No email verification and no password-reset emails |

## Who it's for

A **squad**: a small group of friends, two to eight people, who used to train
together and now train apart. One of them is usually the disciplined one (the
"Anchor" in the MVP spec), and the rest train more when the Anchor can see them.

Spotter is not for strangers. There are no public rooms, so there is no
moderation problem to solve and no reason to collect ages.

Two situations are designed for:

1. **The real one:** squad members at different gyms, each with a phone in one
   hand between sets.
2. **The showcase (11 November):** a room full of people on laptops and phones,
   all in the same gym at once, none of them actually lifting. The app has to be
   fun to poke at for ten minutes even when nobody is training.

## Scope

**In** (the core loop from `idea.md`):

- Sign up and sign in with email and password.
- A pixel-art avatar each person builds from a few choices.
- Start a group workout, which gives a passcode, or join one with a passcode.
- Log sets in the way each exercise is measured (weight and reps, reps, a
  hold, or distance and time), with a rest timer between sets.
- Your avatar walks to the matching equipment and does that exercise while you
  lift, and goes to the water cooler while you rest.
- If the equipment you need isn't on the floor, a gym worker carries it in.
- Everyone in the room sees everyone's avatar and state, live.
- Resting too long turns your avatar into a visible **slacker**.
- Tap another avatar to cheer, poke or slap them, and send short messages.
- Workout history that is still there next week.

**Out**, with the reason:

| Cut from the MVP spec | Why |
| --- | --- |
| Public rooms, quick join, matchmaking | Strangers bring moderation, reporting and age rules; the idea is about friends |
| Report, block, mute, kick, admin page, text filtering pipeline, moderation API | Only needed with strangers; a passcode room is a closed group |
| Email verification, password reset, Google or Apple sign-in, 18+ age gate | No email service in the setup; no strangers |
| PWA install, web push notifications, offline logging and sync, wake lock | Large effort, and iPhone push needs home-screen install; in-page sound and visual alerts instead |
| 80 seeded exercises, custom exercises, warm-up sets, personal records, units switching | 16 exercises on 8 pieces of equipment, kg only. Four tracking kinds came back in on 8 Oct (ADR 0002) |
| Tiled map editor, sprite sheets drawn per avatar layer, ~20 animations, free walking and A* pathfinding | Sprites are drawn in code with two-frame animations; avatars walk along fixed aisles |
| Layered avatar creator with thousands of combinations | A handful of choices, done by palette swaps |
| Success metrics, retention targets, running-cost planning, scaling path | Product-launch concerns, not course concerns |
| Sentry, PostHog, external monitoring | Crit 10 asks for server-side logging; that is done in the app itself |

## Requirements

Priority: **P0** must ship for the final submission, **P1** ships if time
allows, in the order listed. The crit each requirement is due by is in the
delivery plan below.

### Accounts

| ID | Pri | Requirement |
| --- | --- | --- |
| ACC-1 | P0 | Sign up with email, password and a display name. Email is unique and case-insensitive. Passwords are at least 8 characters. |
| ACC-2 | P0 | Passwords are stored only as a salted hash (`scrypt` from `node:crypto`), never in plain text and never in logs. |
| ACC-3 | P0 | Sign in and sign out. A sign-in lasts 30 days on that browser, held in an `HttpOnly` cookie whose token is stored hashed on the server. |
| ACC-4 | P0 | Display names are 2 to 20 characters and shown above the person's avatar. |
| ACC-5 | P1 | Change display name and password from a settings page. |

### Avatar

| ID | Pri | Requirement |
| --- | --- | --- |
| AV-1 | P0 | An avatar is a small set of choices: skin tone, hair style (4), hair colour and shirt colour, stored as JSON on the user, never as an image. |
| AV-2 | P0 | Avatars are pixel-art sprites drawn from code (see Art direction). Colours are palette swaps, so every choice works with every animation without extra drawing. |
| AV-3 | P0 | A new account gets a random avatar it can edit straight away, with a live preview playing the idle animation. |
| AV-4 | P1 | Accessories (cap, headband, sweatband) as one more overlay layer. |

### Rooms (group workouts)

| ID | Pri | Requirement |
| --- | --- | --- |
| ROOM-1 | P0 | Any signed-in user can create a room and becomes its host. The room gets a 6-character passcode from unambiguous characters (no `0 O 1 I L`), unique among open rooms. |
| ROOM-2 | P0 | Any signed-in user with the passcode can join. A wrong code gives one generic error message. |
| ROOM-3 | P0 | Invite links of the form `/join/K7M2QX` work, and survive signing up first. |
| ROOM-4 | P0 | A room holds at most 12 people, matching its 12 stations. The 13th gets a clear "room is full" message. |
| ROOM-5 | P0 | People can join at any time and leave at any time. Leaving a room does not delete anything they logged. |
| ROOM-6 | P0 | A room stays open while anyone is in it, and closes 4 hours after it was last active. The host can also end it for everyone. Closing finishes everyone's open workout there, keeping every set. A closed room's passcode can be reused. |
| ROOM-7 | P1 | Join attempts are limited (for example 10 per minute per account), so passcodes can't be guessed by brute force. |

### Workout logging

| ID | Pri | Requirement |
| --- | --- | --- |
| LOG-1 | P0 | A workout belongs to one person and, optionally, to the room they did it in. |
| LOG-2 | P0 | 16 seeded exercises, two per piece of equipment (see The gym). |
| LOG-3 | P0 | A set records what its exercise's kind measures: weight in kg and reps; reps and any added weight (bodyweight); a hold time (duration); or a distance and time (cardio). Weight and bodyweight sets pre-fill from the person's last set of that exercise; duration and cardio sets start empty, with the last set shown for reference (changed 8 Oct: the stopwatch counts on from the fields). |
| LOG-4 | P0 | Tapping **Done** logs the set and starts a rest timer from the exercise's default (60 to 180 s; none after cardio), adjustable by ±15 s or skipped. The next set of that exercise starts from the rest last chosen for it. |
| LOG-5 | P0 | When rest ends, the page plays a sound and flashes, if it is open. |
| LOG-6 | P0 | Finishing a workout shows a summary: duration, sets, total volume (weight × reps), cardio distance and time spent slacking. |
| LOG-7 | P0 | History lists the person's past workouts, newest first, with their sets. |
| LOG-8 | P1 | Edit or delete a set after logging it. |
| LOG-9 | P1 | Sets carry a client-generated ID, so a retried request on a slow connection never logs the same set twice. |

### The gym

The gym is one fixed pixel-art room with **12 stations**, one per person a room
can hold. Four hold common equipment when a room opens; the other eight start
empty and are filled on demand. After that, any piece of equipment nobody is
using can be carried out to make room for another, so the opening layout is
only a starting point.

Because a room holds at most 12 people and each person uses at most one
station, someone choosing an exercise always finds a station: once they release
their own, the other 11 people use at most 11 stations, so at least one station
is either empty or holds equipment nobody is using. Nobody is ever left without
equipment.

**Equipment and exercises**

| Equipment | On the floor when a room opens | Exercises | Exercise animation |
| --- | --- | --- | --- |
| Treadmill | Yes | Run, incline walk | Legs pumping on the belt |
| Flat bench | Yes | Bench press, incline bench press | Bar up, bar down |
| Squat rack | Yes | Back squat, overhead press | Stand, squat |
| Dumbbell rack | Yes | Dumbbell curl, lateral raise | Arms down, arms up |
| Lifting platform | No | Deadlift, Romanian deadlift | Bent over, standing |
| Pull-up bar | No | Pull-up, hanging leg raise | Hanging, chin over bar |
| Cable machine | No | Lat pulldown, seated cable row | Handle up, handle in |
| Exercise mat | No | Push-ups, plank | Arms straight, chest down |

**Requirements**

| ID | Pri | Requirement |
| --- | --- | --- |
| GYM-1 | P0 | The gym is one fixed map on a 16 px tile grid: walls, floor, an entrance, a water cooler, aisles, and 12 stations. It fits a portrait phone screen and a laptop window without scrolling. |
| GYM-2 | P0 | A new room starts with the treadmill, flat bench, squat rack and dumbbell rack on four stations, and eight empty stations. |
| GYM-3 | P0 | Each station holds at most one piece of equipment, and each piece of equipment is used by one person at a time. The same kind of equipment can be on several stations at once (five people benching means five benches). A person keeps their station while resting, slacking or Away, and holds none while Idle. |
| GYM-4 | P0 | Choosing an exercise releases the station the person was using, then claims one, in this order: (1) a station that already has that equipment and nobody using it; (2) an empty station, which triggers a delivery; (3) the station whose equipment has gone unused longest, which triggers a swap. Any equipment can be swapped out, including the four a room opens with, as long as nobody is using it. |
| GYM-5 | P0 | The server makes the claim in one database transaction, so two people who want the same station at the same moment never both get it. Whoever commits second falls through to the next rule in GYM-4, and, by the argument above, still finds a station (ADR 0004). |
| GYM-6 | P0 | **Delivery:** a muscular gym worker walks in from the entrance carrying the equipment, puts it down on the claimed station, and walks out. Every screen in the room plays this. A **swap** is the same, except the worker first carries the old equipment out. |
| GYM-7 | P0 | The delivery never blocks logging. The person can tap **Start set** at once; their avatar waits by the station until the worker has put the equipment down. |
| GYM-8 | P0 | The equipment layout is stored per room, so anyone who arrives later, reloads, or comes back after a restart sees the equipment where it was left, with no replay of the delivery. |
| GYM-9 | P0 | Each person is in exactly one state: **Idle**, **Lifting**, **Resting**, **Slacking** or **Finished**. |
| GYM-10 | P0 | Avatars walk between stations along the aisles (straight segments on the tile grid, no free pathfinding). **Start set** plays the equipment's exercise loop. **Done** sends the avatar to the water cooler. |
| GYM-11 | P0 | A person becomes **Slacking** when their rest has run 30 s past its target without a new set starting. A slacking avatar sits and scrolls a phone, and their own screen says "your squad can see you". |
| GYM-12 | P0 | State is decided on the server from stored timestamps (`state`, `state_started_at`, `rest_target_s`), never from a timer in memory, so it is correct after a restart and correct for someone whose phone is locked. |
| GYM-13 | P0 | Every state change and delivery appears on every other open screen in the room within about a second, with no reload. |
| GYM-14 | P0 | A person whose connection drops shows as **Away** (avatar faded) after 60 s, and keeps their state and station. When they return, they pick up where they left off. |
| GYM-15 | P0 | Below the gym, a text list of everyone in the room, their state and their equipment mirrors the map, for keyboard and screen-reader users and for small screens. |
| GYM-16 | P1 | **Work in:** instead of having another one delivered, someone can ask to share a piece of equipment that's in use, taking turns with its user between sets, the way people do in a real gym. |
| GYM-17 | P1 | A new personal best (heaviest weight on an exercise) plays a flex animation everyone sees. |

### Interactions and messages

| ID | Pri | Requirement |
| --- | --- | --- |
| INT-1 | P0 | Selecting another person's avatar (by tap, click or keyboard) opens a menu: **Cheer**, **Poke**, **Slap**, **Message**. |
| INT-2 | P0 | **Cheer** is always allowed. **Poke** and **Slap** are only allowed when the target is Resting or Slacking, never while they are Lifting. |
| INT-3 | P0 | An interaction plays an animation on the target's avatar on every screen in the room, and shows the target a banner ("Mia slapped you back to work"). |
| INT-4 | P0 | One interaction per sender per target every 10 s. |
| INT-5 | P0 | About 10 preset messages in two groups, hype ("One more rep!") and nudge ("Put the phone down"), shown as a speech bubble for 5 s and kept in a room message log. |
| INT-6 | P1 | Free-text messages up to 140 characters, sent to the room, rate-limited to one every 2 s. Text is always escaped, never rendered as HTML. |
| INT-7 | P1 | A per-person setting to turn slaps off. |

### Operations (Crit 10)

| ID | Pri | Requirement |
| --- | --- | --- |
| OPS-1 | P0 | The server writes structured logs (one JSON object per line) for requests, sign-ins, room joins and leaves, state changes, station claims and deliveries, interactions and errors. |
| OPS-2 | P0 | Logs never contain passwords, session tokens or full email addresses. |
| OPS-3 | P1 | A health endpoint reports database reachability and the number of open real-time connections. |

## Art direction

The look is the overworld of the early Game Boy and Game Boy Color Pokémon
games: top-down, a 16 px tile grid, small sprites, few colours, and two-frame
animations. The style is borrowed; no Pokémon assets are, since the repo is
public and they are Nintendo's.

**Sprites as data.** Every sprite is drawn in code: a grid of characters, one
per pixel, each mapping to a slot in a palette.

```ts
// a 4×4 excerpt; real sprites are 16×16
const frame = [
  "..hh",
  ".hss",
  ".sss",
  "..tt",
];
// h = hair, s = skin, t = shirt; "." is transparent
```

- Sprite grids and palettes live under `src/sprites/`, one module per subject
  (avatar, worker, equipment, tiles), so every piece of art is in the repo,
  diffable and reviewable.
- The browser renders each grid once to an image with the person's palette
  applied, then reuses it. Recolouring an avatar is a palette change, not a new
  drawing.
- Hair and accessories are overlay layers drawn at a head anchor that each body
  frame defines, so one hair sprite per direction fits every animation.
- At most 4 colours per sprite plus transparency, in keeping with the style.

**What has to be drawn**

| Subject | Frames |
| --- | --- |
| Avatar body | Walk in 4 directions × 2; 8 exercise loops × 2; resting with a bottle × 2; slacking with a phone × 2; slapped, poked and cheered reactions × 2 each |
| Hair | 4 styles × 4 directions |
| Gym worker | Walk carrying in 4 directions × 2; put down × 1 |
| Equipment | 8 pieces, each in place and being carried |
| Tiles | Floor, wall, entrance, aisle, empty-station marker, water cooler |

**Rendering**

- Avatars, the worker and equipment are HTML elements positioned on the grid,
  not drawn into one `<canvas>`, so each avatar can be a focusable button.
- `image-rendering: pixelated` keeps pixels square.
- The map is scaled by the largest **whole number** that fits the screen, and
  recomputed on resize, since a fractional scale makes pixels uneven.

## Data model

One SQLite file on the volume. Every table is small, and every live state is a
row, so a cold start restores the gym exactly.

| Table | Key columns | Notes |
| --- | --- | --- |
| `users` | `id`, `email` (unique), `password_hash`, `display_name`, `avatar` (JSON), `created_at` | |
| `auth_sessions` | `token_hash` (PK), `user_id`, `expires_at` | Cookie holds the raw token; only its hash is stored |
| `rooms` | `id`, `passcode`, `host_user_id`, `created_at`, `last_active_at`, `closed_at` | Passcode unique among rooms where `closed_at` is null |
| `room_members` | `room_id`, `user_id`, `joined_at`, `left_at`, `last_seen_at` | `last_seen_at` drives the Away flag |
| `stations` | `room_id`, `slot` (1–12), `equipment` (nullable), `placed_at`, `last_used_at`, `user_id` (nullable) | Primary key (`room_id`, `slot`); seeded with the four opening pieces when a room is created; `user_id` is who is on it now |
| `presence` | `user_id` (PK), `room_id`, `state`, `exercise_id`, `slot`, `state_started_at`, `rest_target_s` | One row per person; Slacking is derived from these columns |
| `exercises` | `id`, `name`, `equipment` | Seeded, 16 rows |
| `workouts` | `id`, `user_id`, `room_id` (nullable), `started_at`, `ended_at` | |
| `sets` | `id`, `workout_id`, `exercise_id`, `weight_kg`, `reps`, `completed_at`, `rest_target_s`, `slack_s` | `slack_s` written when the next set starts |
| `interactions` | `id`, `room_id`, `from_user_id`, `to_user_id`, `kind`, `created_at` | Also enforces INT-4 |
| `messages` | `id`, `room_id`, `sender_id`, `preset_key`, `body`, `created_at` | `body` only for free text (INT-6) |

A delivery is not a table. A client that sees a station whose `placed_at` is
less than a few seconds old plays the worker's animation; any later client
just draws the equipment in place (GYM-8).

## Stack

Chosen against the constraints above, and on what has already been deployed to
Fly in this course (Crit 7 used the same stack). Each choice gets an ADR in
`docs/adr/` before it's built on.

| Layer | Choice | Why, given the course setup | Main alternative |
| --- | --- | --- | --- |
| Framework | Astro in server mode, with `@astrojs/node` | Already deployed to Fly in Crit 7; server-rendered pages, components and Markdown built in, which `/readme/` needs anyway | Hono: lighter and more direct for the real-time routes, but new |
| Language | TypeScript on Node 24 | The course harness (`pnpm check`, vitest) is already Node and TypeScript; one language for server, client, sprites and tests | — |
| Database | SQLite on `/data`, via `better-sqlite3` and Drizzle | The volume is the only durable storage and there is no database server; both used in Crit 7 | `node:sqlite`, built in but not yet marked stable in Node 24 |
| Real-time | Server-Sent Events from server to browser (an Astro endpoint returning a stream), ordinary `POST`s from browser to server | Traffic is low-rate and mostly one-to-many: a state change every minute or so per person; `EventSource` reconnects by itself; every action is a plain HTTP call that `spec/` tests can make directly | WebSockets, worth it only if avatars moved freely |
| Real-time hub | One module (`src/lib/realtime.ts`) keeping the open streams per room in memory | Only connections live in memory; losing them on a restart is fine, because clients reconnect and re-read the room from the database | — |
| Gym rendering | Code-drawn pixel sprites as positioned HTML elements | Keyboard focus and screen-reader text come for free, unlike `<canvas>`; no game engine in 256 MB | One `<canvas>` |
| README at `/readme/` | Rendered on the server from `README.md`; images under `docs/` served as static files | Satisfies the shipped invariant | — |
| Tests | vitest against the running app over HTTP (the course harness) | `spec/` already runs this way in CI | Playwright for two-browser checks, if time allows |

## Screens

| Screen | Contents |
| --- | --- |
| `/` (signed out) | What Spotter is, in two sentences; sign up, sign in, link to `/readme/` |
| `/` (signed in) | Create a room, join with code, edit avatar, history, last workout |
| Avatar editor | Live preview, choices, randomise, save |
| `/join/:code` | Joins the room, or asks the person to sign in or sign up first and then joins |
| Gym (`/rooms/:id`) | Top bar with passcode, invite link and leave; the gym map; the people list; a bottom panel that changes with your state |
| Workout summary | Duration, sets, volume, slacking time |
| History | Past workouts with their sets |
| `/readme/` | `README.md` rendered in full |

The gym's bottom panel, by state:

- **Idle:** pick an exercise, grouped by equipment, with what's on the floor now
  marked.
- **Lifting:** exercise name, set number, last time's numbers, a large **Done**.
- **Resting:** a countdown, the set just logged (editable), ±15 s, a large
  **Start set**.
- **Slacking:** the same as Resting, but the timer counts up in red.

Layout rules, because markers check both viewports, a resize mid-use and a
keyboard-only pass:

- Works from 360 px wide to a full laptop window, and survives a resize while
  in the gym.
- Every action, including choosing another avatar and interacting with it, is
  reachable by keyboard with a visible focus ring.
- Tap targets are at least 44 px; the main button sits within thumb reach on a
  phone.

## Delivery plan

The plan follows the three crits, so each week ends with something deployed
that the crit can read.

| Week | Deadline | Ships | Course deliverable |
| --- | --- | --- | --- |
| 9 | **Crit 8**, Wed 7 Oct, 07:00 | Placeholder deployed first, then: ACC-1 to 4, ROOM-1 and 2, LOG-1 to 4 and LOG-7 in plain pages, no gym yet. A stranger signs up, creates a room, logs a set, and finds it in their history next time | README v1 (what "good" means), PROCESS.md v1 with the stack ADR, `reflections/crit-8.md`, repo public |
| 10 | **Crit 9**, Wed 14 Oct, 07:00 | The gym: tiles, avatar sprites, AV-1 to 3, GYM-1 to 5 and 8 to 15, ROOM-3 to 6, LOG-5 and 6; real-time over SSE. New equipment simply appears on its station this week | One written decision about how the app behaves with several people in it (GYM-5, two people wanting the same station at once, is a natural one), PROCESS.md rewritten, `reflections/crit-9.md`; start reading for the research note |
| 11 | **Crit 10**, Wed 21 Oct, 07:00 | The gym worker and its delivery and swap animations (GYM-6 and 7), INT-1 to 5, OPS-1 and 2 | Server-side logging in place, PROCESS.md rewritten, `reflections/crit-10.md` |
| 12 | Studio session, Wed 28 Oct | P1 items in order of how much they serve README's "good"; keyboard, resize and slow-connection passes; showcase rehearsal with several browsers | Research note drafted |
| — | **Submission**, Mon 9 Nov, 12:00 | Frozen | README (400–600 words), PROCESS.md (900–1100), CLAUDE.md, spec/, three reflections, `research-note.md` (600–800) |
| — | Showcase, Wed 11 Nov | — | — |

If a week runs short, cut P1 items and the later P0 items in the same area,
never the crit's own deliverable.

## Candidate checks for `spec/`

These promises can be tested over HTTP against the running app. Which ones end
up in `spec/` depends on what README says "good" means; they are here so the
argument, the rules in `CLAUDE.md` and the checks can line up.

- A set logged by a person is in their history after signing out and back in.
- Someone without the passcode cannot see or join a room.
- A thirteenth person cannot join a full room.
- A new room has exactly the four opening pieces of equipment on the floor.
- Choosing an exercise whose equipment isn't on the floor puts it on an empty
  station, and everyone else in the room sees that station change.
- Two people claiming the last free station at the same moment never end up on
  the same station.
- Equipment someone is using is never swapped out from under them.
- In a full room of 12, every person who chooses an exercise, in any order,
  ends up on a station with that exercise's equipment.
- A person whose rest has run 30 s over its target is reported as Slacking by
  the server, with no client involved.
- A slap or poke aimed at someone who is Lifting is refused.
- A second interaction from the same sender to the same target within 10 s is
  refused.
- A state change made through one session arrives on another session's event
  stream within a second.
- Passwords are not returned by any endpoint, and the stored value is not the
  password.

Some qualities can only be judged by a person, not tested: whether the gym is
fun to look at, whether the worker's delivery is funny rather than slow, whether
a slap feels playful rather than mean, whether logging is fast enough to use
between sets. README should say how those were judged.

## Risks

| Risk | Mitigation |
| --- | --- |
| Friends rarely train at the same time, so rooms are usually one person | Out of scope to solve in four weeks; README can name it honestly. History still makes solo use worthwhile |
| False slacking when someone forgets to tap Start set | Done still logs the set while Slacking; slacking time is shown, not punished |
| Slapping reads as mean | Only allowed on Resting or Slacking people, rate-limited, cartoonish, and (P1) can be turned off |
| The machine stops while idle and in-memory timers vanish | GYM-12: state derived from stored timestamps; SSE clients reconnect and re-read the room |
| SQLite and concurrent writes | One process, WAL mode, short transactions; the load is a dozen people |
| Code-drawn sprites take longer than planned (about 60 small grids) | Draw the avatar and the four opening pieces first; the other four can start as simple shapes; the worker waits until week 11 |
| The delivery animation gets in the way | It never blocks logging (GYM-7), and late arrivals never see it replayed (GYM-8) |
| A busy room carries out the common equipment, and the gym stops looking like a gym | Accepted as the cost of every person always getting a station. If it looks wrong in practice, prefer swapping out equipment that wasn't there when the room opened, and only then the opening four |
| Showcase: many people, nobody lifting | 12-person rooms; deliveries, interactions and presets all work without logging real sets; several rooms can run at once |

## Open questions

- [ ] Final name (Spotter is still a working title).
- [ ] Keep the slap, or replace it with something softer after the Crit 9 pod
      has used it?
- [ ] Does equipment ever leave on its own (for example when nobody has used it
      for 30 minutes), or only when a swap needs its station?
- [ ] Does a room ever need history ("who trained together last Tuesday"), or
      only the present?
