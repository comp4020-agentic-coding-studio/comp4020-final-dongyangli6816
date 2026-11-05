# History: design spec

Mockup: `docs/design/history/mockup.html`.
Screenshots: `node scripts/shot.mjs docs/design/history/mockup.html .shots/history/mockup`
(not kept in git).

This redesign works with the four set kinds, links each entry to its new
summary page, and hands the "just finished" bubble over to that page. The
week grouping, day strip, folding older weeks, the Live badge and the Resume
strip are unchanged from the previous history design.

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

**Who and when.** Three moments, in this order of weight:

1. **Between sets, mid-workout.** You tap History to check Tuesday's
   pull-ups before you jump on the bar. You have one hand, about 90 seconds,
   and you only glance. The Resume strip gets you back.
2. **Planning the next session**, at home or on the walk in: what did I
   squat last week, how far did I run?
3. **Showing a mate**, on the couch or at the showcase. One tap on a day opens
   its summary for a screenshot.

(Straight after Finish used to be a history moment. It now belongs to the
summary page.)

**The one job.** Answer "what did I do last time?" at a glance, whatever the
kind of exercise. The page is for reading. Its one primary action is
**Resume** when a workout is live, **Start one** when the logbook is empty, and
otherwise there is none: the entries' day links are ordinary links.

**Hierarchy.**

1. **When:** the week, then the day (the link).
2. **The best set** under each exercise name (`Best 82.5 kg × 8`,
   `Best BW × 12`, `Best 1:30`, `Best 5 km · 25:00`). These must read
   correctly at a glance.
3. **The sets**, right-aligned in VT323 at 24 px.
4. **The tally:** time, sets, volume and/or distance.

**Reuse.** `.card`, the global `table` with the `.log` rules, `.badge`,
`.button`, and `h2` / `h3`. The arrow comes from `icons.ts`. Kept from the
previous history design: `.week`, `.days`, `details.week`, `.toggle`,
`.resume`, `.empty`. Nothing new except the shared logbook rules and the
link style on `.entry-head h3 a`.

**Template check.** With the colours swapped, "date, stat boxes, table" would
still fit any app. What keeps it Spotter's logbook:

- **The ruled weeks and the M T W T F S S day strip** stay.
- **The sets are written in lifters' shorthand**, not in generic columns:
  `BW + 10 kg × 6`, `1:30`, `5 km · 25:00 · 5:00 /km`. The old `kg | Reps`
  columns would have shown "0" for a pull-up and nothing at all for a plank.
- **The tally changes shape with the workout**: a run day reads in
  kilometres, a push day in kilograms. There are no empty "0 kg" boxes.
- **The day label is the door to that day's summary**, where your avatar
  holds the Finished chip. History stays the quiet list, and the summary is
  the screenshot.

## 2. Requirements covered

| Requirement (source) | Element that meets it |
| --- | --- |
| "History lists the person's past workouts, newest first, with their sets" (LOG-7, `spec-4-weeks.md`) | `.week` sections newest first; `article.card.entry` newest first; `table.log` lists every set |
| "A set records what its exercise's kind measures: weight in kg and reps; reps and any added weight (bodyweight); a hold time (duration); or a distance and time (cardio)" (LOG-3, `spec-4-weeks.md`) | `td.set` written per kind (see the Shared table) |
| Sets written per kind; the tally handles distance (task brief) | `td.set` and `.best`; `dl.tally` shows Distance when > 0 and Volume only when > 0 |
| "Each entry links to its summary" (task brief) | `.entry-head h3 > a[href=/workouts/{id}]` on finished entries |
| "The `?finished=1` bubble moves to the summary page; drop it from history" (task brief) | Bubble and the `finished` query read removed |
| "Keep the week grouping, day strip, folding older weeks, the Live badge and the Resume bar" (task brief) | Unchanged: `.week`, `.days`, `details.week`, `.badge`, `.resume` |
| `spec/core-loop.test.ts`: `/history` contains `Bench press` and `62.5`; 303 when signed out | Exercise name in `th.lift`; `62.5 kg × 7` in `td.set`; redirect unchanged |
| Empty state: copy bank line plus the one action that fixes it (system 3, 13) | `.card.empty`, unchanged |
| Numbers in VT323, tabular, with a unit (system 6) | Every set cell carries its unit (`kg`, `BW`, `m:ss`, `km`, `/km`); tally figures `64 min`, `3,520 kg`, `1.2 km` |
| Tap targets ≥ 44 px (system 12) | Day link `min-height: 44px`; the live entry's `h3` keeps the same 44 px line |
| No infinite feeds (system 14) | Only the two newest weeks open; older weeks are closed `details` |

## 3. Structure

Top to bottom inside the layout's `main`. The top bar and footer are
unchanged. **Bold** marks what changed from today's `src/pages/history.astro`.

1. `h1` "History".
2. `p.lede`: `{n} workouts · {kg} kg · {km} km in the book`. **The `· {km} km`
   part appears only when the total distance is above 0.**
3. **No bubble.** Remove the `finished` constant and its `.bubble`.
4. One block per week with workouts, newest first (`section.week` for the two
   newest, `details.week` for older ones), with `.week-head` → `h2`, then
   `.week-row` → `.days`, `.count` and (in `details`) `.toggle`. All of this
   is unchanged.
5. `article.card.entry` per workout:
   - `header.entry-head`:
     - **Finished:** `h3 > a[href=/workouts/{id}]`, holding the day label,
       `span.vh` ", summary", and the arrow `svg.go` (16 × 16,
       `aria-hidden`).
     - **Live:** `h3` with the day label and `span.badge` "Live", with no link.
     - `p.when`: the time range, or `Started 6:42 pm` while live.
   - **`dl.tally`**: the `div > dt + dd` pairs listed under Shared. Units go in
     `span.unit`, e.g. `64<span class="unit"> min</span>`.
   - **`table.log`**:
     - `thead`: `th[scope=col]` "Exercise" and `th.num[scope=col]` "Set".
     - Then one `tbody` per exercise (`byExercise`, not `runs`). Its first
       row holds `th.lift[scope=rowgroup][rowspan=n]` (the name, plus
       `span.best` when n ≥ 2). Every row holds `td.set`.
6. `div.resume` (live only), last in `main`, unchanged.
7. `div.card.empty` (no workouts), unchanged.

**Page block** (`<style id="page">`, below the shared rules):

- `.entry-head` now has `align-items: center` and a `-0.5rem` top margin, so
  the 44 px link line doesn't add height.
- New `.entry-head h3 a` and `.entry-head h3:not(:has(a))` rules.
- Everything else is the previous history block, minus the rules that moved
  to the shared block (`.tally`, `.log`, `.when`).

### Numbers

These come from `history(user.id)`, which already returns `kind`,
`weightKg`, `reps`, `durationS` and `distanceM` per set, and from
`src/lib/logbook.ts`:

- **Time:** `minutes(startedAt, endedAt ?? now)`.
- **Sets:** `sets.length`.
- **Volume:** `kg(volume(sets))`.
- **Distance:** `km(distanceKm(sets))`.
- **Lede totals:** the same functions over every workout's sets.
- **Set cell:** `setLabel(s)`. For cardio, split off the last ` · ` part into
  `span.pace`.
- **Best line:** `bestLabel(sets)`, only when the exercise has 2 or more sets.

## 4. States

| State | Trigger | What changes |
| --- | --- | --- |
| **Default** | At least one workout, all finished | The mockup shows a mixed day (4 tally boxes), a weights and bodyweight day (3 boxes), a cardio-only day (Time · Sets · Distance), last week open, and two folded weeks. No primary button |
| **Live** | A workout has `endedAt === null` | That entry: `Live` badge, no link, `So far`, `Started …`. `.resume` is pinned at the bottom |
| **Empty** | `history()` returns `[]` | `h1` and `.card.empty` only |
| **Signed out** | No user | 303 to `/signin?next=/history`, unchanged |
| **Success** | none | Moved to the summary page. A stale `?finished=1` is ignored |
| **Pending / error** | n/a | No form; all actions are links |
| **Narrow / wide** | 360–390 / 1280 | Checked at 360, 390 and 1280. At 360, long names wrap inside `th.lift` (`Overhead / press`), the best line breaks after "Best", and four tally boxes go 2 × 2. The widest set cell (`BW + 10 kg × 6`) still fits |

## 5. Departures

- **Grouping changes from runs to exercises.** The previous design started a
  new group whenever an exercise came back after another one. Grouping by
  exercise gives each exercise one block and one best, which is what "what
  did I bench last time?" needs. It also matches the summary's "each
  exercise with all its sets". If you alternate two lifts in a superset, you
  lose the visible order; the order inside each exercise is kept.
- **"Top" becomes "Best"** for every kind, since a plank or a run has no "top
  set".
- **`th.lift` overrides the global `th`** (body font, ink, no uppercase), as
  before.
- **Edge case at exactly 360 px:** if a bodyweight lift's *best* set carries
  added weight (`Best BW + 10 kg × 10`, 17 characters), the unbreakable figure
  can push the table about 6 px into the card's padding. It never goes past
  the card's border. Accepted rather than letting the figure split.

Otherwise none.

## Layout changes

None needed in `Layout.astro`. `.vh` is in the shared block; the room mockup
defines the same rule, so it could become a global utility. That is the main
agent's call.

## Open questions

1. **Time zone** (carried over): dates and "Today" use the server's zone, which
   is UTC on Fly unless `TZ` is set. This is the user's decision.

## Appendix: 32 × 32 art (ADR 0005)

**`bigDumbbell`** (empty state), redrawn at **32 × 16**, not 32 × 32: it is
the logo's dumbbell, a wide object, and a square grid would only add eight
transparent rows above and below. 32 × 16 keeps today's footprint, so
`history.astro` keeps `<Sprite sprite={bigDumbbell} scale={2} />` and it still
shows at **64 × 32 px** (whole-number 2×, unchanged). Replace the
`upscale([...])` call with the plain grid below; this sprite no longer goes
through `upscale()`.

What the extra detail adds: two plates each side (a tall inner plate, a
shorter outer one) with a `--leaf` highlight on their top-left edge, the same
lime as the logo's plates; a darker `--deep` shade on their lower half; a
collar; and a bar in `--muted` with ink knurling. 5 colours plus
transparency, all existing tokens, ink outline all round. The mockup draws it
from `#big-dumbbell-32` in its hidden `<svg>`; once this is in
`src/sprites/props.ts`, it can go back to `/sprites.svg#bigDumbbell` with
`viewBox="0 0 32 16"`.

```ts
// The logo's dumbbell in green and ink: the empty logbook. 32 × 16, drawn at
// full size (ADR 0005), not upscaled.
export const bigDumbbell: Sprite = {
  grid: [
    "....kkkk................kkkk....",
    "...kllllk..............kllllk...",
    "...klgggk..............kggglk...",
    ".kkklgggk..............kggglkkk.",
    "kllklgggkkk..........kkkggglkllk",
    "klgklgggkmk..........kmkggglkglk",
    "klgklgggkmkkkkkkkkkkkkmkggglkglk",
    "klgklgggkmkmmmkmmkmmmkmkggglkglk",
    "kdgkdgggkmkmkmmmmmmkmkmkgggdkgdk",
    "kddkdgggkmkkkkkkkkkkkkmkgggdkddk",
    "kddkdgggkmk..........kmkgggdkddk",
    "kddkddddkkk..........kkkddddkddk",
    ".kkkddddk..............kddddkkk.",
    "...kddddk..............kddddk...",
    "...kddddk..............kddddk...",
    "....kkkk................kkkk....",
  ],
  palette: {
    k: INK,
    g: "#1f6b3a", // --green, plate
    d: "#0f3d22", // --deep, plate shade
    l: "#c8e66b", // --leaf, plate highlight (the logo's plate colour)
    m: "#3d5a45", // --muted, bar and collar
  },
};
```

**Summary person** (`workouts/[id].astro`): not redrawn here (Lobby owns the
person). 64 px on phones and 96 px from 421 px are 2× and 3× of 32, so both
stay whole-number and need no change. The CSS comment there still says
"4× on phones, 6× from 421 px", which was true of the 16 px grid; it should
read "2× on phones, 3× from 421 px".

## Detail pass, Oct 18

The `bigDumbbell` (empty logbook) was redrawn at its current 32 x 16 size with the same palette plus one extra bar grey for a lit bar: plates now have a top-left leaf highlight and a deep right-hand shade, and the bar has a highlighted collar and knurling. `dumbbell` and `kettlebell` in `props.ts` gained a lighter highlight tone, a clear top-left light edge, and a shaded lower right; the kettlebell handle now reads as a loop with a visible hole. No layout, size or class changes.

## Logbook refactor, Nov 4

The criteria are `docs/product/criteria/logbook.md` (LB-0 to LB-6, D1 to
D22). This section adds the marks, notes and exercise links to every set
table, and the week-so-far block above the weeks. It **supersedes**:

- Section 1's "Shared" block, where the Nov 4 shared block below differs
  (links on exercise names, marks, notes; everything else stands);
- **Open question 1, the time zone: settled by D21**, Australia/Sydney. Every
  day label, week and "Today" on this page is Sydney time;
- Section 3 item 5's `table.log` (see Structure below); the rest of section
  3 stands.

The mockup (`docs/design/history/mockup.html`) is redrawn with Nov data
(Wed 4 Nov 2026, Mia). The Oct mockup's states are carried over (default,
live, empty, and the stateless notes), with new ones for the streak.

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

**Who and when.** Unchanged from Oct, plus one: **the Monday glance.**
Opening history at the start of a week to see where you're at. The stats
answer it without scrolling.

**The one job.** Still "what did I do last time?", now with "how's my week
going?" above it. No new primary action: Resume while live, Start one when
empty, otherwise none.

**Hierarchy.**

1. **Week so far**: workouts, volume and/or distance, and the streak. These
   are figures that must read at a glance (28 px, the shared tally).
2. The weeks and days, unchanged.
3. Inside an entry: the **record marks** are the loudest thing in a table
   (leaf on ink), then the sets, then type marks and notes, then RPE.

**Reuse.** `.tally` (shared), `.badge` with three modifiers, the pencil
icon (`i-pencil`), the existing week blocks. New: `.so-far`, `.streak`,
`.plates`, and one 8 × 8 icon, `i-record`.

**Template check.** The first sketch was three stat cards with a flame
streak counter: Duolingo with a barbell. Changed to:

- the week's figures in the **same ruled tally** every workout already has,
  so the block reads as "this week's page of the logbook", not a dashboard;
- the streak as **plates loaded on a bar**, one per week (eight shown, then
  `+n`), this week's plate in leaf. It grows like a loaded barbell, and
  with 0 weeks there is simply no bar (D22), so there is nothing to lose or
  defend. No flame, no "don't break it", no countdown (LB-6.6);
- "Workouts 0" on a Monday morning is just a number (LB-6.3), and the streak
  beside it still counts last week, so the week starts on a pat on the back.

### 2. Requirements covered

| Requirement (source) | Element that meets it |
| --- | --- |
| LB-6.1 this week's workouts, volume when > 0, distance when > 0, streak when ≥ 1; the all-time line stays | `section.so-far` > `dl.tally` (Workouts, Volume, Distance) and `p.streak`; `p.lede` unchanged |
| LB-6.3 "Given none yet, it says 0, plainly, with no comment" | State "not yet this week": `Workouts 0`, no other box, no copy |
| LB-6.5, D22 streak counts to last week if this week has none | State "not yet this week": 7-week streak, no leaf plate |
| LB-6.6 streak 0 shows nothing; no warning, countdown or nudge | State "no streak": `p.streak` absent; nothing else on the page mentions it |
| LB-6.8 no workouts: empty state exactly as today, no stats | State "empty": no `.so-far` |
| LB-6.10 a Drifter's week reads as a pat on the back | State "back after a break": "1 workout", one leaf plate, "1-week streak" |
| LB-2.2, LB-2.3 types marked wherever the set is written | `.badge.warmup` / `.badge.failure` in `span.marks` |
| LB-2.16 RPE as "100 kg × 5 @ 8", read as "RPE 8" | `span.rpe[aria-hidden]` + `span.vh` |
| LB-2.23 the note shows with its exercise in history | `tr.note` last in the exercise's `tbody` |
| LB-4.10 a record names each record it set, as a word, never "Best" | `.badge.record` "Record" + `span.rec-for` "heaviest, best e1RM"; accessible name "New record: heaviest, best e1RM" |
| LB-5.7 every exercise name is a link, ≥ 44 px, keyboard reachable | `th.lift > a[href=/exercises/{id}]`, `min-height: 44px` |
| LB-0.3 old sets read as before | No marks, RPE or note when none is stored; the markup is then today's |
| LB-0.6 marks have names and never rely on colour | Every mark is a word; the warm-up's dashed border and the record's fill are extras |

### 3. Structure

Changes only. Top to bottom inside `main`:

1. `h1` "History", `p.lede`: unchanged.
2. **New `section.so-far[aria-labelledby]`**, only when there is at least one
   workout:
   - `h2` "Week so far";
   - `div.so-far-row` (wraps on phones): the shared `dl.tally` with
     `Workouts` (always), `Volume` (`kg`, when > 0), `Distance` (`km`, when
     > 0), the same `div > dt + dd` and `span.unit` as an entry's tally;
   - `p.streak`, only when the streak ≥ 1: `span.plates[aria-hidden]` (one
     `i` per week up to 8, the newest last; the last gets `.now` only when
     this week has a workout; past 8, `span.more` "+n"), then the text
     `{n}-week streak`. The text is the whole meaning; the plates are
     decoration.
3. Weeks: unchanged.
4. In each entry, **`table.log`** (`WorkoutSets.astro`) gains:
   - `th.lift > a[href=/exercises/{id}]` around the name (no arrow, the
     name is a plain link as in body text); `span.best` unchanged;
   - per set row: `tr.warm` for a warm-up; in `td.set`, after `setLabel`,
     the RPE pair, then (cardio) `span.pace`, then `span.marks` holding the
     type badge and/or the record badge plus `span.rec-for`;
   - a last row `tr.note > td[colspan=2]` with the pencil icon
     (`Sprite` `pencilIcon`, scale 2), `span.vh` "Note: " and the text.
5. Resume, empty: unchanged.

**Page block** (`<style id="page">`): the Oct block plus `.so-far`,
`.so-far-row`, `.streak`, `.plates` (and `i`, `.now`, `.more`), all built
from tokens. The shared block gains the `.log` additions and the badges.

#### Shared marks

The words and class names for set types and records, for the Gym designer
to match on the sheet (stamp, This workout, Last time). All are the
layout's `.badge` (8 px display font, 2 px ink border) with one modifier;
nothing new is a primitive.

| Mark | Class | Visible word | Look | Accessible name |
| --- | --- | --- | --- | --- |
| Warm-up set | `.badge.warmup` | `Warm-up` | ink text, no fill, **dashed** 2 px ink border | "Set type: Warm-up" (`span.vh` "Set type: " before the word) |
| Failure set | `.badge.failure` | `Failure` | ink text, no fill, solid border | "Set type: Failure" |
| Normal set | none | none | nothing drawn | nothing (Normal is the default) |
| Record | `.badge.record` + `span.rec-for` | `Record` then the types in VT323: `heaviest`, `best e1RM`, `most reps`, `heaviest added`, `longest hold`, `longest distance`, `longest time`, comma-separated | **leaf on ink** (a lit day), with the 8 × 8 star `i-record` at 2× | "New record: heaviest, best e1RM" (`span.vh` "New " before, ":" after "Record") |
| Record count (summary) | `.badge.record` | `3 new records` / `1 new record` | as Record | its text |
| RPE | `span.rpe` (not a badge) | ` @ 8` after the figures | same font and colour as the figures | `aria-hidden`, then `span.vh` ", RPE 8" |
| Note | `tr.note` (not a badge) | the pencil icon then the text | muted, 21 px | `span.vh` "Note: " before the text |

On **Night** (the sheet) the same classes should read: `.warmup` and
`.failure` with `--paper` text and an `--edge` border (dashed for warm-up);
`.record` stays leaf on ink, with a 2 px `--leaf` border so it holds on
`--panel`. That is a suggestion for the Gym designer, not drawn here.

Rules: the record mark never says "Best" or "PB" (LB-4.10); the type word is
always shown, never only the dashed border; a set can carry a type and a
record (a Failure set can be a record, LB-2.9), type first.

**`i-record`**, the new 8 × 8 icon (`src/sprites/icons.ts`, then draw it
from `/sprites.svg#i-record`):

```ts
// a record (docs/design/history/spec.md, "Shared marks"): a pixel star
export const recordIcon = icon("...cc...", "...cc...", "..cccc..", "cccccccc", ".cccccc.", "..cccc..", ".cc..cc.", ".c....c.");
```

### 4. States

| State | Trigger | What shows |
| --- | --- | --- |
| **Default** | Trained this week; streak 6 | Week so far (2 · 4,898 kg · 5.6 km), six plates with the last in leaf. Today: warm-ups, RPE, a Heaviest record, a Failure set, notes. Mon 2 Nov: a warm-up walk then a run. Thu 29 Oct: a record naming two types |
| **Not yet this week** | Monday, nothing logged yet | `Workouts 0`, no Volume or Distance; 7-week streak, no leaf plate; no copy about it |
| **Back after a break** | One workout this week after a month off | `Workouts 1`, `Distance 3.2 km`; one leaf plate, "1-week streak" |
| **No streak** | Nothing this week or last | `Workouts 0` alone; no `p.streak` |
| **Live** | An open workout | As Oct, with its marks; week figures include it once it has a set (LB-6.3) |
| **Empty** | No workouts | As Oct; no `.so-far` |
| **Signed out, pending, error, success** | — | As Oct: no form on the page |
| **Narrow / wide** | 390 / 1280 | At 390 the tally and streak stack; marks wrap under the figures, the widest set cell (`BW + 10 kg × 6 @ 9`) still fits. At 1280 tally and streak sit on one row |

### 5. Departures

- **The `.badge` modifiers sit inside table cells**, not after a heading as
  `LIVE` does; they reset `margin-left` to 0 (shared block).
- **Exercise links have no arrow**, unlike the day links. The day link goes
  to a summary of the same thing; the name goes somewhere new, and an arrow
  on every row would be noise. Underline alone marks them.

Otherwise none.

### Layout changes

Move the three badge modifiers (`.badge.warmup`, `.badge.failure`,
`.badge.record`) from the shared block into `Layout.astro`'s "bits" once the
Gym design uses the same names, since the room's sheet needs them on Night
too. Until then they can live in `WorkoutSets.astro`. `.vh` is still
duplicated across pages; a global utility is the main agent's call.

### Open questions (behaviour the criteria don't decide)

None for this page. The group's questions are listed in the report and in
`exercise/spec.md`, "Open questions". The visual choices that aren't
behaviour (type before record; eight plates then "+n") are the design's.

## Exercise art, Nov 5

LB-7 in `docs/product/criteria/logbook.md` (D36 to D43). Each exercise's row
header in the set table shows the person's own avatar lifting on that
exercise's machine, as the gym draws someone Lifting. The summary shares the
table (`summary/spec.md`, same date). This adds to the Nov 4 table; nothing
in it is superseded except the row header's markup below.

**Plan.** The set figures stay the main thing (hierarchy item 3 of Nov 4),
so the art is the smallest whole-number size that still reads as a person
on a machine: **1×, 32 × 32 px**, the map's own size on a short screen. It
is the same on phones and laptops (D37). It's a picture of *you* doing
*that*, so "the squat day" is findable by eye while scrolling (LB-7.17),
which no other logbook does.

**Placement in `th.lift`** (option A, "the art in its own column", picked
by the user on Nov 5 over a floor-tile slot and an art-above-at-every-width
layout; it replaces the first Nov 5 float, which read as crammed).

- The link becomes `a.ex-link[href=/exercises/{id}]` holding the art, then
  the name in `span.nm`. One link, one tap target, at least 44 px tall
  (D36). The art is `aria-hidden` and not focusable, so the link's
  accessible name is still just "Bench press" (LB-7.8).
- **From 421 px:** the art has a column of its own. The row header's left
  padding grows to hold it (0.6rem + 32 px + 0.75rem), and the art is placed
  in that gutter at the cell's top-left padding corner. That leaves a 12 px
  gap, and the name and its Best line stack beside it on **one left edge**.
  The name's first line is centred on the art (`line-height: 32px`), and a
  long name wraps within its column, never under the art.
- **Phones (≤ 420 px):** the column doesn't fit, so the art stands on its own
  line above the name with an 8 px gap, and art, name and Best line share
  one left edge. At 390 px a row header has only 101 to 168 px for text,
  because the set column is `nowrap` and takes what its widest figure needs.
  A 32 px column with a 12 px gap would leave 57 px in the narrowest
  table, but "Deadlift" is 77 px wide and a Best figure like `62.5 kg × 8`
  is about 105 px. Measured at 390 px: the row header is 122 to 170 px wide,
  the link is 80 px tall (a one-line name) to 107 px ("Incline bench /
  press"), no set figure wraps, and nothing scrolls sideways.
- **The arrow rule's margin.** `.log th.lift a svg { margin-left: 0.5rem }`
  is meant for a session's arrow on the exercise page, but it also reaches
  the art's three layered svgs. That shifts the drawing 8 px right, inside
  its own box, so in the first Nov 5 build the art touched the name. The
  art's layers reset it (`margin: 0`, below); in the build, limiting the
  arrow rule to `svg.go` does the same.
- **Known limit: keyboard focus.** The art is positioned absolutely from
  421 px, so the link's focus outline wraps the name and Best line but not
  the art. The art is decorative and still inside the link, so a tap or
  click on it opens the exercise page (D36). On phones the art is in the
  flow and the outline wraps all three.

**Structure** (in `WorkoutSets.astro`):

```astro
<th scope="rowgroup" rowspan={n} class="lift">
  <a class="ex-link" href={`/exercises/${id}`}>
    <ExerciseArt e={equipment} look={look} size={32} />
    <span class="nm">{name}</span>
  </a>
  {n > 1 && <span class="best">Best <span>{bestLabel}</span></span>}
</th>
```

`ExerciseArt.astro` already exists and draws what LB-7.5 asks for: the
machine's back layer, `Avatar` in the machine's pose, the front layer, the
two frames swapped by CSS at 400 ms (250 ms on the treadmill, D38), and
Frame 1, still, under reduced motion (LB-7.10). `look` is the person's look
now (D39), passed once to the table, not per set.

**CSS the build needs** (the mockup's `/* shared: logbook. LB-7 in a set
table */` rule, into `WorkoutSets.astro`):

```css
.log th.lift:has(.ex-link) { position: relative; padding-left: calc(0.6rem + 32px + 0.75rem); }
.log th.lift a.ex-link .ex-art { position: absolute; top: 0.5rem; left: 0.6rem; }
.log th.lift a.ex-link .ex-art > svg { margin: 0; } /* not the arrow's margin */
.log th.lift a.ex-link .nm { line-height: 32px; }
@media (max-width: 420px) {
  .log th.lift:has(.ex-link) { padding-left: 0.6rem; }
  .log th.lift a.ex-link .ex-art { position: relative; top: auto; left: auto; display: block; margin: 0 0 0.5rem; }
  .log th.lift a.ex-link .nm { line-height: 1.15; }
}
```

`top` and `left` are the cell's own padding (`0.5rem 0.6rem`), so the art's
top edge lines up with the name's first line box. A `has-art` class on the
`th`, set when the art renders, can stand in for `:has(.ex-link)`.

The art's own rules (`.ex-art`, the frame swap) are in `ExerciseArt.astro`;
the mockup copies them under `/* shared: logbook. LB-7, Nov 5 */`.

**States.** Shown in **Default** only, as asked. Every other state with a
table draws the same art the same way, the live entry included (LB-7.1).
Folded weeks render their cards only when opened, as today, so their art
costs nothing until then (D40). Reduced motion: Frame 1, still. Old sets:
art as for new ones, since it goes by the exercise (LB-7.7).

**Departures.** The row header's layout differs below and above 421 px (the
art above the name on phones, in its own column from 421 px). That's the
layout's existing breakpoint, not a new one. Otherwise none.

**Layout changes.** None.
