# Exercise page (`/exercises/:id`): design spec

Mockup: `docs/design/exercise/mockup.html`.
Screenshots: `node scripts/shot.mjs docs/design/exercise/mockup.html .shots/exercise/mockup --states`
(not kept in git). The page is new, built as `src/pages/exercises/[id].astro`,
from LB-5 (and the record table of LB-4) in
`docs/product/criteria/logbook.md`. Nov 4, 2026.

## 1. Plan

### Shared: the Logbook group, Nov 4 (`history`, `summary`, `exercise`, `plans`)

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

### This page

**Who and when.**

1. **Planning the next session**, at home or on the walk in: "where's my
   bench at?" One exercise, everything about it.
2. **Showing a mate**: the chart going up and to the right is the
   screenshot.
3. **Mid-workout, from history** (between sets, Live). Rare by design: the
   sheet has no link here (D20), and Last time already answers the
   mid-set question.

It works for someone who trains alone or with strangers: nothing on it
refers to anyone else (LB-5.6).

**The one job.** "Am I getting stronger at this?" The page is for reading,
with **no primary button**. Its links are the session days (to summaries)
and, when empty, All history.

**Hierarchy.**

1. **The records**: each current record's figure, at 28 px, with its day.
   These must read at a glance.
2. **The chart**: the shape, then its top and bottom values.
3. **Every set**, grouped by session, newest first.

**Reuse.** `.card`, the shared `.tally` (records), the shared `table.log`
(sessions), the day-link pattern from history's entry heads, `.badge`,
`details` folding (history's older weeks, the room's confirm), the
`bigDumbbell` empty art, the equipment sprites. New: `.ex-head`,
`.tally.records`, `.chart` and `.plot`, `.fold`, `.none`.

**Template check.** The first draft was a stock line chart (smooth line,
round dots, grey grid, hover tooltip) under three stat cards: any fitness
app's "progress" tab. What changed:

- **The chart became a Game Boy screen**: leaf on ink inside an ink frame,
  a **stepped** line (a session's value runs flat until the next, so it
  reads as a record of sessions, not a trend fitted between them), square
  points, one `--px` stroke. No curve, no gradient fill, no tooltip.
- **Records are lit squares** on that line, the same leaf-on-ink idea as the
  record mark in the tables and a trained day on history: one visual
  language across the logbook.
- **The page opens on the equipment** from the gym floor (the flat bench for
  Bench press), on a floor-tile square, so the exercise is a place you've
  been, not an icon.
- **The figures are the tally**, the same ruled boxes as every workout, so
  records look like part of the logbook rather than a dashboard.

## 2. Requirements covered

| Requirement (source) | Element that meets it |
| --- | --- |
| LB-5.1 a page per seeded exercise; 404 otherwise; signed out to `/signin?next=` | Page states; see States |
| LB-5.2 the name; each current record with value and day | `header.ex-head > h1`; `section` "Records" > `dl.tally.records` with `dd` figure and `dd.on` day |
| LB-5.2 every set grouped by workout, newest first, day linking to a finished summary, Live with no link for the open one | "Every set" `table.log`, one `tbody` per session; `th.lift > a[href=/workouts/{id}]` with the arrow, or name + `.badge` "Live" |
| LB-5.2 types, RPE, record marks and the workout's note | The shared `table.log` additions |
| LB-5.3 one point per workout with a value, oldest left; per kind e1RM / most reps / longest hold / longest distance; unit on the axis | `figure.chart`: points left to right; the `h2` names the measure; `.y` labels carry the unit (kg, reps, m:ss, km) |
| LB-5.3 warm-ups never plotted; a workout with nothing to plot has no point | Built from working sets only; "Incline walk" state |
| LB-5.4 no plottable workout: no chart; never logged: "No sets of Bench press yet" and a link to history | `p.none` in the chart card; `.card.empty` with the line and `a.button.secondary` "All history" |
| LB-5.4 one point: shows it and says the line starts next session | "Hold · one point": a centred square; caption "One session so far. The line starts with your next one." |
| LB-5.5 the same points as text, in the server's HTML, no script needed | `details.fold.points` > `table` (Session, value), newest first; the SVG and table are both server-rendered |
| LB-5.8 every past set reachable; older may fold | The 6 newest sessions open; `details.fold.older` "{n} older sessions" holds the rest |
| LB-5.9 fits 360 px and 1280 px without sideways scroll, values readable | The SVG stretches to the card at a fixed 96 px height; labels are HTML text at 21 px |
| LB-4 record types per kind (Terms table) | Records boxes: weight Heaviest · Best e1RM · Most reps; bodyweight Most reps · Heaviest added; hold Longest hold; cardio Longest distance · Longest time |

## 3. Structure

Inside `main` (`<Layout title={exercise.name}>`), Paper:

1. **`header.ex-head`**: `svg.art` (the exercise's equipment,
   `/sprites.svg#eq-<equipment>`, 32 × 32 at 2×, 64 px, on `--tile` with an
   ink `--px` border, `aria-hidden`); then `h1` with the name and `p`
   "{n} sessions since {first day}" ("1 session, Tue 13 Oct"; never logged:
   the equipment name, "Cable machine").
2. **`section.card` "Records"**, `h2` "Records":
   - `dl.tally.records`: one `div` per record type of the exercise's kind,
     in the Terms table's order, each `dt` (the type), `dd` (the value with
     `span.unit`), `dd.on` (the day it was set, a day label). On phones,
     2 columns, an odd last box spanning both.
   - With no record yet: `p.none` "Nothing to beat yet. Records start from
     your second working set." (see Open questions on the first set).
   - A type with no value yet (e.g. Heaviest added for someone who never
     added weight) is left out.
3. **`section.card` "{measure}"**, `h2` the measure ("Best e1RM", "Most
   reps", "Longest hold", "Longest distance"):
   - `figure.chart`:
     - `div.plot`: `span.y.hi` and `span.y.lo` (the axis' top and bottom
       values, the top one with its unit), then the `svg`;
     - `p.x`: the first and last session's day labels (one point: just its
       day, centred);
     - `figcaption`: "{what}, per session." and, when any point is a
       record, a `span.key` square and "Lit square: a new record."
   - `details.fold.points`: `summary` "Chart as a table" + `span.toggle`
     (Show/Hide); `table` with `th` "Session" and `th.num` the measure; one
     row per point, newest first; a record's row adds `.badge.record`.
   - Nothing to plot: `p.none` "Warm-ups aren't charted. Your first working
     set starts the line." instead of the figure and table.
4. **`section.card` "Every set"**: the shared `table.log` with `th` "Session"
   instead of "Exercise", one `tbody` per session (newest first), the day as
   the row header (`a` + arrow, or "Today" + Live badge), `span.best`
   (bestLabel of that session) when it has 2+ sets, then the sets and the
   note row. After the 6 newest sessions, `details.fold.older` with
   `summary` "{n} older sessions" + Show/Hide, holding a second `table.log`
   for the rest.
5. **Never logged**: after the head, only `div.card.empty`: `bigDumbbell`
   (64 × 32), "No sets of {name} yet. Pick it in a room and it lands here."
   and `a.button.secondary[href=/history]` "All history".

### The chart, for the build

Server-rendered, no library, no script. One `svg`:

- `viewBox="0 0 1000 100"`, `preserveAspectRatio="none"`, CSS width 100 %,
  height 96 px. Every `path` has `vector-effect: non-scaling-stroke`, square
  caps and `shape-rendering: crispEdges`, so the stretch never thickens the
  line or squashes a square.
- `y` range: `lo` and `hi` are the data's min and max, padded outward to a
  round step (kg to 5 kg, reps to 2, m:ss to 30 s, km to 1 km), so points
  never sit on the frame. The two labels are those values.
- `x`: point *i* of *n* at `1000 × i / (n − 1)`; one point at 500.
- `path.grid`: three `--deep` lines (top, middle, bottom), 2 px.
- `path.line`: `M x0 y0` then `H xi V yi` for each next point, a **step**
  line, `--leaf`, 4 px. Absent with one point.
- `path.dot`: `M x y h0` per ordinary point (a zero-length segment with a
  square cap draws an 8 px square), `--leaf`.
- `path.rec` then `path.rec-in`: the same for record points, 16 px
  `--paper` then 8 px `--leaf`: a lit square.
- A point is a **record** when that session holds a set marked with the
  record type the chart plots (Best e1RM for weight; Most reps for
  bodyweight; Longest hold; Longest distance).
- **Many points**: over 20, ordinary squares are dropped (they'd touch at
  360 px) and only records and the newest point keep one. The line carries
  the rest. The table keeps every point.

**How it looks**: **one point**, a single square in the middle, the day
under it, the caption saying the line starts next time; **two points**, one
step across the whole width; **many**, a staircase whose lit squares are
the records.

## 4. States

| State | Trigger | What shows |
| --- | --- | --- |
| **Default** | Weight lift, 12 sessions, records set | Head (flat bench), three records, the chart with 6 lit squares, the six newest sessions, "6 older sessions" folded |
| **Chart as a table, open** | Enter or tap on "Chart as a table" | The points table, newest first, record rows marked |
| **Bodyweight, live** | An open workout holds this exercise | Today's group: "Today" + Live badge, no link; it plots like any session |
| **Cardio, two points** | Two runs | Records Longest distance and Longest time; one step |
| **Hold, one point** | One plank session | The single square, the one-point caption |
| **Many points** | 30 sessions | Records and the newest keep squares; the line carries the rest |
| **Nothing to plot** | Only warm-ups | Records card: `p.none`; chart card: `p.none`; the sets still listed |
| **Never logged** | No sets of it | Head, then `.card.empty` with All history |
| **Signed out** | No user | 303 to `/signin?next=/exercises/{id}` |
| **Not found** | Not one of the 16 ids, or not a number | 404 |
| **Pending / error** | n/a | No form; links and `details` only |
| **Narrow / wide** | 390 / 1280 | At 390 the records are 2 columns; the chart is 330 px wide with 21 px labels; a long day wraps inside its row header. At 1280 the records are one row |

## 5. Departures

- **Chart colours**: `--leaf` and `--paper` on `--ink`, with `--deep` grid
  lines, on a Paper page. It's the Game Boy screen inside the paper
  logbook, like `.passcode` (leaf on ink) already is. All tokens.
- **A stretched SVG** (`preserveAspectRatio="none"`). Not pixel art from
  `src/sprites/`, so the whole-number scaling rule (system 10) doesn't
  apply; non-scaling strokes keep its pixels square.

Otherwise none.

## Layout changes

None beyond the badge modifiers named in `history/spec.md`, "Layout
changes" (Nov 4). `.fold` could replace history's `details.week` toggle
rules later; not needed now.

## Open questions (behaviour the criteria don't decide)

1. **The "current record" after one working set.** LB-4.3 says a first set
   is not *marked*, but LB-5.2 lists "her current record for each of its
   record types". Drawn: the records box shows the best so far even from one
   session (Plank, 1:15), with no mark on the set. The alternative is to show
   records only once something has been beaten.
2. **Records from a live workout.** Drawn as counting (Pull-up's "Most reps
   11, Today" from the open workout). LB-4.9 makes marks change while the
   workout is open; the records box would change with them.
3. **How many sessions show before folding.** Drawn as 6. LB-5.8 allows
   folding but sets no number.
4. **Which chart points are lit.** Drawn as sessions holding a record of the
   *plotted* type only. Not decided by the criteria; purely visual.
5. **Home's link to `/plans`** (LB-3.11) belongs to the Lobby group's home
   page, which this group may not change. Someone needs to add it there.

## Exercise art, Nov 5

LB-7 in `docs/product/criteria/logbook.md` (D36 to D43). The head's still
equipment drawing becomes the person's avatar lifting on that machine
(LB-7.3), on the empty state too (D42). This **supersedes** item 1 of
Structure (Nov 4): `svg.art` becomes the art below.

- **Size: 2×, 64 × 64 px**, on phones and laptops alike: the head's old
  footprint, and one step up from the tables' 1×, because here the art
  *is* the page's picture rather than a row marker. Still whole-number
  (system 10).
- **Markup:** `<ExerciseArt e={equipment} look={look} size={64}
  class="art" />` in `header.ex-head`, before the `h1`, `aria-hidden`.
  The `h1` is still the name (LB-7.8).
- **Frame:** the same floor-tile square, `--tile` fill and an ink `--px`
  border. The border now sits **outside** the 64 px (`box-sizing:
  content-box`). The Nov 4 `svg.art` had `width: 64px` with the layout's
  `border-box`, which drew the sprite at 56 px, not a whole 2×; this fixes
  that. The box is 72 × 72 px with the border.

  ```css
  .ex-head .ex-art { box-sizing: content-box; background: var(--tile); border: var(--px) solid var(--ink); }
  ```

  It replaces the Nov 4 `.ex-head .art` rule.
- **Never logged:** the same art in the head: you on the cable machine you
  haven't tried yet, above "No sets of Lat pulldown yet…". The empty card's
  `bigDumbbell` stays.
- **No art in the session rows** (D42, LB-7.14): this page's `table.log`
  groups by session, and its day links keep the Nov 4 markup.
- Plays at the gym's pace, Frame 1 under reduced motion (from
  `ExerciseArt.astro`).
- Shown in **Default** and **Never logged**.

Departures: none.
