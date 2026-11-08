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

## Accessories, Nov 9

The criteria are `docs/product/criteria/accessories.md` (agreed 8 Nov, D1
to D12): **AV-6.6**, **AV-6.15**, **AV-6.2**'s failure line, **AV-6.17**
and **AV-7.5**. The art and how it is drawn are in
`docs/design/avatar/spec.md`, "Accessories, Nov 8", A.6 to A.9; nothing here
redraws or recolours it. This section adds one card, **Unlocked**, and
dresses every drawing of the person on the page in what they wear now.
Everything above stands.

Mockup states: the eight `acc: …` states in `docs/design/summary/mockup.html`.
Screenshots: `node scripts/shot.mjs docs/design/summary/mockup.html .shots/summary/acc --states`.

### 1. Plan

**Shared (Logbook group).** Unchanged: the Nov 4 shared block holds word
for word. Only the summary lists unlocks. History and the exercise page
only draw the avatar, so they pick up AV-7.5 through the shared
`ExerciseArt` renderer with no redesign (their mockups are untouched). The
new card follows the group's rules: a `.card` with an `h2`, secondary
buttons only (Back home stays the one primary), "That didn't save. Try
again." under the button, pending as a held-down button with its label
kept, success as a `.bubble[role=status]` in place.

**Who and when.**

1. **Just finished, first session.** A fresh account at the showcase
   (often a marker, alone with Dony) has just tapped Finish. They may have
   earned six or seven things in fifteen minutes, and the room's banners
   came and went mid-set (each one replaces the last, `int.md` D9). The
   summary is where they all wait, together, with time to look.
2. **Just finished, weeks in.** One unlock, perhaps a long-haul one (the
   silver medal on day ten). One row, one tap.
3. **Revisited.** From history, days later. The list is part of that
   workout's record, like its records line: what this session got you.

With strangers: the card is on your own summary, which only you can open
(404 for anyone else), so it says nothing to anyone (AV-4.13).

**The one job.** Unchanged: show what you did, then leave. Wearing a new
thing is a second, small job, one secondary button per row.

**Hierarchy.**

1. The bubble. 2. You and when (now in your kit). 3. The tally at 48 px.
4. The records line. 5. Back home, All history.
6. **New: Unlocked**, straight under the buttons.
7. Every set (art in your kit). 8. Save as plan.

**Where the list goes, and why.** Its own card **between the buttons and
Every set**. Inside the trophy card it would push the tally and Back home
down by 70 px a row: seven rows on a first session is about 500 px, which
would put Back home off the first phone screen and break the "one
screenshot" rule (system 9). Below the buttons it is still the first thing
you meet when you scroll, above the set table, and it reads as part of the
workout's record (it sits between the figures and the sets, not after
Save as plan). With nothing unlocked there is no card at all, so a normal
summary is exactly as before.

**Reuse.** `.card`, `h2`, `.hint`, `.bubble`, `.button.secondary`,
`button:disabled`, `.error`, `.vh`; the editor's `.acc-frame` floor square
and `svg.bust` (avatar spec A.3), here at 2× (56 × 46 px); the editor's
gold rule for long-haul ones (`.acc.trophy`); the `i-tick` icon. New in
the page block: `.new-kit`, `.kit-list`, `.kit-name`, `.kit-why`,
`.kit-act` (+ `.wearing`, `.in-editor`), `.to-editor`.

**Template check.** The first idea was an "Achievements unlocked" list of
badge icons with a Claim button: every game's post-match screen. What
makes it Spotter's:

- **Each row is you wearing it**: your own bust (your skin, hair and
  shirt) in the thing, on a square of gym floor, the same tile the editor
  uses. It reads as trying it on, not as a trophy cabinet.
- **"New: shades", then what earned it, in the editor's words** ("First
  PB", "3 machines"). No points, no rarity, no percentages.
- **The verb is Wear it**, not Claim or Equip: it's already yours (D3,
  never put on for you); the tap is choosing to be seen in it.
- **The Nightcap is just another row**, named and owned, with no button
  and no comment, so the joke stays on the rest, never the person
  (AV-6.17).
- Would I screenshot it? The trophy card in your new star shades, yes; the
  row of busts in seven new things after a first session is the "look what
  I got" message for the group chat.

### 2. Requirements covered

| Requirement (source) | Element that meets it |
| --- | --- |
| AV-6.6 "its summary lists each, in the order earned" | `ol.kit-list`, one `li` per unlock, in unlock time order (ties: see "Not decided by the criteria") |
| AV-6.6 "New: bronze medal" | `p.kit-name` `New: {name, lower case}`, then `span.kit-why` with the editor's reason (A.4: "First workout") |
| AV-6.6 "each with Wear it … or 'Wearing it' if she already is" | `form.kit-act` > `button.button.secondary` "Wear it"; or `p.kit-act.wearing` with the tick and "Wearing it", when the accessory is in its slot now |
| AV-6.6 "It works with no script" | Wear it is a plain `form method=post` to the summary itself; the server answers 303 back to it |
| AV-6.6 "Coming back to that summary later shows the same list" | The list is read from the stored unlocks attached to this workout; only "Wearing it" follows what's worn now (state **revisited later**) |
| AV-6.6 "Accessories recorded by AV-5.17 … never listed" | Back-filled unlocks carry no workout, so they never appear (state **no unlocks**) |
| AV-6.15 the Nightcap listed, but no Wear it; worn only from the editor | Its row has `p.kit-act.in-editor` "Put it on in Edit avatar" with a link to `/avatar`, no form. The server also refuses a hand-made Wear it for it |
| AV-6.2 "That didn't save. Try again." and nothing changes | `p.error[role=alert]` under that row's button; the worn kit and the trophy avatar unchanged (state **wear it failed**) |
| AV-6.2 the screen reader hears "Wearing the shades" once | The success bubble `Wearing the shades now 😎` is `role=status` (state **worn**) |
| AV-6.17 a mate saying "nice one", never a telling-off | Hint `Nice one. New kit to wear 🔥`; nothing about what wasn't earned, no locked ones, no counts |
| AV-7.5 LB-7's art draws what she wears now | Every `ex-art` and the trophy `svg.me` carry the worn accessories as layers (state **art wearing**) |
| AV-7.2 neck items only on the tee | Neck layers are clipped to the drawing's tee (`teeMask`); one row of medal on the bench, most of it at the cable machine |
| AV-7.8 accessories named nowhere but the editor, banners and summary | Art stays `aria-hidden`; only the card's rows name them |
| System 8: one primary per page | Wear it is `.secondary`; Back home stays the only primary |

### 3. Structure

Changes only.

1. **`section.card.trophy`**: `svg.me` gains the worn accessories, in the
   order head, face, neck, each a `use href="/sprites.svg#acc-{drawing}"`
   at `y = hairRow` (0 standing) with the accessory's palette as
   `--acc-a … --acc-d` (`accVars`). The neck one is clipped to the
   standing tee. The build draws this with whatever renderer
   `Avatar.astro` gets for AV-7 (avatar spec A.3, "Rendering everywhere
   else").
2. `div.actions.after`: unchanged.
3. **New `section.card.new-kit#unlocked[aria-labelledby]`**, only when at
   least one unlock is attached to this workout:
   - `h2` **Unlocked**;
   - after a Wear it (`?worn={id}`): `p.bubble[role=status]` `Wearing the
     {name} now {emoji}`;
   - `p.hint` `Nice one. New kit to wear 🔥`;
   - `ol.kit-list`, one `li` per unlock (`li.trophy` for the long-haul
     four):
     - `span.acc-frame` > `svg.bust[viewBox="2 0 28 23"][aria-hidden]`:
       the person's standing figure (hair included, unlike the editor's
       bald bust, since this is them) wearing **only that accessory**;
     - `p.kit-name` `New: {name}` > `span.kit-why` {reason};
     - the action, one of:
       - `form.kit-act[method=post][action=/workouts/{id}]` with hidden
         `intent=wear`, `accessory={id}`, and `done=1` if the page has it;
         `button.button.secondary` `Wear it<span class="vh">: {name}</span>`
         (so a screen reader hears "Wear it: shades");
       - `p.kit-act.wearing`: `svg` `i-tick` (16 px) + `Wearing it`;
       - the Nightcap, when not worn: `p.kit-act.in-editor` `Put it on in
         <a href="/avatar">Edit avatar</a>`; when worn, `Wearing it` like
         any other.
     - on failure, `p.error[role=alert]` `That didn't save. Try again.`
       under that row's action, the button `aria-describedby` it.
   - `a.to-editor[href=/avatar]` `Edit avatar`, last.
4. "Every set": every `ex-art` frame gains the worn accessory layers inside
   its `g.frame-1` / `g.frame-2`, at that frame's `hairRow` (flat bench 4,
   cable machine 4, dumbbell rack 0, …; `machines.ts`), neck items clipped
   to that frame's tee. Between the person and the machine's front, as
   everywhere (avatar spec A.6).
5. Save as plan: unchanged; its preview rows keep their still station
   sprites (D41).

**Layout.** At 421 px and up a row is `bust | name and reason | action`,
the action right-aligned. On phones (≤ 420 px) the action goes under the
name, beside the bust, and the error under the action, so nothing is
squeezed at 360 px. A row is about 70 px at 1280 and 130 px on a phone
with a button.

**The mockup only**: the card's `id` carries a suffix (`unlocked-many`)
because the mockup repeats it per state; the build uses `id="unlocked"`.
The `clipPath id="tee-…"` elements are the mockup's stand-in for
`teeMask()` (avatar spec A.8); the build computes the mask per drawing.

**Wear it, as a request** (the contract is the main agent's; this is what
the page needs):

- `POST /workouts/{id}`, `intent=wear`, `accessory={id}`, optional `done=1`.
- Accepted: the accessory goes in its slot, replacing what was there
  (AV-6.2), live to the room (AV-7.7); 303 to
  `/workouts/{id}?{done=1&}worn={id}#unlocked`.
- Refused (not yours: 404, as the page; not unlocked by you, unknown, the
  Nightcap, not listed on this workout) or failed: the summary re-rendered
  with `p.error` under that row (no-script), or the same line placed by
  the script; nothing changes.
- **Script** (optional): on submit, `disabled` on that one button, label
  kept; on success, follow the redirect; on failure, show the error under
  the row and re-enable the button. Without the script the browser posts
  and the page reloads; nothing else depends on it.

### 4. States

| State | Trigger | What shows |
| --- | --- | --- |
| **acc: no unlocks** (unchanged) | Nothing attached to this workout (or only AV-5.17 back-fills) | No Unlocked card; the page exactly as before |
| **acc: one unlock** | `?done=1`, Mia's tenth day: the silver medal | One row with the gold rule; Wear it would swap out her bronze medal. The trophy avatar wears her Squad cap and bronze medal |
| **acc: several, one worn, nightcap** | `?done=1`, Priya's first session, seven unlocks | Seven rows in the order earned; heart shades `Wearing it` (put on from the room's banner); the Nightcap with "Put it on in Edit avatar" and no button |
| **acc: wear it pending** | Wear it tapped on slow wifi (script) | That one button disabled, label kept; the rest unchanged |
| **acc: wear it failed** | The post failed or was refused | "That didn't save. Try again." under that row; heart shades still worn |
| **acc: worn** | The 303 after Wear it, `?done=1&worn=shades#unlocked` | Scrolled to the card; bubble `Wearing the shades now 😎`; shades `Wearing it`, heart shades back to Wear it; the trophy avatar in the shades |
| **acc: revisited later** | From history a week on | No bubble, `Trained in`; the same seven in the same order; `Wearing it` on what she wears today (bandana, shades), and the trophy avatar in it |
| **acc: art wearing** | Any summary, Mia wearing cap, star shades and bronze medal | Trophy avatar and every 32 px art in all three; the medal clipped to the tee in each frame |
| Signed out, not yours, unfinished | — | As Oct. Wear it on someone else's workout is a 404, the same as the page |

### 5. Departures

- **The trophy card's screenshot doesn't include the unlock list**, on
  purpose (see "Where the list goes"). Your new kit is still in the
  screenshot, worn by your avatar once you tap Wear it.
- **A second form on the summary** (Wear it, beside Save as plan). Both
  are secondary; Back home stays the one primary.
- **The editor's `.acc-frame` and `.bust` rules are repeated** in this
  page's block (the summary doesn't load the editor's CSS). Cross-group
  shared code: build them once, as an `AccessoryBust.astro` used by the
  editor (Lobby) and the summary (Logbook). The summary's bust keeps the
  person's hair; the editor's is bald by design (its tiles are about the
  accessory over any hair).

Otherwise none. No new art, no new tokens, no change to the Logbook's
shared block.

### Not decided by the criteria (my recommendations, applied)

1. **Which workout an unlock belongs to.** The one the earner had open
   when the server recorded it (anything from its sets, rests, Cheers,
   presets, High-fives, or its Finish). An unlock recorded with no
   workout open (Ji-woo's Done gives Mia the Squad cap while Mia's room is
   closed; one worked out on opening the editor) attaches to the **next**
   workout she finishes, which is how AV-6.13's "the next summary tells
   her" reads. AV-5.17 back-fills attach to none. Stored with the unlock,
   so revisits never change.
2. **Ties in "the order earned"** (two unlocks in one step, e.g. the
   bronze medal and a Squad cap on the same Done): AV-6.4's order, long-
   haul first, then the criteria's table order, so the banner and the
   summary agree.
3. **Lower-case names after "New:"** ("New: bronze medal"), as AV-6.6 and
   AV-6.1 write them; the bust and the editor carry the capitalised name.
4. **The reason under each name** reuses the editor's reasons (avatar
   spec A.4) with a capital ("First PB", "A minute slacking"), so the
   summary and the editor say the same thing.
5. **The card's title** is `Unlocked` and its one line `Nice one. New kit
   to wear 🔥` in every state, including revisits (still true, still
   warm). No count ("7 new") and nothing about what's still locked.
6. **The Nightcap's row** says `Put it on in Edit avatar` (a link), not a
   disabled button: a greyed-out Wear it would read as "not allowed",
   which is the telling-off AV-6.17 rules out. Once worn (from the editor)
   it reads `Wearing it` like any other.
7. **The success bubble** `Wearing the {name} now {emoji}`, `role=status`,
   gives AV-6.2's "Wearing the shades" announcement on the summary. The
   emoji is the one the room's unlock banner uses for that accessory (the
   Gym design's list; "New: shades 😎"), or 🔥 if it has none.
8. **After Wear it the page returns to the card** (`#unlocked`), keeping
   `done=1` if it was there, so the ute bubble stays and the person sees
   both the confirmation and their trophy avatar's new look one scroll up.
9. **Wear it on a long-haul accessory** is offered like any other; it
   swaps out whatever was in the slot (the silver medal replaces the
   bronze), as AV-6.2 says. No "are you sure": the editor undoes it.
