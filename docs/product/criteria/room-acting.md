# Acceptance criteria: Acting out interactions (walking over, gestures, body reactions)

- **Area**: Interactions and messages, and the gym (`docs/product/spec-4-weeks.md`),
  plus Dony. A third round on the room page, after `int.md`, `animations.md`
  and `room-feel.md` (all agreed and left as they are; this file adds to them
  and lists below exactly where it overrides them).
- **Requirements covered**, all **proposed for the spec** (none is in it yet),
  all P1:
  - **INT-13**, walking over to act an interaction out;
  - **INT-14**, acting from a machine: a gesture and an effect that travels;
  - **INT-15**, the target's body reacts;
  - **INT-16**, the High-five acted out;
  - **BOT-8**, Dony and acted-out interactions.
- **Status**: agreed
- **Date**: 5 Nov 2026 (drafted and agreed the same day: the user accepted
  every recommendation, A1 to A7, and R1 to R8 stand; A8 added the same day
  from a gap qa found, chosen by the user; see Decisions).
  Numbering: **A1 to A7** and **R1 to R8** are this file's own; a bare D
  number is `int.md`'s or `animations.md`'s (named each time), and F or R
  numbers cited as `room-feel.md`'s are that file's.

## The request

The user, 5 Nov 2026, after trying the build (translated): "The interactions
now are only banners, with no actions; isn't that a bit monotonous?" Today a
Cheer, Poke, Slap, reply or High-five plays a small effect over the target's
tile with a 1 to 2 px jolt; neither body moves, so at 1× the move is easy to
miss and the banner is all that reads.

Given options, the user chose **"by state, walk over or stay put"**:

- A sender who is **Idle, Resting or Slacking** walks to the target, does
  the move there, and walks back to where their state puts them.
- A sender who is **Lifting** (on a machine, mid-set) stays on the machine,
  makes a gesture there, and the effect travels across to the target. They
  never leave the machine.
- The **target reacts with their body** too (recoils from a slap, hops at a
  cheer), not only with an effect drawn over them.

## What this file overrides

Everything not listed here in `int.md`, `animations.md`, `room-feel.md` and
`docs/design/system.md` still holds.

| Earlier decision | Where | What this file does | Decided by |
| --- | --- | --- | --- |
| **"The sender's avatar walking over to the target"** in Scope, Out ("the sender's avatar stays put; only the target reacts") | `int.md` | **Reversed for senders who aren't Lifting.** An Idle, Resting, Slacking or Finished sender's avatar walks over and back. A Lifting sender still never leaves the machine (int.md's reason, kept). | the user's choice; A6 |
| **D7**: reactions are "effects drawn over whatever pose the avatar is in … never new body frames"; and **INT-11.2** ("never new body frames") | `animations.md`; `room-feel.md` | **Reversed for the poses off a machine**: the target, and a walking sender, get new body frames for each move. On a machine, a target keeps the machine's animation, with the effect and a jolt. | the user's choice; A3 |
| **"The sender walking over for a High-five or a reply"** in Scope, Out; and **INT-10.6** "both avatars play the High-five … where each one is (neither walks)" | `room-feel.md` | **Reversed**: a High-five, a reply and a Cheer from the PB banner are acted out like any interaction (INT-16, INT-13). | A4 |
| **INT-3.1**: the reaction plays "within a second" | `int.md` | The sender sets off within a second, but the target's reaction plays when the sender's move lands: at most 3 s after the interaction reaches that screen (INT-13.9). | A1 |
| **INT-3.2 and INT-3.5, room-feel INT-12.1**: the target's banner and sound come when the interaction arrives | `int.md`, `room-feel.md` | The target's banner and sound wait for the move to land (same 3 s cap), so the words and the act are one moment. The room log line still appears within a second. | A1 |
| **GYM-10.21**: an avatar is drawn only from what the server reports now | `animations.md` | A sender's avatar may be away from its state's place for one errand (at most about 6 s), purely on screen. The server's state, station and timers are untouched; a screen that opens mid-errand draws everyone where their state puts them. | R1 |
| **BOT-6.7**: Dony answers an interaction with an emoji "about a second after" it is accepted | `int.md` | **Refined on screen only**: each screen holds his answer back until the move has hit him plus about 0.5 s, at most 3.5 s after the interaction arrived (BOT-8.8). The server's planned time, his choice of emoji and his 10 s cap are unchanged. | A8 |
| **INT-11.4**: a reaction lasts at most 1.5 s | `room-feel.md` | Still true of the move itself. The walk there and back is extra and bounded separately (INT-13.8). | R1 |
| **System.md section 11**: "Interaction reactions … are effects drawn over any pose" | `docs/design/system.md` | Adds walking over, gestures from a machine, travelling effects and body reactions. | the user's choice |

**Not overridden**, and binding on everything below: `int.md` INT-1.5 (the
sender's panel is exactly as it was), INT-2 (who may do what, decided on the
server), INT-3.8 (a reaction on someone on a machine leaves their machine
animation playing; kept by A3), INT-3.17 (the slap is
slapstick, never on the body or over the face, never a red mark), INT-4
(the 10 s limit, counted on the server); `animations.md` GYM-10.24 (twelve
animating avatars never slow Start set or Done), GYM-15.5 (a tag on a
station never moves with the animation); `room-feel.md` F12 (the High-five
offer's bubble is drawn under every avatar); and README's third promise:
nothing playful sits between a person and Start set or Done.

## Terms

Terms from `int.md`, `animations.md` and `room-feel.md` keep their meanings
(sender, target, interaction, reply, High-five, offer, reaction, banner,
state, Away, walk, still frame, tag, PB).

- **Acted move**: one of Cheer, Poke, Slap, Thanks, Poke back, Slap back, a
  Cheer sent from a PB's room banner, and a High-five that happens. Presets
  and emoji are not acted moves (A5).
- **Walker**: a sender who acts a move out by walking over: Idle, Resting,
  Slacking or Finished (A6) when the server accepted the move.
- **Gesturer**: a sender who acts from where they are: Lifting when the
  server accepted the move, on their machine or waiting beside their
  station for a delivery.
- **Errand**: a walker's trip: from their place, along the aisles, to the
  **meeting spot** beside the target, the move, and back to where their
  state puts them.
- **Meeting spot**: a floor tile beside the target, close enough that the
  two read as together at 1×, reachable along the aisles, never on a
  machine. For a target on a station, the aisle tile in front of it.
- **The hit**: the moment the move lands on the target: when a walker does
  the move at the meeting spot, or when a gesturer's travelling effect
  reaches the target.
- **Travelling effect**: a small pixel effect (a heart, a finger, a glove,
  a palm, chosen by the designer per move) that flies from a gesturer, or
  from wherever an errand was cut short, to the target.
- **Body reaction**: new body frames the target plays at the hit (hop,
  recoil, startled jump), then back to their pose.
- **Cut short**: an errand that ends before its hit (INT-13.10 to 13.14);
  its move is then delivered by travelling effect, so it is never lost.

## Scope

**In**

- Which moves are acted out, and how each sender's state decides walking
  or gesturing (INT-13.1 to 13.3, INT-14).
- The errand: where the walker goes, the path, how long it may take, and
  everything that can interrupt it: the sender's own state changing, the
  target moving or leaving, a second move, the room closing.
- When the target's banner, sound and reaction land relative to the walk.
- The gesture and travelling effect for a Lifting sender.
- Body reactions per move, and how they combine with the target's pose (on
  a machine, at the cooler, slacking on the phone, by the lockers, walking).
- The High-five acted out by both people.
- Dony as a target (he reacts with his body) and as a High-five partner.
- What must stay instant: the sender's panel, Start set, Done, the server.
- Reloads, late screens, reduced motion, keyboard and screen readers.
- What the server must provide.

**Out, with the reason**

- **A Lifting sender leaving the machine**, even for a moment. It would
  look like they stopped their set (the false-slacking risk) and is what
  `int.md` ruled out; the user kept it.
- **Walking for presets and emoji** (A5). A preset is speech, shown in a
  bubble that already names the addressee; at one every 2 s a room of
  presets would keep avatars running. Emoji are addressed to nobody.
- **Anything stored or decided on the server about a walk.** The errand is
  drawn on each screen from the interaction's event and the room as it is;
  nothing about it is kept, and no state, station, rest, slacking time,
  limit or logbook changes because of it.
- **Facing directions or turning towards the target.** Every body faces the
  viewer (`animations.md`, "Walking in four directions" is out).
- **Body reaction frames for each of the eight machines** (A3): 8 machines
  × 7 moves × 2 frames, for people and Dony's head, in the same week as the
  standing ones.
- **Queues of errands** (A2). One errand per avatar at a time.
- **Free pathfinding.** The walk uses the existing aisle route (GYM-10).
- **Sound for the walk.** Sounds are as `room-feel.md` INT-12; only their
  timing moves (A1).

**What this makes harder later**

- **Strangers: a stranger's avatar walking right up to yours** is more
  intrusive than a banner: it is physical closeness in the gym's terms. A
  stranger room may need acted moves only between people who have
  High-fived (mutual consent), or a setting to receive moves as travelling
  effects only. Mute (MVP spec) would also have to stop a muted person's
  errands to you.
- **Strangers: a slap acted out in body frames** (a visible recoil) reads
  more strongly than an icon. INT-7's slap setting would need to cover the
  acted slap, and Slap back.
- **Every new pose costs body reaction frames.** A new standing-type pose
  (Finished's flex, if it becomes a resting pose) needs the reactions drawn
  for it, or falls back to the jolt and effect.
- **Every new machine** stays cheap only while A3 holds (no reaction frames
  on machines).
- **Layered clothing later** (MVP spec) multiplies every new body frame here
  by every layer.
- **Busier rooms are busier maps.** In a room of twelve, errands make the
  map harder to read at a glance; INT-13.18 sets the bar, and a later
  "calm map" setting may be wanted.

**Existing behaviour this changes or exposes**

- **The interaction event carries the target's state but not the
  sender's** (`InteractionEvent` in `src/lib/interactions.ts` has
  `targetState`). Whether a sender walks or gestures must be the same on
  every screen, and a screen's own view of the sender can be a moment
  stale; so the server should stamp the sender's state at acceptance into
  the event, as it already does for the target. This is the one thing the
  server must add (INT-13.20). Nothing is stored.
- **Walking already exists** (`walk()` and `route()` in the room page and
  `src/lib/floor.ts`): 125 ms a tile along fixed aisles, re-routing from
  wherever the avatar has got to, skipped under reduced motion and when a
  stream reconnects. On this 10 × 10 map the longest aisle route is about
  14 tiles, so a one-way walk is at most about 1.75 s. Errands reuse it.
- **A walking avatar holds nothing** (`animations.md` GYM-10.17), so a
  Resting walker's bottle and a Slacking walker's phone are not drawn while
  they walk; each takes its pose again on return.
- **Reactions today** are an svg over the tile with a jolt (`react()` in the
  room page), played as soon as the event arrives; the banner and sound are
  also immediate. Both move to the hit (A1).
- **Dony's High-five acceptances** are planned from stored offers
  (`room-feel.md` BOT-7.3); he walks to accept by the same rule as a
  person (BOT-8.3, A7). His
  schedule is unchanged either way.

**Spec and design-system changes this needs** (not made here):

In `docs/product/spec-4-weeks.md` (the main agent's):

1. **New P1 rows**, worded as the "Proposed wording" under each heading
   below: INT-13 (walking over), INT-14 (acting from a machine), INT-15
   (the target's body reacts), INT-16 (the High-five acted out) in
   Interactions and messages; BOT-8 (Dony and acted-out interactions) in
   Dony.
2. **INT-3 reworded**: "An interaction is acted out on the map (INT-13,
   INT-14). The target's reaction, banner and sound land when the move
   does, at most 3 s after it arrives; the room log has it within a
   second."
3. **The art table** ("What has to be drawn", Avatar body): replace
   "Slapped, poked and cheered reactions are effects drawn over any pose,
   not body frames" with "Body reactions to each move for the standing,
   resting and sitting poses; the walker's move frames (slap, poke, cheer,
   thanks, high-five); a gesture for a lifter; a travelling effect per
   move. On a machine, reactions stay effects."
4. **Data model / real time**: the interaction event, and Dony's
   High-five acceptance, carry the sender's state at acceptance; nothing
   new is stored.
5. **Risks**: "An acted slap reads more strongly than an icon" (slapstick
   recoil, never on someone Lifting or Finished, INT-7 later);
   "Errands make a busy map hard to read" (one errand per avatar, 6 s cap,
   no queues).

In `docs/design/system.md` (the designer's):

6. **Section 10, the gym art**: body reaction frames for standing,
   resting and sitting; walker move frames; gestures; travelling effects;
   all on the people's frames so Dony gets them too.
7. **Section 11, motion and sound**: "Interaction reactions are effects
   drawn over any pose" becomes: senders not Lifting walk over and back
   (same walk pace), Lifting senders gesture and an effect travels (at
   most 1 s), the target reacts with their body off a machine; the hit
   lands at most 2.5 s (capped at 3 s) after the move arrives; an errand is
   back within 6 s; reduced motion shows one still frame on each side, no
   walk, no travelling effect.
8. **Section 12, accessibility**: a walking avatar stays selectable, keeps
   focus and its accessible name; nothing about a walk is announced.

Criteria files, for the record (not edited here): `int.md` Scope's "the
sender's avatar walking over" line, `animations.md` D7, and `room-feel.md`
INT-10.6 ("neither walks") and INT-11.2 ("never new body frames") are
overridden by this file, as the table above says.

## Criteria

Each criterion says how it can be checked: **HTTP** (a request against the
running app), **browser** (needs the page's script, Playwright) or
**judged** (a person has to look). Names follow system.md section 13: Mia,
Ji-woo, Tom, Priya. Unless stated, all are members of the same open room,
each signed in in their own browser with the room open. "Every screen"
means every open screen in the room, the sender's and target's included.

### INT-13 (proposed for the spec): walking over

> *Proposed wording:* A sender who is Idle, Resting, Slacking or Finished
> when their Cheer, Poke, Slap or reply is accepted walks along the aisles
> to beside the target, does the move there, and walks back, on every
> screen. The target's reaction, banner and sound land when the move does,
> at most 3 s after it arrives. Nothing about the walk changes anyone's
> state, station or workout, or delays Start set or Done.

**INT-13.1** Given Mia is Resting at the cooler and her slap on Ji-woo
(Slacking in front of the flat bench) is accepted, then within a second, on
every screen, Mia's avatar sets off from the cooler, walks along the aisles
to the meeting spot in front of Ji-woo's station, does the slap there (the
hit), and walks back to the cooler, where she takes her resting pose again.
*browser*

**INT-13.2** Given the sender is Idle (by the lockers), Slacking (in front
of their machine) or Finished (by the lockers, A6) when the move is
accepted, then they walk exactly as in INT-13.1, and return to where their
state puts them then. Whether the sender walks is decided by their state as
the server reported it when it accepted the move, the same on every screen,
not by what any one screen was showing. *browser* (A6)

**INT-13.3** Given the sender is Lifting when the move is accepted, then
they don't walk: INT-14 applies. *browser*

**INT-13.4** Given these moves, then each is acted out by INT-13 or INT-14
by the sender's state: Cheer, Poke, Slap, Thanks, Poke back, Slap back, and
a Cheer sent from a PB's room banner (which is a Cheer, `room-feel.md`
GYM-18.2). A High-five is acted out by INT-16. A preset or an emoji is not
acted out: no one walks or gestures for it, and it shows as `int.md` says
(A5). *browser*

**INT-13.5** Given Mia walks over, then the meeting spot is a floor tile
beside Ji-woo, close enough that the two read as together at 1×, never on
a machine and never over Ji-woo's tag. Given Ji-woo is on a station, it is
the aisle tile in front of her station. Given another avatar already stands
on the nearest such tile, Mia takes the next free tile beside Ji-woo; if
none is free, she shares a tile and is drawn so that both tags can still be
read. *browser* and *judged*

**INT-13.6** Given the sender is already beside the target when the move is
accepted (both standing by the lockers; or Mia still at the meeting spot
from her slap when Ji-woo, beside her, taps Slap back), then the sender
doesn't walk: the hit happens at once where they are. *browser*

**INT-13.7** Given Mia walks, then she shows the walk (two frames, holding
nothing, `animations.md` GYM-10.17) at the existing pace of about 8 tiles a
second, along the aisles as every walk does. Her tag walks with her and
keeps showing her state (a Slacking walker's tag still says Slacking). Her
own station, if she holds one, stays hers and shows unoccupied while she is
away from it. *browser*

**INT-13.8** Given any errand that isn't cut short, then from the
interaction reaching a screen to the hit is at most 2.5 s on that screen,
the move itself takes at most 1.5 s (`room-feel.md` INT-11.4), and the
walker is back where their state puts them at most 6 s after the
interaction reached that screen. *browser* (the longest route on the map,
cooler to the far corner station, within these bounds)

**INT-13.9** Given Ji-woo is the target, then her reaction, her banner (with
its reply button, `room-feel.md` INT-9.1) and her sound (`room-feel.md`
INT-12.1) all land together at the hit on her screen, and never later than
3 s after the interaction reached her screen: if the hit hasn't happened by
then, the move is delivered by travelling effect at that moment (INT-13.14)
(A1). *browser*

**INT-13.10** Given the room log, then the interaction's line appears on
every screen within a second of acceptance, as today (`int.md` INT-5.7),
without waiting for the hit. The sender's own confirmation sound and
confirmation line (`room-feel.md` INT-12.1, INT-11.5) also come at
acceptance, not at the hit: what the sender sees at once is their avatar
setting off. *browser*

**INT-13.11** Given Mia is walking to Ji-woo, when Mia taps Start set, Done,
Choose a lift, Finish or Leave, then her own panel does exactly what it
would have done without the errand, at once, with nothing waiting for her
avatar (`int.md` INT-1.5). On every screen her avatar abandons the errand
and heads from wherever it has got to for the place her new state puts her
(on Start set: her machine, `animations.md` GYM-10.18; on Leave: out of the
room). The errand is cut short: Ji-woo's move arrives by travelling effect
from where Mia's avatar was, at once. *browser*

**INT-13.12** Given Mia is walking to Ji-woo, when Ji-woo's own place
changes (she taps Start set and heads for her machine, or her rest turns
Slacking and she walks to her station), then Mia re-routes to beside
Ji-woo's new place, from wherever she has got to, and the hit happens
there; if Ji-woo is still walking when Mia reaches her, the hit happens
beside her where she is. Either way the 3 s cap of INT-13.9 still holds.
*browser*

**INT-13.13** Given Mia is walking to Ji-woo, when Ji-woo leaves the room
(or the room closes), then Mia turns back at once to where her state puts
her, and no reaction plays; if the room closed, the page does what it does
today. Given Mia leaves the room mid-errand, then her avatar leaves as
anyone's does, and Ji-woo's move arrives by travelling effect at once.
*browser*

**INT-13.14** Given an errand is cut short (INT-13.9, INT-13.11, INT-13.13,
INT-13.15), then its move is never lost: the travelling effect flies from
where the sender's avatar is to the target, and the target's reaction,
banner and sound land as it arrives. Every accepted move plays on its
target on every screen exactly once. *browser*

**INT-13.15** Given Mia is on an errand to Ji-woo, when her next move, to
Tom, is accepted, then the errand to Ji-woo is cut short (INT-13.14, unless
its hit has already happened) and Mia heads for Tom from wherever she is.
An avatar has one errand at a time; errands never queue (A2).
*browser*

**INT-13.16** Given Mia and Tom are both walking to Ji-woo at once, then
each goes to their own meeting spot beside her (INT-13.5), each hit plays
its own reaction when it lands, and Ji-woo's banner shows the newest, each
replacing the last (`int.md` D9). *browser*

**INT-13.17** Given the 10 s limit, then it is counted on the server from
acceptance, as before (`int.md` INT-4.2), and the walk changes nothing about
it: Mia's menu on Ji-woo shows Cheer, Poke and Slap unavailable for 10 s
from acceptance whether her avatar is walking, at the meeting spot or back.
Because an errand ends within 6 s, the same sender's next move to the same
target never meets their own errand still running. *HTTP* and *browser*

**INT-13.18** Given the showcase, twelve people and Dony, everyone sending
moves as fast as they're allowed for a minute, then: Start set and Done
respond as quickly as in an empty room on a phone at 1×; every avatar can
still be told apart by its tag, apart from a moment while two pass each
other; every walker gets back to their place; and the room reads as busy
and funny, not chaotic. *judged* (at the rehearsal) and *browser* (the dock
is never covered; no errand lasts over 6 s)

**INT-13.19** Given any errand, then the server's state for everyone is
exactly what it would have been without it: no one's state, station,
station's last-used time, rest, slacking time, set, Away flag or room
activity changes because of the walk. A Slacking walker's slacking time
keeps counting. *HTTP* (the room as read before, during and after an
errand, from another member's stream, differs only by time)

**INT-13.20** Given an accepted interaction, then the event every member
receives says what the sender's state was when the server accepted it, as
it already says the target's; that is the only new thing the server
provides for this file. No position, walk or errand is stored, decided or
sent by the server. *HTTP*

**INT-13.21** Given a screen opens, reloads or reconnects mid-errand (or
after a server restart), then it replays no errand, walk, gesture, effect or
reaction: everyone is drawn at once where their state puts them (`int.md`
INT-3.6, `animations.md` GYM-10.21). *browser*

**INT-13.22** Given Mia's avatar is walking, then it can still be selected by
tap, click or keyboard, opening her menu as usual (`int.md` INT-1); a menu
already open on her stays where it opened and doesn't follow her; keyboard
focus on her avatar stays on it while it moves, and the tab order doesn't
change. Her accessible name stays the one her state gives ("Mia, resting,
flat bench 2"), never "walking to Ji-woo", and nothing is announced about
the walk. *browser*

**INT-13.23** Given someone has reduced motion turned on, then on their
screen nobody walks: a walker's move shows as one still frame of the move
at the sender's place and one still frame of the reaction on the target,
for about a second, at the moment the interaction arrives; no travelling
effect moves. Banners, sound and the room log are unchanged. *browser*
(emulated media)

**INT-13.24** Given the showcase, then walking over to slap a friend reads
as slapstick and walking over to cheer reads as a mate coming over, never
as a confrontation; and a walk back is quick enough that nobody wonders why
someone is wandering. *judged* — With strangers: an avatar walking up to
yours is physical closeness in the gym's terms (see "What this makes harder
later").

### INT-14 (proposed for the spec): acting from a machine

> *Proposed wording:* A sender who is Lifting stays on their machine and
> makes a short gesture, without stopping their animation's place on the
> machine, and an effect for the move travels across the map to the target.
> They never leave the machine.

**INT-14.1** Given Mia is Lifting on the squat rack and her cheer on Ji-woo
is accepted, then on every screen Mia makes a short gesture on her machine
(the designer's: a raised hand, a nod, a point, drawn over or in place of
her animation for under a second), and a travelling effect for a Cheer
flies from Mia to Ji-woo; the hit is when it arrives. Mia stays on the
machine throughout, her tag doesn't move (`animations.md` GYM-15.5), and her
animation carries on after the gesture. *browser*

**INT-14.2** Given Mia is Lifting and waiting beside her station for a
delivery (`animations.md` GYM-10.19), then she gestures where she stands and
doesn't walk. *browser*

**INT-14.3** Given Mia is Lifting after a cardio set (still on the
treadmill, LOG-4), or Lifting after a rest more than 30 minutes over, then
she counts as Lifting here too and gestures from where she is. *browser*

**INT-14.4** Given a travelling effect, then it reaches the target at most
1 s after it sets off, may pass briefly over tags, avatars and machines on
the way, never stops on anyone else's tag, and never covers the dock, the
emoji tray, the menu or a banner. Each move has its own effect, telling the
kinds apart (a Slap's is never mistaken for a Cheer's, and never looks like
the 👋 Hi emoji, `int.md` INT-3.17). *browser* and *judged*

**INT-14.5** Given Mia gestures, then her own panel is exactly as it was:
the same fields, the stopwatch still running, Done in the same place, and
her next tap on Done logs the set as it would have (`int.md` INT-1.5).
*browser*

**INT-14.6** Given Mia's state changes from Lifting while her effect is in
flight (she taps Done), then the effect carries on to Ji-woo, and Mia's
avatar does what Done does (walks to the cooler). *browser*

**INT-14.7** Given the showcase, then a gesture from a machine reads as "I
see you, I'm busy", and the effect clearly comes from that sender, even
with twelve people on the map. *judged*

### INT-15 (proposed for the spec): the target's body reacts

> *Proposed wording:* At the hit, the target plays a short body reaction
> for the move (a hop at a cheer, a startled jump at a poke, a cartoon
> recoil at a slap), then goes back to their pose. On a machine they keep
> lifting, with the effect and a jolt.

**INT-15.1** Given Ji-woo is standing by the lockers (Idle or Finished),
resting at the cooler, or sitting in front of her machine slacking, then at
the hit she plays a body reaction for the move, of new body frames, then
goes back to her pose (A3):

| Move | Her body |
| --- | --- |
| Cheer, and a Cheer from a PB banner | a happy hop or fist pump |
| Poke, Poke back | a startled jump, looking round |
| Slap, Slap back | a cartoon recoil to one side, dizzy for a moment, then back (never knocked down, never hurt-looking) |
| Thanks | a pleased bounce |
| High-five | the High-five itself (INT-16) |

The effect for the move still plays with it. The designer draws them; these
are what each must read as. *judged* (the art sheet) and *browser* (body
frames play for these poses)

**INT-15.2** Given Ji-woo is Lifting on a machine when the hit lands (a
Cheer, a Poke, Thanks or Poke back: a Slap can't reach her, `int.md` D5),
then her machine animation keeps playing, she stays on the machine, and the
reaction is the move's effect with a jolt of the whole sprite, as today
(`int.md` INT-3.8); no machine gets body reaction frames (A3).
*browser*

**INT-15.3** Given Ji-woo is walking when the hit lands (for example, her
rest just turned Slacking and she is on her way to her station), then the
reaction is the effect with a jolt, she keeps walking, and she takes her
pose when she arrives. *browser*

**INT-15.4** Given Ji-woo is resting at the cooler with her bottle, or
slacking with her phone, then her body reaction is drawn with the same
prop or without it (the designer's call), and she holds it again the moment
the reaction ends: her pose afterwards always matches her state. *judged*

**INT-15.5** Given a body reaction, then her tag stays where it is and keeps
saying who she is and her state, her hit area stays at least 44 × 44 px
(`animations.md` GYM-15.3), and the reaction stays inside a space that
never covers a neighbour's tag. *browser*

**INT-15.6** Given every skin, hair style, hair colour and shirt, and Dony's
head, then every body reaction shows them as chosen (`animations.md`
GYM-10.11). *judged* (the art sheet)

**INT-15.7** Given Ji-woo is Away (faded), then her body reaction plays,
faded with her, on everyone else's screen. *browser*

**INT-15.8** Given two hits on Ji-woo less than a reaction apart, then the
newer restarts her reaction; she never plays two at once. *browser*

**INT-15.9** Given any body reaction, then it reads as playful, the same for
everyone, never mocks a body or ability, and the slap's recoil is
slapstick, never pain (banter, not shame). *judged*

**INT-15.10** Given reduced motion, then the body reaction is one still
frame for about a second (INT-13.23). *browser*

### INT-16 (proposed for the spec): the High-five acted out

> *Proposed wording:* When a High-five happens, whichever of the two can
> walk goes to the other, the offerer first; both raise a hand and slap it,
> then the walker goes back. If both are Lifting, both raise a hand on
> their machines and the effect meets between them.

**INT-16.1** Given Mia offers Ji-woo a High-five, then while the offer is
open nobody walks: Mia's raised palm and her offer bubble show at her own
place (`room-feel.md` INT-10.2, F12). The walk starts only when the
High-five happens, so it is never pressure on Ji-woo to accept (A4).
*browser*

**INT-16.2** Given the High-five happens and Mia (the offerer) isn't
Lifting, then Mia walks to Ji-woo (INT-13, an errand), both play the
High-five at the hit, and Mia walks back. Given Mia is Lifting and Ji-woo
isn't, then Ji-woo walks to Mia instead and back. Given both are Lifting,
then neither walks: both raise a hand on their machines and the High-five's
effect meets halfway between them, at the hit (A4). *browser*

**INT-16.3** Given someone in a High-five is on a machine (Lifting), then
they stay on it, keep their animation, and their side of the High-five is a
raised-palm effect drawn at them, not new body frames (A3); the walker,
standing beside the machine, plays the High-five body frames against it.
*browser* and *judged*

**INT-16.4** Given the High-five happens, then Mia's banner ("Ji-woo
high-fived you 🙌"), both people's sounds and Ji-woo's screen-reader line
land at the hit, within the 3 s cap (INT-13.9) (A1). *browser*

**INT-16.5** Given the walker's state changes mid-walk, the other person
moves or leaves, or the walker has another errand, then INT-13.11 to
INT-13.15 apply: cut short, the High-five's effect travels to the other at
once and both still see it happen. *browser*

**INT-16.6** Given the showcase, then two people high-fiving from opposite
corners reads as one coming over for the High-five, and the moment lands
together. *judged* — With strangers: since the walk only follows a mutual
press, this is the one acted move that is consent by design.

### BOT-8 (proposed for the spec): Dony and acted-out interactions

> *Proposed wording:* Dony reacts to acted moves with his body like a
> person. He never walks to anyone on his own; to complete a High-five he
> walks over only if the offerer is Lifting and he isn't. None of it
> changes his schedule.

**BOT-8.1** Given Mia acts a move out on Dony, then she walks or gestures by
her own state exactly as for a person, and Dony plays the same body
reaction a person in his pose would (INT-15), on the people's frames with
his head (`animations.md` D2), or the effect and jolt if he is on a machine.
*browser*

**BOT-8.2** Given Dony's emoji answers (`int.md` BOT-6.7), then he never
walks or gestures for them; they pop above him where he is, as now, held
back on each screen until the move has reached him (BOT-8.8). *browser*

**BOT-8.3** Given Dony accepts Mia's High-five (`room-feel.md` BOT-7.2),
then INT-16.2 applies with Dony as the accepter: if Mia isn't Lifting, Mia
walks to Dony; if Mia is Lifting and Dony isn't, Dony walks to Mia and back;
if both are Lifting, both raise a hand and the effect meets halfway (A7).
*browser*

**BOT-8.4** Given Dony walks to complete a High-five, then his schedule,
state and station are exactly what they would have been: the walk is drawn
on screens only, and if his schedule moves him (his rest ends, he walks to a
machine) while he is on the errand, the errand is cut short (INT-13.11) and
he goes where his schedule says. *HTTP* (his schedule is unchanged) and
*browser*

**BOT-8.5** Given Dony's acceptance event, then it says what his state was
at that moment, worked out from his schedule, so every screen agrees whether
he walks (as INT-13.20). *HTTP*

**BOT-8.6** Given Dony is sent back to his poster mid-errand, then he stops
the errand, walks to the poster and hops in as now (`animations.md`
BOT-2.5); the High-five's effect travels to Mia at once (INT-13.14).
*browser*

**BOT-8.7** Given Dony is out, then he never walks to anyone or gestures at
anyone except to complete a High-five he was offered: he still never starts
anything (`room-feel.md` F8). *browser*

**BOT-8.8** Given Mia's cheer, poke or slap on Dony is accepted and her move
is on its way to him on Tom's screen (she is walking over, or her travelling
effect is in flight), then on Tom's screen no emoji pops above Dony until
that move has hit him: his answer (`int.md` BOT-6.7), and any emoji of his
own that falls in that time, pops at the later of its planned time and the
hit plus about 0.5 s, and never later than 3.5 s after Mia's interaction
reached Tom's screen. Two held back pop in order, each replacing the last
(`int.md` BOT-6.9). Each screen holds back by its own hit, so screens may
differ by up to a few seconds; under reduced motion the hit is at once, so
his answer pops at its planned time. This refines BOT-6.7's timing on
screen only: the server's planned time for his answer, which answers he
gives, and his one-answer-every-10-s cap are unchanged, so `int.md` BOT-6
and `room-feel.md` BOT-7's HTTP checks still hold. A screen that opens or
reloads during the hold shows none of it (`int.md` INT-8.10) (A8).
*browser* (on a second member's screen, Dony's answer to a walked-over
cheer appears after the hit, within 3.5 s of the event) and *HTTP* (the
answer's server time is still about a second after acceptance)

## Open questions

None. All seven were settled on 5 Nov 2026 (A1 to A7), R1 to R8 stand as
written, and a later gap from qa was settled the same day (A8); see
Decisions.

## Decisions

All dated **5 Nov 2026**. The user answered directly (translated): "As
recommended." A1 to A7 accept the recommended answer to Q1 to Q7 of the
draft; R1 to R8 were decided by recommendation in the draft and the user let
them stand. A8 settles a gap qa found later the same day, chosen by the
user directly from three options. The criteria above are written to match.

| # | Question | Decision | Why | Criteria |
| --- | --- | --- | --- | --- |
| A1 (Q1) | When do the target's banner, sound and reaction land? | All three together at the hit, at most 3 s after the move reaches that screen; if the walk hasn't landed by then, a travelling effect delivers it. The room log line, and the sender's own confirmation sound and line, stay at acceptance. | If the words came first, the walk would arrive after the news and stay decoration, which is the user's complaint. Landing together makes the act the event; the 3 s cap keeps the wait short. | INT-13.9, INT-13.10, INT-16.4 |
| A2 (Q2) | A walker sends another move mid-errand | The newest replaces the errand: the first is cut short and delivered by travelling effect; the avatar heads for the new target. Errands never queue. | Like banners (`int.md` D9); a queue would keep someone away from the place that shows their state. Every move is still delivered. | INT-13.15 |
| A3 (Q3) | Body reactions for a target on a machine? | No: on a machine the animation keeps playing, with the move's effect and a jolt. Body reaction frames are drawn only for the standing, resting and sitting poses (Dony gets them through the shared frames). | Saves 8 machines × 7 moves × 2 frames; lifting someone off a machine would look like they'd stopped (false slacking); a Slap can't reach someone Lifting anyway. | INT-15.1, INT-15.2, INT-16.3 |
| A4 (Q4) | In a High-five, who walks, and when? | Nobody while the offer is open. When it happens, the offerer walks to the accepter if not Lifting; otherwise the accepter walks if not Lifting; if both are Lifting, both raise a hand on their machines and the effect meets halfway. | Keeps the walk after the mutual press, so it stays consent and never parks someone beside a target waiting for an answer; fits `room-feel.md` F12. | INT-16.1, INT-16.2 |
| A5 (Q5) | Are presets acted out? | No: a preset stays a bubble above its sender; emoji likewise. Only interactions are acted out. | Presets go every 2 s and are speech; walking for each would keep avatars running and blur which walks are cheers and slaps. | INT-13.4 |
| A6 (Q6) | Does a Finished sender walk over? | Yes, like Idle. | The user's rule is that people walk unless mid-set; Finished people are by the lockers. | INT-13.2 |
| A7 (Q7) | Does Dony walk to complete a High-five when the offerer is Lifting? | Yes, by the same rule as a person (only if he isn't Lifting himself), drawn on screens only, his schedule unchanged. He still never starts anything. | One rule for everyone, as BOT-5 asks; a lone Anchor mid-set gets Dony coming over to them. | BOT-8.3 |
| A8 | Dony's emoji answer (BOT-6.7, about a second after acceptance) could pop before a walked-over move reached him. Raised by qa; the user answered directly ("1"). | Each screen holds back any emoji pop from Dony while a move to him is on its way, until that move's hit plus about 0.5 s, never more than 3.5 s after the interaction reached that screen. The server's planned answer time and his 10 s cap are unchanged. Not chosen: keeping the pop at acceptance; having the server plan with the walk time (would break R8). | His answer must read as an answer to the move, and the server stays the same, so BOT-6 and BOT-7's checks hold and nothing new is stored. | BOT-8.2, BOT-8.8 |

**Decided by recommendation in the draft, left standing by the user:**

| # | Decision | Why | Criteria |
| --- | --- | --- | --- |
| R1 | An errand takes at most 6 s from arrival to back in place; the hit at most 2.5 s; a hard cap of 3 s after which the move is delivered by travelling effect. | The longest route on this map is about 14 tiles (about 1.75 s); the cap keeps "within a second" close and keeps the map honest about states. | INT-13.8, INT-13.9 |
| R2 | A cut-short errand delivers its move by travelling effect, so every accepted move plays exactly once on its target. | The server accepted it and the room log says so; the target must see it. | INT-13.11 to INT-13.14 |
| R3 | The walker re-routes once the target's place changes, and hits beside a target who is still walking. | Simplest rule that never leaves a walker standing beside an empty spot. | INT-13.12 |
| R4 | The sender's confirmation sound and line, and the room log line, stay at acceptance; only the target's banner, sound and reaction move to the hit. | The sender sees their avatar set off, so their feedback is immediate; the log is a record, not the moment. | INT-13.10 |
| R5 | The meeting spot is a floor tile beside the target, the aisle tile in front of a station for someone on one; shared tiles keep both tags readable. | Reads as "together" at 1× without standing on a machine or a tag. | INT-13.5 |
| R6 | A menu open on a walking avatar stays where it opened; the accessible name never mentions the walk; nothing about a walk is announced. | Screen-reader users get the banner and log as before; a chasing menu would be unusable. | INT-13.22 |
| R7 | Under reduced motion nobody walks and no effect travels: one still frame on each side for about a second. | As `animations.md` GYM-10.23 and `int.md` INT-3.9. | INT-13.23 |
| R8 | The server stamps the sender's state (and, for Dony's acceptance, his) into the event; nothing else is new on the server. | Walking or gesturing must be the same on every screen, and a screen's own view can be a moment stale. | INT-13.20, BOT-8.5 |
