# Acceptance criteria: Equipment delivery

- **Area**: The gym (`docs/product/spec-4-weeks.md`), the part that decides
  how new equipment arrives on the floor: the gym worker, his delivery and
  swap runs, and how they stay out of the way of logging.
- **Requirements covered**: GYM-6, GYM-7 (both P0). They meet GYM-4 and
  GYM-5 (which claim causes a run), GYM-8 (no replay), GYM-10.18 and
  GYM-10.19 in `animations.md` (where the avatar waits), GYM-13 (within a
  second), GYM-15 (the text list), and BOT-3 and BOT-5 (Dony). Those keep
  their own numbers; everything here is numbered under GYM-6 or GYM-7.
- **Status**: agreed
- **Date**: 4 Nov 2026 (drafted and agreed the same day); revised 5 Nov
  2026 (D10). See Decisions.

## The request

From the main agent, 4 Nov: write acceptance criteria for GYM-6 and GYM-7,
the gym worker's delivery and swap animations, with open questions and a
recommended answer to each. Already decided elsewhere, and kept here as
written:

- `docs/design/system.md` section 10, "The gym worker": a staff uniform in a
  fixed palette nobody can pick, bigger shoulders, about 4 s on screen,
  never blocks a button. Section 11: walking about 8 tiles a second along
  the aisles, `steps()` motion, and under reduced motion the worker is
  skipped and the equipment simply appears. Section 3's copy bank: "Delivery
  on the way (GYM-7)": `Equipment's on its way. Start whenever 🚚`.
- `animations.md` GYM-10.18 (an avatar whose state changes mid-walk heads
  for its new place) and GYM-10.19 (someone who opens or reloads
  mid-delivery sees no replay). GYM-10.19 first had the avatar wait on the
  aisle tile in front of the station and step on at the put-down; on 5 Nov
  the user changed that after trying the build (D10): the avatar stays
  where it is until the worker has gone, and only then walks to the
  station.
- ADR 0004: the loser of a race for one station gets a second machine,
  delivered or swapped in, and is never told no.
- The spec's data model: "A delivery is not a table." The station's stored
  `placed_at` is all a screen has to go on.

## Terms

Used with these meanings throughout.

- **Worker**: the gym's staff figure who carries equipment (GYM-6). He is
  not a person, not a member and not Dony.
- **Claim**: what the server does when someone chooses a lift (GYM-4): it
  takes a station for them in one transaction (GYM-5). A claim is
  **already** (the station had that equipment), a **delivery** (the station
  was empty) or a **swap** (the station had other equipment nobody held).
- **Run**: the worker's whole trip for one delivery or swap, from appearing
  at the entrance to leaving through it. Where the difference doesn't
  matter, "a run" means either.
- **Claimer**: the person whose claim caused a run.
- **Put-down**: the moment in a run when the new equipment lands on the
  station on that screen. From then on the station draws it like any
  equipment.
- **Carried out**: the old equipment leaving on the worker in a swap.
- **Clear**: a station is clear on a screen when no worker for it is drawn
  there any more: every run for that station, a turned-round worker's
  included (GYM-6.16), has ended with its worker gone at the entrance. A
  station with no run is always clear.
- **Waiting spot**: where an avatar stands while the station it is going to
  isn't clear (D10): the tile it was on when its screen learned of the
  claim (mid-walk, the tile it had reached), standing; or, if it was on a
  machine or sitting in front of one, the aisle tile in front of that
  station.
- **Entrance**: the door mat in the front wall, tiles (4,9) and (5,9) (room
  spec 3.2), where new arrivals walk in.
- **Placed time**: the server time stored with a station when its equipment
  last changed (`placed_at`). A delivery or swap sets it; an "already"
  claim doesn't.
- **Live**, **catching up**: a screen is live while its room stream is open
  and it has drawn the room at least once. It is **catching up** when it
  first renders the room, reloads, or its stream reopens after a drop: the
  first update after that is news it missed, and is drawn in place, as
  GYM-10.21 already says for walks.
- **Learns of a claim**: a live screen learns of a claim when a room update
  reaches it showing a station whose equipment differs from what that
  screen has drawn.
- **State**: Idle, Lifting, Resting, Slacking or Finished (GYM-9). **Away**
  is a flag on top of a state (GYM-14).
- **Panel** and **dock**: as in `int.md`: your own part of the gym page, and
  the strip pinned to the bottom of a phone holding its one button (Choose,
  Done, Start set or Save).
- **Within a second**: as GYM-13: on every other open screen in the room,
  with no reload.

## Scope

**In**

- Who the worker is, and that he is not a person: no tag, no list row, no
  button, nothing stored.
- A plain delivery and a swap: where the worker enters and leaves, how he
  walks, what he carries, when the equipment is down.
- Several runs at once, and a station that changes again before its run
  ends.
- What the claimer sees (their panel, their avatar, the copy-bank line) and
  what everyone else sees.
- A screen that opens, reloads, reconnects, learns of a claim late, or comes
  back from a background tab partway through a run; a server restart.
- Reduced motion, keyboard, screen readers, and taps passing through the
  worker.
- Dony: whether his schedule causes runs, and what happens when a person's
  claim takes the machine he is on.
- Finishing, leaving and the room closing mid-run; Away watchers.
- The server log line for a claim (OPS-1).
- The showcase: runs with nobody lifting.

**Out, with the reason**

- **Tapping the worker** (cheering him, a menu, a reaction). He is staff, not
  a person (BOT-5's "like a person" is Dony's, not his), and anything you
  can tap on the map must be a focusable button with a name, which puts him
  in the tab order between people. Taps pass through him (GYM-6.26).
- **A name tag or list row for the worker.** Tags and the list are for
  people (and Dony); a twelve-person room already fills the tag layer.
- **Any sound.** As `int.md` D27: the room page has no sound toggle, and
  only the rest-over sound exists.
- **Anything stored about a run.** The spec's data model rules it out: the
  station's equipment, holder and placed time are the whole record. So
  nothing here can be asked for, cancelled or hurried, and there is nothing
  for the server to refuse.
- **Changing which claim happens** (GYM-4's order, ADR 0004). This file
  decides how a claim looks, not which one is made.
- **Work in (GYM-16)**, the P1 alternative to a delivery. Not specified
  here; see "What this makes harder later".
- **Equipment leaving on its own** (the spec's open question). Not in this
  build (D7): equipment leaves only when a swap needs its station.
- **The worker's frames and facing.** The spec's art table lists "walk
  carrying in 4 directions × 2; put down × 1"; whether he faces his
  direction of travel or the viewer, as people do (`animations.md` D1), is
  the designer's call.

**What this makes harder later**

- **Strangers: Choose has no rate limit.** Today a friend can choose five
  lifts in five seconds and send five workers across the map, and each claim
  can swap out free equipment someone else was about to use. Among friends
  that's a joke; in a findable room it's a way to clutter everyone's screen.
  A public room would need a limit on claims (in the spirit of the MVP
  spec's per-sender caps) before it opens.
- **Strangers: the worker is the right shape.** A swap is carried out by
  staff, following a rule, on equipment nobody held, so no member's avatar
  ever acts on another's station. That stays impersonal between strangers.
- **Bigger gyms.** The MVP spec's public gyms would mean longer aisles, and
  the 4.5 s ceiling (GYM-6.7) would need a faster worker or an entrance
  nearer the stations.
- **Work in (GYM-16).** Offering to share a machine instead of having one
  delivered must not add a step before the claim: the Anchor's Choose stays
  one tap, and the worker remains what happens if nobody offers.
- **Equipment leaving on its own** (D7 keeps it out). If it comes later, a
  pickup would be a run with nothing brought in, by the same worker, under
  the same rules.
- **A crowded map** (D1). One worker per run, with no cap, could clutter a
  phone at 1× if many claims land at once. The noted fallback, if the
  showcase rehearsal shows it: at most 6 workers on a screen at once, any
  more simply appearing as under reduced motion. It is not a criterion.
- **Room history** (spec open question). Nothing about runs is stored, so
  "who had what delivered" can only come from the server log.

**Existing behaviour this changes**

- **New equipment appears at once today.** `drawMap` in
  `src/pages/rooms/[id].astro` replaces a station's drawing when its
  equipment changes ("new equipment simply appears this week; the worker
  carries it in next"). The room spec's row "Equipment that is delivered
  this week simply appears on its station" retires with it.
- **Screens aren't told the placed time.** The room view
  (`roomView` in `src/lib/presence.ts`) reports each station's slot and
  equipment only. GYM-6.21 needs each screen to know when a station's
  equipment was put there, as the data model intends. That is for the
  contract.
- **The claimer's own screen hears of the claim twice.** After Choose, the
  page swaps its panel in place and keeps the old map's stations; the room
  stream then brings the change. The run must play once (GYM-6.37).
- **The log line doesn't say what a swap carried out.** `station.claim`
  records the slot and `arrived` (already, delivery or swap), not the
  equipment that left (GYM-6.40).
- **Dony never causes a run**, today or after this feature (D3), while
  BOT-3 still allows "at most two deliveries a block". `src/lib/dony.ts`
  puts him on free equipment already on the floor, or another lift on
  whatever is free, or waits; that stays.
- **A swap can take the machine Dony is on.** He holds no station row
  (BOT-5), so GYM-4's rule 3 sees his station as free. He already moves off
  when someone claims it; GYM-6.31 says how that meets a run.
- **`animations.md` GYM-10.19 is revised** (D10): the avatar no longer
  walks to the aisle tile in front of its station and waits there; it waits
  where it is until the station is clear, then walks. The room page today
  walks the avatar at once.
- **"Start set at once" means the dock's button.** In today's room, Choose
  is the first tap of a set and leaves Done in the dock, so GYM-7's "tap
  Start set at once" is read as "the dock's button works at once": Done
  after Choose, Start set during a rest.
- **The data model's wording.** "A client that sees a station whose
  `placed_at` is less than a few seconds old plays the worker's animation"
  is read together with GYM-8 and the agreed GYM-10.19: only a **live**
  screen that sees the change plays it; a screen that opens or reloads
  never does (GYM-6.20).

**Spec changes this needs** (not made here; the main agent makes them):
GYM-6's swap sentence, to the one-trip swap (D2); BOT-3's "at most two
deliveries a block", to "only on equipment already on the floor" (D3); the
data model's sentence about `placed_at`, reworded as in the last bullet
above.

**A page change.** The room page gains the worker and a line in the
claimer's panel, so the designer designs it from these criteria.

## Criteria

Each criterion says how it can be checked: **HTTP** (a request against the
running app), **browser** (needs the page's script, Playwright) or
**judged** (a person has to look). Names follow system.md section 13: Mia,
Ji-woo, Tom, Priya. Unless stated, all are members of the same open room,
each signed in in their own browser, and "every screen" means every open,
live screen in the room, the claimer's included. Times are the server's,
as each screen reads them through its clock offset.

### GYM-6: the delivery

> **Delivery:** a muscular gym worker walks in from the entrance carrying
> the equipment, puts it down on the claimed station, and walks out. Every
> screen in the room plays this. A **swap** is the same, except the worker
> first carries the old equipment out.

#### Who the worker is

**GYM-6.1** Given any run, then the worker is drawn as the gym's staff: a
fixed uniform in colours nobody can pick in the avatar editor, and bigger
shoulders than any member (system.md section 10), so nobody takes him for a
person or for Dony. He has no name tag, no state chip and no state, and
every run uses the same worker. *judged* (the art sheet, beside the people
and Dony)

**GYM-6.2** Given a run is playing, then the worker is not in the squad
list, doesn't change the headcount ("4 of 12 in"), is not in the room log,
and is not an avatar: no button, no tab stop, no menu, no accessible name.
The server's first render of the room never contains him, even a moment
after a claim. *HTTP* (a first render made within a second of a claim has
no worker, and the same squad list and count as before it) and *browser*

**GYM-6.3** Given a run, then the server stores nothing for it beyond the
station's new equipment, its holder and its placed time; the room it
reports (first render and stream) holds stations and people, never runs.
*HTTP*

#### A plain delivery

**GYM-6.4** Given no free station has a lifting platform and station 5 is
empty, when Mia chooses Deadlift, then within a second, on every screen,
Mia's included, the worker appears at the entrance carrying a lifting
platform, recognisable as that machine, and sets off for station 5. *HTTP*
(within a second, another member's stream reports a lifting platform on
station 5, held by Mia, with a placed time at the claim) and *browser*

**GYM-6.5** Given a run, then the worker walks only along the aisles, by
the route avatars take (room spec 3.2, "Walking": from the entrance up the
central walkway to the station's aisle row, along it, then onto the
station's tile), one tile a step at about 8 tiles a second, moving in steps,
never gliding and never crossing a station, wall or the lobby's corners.
*browser* (every tile he stands on is on that route) and *judged*

**GYM-6.6** Given the worker reaches the station, then he steps onto its
tile, puts the equipment down (his put-down frame), and from that moment
the station shows the equipment like any other; then he walks back the way
he came and is gone at the entrance. Until the put-down, the empty station
keeps its empty-station marker. The claimer's avatar starts walking to the
station only once he has gone (GYM-7.5, D10), so the worker and the claimer
are never both walking to or from that station at once. *browser*

**GYM-6.7** Given a delivery or a swap to any of the twelve stations, then
from the worker appearing to him leaving takes no more than 4.5 s, and the
new equipment is down no more than 2.5 s after he appears (system.md
section 10: about 4 s, funny, not slow) (D2, D5). *browser* (timed, for
the nearest and the farthest station)

**GYM-6.8** Given a run for Mia's claim, then on Mia's screen her station
is marked as hers (the claim corners, `animations.md` GYM-9.3) from the
moment her screen learns of the claim, before the equipment is down, and
stays marked as today. *browser*

#### A swap

**GYM-6.9** Given every station holds equipment, none of the free ones has
a cable machine, and of the free ones the flat bench on station 2 has gone
unused longest, when Tom chooses Lat pulldown, then on every screen one
worker makes one trip: he walks in carrying a cable machine, swaps it for
the flat bench at station 2, and staggers out through the entrance carrying
the flat bench, recognisable as that machine. He never makes a first trip
to fetch the old piece (D2). *browser*

**GYM-6.10** Given a swap, then the old equipment stays drawn on its station
until the worker reaches it, and the station goes straight from the old
equipment to the new at the put-down, as the old piece passes to the
worker: the station is never drawn holding both, and never drawn empty
(D2). As for a delivery, the claimer's avatar sets off for the station only
once the worker has carried the old piece out through the entrance and gone
(D10). *browser*

**GYM-6.11** Given a swap, then the equipment carried out was on a station
nobody held: never one held by someone Lifting, Resting, Slacking or Away
(GYM-3, ADR 0004). *HTTP* (with every station held but one, including by
someone Resting and someone made Away by the test hook, a swap takes only
the free one) — With strangers: the worker is staff carrying out what
nobody held, so a swap reads as the gym's doing, never another member's.

#### Several runs at once

**GYM-6.12** Given Mia, Tom and Priya each make a claim that needs a run
within the same second, then each claim gets its own worker, all three runs
play at the same time, and none waits for another: there is no queue and
no cap on how many workers are on the map (D1). *browser*

**GYM-6.13** Given two or more workers set off from the entrance within the
same second, then they walk in single file, each at least one step behind
the one before, so on the way in no two share a tile and each can be seen
(a worker walking out may pass one walking in); with twelve at once, the
last still leaves within 5.5 s of appearing (D1, D5). *browser* and
*judged*

#### When the station changes again before the run ends

**GYM-6.14** Given Mia's platform is still being carried to station 5, when
she chooses Bench press and is given a free bench on station 2, then the
run to station 5 carries on and puts the platform down (it is there, by the
server, GYM-8), and Mia's avatar heads for station 2 from wherever it has
got to (GYM-10.18). *browser*

**GYM-6.15** Given that, when Mia chooses Deadlift again before the platform
is down, then she gets station 5 back with no new run (the platform is
already there, GYM-4 rule 1), and her avatar stops where it has got to,
standing, and walks to station 5 once the first run's worker has gone
(D10). *HTTP* (the second claim changes no station's equipment or placed
time) and *browser*

**GYM-6.16** Given a run to station 7 hasn't put its equipment down yet on a
screen, when station 7's equipment changes again on the server (in a full
room, Mia lets go of it and her next claim, or someone else's, swaps it for
something else), then on that screen the first worker turns round at once,
on his next 125 ms step (D9), and carries what he holds back out through the entrance, and a new worker
starts a run for the newest equipment against whatever station 7 shows at
that moment: a swap if it shows equipment, a plain delivery if it is empty.
No worker vanishes, and the second run never waits for the first (D4).
Whoever is going to station 7 waits until it is clear: both workers gone,
the turned-round one included (D10). *browser*

**GYM-6.17** Given any number of changes to one station, however quick,
then on every screen that stays live the station ends showing exactly what
the server reports, with no extra run afterwards, no more than 4.5 s after
the last change reached that screen. *browser*

#### Opening, reloading, reconnecting, coming back (GYM-8)

**GYM-6.18** Given a new room, then its four opening pieces (GYM-2) are in
place on its first render and on every screen that opens it, however soon
after it was created; no worker ever brings them. *HTTP* (the first render)
and *browser*

**GYM-6.19** Given a run is playing for Mia's claim on other screens, when
Ji-woo opens the room, reloads it, or her stream reopens after a drop (her
phone locked, the Reconnecting chip), then her screen draws the equipment
already in place and Mia on her machine (GYM-10.19, GYM-10.21), with no
worker and nothing replayed. *HTTP* (a first render made within a second of
the claim draws the equipment on the station and Mia on it) and *browser*

**GYM-6.20** Given a screen is catching up, then whatever its first update
shows, it plays no run for it, however fresh the placed times in it are.
Only a live screen that sees a station change plays a run. *browser*

**GYM-6.21** Given a live screen learns of a claim late (a slow connection),
then it plays the whole run from the entrance if it learns of it less than
3 s after the claim's placed time, and draws the new equipment in place,
with no worker, if it learns of it 3 s or more after: 2.999 s plays,
3.000 s doesn't (D5). *browser* (with the stream held back)

**GYM-6.22** Given a page is in a background tab, or on a phone whose screen
dimmed without the stream dropping, while a run plays, when it is shown
again, then the worker is where he would be had the page never been
hidden, or, if his run is over, gone, with the equipment down and the
claimer where her walk from her waiting spot would have taken her by then
(on the machine, once that walk is over). A run never ends later than its own length after it started
on that screen, however much the browser held back the page's timers.
*browser* and *judged*

**GYM-6.23** Given the server restarts, or the machine sleeps and wakes,
during a run, then nothing about the claim is lost or repeated: the stored
station is exactly as the claim left it, and screens reconnect and draw it
in place (GYM-6.19). *HTTP* (after a restart, the first render has the
claimed equipment on the station, held by the claimer)

**GYM-6.24** Given a room update reaches a live screen and no station's
equipment differs from what that screen draws (someone's rest ended, an
emoji, Dony's next lift, a reconnect), then no worker appears. *browser*

#### Reduced motion

**GYM-6.25** Given Ji-woo's device asks for reduced motion, then on her
screen no worker appears for any claim: the new equipment appears on its
station at once (in a swap, it simply replaces the old), and the claimer
appears straight on it (GYM-10.23). Everyone else's screen plays the run as
normal. *browser* (emulated media)

#### Tapping, focus and screen readers

**GYM-6.26** Given a worker is drawn over or beside an avatar, a name tag, a
station, Dony's poster or anything else on the map, when someone taps or
clicks there, then the tap reaches what is under him exactly as if he
weren't there: the avatar is selected and its menu opens, the poster acts.
The worker never takes a tap, a click, a hover or focus. *browser* (a click
at the worker's centre while he overlaps an avatar opens that avatar's
menu)

**GYM-6.27** Given a run, then the worker never covers a name tag, a preset
bubble, the interaction menu, a banner or a refusal line. Whether he passes
in front of or behind an avatar's body is the designer's call; either way
the avatar stays selectable (GYM-6.26), and a focused avatar's focus ring
draws whole over him (GYM-15.4). *browser* and *judged*

**GYM-6.28** Given a keyboard user is tabbing through the map, then a run
adds no stop, never moves focus, and leaves the tab order as it would be
without the run. *browser*

**GYM-6.29** Given a screen reader, then the worker is hidden from it, and
nothing is announced to anyone when a worker appears, puts something down
or leaves for someone else's claim (system.md section 12: others' changes
are quiet). The squad list, the "On the floor" line and every avatar's
accessible name show the server's layout from the moment the screen learns
of the claim, without waiting for the put-down: while the platform is still
being carried, Mia's row and avatar already say "lifting, deadlift on
lifting platform 5", with nothing added about the delivery ("waiting for
equipment" or the like) (D6). *HTTP* (the first render) and *browser*

**GYM-6.30** Given a run is playing, when the window is resized so the map
changes between 1× and 2×, then the worker carries on from the same tile at
the new scale with square pixels, and the run still ends on time. *browser*

#### Dony

**GYM-6.31** Given Dony is lifting on station 3 (which he never holds,
BOT-5), when a person's claim takes station 3, either because it has their
equipment or as a swap, then Dony gets off at once and goes where his
schedule sends him next, before any worker reaches the station; in a swap,
the worker then carries out the machine Dony was on. *browser*

**GYM-6.32** Given anyone, Dony included, is sent to a station that isn't
clear on a screen (a station someone let go of mid-run, or one a
turned-round worker is still leaving), then on that screen they stay at
their waiting spot, standing, until every run for that station is over,
turn-rounds included, and only then walk to it, as GYM-7.5 says for a
claimer (D10). *browser*

**GYM-6.33** Given Dony is out, then his schedule never causes a run: he
lifts only on equipment already on the floor, as today, and the room's
stored layout is the same as it would be without him. *HTTP* (with Dony's
visit moved a full block into the past by the test hook, every station's
equipment and placed time are unchanged) (D3)

#### Leaving, finishing, closing, Away

**GYM-6.34** Given a run is playing for Mia's claim, when she finishes or
leaves the room, then the run carries on and puts the equipment down (it
stays on the floor, GYM-3), her avatar goes as it does today, and the
station shows unclaimed. *browser*

**GYM-6.35** Given a run is playing, when the room closes (the host ends it,
or the last person leaves), then every open page goes where it goes today
when a room closes; nothing of the run shows anywhere afterwards, and the
closed room's stations are kept as stored. *browser*

**GYM-6.36** Given Ji-woo is Away (her page closed, or her phone locked and
the stream dropped), then she never sees the run, then or later: when she
comes back, the equipment is in place (GYM-6.19). On other screens, workers
walk past her faded avatar as past anyone's. *browser*

#### The claimer's own screen

**GYM-6.37** Given Mia chooses a lift that needs a run, then her own screen
plays it exactly once, like everyone else's: it starts once the server has
accepted the claim, never earlier on a guess (ADR 0004 rejected guessing),
and doesn't start again when her page swaps its panel in place after the
choice. *browser*

**GYM-6.38** Given Mia's choice doesn't reach the server (no connection, a
server error), then no worker appears on any screen, and her panel does
what it does today for a choice that failed. *browser*

**GYM-6.39** Given Mia double-taps Choose, chooses the same lift in two
tabs, or chooses the other exercise on the same machine, then at most one
run plays, and none if the equipment was already hers. *HTTP* (the repeat
claim changes no station's equipment or placed time) and *browser*

#### The server log

**GYM-6.40** Given any claim, then the server log has one line for it, as
today's `station.claim`: the person's id and display name, the room, the
exercise, the slot, whether the equipment was already there, delivered or
swapped, and, for a swap, which equipment was carried out. Nothing is
logged per screen or per worker. No line holds a password, token, passcode
or full email (OPS-1, OPS-2). *judged* (read the log by hand, as ADR 0006
does)

#### How it feels, and the showcase

**GYM-6.41** Given a room of twelve on laptops and phones, nobody lifting,
when people choose lifts to see what happens, then runs start from the
first Choose with no set logged, a crowd of workers reads as a funny rush
hour of staff rather than a mess or a wait, every tag stays readable, and
Choose, Done and Start set respond as quickly as in an empty room. If the
rehearsal shows clutter instead, the noted fallback in Scope (at most 6
workers on a screen) goes back to the user (D1). *judged* (at the showcase
rehearsal) and *browser* (the dock is never covered)

**GYM-6.42** Given Mia is alone in the room (the usual case), then her run
plays exactly as in a full room, and the worker makes the gym feel staffed
rather than empty. *judged*

**GYM-6.43** Given the worker, then his comedy is in his own build and
effort (the shoulders, the load), never aimed at anyone: no sighing,
eye-rolling, pointing or comment at the claimer or what they lift (banter,
not shame). *judged* — With strangers: he is staff and aimed at nobody, so
he reads the same between strangers.

### GYM-7: never in the way of logging

> The delivery never blocks logging. The person can tap **Start set** at
> once; their avatar waits by the station until the worker has put the
> equipment down.

**GYM-7.1** Given Mia's choice has started a run, then her panel turns
Lifting at once, as for equipment already on the floor: Done is in the dock
straight away, enabled, in its usual place and size, and for a timed lift
the stopwatch's Start works straight away. Nothing in her panel waits for
the put-down. *browser*

**GYM-7.2** Given Mia chose a lift that needed a delivery or swap, when she
logs a set at once (Done straight after the choice), then the server
accepts and stores it exactly as it would with the equipment already on the
floor, and her rest starts. *HTTP*

**GYM-7.3** Given a choice that needs a run, then the server answers it as
quickly as a choice of equipment already on the floor: the answer never
waits for the run. *HTTP* (the answer, and the room update on another
member's stream, both arrive within a second)

**GYM-7.4** Given a run is playing on Mia's screen, then nothing about it
(the worker, the station, the line in GYM-7.6) covers, moves, resizes or
disables her dock's button, the emoji tab or her set's fields, and nothing
opens a dialog or takes focus. *browser* (at 390 px and 1280 px the dock's
button has the same box with and without a run)

**GYM-7.5** Given Mia's claim has started a run on a screen, then on that
screen her avatar doesn't set off while the worker is on the map: it stays
at its waiting spot, standing in the standing figure and holding nothing
(by the lockers if she was Idle, at the cooler if she was Resting, on the
aisle tile in front of her old station if she was on a machine or sitting
in front of one, or where it had got to if it was walking). Its tag and
accessible name already say Lifting and the new lift (GYM-6.29). Only once
the station is clear, the worker gone at the entrance, does it walk to the
station, step onto the machine and start its animation (D10). The worker's
run keeps its own ceiling (GYM-6.7); there is no separate limit on her walk
after it. A screen that is catching up, or has reduced motion, draws her
on the machine at once, as GYM-6.19 and GYM-6.25 say. *browser*

**GYM-7.6** Given a run for Mia's own claim is playing on her screen, then
her panel shows "Equipment's on its way. Start whenever 🚚" (copy bank),
from when her screen learns of the claim until the put-down on that screen,
and then it goes. The line on screen is hidden from screen readers
(`aria-hidden`); instead it is announced once, without the emoji
("Equipment's on its way. Start whenever"), by writing it to the page's
existing live region, `#sheet-news` (`role="status"`) (D8), and nothing is
announced at the put-down. Where it sits
is the designer's call. It never shows on anyone else's screen, after a
reload or reconnect, under reduced motion, or when no run is playing (D6).
*browser*

**GYM-7.7** Given Mia taps Done while her avatar is still at its waiting
spot (the station isn't clear yet), then she turns Resting at once (her
panel, and every screen within a second), her avatar leaves for the cooler
from its waiting spot at once, without waiting for the worker and without
ever playing the machine's animation (GYM-10.18), the run carries on to its
end, and the line in GYM-7.6 goes with the Lifting panel. *browser*

**GYM-7.8** Given Mia is Resting on a station she holds, when she taps Start
set, then no run starts, since she keeps her station and its equipment
(GYM-3), and she goes back to her machine as today; if a run to it is still
playing on a screen, she stays at the cooler, standing, until the station
is clear, then walks, as in GYM-7.5 (D10). *HTTP* (Start set changes no
station's equipment or placed time) and *browser*

**GYM-7.9** Given someone else's run is playing (Tom's worker crossing the
map), then Mia's panel, dock and screen reader get nothing from it: no line,
no announcement, no change to her buttons. *browser*

**GYM-7.10** Given the Anchor's routine (choosing a lift that isn't on the
floor, then logging sets as fast as they like), then a run never makes
logging slower than in Hevy or Strong: no extra tap, no wait, nothing to
dismiss. *judged*

## Open questions

None. All seven were settled on 4 Nov 2026; see Decisions.

## Decisions

D1 to D9 are dated **4 Nov 2026**. The user accepted the recommended answer
to each of Q1 to Q7, relayed by the main agent, and for D1 asked that the
cap stay a noted fallback, not a criterion; D8 and D9 came from the design
review. D10 is dated **5 Nov 2026**: the user's own change after trying the
build. The criteria above are written to match.
The three spec changes these need (GYM-6's swap sentence, BOT-3's
deliveries clause, the data-model sentence about `placed_at`) are made by
the main agent, not here.

| # | Question | Decision | Why | Criteria |
| --- | --- | --- | --- | --- |
| D1 (Q1) | How many workers when several claims need a run at once? | One worker per delivery or swap, all at once, in single file on the shared aisles; no queue and no cap. A cap of 6 workers on a screen is a noted fallback in Scope, to raise again if the showcase rehearsal looks cluttered, not a criterion. | Each run's timing depends only on its own claim, so every screen agrees and a restart changes nothing; a queue would leave the last person at the showcase waiting about 30 s by their station. | GYM-6.12, GYM-6.13, GYM-6.41 |
| D2 (Q2) | What does a swap look like? | One trip: the worker walks in carrying the new piece, swaps it for the old at the station, and staggers out carrying the old one. Changes GYM-6's "first carries the old equipment out". | Keeps a swap inside system.md's "about 4 s" and the claimer's wait under about 2 s, so the Anchor is on the machine almost as fast as for a delivery; the joke still lands. | GYM-6.7, GYM-6.9, GYM-6.10, GYM-6.16 |
| D3 (Q3) | Does Dony's schedule cause runs? | No. He lifts only on equipment already on the floor, as built; BOT-3's "at most two deliveries a block" is reworded to match. | Dony holds no station and touches nothing stored (BOT-5), which is why he survives a restart for free; people's first Choose already gives the showcase its runs. | GYM-6.33 |
| D4 (Q4) | A station changes again before its equipment is down? | The first worker turns round and carries his piece back out; a new worker does a delivery or swap against whatever the station shows then. | Keeps every station settled within about 4.5 s of its last change, and reads as a gag, not a glitch; nobody vanishes and nobody waits behind a pointless run. | GYM-6.16 |
| D5 (Q5) | The timing numbers | A delivery or swap takes at most 4.5 s from appearing to leaving; the equipment is down within 2.5 s of the worker appearing; workers in single file are at least one step apart, and twelve at once are all gone within 5.5 s; a live screen that learns of a claim 3 s or more after its placed time draws it in place (2.999 s plays, 3.000 s doesn't). | The farthest station is about 1.5 s from the entrance at 8 tiles a second, so 4.5 s is "about 4 s" with room to spare; 3 s covers a slow gym connection without a worker appearing long after everyone else's has gone. | GYM-6.7, GYM-6.13, GYM-6.21 |
| D6 (Q6) | What do the squad list and accessible names say mid-delivery? | The server's state straight away ("Mia, lifting, deadlift on lifting platform 5"), with nothing about the delivery. Only the claimer hears the copy-bank line, once. | Other people's changes stay quiet (system.md section 12); announcing a two-second decoration twice would only be noise. | GYM-6.29, GYM-7.6 |
| D7 (Q7) | Does equipment ever leave on its own? | Not in this build: equipment leaves only when a swap needs its station. Settles the spec's open question for this build. | No requirement needs it, and changing the layout on a clock is awkward on a machine that sleeps when idle (GYM-12). | none (Scope) |
| D8 | How the claimer's copy-bank line reaches a screen reader (design review, `docs/design/room/spec.md` D.7) | Settled by the user, taking the recommended answer. The line on screen (the docket) is `aria-hidden`; it is announced once by writing it to the page's existing live region `#sheet-news` (`role="status"`), with the emoji dropped. | `#sheet-news` already announces reliably after in-place swaps; a screen reader would read the 🚚 aloud. | GYM-7.6 |
| D9 | What "turns round at once" means (design review, `docs/design/room/spec.md` D.10) | Settled by the user, taking the recommended answer. On the worker's next 125 ms step. | Workers move one tile a step (system.md section 11), so the turn lands on the next step, never mid-tile. | GYM-6.16 |
| D10 | When does the claimer's avatar walk to a station that has a run? **Changed 5 Nov 2026**, by the user after trying the build; revises `animations.md` GYM-10.19's waiting tile, and D2's "claimer's wait". | The worker comes in, puts the equipment down and walks back out; only once he has gone (removed at the entrance) does the avatar start walking to the station. Meanwhile it stays where it is, standing (on the aisle tile in front of its old station if it was on a machine), its tag and accessible name already saying Lifting and the new lift. The docket still goes at the put-down. Done while waiting still sends it to the cooler at once. Anyone else heading to that station, Dony included, also waits until every run for it is over, turn-rounds included. A screen that opens, reloads or reconnects mid-run, or has reduced motion, draws them on the machine at once. The 4.5 s ceiling for a run stays; there is no ceiling on the avatar's walk after it. | The worker and the claimer walking at the same time looked messy in the build. Logging is untouched: the panel, Done and the stopwatch never waited for the avatar (GYM-7.1). | GYM-6.6, GYM-6.10, GYM-6.15, GYM-6.16, GYM-6.22, GYM-6.32, GYM-7.5, GYM-7.7, GYM-7.8 |
