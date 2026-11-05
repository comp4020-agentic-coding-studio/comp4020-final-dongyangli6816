# Plans (`/plans`): design spec

Mockup: `docs/design/plans/mockup.html`.
Screenshots: `node scripts/shot.mjs docs/design/plans/mockup.html .shots/plans/mockup --states`
(not kept in git). The page is new, built as `src/pages/plans.astro`, from
LB-3.8 to LB-3.11 in `docs/product/criteria/logbook.md` (D9, D10, D13).
Nov 4, 2026. Loading a plan happens in the room's sheet (Gym group), not
here.

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

**Who and when.** At home, tidying up: renaming "Wed 4 Nov" to "Push day",
or deleting a plan you've outgrown. Rarely mid-workout: loading happens in
the sheet (D10), so this page is for managing, not training.

**The one job.** See your plans and keep them tidy. There is **no primary
button**: plans are made only from a summary (D9), so there is nothing to
create here, and Rename and Delete are per plan, secondary.

**Hierarchy.**

1. **Each plan's name** (`h2`).
2. **Its exercises in order with planned sets**, read as "Bench press · 4
   sets" (LB-3.8), with the station sprite and the empty boxes.
3. Rename and Delete.

**Reuse.** `.card`, the shared `ol.plan-list`, the room's confirm pattern
(`details.confirm`, `.confirm-box`, `.button.quiet`), `input`, `label`,
`.error`, `.bubble`, the equipment sprites. New: `.plan`, `.plan-tools`.

**Template check.** A list of cards with Edit and Delete is any CRUD
screen. What makes it Spotter's:

- **Each plan is drawn as the walk through the gym**: the station sprite
  beside each lift, numbered in order, and a box per set waiting to be
  filled. It's the same list the summary previewed, so the plan you saved
  is visibly the plan you have.
- **Delete is calm, not red** (system 5): the room's ask-again pattern, with
  "Your workouts stay in the book" so deleting a plan never feels like
  deleting history.
- **The empty page is one honest line** with the flat bench, not an
  illustration of a clipboard.

## 2. Requirements covered

| Requirement (source) | Element that meets it |
| --- | --- |
| LB-3.8 newest first, each with name and exercises with planned sets ("Bench press · 4 sets") | `article.card.plan` per plan, newest first; `h2` name; `ol.plan-list` rows with name and `span.n` "4 sets" |
| LB-3.8 none: "Finish a workout, then save it as a plan from its summary" and nothing else | `.card.empty` with that line and the flat bench sprite; no lede, no buttons |
| LB-3.9 rename with LB-3.5's rules | `details.confirm` "Rename" → `form.confirm-box`: `label` "Plan name", `input[maxlength=30]`, "Save name"; `.error` "Names are up to 30 characters." |
| LB-3.9 delete asks once more | `details.confirm` "Delete" → `form.confirm-box`: "Delete {name}? It can't be undone. Your workouts stay in the book." and "Delete plan" |
| LB-3.5 names shown as text | The name is escaped wherever it appears (h2, confirm text, bubble) |
| LB-3.10 signed out to `/signin?next=/plans`; others' plans 404 | States |
| LB-0.7 pending and failure | `button[disabled]`; "That didn't save. Try again." under the field, text kept |
| System 13: success in place | `p.bubble[role=status]` under the lede after a delete; a rename simply shows the new name |

## 3. Structure

Inside `main` (`<Layout title="Plans">`), Paper:

1. `h1` "Plans".
2. `p.lede` "Load one from your sheet in any room." Only when there is at
   least one plan. No count of plans: the 20-plan limit is only ever
   mentioned by its refusal on the summary (LB-3.6, D29).
3. After a delete: `p.bubble.done-line[role=status]` "Deleted {name}. Your
   workouts are untouched." After a rename, no bubble: the card's new name
   is the confirmation (see Open questions).
4. `article.card.plan[aria-labelledby]` per plan, newest first:
   - `h2` the name (wraps; `overflow-wrap: anywhere` for a 30-character
     word);
   - the shared `ol.plan-list` (station sprite, name linking to
     `/exercises/{id}`, `span.n` "{n} sets" over `span.planned`);
   - `div.plan-tools`:
     - `details.confirm` with `summary.button.secondary.quiet`
       "Rename"/"Cancel", then `form.confirm-box[method=post]`: `label`
       "Plan name", `input[name=name][maxlength=30]` holding the current
       name, any `.error`, `div.actions` > `button` "Save name";
     - `details.confirm` with `summary` "Delete"/"Keep it", then
       `form.confirm-box[method=post]`: the `p`, any `.error`, `div.actions`
       > `button.button.secondary.quiet` "Delete plan".
     An open one takes the full row where it stands, so its Cancel stays
     on the spot that was tapped.
5. No plans: `div.card.empty` with `eq-flat-bench` (32 × 32 at 2×) and
   the line.

Form actions are the main agent's (the contract); the mockup uses
`/plans/{id}/rename` and `/plans/{id}/delete` as placeholders. Both forms
redirect back to `/plans`, so the page works without JS.

## 4. States

| State | Trigger | What shows |
| --- | --- | --- |
| **Default** | Four plans | Four cards, newest first: Push day, Legs (the honest version), Thu 29 Oct (saved unnamed), Easy 5k |
| **Rename open** | Tap Rename | Rename turns to Cancel; the box with the field holding the current name |
| **Rename errors, pending** | Long name; no connection; slow | `.error` under the field, `aria-invalid`; "That didn't save. Try again." with the text kept; "Save name" disabled with its label |
| **Delete asks once more** | Tap Delete | Delete turns to Keep it; the box names the plan |
| **After a change** | Rename then delete succeeded | The bubble for the delete; the renamed card shows "Pull day"; the deleted card is gone |
| **Empty** | No plans | `h1` and the empty card only |
| **Signed out** | No user | 303 to `/signin?next=/plans` |
| **Not yours / gone** | Rename or delete another's plan, or a deleted one | 404 (LB-0.4) |
| **Narrow / wide** | 390 / 1280 | At 390 a plan's set count sits right with its boxes under it, a two-line name wraps, and an open confirm fills the card's width. Rename and Delete stay side by side |

## 5. Departures

- **No primary button on the page.** System 8 asks for one primary per
  screen, at most; this page has none, because making a plan happens on the
  summary (D9).
- **The confirm pattern on Paper.** The room draws `.confirm-box` on Night;
  here it is `--paper` with an ink border. Same markup and behaviour.
- **A delete button that isn't red.** Red is only for slacking and errors
  (system 5); the ask-again step carries the weight instead.

## Layout changes

None. `.button.quiet` and the `.confirm` rules are copied from the room's
page block; if a third page needs them, move them to `Layout.astro`.

## Open questions (behaviour the criteria don't decide)

All settled by the user on 4 Nov, taking the recommendations:

1. **Confirmation after a rename**: none. The card's new name is the
   confirmation, as drawn.
2. **Where a renamed plan sorts**: by creation, so a rename doesn't move
   the card, as drawn.
3. **Deleting a plan loaded in an open workout** (LB-3.9): no extra
   warning, as drawn; the sheet just drops it.
4. **D29: no plan count on the page.** The lede's "{n} of 20" is dropped;
   the 20-plan limit is mentioned only by its refusal ("That's 20 plans.
   Delete one to make room.", LB-3.6).
