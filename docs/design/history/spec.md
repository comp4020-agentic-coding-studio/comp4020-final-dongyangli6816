# History: design spec

Mockup: `docs/design/history/mockup.html`. Screenshots: `shot-desktop.png` (1280),
`shot-mobile.png` (true 390 px, first screen) and `shot-mobile-full.png` (390 px,
every state). Note: `scripts/shot.sh` cannot render below 500 px, because headless
Chrome clamps the window to 500 px and then crops the image to 390. So the 390 px
shots here were taken through a 390 px iframe instead.

## 1. Plan

**Who and when.** Three moments, in this order of weight:

1. **Between sets, mid-workout.** You tap History in the top bar to check what
   you benched last week before loading the bar. You have one hand free, about
   90 seconds, and you only glance. Then you need to get back to the gym.
2. **Straight after Finish.** The room's Finish button redirects here, so the
   newest entry is the workout you just did. This moment is the payoff.
3. **On the couch, or at the showcase.** You scroll back through the weeks and
   show a mate your logbook.

**The one job.** Answering "what did I lift last time?" in one glance. The page
is for reading, so it has no form. Its one primary action depends on the case:

- if a workout is still open, it's **Resume**, which goes back to the gym;
- if there are no workouts, it's **Start one**, which goes to `/`;
- otherwise there is no primary button, and the page is the logbook itself.

**Hierarchy.**

1. **When:** the week, then the day ("Today", "Mon 5 Oct"). Lifters remember
   their sessions by day.
2. **The lifts:** each exercise name once, with its top set under it
   (`Top 82.5 kg × 8`). This is the number the between-sets glance is after.
3. **The sets:** kg and reps for every set, right-aligned and tabular, in VT323
   at 24 px. These must read correctly at a glance.
4. **The tally:** time, sets and volume for the session, in boxed VT323 figures
   at 28 px.

**Reuse.** Each workout is a `.card`. The sets use the global `table` with
`.num`. The Live badge is `.badge`, the success message is `.bubble`, and the
buttons are `.button`. New, all in the page block:

- `.week` with a day strip (`.days`);
- `.tally`;
- `.log` modifiers for grouped lifts;
- the pinned `.resume` strip;
- the `.empty` layout.

**Template check.** The first draft was "date heading + stat boxes + table". With
the colours changed, it would fit any expense or fitness app. What I changed to
make it Spotter's logbook:

- **Weeks ruled off like logbook pages.** Each week gets a thick ink rule and a
  pixel day strip (M T W T F S S). Trained days are ink squares with leaf
  letters. The strip only records days you trained: empty weeks are never
  shown, and nothing counts misses. So it reads as a training log, not a
  streak to lose.
- **Lifts written the way lifters write them.** The exercise name appears once
  per run of sets, not on every row. Its top set sits under it. The same
  change fills what was a wide empty column on desktop.
- **"Still on the floor · Resume".** A pinned strip that mirrors the gym's own
  pinned bottom panel, so checking history between sets is never a dead end.
- **"In the book" copy.** The lede (`8 workouts · 26,821 kg in the book`) and
  the success bubble (`Workout's in the book. Nice one 🏆`) use logbook
  language.
- **Older weeks fold away** behind a tap. The page stays a short logbook, not an
  infinite feed (section 14).

## 2. Requirements covered

| Requirement (source) | Element that meets it |
| --- | --- |
| "History lists the person's past workouts, newest first, with their sets" (LOG-7, `spotter-spec-4-weeks.md`) | `.week` sections newest first; inside each, `article.card.entry` newest first; the `table.log` lists every set |
| "Past workouts with their sets" (Screens table, `spotter-spec-4-weeks.md`) | Same as above |
| Start time and a Live badge if not finished (task brief; current page) | `.entry-head`: `h3` day label plus `.when` time range; `.badge` "Live" when `endedAt` is null |
| Table of sets: exercise, kg, reps (task brief; current page) | `table.log`, columns `Exercise` / `kg` / `Reps`, kg as a plain number (so `62.5` stays in the HTML for `spec/core-loop.test.ts`) |
| "A set logged by a person is in their history after signing out and back in" (`spotter-spec-4-weeks.md`, README) | Unchanged data path (`history(user.id)`); exercise names and kg are plain text |
| Signed out goes to sign in (`spec/core-loop.test.ts` line 18; design system section 13) | Keep `Astro.redirect("/signin?next=/history", 303)` unchanged |
| Empty state: copy bank line plus the one action that fixes it (design system sections 3 and 13) | `.card.empty`: `No workouts yet. Your future self is waiting 🏋️` plus `.button` "Start one" → `/` (same link as today) |
| Success shown in place with `.bubble` (design system section 13) | `.bubble role="status"` after Finish (needs `?finished=1`, see States) |
| Numbers in VT323, tabular, right-aligned, always with a unit (design system section 6) | `.num` cells under a `kg` / `Reps` header; tally figures `56 min`, `4,190 kg`; top set `82.5 kg × 8` |
| One primary button; in the thumb zone on phones (design system section 8) | `.resume` is `position: sticky; bottom: 0` |
| No infinite feeds (design system section 14) | Only the two newest weeks with workouts are open; older weeks are closed `<details>` |
| Workout detail and per-exercise history (LOG-11, MVP spec) | Out of scope per the brief (no new routes). The top-set line covers the "last time" need inside the list |

## 3. Structure

Top to bottom, inside the layout's `<main>`. The top bar and footer are unchanged.

1. **`h1` "History"**: global `h1`.
2. **`p.lede`** (new): `{n} workouts · {total} kg in the book`. Hidden when there
   are no workouts.
3. **`p.bubble[role=status]`** (existing, success state only):
   `Workout's in the book. Nice one 🏆`.
4. **One block per calendar week that has workouts**, newest first:
   - The two newest: `section.week[aria-labelledby]`.
   - Older: `details.week` (closed) whose `summary.week-head` holds the same head.
   - **`.week-head`** contains:
     - `h2`: "This week", "Last week", or a range such as `21 – 27 Sep`;
     - `.week-row` containing:
       - `span.days[role=img][aria-label="Trained Monday and Wednesday"]`, which
         holds seven `span`s M T W T F S S, with `.on` on the trained days;
       - `span.count`: `2 workouts` or `1 workout`;
       - `span.toggle`, in `details` only. CSS writes "Show" or "Hide" into it.
   - **`article.card.entry`**, one per workout, newest first:
     - `header.entry-head` containing:
       - `h3`: the day label, plus `span.badge` "Live" if `endedAt` is null;
       - `p.when`: `<time>6:42</time> – <time>7:38 pm</time>`, or
         `Started <time>6:42 pm</time>` when live.
     - `dl.tally` (new): three `div`s, each a `dt` and a `dd`:
       - Time / `56 min`; the first `dt` reads "So far" when live;
       - Sets / `11`;
       - Volume / `4,190 kg`.
     - `table.log` (global `table`, plus the `.log` modifiers):
       - `thead`: `th` Exercise, `th.num` kg, `th.num` Reps.
       - **One `tbody` per run of consecutive sets of the same exercise.** Its
         first row starts with
         `th.lift[scope=rowgroup][rowspan=n]`, which holds the exercise name and,
         when n ≥ 2, `span.top`. Each row then has `td.num` kg and `td.num`
         reps.
       - Runs alternate `--card` and `--paper` fills.
       - A `--px` ink rule separates one run from the next.
5. **`div.resume`** (new, live state only). It must be the **last child of
   `main`'s content**: sticky positioning only pins an element that comes after
   the content it pins over. It contains:
   - `p`: `Still on the floor`, plus `small` `3 sets in, 21 min`;
   - `a.button` "Resume" → `/rooms/{roomId}`.
6. **`div.card.empty`** (empty state only), instead of 2 to 5. It contains:
   - a 16 × 8 pixel dumbbell `svg`, drawn at 4×;
   - `p` with the copy bank line;
   - `a.button` "Start one" → `/`.

### How each number is computed

All from `history(user.id)` as it is today: `startedAt`, `endedAt`, `roomId` and
`sets[]` with `name`, `weightKg`, `reps`, in logged order. Dates and times use
`en-AU` in one display time zone (see open question 1).

- **Day label.** Compare the calendar date of `startedAt` with today:
  - same date: "Today";
  - the day before: "Yesterday";
  - otherwise `Wed 7 Oct` (`weekday: "short", day: "numeric", month: "short"`),
    adding the year if it isn't the current year.
- **Time range.** `startedAt` – `endedAt` with `hour: "numeric", minute:
  "2-digit"`.
  - Drop the first am/pm when both match (`6:42 – 7:38 pm`).
  - Keep both when they differ (`11:40 am – 12:35 pm`).
  - Live: `Started 6:42 pm`.
- **Time (duration).** `Math.max(1, Math.round((endedAt − startedAt) / 60000))`
  followed by ` min`. Always minutes, never hours, so `65 min` fits its box on a
  390 px phone.
  - Live: `Date.now() − startedAt` at render time, labelled "So far".
  - Caveat: `openWorkout` sets `startedAt` when the first set is logged, so the
    duration leaves out the first set and any warm-up before it.
- **Sets.** `sets.length`.
- **Volume.** `Σ weightKg × reps` over all sets, `Math.round`, then
  `toLocaleString("en-AU")`, followed by ` kg`. Bodyweight sets (0 kg) add 0.
  This matches LOG-6's definition, so it agrees with the future summary.
- **Runs (grouping).** Walk `sets` in order and start a new run whenever `name`
  differs from the previous set's. If an exercise comes back after a different
  one, it starts a new run, which stays true to the order things were done.
- **Top set** (runs of 2 or more only):
  - the set with the highest `weightKg`; on a tie, the most `reps`; on a tie
    again, the first one;
  - shown as `Top {kg} kg × {reps}`;
  - if the highest weight is 0 (pull-ups, leg raises), show `Best {max reps} reps`
    instead.
- **Weeks.** Monday to Sunday, in the display time zone.
  - Labels: the current week is "This week" and the previous one is "Last
    week". Any other week shows its range: `21 – 27 Sep`, or `28 Sep – 4 Oct`
    when it spans two months.
  - Day strip: `.on` for each weekday with at least one workout `startedAt`.
  - Count: the number of workouts in that week.
  - Weeks with no workouts are skipped.
- **Open or folded.** The two newest weeks that contain workouts render open.
  Every older week renders as a closed `details`.
- **Lede.** The total workout count and the total volume across all workouts.
- **Resume.** Take the newest workout with `endedAt === null` and a non-null
  `roomId`. Its set count and its so-far minutes fill the `small` line, and the
  button links to `/rooms/{roomId}`. `history()` already returns `roomId`
  through `...w`, so no query change is needed.

## 4. States

| State | Trigger | What changes |
| --- | --- | --- |
| **Default** | At least one workout, all finished | Lede, open weeks, folded older weeks. No primary button |
| **Live** | Any workout has `endedAt === null` | That card gets the `Live` badge, `Started …` and "So far". `.resume` appears at the end of `main`, pinned to the bottom of the viewport while you scroll |
| **Success** | `?finished=1` in the URL and the newest workout has `endedAt` | `.bubble[role=status]` under the lede. Needs a one-line change outside this page: the Finish redirect in `src/pages/rooms/[id].astro` becomes `/history?finished=1` (no spec test checks that target) |
| **Empty** | `history()` returns `[]` | Only `h1` and `.card.empty`. No lede, no weeks |
| **Signed out** | No `Astro.locals.user` | 303 to `/signin?next=/history`, as today |
| **Pending** | n/a | No form on the page. Resume and Start one are plain links |
| **Error** | n/a | No user input on the page. A server failure is the framework's error page, as on every page |
| **Narrow / wide** | 390 / 1280 | At 390, lift names wrap inside `th.lift` (`Incline bench / press`), and the tally keeps three columns. At 1280, the `main` width is 44 rem, so nothing new is needed |

## 5. Departures

- **The empty state's button isn't in the bottom third** on a phone. It sits
  about 40% of the way down, because the page has nothing above it. Pushing it
  lower with empty space would look broken. It is `.button` (not `.wide`), as on
  other Paper pages.
- **`th.lift` overrides the global `th` style.** It uses body font at 24 px, ink
  on the row fill, and no uppercase. It is a row header (`scope=rowgroup`), not
  a column header, so it reads as data while keeping table semantics.
- **The `.toggle` label uses CSS generated text** ("Show" / "Hide"). The
  `details` element already announces expanded or collapsed. If the main agent
  prefers real text, two spans toggled with `details[open]` work just as well.
- **The raw hex in the empty-state dumbbell `svg`** falls under the sprite
  palette exemption (section 10), the same as the logo.

Otherwise none. Every colour is a token, every display size is 8 or 16 px,
VT323 is never below 21 px, and borders and shadows sit on the `--px` grid.

## Layout changes

These are shown in the mockup's page block as `/* layout change: … */`. They are
not part of the history page block; the main agent should merge them once,
together with the other designers' lists.

1. **`h2` 14 px → 16 px** (known gap 3).
2. **`h3` 12 px → 16 px** (known gap 3). The mockup sets 16 px on
   `.entry-head h3` only; once the global rule moves, delete that line.
3. **`th` 10 px → 8 px and `.badge` 9 px → 8 px** (known gap 3).
4. **Ink focus ring on Paper** (known gap 1): `:focus-visible { outline-color:
   var(--ink) }` on Paper pages. The yellow ring stays for `body.night`.
5. **New tokens** (known gaps 2 and 5): `--hover: #1a5c32` used by
   `button:hover, .button:hover`, and `--row: #eef5e1` for the global zebra
   rows. History doesn't use `--row` (it stripes runs with `--card` / `--paper`),
   but the global rule should stop hard-coding the hex.

## Open questions

1. **Time zone.** The server formats dates in its own zone, and Fly runs in UTC
   unless `TZ` is set. Today's page already shows a 10:50 pm workout at the
   wrong hour for anyone in Australia. "Today", "This week" and the day strip
   would inherit the error. The options are: pass `timeZone:
   "Australia/Sydney"` to every `Intl` call, set `TZ` in `fly.toml`, or keep a
   per-user zone later. This is the user's decision.
2. **Bodyweight sets** show `0` in the kg column, which is what's stored. `BW`
   would read better to lifters but means interpreting the data. Kept as `0`.
