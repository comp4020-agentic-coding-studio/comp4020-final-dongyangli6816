# Acceptance criteria: Avatar animations

- **Area**: The gym (`docs/product/spec-4-weeks.md`), the part that decides
  what an avatar shows and where it is: the equipment table's "Exercise
  animation" column, GYM-9, GYM-10, GYM-11, GYM-14 and GYM-15 as far as they
  decide an avatar's look, BOT-2 and BOT-3 for Dony, and AV-1 and AV-3 for one
  label and the editor's preview.
- **Requirements covered**: GYM-9, GYM-10, GYM-11, GYM-14, GYM-15, BOT-2,
  BOT-3 (all P0 except BOT-2 and BOT-3, P1), AV-1, AV-3 (P0). Only their
  animation side is covered here; if a later file covers the rest of these
  requirements, it continues these numbers.
- **Status**: agreed
- **Date**: 19 Oct 2026 (drafted and agreed the same day; see Decisions)

## The request

The user, 19 Oct (translated): "Take this chance to fully redo every workout
animation in the Gen Z style. Right now there are only a few, like resting
and lifting. Redo all of them by equipment, and ideally the person really
interacts with the equipment."

Already decided by the user before this file:

- **One exercise animation per piece of equipment**, not per exercise: eight
  animations, each a two-frame loop (system.md section 10, "two-frame
  animations"). Bench press and Incline bench press look the same.
- **Dony gets every animation a person has.**
- **The person is being redrawn** in the Gen Z style (avatar spec, "Gen Z
  redesign, Oct 19"), so every pose is redrawn anyway, and **the machines are
  already redrawn** with a back and a front layer for a body to go between
  (room spec, "Detail pass, Oct 18").

## Terms

Used with these meanings throughout.

- **State**: what the server reports for a person: Idle, Lifting, Resting,
  Slacking or Finished (GYM-9). **Away** is a flag on top of a state
  (GYM-14).
- **Machine**: any of the eight pieces of equipment, the mat and the dumbbell
  rack included.
- **Animation**: the two-frame loop a machine's user plays while Lifting.
  **Frame 1** and **Frame 2** are its two drawings. Frame 1 is also the
  **still frame**: the one shown when motion is reduced, so it is the frame
  that says the exercise most clearly on its own.
- **Bob**: today's motion for standing figures, where one drawing's upper
  body moves down 2 sprite pixels and back. Different from an animation,
  which swaps two drawings.
- **Walk**: two drawings of the figure facing the viewer, legs alternating,
  shown while an avatar moves along the aisles.
- **On the machine**: the person is drawn on the station's own tile, using
  the machine (on the belt, on the pad, inside the rack, hanging from the
  bar), instead of standing in the aisle in front of it as today.
- **Front parts**: the parts of a machine drawn over the person, so they read
  as in it rather than pasted on it (rails, uprights, posts).
- **Tag**: the name tag in the state's colour above an avatar (ACC-4).
- **Hit area**: everything that selects an avatar when tapped or clicked: its
  tag and its sprite (system.md section 9: at least 44 × 44 px).
- **Within a second**: as GYM-13, on every other open screen in the room,
  with no reload.
- **Holds a station**: GYM-3. A person keeps their station while Resting,
  Slacking or Away, so their machine can be theirs while they stand at the
  cooler.

## Scope

**In**

- Eight exercise animations, one per machine, each two frames, played on the
  machine (the person really using it), for people and for Dony.
- Where each state puts the avatar and what it shows, redrawn on the new
  body with today's motion: Idle and Finished standing by the lockers,
  Resting with the bottle at the cooler, Slacking sitting with the phone in
  front of the machine.
- A two-frame walk for people and Dony, facing the viewer (D1). **It is the
  first thing cut if the week runs short**; GYM-10.17 says what shows
  instead.
- What happens between states: walking to a machine, changing lifts, the
  equipment not there yet, Slacking, Away, the cardio case.
- Tag, hit area, focus and the accessible name for someone on a machine.
- Reduced motion: which frame each animation stops on.
- The avatar editor's label for the `long` hair style (D8).

**Out, with the reason**

- **One animation per exercise** (16). The user chose one per machine; the
  MVP spec does the same ("8 animation categories"). So Overhead press shows
  the squat, Plank shows push-ups, Hanging leg raise shows the pull-up,
  Lateral raise shows the curl and Incline walk shows the run. Accepted.
- **Walking in four directions** (the art table in spec-4-weeks.md). Every
  animation and the walk face the viewer, as the MVP spec's "8 exercise loops
  (front-facing only)". Four directions would quadruple the walk for little
  gain at 32 px.
- **Idle fidgets, a sip at the cooler, a thumb scrolling the phone, and
  Finished's flex and wave** (D1). A dozen drawings for states the Anchor
  never looks at, in the week the worker and the reactions need art.
  Finished's flex can come with GYM-17's flex.
- **Eight sitting drawings, one per machine** (D3). A slacker sits in front
  of their machine in one drawing.
- **Dony drawn frame by frame** (D2). He wears the people's body frames with
  his own head and colours.
- **Anything stored.** No new state, column or timer: the animation is worked
  out on each screen from what the server already reports (state, station,
  the station's equipment), so a cold start draws everyone correctly
  (GYM-12). The server logs nothing new; state changes are logged as today
  (OPS-1).
- **Changing which states the server reports** (D6). The map shows what the
  server reports, including the two cases where someone stays Lifting
  indefinitely; whether those rules change is a separate gym question.
- **Sound.** No sound goes with any animation.
- **Machines moving with nobody on them.** An empty or unused machine stays
  still.
- **Not built yet, and not specified here**: the worker and delivery (GYM-6,
  GYM-7), the interactions and their reactions (INT-1 to 5), the personal-best
  flex (GYM-17) and work in (GYM-16). Where they meet this feature:
  - **GYM-7**: the avatar waits by the station until the worker has put the
    equipment down. GYM-10.19 says where it waits, so the two fit.
  - **INT-3**: a reaction plays on the target's avatar wherever it is.
    Cheer is allowed on someone Lifting (INT-2), so a cheer will play over
    someone lying on a bench or hanging from a bar. **Reactions are effects
    drawn over whatever pose the avatar is in** (stars, sparkles, a jolt of
    the whole sprite), never new body frames (D7), so the art table's
    "slapped, poked and cheered reactions × 2 each" becomes effects, not
    body drawings. INT owns the rest.
  - **INT-1**: the menu opens from the avatar; GYM-15.3 and GYM-15.4 keep the
    avatar selectable while it is on a machine.
  - **GYM-17**: the flex follows a Done, when the person has just left the
    machine for the cooler, so it needs only a standing body frame.
  - **GYM-16**: two people sharing a machine take turns on it; the one
    waiting can use the waiting spot from GYM-10.19.

**What this makes harder later**

- **Every new machine costs a two-frame animation and a front-parts split**.
  Because Dony wears the people's frames (D2), it costs that once, not twice.
  The MVP spec's custom exercises pick "the animation it looks most like",
  which still works: new exercises are free, new equipment isn't.
- **Layered clothing** (the MVP spec's tops, bottoms and shoes) would need
  every layer drawn for every frame of every animation: 8 × 2 more frames per
  layer, plus the walk. Palette swaps (AV-2) stay free. D2 is a first small
  step this way: Dony's violet top is drawn on the shared body, and his open
  bomber would come back as a jacket layer.
- **Strangers.** The animations are neutral, so they read the same between
  strangers. Slacking is the exception (GYM-11.1): see the note there.

**Existing behaviour this changes**

- `src/lib/floor.ts` `spots()` gives every Lifting person one of two poses
  (`stand` on the treadmill, `lift` everywhere else). It must give the
  station's machine instead.
- `src/components/GymMap.astro` draws a person on a station in front of the
  machine, feet dropped 12 sprite pixels into the aisle (`.on-station`), and
  the machines' top 12 rows were drawn to show above their head (room spec,
  "The machines: what their top 12 rows show"). A Lifting person is now on
  the machine; only Slacking keeps the old placement in front of it (D3).
  The room spec's "Who stands where" table changes with it.
- The lift's 500 ms bob becomes a two-drawing swap, at 250 ms on the
  treadmill and 400 ms on the other machines (D4).
- Today an avatar's sprite changes to its destination's pose **when its walk
  starts**: a person walks to their station holding a bar overhead, and to
  the cooler holding the bottle. Now the pose starts on arrival (GYM-10.17).
- `spec/browser/room.spec.ts` ("someone on their station stays put") checks
  the `on-station` class and the tile. The behaviour it checks still holds;
  if the class name changes, the test changes with it.
- Dony's own body grids in `src/sprites/dony.ts` (`stand`, `lift`, `lift2`,
  `rest`, `sit`, `walk1`, `walk2`, `hop`) give way to the people's frames
  with his head over them (D2). His `walk1` and `walk2` are the template for
  the shared walk (D1); `hop` stays his.
- **Two quirks become more visible**, accepted for now (D6). Someone who
  logged a cardio set stays Lifting (LOG-4: no rest after cardio), and
  someone whose rest ran more than 30 minutes over is reported Lifting again
  (`roomView` in `src/lib/presence.ts`; int.md raised the same quirk). With
  real animations, both play their loop for as long as they stay in the
  room, even after they've walked out of their gym.
- **Away while Lifting is common**, not rare: an Anchor who taps Start set
  and locks their phone for a 90 s set shows as Away after 60 s (GYM-14).
  Their animation keeps playing, faded (GYM-14.1, D5).

## Criteria

Each criterion says how it can be checked: **HTTP** (a request against the
running app), **browser** (needs the page's script, Playwright) or
**judged** (a person has to look). Names follow system.md section 13: Mia,
Ji-woo, Tom, Priya. Unless stated, all are members of the same open room,
each signed in in their own browser, and "every screen" means every open
screen in the room, the actor's included.

### GYM-10: the exercise animations

> Avatars walk between stations along the aisles … **Start set** plays the
> equipment's exercise loop. **Done** sends the avatar to the water cooler.

**GYM-10.1** Given Mia is Lifting on a station (after Choose, Start set or a
cardio Done), when her avatar has reached the station, then on every screen
she is on that station's machine playing that machine's animation (below).
Both exercises on a machine play the same animation. The server's first
render of the room already draws her on the machine in that animation, so
it is right without the page's script and after a reload. *HTTP* (the first
render) and *browser*

**GYM-10.2** Given any animation is playing, then its two frames are two
different drawings that swap, not one drawing that bobs, at 250 ms a frame
on the treadmill and 400 ms a frame on the other seven machines (D4).
*browser*

**GYM-10.3: treadmill** Given Mia is Lifting on the treadmill, then she
stands on the belt, facing the viewer, running. Frame 1 (still): mid-stride,
one knee up and the opposite arm forward. Frame 2: the same, mirrored. The
treadmill's side rails pass in front of her. *judged* (it reads as running on
the belt) and *browser* (this animation is shown for this machine)

**GYM-10.4: flat bench** Given Mia is Lifting on the flat bench, then she
lies on her back on the pad, head at the rack end, face up so it is visible
from above, holding the bar in both hands. Frame 1 (still): bar up, arms
straight. Frame 2: bar down at her chest. *judged* and *browser*

**GYM-10.5: squat rack** Given Mia is Lifting on the squat rack, then she
stands inside the rack between its uprights, the bar across her shoulders
and both hands on it. Frame 1 (still): at the bottom of the squat, thighs
about level. Frame 2: standing tall. The lower uprights or safety arms pass
in front of her. *judged* and *browser*

**GYM-10.6: dumbbell rack** Given Mia is Lifting on the dumbbell rack, then
she stands in front of the rack, a dumbbell in each hand. Frame 1 (still):
arms up, dumbbells curled to her shoulders. Frame 2: arms down. *judged* and
*browser*

**GYM-10.7: lifting platform** Given Mia is Lifting on the lifting platform,
then she stands on the platform with the loaded bar. Frame 1 (still): bent
over, hands on the bar at her shins, plates on the floor. Frame 2: standing
tall, the bar at her hips. *judged* and *browser*

**GYM-10.8: pull-up bar** Given Mia is Lifting on the pull-up bar, then she
hangs from the bar by both hands, feet off the floor, between the posts.
Frame 1 (still): chin over the bar. Frame 2: hanging, arms straight. Her
hands are drawn over the bar, and the posts pass in front of her at the
sides. *judged* and *browser*

**GYM-10.9: cable machine** Given Mia is Lifting on the cable machine, then
she sits in the machine facing the viewer, both hands on the handle at the
end of the cable. Frame 1 (still): handle pulled in to her chest. Frame 2:
arms up, handle up. Part of the machine's frame passes in front of her.
*judged* and *browser*

**GYM-10.10: exercise mat** Given Mia is Lifting on the exercise mat, then
she is on the mat in a push-up, head towards the viewer, face visible.
Frame 1 (still): arms straight. Frame 2: chest down. *judged* and *browser*

**GYM-10.11** Given anyone is playing any animation, then in both frames
their face is visible, and their skin, hair style, hair colour and shirt are
all shown as they chose them, so a friend can tell who it is from the sprite
as well as the tag. This holds for all four hair styles in all eight
animations (64 combinations), and colours stay palette swaps (AV-2): no
animation needs a drawing per colour. *judged* (an art sheet of every style
in every frame)

**GYM-10.12** Given anyone is on the treadmill, squat rack, pull-up bar or
cable machine, then at least one part of the machine is drawn in front of
them in both frames, so they read as inside it. On the bench, the mat, the
platform and the dumbbell rack they read as using it by lying or standing on
it and holding its bar or dumbbells. *judged*

**GYM-10.13** Given Mia is Lifting on the flat bench, squat rack, lifting
platform or cable machine, then the bar or handle she holds is drawn only in
her hands, never also in its resting place on the machine. When she stops
using the machine (Done, Slacking, another lift, Finish, Leave), it shows in
its resting place again, at the moment her avatar leaves the machine.
Whether a pair of dumbbells goes missing from the rack while she curls is
the designer's call. *browser* and *judged*

**GYM-10.14** Given any animation, then every part of both frames, the person
and everything they hold, stays inside the station's tile, so it never
covers a neighbouring station, person or tag. *judged* (the art sheet)

**GYM-10.15** Given a machine has a part that would move in real life (the
belt, the cable machine's weight stack), then whether it moves is the
designer's call; if it does, it moves only while someone is on the machine,
in step with their two frames, and stops on the still frame with them under
reduced motion. *judged*

**GYM-10.16** Given Mia is Resting at the cooler, when she taps Start set,
then her own sheet turns Lifting at once (as today), her tag and her squad
row turn Lifting on every screen within a second, and her avatar walks from
the cooler to her station and starts the animation when it arrives. The
walk never delays her sheet, Done, or anything she can tap. *browser*

**GYM-10.17** Given an avatar is walking anywhere, then it shows the walk
(two frames, facing the viewer, the frame changing with each tile stepped,
so one stride per tile at 125 ms a tile) and holds nothing: no bar, no
bottle, no phone. The pose or animation of the state it is walking to
starts when it arrives. If the walk is cut for time (D1), it shows the
standing figure without the bob while walking, and everything else here
holds. *browser*

**GYM-10.18** Given Mia's avatar is still walking to her station, when her
state changes again (she taps Done straight away, or chooses another lift),
then her avatar heads for the new place from wherever it has got to, and
never plays the animation of the place it no longer goes to. *browser*

**GYM-10.19** Given Mia's machine isn't on her station yet on some screen
(after GYM-6 ships, a delivery is still carrying it in there), then on that
screen her avatar waits standing on the aisle tile in front of the station,
tag Lifting, and steps onto the machine and starts the animation once the
equipment is down. Until GYM-6 ships, equipment appears at once (as today),
so she goes straight on. Someone who opens or reloads the room during a
delivery sees her on the machine, with no delivery replayed (GYM-8).
*browser* (after GYM-6)

**GYM-10.20** Given Mia is Lifting on the flat bench, when she chooses Back
squat and is given another station, then she walks there and plays the squat
rack's animation, and the bench shows unoccupied, with its bar back in place,
on every screen within a second. If she chooses the other exercise on the
same machine and keeps her station, she doesn't move and nothing visibly
restarts. *browser*

**GYM-10.21** Given anyone in the room, then the animation drawn for them
comes only from what the server reports now: their state, the station they
hold and the equipment on it. When a screen opens, reloads or reconnects, or
after a server restart, everyone is drawn straight away in the place and
animation their state calls for, with no walk replayed. Two screens may show
different frames of the same animation at the same instant; frames are never
synchronised across screens. *HTTP* (the first render) and *browser*

**GYM-10.22** Given Mia taps Done on a Run (cardio has no rest, LOG-4), then
she stays Lifting and keeps running on the treadmill, with no walk to the
cooler, until she chooses another lift, finishes or leaves. Likewise, anyone
the server reports as Lifting after a rest more than 30 minutes over plays
their machine's animation on their station. The map never shows a state the
server didn't report (D6). *browser*

**GYM-10.23** Given someone's device asks for reduced motion
(`prefers-reduced-motion: reduce`), then on their screen every animation
shows only its still frame (Frame 1 in GYM-10.3 to 10.10), standing figures
don't bob, avatars appear at their place without walking, and no machine
part moves. Everyone's state is still readable from where they are, their
pose, their tag colour, their accessible name and the squad list. *browser*
(emulated media)

**GYM-10.24** Given twelve avatars are on the map, all animating, on a phone,
then tapping Start set or Done responds as quickly as in an empty room, and
no animation, walk or frame change covers, moves or delays the sheet or its
dock. *judged* (on a mid-range phone) and *browser* (the dock is never
covered)

**GYM-10.25** Given any animation, then it shows effort as capable and cool:
no shaking, straining face, sweat puddle, failed rep, collapse under the bar,
or change to the body's shape, and it is the same for everyone whatever
weight they log (banter, not shame). With strangers in the room this reads
the same. *judged*

**GYM-10.26** Given the showcase (a room of twelve on laptops and phones,
nobody lifting), when people tap Choose on different lifts without logging a
set, then all eight animations can play at once, each on its own machine,
and someone who has never seen Spotter can name the machine or the exercise
for at least six of the eight just by looking. *judged*

**GYM-10.27** Given the new animations next to the redrawn Gen Z person,
then a group of 18 to 29 year olds would screenshot the map and send it to
the group chat: snappy, cute but cool, never stiff or corporate. *judged*
(at the Crit and the showcase)

### GYM-9: the other states

> Each person is in exactly one state: **Idle**, **Lifting**, **Resting**,
> **Slacking** or **Finished**.

**GYM-9.1** Given Mia is Idle or Finished, then she stands by the lockers,
facing the viewer, in the redrawn standing figure, with today's bob (2 sprite
pixels, 400 ms a frame). Finished differs only in its tag: there is no flex
or wave (D1). *browser*

**GYM-9.2** Given Mia is Resting, then she stands at the cooler holding the
bottle, in the redrawn figure, with today's bob. *browser*

**GYM-9.3** Given Mia holds a station but isn't on it (Resting at the cooler,
or Away there), then her machine is drawn unoccupied, with its bar in its
resting place, and on her own screen it is still marked as hers (system 9's
claim corners), as today. *browser*

**GYM-9.4** Given Mia is Lifting on her own station, then her screen still
marks the station as hers while she is on the machine: the marking is not
hidden by her body or the machine's front parts. *judged*

### GYM-11: Slacking

> A slacking avatar sits and scrolls a phone, and their own screen says
> "your squad can see you".

**GYM-11.1** Given Mia is Resting, when the server's time passes her slack
point (30 s past her rest's end), then within a second, on every screen, her
tag turns Slacking and her avatar walks from the cooler to her station and
sits in front of her machine scrolling her phone: one sitting drawing
whatever the machine, the machine unoccupied behind her with its bar in
place ("hogging the bench"; D3). *browser* — With strangers: walking
someone back to a machine to sit there is a public call-out in front of
people they don't know (Eagle et al. 2024); the vision's "who you let see
you" question applies to this more than to any other animation.

**GYM-11.2** Given Mia is Slacking, then she doesn't bob, and her phone's
screen glows and dims in two frames at 400 ms a frame, as today. Under
reduced motion the glow stays on. *browser*

**GYM-11.3** Given Mia is Slacking, when she taps Start set, then her avatar
goes from in front of the machine onto it and starts its animation straight
away, with no walk, since she is already at her station. *browser*

**GYM-11.4** Given Mia has been Lifting for any length of time (a set she
never tapped Done on), then she is shown Lifting, on her machine, for as
long as the server says so: Lifting never turns Slacking by itself. (The MVP
spec's "a set left running past 5 minutes becomes Slacking" is not in this
build.) *HTTP* (the server still reports Lifting) and *browser*

### GYM-14: Away

> A person whose connection drops shows as **Away** (avatar faded) after 60
> s, and keeps their state and station.

**GYM-14.1** Given Mia is Lifting and her phone has been locked for 60 s
(she is mid-set), then on everyone else's screen she stays on her machine,
faded to half, still playing the animation (D5); the machine's front parts
are not faded. Her tag and squad row say Away as today. *browser*

**GYM-14.2** Given Mia is Away in any other state, then she stays where that
state puts her, in its pose, faded to half, with that state's motion (bob or
glow) as anyone's. *browser*

**GYM-14.3** Given Mia comes back after being Away, then she is drawn
unfaded where her state puts her now. She walks only if her place changed
while she was away (for example her rest turned Slacking); nothing else is
replayed. *browser*

### GYM-15: accessibility, tags and tapping

> Below the gym, a text list of everyone in the room, their state and their
> equipment mirrors the map, for keyboard and screen-reader users and for
> small screens.

**GYM-15.1** Given anyone on the map, then their avatar's accessible name is
unchanged by this feature: "{name}{ (you)}, {state}{, away}, {where}", for
example "Mia, lifting, bench press on flat bench 2". The animation is hidden
from assistive technology, and nothing is announced when a frame swaps, an
animation starts or an avatar arrives. *HTTP* (the first render) and
*browser*

**GYM-15.2** Given anyone in the room, then their squad-list row is
unchanged: the same words, and the same head of the standing figure,
whatever their state or machine. *HTTP*

**GYM-15.3** Given Mia's avatar is on a machine, when someone taps or clicks
anywhere on her drawn body or her tag, including where a front part of the
machine is drawn over her, then it selects her avatar (today: focus; once
INT-1 ships, her menu). Her hit area is at least 44 × 44 px at 1× and 2×.
*browser*

**GYM-15.4** Given a keyboard user tabs to an avatar on a machine, then its
focus ring shows whole, drawn over the machine's front parts and over any
neighbour, and the tab order is the same as today. *browser*

**GYM-15.5** Given someone is on a station (Lifting on the machine, or
Slacking in front of it), then their tag sits just above the station's tile,
centred on it, in the same place for all eight machines, for Slacking, and
in both frames: it never moves with the animation. No machine part,
neighbour's animation or walker draws over it. Tags still draw over the
poster's tap area, as today. *browser* and *judged*

**GYM-15.6** Given any animation or loop, then nothing on the map changes
brightness over a large area more than three times in any second (WCAG
2.3.1). *judged*

**GYM-15.7** Given an animation is playing, when the window is resized so
the map changes between 1× and 2×, then the animation carries on at the new
scale with square pixels, the person stays on their machine, and the front
parts still line up with them. *browser*

### BOT-2 and BOT-3: Dony

> BOT-2: Dony is drawn with his own 32 × 32 sprite … in every pose a person
> has. BOT-3: He goes Idle, Lifting, Resting and Slacking … through the same
> station rules (GYM-4).

**BOT-2.1** Given Dony is Lifting on any of the eight machines, then he plays
that machine's animation exactly as a person would (GYM-10.1 to 10.15): the
same body frames, timing, still frame, front parts and tag place. He is
drawn as the people's frames with his own head over them (his side-parted
black hair and glasses) and his fixed colours, with a violet top in place of
a shirt colour (D2). In every frame he is recognisably Dony: glasses, hair
and violet all show. *browser* and *judged*

**BOT-2.2** Given Dony is Idle, Resting or Slacking, or walking, then he
looks and moves exactly as a person in that state would (GYM-9, GYM-11,
GYM-10.17), on the people's frames in his own head and colours. He has no
Finished or Away look, since he is never either (BOT-3, BOT-5). *browser*

**BOT-2.3** Given Dony is summoned or sent back, then his hop to and from the
poster is unchanged, and stays his own frame; between the hop and his spot
he walks like anyone (GYM-10.17). *browser*

**BOT-2.4** Given Dony's schedule gives him a lift, and its machine is taken
so he does another lift on whatever is free (as he does today), then he plays
the animation of the machine on the station he holds, never of the lift his
schedule first picked. *HTTP* (the first render) and *browser*

**BOT-2.5** Given Dony is on a machine mid-set, when someone sends him back,
then he leaves the machine at once (it shows unoccupied, its bar in place) and
walks to the poster from there. *browser*

### AV-1 and AV-3: the avatar editor

> AV-1: … hair style (4) … AV-3: … a live preview playing the idle
> animation.

**AV-1.1** Given the avatar editor, then the hair style stored as `long` is
labelled "Wolf cut", both on screen and as its accessible name (D8). The
stored id stays `long`, so every saved look still loads and nothing is
migrated. *HTTP*

**AV-3.1** Given the avatar editor, then its live preview shows the redrawn
standing figure with the same bob as Idle in the gym, and every choice
(skin, hair style, hair colour, shirt) changes it at once, as today.
*browser*

## Open questions

None. All eight were settled on 19 Oct 2026; see Decisions.

## Decisions

All dated **19 Oct 2026**. The user accepted the recommended answer to each
of Q1 to Q8, relayed by the main agent. The criteria above are written to
match.

| # | Question | Decision | Why | Criteria |
| --- | --- | --- | --- | --- |
| D1 (Q1) | How much is redrawn? | The eight exercise animations on the machines; the standing, resting and sitting figures redrawn on the new body with today's motion; and a two-frame walk facing the viewer, **cut first if the week runs short** (standing figure, no bob, while walking). Idle fidgets, a sip at the cooler, a thumb scrolling the phone and Finished's flex and wave are out. | The machine animations are what the user asked for; the walk keeps "really using the equipment" from being undone twice a set, and Dony's walk frames are a template. The rest is a dozen drawings for states the Anchor never looks at, in the week the worker and reactions need art. | GYM-9.1, GYM-10.17, BOT-2.2, BOT-2.3 |
| D2 (Q2) | How is Dony drawn? | The people's body frames with his own head (hair and glasses) over them and his fixed colours; his open bomber becomes a violet top on the shared body. His hop stays his own frame. | Halves the art, and makes "every animation a person has" true by construction, now and for every future machine. His identity is the glasses, hair and violet. | BOT-2.1, BOT-2.2, BOT-2.3 |
| D3 (Q3) | Where does a Slacking person sit? | In front of their machine, one sitting drawing for every machine, as today. | Keeps the "hogging the bench" joke and the station visibly theirs, for one drawing instead of eight. | GYM-11.1, GYM-11.3, GYM-15.5 |
| D4 (Q4) | How fast do the animations swap? | 250 ms a frame on the treadmill; 400 ms on the other seven. | 250 ms is a stride; on a squat it reads as twitching. 400 ms is the system's existing idle tempo. | GYM-10.2 |
| D5 (Q5) | Away while Lifting? | The animation keeps playing, faded. | A locked phone mid-set is the Anchor's normal case; stopping would look like they stopped, the false-slacking risk. | GYM-14.1 |
| D6 (Q6) | People who stay Lifting indefinitely (after cardio; a rest 30 min over) | Accepted for this feature: the map shows what the server reports. Whether those state rules change is raised separately, in the gym area. | The animation must never invent a state, or the map and the squad list would disagree. The rule change affects who can be slapped and the summary, so it is its own decision. | GYM-10.22 |
| D7 (Q7) | Interaction reactions over animations | Reactions (INT-3) are effects drawn over whatever pose the avatar is in, never new body frames. | Body frames would need a version per animation and state, for people and Dony; an effect works everywhere for one drawing. INT owns the rest. | none here (Scope, INT-3) |
| D8 (Q8) | The `long` hair style's label | "Wolf cut", label only; the stored id stays `long`. | It is drawn as a wolf cut, and the name is what a Gen Z player would recognise. Nothing stored changes. | AV-1.1 |
