# Home (`/`) design spec

Mockup: `docs/design/home/mockup.html` (open it in a browser). Screenshots:
`shot-mobile.png`, `shot-desktop.png`. One file serves two pages: signed out
(the landing page) and signed in (the "lobby" you see before entering a gym).

## 1. Plan

**Who and when.**

- *Signed out:* a friend who got a link in the squad chat ("get on Spotter"),
  on a phone, deciding in a few seconds whether this is worth signing up for.
  At the showcase, someone on a laptop who has never heard of it.
- *Signed in:* arriving at the gym or about to leave home, phone in one hand.
  Either a mate has already texted a passcode ("K7M2QX get in"), or they are
  first and will open the room themselves. Sometimes they are going back into
  a room they left a few minutes ago. Straight after sign-up, the same page
  meets a brand-new user who has no rooms and no workouts.

**The one job.**

- Signed out: show what being "spotted" looks like, then **Sign up**.
- Signed in: **get into a room with the squad.** The primary action is
  **Join**, because in a squad of 2 to 8 one person creates the room and
  everyone else joins it, so Join is the commonest way in. It is also the only
  way in that needs typing. **Create room** is secondary (leaf).

**Hierarchy.**

- Signed out: (1) the headline and its two buttons; (2) the squad preview,
  where four friends show the four states as chips and one person tells
  another to put the phone down; (3) the three steps.
- Signed in: (1) the passcode field and Join, set in the passcode's own display
  font; (2) your rooms, shown as passcode key tags; (3) the last workout as a
  logbook page. The numbers that must read correctly at a glance are the best
  sets (`62.5 kg × 8`) and the session totals (`14` sets, `7,487.5 kg`).

**Reuse.** `.card`, `button` / `.button.secondary`, `.wide`, `label` +
`input`, `.hint`, `.actions`, `.bubble`, `.passcode`, `table` + `.num`. The
squad preview uses the system's planned `.chip.state-<name>` (section 9),
which this page needs before the gym ships, so it is listed as a layout
change. New page classes are small: `.pitch`, `.peek` / `.squad`, `.howto`,
`.door-create`, `.or`, `.passcode-input`, `.room-keys`, `.logbook` /
`.totals`.

**What the template check changed.** The first draft was "hero, three
feature cards, a couple of form cards, a recent-activity card", which would
fit any SaaS product with the colours swapped. Changes:

- The three "how it works" cards became **one logbook page with numbered
  sets** (`SET 1`, `SET 2`, `SET 3`), so the steps read like a workout and not
  like a feature grid.
- The landing gained the **squad preview**: four pixel heads with real lifts,
  rest timers and the state chips, and a preset nudge in a speech bubble. The
  pitch is shown, not just described.
- The rooms list became **key tags**: each room is its passcode in the same
  leaf-on-ink display style as the gym's top bar. The Join field uses that
  same display font, so what you type looks like the code your mate sent.
- The last workout became a **logbook page** with kg × reps and the session
  volume, instead of "7 Oct · 3 sets".
- The two green buttons became one primary (Join) and one secondary (Create
  room).

## 2. Requirements covered

| Requirement (source) | Element |
| --- | --- |
| "`/` (signed out): What Spotter is, in two sentences; sign up, sign in, link to `/readme/`" (4-week spec, Screens) | `.pitch` h1 + one paragraph; Sign up (`.button`) and Sign in (`.button.secondary`); "Read what Spotter is for" link |
| "`/` (signed in): Create a room, join with code, … history, last workout" (4-week spec, Screens) | `.door` card (POST `/rooms`, POST `/join`); Last workout card with link to `/history`; History stays in the top bar |
| ROOM-1 "Any signed-in user can create a room" | `<form method="post" action="/rooms">` + **Create room** |
| ROOM-2 "Any signed-in user with the passcode can join. A wrong code gives one generic error" | `<form method="post" action="/join">`, `name="passcode"`; the error itself renders on `/join` (see States) |
| LOG-7 "History lists the person's past workouts, newest first, with their sets" | Last workout logbook shows `history(user.id)[0]` with its sets; **All history** goes to `/history` |
| "Home: … Join with code, … last workout, recent records" (MVP spec, Key screens) | Join, last workout. Records, solo and Quick Join are out of scope; see Departures |
| "Being seen is the feature … always shown three ways: colour, a pixel icon, and a word" (system 2, 5) | Squad preview chips: state colour + 8 × 8 pixel icon + word |
| "Empty: first use … a friendly line from the copy bank and the one action that fixes it" (system 13) | First-use bubble + empty logbook with "No workouts yet. Your future self is waiting 🏋️"; the door card is the action |
| "Pending: the button disabled with its label kept" (system 13) | Pending state: **Join** disabled, label kept, muted fill, pressed down |
| "On phones, the page's primary action sits in the bottom third" (system 8) | Signed in: Join is the last element of the first card, about 520–580 px from the top on a 390 × 844 phone. Signed out: see Departures |
| "One primary button per screen" (system 8) | Signed in: Join only. Signed out: Sign up only |
| Tap targets ≥ 44 px (system 12) | Room key rows are 56 px tall; every button is 48 px; top-bar links are 44 px |

## 3. Structure

The shell (top bar, `main`, footer) is the layout as it is. Classes in
**bold** are new, from `<style id="page">`.

### Signed out

1. `section.`**`pitch`**
   - `h1` "Train together, apart." (24 px at every width, `--deep`).
   - `p`: "A pixel gym for friends who used to train together. Log your sets,
     and your squad sees you lift, rest, or rest a bit too long."
   - `.actions`: `a.button[href=/signup]` "Sign up",
     `a.button.secondary[href=/signin]` "Sign in".
2. `section.card.`**`peek`** `aria-labelledby` → `h2` "What your squad sees"
   - `p.bubble` "Priya to Ji-woo: Put the phone down 📵" (a preset from the
     copy bank).
   - `ul.`**`squad`**: four `li`, each a grid of a 32 px pixel head (8 × 8
     sprite at 4×, `aria-hidden`), then name + `span.what` detail, then a
     `span.chip.state-*`. Wrap numbers in `span.n` (no-wrap). Rows:
     Mia, Lifting, `Back squat · 100 kg × 5` · Tom, Resting, `Rest · 1:12 to
     go` · Ji-woo, Slacking, `Rest · 2:40 over` · Priya, Finished, `16 sets ·
     52 min`.
   - This content is static: an illustration in HTML, not live data.
3. `section.card` → `h2` "How a session goes", `ol.`**`howto`**, three `li`:
   `span.set-no` ("SET" over a 32 px VT323 numeral, `aria-hidden` because the
   `ol` already numbers them), then `h3` + `p`:
   - "Open a room" / "Get a passcode. Drop it in the group chat."
   - "Log your sets" / "Weight and reps, filled in from last time."
   - "Get spotted" / "Rest too long and the squad will know 👀"
4. `p > a[href=/readme/]` "Read what Spotter is for".

### Signed in

1. `h1` "Hi, {displayName}".
2. *(first use only)* `p.bubble` "New here? Join your squad's room, or start
   one and send the code 📲".
3. `section.card.door` → `h2` "Train with the squad"
   - `form.`**`door-create`** `method=post action=/rooms`:
     `button.button.secondary` "Create room" + `p.hint` "You get a passcode to
     send them." (side by side when there is room, stacked on phones).
   - `p.`**`or`** "or join one" (dashed `--px` ink rules each side).
   - `form method=post action=/join`: `label[for=passcode]` "Passcode";
     `input#passcode.`**`passcode-input`** with **every existing attribute
     kept** (`name="passcode" autocomplete="off" autocapitalize="characters"
     maxlength="8" required`) plus `aria-describedby="passcode-hint"`;
     `p#passcode-hint.hint` "Six letters and numbers, from your squad.";
     `.actions > button.wide` "Join".
4. *(if `myRooms.length > 0`)* `section.card` → `h2` "Your rooms", `p.hint`
   "Last active, newest first.", `ul.`**`room-keys`**: per room
   `li > a[href=/rooms/{id}]` containing `span.passcode` {passcode},
   `span.when` (relative time from `lastActiveAt`), and the pixel arrow
   (`aria-hidden`). The whole row is the link, at least 56 px tall.
5. `section.card.`**`logbook`** → `h2` "Last workout"
   - *with a workout:* `p.hint` date and duration ("Tue 6 Oct, 6:12 pm · 52
     min"; leave out the duration while `endedAt` is null and add
     `span.badge` "Live" after the h2, as history does); `dl.`**`totals`**
     with Sets (count) and Volume (Σ weight × reps, `kg` unit in a smaller
     `span.unit`); `table` with `th` Lift / Sets (`.num`) / Best (`.num`), one
     row per exercise in the order first done, Best = the heaviest set
     (most reps breaks a tie), formatted `62.5 kg × 8`;
     `a.button.secondary[href=/history]` "All history".
   - *with none:* the same table head, then one `td.empty[colspan=3]` "No
     workouts yet. Your future self is waiting 🏋️", then `p.hint` "Your first
     set lands here once you log it in a room." No All history button.

**Data notes for the frontmatter** (no new tables or endpoints):

- Add `lastActiveAt` to the `myRooms` select for the "12 min ago" label.
  Format it as: under an hour → "N min ago", today → "N h ago", yesterday →
  "Yesterday", otherwise "3 Oct".
- Add `isNull(roomMembers.leftAt)` to the `myRooms` query (and
  `isNull(rooms.closedAt)` once ROOM-6 closes rooms). Today the list includes
  rooms you have left, and `isMember` makes those links 404.
- Group `last.sets` by `name` for the table. Totals come from the same rows.

**Pixel icons.** Five 8 × 8 icons (dumbbell, drop, phone, trophy, arrow) are
an inline `<symbol>` sheet in the mockup, drawn in `currentColor` and shown at
16 px (2×). Build them as a small `Icon.astro` that the gym page can share.
The pixel heads use raw hex, which the system allows inside sprite palettes
(section 10), and have at most 3 colours plus transparency.

## 4. States

| State | Trigger | What changes |
| --- | --- | --- |
| Signed out | No session (`Astro.locals.user` empty), including straight after Sign out | Landing: pitch, squad preview, how a session goes. Top bar shows Sign in / Sign up |
| Signed in, default | User has rooms and/or a workout | Door card, Your rooms (up to 5), Last workout logbook |
| First use (empty) | `myRooms.length === 0 && !last`. This is also where sign-up lands, so it serves as sign-up's success state | Welcome bubble above the door card, no Your rooms, empty logbook. Each card shows independently: rooms but no workout gives the empty logbook without the bubble |
| Pending | A form is submitted on a slow connection | The tapped submit button gets `disabled`: label kept, `--muted` fill, pressed down 4 px, `cursor: progress`; the form gets `aria-busy="true"`; the Join input keeps its value. Needs a few lines of script (see Layout changes) |
| Error | — | Home renders no errors of its own. An empty passcode is stopped by `required`. A wrong passcode posts to `/join`, which shows its `.error` there (join page design). Create room has no user error |
| Success | — | Create and Join both redirect into the room, which is their confirmation. No banner on home |

## 5. Departures

- **Landing primary not in the bottom third.** On a phone, Sign up sits about
  270–320 px from the top, which is the middle third, because if it came after
  the squad preview it would fall below the fold on a 390 × 844 screen. Being
  visible without scrolling matters more than thumb reach on a page you
  visit once. The signed-in page does meet the rule.
- **Squad preview shows week-10 states.** The chips, timers and nudge show
  the gym as specified, not as built today (the room page has no states yet).
  It is labelled "What your squad sees" and matches what the current landing
  copy already promises. If the gym slips, drop the `.peek` card and keep the
  pitch.
- **Not designed, on purpose:** Quick Join with "N training now", solo
  workout, recent records, the avatar editor link. The server doesn't support
  them yet. Once they exist: avatar editing becomes a link beside the h1
  greeting, and records become a row in the logbook card. Quick Join and solo
  are out of scope in the 4-week spec.
- **Follow-on reuse:** when the join page's `.code-input` (six boxes) lands,
  the home Join field should use it too, so passcode entry looks the same in
  both places.

Nothing else breaks the system.

## 6. Layout changes

These are shown in the mockup's `<style id="page">` under
`/* layout change: … */` and belong in `Layout.astro`, not the page:

1. **State tokens** on `:root`: `--idle`, `--lifting`, `--resting`,
   `--slacking`, `--finished` (known gap 4). The landing needs them before the
   gym does.
2. **Name the hard-coded hexes**: `--hover: #1a5c32`, `--leaf-hover: #d6ef86`,
   `--tile: #dbe7c6`, `--stripe: #eef5e1`, and use them in the body checker,
   the input inset, the table stripe and the hovers (known gaps 2 and 5).
3. **Focus ring on Paper** becomes `--ink` (known gap 1). Night keeps
   `--focus`.
4. **Button hover** uses `--hover` (6.8:1) (known gap 2).
5. **Display sizes on the 8 px grid** (known gap 3): `h1` 16 px, then 24 px
   above 420 px; `h2`, `h3`, `button` and `.button` 16 px; `th` and `.badge`
   8 px. (`.stat` 12 px also needs 8 or 16; this page doesn't use it.)
6. **Pending buttons**, global: a `button:disabled` style (`--muted` fill,
   `--paper` label, pressed by `--px`, `cursor: progress`), plus a small
   script in the layout. On `submit`, set `disabled` on `event.submitter` and
   `aria-busy` on the form. On `pageshow` with `persisted`, re-enable them so
   Back doesn't leave dead buttons. Every form page needs this.
7. **`.chip.state-<name>`** (system 9): `inline-flex`, 8 px display label,
   `--ink` text on the state fill, 2 px ink border, 16 px pixel icon. Home and
   the gym both use it, so it belongs in the layout. The room designer's
   version should win if the two differ.

**Tooling note:** headless Chrome won't make a window narrower than 500 px,
so `scripts/shot.sh`'s "mobile" image is a 500 px layout cropped to 390, not a
true 390 px render. I checked the true 390 px layout by loading the mockup in a
390 px iframe. Whoever owns `shot.sh` may want to do the same (or use
`--force-device-scale-factor` with device emulation).
