# Acceptance criteria: the logbook refactor

- **Area**: Workout logging (`docs/product/spec-4-weeks.md`, LOG-1 to LOG-9),
  where it meets the gym's sheet (GYM-9 to GYM-12) and the personal-best flex
  (GYM-17)
- **Requirements covered**: seven new requirements, **LB-1 to LB-7**,
  proposed for the spec (see "Spec changes this needs"). None is in the spec
  yet. All seven are **P1**, built in this order and cut from the end if time
  runs short (D1, with LB-7 added after LB-3 on 5 Nov): LB-1; LB-2 types and
  RPE; LB-4; LB-6; LB-5; LB-2 notes; LB-3; LB-7.
  - **LB-1** Last time, in full
  - **LB-2** Set types, RPE and notes
  - **LB-3** Plans (templates)
  - **LB-4** Personal records
  - **LB-5** An exercise's progress page
  - **LB-6** Weekly stats on history
  - **LB-7** An exercise's animation in the logbook (added 5 Nov)
- **Status**: agreed (every open question settled)
- **Date**: 4 Nov 2026 (drafted and settled the same day; D23 to D30, found
  during the build, added the same day; D31 to D35 added 4 and 5 Nov; LB-7
  drafted and settled 5 Nov, D36 to D43; LB-4.13 superseded 5 Nov by
  `room-feel.md` F15, and D18 updated; see Decisions; submission is 9 Nov)

## The request

The user, 4 Nov: workout logging is too rough for a fitness app; refactor it
with six additions. The user chose to keep **one set at a time**: the sheet's
Done, then rest, then Start set rhythm stays, because it drives the avatar
states (Lifting, Resting, Slacking) everyone in the room sees. This is **not**
a Strong or Hevy table of sets with tick boxes.

The user, 5 Nov (translated), on the same branch: "In history, can each
exercise's name get an animation of that exercise being done, to make it
clearer and more fun?" Already decided by the user: it is the person's own
avatar on the exercise's machine, exactly as the gym draws them (no new
art); on history, the summary and the exercise page; always animating at the
gym's rhythm, and still under reduced motion. That is LB-7.

## Terms

Used with these meanings throughout.

- **Sheet**: your own panel on the gym page (room spec 3.3). Its one main
  button, in the **dock**, follows your state: **Choose** while Idle, **Done**
  while Lifting, **Start set** while a rest runs (Resting, Rest up, Slacking),
  **Save** while editing a set.
- **Open workout**: the person's workout in this room that hasn't finished.
  **Finished workout**: one with an end time. Only the open workout's sets can
  be changed (LOG-8, ADR 0006).
- **Set type**: **Normal**, **Warm-up** or **Failure**. A set logged before
  this change has no stored type and reads as Normal everywhere.
- **Working set**: a Normal or Failure set. Warm-ups are not working sets.
- **RPE**: rate of perceived exertion, how hard the set felt, 1 (nothing) to
  10 (nothing left). Optional on every set.
- **Exercise note**: one short free-text note per exercise per workout
  ("seat on 4", "left shoulder grumpy") (D4).
- **Previous session** of an exercise: the person's most recent workout,
  other than their open workout in this room, that has at least one set of
  that exercise. "Most recent" is by the time its newest set of that exercise
  was logged.
- **Record**: a set that beats the person's best so far on that exercise for
  one of the **record types** below (LB-4). **e1RM** is the estimated one-rep
  max worked out from a set (LB-4.5).

  | Kind (ADR 0002) | Record types (D17) |
  | --- | --- |
  | weight | **Heaviest** (weight), **Best e1RM**, **Most reps** |
  | bodyweight | **Most reps**, **Heaviest added** (added weight, sets with more than 0 kg added) |
  | duration | **Longest hold** |
  | cardio | **Longest distance**, **Longest time** |

- **Plan**: what the user called a template; on screen it is always "Plan"
  (D13). A name and
  an ordered list of exercises, each with a number of **planned sets**. It
  belongs to one person. A plan is **loaded** into an open workout from the
  sheet. Its **done count** for an exercise is the working sets of that
  exercise in the open workout. **Up next** is the first exercise, in plan
  order, whose done count is below its planned sets.
- **Week**: Monday 00:00 up to the next Monday 00:00 in the server's time
  zone, which is set to Australia/Sydney (D21), as history's week groups
  already are.
- **Streak**: a run of consecutive weeks each holding at least one workout
  (LB-6.5).
- **Within a second**: as GYM-13.
- **Exercise art** (LB-7): the person's avatar on an exercise's machine,
  playing that machine's two-frame exercise animation, exactly as the gym
  draws someone Lifting there (animations.md GYM-10.1 to GYM-10.15). **Frame
  1** is the still frame (animations.md, Terms).

## Scope

**In**

- LB-1: the sheet shows every set of the chosen exercise from its previous
  session, with types, RPE and the note.
- LB-2: set types (Normal, Warm-up, Failure), an optional RPE, and an exercise
  note, entered in the sheet and shown wherever sets are written.
- LB-3: plans made from a finished workout, kept on their own page, loaded in
  the room's sheet and worked through in order, without the plan ever choosing
  an exercise for you.
- LB-4: records per exercise and kind, worked out from stored sets and marked
  in the sheet, the summary, history and the progress page.
- LB-5: a page per exercise with every past set and a line chart.
- LB-6: this week's workouts, volume (and distance) and a streak, at the top
  of history.
- LB-7: exercise art beside each exercise's name in the set table on history
  and the summary, and in the exercise page's head.
- What every refusal looks like, and what the server logs (OPS-1, OPS-2).

**Out, with the reason**

- **A table of sets with tick boxes** (Strong, Hevy). The user ruled it out:
  one set at a time drives the avatar.
- **More exercises, custom exercises, units other than kg.** The spec's "Out"
  table, not reopened.
- **The flex animation for a new heaviest weight (GYM-17)**, left out
  of this work (D18). LB-4 leaves the data it needs in place. *(Built
  since, 5 Nov 2026, in `room-feel.md`: any record triggers it, F14.)*
- **Drop sets, supersets, rest-pause and other set types.** Three types cover
  what a squad logs; each new type is one more value later.
- **A plan builder from scratch, and target weights or reps in a plan**
  (D9, D12). Plans are made from a finished workout.
- **Sharing plans, records, stats or notes with anyone else**, the squad
  included. Everything in this file is private to its owner (ADR 0006). The
  room sees nothing new. *(One exception since 5 Nov 2026: the room is told
  that someone set a record, by name and exercise, without numbers;
  `room-feel.md` F15, superseding LB-4.13.)*
- **Anything this file adds changing an avatar, a state, a rest, Slacking or
  a station**, except the one place a plan lets you choose an exercise in one
  tap, which is exactly a Choose (GYM-4).
- **Editing a finished workout.** It stays a record (ADR 0006): its types,
  RPE and notes are fixed once it ends, like its sets.
- **A workout-level note, body weight, plate calculator, rest per set type.**
  Richer versions, named in the decisions where they apply.
- **Leaderboards, streak warnings, "don't break your streak" nudges.** Ruled
  out by system.md section 14.
- **LB-7: new drawings.** One animation per machine, as the gym has
  (animations.md "Out": one per machine, not per exercise). So Bench press and
  Incline bench press look the same, Plank shows the push-up, Overhead press
  the squat, Hanging leg raise the pull-up, Lateral raise the curl, and
  Incline walk the run. Accepted, as it was for the gym.
- **LB-7 elsewhere** (D41): the room's "This workout" table and
  Last time in the sheet (the gym map already shows the person on the
  machine, and the sheet is the Anchor's), home's Last workout card, and the
  plan previews on the summary and `/plans`.
- **LB-7: the art showing what was logged.** It shows the exercise, never the
  weight, reps, type or a record, and it is the same for everyone whatever
  they lift (animations.md GYM-10.25).

**What this makes harder later** (the vision: strangers who train together)

- **Records and streaks are private.** A Shy Regular's profile might one day
  want to show "squats 100 kg" or "trained 6 weeks running". Nothing here
  stores who may see them; showing them to anyone would be a new, opt-in
  decision, and to strangers it reads as comparison (Eagle et al. 2024: being
  watched by strangers can make people anxious).
- **GYM-17 would broadcast a record to the room.** Between friends that's a
  flex; between strangers it's a leaderboard moment. If it comes, it should be
  a per-person setting, like INT-7 for slaps. *(It came on 5 Nov 2026,
  public and with no setting while rooms are friends-only: `room-feel.md`
  F15. The setting is still owed before public rooms.)*
- **Notes are stored free text.** They are only ever shown to their writer.
  If plans with notes are shared later, or notes shown to a room, they need
  the same escaping and, with strangers, reporting as INT-6.
- **Plans are owned by one person and referenced, not copied, by the workout
  that loads them** (LB-3.22). Sharing a plan with the squad (a natural
  social feature) would need a copy step.
- **LB-7 draws your look as it is today, not as it was** (D39). Nothing
  about a past look is kept. If logbooks or a profile were ever shown to
  others, "you on the squat rack" is a natural Shy Regular introduction
  ("the person who's always on the squat rack"); it would show their current
  look, which is what they'd want.

**Existing behaviour this changes or exposes**

- **The sheet's "Last time"** shows one set today (`lastSet` in
  `src/lib/workouts.ts`) and is hidden while resting after a set of the same
  exercise (`showLast` in `src/pages/rooms/[id].astro`). LB-1 shows a list,
  and shows it during that rest too (D3).
- **The check in `spec/logging.test.ts`** matches `Last time <b>3.2 km ·
  18:05` for the old single line. A list may change that markup. It is a
  course check, so changing it is the user's call through `qa`, not the
  build's (CLAUDE.md, "Don't edit the tests to make them pass").
  `spec/core-loop.test.ts`'s pre-fill check is unchanged (D2).
- **`setLabel` writes every set on every page.** RPE joins it (LB-2.16); a set
  with no RPE reads exactly as today, so every existing check that looks for
  `62.5 kg × 7` still matches.
- **History and the summary share one set table** (`WorkoutSets.astro`). It
  gains set-type and record marks, notes, and links on exercise names. Its
  "Best" line (`bestLabel`, the best set **in that workout**) stays, and is
  not a record (all-time). The two words must not be confused (LB-4.10).
- **The summary gains "Save as plan" and a count of records**; history gains
  the weekly stats above its weeks.
- **The spec's "Out" table lists "warm-up sets, personal records"** as cut.
  This request brings both in (D1).
- **The server's time zone** is UTC on Fly unless `TZ` is set (history spec,
  open question 1). Every calendar figure already depends on it; the week
  boundary and streak make it visible. It is set to Australia/Sydney (D21),
  which also settles history's open question and moves "Today" and every
  day label on every page to Sydney time.
- **LB-7: the exercise page's head** shows the machine's idle drawing today
  (`MachineArt` with `part="idle"`); it becomes the exercise art. The frame
  swap and its reduced-motion rule live only in the gym map's styles today
  (`GymMap.astro`, scoped to the map), so Paper pages don't animate the two
  frames yet. History can hold dozens of exercise groups, so the cost of
  many animations on one page is new (LB-7.12).

**Pages this touches** (for the designer, CLAUDE.md "Designing pages"): the
room's sheet (Gym group); history and the summary (Logbook group); two new
pages, the exercise page and the plans page, which join the Logbook group
(D10). LB-7 adds something to history, the summary and the exercise page,
so it goes to the Logbook group's designer first.

**Spec changes this needs** (not made here; the main agent proposes them to
the user): LB-1 to LB-7 added under "Workout logging" (or numbered LOG-10 to
LOG-16), as P1 in D1's order with LB-7 last; LOG-3's pre-fill sentence kept (D2);
"warm-up sets, personal records" removed from the "Out" table; the Data
model (a set's type, RPE; exercise notes; plans; a workout's loaded plan);
the Screens table (`/plans`, `/exercises/:id`, the history stats, the
summary's "Save as plan").

## Criteria

Each criterion says how it can be checked: **HTTP** (a request against the
running app), **browser** (needs the page's script, Playwright) or
**judged** (a person has to look). Names follow system.md section 13. Unless
stated, Mia is signed in, a member of an open room, and has an open workout
there.

### Across all six

**LB-0.1** Given Mia touches none of the new controls (type, RPE, note, plan),
when she logs a set, then it is still two taps, **Start set** then **Done**,
with both in the same place, size and label as before this change; none of
the new controls opens over, moves, resizes or disables the dock's button,
and none needs to be dismissed first. This holds on a laptop as on a phone:
the room's sheet is never taller than the screen, scrolls inside itself, and
keeps the dock at its visible foot, so nothing the sheet gains (Last time, a
plan, the type, the RPE, a note) moves the dock's button or pushes it off
screen (D34). *browser* (the dock button's box is the same with and without
a plan loaded, and is inside the viewport, at 390 px and 1280 px) and
*judged* (the Anchor logs a real session and calls it no slower)

**LB-0.2** Given anything in this file is used (a type, an RPE, a note, a
record, a plan loaded or cleared), then nobody's state, rest timer, slacking
time, station or avatar changes because of it, and no event goes to the
room, with one exception: choosing an exercise from a loaded plan (LB-3.16),
which is a Choose and does exactly what Choose does today. *HTTP* (another
member's event stream receives nothing for a type, an RPE, a note or a plan
load)

**LB-0.3** Given sets and workouts logged before this change, then every page
that shows them (the sheet, This workout, the summary, history, home, the
exercise page) writes them exactly as it did before: no type marker, no RPE,
no note, the same figures for Sets, Volume, Distance and Best. *HTTP*

**LB-0.4** Given a request about another person's set, workout, plan or
note, or about a room the sender isn't a member of, then the server refuses
it with the same 404 as for something that doesn't exist, stores nothing, and
logs the refusal (ADR 0006). Hiding a control is never the protection.
*HTTP*

**LB-0.5** Given any action this file adds, then the server log has one line
for it with the person's id and display name. A set's line also has its type
and RPE. A note or a plan name is logged by its length only, never its text.
Refusals are logged with their reason. No line holds a password, token,
passcode or full email (OPS-1, OPS-2). *judged* (read the log by hand)

**LB-0.6** Given any new control or mark, then it can be reached and used by
keyboard with a visible focus ring, has an accessible name that says what it
is ("Set type: warm-up", "RPE 8", "New record: heaviest"), and never relies
on colour alone (system.md section 12). *browser*

**LB-0.7** Given any new form (a note's save, Save as plan, a plan's rename
or delete, loading a plan), when it is waiting on a slow connection, then its
button is disabled with its label kept; when it fails (no connection, server
error), the person sees "That didn't save. Try again." beside it, and nothing
they typed is cleared (system.md section 13). *browser*

**LB-0.8** Given the showcase (twelve people, nobody lifting), when people
log made-up sets, then every LB feature can be shown: Last time after a
second workout, types and RPE on the first set, a record on the second
working set of an exercise (D16), a plan from a finished two-set workout, the
exercise page and the weekly stats. *judged* (at the rehearsal)

### LB-1: Last time, in full

> When an exercise is chosen, the sheet shows every set of that exercise from
> its previous session, not just the last set.

**LB-1.1** Given Mia's previous session of Bench press was on Tue 27 Oct with
three sets, 60 kg × 8, 62.5 kg × 8 and 62.5 kg × 7, when she chooses Bench
press, then her sheet shows "Last time", the day of that session as history
writes it ("Tue 27 Oct", "Yesterday", "Today"), and all three sets in the
order she logged them, each written as history writes it (`setLabel`).
*HTTP* (the room page's HTML holds all three)

**LB-1.2** Given previous sessions of other kinds, then each set is written
for its kind: "BW × 12", "BW + 10 kg × 6", "1:30", "5 km · 25:00 · 5:00 /km".
*HTTP*

**LB-1.3** Given Mia did Bench press on Tuesday (three sets) and Thursday (two
sets), then Last time shows Thursday's two sets only; sets from older
workouts never mix in. Given she has already logged two bench sets in her
open workout, then Last time still shows Thursday: today's sets are in This
workout, never in Last time. *HTTP*

**LB-1.4** Given the previous session's sets carry types, RPE and an exercise
note, then Last time shows them: a warm-up marked as a warm-up, a failure set
marked as failure, the RPE with its set, and the note (D4). Sets
with none of these show as today. *HTTP*

**LB-1.5** Given Mia has never logged a set of the exercise, then the sheet
says "First time on this one. Ease into it.", as today. *HTTP*

**LB-1.6** Given an exercise is chosen, then Last time shows while Mia is
Lifting **and** while a rest runs (Resting, Rest up, Slacking), including a
rest after a set of the same exercise (D3). It doesn't show while
she is editing a set, or while Idle with no exercise chosen. *HTTP*

**LB-1.7** Given Last time shows and Mia is about to do working set *n* of
the exercise (counting her working sets in this workout, plus one), then
last time's working set *n* is marked as the one to match, so she can tell
at a glance; warm-ups are neither counted nor marked. Given she has already
done more working sets than last time had, then no set is marked (D3, D8).
*HTTP*

**LB-1.8** Given Mia chooses a weight or bodyweight exercise, then its fields
pre-fill exactly as today: from her newest set of that exercise anywhere
(in this workout, the set she just did; otherwise the last set of the
previous session). Duration and cardio fields start empty, as today. The set
type always starts as Normal and the RPE empty (LB-2.4, LB-2.14) (D2).
*HTTP* (the existing `spec/core-loop.test.ts` check stays green)

**LB-1.9** Given a previous session with many sets (for example twelve),
then every one is shown, none hidden, and the list never covers or moves the
dock's button. *browser*

**LB-1.10** Given the previous session was in a room that has since closed,
or in another room, then it is used all the same: rooms don't matter, only
the person's own workouts. *HTTP*

**LB-1.11** Given Mia's Last time is on her sheet, then nobody else in the
room can see it: it is in no other member's page, no event on the stream and
no squad-list row. *HTTP* — With strangers: unchanged, it is never shown to
anyone else.

**LB-1.12** Given an Anchor between sets, then the Last time list can be read
in a glance at arm's length and says which set to match without reading
every line. *judged*

### LB-2: Set types, RPE and notes

> A set can be marked warm-up or failure (normal by default) and can carry an
> RPE from 1 to 10. A person can write a short note for an exercise.

#### Set types

**LB-2.1** Given an exercise is chosen and Mia is Lifting, or a rest is
running, then the set form offers the set type, Normal, Warm-up or Failure,
with Normal selected. Given she taps Done without touching it, then the set
is stored as Normal. *HTTP* (a set posted with no type is stored as Normal)

**LB-2.2** Given Mia selects Warm-up, when she taps Done, then the set is
stored as a warm-up and is marked as one wherever the set is written: the
"Set logged" stamp, This workout, Last time, the summary, history and the
exercise page. *HTTP*

**LB-2.3** Given Mia selects Failure, when she taps Done, then the set is
stored as a failure set and marked the same way. *HTTP*

**LB-2.4** Given Mia logged a warm-up, then the form for her next set starts
at Normal again; nothing carries over (D7). *HTTP*

**LB-2.5** Given Mia selects Warm-up during a rest, when she taps Start set,
then the Lifting form still shows Warm-up (Start set echoes the form as it
does weight and reps, and stores nothing); Done then stores it. *HTTP*

**LB-2.6** Given a set in Mia's open workout, when she edits it (LOG-8), then
she can change its type, and the change shows everywhere at once. A set in a
finished workout can't be changed. *HTTP*

**LB-2.7** Given a request with a type other than the three, then the server
refuses it, stores nothing, and Mia stays Lifting with her fields as she left
them. *HTTP*

**LB-2.8** Given any of the four kinds (weight, bodyweight, duration,
cardio), then all three types are offered and accepted (a warm-up jog, a
plank held to failure). *HTTP*

**LB-2.9** Given a Failure set, then it counts everywhere exactly as a Normal
set does (sets, volume, records, plans, the chart); the type is only a mark.
*HTTP*

**LB-2.10** Given a Warm-up set, then it counts in the workout's **Sets** and
**Volume** (and the week's volume, LB-6) (D5); it never sets a
record or counts as the best to beat (LB-4.4), never counts toward a plan's
done count (LB-3.15), and is never plotted (LB-5.3). Nor is it an
exercise's "Best" line for a workout (history, the summary, home's Last
workout card, the exercise page's sessions): Best is chosen from the working
sets only, unless the exercise has only warm-ups in that workout, when it is
chosen from those. Given 100 kg × 5 working sets and a 102.5 kg × 1 warm-up,
Best reads "100 kg × 5" (D31). *HTTP*

**LB-2.11** Given the sheet numbers sets ("Set 3", and the stamp "Set 3
logged: 62.5 kg × 8"), then only working sets are numbered: a warm-up is
called "Warm-up" ("Warm-up logged: 40 kg × 10"), and the next working set
keeps its number. Sets from before this change are all numbered, as today
(D8). *HTTP*

**LB-2.12** Given a set of any type, then its rest after Done follows LOG-4
unchanged, it turns Slacking at 30 s over unchanged (GYM-11), and the avatar
does exactly what it does after any set. *HTTP*

#### RPE

**LB-2.13** Given an exercise is chosen, then the set form offers an
optional RPE. It is empty for every new set and never pre-filled. Done
without one stores no RPE. A set of any type may carry one, a warm-up
included (D35). *HTTP*

**LB-2.14** Given Mia enters an RPE, then the server accepts 1 to 10 in steps
of 0.5 (1, 1.5, … 9.5, 10) (D6). Given 0, 0.5, 10.5, 7.3 or
something that isn't a number, then the set is not logged; the error "RPE is
1 to 10." appears under the field, her fields keep what she typed, and she
stays Lifting, as for any other field error today (LOG-3). *HTTP*

**LB-2.15** Given Mia enters an RPE during a rest, when she taps Start set,
then it is echoed into the Lifting form and stored by Done, as LB-2.5. *HTTP*

**LB-2.16** Given a set has an RPE, then wherever the set is written it shows
with it in lifter's shorthand, for example "100 kg × 5 @ 8", and is read to a
screen reader as "RPE 8". The RPE comes after the whole set, a run's pace
included: "5 km · 25:00 · 5:00 /km @ 8" (D33). A set with no RPE is written
exactly as today. The one exception is an exercise's "Best" line, which sums up the group
rather than writing a set: it never shows RPE ("Best 100 kg × 5", not
"Best 100 kg × 5 @ 8") (D31). *HTTP*

**LB-2.17** Given a set in Mia's open workout, when she edits it, then she
can add, change or clear its RPE. *HTTP*

**LB-2.18** Given any of the four kinds, then RPE is offered and accepted.
*HTTP*

#### Exercise notes (D4)

**LB-2.19** Given Mia has logged at least one set of the chosen exercise in
her open workout, then the sheet offers a note for that exercise in this
workout. Before her first set of it, it doesn't, so the Lifting screen before
a first set is as lean as today. *HTTP*

**LB-2.20** Given Mia types a note, then it is kept when she taps the note's
own save, or Start set, or Done, whichever comes first. Given she leaves the
page or changes exercise without any of those, then the unsaved text is
dropped. *HTTP* (a note posted with Start set or Done is stored)

**LB-2.21** Given a note, then it holds up to 140 characters after trimming
spaces from its ends. The field takes no more. Given a request with a longer
one on its own save, then it is refused with "Notes are up to 140
characters." and the text kept. Given a longer one arrives with Done, then
the set is still logged (a note never stops a set) and the note is refused
with the same message beside it, its text kept. *HTTP*

**LB-2.22** Given Mia saves an empty note (or only spaces), then the
exercise's note for this workout is removed. *HTTP*

**LB-2.23** Given an exercise has a note in a workout, then the note shows
with that exercise in This workout, the summary, history, the exercise page,
and Last time the next time she chooses the exercise (LB-1.4). *HTTP*

**LB-2.24** Given a note holds `<b>hi</b>` or an emoji, then it is shown as
the text typed, never as HTML. *HTTP*

**LB-2.25** Given a note, then only its writer ever sees it: not in the room
log, the squad list, the map or any event on the room's stream; the server
log records its length, never its text. *HTTP* and *judged* (the log) —
With strangers: unchanged, notes stay private.

**LB-2.26** Given the workout has finished, then its notes can't be changed.
*HTTP*

**LB-2.27** Given Mia saves notes on the same exercise from two tabs, then
the later save is the note. *HTTP*

### LB-3: Plans

> Save a plan (for example "Push day": bench press 4 sets, incline bench 3
> sets) and load it in the room, then work through it in order.

#### Making a plan (D9, D12)

**LB-3.1** Given Mia's summary of a finished workout, then she sees "Save as
plan" with an optional name field. When she saves, then a plan is created
with that name, or, if she left it blank, the workout's date as a name ("Tue
27 Oct"), and the summary confirms it in place: "Saved as {name}. Load it
from the sheet next time 📋" ("Saved as Push day. Load it from the sheet
next time 📋") (D30). *HTTP* and *browser*

**LB-3.2** Given the workout was Bench press (two warm-ups, four working
sets), Incline bench press (three) and Lateral raise (three), then the plan
holds the exercises in the order first done (as the set table shows them),
each with planned sets equal to its working sets: Bench press 4, Incline
bench press 3, Lateral raise 3. Planned sets are capped at 10. An exercise
with only warm-ups is left out. Given every set in the workout was a warm-up,
then the save is refused with "Only warm-ups in this one. Nothing to plan
yet." *HTTP*

**LB-3.3** Given a workout logged before this change, then it can be saved
as a plan, every set counting as a working set. *HTTP*

**LB-3.4** Given Mia already saved this workout as a plan, then the summary
says "Saved as Push day" (linking to her plans) instead of offering it
again, and a second save (a double tap, a second tab, a replayed request)
creates no second plan. Given that plan has since been deleted, then "Save
as plan" is offered again. *HTTP*

**LB-3.5** Given a name, then it is 1 to 30 characters after trimming, shown
as text, never HTML. Longer is refused with "Names are up to 30
characters." Two plans may share a name. *HTTP*

**LB-3.6** Given Mia has 20 plans, when she saves another, then it is
refused with "That's 20 plans. Delete one to make room." This refusal is
the only place the limit is mentioned (D29). *HTTP*

**LB-3.7** Given an open workout, or someone else's workout, then there is
no Save as plan, and a request to save one is refused (404 for someone
else's, as LB-0.4). *HTTP*

#### The plans page (D10)

**LB-3.8** Given Mia opens `/plans`, then she sees her plans, newest first
by when each was made, each with its name and its exercises with planned
sets ("Bench press · 4 sets"). The page shows no count of plans against the
limit (no "n of 20") (D29). Given she has none, then the page says how to
get one ("Finish a workout, then save it as a plan from its summary") and
nothing else. *HTTP*

**LB-3.9** Given a plan on the page, then Mia can rename it (LB-3.5's rules)
and delete it. A rename takes effect with no extra confirmation and doesn't
move the plan: plans stay in the order they were made (D28). Delete asks
once more before it acts, as deleting a set does (LOG-8). Deleting a plan
that is loaded in an open workout gives no warning beyond that same ask;
it removes the plan from that sheet, and no set changes (D28). *HTTP*

**LB-3.10** Given someone signed out opens `/plans`, then they are sent to
sign in and brought back (`/signin?next=/plans`). Given a request to rename,
delete or load another person's plan, then 404 (LB-0.4). *HTTP*

**LB-3.11** Given Mia is on home or a summary, then `/plans` is one tap (or
one Enter) away. *browser*

#### Loading and working through a plan (D11)

**LB-3.12** Given Mia has at least one plan and her sheet is Idle, or has an
exercise chosen and isn't editing, then she can load one of her plans from
the sheet. Given she has no plans, then the sheet shows no plan control at
all. *HTTP*

**LB-3.13** Given Mia loads a plan, then it is attached to her open workout
in this room and her sheet shows it: each exercise with its done count
against its planned sets ("Bench press 2 of 4"), and **Up next** marked.
Loading chooses no exercise, claims no station, changes no state, triggers
no delivery and sends nothing to the room; her avatar stays where it was.
*HTTP* (no station changes; another member's stream receives nothing)
- While Mia is on a lift that is in the loaded plan, the lift row numbers
  her next working set against the plan: "Set 3 of 4", and past the plan
  "Set 5 of 4". On a lift that isn't in the plan, it reads "Set 3" as
  without a plan (D35).
- While she is on a lift that isn't in the plan, the plan is shown folded.
  Whether the plan shows open or folded is decided by the server on every
  render; a fold or unfold she made by hand doesn't carry over to the next
  render (D35).

**LB-3.14** Given Mia loaded a plan while Idle, then the exercise picker has
Up next already selected, so the dock's **Choose** takes it in one tap,
claiming a station by GYM-4 as any Choose does. She can still pick any other
exercise instead. *HTTP*

**LB-3.15** Given a loaded plan, then an exercise's done count is the working
sets of that exercise in the open workout, **including those logged before
the plan was loaded**; warm-ups don't count. Sets beyond the plan show as
such ("5 of 4"). Exercises not in the plan can be done freely and change no
count. *HTTP*

**LB-3.16** Given a loaded plan, then each of its exercises can be chosen
from the plan in the sheet in one tap, and that tap is exactly a Choose
(the same as picking it under Change today): it releases her station,
claims one by GYM-4, and may trigger a delivery (GYM-6), which never blocks
logging (GYM-7). During a rest, the state stays Resting or Slacking, and
the dock's Start set then starts the newly chosen exercise. *HTTP*

**LB-3.17** Given Mia logs the last planned set of Bench press, then her rest
runs as after any set, the dock stays **Start set** for Bench press (an extra
set is still one tap), and Up next now points at the next exercise, ready to
be chosen in one tap (LB-3.16). *HTTP*

**LB-3.18** Given a loaded plan, then nothing in it ever acts by itself: no
exercise is chosen, no station claimed, no set logged, no rest changed, and
the workout is never finished for her. *HTTP*

**LB-3.19** Given Mia did a plan's exercises out of order, then each counts
where it belongs, and Up next is still the first exercise in plan order
that isn't done. *HTTP*

**LB-3.20** Given every exercise in the plan has reached its planned sets,
then the sheet says the plan is done (designer's words, in the copy bank's
voice), shows no Up next, and nothing else happens. *HTTP*

**LB-3.21** Given a plan is loaded, when Mia loads another, then it replaces
the first; when she clears it, then the sheet shows no plan. Her sets are
untouched either way, and neither asks for confirmation (D35). Given she
clears it while Idle with Up next preselected, then the picker drops the
preselection and selects nothing (D35). Given she does either in one tab,
then her other tab shows the change at the latest when it next loads.
*HTTP*

**LB-3.22** Given a loaded plan is renamed or deleted on `/plans`, then the
sheet shows it as it is now (renamed, or gone) the next time it loads; the
workout refers to the plan rather than keeping a copy. *HTTP*

**LB-3.23** Given a loaded plan, when Mia reloads, opens the room on another
device, or the server restarts, then the plan is still loaded with the same
counts (it is stored with the workout, GYM-12). *HTTP*

**LB-3.24** Given Mia finishes the workout, leaves the room, or the room
closes, then the plan is no longer loaded; her next workout starts without
one. Given she loads a plan after finishing and staying in the room, then it
attaches to her next workout there, and she stays Finished until she chooses
an exercise. *HTTP*

**LB-3.25** Given a plan is loaded, then nobody else in the room can tell:
no map, squad list, room log or stream change. *HTTP* — With strangers:
unchanged.

**LB-3.26** Given an Anchor works through a four-exercise plan for real,
then moving between exercises takes fewer taps than without a plan, and no
set takes more. *judged*

### LB-4: Personal records

> Per exercise, the person's records: heaviest weight, estimated one-rep max
> and most reps in a set for weight lifts, and the equivalents for bodyweight
> lifts, holds and cardio. A set that breaks one is marked in the sheet, the
> summary and history.

**LB-4.1** Given a working set, then it is a record for a record type (the
table in Terms) when it has the fields that type measures and its value is
**strictly greater** than that of every earlier working set of the same
exercise by the same person, in all her workouts, earlier in this one
included, in the order logged (D15). *HTTP*

**LB-4.2** Given Mia's best bench was 100 kg × 5, when she logs 100 kg × 5
again, then it is not a record (equal isn't better). When she logs 100 kg × 6,
then it is a record for Most reps and Best e1RM, not Heaviest. *HTTP*

**LB-4.3** Given Mia's first ever working set of an exercise, then it is not
marked as a record: there is nothing yet to beat. Her second working set can
be (D16). *HTTP*

**LB-4.4** Given a warm-up, then it is never a record and never counts as the
best to beat. Given Mia's best is 100 kg × 5 and she logs a warm-up of
102.5 kg × 1, then it isn't marked; her next working set of 101 kg × 1 is a
Heaviest record. *HTTP*

**LB-4.5** Given a weight set of *w* kg × *r* reps, then its e1RM is *w* when
*r* is 1, *w* × (1 + *r* / 30) when *r* is 2 to 10, and there is none when
*r* is 11 or more; it is rounded to 0.1 kg, and records compare the rounded
values. 100 kg × 5 gives 116.7 kg; 100 kg × 1 gives 100 kg; 60 kg × 12 gives
none (D14). *HTTP*

**LB-4.6** Given a bodyweight set, then Most reps counts its reps whatever
the added weight, and Heaviest added counts only sets with more than 0 kg
added; a bodyweight lift with nothing added never sets Heaviest added.
Given Mia's earlier working pull-ups all had nothing added, when she logs
her first working set with weight added (BW + 5 kg × 6), then it is **not**
a Heaviest added record: it is the first set to measure that type, so there
is nothing yet to beat, as LB-4.3. Her next working set with more than 5 kg
added is (D23). *HTTP*

**LB-4.7** Given a set lacks the field a record type measures (for example a
run logged as weight × reps before ADR 0002), then it is left out of that
type: never a record for it and never the bar for it. *HTTP*

**LB-4.8** Given sets from before this change, then they count as working
sets, both as the bar to beat and as records, so history may show record
marks on old workouts the first time it loads after this change. *HTTP*

**LB-4.9** Given Mia edits or deletes a set in her open workout (LOG-8),
then the marks are worked out again from what is stored: a set edited down
loses its mark, a later set it no longer blocks may gain one. Nothing about
records lives only in memory; after a restart every mark is the same
(GYM-12). *HTTP*

**LB-4.10** Given a set is a record, then it carries a mark naming each
record it set ("New record: heaviest, best e1RM"), on the "Set logged"
stamp, in This workout, the summary, history, Last time and the exercise
page. The mark is a word as well as any icon or colour, and is never called
"Best", which history already uses for the best set of one workout. *HTTP*
and *browser* (the stamp after Done announces the record to a screen reader)

**LB-4.11** Given a set was a record when it was logged and a later set beats
it, then it keeps its mark: a mark means "a record when you did it". The
current record for each type is on the exercise page (LB-5.2). *HTTP*

**LB-4.12** Given a finished workout with records, then its summary says how
many records it set ("3 new records"); given none, then the summary says
nothing about records (no "0 records"). The number counts **sets carrying a
record mark**, not record types broken, so it matches the marks on the
page: one set of 100 kg × 6 that is a record for Most reps and Best e1RM
counts as 1 (D24). *HTTP*

**LB-4.13** *Superseded on 5 Nov 2026 by `room-feel.md` F15 (the user:
"public, overturn LB-4.13"). A Done that sets a record is now a personal
best, and the room sees its moment: the flex, a room banner and a room-log
line naming the person and the exercise, without numbers or record types,
and a fanfare (`room-feel.md` GYM-17, GYM-18). No setting in this build; one
comes with public rooms. Everything else in LB-4 (the numbers, the record
types, the marks) stays private to the lifter. The original criterion is
kept below for the record; do not test it.*

> ~~Given a record is set, then nobody else in the room can tell: no
> animation, banner, room-log line, squad-list change or stream event. The
> flex (GYM-17) is not part of this work (D18). *HTTP* — With strangers: a
> broadcast record becomes a comparison; GYM-17, if built, should be a
> setting.~~

**LB-4.14** Given the copy around records, then it celebrates the person's
own progress, never compares them with anyone, and says nothing about sets
that weren't records. *judged*

### LB-5: An exercise's progress page

> Tap an exercise to see every past set of it and a line chart of how it has
> gone over time.

**LB-5.1** Given Mia is signed in, when she opens `/exercises/3` (any id of
the 16 seeded exercises), then she gets the page for that exercise. Given an
id that isn't one of the 16, or isn't a number, then 404. Given she is signed
out, then she is sent to `/signin?next=/exercises/3` and brought back.
*HTTP*

**LB-5.2** Given Mia has logged the exercise, then the page shows its name;
her current record for each of its record types, with the value and the day
it was set; and every set she has logged of it, grouped by workout, newest
workout first, each group with its day (linking to that workout's summary
when it's finished; marked Live, with no link, when it's her open workout),
its sets in order with their types, RPE and record marks, and that workout's
note for the exercise.
- The current record for a type is the best working set of that type so
  far. It is shown even when only one working set measures that type, which
  carries no record mark (LB-4.3, LB-4.6): a lone 60 kg × 8 bench shows as
  the current Heaviest, Best e1RM and Most reps (D25).
- Sets in Mia's open workout count toward the current records, as soon as
  they are logged (D26).

*HTTP*

**LB-5.3** Given the page has a chart, then it has one point per workout that
has a value to plot, oldest on the left, her open workout included once it
has a set to plot (D26), and plots, per kind (D19):
- weight: the best e1RM among that workout's working sets;
- bodyweight: the most reps in one working set;
- duration: the longest hold;
- cardio: the longest distance.

Warm-ups are never plotted. A workout with nothing to plot (only warm-ups,
or only weight sets of 11 reps or more) has no point. The axis says the unit
(kg, reps, m:ss, km). *HTTP*

**LB-5.4** Given no workout has a value to plot, then there is no chart; given
Mia has never logged the exercise, then the page says so ("No sets of Bench
press yet") and links back to history. Given exactly one point, then the
chart shows that point and says the line starts with the next session.
*HTTP*

**LB-5.5** Given the chart, then the same points (day and value) are on the
page as text, for keyboard and screen-reader users, in the chart's order,
oldest first, since it is the chart in text (D32). The chart and that text
are in the server's HTML, so the page works with no script. *HTTP*

**LB-5.6** Given another person has logged the same exercise, then nothing of
theirs is ever on Mia's page. *HTTP*

**LB-5.7** Given Mia is on history, a summary or home's Last workout card,
then every exercise name in a set table is a link to that exercise's page,
at least 44 px tall and reachable by keyboard. The room's sheet has no such
link (D20). *HTTP*

**LB-5.8** Given a long history, then the page shows the six newest
workouts with the exercise in full; older ones fold away, as history's older
weeks do, and every past set is still reachable by unfolding them (D27).
Given six or fewer, nothing folds. *HTTP*

**LB-5.9** Given a 360 px wide phone and a 1280 px laptop, then the chart
fits without scrolling sideways, and its values can be read. *browser*

**LB-5.10** Given a workout in which a working set set a record of the type
the chart plots (weight: Best e1RM; bodyweight: Most reps; duration: Longest
hold; cardio: Longest distance), then that workout's point is lit on the
chart; other points are not. Lit is never shown by colour alone, and the
text version of the points (LB-5.5) says which are records (D27). *HTTP*

### LB-6: Weekly stats on history

> At the top of history: workouts this week, total volume this week, and a
> streak of consecutive weeks trained.

**LB-6.1** Given Mia has at least one workout, when she opens `/history`,
then above her weeks she sees this week's number of workouts, this week's
volume when it is above 0, this week's distance when it is above 0 (as the
tally shows them, design spec "The tally"), and her streak when it is at
least 1. The all-time line below ("12 workouts · 8,400 kg in the book")
stays. *HTTP*

**LB-6.2** Given the week, then it runs from Monday 00:00 to the next Monday
00:00 in the server's time zone, Australia/Sydney (D21). A workout belongs to the
week it **started** in, as history already groups them, so a session from
Sunday 11:30 pm to Monday 12:40 am counts for the week that ended. *HTTP*

**LB-6.3** Given workouts this week, then one counts when it has at least one
set, including Mia's open workout once it has a set; an empty one doesn't
(history doesn't show those either). The number matches the count history
shows for "This week". Given none yet, then it says 0, plainly, with no
comment. *HTTP*

**LB-6.4** Given this week's volume, then it is the sum of the same volume
each workout's tally shows (warm-ups included, D5). *HTTP*

**LB-6.5** Given Mia's weeks, then her streak is the number of consecutive
weeks, each with at least one counted workout, ending with this week if this
week has one, and with last week if it doesn't yet (D22). So:
trained this week, last week and the week before, not the one before that:
3. Not yet this week, trained the two weeks before: 2. Trained neither this
week nor last week: 0. *HTTP*

**LB-6.6** Given the streak is 0, then no streak is shown and nothing is said
about losing one. At no point does the page warn that a streak is at risk,
count down to the week's end, or nudge her to train (system.md section 14).
*HTTP* and *judged*

**LB-6.7** Given the stats, then they are worked out from stored workouts
each time history loads: nothing is stored or counted in memory, so a
restart changes nothing, and a set deleted from the open workout changes the
figures the next time history loads. *HTTP*

**LB-6.8** Given Mia has no workouts, then history shows its empty state
exactly as today and no stats. *HTTP*

**LB-6.9** Given the stats, then they are only ever on Mia's own history.
*HTTP* — With strangers: a streak shown to others is pressure; it stays
private.

**LB-6.10** Given a Drifter who trained once this week after a month off,
then the stats read as a mate's pat on the back ("1 workout this week, 1
week streak"), never as a telling-off. *judged*

### LB-7: An exercise's animation in the logbook

> Beside each exercise's name in the logbook, the person's own avatar does
> that exercise on its machine, as the gym shows them.

Unless stated, Mia has finished workouts with Bench press, Back squat,
Pull-up and Run in them. Her look is a ponytail, pink hair, the second skin
tone and a white shirt.

**LB-7.1** Given Mia opens `/history`, then in every workout's set table,
the live one included, each exercise's row header shows exercise art for that
exercise beside its name, with one piece of art per exercise group, however
many sets the group has. *HTTP* (each group's row header holds her avatar in
that machine's pose, with the machine's back and front layers)

**LB-7.2** Given Mia opens a workout's summary, then its "Every set" table
shows the same art in the same place as history (they share the table).
*HTTP*

**LB-7.3** Given Mia opens an exercise page (`/exercises/<id>`), then its
head shows the exercise art for that exercise where the machine's idle
drawing is today. The same holds on the page's empty state, for an exercise
she has never logged (D42). *HTTP*

**LB-7.4** Given an exercise, then its art is its machine's animation (the
equipment table in `spec-4-weeks.md`, animations.md GYM-10.3 to GYM-10.10),
so the two exercises on one machine show the same art, and the name beside
it says which exercise it is (D43):

| Machine (animation) | Exercises |
| --- | --- |
| Treadmill (running on the belt) | Run, Incline walk |
| Flat bench (bar up, bar down) | Bench press, Incline bench press |
| Squat rack (squat, stand) | Back squat, Overhead press |
| Dumbbell rack (curl up, arms down) | Dumbbell curl, Lateral raise |
| Lifting platform (bent over, standing) | Deadlift, Romanian deadlift |
| Pull-up bar (chin over, hanging) | Pull-up, Hanging leg raise |
| Cable machine (handle in, handle up) | Lat pulldown, Seated cable row |
| Exercise mat (push-up: arms straight, chest down) | Push-ups, Plank |

*HTTP* (the pose matches the exercise's equipment) and *judged*

**LB-7.5** Given the art, then it is drawn exactly as the gym draws someone
Lifting on that machine: the same two frames, the machine's parts in front
of and behind the person as on the map, and her skin, hair style, hair
colour and shirt as she chose them (animations.md GYM-10.11 to GYM-10.14).
No name tag, state colour or station number goes with it. *judged* (beside
the gym at the same moment)

**LB-7.6** Given Mia changed her look after a workout, then that workout's
art shows her look **as it is now**, the next time the page loads; no past
look is kept or shown (D39). Given an account from before avatars,
then the art uses the look the gym already rolled and kept for it. *HTTP*

**LB-7.7** Given workouts logged before this change, including sets from
before the four kinds (ADR 0002), then their exercises get art exactly as
new ones do: the art goes by the exercise, never by what a set records, so
none of the 16 exercises is ever shown without it. *HTTP*

**LB-7.8** Given the art, then it is decorative: hidden from screen readers,
not focusable, and with no text of its own. The exercise's name stays the
text and the link, and its accessible name is unchanged ("Bench press"); a
screen reader and the Tab order meet nothing new. *HTTP*

**LB-7.9** Given the art on a page, then it plays its two frames
continuously, at the gym's rate for that machine: 400 ms a frame, and 250 ms
on the treadmill (animations.md D4), not slowed on Paper pages (D38). It plays with no script
(the server's HTML and the page's styles alone). *browser*

**LB-7.10** Given Mia's device asks for reduced motion, then every piece of
art on history, the summary and the exercise page holds Frame 1, still, and
nothing on those pages moves. *browser* (emulated media)

**LB-7.11** Given a 360 px wide phone, a 390 px phone and a 1280 px laptop,
then on every page the art sits beside the name without covering the name,
its Live badge, the Best line, any set's figures or record marks, or a note;
the set column doesn't wrap or scroll sideways because of it; and it is
drawn at a whole-number scale, as all pixel art is. It is small, no taller
than the name and its Best line, and the same size on a phone as on a
laptop (D37). *browser*
(at 360, 390 and 1280 px, no horizontal scroll and no box overlap)

**LB-7.12** Given a history with forty or more exercise groups across its
open weeks, on a mid-range phone, then every piece of art in an open week
animates, scrolling stays smooth and taps respond as quickly as without the
art. Art in a folded week takes no effort until the week is opened (D40). *judged* (on a phone) and *browser*
(a folded week's art isn't shown)

**LB-7.13** Given the art in a set table on history or the summary, then
tapping it does what tapping the exercise's name does: it opens that
exercise's page. The tap target is the name and its art together, at least
44 px tall. The art stays hidden from screen readers, so the link's name is
unchanged (D36). *browser*

**LB-7.14** Given the exercise page's own set table, whose groups are
sessions rather than exercises, then its rows show no art: the head already
shows it, and every row would repeat the same picture (D42). *HTTP*

**LB-7.15** Given the art is added, then nothing else in the set table
changes: the same names, set figures, Best lines, marks, notes and links,
and every existing check that reads history or a summary (for example
"Bench press" and "62.5" in `spec/core-loop.test.ts`) still passes. *HTTP*

**LB-7.16** Given the room page, home's Last workout card, the plans page,
and the plan preview on the summary, then they show no exercise art (D41).
*HTTP*

**LB-7.17** Given a group of Gen Z friends scrolling a week of history, then
the art makes it quicker to find "the squat day" and reads as fun, not
cluttered; it shows effort as capable and cool and is the same whatever
weight was logged (animations.md GYM-10.25). *judged*

## Open questions

None. All 22 were settled on 4 Nov 2026, D23 to D35 since, and LB-7's
eight (Q36 to Q43) on 5 Nov 2026; see Decisions.

## Decisions

All dated **4 Nov 2026**, from the user, relayed by the main agent: every
recommendation accepted as written (Q1 to Q22 became D1 to D22). The
criteria above are written to match; nothing in them rests on an open
question. The options that were turned down are kept here so the richer
versions can be found later.

### The whole refactor

| # | Question | Options | Decision and why | Criteria |
| --- | --- | --- | --- | --- |
| D1 (Q1) | The spec's "Out" table cuts warm-up sets and personal records, and five days remain. Bring them in, and at what priority? | (a) All six as P0; (b) all six as P1, built in an order and cut from the end; (c) only some | **(b), P1, in this order: LB-1, LB-2 types and RPE, LB-4, LB-6, LB-5, LB-2 notes, LB-3 plans**, and move "warm-up sets, personal records" out of the "Out" table. The order goes by value for the Anchor against cost: the first four reuse the sheet and existing pages; the exercise page, notes and plans each need new storage and a new page or panel. Nothing here may risk a P0 or the research note | Everything |

### LB-1: Last time

| # | Question | Options | Decision and why | Criteria |
| --- | --- | --- | --- | --- |
| D2 (Q2) | What pre-fills the fields? | (a) Today's rule: the newest set of the exercise anywhere; (b) set *n* from set *n* of the previous session (Hevy) | **(a).** Within a workout, set 3 is usually set 2 again, which (a) already gets right; the course check stays as it is. (b) would help only the first set of an exercise | LB-1.8 |
| D3 (Q3) | Show Last time during a rest on the same exercise (hidden today), with the matching set marked? | (a) Yes; (b) keep it hidden while resting | **(a).** The rest is when the Anchor plans the next set, and "set 3 last time was 62.5 × 7" is exactly what they want then | LB-1.6, LB-1.7 |

### LB-2: Set types, RPE, notes

| # | Question | Options | Decision and why | Criteria |
| --- | --- | --- | --- | --- |
| D4 (Q4) | Where does a note belong? | (a) one per exercise per workout; (b) one per set; (c) one per workout | **(a).** Notes like "seat on 4" are about the exercise, and come back usefully under Last time. (b) is the simplest to store, but the note would land on the next set rather than the one just done, because the form during a rest is for the next set. (c) never comes back when you need it. The richer version adds (c) on the summary too | LB-2.19 to LB-2.27, LB-1.4 |
| D5 (Q5) | Do warm-ups count in Sets and Volume? | (a) Yes, excluded only from records, plan counts and the chart; (b) excluded from Volume too (the MVP spec) | **(a).** Simpler: volume and the summary's ute joke stay as built, and the Drifter's warm-ups still "count" ("every kilo counts"). (b) is the stricter training-load figure | LB-2.10, LB-6.4 |
| D6 (Q6) | RPE scale? | (a) 1 to 10 in half steps; (b) whole numbers only | **(a).** Lifters say "8.5" all the time; it costs only a validation rule | LB-2.14 |
| D7 (Q7) | After a set, does the type carry over? | (a) Back to Normal every set; (b) keep the last type | **(a).** With (b), forgetting to switch back after warm-ups quietly removes working sets from records; one extra tap per warm-up is the safer cost | LB-2.4 |
| D8 (Q8) | Are warm-ups numbered? | (a) Only working sets are numbered, a warm-up says "Warm-up"; (b) number every set, as today | **(a).** Matches how lifters count ("4 working sets") and keeps "Set 2 of 4" in a plan honest | LB-2.11 |

### LB-3: Plans

| # | Question | Options | Decision and why | Criteria |
| --- | --- | --- | --- | --- |
| D9 (Q9) | How is a plan made? | (a) From a finished workout only, then rename or delete; (b) a builder from scratch too; (c) both, plus editing a plan's exercises and set counts | **(a).** One button on the summary, no builder page to design and test in five days, and the plan is what you actually did. A Drifter with no history can't make one yet, but plans serve the Anchor first. (b) and (c) are the richer version | LB-3.1 to LB-3.9 |
| D10 (Q10) | Where do plans live? | (a) A new `/plans` page in the Logbook group, linked from home and the summary, loaded from the room's sheet; (b) a section on home; (c) only in the room | **(a).** Managing (rename, delete) stays out of the gym, where the dock is; loading stays in the sheet, where it is used | LB-3.8 to LB-3.12 |
| D11 (Q11) | Does loading a plan choose its first exercise (claiming a station, maybe a delivery)? | (a) No: loading only shows the plan and preselects Up next, and the dock's Choose takes it; (b) yes, loading chooses the first exercise | **(a).** One action, one effect: nothing in a plan moves your avatar or calls the worker without your tap, and it is still one tap to start. Exercises are then chosen from the plan in one tap, exactly as Choose | LB-3.12 to LB-3.18 |
| D12 (Q12) | What does a plan hold? | (a) Exercises and a set count each; (b) also target weight and reps per set | **(a).** Pre-fill and Last time already supply the numbers; targets would need their own editor. (b) is the richer version | LB-3.2 |
| D13 (Q13) | What is it called on screen? | "Plan", "Template", "Routine" | **"Plan".** Plain, short, Gen Z-neutral; "template" sounds like an office app (system.md: never corporate) | Copy only |

### LB-4: Records

| # | Question | Options | Decision and why | Criteria |
| --- | --- | --- | --- | --- |
| D14 (Q14) | Which e1RM formula? | (a) Epley, *w* × (1 + *r*/30), with 1 rep = the weight itself, only for 1 to 10 reps, to 0.1 kg; (b) Brzycki; (c) any reps | **(a).** The MVP spec's formula; a true single then reads as itself; estimates past 10 reps are unreliable | LB-4.5, LB-5.3 |
| D15 (Q15) | Which sets get a record mark? | (a) Each working set that beats every earlier one, marks staying put; (b) at most one per record type per workout, the workout's best | **(a).** Marks appear the moment you tap Done and never move, so the stamp, This workout and history always agree; (b) would move a mark mid-workout | LB-4.1, LB-4.11 |
| D16 (Q16) | Is the first ever set of an exercise a record? | (a) No; (b) yes | **(a).** "Record" should mean you beat something. With (b), every new exercise and every showcase set is a "record", and the word stops meaning anything | LB-4.3 |
| D17 (Q17) | Which records for each kind? | (a) Bodyweight: most reps, heaviest added; hold: longest; cardio: longest distance, longest time; (b) add fastest pace over runs of at least 1 km | **(a).** Every type is one comparison of one stored field. Pace needs a minimum distance to mean anything (a 100 m sprint would win); that's the richer version | Terms table, LB-4.6 |
| D18 (Q18) | Include the flex animation for a new heaviest weight (GYM-17)? | (a) Not in this work; (b) include it | **(a).** It needs new art, a room event and timing with the walk to the cooler, in a week already full. LB-4 leaves it a small follow-up: "a Done that sets Heaviest plays the flex". **Built since (5 Nov 2026), in `room-feel.md`, widened by the user: a Done that sets any record (not only Heaviest) is a personal best and plays the room's moment (`room-feel.md` F14), and the room is told, overturning LB-4.13 (F15).** | LB-4.13 (superseded) |

### LB-5: The exercise page

| # | Question | Options | Decision and why | Criteria |
| --- | --- | --- | --- | --- |
| D19 (Q19) | What does the chart plot? | (a) Weight: best e1RM per workout; bodyweight: most reps; hold: longest; cardio: longest distance; (b) weight lifts plot the heaviest weight instead | **(a).** e1RM shows progress across rep ranges (5 × 100 and 8 × 90 compare). (b) is simpler and matches history's "Best", but a lighter, longer set reads as going backwards | LB-5.3 |
| D20 (Q20) | Where is it reached from? | (a) Exercise names in history, the summary and home's Last workout card; (b) also from the room's sheet | **(a).** A link in the sheet takes you out of the gym mid-rest (you turn Away after 60 s) and adds clutter near the dock; Last time already answers the mid-workout question. The URL is `/exercises/<id>`, like `/workouts/<id>` | LB-5.7 |

### LB-6: Weekly stats

| # | Question | Options | Decision and why | Criteria |
| --- | --- | --- | --- | --- |
| D21 (Q21) | Which time zone are weeks and days in? (History's spec has asked this since October.) | (a) Set the server to Australia/Sydney; (b) keep UTC | **(a).** On UTC a week starts at 10 or 11 am Monday in Sydney, and "Today" turns over mid-morning. One server setting fixes every page, the stats included. Strangers in other time zones later would need per-person zones | LB-6.2 |
| D22 (Q22) | What counts toward a streak? | (a) At least one workout with a set in a Monday-to-Sunday week; this week counts once you train, and never breaks before it ends; 0 shows nothing; (b) a set number of workouts a week | **(a).** The Drifter is the person a streak should welcome back; one session a week is their win. No warning before it breaks (system.md 14: no streak-loss shaming) | LB-6.5, LB-6.6 |

### Found during the build

Raised by the designers and qa once the build started; settled by the user
on **4 Nov 2026**, each taking the recommendation.

| # | Question | Options | Decision and why | Criteria |
| --- | --- | --- | --- | --- |
| D23 | A bodyweight lift's first set with added weight, after earlier sets with nothing added: a Heaviest added record? | (a) No, it is the first set to measure that type; (b) yes, it beats "nothing added" | **(a).** The same rule as D16: a record means you beat something, and no earlier set measured added weight | LB-4.6 |
| D24 | What does the summary's "N new records" count? | (a) Sets carrying a record mark; (b) record types broken | **(a).** It matches the marks on the page: a set that is a record for two types is one marked set, not two | LB-4.12 |
| D25 | Does the exercise page show a current record held by one lone working set (never marked, LB-4.3)? | (a) Yes; (b) only types with a marked record | **(a).** "Your best so far" is true after one set; leaving it blank would look like a missing figure | LB-5.2 |
| D26 | Do sets in the open workout count toward the exercise page's current records and chart? | (a) Yes, as soon as they are logged; (b) only once the workout finishes | **(a).** The page agrees with the record marks the sheet already shows | LB-5.2, LB-5.3 |
| D27 | How much does the exercise page show at once, and does the chart show records? | (a) The six newest sessions, older ones folded; points for sessions that set a record of the plotted type are lit; (b) everything open, no highlight | **(a).** A long logbook stays short on a phone, every set is still one unfold away, and the lit points show progress at a glance | LB-5.8, LB-5.10 |
| D28 | Does a rename confirm or reorder, and does deleting a loaded plan warn? | (a) No extra confirmation, no reorder (plans stay in the order made); deleting a loaded plan gets only the usual ask-again; (b) confirmations and an extra warning | **(a).** A rename is easy to undo; a list that doesn't jump is easier to find things in; deleting a plan never touches a set | LB-3.8, LB-3.9 |
| D29 | Does `/plans` show "n of 20"? | (a) No, the limit is mentioned only by its refusal; (b) show the count | **(a).** Almost nobody reaches 20; a counter is clutter for everyone else | LB-3.6, LB-3.8 |
| D30 | What does the save confirmation say? | — | **"Saved as {name}. Load it from the sheet next time 📋"**: it names the plan and says where it is used, in the copy bank's voice | LB-3.1 |
| D31 | How is an exercise's "Best" line written, now that sets carry RPE and types? | (a) Without RPE, and from working sets only, unless the exercise has only warm-ups in that workout; (b) as the best set is written, RPE and warm-ups included | **(a).** The mockups write Best without RPE, and a heavy warm-up single shown as a workout's best would contradict LB-2.10. **The main agent's recommendation, applied on 4 Nov 2026 under the user's instruction to take every recommendation while they were away; not answered by the user directly.** | LB-2.10, LB-2.16 |
| D32 | In what order does the exercise page's chart-as-text list its points? | (a) The chart's order, oldest first; (b) newest first, like the sessions | **(a).** It is the chart in text, so it reads the same way. **The main agent's recommendation, applied on 4 Nov 2026 under the user's instruction to take every recommendation while they were away; not answered by the user directly.** | LB-5.5 |
| D33 | Where does an RPE go on a run, after the pace or before it? | (a) After the whole set, pace included: "5 km · 25:00 · 5:00 /km @ 8"; (b) before the pace | **(a).** One rule for every kind: the RPE always closes the set. **The main agent's recommendation, applied on 4 Nov 2026 under the user's instruction to take every recommendation while they were away; not answered by the user directly.** | LB-2.16 |
| D34 | qa found that at 1280 × 900 a taller sheet pushed Start set off the screen, and loading a plan moved it 31 px. Relax LB-0.1 to phones, or hold it at both widths? | (a) Hold it at both: the sheet is at most the screen's height, scrolls inside itself, and keeps the dock at its visible foot; (b) relax LB-0.1 to phones | **(a).** The Anchor logs on a laptop too, and LB-0.1 is the promise that protects them (README principle 3). **The main agent's recommendation, applied on 5 Nov 2026 under the user's instruction to take every recommendation while they were away; not answered by the user directly.** | LB-0.1 |
| D35 | The room design's open questions (`docs/design/room/spec.md` L.8) | (a) As drawn; (b) otherwise, item by item | **(a), all as drawn.** After Clear while Idle, the picker drops Up next's preselection. Swap and Clear ask no confirmation. The server's open-or-folded rule for the plan wins on every render. A lift in the loaded plan reads "Set 3 of 4" in the lift row ("Set 5 of 4" past it). Save note posts the set form, and the server reads only `exercise_id` and `note` from it. An RPE on a warm-up is allowed. While on a lift that isn't in the plan, the plan is folded. Why: nothing is lost by a swap or a clear, so a confirm only slows the Anchor; "Set 3 of 4" answers "how many left?" where the eye already is; going off-plan was the person's choice, so the plan steps back. **The main agent's recommendation, applied on 5 Nov 2026 under the user's instruction to take every recommendation while they were away; not answered by the user directly.** | LB-2.13, LB-3.13, LB-3.21 |

**A design departure, not a criteria change** (5 Nov 2026): the RPE field
is built as a number input, not the select the room design draws, because
LB-2.14 keeps a refused value as typed (7.3 stays 7.3 beside its error),
which a select can't hold. No criterion changes.

### LB-7: An exercise's animation in the logbook

All dated **5 Nov 2026**, from the user, relayed by the main agent: every
recommendation accepted as written (Q36 to Q43 became D36 to D43). Listed by
how much each changes the feature.

| # | Question | Options | Decision and why | Criteria |
| --- | --- | --- | --- | --- |
| D43 (Q43) | Plank shows the push-up, Overhead press the squat, Hanging leg raise the pull-up, Lateral raise the curl, Incline walk the run. Accept that beside the name? | (a) Accept, as the gym does; (b) show the machine's idle drawing, with no avatar, for those six; (c) draw new frames for them | **(a).** The name beside it says which exercise it is, as on the map, and the art says which machine. (b) mixes two kinds of art in one table; (c) is new art, which the user ruled out. Richer later: one animation per exercise | LB-7.4 |
| D36 (Q36) | Is the art part of the name's link? | (a) Yes: tapping the art opens the exercise page, like the name; (b) no, it is only a picture | **(a).** A bigger target for a thumb, and a picture next to a link that doesn't respond to a tap feels broken. It stays hidden from screen readers, so the link's name is unchanged | LB-7.13 |
| D40 (Q40) | With dozens of groups on history, do they all animate? | (a) All, by styles alone, with folded weeks costing nothing until opened; (b) only the first few, the rest still | **(a).** The two open weeks rarely hold more than about twenty groups, and swapping two drawings costs little. If LB-7.12 fails on a phone, fall back to (b) | LB-7.12 |
| D37 (Q37) | How big is the art beside the name? | (a) Small, about the height of the name and its Best line, the same size on phone and laptop; (b) larger on a laptop | **(a).** The set figures are what history is for (its spec's hierarchy), and one size is one thing to check at three widths. The designer picks the whole-number scale | LB-7.11 |
| D38 (Q38) | How fast does it play off the map? | (a) The gym's rates, 400 ms a frame and 250 ms on the treadmill; (b) slower on Paper pages, for example twice as slow | **(a).** "At the gym's rhythm" is the user's own wording; the same art at the same speed reads as the same person. Reduced motion is the setting for anyone who wants it still | LB-7.9 |
| D39 (Q39) | Whose look, if Mia changed it since the workout? | (a) Today's look; (b) the look she had then | **(a).** It's "you", and no past look is stored (AV-1 keeps one). (b) would need a look saved with every workout | LB-7.6 |
| D41 (Q41) | Anywhere else? | (a) No: not in the room's sheet or "This workout", home's Last workout card, `/plans` or the summary's plan preview; (b) add some of them | **(a).** In the room the map already shows you on the machine, and nothing new goes near the Anchor's dock; the others are small lists where a picture per row crowds the text. Each is a small follow-up later | LB-7.16 |
| D42 (Q42) | On the exercise page: only the head, and also on its empty state? | (a) The head only, empty state included; no art in the session rows; (b) art in each session row too | **(a).** Every row would show the same picture. On the empty state the art invites a first try ("this is you on the bench") | LB-7.3, LB-7.14 |
