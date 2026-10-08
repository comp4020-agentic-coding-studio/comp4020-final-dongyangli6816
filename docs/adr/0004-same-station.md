# ADR 0004: Two people choosing the same station at once

Status: accepted, 8 Oct 2026. Draft by the agent; edit before citing.

## Context

This is the multi-user decision for Crit 9.

A room has twelve stations and holds at most twelve people, so there is
always a station for everyone: someone choosing a lift first lets go of
their own, and the other eleven hold at most eleven (GYM-4). So the question
is never whether there are enough stations. It is what happens when two
people want **the same one** at the same moment.

A typical case: one flat bench on the floor and nobody on it. Mia and Tom
both tap Bench press within the same second, and both want that bench by
GYM-4's first rule. A server that reads "bench free" for both and then writes
both claims puts two avatars on one bench. Worse, the second write silently
overwrites the first, so Mia's screen says she's on the bench while the
database says Tom is.

There is a quieter case too. Ji-woo picks deadlift. Nothing free has a
lifting platform and nothing is empty, so her claim swaps out the equipment
that has gone unused longest (rule 3). If Priya sits down on that same
station in the same instant, the swap would carry her equipment out from
under her.

README's third promise decides what matters here: **logging never slows you
down**. Whatever happens, the person tapping a lift must end up on a station
with that equipment straight away, with no error and no second try.

## Options

1. **One transaction decides; the loser falls through.** The claim (let go of
   your own, find a station by GYM-4's rules, take it) runs as one database
   transaction. The second person to commit sees the first one's claim and
   falls to the next rule: a second bench is delivered to an empty station,
   or swapped in. Nobody is told no.
2. **Optimistic on the client.** Each screen moves its own avatar to the
   station it expects at once, and the server corrects it afterwards. It
   feels fastest, but the loser's avatar visibly jumps to another station a
   moment later, and for that moment two screens disagree about who is on
   the bench.
3. **Refuse the second and ask them to choose again.** "That bench was just
   taken." This is the simplest to build and is honest, but it breaks the
   third promise: the person who lost a race they couldn't see has to tap
   again, between sets.
4. **Share it (work in, GYM-16).** The two take turns on one bench, as people
   do in a real gym. This is the most like real life, but it needs turn
   order, a waiting state and new UI, which is week 12's P1 work rather than
   this week's.

## Decision

Option 1. `claimStation()` in `src/lib/stations.ts` does the whole claim in
one `IMMEDIATE` transaction, so SQLite takes its write lock before the first
read, and two claims are decided strictly one after the other. Two further
guards sit underneath it, so the rule doesn't rest on one mechanism:

- The update that takes a station only matches it `where user_id is null`.
  If it ever matched nothing, the claim would fail loudly rather than
  overwrite someone.
- A unique index on `(room_id, user_id)` means the database itself refuses a
  second station for one person.

Rule 3 only ever considers stations nobody holds, so equipment in use is
never swapped out.

To be honest about how much of this the transaction is doing today: the app
is one Node process, and `better-sqlite3` is synchronous, so two requests
already can't interleave inside a claim. The transaction and the index turn
"doesn't happen with this stack" into "can't happen whatever the stack". If
claims ever became asynchronous, or ran in a second process, the guarantee
would still hold.

## Consequences

- **The cost lands on the loser, as a wait rather than an error.** Tom gets
  a second bench, which a worker has to carry in (GYM-6, next week). GYM-7
  keeps that from blocking his logging: he can tap Start set at once.
- **The floor drifts.** Five people benching means five benches, and in a
  busy room the opening equipment can be swapped out. That is accepted (see
  Risks in `spec-4-weeks.md`), and it's the price of nobody ever waiting.
- **Checked over HTTP** in `spec/stations.test.ts`:
  - two people choosing the one free bench at once get different stations,
    both with a bench;
  - with all twelve stations held, a swap never takes equipment someone is
    using;
  - twelve people choosing at once, twice over, all end up on their own
    equipment.

  I checked that the second test can fail: with rule 3 allowed to pick
  stations someone holds, it fails on the first person's treadmill. The
  twelve-at-once test alone didn't catch that.
- **Not covered**: what the loser *sees* while their equipment is delivered.
  That is next week's delivery animation, and a person has to judge whether
  it reads as funny or as slow.
