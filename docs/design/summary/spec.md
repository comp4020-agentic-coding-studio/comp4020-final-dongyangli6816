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

## Logbook refactor, Nov 4

The criteria are `docs/product/criteria/logbook.md` (LB-2, LB-3.1 to
LB-3.7, LB-3.11, LB-4.10, LB-4.12, LB-5.7). This section adds the record
count, the marked set table and **Save as plan**. It **supersedes**:

- section 1's "Shared" block where the Nov 4 shared block below differs;
- section 3's structure: a records line in the trophy card, and a new last
  card (see Structure below);
- the avatar in the mockup: it now draws the 32 × 32 `av-stand-ponytail` at
  2× (64 px) and 3× (96 px), as the built page does.

Unchanged: the bubble's copy table, `Room … closed`, Back home and All
history, and the Paper surface (Oct open question 1 still stands).

### 1. Plan

#### Shared: the Logbook group, Nov 4 (`history`, `summary`, `exercise`, `plans`)

Identical in the four Logbook specs. It extends the Oct "Shared: the Logbook
group" block in `history/spec.md` and `summary/spec.md`, which still holds
except where this says otherwise.

**The rule, widened:** a set is written the same way wherever it appears,
and so is a plan. History, the summary and the exercise page all draw sets
with the one `table.log`; the summary and `/plans` both draw a plan with the
one `ol.plan-list`. Same words, same marks, same order.

- **Surface.** All four are Paper, under the same top bar (History stays the
  only nav link; `/plans` and `/exercises/<id>` are reached from the pages,
  see "Links").
- **How a page opens.** An `h1` and one muted line under it (`p.lede`, or
  `p.when` on the summary). Pages about one thing open with its pixel art:
  the summary with your avatar (Oct), the exercise page with its station's
  equipment sprite in a 64 px floor-tile frame. History and Plans have no
  art in their head.
- **Cards.** Every block is a `.card` with an `h2`, in the order the eye
  should take them. The page's one primary button, if any, sits in the
  thumb zone as before (Resume, Back home); everything new is secondary.
- **Writing a set** (LB-2.16, LB-0.3). `setLabel` exactly as today, then:
  - **RPE** after the figures in lifter's shorthand, `85 kg × 5 @ 9.5`.
    The ` @ 9.5` is `aria-hidden`, followed by a `.vh` `, RPE 9.5`, so a
    screen reader says "85 kg × 5, RPE 9.5". No RPE: nothing added.
  - **Marks** on a line under the figures (`span.marks`), right-aligned:
    the set type first, then any record. See "Shared marks" in
    `history/spec.md`. A Normal set has no type mark.
  - **A warm-up row** (`tr.warm`) has muted figures, so working sets read
    first. Its mark still carries the word.
  - **The note** for that exercise in that workout is a last row of its
    group, `tr.note > td[colspan=2]`: the pencil icon, `.vh` "Note: ", then
    the text as typed (escaped, LB-2.24), muted, 21 px, dashed top rule.
  - Sets from before this change have none of these, so they look exactly
    as they did (LB-0.3).
- **"Best" stays, and "Record" is new.** `span.best` under a group's name is
  still the best set *in that group* (`bestLabel`). A record is the
  all-time mark on a set and is always called "Record" (LB-4.10). The two
  never share a line.
- **Links** (LB-5.7, LB-3.11).
  - On history and the summary every exercise name in `th.lift` is a link to
    `/exercises/<id>`, 44 px tall (`.log th.lift a`). The room's sheet has
    none (D20).
  - On the exercise page the group is a session, and its day is the link to
    that workout's summary, with the pixel arrow, exactly as history's
    entry heads. An open workout's day is not a link and wears the `Live`
    badge.
  - A plan's exercise names link to their exercise pages too.
  - `/plans` is reached from the summary ("Your plans", under Save as
    plan) and from home (Lobby group, see Open questions).
- **The tally** (`dl.tally`) is reused for two new figure rows: history's
  "Week so far" and the exercise page's "Records" (with the day under each
  figure). Same 2 px ruling, same 8 px labels, same 28 px VT323 figures.
- **Forms, errors, pending** (LB-0.7). The group's forms are Save as plan
  (summary), Rename and Delete (plans). Field errors go in `.error`
  directly under the field, with `aria-invalid` on it; a failed request
  shows "That didn't save. Try again." under the button, and keeps what was
  typed. Pending: the submit button `disabled`, label kept, no spinner.
- **Ask once more** (LB-3.9). The room's confirm pattern (`details.confirm`,
  whose `summary` button turns into its own Cancel in place, then a
  `.confirm-box` form), on Paper: paper fill, ink border. Works without JS.
- **Success** is a `.bubble[role=status]` in place, never a new page.
- **Voice.** Figures, labels, errors: plain. One joke per page at most, in a
  bubble or an empty line, about progress against your own past, never
  against anyone else (LB-4.14), never about bodies. Streaks are stated,
  never defended (LB-6.6).
- **Shared CSS.** Everything under `/* shared: logbook */` in the four
  mockups' `<style id="page">` is written the same in each. The `table.log`
  rules (now with links, marks, warm-up rows and notes) belong in
  `WorkoutSets.astro`; `.tally` in `WorkoutTally.astro`; `.plan-list` and
  `.planned` in a new `PlanList.astro` (summary and plans);
  `.badge.warmup|failure|record` in `Layout.astro` (see "Layout changes"
  in `history/spec.md`).

**Template check, for the group.** "Stat boxes, a line chart, a list of
saved routines" is every fitness app. What keeps these Spotter's:

- **A record is drawn like a lit day.** The record mark is leaf on ink, the
  same as a trained day in history's M T W T F S S strip, with a pixel
  star. The chart's record points are the same lit square. One visual
  idea: *lit means you did something*.
- **The chart is a Game Boy screen**: leaf on ink, a stepped line in one
  `--px` stroke, square points, no curves, no gradients, no tooltips.
- **The streak is plates on a bar**, one per week, this week's plate in
  leaf: the logo's dumbbell, loading up. Zero weeks draws nothing at all.
- **A plan is a walk through the gym**: each exercise sits beside the
  station sprite it's done at, and its planned sets are the empty boxes the
  sheet will fill in, the room's `.pips` shape.
- **The exercise page opens on its equipment** from the gym floor, so
  "Bench press" is the flat bench you claimed, not a stock icon.

#### This page

**Who and when.** As Oct, plus **the Anchor who wants to do it again.** Push
day went well; they save it now so next Tuesday's sheet walks them through
it.

**The one job.** Unchanged: show what you did, as one screenshot, then leave.
Saving a plan is a second, smaller job, so it is a secondary button in the
last card, below the sets it's made from. **Back home** stays the one
primary.

**Hierarchy.**

1. The bubble. 2. You and when. 3. The tally at 48 px.
4. **New: the records line**, `[★ 3 new records] Past you just got beaten
   🏆`, the second thing worth screenshotting.
5. Every set, with its marks. 6. Save as plan.

**Reuse.** The trophy card, tally, table and bubble as before; the shared
`.plan-list` (the same list `/plans` shows); the layout's `input`, `label`,
`.error`, `.button.secondary`, `.bubble`. New in the page block:
`.records-line`, `.save-plan`, `.save-row`, `.saved`, `.to-plans`.

**Template check.** "Save as template" with a name field is a settings form
from any app. What makes it Spotter's:

- **The preview is the plan, drawn as the gym**: each exercise beside the
  station sprite you'll claim for it, and a box per working set, the empty
  boxes the sheet will fill in. You see the walk before you save it.
- **The name is optional and defaults to the day** ("Wed 4 Nov"), shown as
  the field's placeholder, so one tap saves.
- **The records line stays inside the trophy card**, so it's in the
  screenshot, and it's about beating *past you*, never anyone else
  (LB-4.14).

### 2. Requirements covered

| Requirement (source) | Element that meets it |
| --- | --- |
| LB-4.12 "3 new records"; with none, say nothing | `p.records-line` only when the count > 0; state "no records" has none |
| LB-4.10 record marks in the summary | The shared `table.log` marks |
| LB-2.2, LB-2.16, LB-2.23 types, RPE and notes in the summary | The shared `table.log` |
| LB-5.7 exercise names link to their pages | `th.lift > a[href=/exercises/{id}]` |
| LB-3.1 "Save as plan" with an optional name; a blank name becomes the date; confirmed in place, naming the plan | `section.save-plan`: `input[name=name][maxlength=30][placeholder="Wed 4 Nov"]`, button "Save plan"; then `p.bubble[role=status]` "Saved as Push day…" |
| LB-3.2 exercises in order, planned sets = working sets, warm-ups left out | `ol.plan-list` preview, built by the same rule; the hint says warm-ups stay out |
| LB-3.2 only warm-ups refused | `.error` "Only warm-ups in this one. Nothing to plan yet." |
| LB-3.4 already saved: "Saved as Push day", linking to plans, not offered again | `p.saved` with `a[href=/plans]` instead of the form |
| LB-3.5 names over 30 refused | `.error` "Names are up to 30 characters." under the field, with `aria-invalid` |
| LB-3.6 a 21st plan refused | `.error` "That's 20 plans. Delete one to make room.", with "Your plans" right under it |
| LB-3.7 no Save as plan on an open or someone else's workout | The page already redirects for an open workout and 404s for others' (Oct) |
| LB-3.11 `/plans` one tap from a summary | `a.to-plans` "Your plans" in the last card, in every state |
| LB-0.7 pending and failure | `button[disabled]`, label kept; "That didn't save. Try again." under the button, the name kept |

### 3. Structure

Changes only:

1. `section.card.trophy`: after `dl.tally.big`, **`p.records-line`** when the
   workout set at least one record: `span.badge.record` (the star and
   "{n} new record(s)") then the text `Past you just got beaten 🏆`.
2. `div.actions.after`: unchanged.
3. "Every set": the shared `table.log` with links, marks and notes.
4. **New `section.card.save-plan[aria-labelledby]`**, last, when the
   workout has at least one set:
   - **Not yet saved:** `h2` "Save as plan"; `p.hint` "Do this one again:
     the lifts in order, a box per working set. Warm-ups stay out."; the
     shared `ol.plan-list` preview; `form[method=post]` with `label` "Name
     (optional)", `div.save-row` (the `input`, then `button.button.secondary`
     "Save plan"), then any `.error`; then `a.to-plans[href=/plans]` "Your
     plans".
   - **Just saved:** the form gives way to `p.bubble[role=status]` `Saved as
     <a href=/plans>Push day</a>. Load it from the sheet next time 📋`. The
     preview stays.
   - **Already saved** (a later visit): `h2` "Plan" and `p.saved` "Saved as
     <a href=/plans>Push day</a>. Load it from your sheet next time." No form.
   - **Only warm-ups:** the form shows, and the server's refusal appears
     under the button, as LB-3.2 names it.

A preview row is `li` > `svg.art` (the exercise's equipment sprite,
`/sprites.svg#eq-<equipment>`, 32 px), `a[href=/exercises/{id}]` with the
name, and `span.n` "{n} sets" over `span.planned` (n empty boxes,
`aria-hidden`). The list is an `ol`, so its order is announced.

### 4. States

| State | Trigger | What shows |
| --- | --- | --- |
| **Just finished** | `?done=1`, three record sets | Bubble, records line, the marked table, Save as plan with its preview |
| **Saved** | A successful save | The save card's bubble naming the plan, preview kept, "Your plans" |
| **Revisited, already a plan** | A later visit, the plan exists | No bubble; the card reads "Saved as Push day" |
| **No records** | No set carries a mark | No records line; no marks in the table |
| **Cardio with a warm-up** | A warm-up walk, then a run | The preview holds Run · 1 set only |
| **Save pending** | A slow save | `Save plan` disabled, label kept, name kept |
| **Save errors** | Refusals and failures | Name too long: under the field. No connection, 20 plans, only warm-ups: under the button. Text kept in each |
| **Signed out, not yours, unfinished, empty** | — | As Oct. A workout with no sets has no Save as plan card |
| **Narrow / wide** | 390 / 1280 | At 390 the field and button stack, and the preview's set count sits right with its boxes under it. At 1280 the field and button share a row |

### 5. Departures

- **A form on a page whose Oct spec said "no form"**: Save as plan. It is
  secondary and last, so the page's one primary stays Back home.

Otherwise none.

### Layout changes

None beyond the badge modifiers named in `history/spec.md`, "Layout
changes" (Nov 4).

### Open questions (behaviour the criteria don't decide)

1. **What "3 new records" counts** (LB-4.12): sets that carry a record mark,
   or record types broken? A set that is both Heaviest and Best e1RM would
   count 1 or 2. The mockup uses three single-type sets, so it reads either
   way.
2. **The confirmation's words.** LB-3.1 asks for an in-place confirmation
   naming the plan; drawn as the bubble above. LB-3.4's "Saved as Push day"
   is used on later visits. The copy is the user's to approve.

## Exercise art, Nov 5

LB-7 in `docs/product/criteria/logbook.md` (D36 to D43). "Every set" shares
history's table, so it shows the same art in the same place (LB-7.2): your
avatar lifting on each exercise's machine, **32 × 32 px (1×)**, inside the
name's link. It follows history's option A, picked on Nov 5: from 421 px
the art has its own column, with a 12 px gap and the name and Best line on
one left edge; on phones it stands above the name with an 8 px gap. The
scale, markup, CSS (with the arrow-margin fix), the focus-ring limit and
the reasons are in `history/spec.md`, "Exercise art, Nov 5"; nothing
differs here.

- **Not in the plan preview** in "Save as plan" (D41, LB-7.16): its rows
  keep their still station sprite.
- **The trophy card's avatar** is unchanged: standing, with the Finished
  chip. The just-finished state now draws Mia in LB-7's look (ponytail, pink
  hair, skin tone 2, white shirt), so the trophy card and the table show
  the same person. The other states keep the Nov 4 look.
- Shown in the **Just finished** state only, as asked.

Departures and layout changes: none beyond history's.
