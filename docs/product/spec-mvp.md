# Spotter: Product & Technical Spec (MVP)

Oct 6, 2026 · @Dongyang

## Overview

Spotter is a mobile-first web app where friends train together remotely as cartoon avatars in a shared 2D gym. Each person lifts at their own gym, and their avatar mirrors what they are doing in real time: lifting, resting, or slacking.

**Problem.** Training consistency depends on accountability, and the most reliable source is a disciplined partner. People who move away from that partner, such as international students, often stop training entirely.

**Insight.** This idea comes from training 3 to 4 times a week with a disciplined roommate during undergrad, then not once after moving to Australia. What worked was not the program. It was someone seeing you rest too long and calling it out.

**Gap.** Strength apps such as Hevy and Strong log workouts well, but their social features are feeds you scroll later. Live, shared-presence products exist for cardio (Peloton, Zwift), not for lifting with your own friends.

**What Spotter does**

- Users sign up with email and password and design a cartoon avatar.
- They start a group session and share a passcode, join a friend's session, or quick-join a public room.
- They log sets, reps, weight and rest like any fitness app.
- Picking an exercise sends their avatar to the matching station, where it performs that exercise.
- Resting sends the avatar to the water cooler with a visible timer. Resting too long turns the avatar into a visible slacker.
- Tapping another avatar opens playful interactions (high-five, poke, slap) and messages.

"Spotter" is a working title: a spotter is the partner who stands behind you on the bench.

## Goals, non-goals and success metrics

The MVP succeeds if people who train in group sessions work out more often than they would alone, measured within 90 days of public launch.

**Goals**

1. Validate the accountability hypothesis: shared presence and visible rest time make people train more often.
2. Be a workout logger good enough to replace the one a user already has.
3. Make group sessions fun enough that users invite friends without being asked.

**Non-goals for the MVP**

- Coaching, training programs or AI-generated plans.
- Nutrition, body measurements and progress photos.
- Voice or video chat.
- Apple Health, Health Connect and wearable sync.
- Native iOS and Android apps (installable web app first; see Architecture).
- Payments. The MVP is free, but avatar cosmetics are designed so they could be sold later.

**Success metrics**

| Metric | Definition | 90-day target |
| --- | --- | --- |
| Activation | New users who log a first workout within 7 days of sign-up | 50% |
| Group adoption | Share of logged workouts done in a group session | 40% |
| Training frequency | Workouts per week per weekly active user | 2.0 or more |
| Accountability effect | Workouts per week, users with 1+ group sessions vs solo-only users | +25% |
| Nudge response | Slacking users who start their next set within 60 s of receiving an interaction | 50% |
| Week-4 retention | Users still active in their fourth week after sign-up | 25% |
| Invite pull | Private sessions that reach 2+ participants | 60% |

Targets are starting assumptions to revise after the closed beta. The accountability comparison is correlational, since motivated users may self-select into groups, so treat it as a signal rather than proof.

## Users and the core loop

Spotter is built for people who used to train with friends and stopped when they moved apart. It only works if their disciplined friend uses it too.

| Persona | Who they are | What they need from Spotter |
| --- | --- | --- |
| The Drifter (primary) | Trained with friends, moved for study or work, now rarely trains | Friends who can see them, a reason to open the app, near-zero setup |
| The Anchor (critical) | The disciplined friend who trains 3 to 4 times a week regardless | A logger as fast as the one they use now, and a game layer that never slows them down |
| The Solo Regular (secondary) | Trains alone and would like company | Public rooms with friendly strangers, without creepiness or spam |

The Anchor is the adoption risk. If the logging is worse than Hevy or Strong, the Anchor won't switch, and the Drifters lose the person who keeps them honest.

**Context of use.** The phone is in one hand between sets, with 60 to 180 seconds of rest, sweaty fingers, and often weak reception. Every interaction must work as a glance and a tap, not a session.

**The core loop (per set)**

1. Open Spotter at the gym and join the squad's session, or start one and share the passcode.
2. Pick an exercise. The avatar walks to the matching station.
3. Tap **Start set**. The avatar performs the exercise, and friends see "Bench press, set 2".
4. Tap **Done**, confirm reps and weight (pre-filled from last time), and rest starts automatically.
5. The avatar walks to the water cooler while a shared rest timer counts down.
6. When the timer ends, the phone notifies the user. If they haven't started the next set after a grace period, their avatar starts scrolling its phone and is marked **Slacking**.
7. Friends tap the slacker's avatar to slap, poke or message them. The slacker gets a notification and returns to step 3.
8. On **Finish workout**, everyone sees a session summary with sets, volume and awards.

Requiring an explicit Start set is what makes slacking detectable. It also risks false slacking when someone forgets to tap; see Risks.

## MVP scope

Launch with one gym map, eight animation categories and complete logging basics. Everything else waits until real usage shows what matters.

| Area | P0: launch | P1: within 8 weeks of launch | Later |
| --- | --- | --- | --- |
| Accounts | Email and password, email verification, password reset, account deletion | Sign in with Google and Apple | Two-factor authentication |
| Avatar | Layered creator: body, skin tone, hair, outfit colours | More outfits and accessories, unlockable cosmetics | Cosmetic shop |
| Logging | \~80 seeded exercises, custom exercises, sets, reps, weight, duration, distance, rest timer, history, personal records, offline logging | Routines and templates, progress charts, plate calculator | Training programs, health platform sync |
| Group sessions | Private passcode rooms (up to 8), public rooms with quick join (up to 12), solo mode, session summary | Friends list, "who's training now", scheduled sessions | Async sessions for friends in other time zones |
| Gym world | One map, 8 exercise animation categories, rest and slacking animations, tap-to-walk | Second map, more animation categories | Customisable home gyms |
| Interactions | High-five, cheer, poke, slap, preset messages, free-text messages | Streaks and awards history | Voice chat |
| Safety | 18+ age gate, report, block, mute, text filtering, host kick, admin review page | Trust levels that unlock features for new accounts | Dedicated moderation tooling |
| Platform | Installable PWA with web push notifications | Capacitor wrapper for the app stores | Native apps if the web app hits limits |

## Accounts, onboarding and avatars

A new user invited by a friend should go from link to lifting in under 2 minutes, so invited users can join a private room before verifying their email.

**Account requirements**

| ID | Requirement |
| --- | --- |
| ACC-1 | Sign up with email, password, display name and date of birth. Passwords are at least 10 characters, and common or breached passwords are rejected where the auth provider supports it. |
| ACC-2 | Users must be 18 or older. Store an "over 18" flag and birth year, not the full date of birth. |
| ACC-3 | Email verification is required before joining public rooms or sending free-text messages. Solo workouts and private rooms work immediately. |
| ACC-4 | Log in and log out. A session stays signed in on the device for 30 days of inactivity. |
| ACC-5 | Password reset by emailed link that expires after 1 hour. |
| ACC-6 | Change display name, email and password from Settings. Display names are 3 to 20 characters and pass the same text filter as chat. |
| ACC-7 | Delete account from Settings. Profile, workout logs and messages are deleted within 30 days; moderation records keep only an anonymised ID. |
| ACC-8 | An invite link (for example `/join/K7M2QX`) survives sign-up and drops the new user straight into that session. |

**Onboarding (first run)**

1. Sign up, or sign in.
2. Create an avatar (randomised starting point, editable).
3. Choose units (kg or lb) and a default rest time (90 s suggested).
4. Install to the home screen. iOS gets illustrated "Share, then Add to Home Screen" steps, because web push on iPhone only works for installed web apps. Android uses the browser's install prompt.
5. Allow notifications, with the reason stated first: "So we can tell you when rest is over, and when a friend catches you slacking."
6. Land on Home, or go straight into the session if the user arrived by invite link.

Steps 3 to 5 are skippable and re-offered later, since a user standing in a gym should never be blocked by setup.

**Avatar requirements**

| ID | Requirement |
| --- | --- |
| AV-1 | Avatars are layered sprites: body (2 types), skin tone (8), hairstyle (10), hair colour (8), top, bottoms and shoes (4 styles each, recoloured from a palette). |
| AV-2 | The creator shows a live preview playing the idle animation, plus a Randomise button. |
| AV-3 | Avatars are editable anytime from Profile. Changes appear the next time the user joins a room. |
| AV-4 | Avatar config is stored as versioned JSON of layer and colour IDs, never as images. |
| AV-5 | A name tag with the display name floats above every avatar in the gym. |

Every layer must be drawn for every animation frame, so each new hairstyle or outfit multiplies art work. Colours come from palette swaps, which keeps the frame count fixed while still giving thousands of combinations.

## Workout logging

Logging a set must take at most two taps when nothing changed since last time, and it must work with no signal.

| ID | Requirement |
| --- | --- |
| LOG-1 | Start a workout solo or inside a group session. A workout always belongs to one user, even in a group. |
| LOG-2 | A library of \~80 seeded exercises, searchable and filterable by muscle group and equipment, with recently used exercises first. |
| LOG-3 | Users can create custom exercises by choosing a name, tracking type, equipment and the animation it "looks most like". |
| LOG-4 | Four tracking types: weight and reps; reps only (with optional added weight); duration; distance and duration. |
| LOG-5 | Set entry pre-fills from the same exercise in the previous workout. Steppers move weight by 2.5 kg (or 5 lb) and reps by 1, and tapping a value opens a numeric keypad. |
| LOG-6 | Sets can be marked as warm-up. Warm-up sets are excluded from volume and personal records. |
| LOG-7 | Tapping Done starts the rest timer at the exercise's default. Users can add or remove 15 s, or skip rest. |
| LOG-8 | When rest ends, the app plays a sound and shows an alert if open, and sends a push notification if the phone is locked or the app is in the background. |
| LOG-9 | Sets and exercises can be edited, deleted and reordered during and after a workout. |
| LOG-10 | Finishing shows a summary: duration, sets, total volume (weight times reps of working sets) and any new records. Workouts can also be discarded. |
| LOG-11 | History lists past workouts newest first, with workout detail and per-exercise history. |
| LOG-12 | Personal records track heaviest weight, most reps at a given weight, and best estimated one-rep max (weight times (1 + reps / 30), for sets of 10 reps or fewer). Cardio tracks longest duration and distance. |
| LOG-13 | Values are stored in kg, metres and seconds, and displayed in the user's chosen units. |
| LOG-14 | Logging works offline. Writes queue on the device and sync on reconnect, each carrying a client-generated ID so retries never duplicate a set. |
| LOG-15 | Optional short notes on a workout and on each exercise. |
| LOG-16 | A "Keep screen on" toggle uses the browser's screen wake lock where supported. |

Group sessions add presence on top of logging but never block it. If the connection to the room drops, the user keeps logging and their avatar shows as Away until they reconnect.

## Group sessions

Sessions are drop-in rooms, not scheduled classes. Friends arrive at their own gyms at different times, so a room stays open while anyone is in it and each person runs their own workout inside it.

|  | Private room | Public room |
| --- | --- | --- |
| How to join | 6-character passcode or invite link | Quick Join, or pick from the open-rooms list |
| Capacity | 8 people | 12 people |
| Created by | Any user, who becomes host | The server, which opens a new room when others fill |
| Who can join | Any signed-in user with the code | Verified, 18+, not suspended |
| Slaps | On by default, subject to each user's setting | Off by default; only between users who both allow them |
| Free-text chat | On, filtered | On, filtered and moderated before delivery |
| Moderation | Host can kick and lock the room | Report, block, mute; repeated reports remove a user |
| Lifetime | Ends 15 minutes after the last person leaves, or after 4 hours | Recycled once empty |

**Requirements**

| ID | Requirement |
| --- | --- |
| SES-1 | Creating a private room generates a passcode from 31 unambiguous characters (no 0, O, 1, I or L), unique among active rooms. The share button uses the phone's share sheet with an invite link. |
| SES-2 | Join attempts are limited to 10 per minute per user and per IP address. A wrong code shows one generic error. |
| SES-3 | People can join at any time. New arrivals walk in through the gym entrance. |
| SES-4 | A user who disconnects stays in the room as Away for up to 10 minutes, then their avatar walks out. Reconnecting within that window restores their state. |
| SES-5 | The host can kick, lock the room to new joiners, and end the session. If the host leaves, the longest-present user becomes host. |
| SES-6 | Quick Join puts the user in the busiest public room with space, or opens a new one. Home shows how many people are training publicly right now. |
| SES-7 | Public rooms get generated names (for example "Iron Paradise #3") and show headcount and how many are lifting. |
| SES-8 | Users who blocked each other are never placed in the same public room. In private rooms, a blocked user's messages and interactions are hidden. |
| SES-9 | When a user finishes, everyone in the room can see a session summary: sets, volume, time resting versus slacking, and awards. |
| SES-10 | Solo mode runs the same gym scene locally, with no other players and no network dependency. |

**Session awards** (SES-9): Most Volume, Iron Discipline (least slacking), Professional Slacker (most slacking), and Hype Machine (most interactions sent). Awards are jokes with teeth: they make slacking visible without making it shameful.

**Cold start.** At launch, public rooms will usually be empty, and an empty room feels worse than no room. Hide Quick Join when nobody is training publicly, and promote fixed community hours (for example 6 to 8 am and 5 to 7 pm Sydney time) to concentrate the early users.

## The cartoon gym

The gym is one 2D top-down map that fits a portrait phone without scrolling, so everyone in the room is visible at a glance. Every exercise maps to one of 8 animation categories, which keeps art work fixed while the exercise library grows.

**Map**

- Pixel art on a 16 px tile grid, about 15 by 18 tiles, scaled up to fill the top \~55% of the screen.
- Built in the Tiled map editor with zones for each station type, an entrance, and a rest area with a water cooler and benches.
- Each station type has several copies. When all are taken, the avatar uses an open floor spot beside that zone and plays the same animation.

**Animation categories and stations**

| Category | Station | Example exercises | Copies on map |
| --- | --- | --- | --- |
| Bench press | Flat bench with rack | Bench press, incline press, dumbbell press | 3 |
| Squat and legs | Squat rack | Back squat, front squat, leg press, lunges | 3 |
| Hinge | Lifting platform | Deadlift, Romanian deadlift, hip thrust | 2 |
| Overhead press | Standing platform | Overhead press, dumbbell shoulder press, lateral raise | 2 |
| Pull | Cable tower and pull-up bar | Pull-up, lat pulldown, seated row | 3 |
| Arms | Dumbbell rack | Curls, triceps extensions, hammer curls | 3 |
| Floor | Mat area | Push-ups, plank, crunches, stretching | 4 |
| Cardio | Treadmills and rower | Running, rowing, cycling, stairs | 4 |

**Animations per avatar**

About 20 animations, each drawn for every avatar layer: idle, walk in 4 directions, the 8 exercise loops (front-facing only), resting with a water bottle, slacking (sitting and scrolling a phone), getting slapped (spin with stars), high-five, cheer, poke reaction, and a flex for new personal records.

**Movement**

- Choosing an exercise auto-walks the avatar to a free station of that type using grid pathfinding. Steering is never required mid-workout.
- Users can also tap the floor to walk, or tap another avatar to walk over and interact.
- The server stores only each avatar's destination tile. Every client runs the same pathfinding, so walking costs one message instead of a stream of positions.

**Presence states**

Each avatar has one workout state plus a connection flag, and the server owns both. Timers run on the server, so a user who locks their phone and scrolls another app still turns into a slacker on everyone else's screen.

&#91;embedded content: presence states · 5 states and their transitions\]

Two transitions are left out of the picture for clarity. A strength set left running past 5 minutes also becomes Slacking, and tapping Done while Slacking still logs the set and moves to Resting.

The connection flag is separate. After 60 s without a heartbeat, the avatar fades and shows a phone-off icon (Away) but keeps its state and timers. After 10 minutes Away, it leaves the room.

## Interactions and messaging

Interactions exist to pull people back into their workout, so the slap stays in, but only as a nudge aimed at someone resting or slacking, and only for users who allow it. Tapping another avatar opens a menu; the sender's avatar walks over and both avatars play the animation.

**Interactions**

| Interaction | What happens in the gym | Push notification to the target | Allowed when |
| --- | --- | --- | --- |
| Cheer | Confetti burst above the target | "Mia is cheering you on" | Always |
| High-five | Both avatars slap hands | "Mia high-fived you" | Target is not mid-set |
| Poke | Target jumps and looks around | "Mia poked you. Rest's over?" | Target is Resting or Slacking |
| Slap | Cartoon slap; the target spins with stars | "Mia slapped you back to work" | Target is Resting or Slacking, and both users allow slaps |

- The menu highlights the fitting action: Slap and Poke for a slacker, Cheer for someone lifting, High-five after a new personal record.
- Slap setting, per user: allow from everyone, from private rooms only (default), or no one. Public-room slaps need both users set to everyone. When a user disallows slaps, the option disappears from their avatar's menu.
- Limits: one interaction per sender and target every 10 s, and 10 per minute per sender. A target gets at most one push every 30 s, grouped ("Mia and 2 others are nudging you").

**Preset messages**

One tap sends a preset as a speech bubble above the sender's avatar for 5 s, and into the chat log. The launch set has about 15 presets in three groups:

- Hype: "Light weight!", "One more rep!", "Let's go!"
- Nudge: "Rest is over, mate", "Put the phone down", "I can see you slacking"
- Social: "Nice PR!", "Same time tomorrow?", "Heading off, good session"

**Free-text messages**

- Up to 140 characters, sent to the whole room. Tapping Message on an avatar pre-fills an @mention, but there are no private direct messages in the MVP.
- Every message passes the server pipeline before delivery: length and rate check, then a word filter, then (in public rooms) a block on links, emails and phone numbers, then an automated moderation API check.
- If the moderation API is slow (over 800 ms) or down, public rooms fall back to the word filter plus a stricter rate limit rather than letting messages through unchecked.
- Rate limits: 1 message every 2 s and 20 per minute. Accounts younger than 24 hours get 5 per minute in public rooms.
- The chat drawer shows the room's last 50 messages. Messages are stored for 30 days to support reports, then deleted.
- Muting a user hides their bubbles and messages for the muter, everywhere, until unmuted.

## Safety, moderation and privacy

Public rooms with free text mean strangers can message each other, so Spotter launches 18+ only, with moderation sized for one person to run. Avatars are built from fixed parts and nobody can upload images, which removes the hardest moderation problem entirely.

**Age and legal**

- Launch as 18+. Australia's social media minimum age rules (under 16, in force since December 2025) may cover services with public chat between strangers. Getting legal advice on whether Spotter is in scope is a launch blocker.
- Follow the Australian Privacy Principles even if the small business exemption might apply, and publish a plain-language privacy policy and terms.
- Host user data in Sydney. Disclose any overseas processors (for example analytics or moderation APIs) in the privacy policy.
- Prepare a short data breach response plan, including how to notify affected users and the regulator.

**Data minimisation**

- No location, contacts, photos or body measurements are collected in the MVP.
- Others see your display name, avatar, current exercise and set number. Weights are shown to your room only if you allow it: on by default in private rooms, off in public rooms.
- No advertising trackers. Product analytics use pseudonymous IDs, never emails.

**User tools**

- **Report** from an avatar's menu or by long-pressing a message. Categories: harassment, hate, sexual content, spam, other. The last 20 room messages are attached as context.
- **Block** hides each user from the other and keeps them out of the same public rooms.
- **Mute** hides someone's messages and bubbles for you only.
- **Kick** lets a private-room host remove someone for the rest of that session.
- First entry to a public room shows short community guidelines that the user must accept.

**Enforcement**

- Three reports against one user from different reporters within 24 hours suspend their public-room access until reviewed.
- A simple admin page lists open reports with context and supports: dismiss, warn, suspend public access for 7 days, or ban the account and its email.
- Target review time is within 48 hours. Every action is logged with who took it and why.

## Key screens and mobile UX

The Gym screen is where users spend 95% of their time, and a normal set costs exactly two taps on it: Start set, then Done. Done logs the set with pre-filled values straight away; corrections happen during rest, when the user has time.

| Screen | Key elements |
| --- | --- |
| Gym | Top bar, gym canvas, bottom sheet that changes with the user's state (layout below) |
| Home | Start solo workout, Create private room, Join with code, Quick Join with "N training now", last workout, recent records |
| Join with code | Six large character boxes, paste support, invite links skip this screen |
| Exercise picker | Search, recently used, muscle-group filter chips, Create custom exercise |
| Avatar menu | Opens on tapping another avatar: Cheer, High-five, Poke, Slap, Message, Mute, Report, Block |
| Chat drawer | Row of preset messages, text input, the room's last 50 messages |
| Workout summary | Duration, sets, volume, new records, session awards |
| History | Past workouts newest first, workout detail, per-exercise history and records |
| Avatar creator | Live preview, part tabs, colour swatches, Randomise |
| Settings | Units, default rest, slap and weight-visibility settings, notifications, blocked users, account, delete account |
| Sign up and sign in | Email, password, display name, date of birth, forgot password |

**Gym screen layout (portrait)**

- **Top bar:** room name and code, headcount, chat button with unread badge, and a menu for Invite and Leave.
- **Gym canvas:** the whole gym, about 55% of the screen height.
- **Bottom sheet**, by state:
  - Idle: Pick exercise, plus chips for recently used exercises.
  - Lifting: exercise name, set number, last time's numbers, and a large Done button.
  - Resting: large countdown, the set just logged with steppers to correct it, plus or minus 15 s, and a large Start set button.
  - Slacking: the same as Resting, but the timer counts up in red with "Your squad can see you."

**UX rules for the gym floor**

- Tap targets at least 48 px, with primary buttons in the bottom third where a thumb reaches.
- Timers and weights readable at arm's length (at least 32 px numerals).
- Taps only. No swipes or long-presses are required to log a workout.
- iPhone browsers can't vibrate, so every alert uses sound plus a visual flash.
- Tapping a notification opens the Gym screen directly, with the session already connected.

## Architecture and stack

Build it as one TypeScript monorepo: an installable React web app with a Phaser gym, and one Node.js server that runs both the REST API and the Colyseus real-time rooms. Supabase provides Postgres and email-and-password auth in Sydney. This is the smallest stack that a solo developer can run in production.

&#91;embedded content: system architecture · phone, server, Supabase, external services\]

The phone uses HTTPS for data and one WebSocket for the live room, and talks to Supabase directly only to sign in. Only the server reaches the database, the push services and the moderation API.

**Recommended stack**

| Layer | Choice | Why |
| --- | --- | --- |
| Language | TypeScript everywhere | One language for UI, game and server, with shared types for every room message |
| Web app | React with Vite, installable as a PWA (vite-plugin-pwa) | No server rendering needed; the service worker handles offline caching and push |
| UI styling | Tailwind CSS | Fast to build consistent mobile UI |
| Gym rendering | Phaser, with maps from the Tiled editor | A 2D game framework with tilemaps, sprite animation and tap input built in |
| Pathfinding | EasyStar.js | Small, deterministic A\* that every client runs identically |
| Real-time rooms | Colyseus on Node.js | Rooms, matchmaking, delta-synced state and reconnection map directly onto private and public rooms |
| REST API | Fastify, in the same Node process as Colyseus | Logging, history and profiles, sharing code with the room server |
| Database and auth | Supabase (Postgres and Auth), Sydney region | Sign-up, verification and password reset handled; the server verifies Supabase tokens |
| Database access | Drizzle ORM | Typed queries and migrations kept in the repo |
| Offline storage | IndexedDB via Dexie | Queue of unsynced sets and a cached exercise library |
| Push notifications | Web Push with VAPID keys (web-push library) | Works on Android, and on iPhone for apps installed to the home screen (iOS 16.4+) |
| Email delivery | Resend or Postmark as Supabase's SMTP | Supabase's built-in email is rate-limited and meant for testing |
| Hosting | Web app on Cloudflare Pages; Node server on Fly.io in Sydney | Real-time rooms need a long-running server, not serverless functions |
| Monitoring | Sentry for errors, PostHog for product analytics, an uptime check | Free tiers cover the MVP |
| Repo layout | pnpm workspaces: `apps/web`, `apps/server`, `packages/shared` | Zod schemas in `shared` validate messages on both ends |

**Why a PWA first, not a native app**

- One codebase, no app store review, and invite links open instantly in any browser.
- The known limits are on iPhone: push only works after Add to Home Screen, there is no vibration, and background code is suspended. Server-side timers and push notifications cover the important cases.
- The exit path is Capacitor, which wraps the same web app for the App Store and Play Store with native push. Trigger it if iPhone install rates or notification delivery hurt retention.

**Scaling path**

One small Fly.io machine handles the MVP's target of 100 concurrent users with large headroom. Beyond a few hundred concurrent users, run several Colyseus processes behind Redis (Colyseus supports this) and split the API into its own service.

**Running cost (approximate; check current prices)**

About US$35 to US$50 a month at launch: Supabase Pro (around US$25, since free projects pause when idle), a small Fly.io machine (US$5 to US$15), and free tiers for Cloudflare Pages, Resend, Sentry and PostHog. Art assets are a separate one-off cost.

## Data model

Postgres holds everything durable; live room state (positions, timers, statuses) lives only in Colyseus memory and is written to Postgres as events happen. Clients never query the database directly: all reads and writes go through the API, and Supabase row-level security is set to deny-all as a second line of defence.

| Table | Key columns | Notes |
| --- | --- | --- |
| profiles | user\_id (PK, the auth user), display\_name, birth\_year, avatar (JSON), units, default\_rest\_s, slap\_pref, weights\_visibility, created\_at, deleted\_at | One row per account |
| exercises | id, owner\_id (null for built-in), name, muscle\_group, equipment, tracking\_type, anim\_category, default\_rest\_s | Custom exercises carry an owner |
| workouts | id (client-generated UUID), user\_id, session\_id (nullable), status, started\_at, ended\_at, notes | Status: active, finished, discarded |
| workout\_exercises | id, workout\_id, exercise\_id, position, notes | Order within the workout |
| sets | id (client-generated UUID), workout\_exercise\_id, position, is\_warmup, weight\_kg, reps, duration\_s, distance\_m, started\_at, completed\_at, rest\_target\_s, rest\_actual\_s, slack\_s | weight\_kg keeps 3 decimals so values entered in lb display back exactly |
| personal\_records | user\_id, exercise\_id, record\_type, value, set\_id, achieved\_at | Recomputed when a set is written or edited |
| sessions | id, kind, name, passcode, host\_user\_id, capacity, status, created\_at, ended\_at | Passcode is unique among active sessions and cleared when the session ends |
| session\_participants | session\_id, user\_id, joined\_at, left\_at, was\_kicked | Basis for summaries and "who trained together" |
| interactions | id, session\_id, from\_user\_id, to\_user\_id, kind, created\_at | Feeds rate limits, awards and the nudge-response metric |
| messages | id, session\_id, sender\_id, kind, preset\_key, body, moderation\_result, created\_at | Deleted after 30 days |
| blocks | blocker\_id, blocked\_id, created\_at | Checked by matchmaking and message delivery |
| mutes | muter\_id, muted\_id, created\_at | Applied on the muter's client |
| reports | id, reporter\_id, reported\_user\_id, session\_id, message\_id, category, context (JSON), status, created\_at | Context holds the last 20 room messages |
| user\_sanctions | id, user\_id, kind, ends\_at, reason, created\_by, created\_at | Kinds: warning, public suspension, ban |
| push\_subscriptions | id, user\_id, endpoint, keys, user\_agent, created\_at, last\_success\_at | Deleted when the push service reports the subscription expired |

Set IDs are generated on the phone, so an offline set synced twice is written once. Server timestamps are authoritative for timers; client timestamps are kept only for offline sets.

## API and real-time protocol

Data has one write path and presence has another. Sets and workouts are always written through the REST API, which is also what the offline queue replays. Room messages carry only presence, and the room server owns every timer.

**REST API (all calls carry the Supabase access token)**

| Endpoint | Purpose |
| --- | --- |
| `GET /me`, `PATCH /me`, `PUT /me/avatar`, `DELETE /me` | Profile, settings, avatar and account deletion |
| `GET /exercises`, `POST /exercises` | Library (built-in plus the user's custom exercises) and custom creation |
| `POST /workouts`, `PATCH /workouts/:id`, `GET /workouts?cursor=` | Start, finish or discard, and paged history |
| `PUT /sets/:id`, `DELETE /sets/:id` | Idempotent upsert by client-generated ID, and delete |
| `GET /records`, `GET /exercises/:id/history` | Personal records and per-exercise history |
| `POST /sessions`, `POST /sessions/join`, `GET /sessions/public` | Create a private room, resolve a passcode to a room, list public rooms |
| `POST /push-subscriptions`, `DELETE /push-subscriptions/:id` | Register and remove a device for push |
| `POST /reports`, `PUT /blocks/:userId`, `PUT /mutes/:userId` (and `DELETE`) | Safety tools |
| `GET /admin/reports`, `POST /admin/sanctions` | Admin review, restricted to admin accounts |

**Joining a room**

1. The app resolves a passcode with `POST /sessions/join` (or calls Quick Join) and gets a room ID.
2. It connects to Colyseus with that room ID and the access token.
3. The room verifies the token, capacity, blocks and sanctions, then adds the player at the entrance.

**Synced room state.** Each player carries: user ID, display name, avatar config, current tile, destination tile, workout state, exercise name and animation category, set number, state start time (server clock), rest target, connection flag, and last set's weight and reps when the user allows it. Colyseus sends only changed fields, at most 10 times a second.

**Messages from the app to the room**

| Message | Payload | What the server does |
| --- | --- | --- |
| `select_exercise` | exercise ID | Picks a free station and sets the destination |
| `start_set` | none | State to Lifting; records rest and slack time on the previous set |
| `complete_set` | set ID, reps, weight, rest target | State to Resting; schedules the rest-over push and the slacking check |
| `adjust_rest` | plus or minus seconds | Moves the target and reschedules both timers |
| `move_to` | tile x, y | Checks the tile is walkable and sets the destination |
| `interact` | target user, kind | Checks rules and limits, broadcasts the animation, sends the push |
| `chat` | preset key or text | Runs the message pipeline, then broadcasts |
| `visibility` | foreground or background | Decides whether rest-over alerts go by push or in-app |
| `finish_workout` | workout ID | State to Finished; computes and broadcasts the summary |
| `heartbeat` | none | Sent every 15 s; 60 s of silence marks the player Away |

The room also broadcasts one-off events (`interaction`, `chat`, `summary`, `kicked`, `room_ending`) that are not part of the synced state.

**Reliability rules**

- Every payload is validated against shared Zod schemas. Invalid messages are dropped, and clients sending over 20 messages a second are disconnected.
- Reconnection is allowed for 10 minutes, matching the Away window.
- A server restart ends live rooms. The app rejoins by room code and restores its own state from the local workout log, so deploys should happen outside peak hours.

## Non-functional requirements

The two requirements that matter most are that no logged set is ever lost and that the gym runs smoothly on a mid-range phone without draining the battery.

| Area | Requirement | Target |
| --- | --- | --- |
| Data integrity | Logged sets lost, including offline use and app crashes | Zero |
| Rendering | Gym frame rate on a 4-year-old mid-range phone | 60 fps target, never below 30 fps |
| Battery | Battery used by a 60-minute session with the screen on | 15% or less; drop to 30 fps when nothing moves and stop rendering when hidden |
| Load time | First load on 4G | Interactive within 3 s; app code under 500 KB compressed, excluding art |
| Load time | Repeat load from cache | Under 1 s |
| Latency | An action on one phone appearing on others in Australia | Under 250 ms at the 95th percentile |
| Availability | Monthly uptime | 99.5% |
| Capacity | Launch load | 1,000 monthly active users, 100 concurrent users, 20 live rooms |
| Security | Transport and storage | HTTPS and secure WebSockets only, encryption at rest, secrets in the host's secret store |
| Security | Baseline | OWASP ASVS Level 1, with dependency scanning on every build |
| Accessibility | Screens outside the gym canvas | WCAG 2.2 AA. A text "people list" mirrors everyone's state for screen readers |
| Compatibility | Supported browsers | Safari on iOS 16.4+, the last 2 versions of Chrome for Android; desktop browsers work but are not optimised |
| Privacy | Account deletion | Completed within 30 days of the request |
| Backups | Database | Daily backups kept 7 days, with one restore rehearsed before launch |
| Observability | Errors and alerts | Client and server errors in Sentry; alerts on downtime and error spikes |

## Delivery plan

Plan on about 20 weeks to public launch. The solo logger comes before the gym, so the app is useful from week 6 even when no friends are online.

&#91;embedded content: delivery plan · 7 phases, 6 gates\]

Each gate is a go or no-go check. If one fails, fix that layer before building the next one on top of it.

## Risks and open questions

The biggest risk is to the core use case itself: friends who live in different time zones may rarely be at the gym at the same time.

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Friends rarely overlap | Live presence needs two people training at once; friends overseas may be hours apart | Track the share of private sessions reaching 2+ people. If it is low, move async sessions (train alongside a friend's recorded workout) up to P1 |
| The Anchor won't switch | Disciplined friends already use Hevy or Strong and won't log twice | Make logging two taps per set; add CSV import from Hevy and Strong in P1 |
| False slacking | Users who forget to tap Start set appear to slack while lifting | Tapping Done without Start set still logs the set and clears Slacking. In beta, measure how often Done follows Slacking within 90 s |
| iPhone install friction | Push on iPhone only works after Add to Home Screen | Clear install step in onboarding, track install rate, keep Capacitor as the exit path |
| Art cost and consistency | \~20 animations times every avatar layer is the largest single piece of work | Few layers with palette swaps; a commercially licensed pack or one commissioned artist |
| Empty public rooms | An empty room is worse than none | Hide Quick Join when empty; fixed community hours |
| Moderation load | One person moderating public chat | 18+, rate limits, filters, auto-suspension, and a feature flag to turn off public free text |
| Legal scope | Age and online safety rules may apply to public chat | 18+ at launch and legal advice before public launch |
| Distraction mid-lift | Looking at a phone under a heavy bar is unsafe | No slaps, pokes or alerts reach someone who is Lifting |

**Open questions**

- [ ] Final product name and domain.
- [ ] Keep the slap after beta feedback, or swap in a softer "wake-up" animation?
- [ ] Which moderation API, and is overseas processing of messages acceptable?
- [ ] Buy an asset pack or commission an artist, and with what budget?
- [ ] Does Australia's social media minimum age law apply to Spotter?
- [ ] Where do your training friends live? Their time zones decide whether async sessions move up.
- [ ] Should private rooms show weights by default?
- [ ] Future monetisation (cosmetics or premium features), which affects how avatar parts are structured.
