# Room (the gym page): design spec

Page: `src/pages/rooms/[id].astro`. Mockup: `docs/design/room/mockup.html`.
`<style id="page">` is the block to build from. `<style id="mockup">` only
holds the state labels and the grid of solo states, and is not part of the
design. Screenshots: `.shots/room/mockup-mobile.png` and
`.shots/room/mockup-desktop.png`.

The mockup adds a suffix to ids (`weight_kg-1`, `exercise-2`, `minutes-10`)
only because it shows many states on one page. The real ids are
`weight_kg`, `reps`, `minutes`, `seconds`, `distance_km` and `exercise`.

## 1. Plan

### Shared

The Gym group is this page alone, so nothing has to be repeated across a
group. It still has to sit beside Lobby (`home`) and Logbook (`history`), so
it keeps the rules those pages use:

- **Night surface** (system section 4) and the RPG-style `.panel` boxes,
  each with its name on the top border.
- **A set is written the way a lifter writes it**, using the same
  `setLabel()` strings as history and home: `140 kg × 5`, `BW + 10 kg × 6`,
  `BW × 10`, `1:30`, `5 km · 25:00 · 5:00 /km`.
- **State chips** (`.chip.state-*`, 16 px pixel icon plus a word) look the
  same as on home's "What your squad sees".
- **One primary button per screen.** In the sheet it is Done, or Save while
  editing, or Choose while idle. Everything else is `.button.secondary`.
  The room and log actions also use the new `.quiet` size (8 px label).
- **Voice.** Plain words on forms, errors and the destructive confirms. The
  banter goes in the slacking line, the empty room and the cardio bubble.

### Who and when

The main user is between sets, with a phone in one sweaty hand and 60 to
180 seconds of rest, glancing at the screen rather than reading it. Usually
two to five of the squad are in the same room. There are three other
moments:

- Arriving alone with a passcode to send.
- Fixing a typo during rest.
- Leaving, or, for the host, closing up for everyone.

### The one job

**Log the next set.** That means reading the rest timer, checking the
pre-filled numbers, then pressing **Done**. Everything else on the page
either supports that or sits away from it.

### Hierarchy

1. **The rest timer** (80 px VT323) while resting. Its border and colour
   say the state: water-blue while resting, slacking-red once it's over.
2. **The numbers you are about to log** (48 px VT323, pre-filled) and the
   full-width **Done**, pinned to the bottom of the phone. These must read
   correctly at arm's length.
3. **The log** ("This workout"): what you did, with the workout clock on its
   border and a pencil on every row.
4. **The room**: the passcode, the 12 pips, Leave and End. You need these
   once at the start and once at the end.

### Reuse

These carry over unchanged:

- From the layout: `.passcode-box`/`.passcode`, `.chip` and
  `.state-idle/lifting/resting/slacking`, `.badge`, `.bubble`, `table` and
  `.num`, `.hint`, `.error`, `.actions`, `button`, `.button.secondary` (the
  Night version), `button:disabled`, `.wide`, `label`, `input`, `select`.
- From the old room page: `.panel`, `.panel-title`, `.gym`, `.pips`,
  `.people`, `.tally`, `.ditto`, `.vh`, `.switch` (the Change picker),
  `.recent`, `.last`, `.big-pair`, `.big`, `.unit`, `.times`.

New pieces, all in `<style id="page">`:

| Piece | What it is |
| --- | --- |
| `.sheet > .tab` | Your state chip, worn as the sheet's name tab |
| `.rest`, `.rest-top`, `.timer`, `.rest-what`, `.rest-say`, `.rest-static`, `.rest-adjust` | The rest block |
| `.tool` | Small VT323 buttons inside the sheet: −15 s, +15 s, Skip, Start/Stop, Reset |
| `.big-time`, `.mmss`, `.colon`, `.running` | The m:ss time fields, shared by plank and cardio |
| `.big-pair.even`, `.big-pair.cardio` | Column ratios for the bodyweight and cardio kinds |
| `.stopwatch` | The stopwatch row |
| `.panel-clock` | The workout clock on the log panel's border |
| `.log .set`, `.u`, `.sub`, `.fix`, `tr[aria-current]` | The log table: units, the pace line, the pencil column, the row being edited |
| `.confirm`, `.if-open`/`.if-closed`, `.confirm-box` | The one confirm pattern |
| `.quiet` | Smaller secondary buttons for room and log actions |
| `.lift-row`, `.lift-cancel`, `.logged-at` | The edit header |
| `.badge.host` | The host's badge |
| `.sheet.flash` | The rest-over flash |

Four 8 × 8 icons are new, for `src/sprites/icons.ts`: an idle standing
figure, play, stop and a pencil. Their grids are the `<symbol>`s at the top
of the mockup. `dumbbell`, `drop` and `phone` already exist there.

### Template check, and what it changed

The first plan was a dark card stack with a timer widget on top and a
kebab menu holding Leave and End. Change the colours and that is any
fitness app. These changes came out of the check:

- **The sheet wears your state.** Your state chip is the sheet's name tab,
  the way an avatar wears a name tag on the map. It reads Idle, Lifting,
  Resting or Slacking, with its pixel icon. The old 8 px "Log a set" title
  became a visually hidden `h2`.
- **The rest block is the water cooler.** Its border is `--resting` blue,
  the one non-green hue in the scenery. When rest runs out the border and
  the count-up turn `--slacking` red and the line
  `Your squad can see you 👀` appears. You see the same state change your
  squad will see on the map later.
- **The stopwatch has no display of its own.** It ticks inside the
  minutes and seconds fields, so pressing Stop simply leaves the time where
  it was logged. There is no second number to copy across.
- **The log stays a paper logbook.** It keeps the ditto marks, uses one
  "Set" column written like a lifter writes, puts the pace in small type
  under a run, and gives each row a pixel pencil. The workout clock rides
  the panel's border like a game timer.
- **No room menu.** There are only two room actions, and system section 14
  rules out a hamburger for three items or fewer. Leave and End sit in the
  Room panel, at the opposite end of the page from Done.
- **The destructive confirms name the people affected**: "Mia, Ji-woo and
  Tom get sent home". They name who, instead of a generic "Are you sure?".

## 2. Requirements covered

| Requirement (source) | Element |
| --- | --- |
| "A normal set costs exactly two taps … Done logs the set with pre-filled values" (MVP, Key screens) | Pre-filled 48 px fields and a single `.wide` Done at the foot of `.sheet`. Nothing is added between the fields and Done. |
| LOG-3 "A set records what its exercise's kind measures … Each pre-fills from the person's last set of that exercise" (4-week) | One form per kind, from `exercise.kind` (section 3), with values from `lastSet()`. |
| LOG-4 "Done … starts a rest timer from the exercise's default (60 to 180 s; none after cardio), adjustable by ±15 s or skipped. The next set of that exercise starts from the rest last chosen for it" | `.rest` with `.timer` counting down to `completedAt + restTargetS × 1000`, and `.rest-adjust` (−15 s / +15 s / Skip) posting `action=rest`. No rest block after cardio (`restTargetS` 0); a `.bubble` explains why. |
| LOG-5 "When rest ends, the page plays a sound and flashes, if it is open" | At 0: a square-wave beep, `.sheet.flash` (3 flashes at 2 Hz), then the slacking look. |
| LOG-6 "… cardio distance" and the tally | `.tally`: "N sets · X kg moved · Y km covered so far". Each part appears only when it isn't zero. |
| LOG-8 "Edit or delete a set after logging it" (P1) | A pencil link `?edit=<id>` on every log row opens the sheet's edit state: Save posts `action=edit`, Delete posts `action=delete` behind a confirm. |
| ROOM-5 "People can … leave at any time. Leaving … does not delete anything" | "Leave room" (`action=leave`), with the note "Leaving finishes your workout. Your sets stay in the book." |
| ROOM-6 "The host can also end it for everyone … keeping every set" | "End room" (`action=end`): host only, behind the `.confirm` box naming who gets sent home. |
| GYM-11 "their own screen says 'your squad can see you'" | `.rest.over .rest-say` |
| GYM-15 "a text list of everyone in the room" | `.people`, unchanged, plus a `Host` badge. |
| ROOM-1/2/4, passcode and 12 people | `.passcode`, the 12 `.pips`, "N of 12 in", and the invite hint. |
| "Tap targets at least 48 px, with primary buttons in the bottom third" (MVP, UX rules) | `.sheet` is sticky at the bottom below 900 px. Done and Save are 64 px tall, the fields 72 px, `.tool` buttons 48 px, pencils 44 × 44 px. |
| "Timers and weights readable at arm's length (at least 32 px numerals)" | Timer 80 px; fields 48 px; the no-JS rest text 32 px. |
| "Taps only" | `<details>` and buttons only. No gestures. |
| Workout clock (brief) | `.panel-clock` on the log panel, ticking from `openWorkoutStart()`. |
| Stopwatch for duration and cardio (brief) | `.stopwatch` with Start/Stop and Reset driving the `minutes`/`seconds` fields. It survives a reload through `sessionStorage`. |
| Copy bank (system 3) | `Your squad can see you 👀`; `Just you so far. Send the passcode to the squad 📲`. "Rest's up. Back under the bar 🔔" is used for the first 30 s over (see States). |

## 3. Structure

Everything sits in one `<div class="gym">` inside `main`. The sheet comes
last in source order, so that `position: sticky; bottom: 0` pins it on
phones. At 900 px and up, `.gym` becomes a grid (`1fr 24rem`): the panels
stack on the left, and `.sheet` fills the right column, sticky at
`top: 2rem`. This is unchanged from before.

### 1. Room panel: `section.panel.sign`

- `h1.panel-title` "Room".
- `.passcode-box`:
  - `span.passcode`. Keep exactly `class="passcode"`, with the code as its
    only text, because `spec/helpers.ts` scrapes it.
  - `p.spots`: the 12 `.pips` and "N of 12 in".
- `p.hint`: "Send the code to the squad. They join at {inviteUrl}."
- `div.actions.room-actions` holding the leave form:
  `<form method="post">`, hidden `action=leave`, and
  `<button class="button secondary quiet" aria-describedby="leave-note">Leave room</button>`.
- `p.hint.leave-note#leave-note`:
  - Normally: "Leaving finishes your workout. Your sets stay in the book."
  - When you are the only member: "You're the last one in, so leaving
    closes the room."
- **Only when `isHost` and there are other members**:
  `details.confirm.end-room`, alone on its own row.
  - `summary.button.secondary.quiet` contains
    `<span class="if-closed">End room</span><span class="if-open">Cancel</span>`.
  - Inside it, `form.confirm-box` (`method="post"`) with hidden
    `action=end` and `p`: "End the room for everyone? {other names joined
    with commas and 'and'} get sent home and their workouts finish. Every
    set is kept." Then `button.button.secondary.quiet` "End room".
  - With no one else in, End is hidden, because Leave already closes the
    room.
  - `isHost` is `room.hostUserId === user.id`.

### 2. Squad panel: `section.panel`

- `h2.panel-title` "Squad".
- `ul.people`: one `li` per member. Names must stay in the HTML (a spec test
  checks for "Tester").
  - Your own row is `li.me` with `<span class="badge">You</span>`.
  - The host's row adds `<span class="badge host">Host</span>`.
- `p.alone` with the copy bank line when `members.length === 1`.

### 3. Log panel: `section.panel`, only when the workout has sets

- `h2.panel-title` "This workout".
- `p.panel-clock`: `<span class="vh">Workout time </span><time datetime="PT31M42S" data-start="{startedAt ms}">31:42</time>`.
  - The server renders the elapsed time with `clock()`.
  - JS ticks it every second: m:ss, then h:mm:ss.
  - Keep it free of icons: at 360 px the title tab and the clock only just
    fit on the border together.
- `p.tally`: `<b>{n}</b> set(s)`, then `· <b>{kg(volume)} kg</b> moved` if
  the volume is above 0, then `· <b>{km(distanceKm)} km</b> covered` if
  there is distance, then "so far".
- `table.log`:
  - Header: `th` "Exercise" | `th.num` "Set" | `th.fix` with
    `<span class="vh">Edit</span>`.
  - **Exercise cell**: the name, or a `td.ditto` with
    `<span aria-hidden="true">"</span><span class="vh">{name}</span>`
    when it is the same exercise as the row above.
  - **Set cell** (`td.num.set`): `setLabel()`, with each unit wrapped in
    `<span class="u">` so the numbers stand out. Cardio rows put the pace
    on its own line: `5 <span class="u">km</span> · 25:00<span class="sub">5:00 /km</span>`.
    So write cardio as the "best" form (`5 km · 25:00`) plus a pace `.sub`,
    not as the one-line `setLabel()`.
  - **Pencil cell** (`td.fix`):
    `<a href="?edit={id}"><svg 16×16 pencil/><span class="vh">Edit {name}, {label}</span></a>`.
  - **The row being edited** gets `aria-current="true"`. It is marked with
    a leaf bar on its left edge and a pencil on a leaf fill. Its link goes
    back to `?exercise={exerciseId}` with `aria-label="Editing this set. Cancel"`.
- The finish form: hidden `action=finish` and
  `button.secondary.button.quiet` "Finish workout". It now redirects to
  `/workouts/<id>`.

### 4. Sheet: `section.panel.sheet`

From top to bottom:

1. **`span.chip.state-{state}.tab`**: the 16 px icon plus the word. The
   state comes from the page:

   | State | When |
   | --- | --- |
   | Slacking | Rest is running and past its target |
   | Resting | Rest is running |
   | Lifting | An exercise is chosen |
   | Idle | Otherwise |

   "Rest is running" means: there is an open workout, its newest set has
   `restTargetS > 0`, and `restEndedAt` is null.
2. **`h2`**:
   - Lifting or resting: `h2.vh` "Log a set".
   - Idle: a visible `h2.lift.lift-row` "Pick a lift".
   - Editing: a visible `h2.lift` inside the edit header.
3. **`div.rest`** (`.rest.over` when slacking), whenever rest is running,
   in every sheet state:
   - `p.rest-say[role=status]`, only when over (see States for the text).
   - `div.rest-top`:
     - `p.timer[role=timer]`, holding "m:ss" left, or "+m:ss" over.
       `data-end` is the end time in ms.
     - `p.rest-what`, two `span`s:
       - "of <b>3:00</b> rest" (when over: "over a <b>3:00</b> rest").
       - "after <b>{setLabel of the newest set}</b>". Put the lift name in
         front if the newest set was a different exercise from the one in
         the form: "after <b>Deadlift 140 kg × 5</b>".
   - `p.rest-static`: "Rest 3:00 · next set at 6:42 pm". The server renders
     it and JS removes it. The server also renders the timer `p` with
     `hidden`, and JS shows it.
   - `form.rest-adjust` (`method="post"`): hidden `action=rest`, then
     three `button.button.secondary.tool` with `name="delta"`:
     - `value="-15"`, label "-15 s", `aria-label="15 seconds less rest"`
     - `value="15"`, label "+15 s", `aria-label="15 seconds more rest"`
     - `value="skip"`, label "Skip"

     JS may submit these with `fetch` and update `data-end` in place.
     Without JS they post and redirect back.
4. **Idle** (no `?exercise`, not editing): `form.pick` (GET) containing:
   - the `h2`;
   - `.recent-label` and `.recent` chips (only when there are sets);
   - `label[for=exercise]` and `select#exercise[name=exercise]` with the 8
     equipment optgroups;
   - `button.wide` "Choose".
5. **Lifting or resting**:
   1. `details.switch`, as before: the summary holds `.lift`, `.set-no`
      "Set n" and `.change`, and the picker form inside is unchanged.
   2. `form.set-form` (`method="post"`): hidden `exercise_id`, then:
   3. `p.last`. Only show it when it adds something, that is when the rest
      block isn't already showing a set of this same exercise:
      - With a last set: "Last time <b>{setLabel(lastSet)}</b>".
      - Without one: "First time on this one. Ease into it."
   4. The fields for the kind (below).
   5. `p.error#set-error[role=alert]` when there is an error. The field it
      is about gets `aria-invalid="true"` and
      `aria-describedby="set-error"`. `readSet()` already returns `field`.
   6. `.stopwatch`, for duration and cardio only.
   7. `button.wide` "Done".
6. **Editing** (`?edit=<id>`, and `setToEdit()` returns a set):
   1. `div.lift-row` holding:
      - `h2.lift` {name}
      - `.set-no` "Set n" (its number among sets of that exercise in this
        workout)
      - `span.badge` "Editing"
      - `a.lift-cancel[href=?exercise={exerciseId}]` "Cancel". It stands
        where Change stands.
   2. `p.hint.logged-at`: "Logged at 6:38 pm" (`completedAt`, en-AU,
      lowercase am/pm).
   3. `form#set-edit.set-form` (`method="post"`): hidden `action=edit`,
      hidden `set_id`, and the kind's fields pre-filled with **that set's**
      values.
   4. `details.confirm`, alone on its row:
      - The summary is `.button.secondary.quiet` with
        `<span class="if-closed">Delete</span><span class="if-open">Keep it</span>`.
      - Inside, `form.confirm-box`: hidden `action=delete`, hidden
        `set_id`, then `p` "Delete {name} set {n}, {label}? It can't be
        undone." and `button.button.secondary.quiet` "Delete set".
   5. `<button type="submit" form="set-edit" class="wide">Save</button>`.
      The button sits outside the form, using the `form` attribute, so
      Save stays at the foot of the sheet where Done was.

#### Fields by kind

Keep `name` before `value` on `weight_kg` and `reps` (a spec test checks
this with a regex).

| Kind | Markup |
| --- | --- |
| `weight` | `.big-pair`: `.big` > `label` "Weight" + `.field` > `input#weight_kg[name=weight_kg]` (step 0.5, 0–1000, required) + `.unit` "kg"; `.times` "×"; `.big` > `label` "Reps" + `input#reps[name=reps]` (1–1000, required). This is the same as before. |
| `bodyweight` | `.big-pair.even`. The left label is `BW + <span class="vh">added weight</span>`, and the weight input is **not** `required`, so blank means 0. Pre-fill 0 when the last set had none. Reps are as for `weight`. |
| `duration` | `fieldset.big-time` > `legend` "Hold" > `.mmss`: `label.vh` "Minutes" + `input#minutes[name=minutes]` (0–600), `span.colon` ":", `label.vh` "Seconds" + `input#seconds[name=seconds]` (0–59). Pre-fill from `lastSet().durationS`. |
| `cardio` | `.big-pair.cardio`: `.big` > `label` "Distance" + `input#distance_km[name=distance_km]` (0.01–1000, step 0.01, required) + `.unit` "km"; then `fieldset.big-time` with `legend` "Time" and the same `.mmss`. Pre-fill from `distanceM / 1000` and `durationS`. |

#### The stopwatch row

`.stopwatch` holds two `button.button.secondary.tool` (`type="button"`) and
a `p.say`:

- **Start/Stop**: a pixel play icon and "Start", or a stop icon and "Stop"
  with `aria-pressed="true"`.
- **Reset**.
- **`p.say`**:
  - Duration: "Start, hold, Stop."
  - Cardio, idle: "Pace <b>4:52 /km</b>", worked out live from the fields.
    With no valid distance: "Pace shows once there's a distance."
  - Running: "Clock's running. Stop fills the time."

Render the two buttons `hidden` on the server and let JS reveal them.
Without JS the person types the time.

#### Sheet ids

The real ids are `exercise`, `weight_kg`, `reps`, `minutes`, `seconds`,
`distance_km`, `set-error` and `set-edit`.

## 4. States

| State | Trigger | What changes |
| --- | --- | --- |
| **Resting** (default) | The newest set's rest is running and not yet at 0 | Tab: Resting (drop icon). The `.rest` block has a blue border and counts down. Below it are the lift row and the pre-filled next set, and there is no `.last` line. |
| **Rest over (slacking)** | The timer reaches 0 | Once: a square-wave beep (Web Audio), `.sheet.flash`, and the tab switches to Slacking (phone icon). Then `.rest.over`: a red border, `+m:ss` counting up in `--slacking`, and `.rest-say`. For the first 30 s over the line reads "Rest's up. Back under the bar 🔔", then "Your squad can see you 👀" (GYM-11). `role=status` announces each line once, never the seconds. With reduced motion there is no flash; the red border and the text still change. |
| **Lifting** | An exercise is chosen and no rest is running (after Skip, before the first set, or after cardio) | Tab: Lifting (dumbbell). No rest block. `.last` shows. |
| **Idle** | No `?exercise` and not editing | Tab: Idle (standing figure). "Pick a lift", the recent chips, the select and a primary Choose. A running rest block still shows above it. |
| **Empty** | Alone, no sets | 1 of 12 pips, one `li.me` with both badges, `.alone`, no log panel, an idle sheet without chips, Leave only, and the last-one-in note. |
| **Cardio** | The exercise kind is `cardio` | Distance and time side by side, the stopwatch row and a live pace. Its Done never starts a rest. After the redirect (`?rested=1`) the sheet shows `p.bubble[role=status]` "Logged! No rest timer after cardio 🏃". |
| **Stopwatch running** | Start tapped | The time fields become `readonly` and `.big-time.running` (leaf border and digits), ticking every second. The button says Stop. **Stop** writes the elapsed time into the fields and makes them editable again. **Reset** sets 0:00. **Done while running** stops the stopwatch first, then submits. Stored in `sessionStorage` under `spotter:stopwatch:{roomId}:{exerciseId}` = start time in ms, and resumed on reload. The stored start is cleared on Stop, Reset, or a successful log. |
| **Duration** | The exercise kind is `duration` (Plank) | "Hold" as m:ss plus the stopwatch. The drawn example also shows a rest block from the previous plank set. |
| **Bodyweight** | The exercise kind is `bodyweight` | "BW +" kg (optional) × Reps; "Last time BW + 10 kg × 6". |
| **First time on a lift** | No `lastSet` for the exercise | "First time on this one. Ease into it." Weight 0 × 8 reps. For duration, cardio and bodyweight the fields start empty (or 0 added weight) rather than inventing numbers. |
| **Edit set** | `?edit=<id>` for a set of yours in this open workout | The sheet switches to the edit header, "Logged at", the fields filled with that set, Delete and Save. The log row is marked. A running rest block stays at the top, because a correction usually happens during rest. An unknown or someone else's id falls back to the normal sheet. |
| **Delete confirm** | Delete tapped once | `details[open]`: the summary now reads "Keep it", in the same place, and the `.confirm-box` below it holds the sentence and "Delete set". After deleting, redirect to `?exercise={id}`. |
| **End room confirm** (host) | End room tapped once | The same pattern: the summary reads "Cancel" and the box names who gets sent home. Ending redirects the host to `/workouts/<id>` or `/`. Everyone else finds out on their next request: they land on home with a notice (home's design). |
| **Non-host** | `!isHost` | No End room details. The Squad list shows who the host is. |
| **Error** | POST validation fails (400) | `.error` under the fields, with the message from `readSet()` (for example "Distance is 0.01 to 1000 km."). The field gets `aria-invalid`. **Echo the submitted values** in the fields, not the pre-fill, so the person can see what was wrong. |
| **Pending** | Done or Save submitted | The button is `disabled` (label kept, `--dim` fill), the fields are `readonly`, and the sheet has `aria-busy`. The rest block keeps ticking. The existing script and its `pageshow` reset carry over; apply them to `#set-edit` too. |
| **Without JS** | No script | The `.rest-static` text replaces the timer. ±15 s and Skip still post. The stopwatch buttons stay hidden. The clock shows its server-rendered value. No beep or flash. |
| **Signed out / not a member / room closed** | — | Unchanged: redirect to sign in, or 404. A closed room redirects home with a notice (home's design). |

The rest-over moment (the 3 flashes) is described here but not drawn,
because it is motion. The CSS is `.sheet.flash` in `<style id="page">`.

## 5. Departures

- **The own state chip is drawn on the sheet before server presence
  exists.** It is derived on the page from the newest set's timestamps,
  which matches GYM-12's method. When SSE lands, use the server's state.
- **The red count-up starts at 0, not at +30 s.** The brief asks for the
  slacking look once rest runs out, but GYM-11 makes Slacking a server state
  only at 30 s over. The design follows the brief for the timer colour and
  the chip, and uses the 30 s mark only to switch from "Rest's up …" to
  "Your squad can see you 👀". **Open question**: once others can see your
  state, should your own chip also wait 30 s, so both screens agree?
- **`.tool` buttons use VT323 24 px**, not the display font, because their
  labels are numbers (system section 6: every number in VT323). They are
  `.button.secondary` in every other respect.
- **`.quiet` (8 px display label)** applies to the room and log actions,
  which follows system section 6 (8–12 px for buttons other than primary
  gym actions). Finish workout drops from 16 px to 8 px with it.
- **New visual patterns** not yet in the system: the panel clock on the
  border, the chip as the sheet tab, and the summary-turns-into-Cancel
  confirm. They use only tokens and the `--px` grid. Add them to system
  section 9 if they stay.
- **Phone sheet height.** While resting with a weight lift, the pinned
  sheet is about 470 px tall at 390 px wide, roughly 70% of a phone screen
  with browser chrome. That is because the timer, the next set and Done
  all belong there. Scrolling up through the log shows a strip of about
  200 px above it. This is accepted for now; revisit if it feels cramped in
  the gym (one option: a smaller `.timer` while editing).

## Layout changes

None needed. Everything is in `<style id="page">`. The global block in the
mockup is the current `Layout.astro` block, unchanged. Move `.panel`,
`.panel-title` and `.quiet` to the layout when the workout summary page
uses them.

## Notes for the build

- The four new icons go in `src/sprites/icons.ts` as 8 × 8 grids, drawn
  with `Sprite` at scale 2.
- One `<script>` covers all the JS:
  - the rest timer (from `data-end`; beep, flash and state swap at 0);
  - the workout clock;
  - the stopwatch;
  - `fetch` for the rest forms;
  - pending on submit.

  Tick once a second with `setInterval`, and recompute from `Date.now()`
  each tick so the timers don't drift after the phone sleeps.
- The beep is the only sound, and it is on by default (system section 11).
  A sound toggle belongs to the gym menu later.
