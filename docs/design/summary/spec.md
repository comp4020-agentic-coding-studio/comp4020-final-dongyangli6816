# Workout summary (`/workouts/:id`): design spec

Mockup: `docs/design/summary/mockup.html`.
Screenshots: `node scripts/shot.mjs docs/design/summary/mockup.html .shots/summary/mockup`
(not kept in git). The page is built as `src/pages/workouts/[id].astro`.

## 1. Plan

### Shared: the Logbook group (`history`, `summary`)

Identical in `docs/design/history/spec.md` and `docs/design/summary/spec.md`.

**The rule:** a workout is drawn the same way wherever it appears. The summary
page is a history entry blown up to full size, plus you and the moment. Same
names, same figures, same table, same wording. Only the size of the tally
figures changes.

- **Surface.** Both pages are Paper. This departs from system.md section 4,
  which puts the summary on Night; see Departures in `summary/spec.md`.
- **How a workout is named.** By its **day label**: `Today`, `Yesterday`, or
  `Tue 6 Oct` (with the year if it isn't this year). Then `p.when` gives the time
  range, `6:42 – 7:46 pm`, dropping the first am/pm when both match. Both
  pages use the same formatter, which history already has (`dayLabel`,
  `timeRange`). History shows the day as an `h3`; the summary shows it as
  the `h1`.
- **The tally (`dl.tally`).** Boxed figures ruled by 2 px ink lines, in this
  order:
  - **Time** (`So far` while live) and **Sets**: always shown.
  - **Volume**: only when it is above 0.
  - **Distance**: only when it is above 0.

  So weights-only and mixed-without-cardio workouts get Time · Sets · Volume.
  Mixed with cardio gets all four. Cardio-only gets Time · Sets · Distance.
  Bodyweight-only or plank-only gets Time · Sets. The unit sits in
  `span.unit`, with its leading space inside the span. On phones (≤ 420 px)
  four boxes go 2 × 2. History's figures are 28 px; the summary's are
  `.tally.big`, 48 px with 24 px units, always 2 columns on phones.
- **The set table (`table.log`).**
  - Columns: `Exercise` | `Set`.
  - **One `tbody` per exercise**: each exercise appears once, in the order it
    was first done, with its sets in logged order (`byExercise` in
    `src/lib/logbook.ts`).
  - The row header `th.lift` holds the exercise name. When the exercise has
    2 or more sets, it also holds `span.best`: `Best <span>{bestLabel}</span>`.
    The inner span never wraps, so on a phone the line breaks after "Best".
  - Each row is one `td.set`, right-aligned, holding the set written the way
    a lifter writes it:

    | Kind | Set cell | Best line |
    | --- | --- | --- |
    | weight | `82.5 kg × 8` | `Best 82.5 kg × 8` (heaviest, then most reps) |
    | bodyweight | `BW × 12`, `BW + 10 kg × 6` | `Best BW × 12` (most reps, then added weight) |
    | duration | `1:30` | `Best 1:30` (longest hold) |
    | cardio | `5 km · 25:00`, then `span.pace` `5:00 /km` on its own line | `Best 5 km · 25:00` (longest distance, no pace) |

    These are `setLabel` and `bestLabel` from `logbook.ts`. The one
    difference: a cardio cell splits `setLabel`'s last ` · ` part into
    `span.pace`, so the cell stays 14 characters wide and fits a 360 px phone.
- **Links between the pages.**
  - History → summary: the day label of every finished entry is the link
    (`h3 > a`, with a pixel arrow, at least 44 px tall).
  - Summary → `/` (**Back home**, primary) and `/history` (**All history**,
    secondary).
  - Live entries have no summary link. Their way on is **Resume**.
- **Fields, errors and pending.** Neither page has a form. Every action is a
  plain link, so there is no pending or error state to draw. Server failures
  get the framework's error page, as everywhere else.
- **Success.** The success moment lives only on the summary: a `.bubble`
  with `role="status"` when it is reached with `?done=1`. History no longer
  shows a bubble.
- **Voice.** Logbook language: "in the book", "Every set", "Best". The jokes
  stay in the bubble and the empty lines; figures and labels stay plain.
- **Icons.** The 8 × 8 arrow and trophy from `src/sprites/icons.ts`, drawn at
  2× with `Sprite.astro`.
- **Shared CSS.** The rules marked `/* shared: logbook */` in both mockups'
  `<style id="page">` are written the same way in both:
  - `.when`;
  - `.tally` and its phone rule;
  - the `.log` rules (`th.lift`, `.best`, `.set`, `.pace`, run fills);
  - `.vh`.

  Build them once, as a `src/components/WorkoutLog.astro` (the tally plus the
  table) with scoped styles, used by both pages. Scoping matters: the room
  mockup also has a `.tally` (a `p` on Night) with a different meaning, so
  this `.tally` must not go global under that name.

### This page

**Who and when.**

1. **Just finished** (most visits). You tapped **Finish workout**, or
   **Leave** with sets logged. You're sweaty, maybe still at the gym, and you
   want the payoff: how much, how long. Then you send it to the squad chat
   and go home.
2. **Revisited from history.** You tapped a day on `/history` to look closer
   or to screenshot it for someone.

**The one job.** Show what you did, as one card worth screenshotting, then let
you leave. The primary action is **Back home**; **All history** is secondary.

**Hierarchy.**

1. **The bubble** (just finished only): the celebratory line, said by your
   avatar.
2. **You and when**: your avatar with the `Finished` chip, the day as `h1`,
   and the time range.
3. **The tally at 48 px**: Time, Sets, Volume, Distance. These must read at
   arm's length and survive a screenshot.
4. **Every set**: the same table as history, with each exercise's best.

**Reuse.**

- `.card`, `.bubble`, `.chip.state-finished` (global, with the trophy icon),
  `.passcode` (as home's key tags), `.actions`, `.button` /
  `.button.secondary`, and `h1` / `h2`.
- The avatar comes from `Sprite.astro` (`src/sprites/avatar.ts` for now; the
  person's own avatar once AV-1 ships).
- New in the page block: `.trophy .bubble`, `.who`, `.me-box`, `.me`,
  `.room`, `.tally.big`, `.after` and `.nothing`, all small.

**Template check.** The first idea was "a stats card plus a table", the
end-of-workout screen of any fitness app. What makes it Spotter's:

- **Your avatar says it.** The bubble's pixel tail points down at your sprite,
  which wears the same `Finished` chip (trophy, gold, the word) the squad
  sees above you on the gym floor. It is the gym's state language, carried
  out of the gym.
- **The joke is about iron, not you.** "In the book: about two utes of iron
  🛻" turns the volume into an Australian thing you can picture, and it's
  the line people screenshot. It is never about bodies or ability (system 3).
- **The room is a key tag**: `Room [K7M2QX] closed`, in the same leaf-on-ink
  passcode style as home's room list and the gym's top bar. "Closed" appears
  only on the night it closed, so revisits don't nag.
- **The rest is literally the history entry**, so the screenshot and the
  logbook agree to the kilo.

## 2. Requirements covered

| Requirement (source) | Element that meets it |
| --- | --- |
| "Finishing a workout shows a summary: duration, sets, total volume (weight × reps), cardio distance and time spent slacking" (LOG-6, `spec-4-weeks.md`) | `dl.tally.big`: Time, Sets, Volume, Distance. **Slacking time is left out** (needs real-time state); see Later work |
| Contents: when (date, time range), each exercise with all its sets and its best, a celebratory line (task brief) | `h1` day label and `p.when`; `table.log` with `span.best`; the bubble |
| "Only the workout's owner can see it (others get 404). An unfinished workout redirects to its room" (task brief) | See States: 404 and 303 to `/rooms/{roomId}` |
| Reached from Finish, from Leave (when there were sets), and from history (task brief) | The room's redirects go to `/workouts/{id}?done=1`; history's day link goes to `/workouts/{id}` |
| Actions: back home, all history (task brief) | `.actions.after`: `a.button` "Back home" → `/`, `a.button.secondary` "All history" → `/history` |
| "If it was a room that got closed, say so lightly" (task brief) | `p.room`: `Room [K7M2QX] closed`, on `?done=1` when the room has `closedAt` |
| States: just finished, revisited, no sets, cardio-only, mixed (task brief) | All drawn; see States |
| Success shown in place with `.bubble` (system 13) | `p.bubble[role=status]` on `?done=1` |
| `.summary` "sized to fit one phone screen … so a screenshot captures all of it for the group chat: your avatar, duration, sets, volume … and one joke line" (system 9) | `section.card.trophy` is about 520 px tall at 390 px wide, so it fits one screen above the buttons |
| Summary stat numbers 48 px (system 6) | `.tally.big dd { font-size: 48px }` |
| One primary button, in the bottom third on phones (system 8) | **Back home** sits about 670 px down an 844 px phone screen when there is a bubble |

## 3. Structure

Inside the layout's `main`, Paper surface (`<Layout title={`Workout · ${dayLabel}`}>`).

1. **`section.card.trophy[aria-labelledby]`**:
   1. `p.bubble[role=status]`, only with `?done=1` and at least one set. The
      copy is below.
   2. `div.who`:
      - `div.me-box`: the avatar `svg.me` (16 × 16 sprite; 64 px on phones, 96
        px from 421 px, whole-number scales), then
        `span.chip.state-finished`, holding the trophy icon (16 px) and
        "Finished".
      - `div`: `h1` with the day label, then `p.when` with the time range.
   3. `p.room`, only when `roomId` is set (`passcode` comes from
      `workoutSummary`):
      - with `?done=1` and `roomClosedAt` set: `Room <span class="passcode">K7M2QX</span> closed`;
      - otherwise: `Trained in <span class="passcode">K7M2QX</span>`.
   4. `dl.tally.big`: the shared tally.
2. **`div.actions.after`**: `a.button[href=/]` "Back home", then
   `a.button.secondary[href=/history]` "All history".
3. **`section.card[aria-labelledby]`**: `h2` "Every set", then the shared
   `table.log`. With no sets, `p.nothing` replaces the table.

### Data

`workoutSummary(user.id, id)` in `src/lib/workouts.ts` already returns
`startedAt`, `endedAt`, `roomId`, `passcode`, `roomClosedAt` and `sets`. The
figures come from the shared functions (see history's spec: `minutes`,
`volume`, `distanceKm`, `setLabel`, `bestLabel`, `byExercise`).

### The bubble's copy (add to system.md's copy bank)

The first matching rule wins. One emoji, at the end.

| When | Line |
| --- | --- |
| volume ≥ 1,000 kg | `In the book: about {n} ute(s) of iron 🛻`, with n = max(1, round(volume / 2000)) written as a word up to ten ("one ute", "two utes"). A dual-cab ute weighs about 2 tonnes |
| distance > 0 | `In the book: {km} km down 🏃` |
| volume > 0 | `In the book. Every kilo counts 🏆` |
| anything else (bodyweight or holds only) | `In the book. No plates needed 🤸` |
| no sets | no bubble |

Empty line (`p.nothing`): `No sets this time. The bar's not going anywhere 🏋️`.

### Server changes this page needs (outside the page)

- `src/pages/rooms/[id].astro`:
  - Finish redirects to `/workouts/{id}?done=1`, using the id that
    `finishWorkout` returns.
  - Leave does the same when `leaveRoom` returns an id.
  - When either returns `undefined` (nothing was logged, so there is no
    summary), redirect to `/`.
- `spec/` has no test on the old `/history?finished=1` target.

## 4. States

| State | Trigger | What shows |
| --- | --- | --- |
| **Just finished, mixed** | `?done=1`; the workout has weights, bodyweight, a hold and cardio | Bubble (ute line), `Room K7M2QX closed`, 4 tally boxes (2 × 2 on phones), the full table |
| **Revisited** | No `?done=1` (from history's day link) | No bubble, `Trained in HR4TWP`, never "closed". 3 boxes; the third spans both columns on phones |
| **Cardio only** | Only cardio sets | Bubble `In the book: 5.8 km down 🏃` (if `?done=1`); Time · Sets · Distance; set cells with pace lines |
| **Empty** | A finished workout with no sets (the server deletes these, so nothing should link here) | No bubble; tally Time and Sets `0`; `p.nothing` instead of the table |
| **Signed out** | No user | 303 to `/signin?next=/workouts/{id}` |
| **Not yours, or no such id** | `workoutSummary` returns `undefined`, or `id` isn't a number | 404, the same as a missing page, so it doesn't reveal that the workout exists |
| **Unfinished** | `endedAt === null` | 303 to `/rooms/{roomId}` |
| **Pending / error** | n/a | No form; both actions are links |
| **Narrow / wide** | 360–390 / 1280 | Checked at 360, 390 and 1280. At 360 the trophy card's room line, tally and table all fit; the buttons stack. At 1280 the avatar is drawn at 6× and the tally is one row |

## 5. Departures

- **Paper instead of Night (system.md section 4 and the `.summary` entry in
  section 9).** The brief asks for Paper, and it keeps the page identical to
  history, which this group exists to guarantee. The cost is that arriving
  from the Night gym switches surface, though so does every other exit from
  the gym. system.md needs updating to match:
  - section 4: list the summary under Paper;
  - section 9: `.summary` becomes this `.card.trophy`, with slacking time
    listed as later work;
  - section 3: add the bubble lines to the copy bank.
- **The state chip on Paper.** `.chip.state-finished` was specified for the
  gym. Here it sits under your avatar exactly as it would on the floor, with
  ink on gold (10.4:1).
- **The avatar's raw hex** falls under the sprite-palette exemption (system
  10).

## Later work

- **Time spent slacking (LOG-6).** It needs `slack_s` written when a set
  starts, which comes with real-time state. When it exists, it becomes a fifth
  tally box, `Slacking 6:12`, and the joke can switch to system 9's lines
  ("Iron discipline: 0 s slacking 🏆" / "Professional slacker: 6 min 12 s
  💀"). Plan the tally for 2 × 3 on phones.
- **A Finished flex.** A two-frame flex on the avatar for `?done=1`, frozen
  under reduced motion, once the avatar has that frame (system 10).

## Layout changes

None needed. `.chip`, `.state-finished`, `.bubble` and `.passcode` already
exist in `Layout.astro`.

## Open questions

1. **Paper or Night** for the summary. The design follows the brief (Paper),
   but system.md says Night. The user should confirm, and system.md should
   change to match.
2. **The ute.** It is the one joke on the page. If it doesn't land with the
   squad, swap the first row of the copy table for `{kg} kg in the book.
   Nice one 🏆`.
