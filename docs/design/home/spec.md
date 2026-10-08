# Home (`/`) design spec

Mockup: `docs/design/home/mockup.html` (open it in a browser). Screenshots:
`node scripts/shot.mjs docs/design/home/mockup.html .shots/home/mockup` (not
kept in git). One file serves two pages: signed out (the landing page) and
signed in (the "lobby" you see before entering a gym).

**Revision, 8 Oct 2026.** Rooms can now be left and closed (ROOM-5, ROOM-6),
and sets come in four kinds (weight, bodyweight, duration, cardio; see
`src/lib/exercises.ts`). This revision adds the **left** and **ended**
notices, rewrites **Best** and the totals per kind, adds a **See summary**
button to the last workout, and tightens Your rooms to open rooms only.
Everything else is as built. The old "Layout changes" list has landed in
`Layout.astro`, so the mockup's global block is the layout's as it is today
and the page block is `index.astro`'s `<style>` plus the rules marked
`new` / `changed`.

## 1. Plan

### Shared (Lobby group: `home`, `join`)

- **Opening.** An `h1` in Press Start 2P (16 px on phones, 24 px from 421 px),
  then at most one `.bubble` line, then the `.card` that does the job. Join
  puts its 16 × 16 gym-door sprite beside the `h1`; home's illustration is
  the squad preview (signed out) and the passcode key tags (signed in).
- **The passcode is one object drawn one way:** leaf on ink, Press Start 2P,
  green or ink edge (`.passcode`). Join's slots, home's room keys, and now
  home's notices all show it like that, so a code looks the same wherever
  you meet it.
- **Primary action:** **Join**, `button.wide`, green, last in its card. The
  room-making action is always `.button.secondary` (home "Create room", join
  "New room") and posts to `/rooms`.
- **Fields:** the layout's `label` + `input` + `.hint`; errors are `.error`
  directly under the field (join only; home renders none).
- **Pending:** the tapped button is `disabled`, label kept, pressed down,
  `--muted` fill (layout `button:disabled`). Never a spinner.
- **Messages:** confirmations and notices are a `.bubble[role=status]` under
  the `h1`, one at a time, in VT323. Never a separate page or a toast.
- **Linking:** home's door card posts to `/join`, which is where a wrong code
  is shown. Join's "Room closed? Start a new one" mirrors home's Create room.
- **Voice:** a mate in the group chat. Plain on passcodes and data; one emoji
  at the end of a bubble line at most.

### Who and when

- *Signed out:* a friend who got a link in the squad chat, on a phone,
  deciding in a few seconds whether to sign up; at the showcase, someone on a
  laptop who has never heard of it.
- *Signed in:* arriving at the gym, phone in one hand, a passcode already in
  the chat or about to be made. **New in this revision:** people also land
  here *from* a room: after tapping Leave in a room where they logged nothing,
  or after opening a room that has since closed (the host ended it, or it shut
  itself after 4 hours idle). They need to know (1) what happened, (2) that
  nothing they logged was lost, (3) how to get back into a gym.

### The one job

- Signed out: show what being "spotted" looks like, then **Sign up**.
- Signed in: **get into a room with the squad.** Primary **Join**; **Create
  room** secondary. The notices don't add an action: the door card right
  under them *is* the way back in.

### Hierarchy

- Signed out: (1) headline and its two buttons; (2) squad preview; (3) the
  three steps.
- Signed in: (0, only when present) the notice bubble; (1) the passcode
  field and Join; (2) Your rooms as key tags; (3) the last workout. The
  numbers that must read at a glance are the Best column (`62.5 kg × 8`,
  `BW + 10 kg × 8`, `1:30`, `5 km · 25:00`) and the totals (`16` sets,
  `2,207.5 kg`, `6.2 km`).

### Reuse

Everything is existing: `.bubble`, `.passcode`, `.card`, `.actions`,
`.button.secondary`, `table` + `.num`, and home's own `.room-keys`,
`.logbook`, `.totals`. New page CSS is three small rules on `.notice` (the
key tag inside a bubble, and its dimmed "closed" version). No new component.

### What the template check changed

The first pass for the notices was a generic flash message ("Room closed.
Your workout has been saved."), which any app could show. Changes:

- **The room is named by its key tag**, the same leaf-on-ink `.passcode` as
  in Your rooms, so "K7M2QX" in the bubble is visibly the key you were just
  holding.
- **A closed room's key is dimmed** (`--paper` on `--muted`): the key no
  longer opens a door. The words say "has closed" too, so colour is never
  the only signal.
- **The Best column reads like a gym logbook, not a database:** `BW` for
  bodyweight, `BW + 10 kg` for a belt, a hold as a clock, a run as distance
  and time, all right-aligned in VT323 so the numbers line up.

The earlier template-check changes (logbook steps, squad preview, key tags,
logbook card, one primary) stand.

## 2. Requirements covered

| Requirement (source) | Element |
| --- | --- |
| "`/` (signed out): What Spotter is, in two sentences; sign up, sign in, link to `/readme/`" (4-week spec, Screens) | `.pitch` h1 + paragraph; Sign up (`.button`), Sign in (`.button.secondary`); "Read what Spotter is for" |
| "`/` (signed in): Create a room, join with code, … history, last workout" (4-week spec, Screens) | `.door` card (POST `/rooms`, POST `/join`); Last workout card with All history |
| ROOM-1 "Any signed-in user can create a room" | `form method=post action=/rooms` + **Create room** (unchanged) |
| ROOM-2 "with the passcode can join … one generic error" | `form method=post action=/join`, `name=passcode` (unchanged); the error renders on `/join` |
| ROOM-5 "People can … leave at any time. Leaving a room does not delete anything they logged" | **Left** notice: `You left room K7M2QX. See you next session 👋`; the room drops out of Your rooms |
| ROOM-6 "closes 4 hours after it was last active" (+ host can end the room, task brief) | **Ended** notice with the dimmed key; says the workout was wrapped up and is in history. Your rooms lists only open rooms (`rooms.closedAt IS NULL`) |
| Task brief: "Their open workout there was finished automatically and is in history. Copy should make clear their sets are safe and point to history" | `… so we wrapped up your workout. Every set is safe in your history 📒`, with "your history" linking to `/history` |
| LOG-3 as extended by the set kinds (ADR 0002) | Best per kind (see Structure 5); totals gain **Distance** |
| LOG-6 "a summary: duration, sets, total volume…" (summary page, designed in parallel) | **See summary** button to `/workouts/{id}` on a finished last workout |
| LOG-7 "History lists the person's past workouts" | **All history** button (unchanged) |
| "Success: confirmation in place (`.bubble` on Paper)" (system 13) | Both notices are `.bubble[role=status]` under the `h1` |
| "Errors say what to do next" / "Functional text stays plain" (system 3) | Notices say what happened and what's safe first; the joke is a short tail |
| "One emoji per string, at the end … never inside passcodes" (system 3) | One emoji each, after the last word, outside the key tag |
| "No colour alone" (system 12) | The closed key is dimmed *and* the sentence says "has closed" |
| "One primary button per screen" (system 8) | Still Join only; See summary and All history are secondary |
| Tap targets ≥ 44 px (system 12) | Buttons 48 px; room key rows 56 px; the inline "your history" link sits in a sentence (WCAG 2.5.8 inline exception) |

## 3. Structure

The shell (top bar, `main`, footer) is the layout as it is. **Bold** classes
come from `<style id="page">`.

### Signed out

Unchanged: `section.pitch`, `section.card.peek` (squad preview),
`section.card` "How a session goes", the `/readme/` link. See the mockup.

### Signed in

1. `h1` "Hi, {displayName}".
2. **One bubble at most**, first match wins:
   1. **Left**: `p.bubble.`**`notice`**`[role=status]`
      `You left room <span class="passcode">K7M2QX</span>. See you next session 👋`
   2. **Ended, with a workout from that room**: `p.bubble.notice[role=status]`
      `Room <span class="passcode closed">9BDMXE</span> has closed, so we wrapped up your workout. Every set is safe in <a href="/history">your history</a> 📒`
   3. **Ended, nothing logged there**: `p.bubble.notice[role=status]`
      `Room <span class="passcode closed">9BDMXE</span> has closed. Start a new one below and send the squad the code 📲`
   4. **First use** (`myRooms.length === 0 && !last`, as today): `p.bubble`
      `New here? Join your squad's room, or start one and send the code 📲`.
      A notice replaces it, so a brand-new person who leaves an empty room
      sees only "You left room…".
3. `section.card.door`: unchanged (Create room form, `.or`, Join form with
   every existing attribute).
4. *(only if `myRooms.length > 0`)* `section.card` "Your rooms": unchanged
   markup; the hint now reads **"Still open, newest first."** With no open
   rooms the whole section is not rendered (no heading, no empty line).
5. `section.card.logbook` "Last workout":
   - `p.hint` date and duration, as today; `span.badge` "Live" while
     `endedAt` is null.
   - `dl.totals`, each `div` only when its value is above 0, in this order:
     - **Sets**: count of sets (always shown).
     - **Volume**: `kg(volume(sets))` + `span.unit` "kg", only if > 0.
     - **Distance** (new): `km(distanceKm(sets))` + `span.unit` "km", only
       if > 0.
     So a lifting day shows Sets · Volume, a mixed day Sets · Volume ·
     Distance, a cardio-and-core day Sets · Distance. The `.totals` gap
     drops from 2rem to 1.5rem so three figures fit one row at 360 px.
   - `table` Lift / Sets / Best, one row per exercise in the order first done
     (`byExercise`), Best per kind:

     | Kind | Best set | Tie-break | Format | Examples |
     | --- | --- | --- | --- | --- |
     | weight | heaviest | most reps, then earliest (`topSet`, as now) | `{kg} kg × {reps}` | `62.5 kg × 8` |
     | bodyweight | most reps | heavier added weight | `BW × {reps}` when added weight is 0 or null, else `BW + {kg} kg × {reps}` | `BW × 20`, `BW + 10 kg × 8` |
     | duration | longest hold | earliest | clock: `m:ss`, `h:mm:ss` from an hour | `1:30`, `1:15` |
     | cardio | longest distance | shorter time | `{distance} · {clock}` | `5 km · 25:00`, `1.2 km · 15:00` |

     This is exactly `bestLabel(g.sets)` in `src/lib/logbook.ts` (the pace
     is left out there, which is right for this tight column). Distance is
     always km with up to two decimals (`5 km`, `6.2 km`, `0.8 km`). Best
     cells keep `white-space: nowrap` (existing `.logbook td.num`).
   - `div.actions` (new wrapper, `.logbook .actions { margin-top: 0 }`):
     - `a.button.secondary[href=/workouts/{id}]` **"See summary"**, only
       when `endedAt` is set (a live workout has no summary yet).
     - `a.button.secondary[href=/history]` "All history" (unchanged).
   - *With no workout:* unchanged (empty row, hint, no buttons).

**Query and data notes** (no new tables):

- `myRooms`: add `isNull(rooms.closedAt)` to the existing
  `isNull(roomMembers.leftAt)` filter.
- `?left` / `?ended`: read from `Astro.url.searchParams`. Show the bubble only
  if the value, uppercased, is six characters of `PASSCODE_ALPHABET`
  (`src/lib/passcode.ts`); otherwise ignore it. Render it as text (Astro
  escapes it); never trust it for anything but display.
- Ended, which copy: if the user has a workout whose `roomId` is the room
  with that passcode and the most recent `closedAt` → copy 2.2, else 2.3.
  Passcodes are reused after closing (ROOM-6), so look up the newest closed
  room with that passcode that the user was a member of. If that is awkward,
  the redirect can carry it instead (`/?ended=9BDMXE&logged=1`).
- Use `bestLabel`, `volume`, `distanceKm`, `km` and `kg` from
  `src/lib/logbook.ts`, so home, history, the room and the summary print the
  same numbers. Home's local `best()` goes.
- Optional: after rendering a notice, drop the query with
  `history.replaceState(null, "", "/")`, so a reload doesn't repeat it.

## 4. States

| State | Trigger | What changes |
| --- | --- | --- |
| Signed out | No session | Landing (unchanged) |
| Signed in, default | Has open rooms and/or a workout | Door card, Your rooms (open only, up to 5), Last workout. Mockup: Mia, three rooms, a mixed workout with all four kinds incl. a run and an incline walk |
| **Left** (new; success) | `/?left=K7M2QX`, set by the Leave action when the person logged nothing in that room | Left bubble. The room is gone from Your rooms (left rooms were already filtered). Mockup: Tom, a weights-only workout (Sets · Volume, no Distance) |
| **Ended, with a workout** (new) | `/?ended=9BDMXE` when the person opens a closed room and had an open workout there that was auto-finished; the room page more often sends them to `/workouts/{id}` instead | Ended bubble with the dimmed key and the history link. Last workout shows that workout. Mockup: Ji-woo, no open rooms left so Your rooms is hidden; a cardio-and-core workout (Sets · Distance, no Volume) |
| **Ended, nothing logged** (new) | As above, but no workout of theirs in that room | Ended bubble pointing to Create room; rest of the page as usual |
| First use (empty) | `myRooms.length === 0 && !last` and no notice | Welcome bubble, no Your rooms, empty logbook (unchanged) |
| Pending | A form submitted on a slow connection | Tapped button `disabled`, label kept, form `aria-busy` (unchanged script) |
| Error | — | None on home. Wrong passcode shows on `/join`. A malformed `?left`/`?ended` is ignored |

## 5. Departures

- **Landing primary not in the bottom third** (unchanged from the first
  design): on a phone, Sign up sits in the middle third so it is visible
  without scrolling.
- **Squad preview shows week-10 states** (unchanged): an illustration of the
  gym as specified.
- **Two secondary buttons in the logbook card.** Allowed (one primary per
  screen is kept), but it is the first card with two. They wrap to two rows on
  phones. If `/workouts/[id]` doesn't ship, drop See summary and keep the old
  single All history button.
- **The key tag inside a bubble**: `.passcode` at 16 px sits inline in a VT323
  line, so that line is a few pixels taller than the others. Accepted, because
  the tag is what makes the notice Spotter's.

### Copy bank additions (for `docs/design/system.md` section 3)

| Where | Copy |
| --- | --- |
| Left a room, nothing logged (ROOM-5) | `You left room K7M2QX. See you next session 👋` |
| Room closed, your workout was wrapped up (ROOM-6) | `Room K7M2QX has closed, so we wrapped up your workout. Every set is safe in your history 📒` |
| Room closed, nothing logged there (ROOM-6) | `Room K7M2QX has closed. Start a new one below and send the squad the code 📲` |

### Open questions

(Volume is settled by ADR 0002: a weighted pull-up's added kg counts; plain
bodyweight, holds and cardio add nothing. The mockup's 2,207.5 kg follows it.)

- **Home's Join field vs join's six slots.** Still the earlier follow-on:
  home uses a plain `.passcode-input`, join uses `.code-input`. Not changed
  here (out of scope), but the Lobby group would read as one thing if home
  adopted the slots.
- **"Log your sets / Weight and reps, filled in from last time."** on the
  landing predates the set kinds. A one-line wording change, if wanted:
  `Reps, kilos, holds or runs, filled in from last time.`
