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
