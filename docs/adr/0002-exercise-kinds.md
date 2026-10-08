# ADR 0002: Four exercise kinds instead of weight × reps for everything

Status: accepted, 8 Oct 2026. Draft by the agent; edit before citing.

## Context

Week 9 logged every set as weight in kg and reps, as the four-week spec's
scope cut said ("weight and reps only"). Using it showed what that costs: a run
asked for a weight, a plank asked for reps, and a pull-up's honest weight is
0, which read as a mistake. The user asked for logging that behaves like the
trackers people already use. Hevy splits exercises into eight types (weight &
reps, bodyweight reps, weighted and assisted bodyweight, duration, duration &
weight, distance & duration, weight & distance), and each type shows only the
fields it needs; Strong does much the same with its exercise categories.

## Options

- **Keep weight × reps** and tell people to put minutes in the reps box. No
  work, and the logbook stays wrong for 5 of the 16 exercises.
- **Hevy's eight types.** Covers every exercise anyone might add, but the 16
  seeded exercises only use four of them, and Spotter has no custom exercises.
- **The four kinds the 16 exercises need**, chosen with the user:
  `weight` (weight × reps), `bodyweight` (reps plus optional added weight),
  `duration` (a hold), `cardio` (distance and time, pace derived).

## Decision

The four kinds. `exercises` gains `kind` and `default_rest_s`; `sets` gains
nullable `duration_s` and `distance_m`, and `weight_kg` and `reps` become
nullable. A kind decides which form fields the gym shows and how every page
writes a set (`setLabel` in `src/lib/logbook.ts`). Volume stays weight × reps;
a bodyweight lift adds only its added weight, as Hevy does for lifts that
don't move the whole body. Cardio starts no rest timer.

The migration came out of `drizzle-kit generate` in two steps (add columns,
then relax `NOT NULL`), because a single generated migration copied the new
columns out of the old table before they existed.

## Consequences

- Sets logged before this change keep their weight and reps, even for a run;
  `setLabel` writes whatever fields are filled, so they still read as entered.
- A fifth kind later (say weighted carries) is a new value and a branch in
  `readSet` and `setLabel`, not a new table.
- Personal bests (GYM-17) need a "best" per kind, which `topSet` already
  defines: distance, hold, reps, then weight.
