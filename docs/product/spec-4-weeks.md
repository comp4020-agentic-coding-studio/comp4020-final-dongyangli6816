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
| 80 seeded exercises, custom exercises, units switching | 16 exercises on 8 pieces of equipment, kg only. Four tracking kinds came back in on 8 Oct (ADR 0002); warm-up sets and personal records came back in on 4 Nov (LB-2, LB-4); a personal best is celebrated in the room (GYM-17, GYM-18) |
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
| LOG-5 | P0 | When rest ends, the page plays a sound (unless the person has turned it off, INT-12) and flashes, if it is open. |
| LOG-6 | P0 | Finishing a workout shows a summary: duration, sets, total volume (weight × reps), cardio distance and time spent slacking. |
| LOG-7 | P0 | History lists the person's past workouts, newest first, with their sets. |
| LOG-8 | P1 | Edit or delete a set after logging it. |
| LOG-9 | P1 | Sets carry a client-generated ID, so a retried request on a slow connection never logs the same set twice. |

### The logbook (added 4 Nov)

Criteria and decisions: `docs/product/criteria/logbook.md`. Logging stays one
set at a time, because Done, rest and Start set drive the avatar. All seven
are P1, built in this order and cut from the end: LB-1, LB-2 (types and RPE),
LB-4, LB-6, LB-5, LB-2 (notes), LB-3, LB-7 (added 5 Nov).

| ID | Pri | Requirement |
| --- | --- | --- |
| LB-1 | P1 | Choosing an exercise shows every set of it from the last workout that included it, not just the last set. Pre-fill is unchanged (LOG-3). |
| LB-2 | P1 | A set can be Normal, Warm-up or Failure, and carry an RPE from 1 to 10 in half steps. One note per exercise per workout, shown again under Last time. |
| LB-3 | P1 | Plans: saved from a finished workout (exercises and a set count each), managed on `/plans`, loaded in the room's sheet. A loaded plan never chooses an exercise by itself. |
| LB-4 | P1 | Personal records per exercise and kind (heaviest, best estimated 1RM by Epley, most reps, longest hold, longest distance and time), marked on the set that set them. Warm-ups and a first-ever set never set one. The numbers and record types stay private; the room is only told that someone set one, by name and exercise (GYM-17; changed 5 Nov, `criteria/room-feel.md` F15). |
| LB-5 | P1 | `/exercises/:id`: every past set of an exercise, its current records and a line chart of its best per workout, with a table of the same points. |
| LB-6 | P1 | History opens with this week's workouts, volume and distance, and a streak of consecutive Monday-to-Sunday weeks trained, in Australia/Sydney time. |
| LB-7 | P1 | Beside each exercise's name on history and the summary, and in the exercise page's head, the person's own avatar doing it on its machine: the gym's two-frame animation, decorative, still under reduced motion. |

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
| Treadmill | Yes | Run, incline walk | Running on the belt, mid-stride then mirrored |
| Flat bench | Yes | Bench press, incline bench press | Bar up, bar down |
| Squat rack | Yes | Back squat, overhead press | Bar on the shoulders: squat, stand |
| Dumbbell rack | Yes | Dumbbell curl, lateral raise | Arms up, arms down |
| Lifting platform | No | Deadlift, Romanian deadlift | Bent over, standing |
| Pull-up bar | No | Pull-up, hanging leg raise | Chin over bar, hanging |
| Cable machine | No | Lat pulldown, seated cable row | Seated: handle in, handle up |
| Exercise mat | No | Push-ups, plank | Arms straight, chest down |

**Requirements**

| ID | Pri | Requirement |
| --- | --- | --- |
| GYM-1 | P0 | The gym is one fixed map on a 32 px tile grid (ADR 0005): walls, floor, an entrance, a water cooler, aisles, and 12 stations. It fits a portrait phone screen and a laptop window without scrolling. |
| GYM-2 | P0 | A new room starts with the treadmill, flat bench, squat rack and dumbbell rack on four stations, and eight empty stations. |
| GYM-3 | P0 | Each station holds at most one piece of equipment, and each piece of equipment is used by one person at a time. The same kind of equipment can be on several stations at once (five people benching means five benches). A person keeps their station while resting, slacking or Away, and holds none while Idle. |
| GYM-4 | P0 | Choosing an exercise releases the station the person was using, then claims one, in this order: (1) a station that already has that equipment and nobody using it; (2) an empty station, which triggers a delivery; (3) the station whose equipment has gone unused longest, which triggers a swap. Any equipment can be swapped out, including the four a room opens with, as long as nobody is using it. |
| GYM-5 | P0 | The server makes the claim in one database transaction, so two people who want the same station at the same moment never both get it. Whoever commits second falls through to the next rule in GYM-4, and, by the argument above, still finds a station (ADR 0004). |
| GYM-6 | P0 | **Delivery:** a muscular gym worker walks in from the entrance carrying the equipment, puts it down on the claimed station, and walks out. Every screen in the room plays this. A **swap** is one trip: the worker carries the new equipment in, swaps it at the station and carries the old one out (changed 4 Nov, `criteria/delivery.md`). |
| GYM-7 | P0 | The delivery never blocks logging. The person can tap **Start set** at once; their avatar waits where it is until the worker has put the equipment down and gone, then walks to it (changed 5 Nov, `criteria/delivery.md`). |
| GYM-8 | P0 | The equipment layout is stored per room, so anyone who arrives later, reloads, or comes back after a restart sees the equipment where it was left, with no replay of the delivery. |
| GYM-9 | P0 | Each person is in exactly one state: **Idle**, **Lifting**, **Resting**, **Slacking** or **Finished**. |
| GYM-10 | P0 | Avatars walk between stations along the aisles (straight segments on the tile grid, no free pathfinding). **Start set** plays the equipment's exercise loop. **Done** sends the avatar to the water cooler. |
| GYM-11 | P0 | A person becomes **Slacking** when their rest has run 30 s past its target without a new set starting. A slacking avatar sits and scrolls a phone, and their own screen says "your squad can see you". |
| GYM-12 | P0 | State is decided on the server from stored timestamps (`state`, `state_started_at`, `rest_target_s`), never from a timer in memory, so it is correct after a restart and correct for someone whose phone is locked. |
| GYM-13 | P0 | Every state change and delivery appears on every other open screen in the room within about a second, with no reload. |
| GYM-14 | P0 | A person whose connection drops shows as **Away** (avatar faded) after 60 s, and keeps their state and station. When they return, they pick up where they left off. |
| GYM-15 | P0 | Below the gym, a text list of everyone in the room, their state and their equipment mirrors the map, for keyboard and screen-reader users and for small screens. |
| GYM-16 | P1 | **Work in:** instead of having another one delivered, someone can ask to share a piece of equipment that's in use, taking turns with its user between sets, the way people do in a real gym. |
| GYM-17 | P1 | A Done that sets at least one personal record (LB-4: working sets only; the first set to measure a record type sets nothing) is a personal best. It plays a flex everyone in the room sees; the room is told the person and the exercise, never the numbers (GYM-18). The lifter's own confirmation is LB-4's record mark on the stamp (changed 5 Nov: a personal best is a logbook record, and the room is told; `criteria/room-feel.md` F14, F15). |
| GYM-18 | P1 | When someone hits a personal best, everyone else in the room gets a banner naming them and the exercise, without numbers, with a one-tap Cheer. The personal best goes in the room log. For 30 s their menu suggests Cheer and High-five. |

### Interactions and messages

| ID | Pri | Requirement |
| --- | --- | --- |
| INT-1 | P0 | Selecting another person's avatar (by tap, click or keyboard) opens a menu: **Cheer**, **Poke**, **Slap**, **High-five**, **Message**, usable in any state, mid-set included, with a reply as its first row while one is open to you (INT-9). Your own avatar and your own squad row open nothing. |
| INT-2 | P0 | **Cheer**, **Poke** and every preset are allowed on anyone in any state. **Slap** is allowed unless the target is Lifting or Finished. What the sender is doing never matters (changed 22 Oct: interaction is an any-time social layer, not a response to slacking). |
| INT-3 | P0 | An interaction plays an animation on the target's avatar on every screen in the room, and shows the target a banner ("Mia slapped you back to work"). Poke's banner reads "Mia poked you. Rest's over? 👉" if the target is Resting or Slacking, otherwise "Mia poked you 👉". A banner may carry one button (a reply, a High-five, or Cheer on a personal best) and then stays 6 s; others stay 4 s. A newer banner replaces the current one. Since 5 Nov an interaction is acted out on the map (INT-13, INT-14): the target's reaction, banner and sound land when the move does, at most 3 s after it arrives; the room log has it within a second. |
| INT-4 | P0 | One interaction per sender per target every 10 s; one preset per sender every 2 s; one emoji per sender every 1 s. The limits are separate. Replies and High-five acceptances are never refused by the 10 s limit, but count toward it. |
| INT-5 | P0 | About 10 preset messages in two groups, hype ("One more rep!") and nudge ("Put the phone down"), addressed to one person, shown as a speech bubble above the sender for 5 s, and kept, with interactions, replies, completed High-fives and personal bests (without numbers), in a room log of the newest 50 entries. Both groups go to anyone. |
| INT-6 | P1 | Free-text messages up to 140 characters, sent to the room, rate-limited to one every 2 s. Text is always escaped, never rendered as HTML. |
| INT-7 | P1 | A per-person setting to turn slaps off. |
| INT-8 | P0 | From a button beside the dock, in every state including mid-set, send one of eight fixed pixel emoji (Hi, Flex, Fire, Clap, Haha, Dead, Eyes, Love) in at most two taps. It pops above your own avatar on every screen in the room for 3 s. Never covers or moves Start set or Done. Not stored, not in the room log. |
| INT-9 | P1 | After a Cheer, Poke or Slap, the target can answer it once, within 30 s, in one tap from the banner or from the sender's menu: **Thanks** to a Cheer, **Poke back** to a Poke, **Slap back** to a Slap. The answer plays on the sender and gives them a banner. An answer can't be answered. |
| INT-10 | P1 | From the menu, offer someone a High-five. It shows on every screen for 10 s, and only happens if they accept in that time, from a banner or your menu. Then both avatars play it on every screen. An offer nobody takes lapses quietly, told only to the offerer. Not while the target is Away. |
| INT-11 | P1 | Every reaction is big and clear enough to tell its kind at a glance on a phone at arm's length, and the sender always knows their move landed, even with the target out of view. Reactions never cover the dock, delay Start set or Done, or cover a name tag. |
| INT-12 | P1 | The room page plays short sounds for things that are about you (an interaction, reply, High-five or preset to you; your own moves landing), a fanfare everyone hears for a personal best, and the rest-over sound. Never for other people's interactions or emoji. A setting on the room page chooses All sounds, Rest timer only, or Off; it is remembered in that browser. |

| INT-13 | P1 | A sender who is Idle, Resting, Slacking or Finished when their Cheer, Poke, Slap or reply is accepted walks along the aisles to beside the target, does the move there, and walks back, on every screen. The target's reaction, banner and sound land when the move does, at most 3 s after it arrives. Nothing about the walk changes anyone's state, station or workout, or delays Start set or Done. |
| INT-14 | P1 | A sender who is Lifting stays on their machine and makes a short gesture, and an effect for the move travels across the map to the target. They never leave the machine. |
| INT-15 | P1 | At the hit, the target plays a short body reaction for the move (a hop at a cheer, a startled jump at a poke, a cartoon recoil at a slap), then goes back to their pose. On a machine they keep lifting, with the effect and a jolt. |
| INT-16 | P1 | When a High-five happens, whichever of the two can walk goes to the other, the offerer first; both raise a hand and slap it, then the walker goes back. If both are Lifting, both raise a hand on their machines and the effect meets between them. |

Criteria for INT-13 to INT-16 and BOT-8 are in `docs/product/criteria/room-acting.md`
(agreed 5 Nov).

Criteria for INT-9 to INT-12, GYM-17, GYM-18 and BOT-7 are in
`docs/product/criteria/room-feel.md` (agreed 4 Nov).

### Dony

| ID | Pri | Requirement |
| --- | --- | --- |
| BOT-1 | P1 | The back wall's poster is "Member of the month: Dony". Anyone in the room can tap it (by touch, click or keyboard) to summon Dony: on every screen the poster goes empty and he hops down onto the walkway. The server records the summon (when, by whom). He can be summoned again any number of times after being sent back; each summon is a fresh visit with a new schedule. |
| BOT-2 | P1 | Dony is drawn on the people's body frames, so he has every pose and animation a person has, with his own head (an Asian character's hair and glasses) over them and his fixed violet colours; his hop is his only frame of his own. Plus the poster's full and empty frames, within the art rules. He can't be picked in the avatar editor. |
| BOT-3 | P1 | Dony trains by a schedule worked out from the room and his summon time: blocks of 4 to 6 lifts over 45 to 60 minutes, 3 to 5 sets each, realistic set lengths and rests, 3 to 6 minutes Idle between blocks, only on equipment already on the floor, so he never causes a delivery (changed 4 Nov, `criteria/delivery.md`). He goes Idle, Lifting, Resting and Slacking (about one rest in eight, at most twice a block) through the same station rules (GYM-4), never Finished, and every screen sees each change within about a second (GYM-13). His emoji (BOT-6) are part of the same schedule. |
| BOT-4 | P1 | Anyone in the room can tap the empty poster to send Dony back: he stops whatever he's doing, frees his station, walks back and hops into the poster. He can be sent back at any moment; after a send back the poster rests for 30 seconds before he can be summoned again. A tap only acts if the poster is still as its tapper saw it (full for a summon, empty for a send back) and, for a summon, isn't resting; otherwise it does nothing, silently. |
| BOT-5 | P1 | Dony appears on the map and in the squad list like a person, with no bot marker. He never counts as a member, toward the 12, as host or as room activity. A station he holds is always free for a person to take. The room closes when the last real person leaves, as now, and he goes with it. He appears in no logbook, summary, history or friends list, and nothing he does, his emoji included, counts as room activity. |
| BOT-6 | P1 | While he's out, Dony sends the same emoji as people (INT-8): 👋 when he lands, then about one every 2 minutes (never two within 60 s) fitting his state, and an answer about a second after a Cheer, Poke or Slap aimed at him (at most one answer every 10 s, shared with his High-five acceptances, never to presets). Planned from the room, his summon time and the stored interactions, like the rest of his schedule. |
| BOT-7 | P1 | Dony never offers a High-five or replies to anyone. If offered a High-five he accepts about a second later, unless he answered anything in the last 10 s, in which case he leaves you hanging. Once per visit, 4 to 8 minutes after landing, he hits a personal best, planned like the rest of his schedule, never in the room log or any logbook. Everything is worked out from the room, his summon time and what is stored. |
| BOT-8 | P1 | Dony reacts to acted moves with his body like a person. He never walks to anyone on his own; to complete a High-five he walks over only if the offerer is Lifting and he isn't. None of it changes his schedule. |

### Operations (Crit 10)

| ID | Pri | Requirement |
| --- | --- | --- |
| OPS-1 | P0 | The server writes structured logs (one JSON object per line) for requests, sign-ins, room joins and leaves, state changes, station claims and deliveries, interactions and errors. |
| OPS-2 | P0 | Logs never contain passwords, session tokens or full email addresses. |
| OPS-3 | P1 | A health endpoint reports database reachability and the number of open real-time connections. |

## Art direction

The look is the overworld of the Game Boy Color and Game Boy Advance Pokémon
games: top-down, a 32 px tile grid, small sprites, few colours, and two-frame
animations (16 px until ADR 0005). The style is borrowed; no Pokémon assets are, since the repo is
public and they are Nintendo's.

**Sprites as data.** Every sprite is drawn in code: a grid of characters, one
per pixel, each mapping to a slot in a palette.

```ts
// a 4×4 excerpt; real sprites are 32×32
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
  frame defines, so one hair sprite fits every animation.
- At most 7 colours per sprite plus transparency (ADR 0005): the look's
  three colours, a darker shade of each, and the ink outline.

**What has to be drawn**

| Subject | Frames |
| --- | --- |
| Avatar body | Walk facing the viewer × 2; 8 exercise animations × 2; resting with a bottle × 2; slacking with a phone × 2. Body reactions to each move for the standing, resting and sitting poses; the walker's move frames (slap, poke, cheer, thanks, high-five); a gesture for a lifter; a travelling effect per move. On a machine, reactions stay effects (changed 5 Nov, INT-15) |
| Hair | 4 styles, facing the viewer only |
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
| `sets` (4 Nov) | + `set_type`, `rpe` | Null on sets logged before LB-2: they read as Normal with no RPE |
| `exercise_notes` | `workout_id`, `exercise_id`, `body` | One note per exercise per workout (LB-2) |
| `plans`, `plan_exercises` | `id`, `user_id`, `name`; `plan_id`, `position`, `exercise_id`, `sets` | A plan made from a finished workout (LB-3); `workouts.plan_id` is the plan loaded there |
| `interactions` | `id`, `room_id`, `from_user_id`, `to_user_id`, `kind`, `created_at` | Also enforces INT-4. Gains the reply and High-five kinds, a link from a reply to what it answers (INT-9), and High-five offers with their outcome (INT-10). The interaction event (and Dony's High-five acceptance) carries the sender's state at acceptance, so every screen agrees who walks (INT-13, INT-14); nothing new is stored |
| `messages` | `id`, `room_id`, `sender_id`, `preset_key`, `body`, `created_at` | `body` only for free text (INT-6) |
| `personal_bests` (5 Nov) | `set_id`, `room_id`, `user_id`, `exercise_id`, `created_at` | A set that set a logbook record when it was logged (GYM-17): the room's moment, kept so an edit never takes it back |

A delivery is not a table. A screen that is already open when a station's
change arrives plays the worker's animation if the change's `placed_at` is
under 3 s old; a screen that opens or reloads, or hears of it later, just
draws the equipment in place (GYM-8).

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
| Workout summary | Duration, sets, volume, slacking time, records set, Save as plan |
| History | This week's stats and streak, then past workouts with their sets (LB-6) |
| `/exercises/:id` | One exercise's records, chart and every past set (LB-5) |
| `/plans` | Your plans: rename, delete; made with Save as plan on a summary (LB-3) |
| `/readme/` | `README.md` rendered in full |

The gym's bottom panel, by state:

- **Idle:** pick an exercise, grouped by equipment, with what's on the floor now
  marked.
- **Lifting:** exercise name, set number, last time's numbers, a large **Done**.
- **Resting:** a countdown, the set just logged (editable), ±15 s, a large
  **Start set**.
- **Slacking:** the same as Resting, but the timer counts up in red.

In every state, the emoji button sits beside the dock and never moves the
main button (INT-8).

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
| 11 | **Crit 10**, Wed 21 Oct, 07:00 | OPS-1 and 2, ROOM-7; who can see and change what, decided on the server (ADR 0006) | Server-side logging in place, PROCESS.md rewritten, `reflections/crit-10.md` |
| 12 | Studio session, Wed 28 Oct | The gym worker and its delivery and swap animations (GYM-6 and 7), INT-1 to 5, moved from week 11 so Crit 10 could go to access and logging; then P1 items in order of how much they serve README's "good", BOT-1 to 5 among them; keyboard, resize and slow-connection passes; showcase rehearsal with several browsers | Research note drafted |
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
- A slap aimed at someone who is Lifting or Finished is refused.
- A second interaction from the same sender to the same target within 10 s is
  refused.
- A second emoji from the same sender within 1 s is refused.
- A second reply to the same interaction is refused, and so is a reply after
  30 s.
- A High-five accepted after 10 s is refused.
- A set equal to a person's best is not a personal best, and a first workout
  with an exercise has no personal best.
- Dony's emoji arrive at the same server time on two streams, before and
  after a restart.
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
| Slapping reads as mean | Never on someone Lifting or Finished, rate-limited, cartoonish, and (P1) can be turned off |
| Slap back reads as escalation | It follows Slap's rule (never on someone Lifting or Finished), once per slap, within 30 s, and an answer can't be answered |
| An acted slap reads more strongly than an icon | Still never on someone Lifting or Finished; a cartoon recoil, never a mark; the walker goes straight back |
| Errands make a busy map hard to read | Tags never move or get covered; a walk lands within 2.5 s and the walker is back within 6 s; presets stay bubbles; reduced motion shows stills |
| Sound annoys at the gym or in class | Three-way setting (All sounds, Rest timer only, Off) remembered per browser; at most one interaction sound a second |
| Emoji floods at the showcase | One emoji per second per sender (Dony included), each shown above its own sender and replacing that sender's last one; nothing stored |
| The machine stops while idle and in-memory timers vanish | GYM-12: state derived from stored timestamps; SSE clients reconnect and re-read the room |
| SQLite and concurrent writes | One process, WAL mode, short transactions; the load is a dozen people |
| Code-drawn sprites take longer than planned (about 60 small grids) | Draw the avatar and the four opening pieces first; the other four can start as simple shapes; the worker waits until week 11 |
| The delivery animation gets in the way | It never blocks logging (GYM-7), and late arrivals never see it replayed (GYM-8) |
| A busy room carries out the common equipment, and the gym stops looking like a gym | Accepted as the cost of every person always getting a station. If it looks wrong in practice, prefer swapping out equipment that wasn't there when the room opened, and only then the opening four |
| Showcase: many people, nobody lifting | 12-person rooms; deliveries, interactions and presets all work without logging real sets; several rooms can run at once |

## Open questions

- [ ] Final name (Spotter is still a working title).
- [x] Keep the slap, or replace it with something softer after the Crit 9 pod
      has used it? Kept for this build, refused while the target is Lifting
      or Finished (`criteria/int.md`, D5, 22 Oct).
- [ ] Does equipment ever leave on its own (for example when nobody has used it
      for 30 minutes), or only when a swap needs its station?
- [ ] Does a room ever need history ("who trained together last Tuesday"), or
      only the present?
