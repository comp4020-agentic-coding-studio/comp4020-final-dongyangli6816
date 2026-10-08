# Room (the gym page): design spec

Page: `src/pages/rooms/[id].astro`. Mockup: `docs/design/room/mockup.html`.
`<style id="page">` is the block to build from. `<style id="mockup">` only
holds the state labels, the two phone frames and the art sheet, and is not
part of the design. Screenshots: `.shots/room/mockup-mobile.png` and
`.shots/room/mockup-desktop.png`.

**Revision, 8 Oct 2026 (Crit 9).** The room becomes the gym: a fixed pixel
map at the top (GYM-1, GYM-2), every member's avatar on it by state (GYM-9,
GYM-10, GYM-14, ACC-4), the people list rewritten to mirror it (GYM-15), the
station you claimed (GYM-4), a quiet connection indicator for the live
stream (GYM-13), the 30 s grace before Slacking (GYM-11), and a **Start set**
button that ends the rest and puts you on your equipment (GYM-10; added
after the user's answer, same day). Everything the
page already did stays: the sheet, the rest timer, the log, the pencil, the
four set kinds, Leave, End room, and every field name and `action` value.

**Revision, 8 Oct 2026 (workout clock).** The workout now starts the moment
you enter the room (creating it, joining it or coming back), and the
summary's duration counts from then. The clock used to ride the This workout
panel, which only exists once a set is logged, so nobody could see it before
their first set. **The clock moves to the sheet's top border, on the right,
opposite your state tab**, and is there from the first second. It is still
one clock: the This workout panel loses it. This workout still appears only
with a set, so **Finish workout** does too; before that, Leave is the way
out, and its note says nothing will be saved. New states: "No sets yet",
"Phone, first screen, no sets yet" and "First set logged".

**Revision, 8 Oct 2026 (after Done).** The user: "after clicking Done, the
sheet on the right doesn't change at all; only This workout gets more rows."
Every Done now gets the same acknowledgement, for every kind: **a stamp on
the dock's top border** ("Set 2 logged: 140 kg × 5"), where the thumb that
tapped Done already is, for 4 s, announced once to screen readers. **Cardio,
which has no rest, gets a logged block where the rest block would be**
(replacing the small bubble nobody saw), and keeps Done. **Timed sets (Plank,
Run, Incline walk) come back empty**, with the stopwatch at a dim 0:00, and
open empty too; `.last` is the reference. On a phone scrolled past the
sheet's top, Done scrolls it back into view. New states: "Just logged ·
weight", "Just logged · cardio", "Just logged · plank", and two phone frames.
No field name or `action` value changes.

The mockup suffixes ids (`weight_kg-1`, `set-log-5`, `pick-2`) only because
it shows many states on one page. The real ids are `weight_kg`, `reps`,
`minutes`, `seconds`, `distance_km`, `exercise`, `set-error`, `set-edit`,
`set-log` and `pick`.

## 1. Plan

### Shared

The Gym group is this page alone. It sits beside Lobby (`home`, `join`,
`avatar`) and Logbook (`history`, `summary`) and keeps their rules:

- **Night surface** (system 4) and `.panel` boxes with their name on the top
  border.
- **A set is written the way a lifter writes it**, with `setLabel()`:
  `140 kg × 5`, `BW + 10 kg × 6`, `1:30`, `5 km · 25:00`.
- **A person is drawn one way everywhere**: the Lobby group's avatar sprite
  (`svg.av`, slot classes `k s t h`, colours from `--av-skin`, `--av-hair`,
  `--av-shirt`; `docs/design/avatar/spec.md`). The map uses the whole 16 × 16
  sprite at the map's scale; the people list uses the same head crop as
  home's squad rows (`viewBox="1 0 14 11"`, 42 × 33 px). Mia, Tom, Ji-woo and
  Priya wear the looks the avatar spec gives them.
- **A squad row is home's "What your squad sees" row**: head, name over a
  dim "what they're doing" line, state chip on the right.
- **State chips** (`.chip.state-*`, 16 px icon plus a word) as on home.
- **The passcode is drawn one way**: `.passcode`, leaf on ink.
- **One primary button per screen**: Start set while a rest runs, Done
  while lifting, Save while editing, Choose while Idle, always in the
  sheet's dock. Everything else is `.button.secondary` (room and log actions
  `.quiet`).
- **Voice**: plain on forms, errors and confirms; banter in the slacking
  line, the empty room and the cardio block.

### Who and when

- **Between sets** (the case that wins every tie): phone in one sweaty hand,
  60 to 180 s of rest, glancing. They want the timer and Done, and a look at
  who else is in.
- **The showcase**: a room of laptops and phones, nobody lifting, everyone
  watching and poking the map. The map has to be fun to look at with a dozen
  Idle people in it.
- **Arriving alone** with a passcode to send. **Fixing a typo** during
  rest. **Leaving**, or for the host, closing up.

### The one job

**Log the next set**, as before: read the timer, check the numbers, press
**Done**. The map is the second job, **being seen**: it never sits between
the person and Done (system principle 1).

### Hierarchy

1. **The rest timer** (80 px) while resting; on a phone whose bar covers it,
   its 48 px copy in the dock.
2. The primary button (**Start set** while resting, **Done** while
   lifting) and the numbers about to be logged (48 px).
3. **The map**: who is lifting, resting, slacking, at a glance, from the tag
   colours and the poses. Your own tag and station are marked in leaf.
4. **The squad list**: the same thing in words, with times.
5. **The log**, then **the room** (headcount, invite link, Leave, End).

Numbers that must read at a glance: the timer, weight and reps, the times in
the squad list (`1:24 left`, `2:40 over`), and the bay numbers on the map.

**The workout clock** (24 px, leaf, on the sheet's top border) is a quiet
number, below all of these: you check it when you arrive, now and then, and
when you decide to finish. It sits in the frame, not in the sheet's body, so
it never competes with the 80 px rest timer or the 48 px weight and reps, and
the pixel clock icon in front of it tells it apart from the rest timer and
the cardio stopwatch.

### Reuse

Unchanged from the last design: `.panel`, `.panel-title`, `.panel-clock`
(moved from This workout to the sheet, and now a flex row for its icon),
`.sheet` and its tab, `.rest`, `.timer`, `.rest-what`, `.rest-say`,
`.rest-adjust`, `.tool`, `.switch`, `.picker`, `.pick`, `.recent`, `.last`,
`.big-pair`, `.big`, `.big-time`, `.mmss`, `.stopwatch`, `.log` and its
cells, `.confirm`, `.quiet`, `.spots`, `.pips`, `.badge.host`, `.alone`,
`.vh`, plus the layout's `.passcode`, `.chip`, `.state-*`, `.badge`,
`.bubble`, `.hint`, `.error`, `.wide`, buttons and fields.

New, all in `<style id="page">`:

| Piece | What it is |
| --- | --- |
| `.map-panel`, `.map`, `.tiles` | The map's frame, the scaled 10 × 10 tile board, and its static tile layer |
| `.map-sign` | The `h1`: the passcode, on the map's top border, as the gym's sign |
| `.conn`, `.conn .lost` | Top-right of the map's border: `Live` badge, or `Reconnecting…` |
| `.station`, `.station.mine` | A station's equipment or numbered empty bay; your station's leaf corners |
| `.avatar`, `.avatar.on-station`, `.avatar.me`, `.avatar.away` | An avatar button: tag over sprite |
| `.tag` | The name tag, in the state's colour |
| `.av` and its slot rules | The Lobby group's avatar sprite (marked `shared`), plus three prop slots `pm pw pr` |
| `.people` rows (rewritten), `.who`, `.what`, `.chips`, `.chip.away` | The squad list |
| `.dock`, `.dock-timer` | The sheet's primary button; on phones a fixed bar, carrying a timer copy when needed |
| `.spot` | "Your spot: Lifting platform 5" |
| `.rest.slacking` | Red only once the server says Slacking (was `.rest.over`) |
| `.recent button` | The recent-lift chips, now submit buttons |
| `.room-link` | The invite link in the Room panel |
| `.stamp` (8 Oct, after Done) | Done's acknowledgement: the set just logged, on the dock's top border for 4 s |
| `.set-done`, `.set-done-n`, `.set-done-say` (8 Oct) | Cardio's logged block, in the rest block's place and frame, leaf instead of blue; replaces the `.bubble` |
| `.mmss input::placeholder` (8 Oct) | The empty time fields read as a dim `0:00` |
| `p#sheet-news` (8 Oct) | A visually hidden `role="status"` outside `.gym`, so the stamp is really announced after a swap |

Four 8 × 8 icons are new (`phone-off`, `signal`, `claim`, `clock`); the gym's tiles,
scenery and equipment are new sprites (appendix). The stamp and the cardio
block reuse the avatar editor's existing `tickIcon`.

### Template check, and what it changed

The first plan was a dark card with a grid of avatar circles above the old
page. Swap the colours and that's any "who's online" widget. What changed:

- **It's a room you could walk around.** Mirrors and a clock on the back
  wall, a water cooler set into one side wall and lockers into the other, a
  green mat at the door with an arrow pointing in, a walkway through the
  middle. Twelve stations in two bays of two either side of it, like rows of
  racks.
- **Where you stand says what you're doing.** Lifting: on your equipment,
  bar overhead. Resting: at the cooler with a blue bottle. Slacking: sitting
  *on* your bench with your phone, hogging it, which is the joke a lifter
  recognises. Idle: by the lockers, just in. Away: faded where you were.
- **Name tags are the state colour**, so the map reads like the squad list's
  chips: a glance across the room is a glance at the state.
- **Empty stations are numbered bays**, like rack numbers in a real gym, so
  "flat bench 2" in the list and on your sheet can be found on the map.
- **Your bay is claimed in leaf**, and your tag wears a leaf ring.
- **The passcode is the gym's sign** over the map, and `Live` sits on the
  other corner like a broadcast bug; it turns into `Reconnecting…` there.
- **On a phone, Done is a bar the timer can ride on**, not a generic
  floating button: when the big timer is out of sight, its copy sits beside
  Done.
- **The workout clock hangs on your sheet like the clock on the gym's back
  wall** (the map's `K` tile): a small leaf clock face and the time, set into
  the sheet's border across from your state, so the frame reads "Resting ·
  31:42 in". A header bar with a session timer would fit any fitness app;
  this is the same panel-border language as every other box in the gym.

#### Where the workout clock goes, and why (8 Oct)

Three places were weighed:

1. **Keep it on This workout, and show that panel always**, with an empty
   line ("No sets yet…"). Rejected: on a phone that panel is below the map,
   the sheet and the squad list, about three screens down, so the clock
   would exist but nobody would see it, which is the problem we're fixing.
   An empty panel also lengthens the scroll on every visit, and it would
   carry a Finish that has nothing to finish.
2. **The map panel's border**, beside `Live`. Rejected: the map is the room,
   shared by everyone, and a time on its sign reads as the room's time (how
   long the gym has been open), not yours. That corner also turns into the
   wider `Reconnecting…` chip, which crowds a 360 px border next to the
   passcode, and on a laptop the map scrolls away while the sheet stays.
3. **The sheet's top border, right**: chosen. The sheet is *you*: your
   state, your next set, your button. On a phone its top border is on the
   first screen under the map (both 390 × 660 frames show it), and on a
   laptop the sheet is sticky, so the clock never leaves the screen. It
   reuses `.panel-clock` exactly as it was drawn, so nothing new is learned.

**Not in the dock.** The dock already carries the rest timer's copy; two
times in the thumb bar would make the one that matters between sets
ambiguous. When a phone scrolls past the sheet's top, the workout clock goes
with it, and that's fine: it's a number for arriving and finishing, not for
the middle of a rest.

**One clock, not two.** The This workout panel keeps its title and tally
("5 sets · 2,913 kg moved so far") and drops `.panel-clock`.

**Finish waits for a set.** A workout with no sets is deleted when finished,
so Finish before the first set would turn you Finished (trophy tag, on
everyone's screen) for nothing and save nothing. The This workout panel, and
the Finish inside it, still render only when `mySets.length > 0`. Before
that, **Leave room** is the way out (it also deletes the empty workout), and
its note says so plainly.

#### After Done, and why (8 Oct)

**What was wrong.** A weight set's Done does change the sheet, but only at
its top (the rest block), which on a phone is often scrolled away while the
thumb is on the dock; nothing anywhere says "logged". A cardio set's Done
changed nothing you'd notice: same lift, same filled-in numbers, same Done,
and a small bubble at the top. Run is the select's first option, so that's
very likely what the user hit.

**1. One acknowledgement for every kind: the stamp.** Done lands, and the
dock's top border carries `✓ Set 2 logged: 140 kg × 5` (setLabel's wording:
`Set 1 logged: 1:30`, `Set 2 logged: BW + 10 kg × 6`, `Set 1 logged: 1 km ·
4:52 · 4:52 /km`).
- *Where*: on the dock, because that is where the eye and thumb are at the
  moment of Done on both widths: pinned to the bottom of a phone, the foot of
  the sticky sheet on a laptop. It sits on the border the way every name in
  the gym does (the passcode, `Live`, your state tab, the clock), so it reads
  as the logbook writing a line, not as an app toast.
- *How long*: 4 s, the system's banner time. It rises out of the border in 4
  steps (160 ms) and sinks back the same way; reduced motion just shows it
  and hides it. Pure CSS, so it works without JS too. By the time it goes,
  the sheet's top block (the rest, or cardio's logged block) carries the
  same news for as long as it matters.
- *Never in the way*: absolutely positioned, so the dock doesn't grow and
  the button doesn't move; `pointer-events: none`, so a tap on it reaches
  the button; never a dialog, never a second tap. Done is still one tap
  (README principle 3, system 2.1).
- *Screen readers*: the visible stamp has no role, because a live region
  that arrives inside freshly swapped HTML is not reliably announced. The
  page keeps one empty `p#sheet-news[role=status]` outside `.gym`, which the
  swap never replaces, and the script copies the stamp's text into it after
  a Done. Focus still goes to the dock's button (Start set or Done), so a
  screen reader hears the button, then "Set 2 logged: 140 kg × 5".
- *Colour*: leaf text and a 2 px leaf outline on `--night`, like the
  passcode sign. Not a leaf fill, which is the Lifting chip's.

**2. Cardio: stays Lifting, with a logged block where the rest would be.**
Three options were weighed:
- *An optional rest after cardio*. Rejected: LOG-4 says "none after cardio",
  and a runner between intervals is still on the treadmill.
- *A "done, what's next" state with Start set in the dock*, like a rest
  without a timer. Rejected: the server keeps you Lifting after a cardio set,
  so the dock would say Start set beside a Lifting chip, and anyone who types
  their time off the treadmill's display would pay an extra tap for every
  rep.
- *Stay Lifting, with a block you can't miss*: chosen. The sheet's top shows
  `div.set-done`: the rest block's frame, in leaf instead of blue, with a
  32 px tick, **Set 1 logged** in 32 px, and "No rest timer after cardio. Go
  again, or change lift 🏃". So after every Done the same place changes: the
  top of the sheet holds what comes after the set you just did (a rest, or
  "logged, go again"). Done stays the button, so the next rep is still
  Start (stopwatch), Done, as now. The block stays until the next swap (the
  next Done, Change, the pencil); without JS, until the next page. The old
  `.bubble` goes.

**3. Timed sets come back empty (user's request, 8 Oct).** After Done, a
Run, Incline walk or Plank comes back with distance and time empty and the
stopwatch at `0:00`, ready: every run differs, and the stopwatch counts on
from whatever time is in the fields, so a pre-filled 10:00 would start at
10:00. The empty time fields show `0` and `00` as dim placeholders, so the
stopwatch reads `0:00` without anything that would be submitted. `p.last`
("Last time 1 km · 4:52 · 4:52 /km") stays as the reference, under the same
rule as now: it hides only while a rest on the same lift is running, when the
rest block's "after 1:30" is the same line one block up, and it comes back on
Start set. Weight and bodyweight lifts keep pre-filling.

**Opening a timed lift fresh starts empty too** (recommended, and drawn).
The stopwatch problem is the same on the first run of a session or of a new
day, and one rule ("timed sets start empty, Last time shows what you did")
is easier to learn and to build than two. The edit form still shows the set
being edited, and an error or Start set still echoes what was typed.

**4. Bring the news into view on a phone.** The swap keeps the scroll, so a
phone user scrolled down to the fields can't see the new rest block. After a
successful Done on a phone (< 900 px), if the sheet's top border is above the
top of the screen, the page jumps (no smooth scroll) so that border sits 24 px
below the top: the new timer or the logged block, the lift and Set N+1, and
the fields all fit above the pinned dock on a 390 × 660 screen (both phone
frames). If the sheet's top is already in view, nothing moves, so someone
watching the map keeps it. Laptops never scroll: the sheet is sticky.

**Template check.** A snackbar that says "Saved" fits any app. What makes
this one Spotter's: it is written on the dock's border in the gym's
border-label language, in a lifter's shorthand (`Set 2 logged: 140 kg × 5`),
and the larger change is the gym's own: you walk to the cooler and the rest
starts, or, after a run, the box where the rest would be tells you there
isn't one and to go again.

## 2. Requirements covered

| Requirement (source) | Element |
| --- | --- |
| GYM-1 "one fixed map on a 16 px tile grid: walls, floor, an entrance, a water cooler, aisles, and 12 stations. It fits a portrait phone screen and a laptop window without scrolling" (4-week) | `.map`: the 10 × 10 grid in section 3.2, drawn at the largest whole-number scale that fits: 2× (320 px) on a 360 to 430 px phone, 3× (480 px) on a laptop. Never cropped or scrolled. |
| "scaled by the largest whole number that fits, and recomputed on resize" (4-week, Rendering) | The scale script in 3.8; CSS media queries are the no-JS fallback. |
| GYM-2 "A new room starts with the treadmill, flat bench, squat rack and dumbbell rack on four stations, and eight empty stations" | Slots 1 to 4 (the row along the mirrors) hold those four; slots 5 to 12 are numbered empty bays. State "Room alone". |
| GYM-4 / brief: "you are told which station you claimed" | `.station.mine` (leaf corners), the leaf ring on your tag, `p.spot` "Your spot: Lifting platform 5" in the sheet, and your row in the list. Choosing posts `action=choose` (as the server now expects). |
| Brief: "Equipment that is delivered this week simply appears on its station" | A station's equipment is drawn from the room's layout; a change arrives over SSE and the sprite is swapped in place. No animation, no message. |
| GYM-9, GYM-10 (states on the map) | Lifting: on the station, lift pose. Resting: rest spots by the cooler, bottle. Slacking: on the station, sitting with phone. Idle: idle spots by the lockers. Finished: idle spots, trophy-yellow tag. Positions in 3.2. |
| GYM-10 "Avatars walk between stations along the aisles" | Route in 3.2; one tile per 125 ms in `steps()`; reduced motion jumps. |
| GYM-10 "**Start set** plays the equipment's exercise loop. **Done** sends the avatar to the water cooler"; system 2.1 "a normal set is two taps: Start set, then Done" | While a rest runs (Resting, Rest up, Slacking) the dock's button is **Start set**: it ends the rest and makes you Lifting the same exercise, so your avatar walks from the cooler (or stands up) to your station and plays the loop. Then the dock's button is **Done**, which logs and sends you back to the cooler. State "Lifting (after Start set)". |
| GYM-11 "their own screen says 'your squad can see you'" | `.rest.over.slacking .rest-say` "Your squad can see you 👀", chip Slacking, red count-up, from the server's `slackAt` (30 s over). State "You slacking". |
| GYM-13 "within about a second, with no reload" + brief: "a small, quiet connection indicator … (no modal)" | SSE on `/rooms/:id/events`; `.conn` shows `Live`, or `Reconnecting…` after 3 s without the stream. Nothing else changes; logging keeps posting. |
| GYM-14 "shows as Away (avatar faded) after 60 s" | `.avatar.away .av` at 50%, the phone-off icon in the tag, `.chip.away` in the list next to the state chip, "Offline 2 min" in the row. |
| GYM-15 "Below the gym, a text list of everyone in the room, their state and their equipment" | `ul.people`: head, name, what and where, state chip, Away chip. Updates in place, not announced. |
| ACC-4 "shown above the person's avatar" | `.tag` above every sprite, the name in VT323 20 px. |
| AV-1, AV-2 (avatars vary by palette) | `svg.av` with `--av-*` per person; six different looks in the mockup. |
| System 12 "every sprite button has an accessible name like 'Mia, resting, flat bench'" | `aria-label` on every `.avatar` (3.2). Focus ring is the Night `--focus` ring on the whole button. |
| System 9 ".avatar … hit area is at least 44 × 44 px" | The button is tag plus sprite: at least 44 px wide and 56 px tall at 2× (68 px on a station). |
| LOG-6 "a summary: duration …" (4-week), with the 8 Oct fix: the workout starts on entering the room | `.panel-clock` on the sheet's top border counts from the workout's `startedAt` from the first render, so the time you watch is the duration the summary will show. State "No sets yet". |
| Unchanged: LOG-3 to LOG-8, ROOM-5, ROOM-6, the copy bank lines | As in the last revision: the sheet's fields by kind, rest timer and ±15 s, beep and flash at 0, edit and delete, Finish, Leave, End. |
| "Tap targets at least 48 px, with primary buttons in the bottom third" (MVP) | The dock: Done 64 px tall, fixed to the bottom of a phone. |
| README principle 3 "Logging never slows you down"; system 2.1 "Nothing … may sit between the person and those two buttons" (8 Oct, after Done) | `p.stamp` on the dock's border: absolutely positioned, `pointer-events: none`, gone in 4 s; no dialog, no extra tap. Done is still one tap. |
| System 13 "Success: confirmation in place … never a separate page"; user: "the sheet … doesn't change at all" | The stamp after every Done; cardio's `div.set-done`; on a phone, the sheet's top scrolled into view (3.3 item 11). |
| System 12 "banners and state changes for *you* are `role="status"`" | `p#sheet-news[role=status]` outside `.gym`, filled with the stamp's text after a Done swap. |
| LOG-4 "starts a rest timer … none after cardio" | Cardio gets no rest: it stays Lifting with Done, and `div.set-done` says "No rest timer after cardio". |
| LOG-3 "Each pre-fills from the person's last set of that exercise", **changed for timed kinds** (user, 8 Oct) | Weight and bodyweight pre-fill as before. Duration and cardio open and come back empty (placeholders `0` / `00`), with `p.last` as the reference. See Departure 15: the build updates LOG-3 in `docs/product/spec-4-weeks.md`. |

## 3. Structure

### 3.1 Page order and the grid

```
div.gym
  section.panel.map-panel     (GYM-1, the h1)
  section.panel.sheet         (your state, your next set; .dock inside)
  section.panel               Squad (people list)
  section.panel               This workout (only with sets; no clock now)
  section.panel.sign          Room
```

- **Phones (< 900 px)**: one column in that order. The sheet is no longer
  sticky. Its `.dock` is `position: fixed` to the bottom of the screen, so
  Done is in the thumb zone wherever you scroll. `body:has(.dock) footer`
  gets 7 rem of bottom padding so the bar never hides the footer.
- **Laptops (≥ 900 px)**: `1fr 24rem`. The sheet takes column 2,
  `grid-row: 1 / span 4`, sticky at `top: 2rem`; the dock is just its foot.
  The other four stack in column 1.

Source order puts the sheet second so keyboard users meet the map's avatars,
then Done, then the list. Your own avatar's button also jumps focus to the
dock (3.2), as a shortcut.

### 3.2 The map panel

```html
<section class="panel map-panel" aria-labelledby="room-title" aria-describedby="floor">
  <h1 class="map-sign" id="room-title"><span class="vh">Room </span><span class="passcode">SB64FR</span></h1>
  <p class="conn" role="status"><span class="badge">Live</span></p>
  <p class="vh" id="floor">On the floor: treadmill, flat bench, … 6 stations empty.</p>
  <div class="map" style="--s: 2">
    <svg class="tiles" viewBox="0 0 160 160" aria-hidden="true">…</svg>
    <div class="station" style="--x: 1; --y: 1" data-slot="1" data-equipment="treadmill"><svg …/></div>
    … 12 stations …
    <button type="button" class="avatar on-station" style="--x: 6; --y: 1" data-state="lifting"
            aria-label="Mia, lifting, back squat on squat rack 3">
      <span class="tag state-lifting"><span class="nm">Mia</span></span>
      <svg class="av" viewBox="0 0 16 16" style="--av-skin: …; --av-hair: …; --av-shirt: …">…</svg>
    </button>
    …
  </div>
</section>
```

- **The passcode stays `<span class="passcode">` with the code as its only
  text** (`spec/helpers.ts` scrapes `class="passcode"`). It moves here from
  the Room panel, which no longer shows it.
- **`.conn`** is `p[role="status"]`, so "Reconnecting…" and then "Live" are
  each announced once when they change (not on load).
- **The floor line** (`p.vh#floor`) lists the equipment on the floor and how
  many stations are empty, for screen readers; the stations themselves are
  `aria-hidden` art. Rewrite it when the layout changes.

#### Size

`--t` is one tile: `16px × --s`. The board is `10 × --t` square, centred in
the panel. `--s` is the largest whole number with
`160 × s ≤ the panel's inner width` and
`160 × s ≤ innerHeight − top bar height − 48`, at least 1, recomputed on
`resize` (3.8). Without JS: `--s: 2`, and `3` at `min-width: 900px` and
`min-height: 600px`. Results: 2× (320 px) on every phone from 360 to 430 px
wide, 3× (480 px) in a 1280 × 800 laptop window. The panel's top padding is
16 px; the passcode tab overhangs the border by half its height.

#### The grid (10 × 10 tiles, origin top left)

```
     x 0 1 2 3 4 5 6 7 8 9
y 0    W M M M K P M M M W     back wall: mirrors, the clock, a poster
y 1    [ 1 . 2 : : 3 . 4 ]     stations 1-4 against the mirrors
y 2    [ : : : : : : : : ]     aisle
y 3    [ 5 . 6 : : 7 . 8 ]     stations 5-8
y 4    [ : : : : : : : : ]     aisle
y 5    [ 9 . 10: : 11. 12]     stations 9-12
y 6    [ : : : : : : : : ]     aisle
y 7    C r . r : : i . i L     water cooler in the left wall, lockers in the right
y 8    [ . r . : : . i . ]     lobby
y 9    _ _ _ _ E e _ _ _ _     front wall; the entrance is (4,9) and (5,9)
```

- `W` wall, `M` mirror, `K` clock, `P` poster, `[` `]` side walls, `_`
  front wall, `E` `e` the entrance mat (an arrow pointing in), `.` rubber
  floor, `:` aisle walkway, `C` the water cooler (over a side wall tile),
  `L` the lockers (over a side wall tile).
- **Aisles**: the central walkway is columns 4 and 5 from row 1 to the door;
  the cross aisles are rows 2, 4 and 6 from column 1 to 8.
- **Stations** (slot: tile): 1 (1,1), 2 (3,1), 3 (6,1), 4 (8,1), 5 (1,3),
  6 (3,3), 7 (6,3), 8 (8,3), 9 (1,5), 10 (3,5), 11 (6,5), 12 (8,5). Each is
  entered from the aisle tile below it. Two stations in a row are never
  closer than 2 tiles, so 2× name tags of up to 6 characters don't touch.
- **Opening layout (GYM-2)**: 1 treadmill, 2 flat bench, 3 squat rack,
  4 dumbbell rack: the row along the mirrors. Suggestion for GYM-4's
  "empty station" rule: fill empty stations in slot order (5, 6, … 12), so
  the floor fills from the top.
- **The tile layer is static**: render it once (`Sprite.astro` can draw the
  whole 160 × 160 grid as one SVG, or the page can use a cached `<symbol>`).

#### Who stands where

| State | Tile | Pose | Tag |
| --- | --- | --- | --- |
| Lifting | their station, `.on-station` | `lift` (bar overhead); `stand` on the treadmill (the run loop's first frame) | `state-lifting` |
| Resting | the next free rest spot | `rest` (blue bottle) | `state-resting` |
| Slacking | their station, `.on-station` | `sit` (phone, glow) | `state-slacking` |
| Idle | the next free idle spot | `stand` | `state-idle` |
| Finished | the next free idle spot | `stand` (flex and wave later) | `state-finished` |
| Away (flag) | wherever their state puts them | that pose, sprite at 50% | that state's, plus the phone-off icon after the name |

- **Rest spots**, in fill order: (1,7), (3,7), (2,8), then (1,8), (3,8),
  (2,7), (1,6), (3,6), (2,6), (4,8), (4,7), (4,6).
- **Idle spots** (also Finished), in fill order: (8,7), (6,7), (7,8), then
  (8,8), (6,8), (7,7), (8,6), (6,6), (7,6), (5,8), (5,7), (5,6).
- The first three of each never overlap. From the fourth on, tags may
  overlap a neighbour's legs; it only happens with four or more people in
  the same state, and the list is the readable view.
- **Spots are given out by join order** among the people in that state, so
  every screen puts everyone in the same place with no server state.
- **On a station** the avatar's feet drop 6 sprite pixels into the aisle
  below (`top: (y + 1.375) × --t`) and the tag keeps a 6-pixel gap above the
  head, so the top of the equipment shows between them.
- **Stacking**: `z-index: y`, so lower rows draw over higher ones; a hovered
  or focused avatar goes to 15, so its tag is never hidden.

#### Walking (GYM-10)

When someone's tile changes, step their avatar one tile at a time, 125 ms
per tile (`steps(1)`, about 8 tiles a second), along this route:

1. From a station, step down into its aisle row (`y + 1`). From the lobby
   (rows 7 and 8), walk up the same column to row 6. From the door, start at
   (4,9).
2. Along that row to the central column, x = 4.
3. Up or down column 4 to the target's aisle row (the station's `y + 1`, or
   6 for the lobby).
4. Along that row to the target's column, then step into the target.

A new arrival walks in from the door. With `prefers-reduced-motion`, jump
straight to the target. Walking never delays anything in the sheet.

#### The avatar button

- `button.avatar` with `style="--x; --y"`, plus `.on-station`, `.me` and
  `.away` as they apply. It holds `span.tag.state-{state}` > `span.nm` (and
  the 16 px phone-off icon when Away), then `svg.av`.
- **The tag**: VT323 20 px, ink on the state colour, 2 px ink border, the
  name cut to 6 characters (`max-width: 6ch`, no ellipsis). Full names are
  in the accessible name and the list. Yours adds a leaf ring past an ink
  gap.
- **Accessible name** (`aria-label`): `{name}{ (you)}, {state}{, away},
  {where}`, where `where` is:
  - Lifting: `{exercise} on {equipment} {slot}`, e.g. "Mia, lifting, back
    squat on squat rack 3".
  - Resting or Slacking: `{equipment} {slot}`, e.g. "Ji-woo, slacking, flat
    bench 2".
  - Idle: `no station yet`. Finished: `finished`.
- **What it does this week**: nothing for others' avatars beyond focus
  (INT-1 opens the menu next week; it will add `aria-haspopup="menu"`).
  Your own avatar moves focus to the dock's button, a shortcut to Done.
- Equipment names in text: treadmill, flat bench, squat rack, dumbbell
  rack, lifting platform, pull-up bar, cable machine, exercise mat, followed
  by the slot number. Capitalised only at the start of a line.

#### Stations

`div.station` with `style="--x; --y"`, `data-slot`, and `data-equipment`
when there is equipment. It holds one 16 × 16 SVG: the equipment, or the
empty bay with its number. Yours (the slot you hold while Lifting, Resting,
Slacking or Away) adds `.mine` and a second SVG, the leaf corners.

### 3.3 The sheet

Unchanged, apart from these:

0. **The workout clock** (8 Oct). The sheet's second child, straight after
   the `.tab` chip, in every sheet state (Idle, Lifting, Resting, Rest up,
   Slacking, Editing, pending):

   ```html
   <p class="panel-clock">
     <Sprite sprite={clockIcon} scale={2} />
     <span class="vh">Workout time </span>
     <time datetime={`PT${elapsedS}S`} data-start={startedAt}>{clock(elapsedS)}</time>
   </p>
   ```

   Render it when `startedAt` is set (always, now that entering opens the
   workout). This is the same `<p>` that was in This workout, moved, with
   the icon added; the script's `time[data-start]` tick needs no change.
   Formatting is the existing `clock()`: `0:41`, `31:42`, `1:04:37`. No live
   region: it is read when reached, never announced each second. Without JS
   it shows the time at render, like every other server time on the page.

   `clockIcon` is new in `src/sprites/icons.ts`, a small face showing three
   o'clock:

   ```ts
   export const clockIcon = icon("..cccc..", ".c.c..c.", "c..c...c", "c..ccc.c", "c......c", ".c....c.", "..cccc..", "........");
   ```

   CSS: `.panel-clock` gains `display: flex; align-items: center; gap:
   var(--px);` (everything else in the rule is unchanged; the icon takes
   `currentColor`, so it is leaf). The tab chip and the clock fit side by
   side on a 360 px phone: the widest pair, `Slacking` and `1:04:37`, leaves
   more than 60 px between them.

1. **The dock.** The primary button moves out of its form into
   `div.dock`, the sheet's last child, and points back with the `form`
   attribute, as Save already did:
   - Lifting: `form.set-form#set-log`, then
     `<div class="dock"><button type="submit" form="set-log" class="wide">Done</button></div>`.
   - A rest running (Resting, Rest up, Slacking): the same form, and
     `<div class="dock"><p class="dock-timer" aria-hidden="true" hidden>1:24</p><button type="submit" form="set-log" name="action" value="start" class="wide">Start set</button></div>`.
     Done is not on the screen until Start set is tapped.
   - Editing: `<div class="dock"><button type="submit" form="set-edit" class="wide">Save</button></div>`.
   - Idle: `form.pick#pick`, then `<div class="dock"><button type="submit" form="pick" class="wide">Choose</button></div>`.

   Field names, values and the existing `action`s don't change; `start` is
   the one new value (item 7). The pending script now disables the dock's
   button (`event.submitter`, or
   `document.querySelector('[form="set-log"]')`) along with the fields.
2. **The dock timer** (`p.dock-timer`, rendered only while a rest is
   running). It shows the same text as `.timer` each tick, and takes
   `.slacking` (red) when the rest block does. It is shown only while the
   big `.timer` is not fully visible: an `IntersectionObserver` on `.timer`
   with `rootMargin: 0px 0px -{dock height}px 0px` and `threshold: 1`. On a
   laptop it never shows. Screen readers use the big timer.
3. **Your spot** (`p.spot`), after the lift row (`details.switch`) whenever
   you hold a station: the 16 px `claim` icon, then
   `Your spot: <b>{Equipment} {slot}</b>`. Not shown while editing or Idle.
4. **Idle**: under the select, `p.hint#pick-hint` "Choosing one claims a
   station on the map.", referenced by the select's `aria-describedby`.
5. **Choosing claims a station**: the idle `form.pick` and the switch's
   `form.picker` are `method="post"` with a hidden `action=choose` (the
   handler already staged). The "From this workout" chips become
   `<button type="submit" name="exercise" value="{id}">`, with
   `aria-current="true"` on the current lift, drawn as the chips they were.
6. **Rest over, in two steps** (GYM-11). Start set is the button in both:
   - **0 to 30 s over**: `div.rest.over`. The border stays `--resting`, the
     count-up `+0:12` is paper, the tab stays **Resting**, and `.rest-say`
     reads "Rest's up. Back under the bar 🔔". The beep and the three
     flashes happen at 0, as before.
   - **From the server's `slackAt`** (30 s over): `div.rest.over.slacking`.
     The border and the count-up turn `--slacking`, the tab becomes
     **Slacking**, and `.rest-say` reads "Your squad can see you 👀". Your
     avatar sits down on your station on every screen at the same moment.
7. **Start set** (`action=start`, new). A distinct value rather than
   `action=rest&delta=skip`, because it does more than skip: it ends the
   rest **and** sets Lifting on the exercise in the form, and the server
   logs it as its own state change (OPS-1).
   - **Where**: the dock's button whenever a rest is running and an exercise
     is chosen. It submits the set form (`form="set-log"`, `name="action"
     value="start"`), so `exercise_id` and the fields you may have just
     corrected go with it. Done's own submit carries no `action`, so it
     still logs, as before.
   - **Server**: `adjustRest(…, "skip")`, then `setLifting(user, room,
     exercise_id)`, then broadcast. The weight and reps it received are not
     saved; they are only echoed back.
   - **With JS**: post with `fetch`, and switch the sheet in place: the rest
     block goes, the tab becomes Lifting, `.last` shows "Last time 140 kg ×
     5", the dock's button becomes Done, and the fields keep what was typed.
     Focus moves to Done. For a hold or cardio, Start set also starts the
     stopwatch.
   - **Without JS**: the server answers 200 with the page rendered as
     Lifting and the submitted fields echoed (as the error path already
     echoes them), rather than redirecting.
   - **Skip is gone.** It did what Start set does minus the Lifting, so the
     rest row is now `−15 s` and `+15 s`. The server keeps accepting
     `delta=skip` (nothing in `spec/` posts it, but it costs nothing).
   - **While resting, the stopwatch row is hidden** for holds and cardio:
     Start set starts it.
   - **While editing** a set during a rest, the dock stays Save; Start set
     comes back after Save or Cancel.
8. **Done's stamp** (8 Oct). When the page is the GET after a log
   (`?rested=1`, which the log redirect already adds) on the lift just
   logged, the dock's first child is:

   ```astro
   {justLogged && (
     <p class="stamp">
       <Sprite sprite={tickIcon} scale={2} />
       <span>Set {loggedNo} logged: <b>{setLabel(latest!)}</b></span>
     </p>
   )}
   ```

   with, in the frontmatter after `latest`:

   ```ts
   // Done just landed: the GET after a log's redirect, on the lift logged.
   // Not after Start set, which posts to the same URL.
   const justLogged =
     Astro.request.method === "GET" && Astro.url.searchParams.has("rested") &&
     !editing && !!latest && latest.exerciseId === exercise?.id;
   const loggedNo = justLogged ? mySets.filter((s) => s.exerciseId === latest!.exerciseId).length : 0;
   ```

   It shows for every kind, in both docks it can meet (Start set after a
   rest kind, Done after cardio). It never shows on a 400 (that's a POST), so
   an error and a stamp are never on screen together. Add `tickIcon` to the
   icons import. The text is one line; a long run is cut with an ellipsis at
   the end (the pace), and the whole set is still announced and in This
   workout.
9. **Cardio's logged block** (8 Oct) replaces the bubble ("Logged! No rest
   timer after cardio 🏃"), in the same place (after the `h2.vh`, where the
   rest block would be):

   ```astro
   {justLogged && latest!.kind === "cardio" && (
     <div class="set-done">
       <Sprite sprite={tickIcon} scale={4} />
       <p class="set-done-n">Set {loggedNo} logged</p>
       <p class="set-done-say">No rest timer after cardio. Go again, or change lift 🏃</p>
     </div>
   )}
   ```

   No role (the announcement is item 11's). It is not a `.rest`, so the rest
   script never touches it. Delete the `.sheet .bubble` rule.
10. **Timed fields start empty** (8 Oct). In the `values` fallback, only
    weight and bodyweight pre-fill:

    ```ts
    : fieldsFrom(editing ?? (exercise.kind === "weight" || exercise.kind === "bodyweight" ? prefill : undefined), exercise));
    ```

    (`fieldsFrom(undefined, …)` already gives empty minutes, seconds and
    distance.) In `SetFields.astro`, `minutes` gets `placeholder="0"` and
    `seconds` gets `placeholder="00"`. `p.last` is unchanged and keeps its
    `showLast` rule. The stopwatch needs no change: Done already stops it and
    clears its stored start, and with empty fields Start (or Start set, for a
    hold) counts from zero.
11. **After a Done swap** (8 Oct, script): announce, and on a phone bring
    the sheet's top into view. Render `<p class="vh" id="sheet-news"
    role="status"></p>` as a sibling after `div.gym` (outside it, so the swap
    keeps it; `.vh` is scoped to `.gym` today, so give it the same rule).
    Then in the submit handler's `after()`:

    ```ts
    if (action === "log") afterDone();

    // Done landed (a 400 has no stamp): say what was logged, and on a phone,
    // if the sheet's top was scrolled away, jump it back to just under the top
    function afterDone() {
      const stamp = document.querySelector<HTMLElement>(".dock .stamp");
      if (!stamp) return;
      const news = document.querySelector<HTMLElement>("#sheet-news");
      if (news) {
        news.textContent = "";
        setTimeout(() => (news.textContent = stamp.textContent!.replace(/\s+/g, " ").trim()), 50);
      }
      const top = document.querySelector<HTMLElement>(".sheet")!.getBoundingClientRect().top;
      if (matchMedia("(max-width: 899px)").matches && top < 24) scrollBy({ top: top - 24, behavior: "instant" });
      // a reload shouldn't stamp the same set again
      const url = new URL(location.href);
      url.searchParams.delete("rested");
      history.replaceState(history.state, "", url);
    }
    ```

    The focus that follows uses `preventScroll`, so it keeps this scroll;
    the dock timer's observer re-checks by itself. Without JS, the page
    loads at the top, so the sheet's top is in view anyway.

### 3.4 The squad list (`section.panel` "Squad", `ul.people`)

One `li` per member: **you first, then by join order** (stable, so rows
don't jump as states change). Names stay in the HTML (a spec test looks for
them).

```html
<li class="me">                                   <!-- .me for you, .away when Away -->
  <svg class="av" viewBox="1 0 14 11" style="--av-…">…</svg>
  <span class="who">Priya <span class="badge">You</span> <span class="badge host">Host</span>
    <span class="what">Rest <span class="n">1:24 left</span> · lifting platform 5</span></span>
  <span class="chips"><span class="chip state-resting"><svg…/>Resting</span></span>
</li>
```

`.what` by state (`span.n` keeps a time on one line):

| State | `.what` |
| --- | --- |
| Lifting | `{Exercise} · {equipment} {slot}`: "Back squat · squat rack 3" |
| Resting | `Rest {m:ss} left · {equipment} {slot}` |
| Slacking | `{m:ss} over rest · {equipment} {slot}` |
| Idle | `No station yet` |
| Finished | `{n} sets · {duration}`, as home writes it |
| Away | `Offline {n} min · {equipment} {slot}` (or just `Offline {n} min` when Idle); the head fades to 50%, and `.chip.away` (phone-off icon, `Away`, dashed `--dim` border on `--night`) sits under the state chip |

- The times tick every second on the client, from the server's
  `stateStartedAt` / rest end / `slackAt`. The list has no live region:
  other people's changes update quietly (system 12).
- `p.alone` "Just you so far. Send the passcode to the squad 📲" stays,
  when you are the only member.

### 3.5 This workout

Unchanged, except that **`p.panel-clock` is removed** from it (it moved to
the sheet, 3.3 item 0). It still renders only when `mySets.length > 0`, with
Finish workout at its foot; its top border now carries only the title.

### 3.6 The Room panel (`section.panel.sign`)

- `h2.panel-title` "Room" (the page's `h1` is now the map's sign).
- `p.spots`: the 12 pips and "N of 12 in".
- `p.hint`: "Send the code to the squad, or this link:
  `<span class="room-link">spotter.fly.dev/join/SB64FR</span>`" (ROOM-3's
  invite link; the host is `Astro.url.host`).
- Leave and End room (host, with others in) are unchanged.
- **The leave note** gains a third case, for when you have logged nothing
  (checked in this order):
  - last one in: "You're the last one in, so leaving closes the room."
  - no sets yet: "Nothing logged yet, so there's no workout to save."
  - otherwise: "Leaving finishes your workout. Your sets stay in the book."


### 3.7 What the page needs from the server

`roomView()` (staged in `src/lib/presence.ts`) gives state, away, exercise
and `slackAt` per member. The map also needs:

- per member: `slot` (the station they hold, or null), the avatar JSON,
  `stateStartedAt` (for "Offline 2 min" and the walk-in), and the rest end
  (for "1:24 left");
- per room: the 12 stations, `{ slot, equipment | null }`.

The first render comes from the server (so it works without JS and after a
reload, GYM-8). Each SSE message carries the same view; the client redraws
stations, avatars and rows from it.

### 3.8 The script (additions)

- **Scale**: on load and on `resize`, set `--s` on `.map` (3.2).
- **Live stream**: `new EventSource("/rooms/{id}/events")`. On each message,
  update stations, avatars (start a walk when a tile changes) and list rows.
  On `error`, if the stream hasn't reopened within 3 s, swap `.conn`'s content
  to the `.lost` chip (signal icon, "Reconnecting…"). On `open`,
  swap back to `Live` and redraw from the fresh view. Nothing else changes:
  no modal, no red, the map keeps its last picture, and every form still
  posts normally.
- **Ticks**: the existing 1 s tick also updates the list's times and the
  dock timer, and flips people to Slacking at their `slackAt` without
  waiting for the server.
- **Dock timer**: the `IntersectionObserver` in 3.3.
- **Your avatar**: `click` moves focus to `.dock button`.
- **After Done** (8 Oct): `afterDone()` in 3.3 item 11.

## 4. States

| State | Trigger | What changes |
| --- | --- | --- |
| **Busy room** (default) | Six in: you resting, two lifting, one slacking, one resting and Away, one Idle | All of the above at once. Your station 5 has leaf corners while you stand at the cooler; Ji-woo sits on the bench with her phone; Tom is faded at the cooler with the phone-off icon; Sam stands by the lockers. |
| **Room alone** (empty) | You are the only member | The opening four on slots 1 to 4, bays 5 to 12 empty, you Idle by the lockers. The Idle sheet with the claim hint and Choose. Squad: your row and `.alone`. Room: 1 of 12, the leave-closes note, no End. |
| **You slacking** | The server's `slackAt` passes | Your tag goes red, you sit on your station with your phone (on every screen); the sheet's rest block, tab and line as in 3.3 step 6; your row reads "2:47 over rest". |
| **Rest up** | 0 to 30 s past the rest's end | Blue border, paper count-up, Resting tab, "Rest's up. Back under the bar 🔔", Start set in the dock. On the map you're still at the cooler. |
| **Lifting (after Start set)** | Start set tapped | No rest block; tab Lifting; "Last time 140 kg × 5"; your spot; fields as typed; **Done** in the dock. On the map you walk from the cooler to your station and lift. |
| **Reconnecting** | The event stream has been down for 3 s | `.conn` shows the dashed `Reconnecting…` chip with the signal icon. Everything else stays: the map holds its last picture, times keep ticking, Done still posts. When the stream reopens, `Live` returns and the room redraws. After 60 s down, the others see you as Away; your own screen doesn't. |
| **Someone Away** | Their last heartbeat is 60 s old | Their sprite fades, the phone-off icon joins their tag, `Away` joins their list row. They keep their spot and station. |
| **Equipment arrives** | Someone claims an empty bay (GYM-4) | The bay's sprite becomes the equipment, in place, on every screen. No animation this week. |
| **Phone, first screen** | A 390 × 660 phone (browser bars showing) | The whole map, then the sheet; the fixed dock covers the lower half of the big timer, so the dock shows its copy beside Start set. With the bars collapsed (about 750 tall) the big timer is clear and the copy hides. |
| **Phone, scrolled** | Scrolled to the squad list | The dock stays with its timer copy and Start set. |
| **No sets yet** (8 Oct) | You've just entered a room (joined, created or come back) and logged nothing | The sheet's border carries the clock from `0:00`, counting up (drawn at `0:41`, Idle, Pick a lift). No This workout panel and so no Finish. The Room panel's leave note reads "Nothing logged yet, so there's no workout to save." Drawn as Priya joining Mia's busy room (Mia is host, so no End room). "Room alone" is the same moment for the room's creator, at `0:08`. |
| **Phone, first screen, no sets yet** | The same, on a 390 × 660 phone | The map, then the sheet's top: Idle on the left of its border, the clock on the right, Choose pinned below. The clock is on the first screen. |
| **First set logged** | The first Done of the workout | The clock stays on the sheet, unchanged (`6:30`). This workout appears between Squad and Room with "1 set · 700 kg moved so far", one row (Deadlift 140 kg × 5, pencil) and Finish workout. The leave note returns to "Leaving finishes your workout…". |
| **Just logged · weight** (8 Oct) | Done on Deadlift set 2, 140 kg × 5 (bodyweight is the same) | The rest block appears at the top (`2:59` of `3:00`, "after 140 kg × 5"), tab Resting, Set 3, the fields keep 140 × 5, Start set replaces Done. The stamp "Set 2 logged: 140 kg × 5" on the dock's border for 4 s; the screen reader hears "Start set", then the stamp. On the map you walk to the cooler. |
| **Just logged · cardio** (8 Oct) | Done on a 1 km rep of Run (Incline walk the same) | No rest. `div.set-done` at the top: tick, "Set 1 logged", "No rest timer after cardio. Go again, or change lift 🏃". Tab stays Lifting, Set 2, "Last time 1 km · 4:52 · 4:52 /km", distance and time empty (dim `0:00`), stopwatch Start ready, Done stays. The stamp "Set 1 logged: 1 km · 4:52 · 4:52 /km". On the map you stay on the treadmill. |
| **Just logged · plank** (8 Oct) | Done on a 1:30 hold | Like weight: the 1:00 rest starts ("after 1:30"), tab Resting, Set 2, Start set. The Hold field is empty (dim `0:00`) and the stopwatch row stays hidden until Start set starts it from zero. The stamp "Set 1 logged: 1:30". |
| **Phone, just logged** (8 Oct; weight and cardio frames) | Done tapped on a 390 × 660 phone while scrolled down to the fields | The page jumps so the sheet's top border is 24 px under the top of the screen: the new timer (or the logged block), Set N+1 and the fields above the pinned dock, the stamp on the dock. If the sheet's top was already in view, nothing scrolls. |
| **Finished** (others; not drawn) | Someone finished their workout here | They stand at an idle spot with a trophy-yellow tag; their row reads "12 sets · 48 min" with the Finished chip. |
| Idle, edit set, delete confirm, end-room confirm, pending, without JS, first time, bodyweight, duration, stopwatch running, error | As in the last revision (the old "cardio, stopwatch idle" state with the bubble is now "Just logged · cardio"; the duration state's Hold field is now empty) | Unchanged, except that the primary button is in the dock, a chosen lift shows `p.spot`, and every sheet with a rest running has Start set instead of Done and no Skip (pending, without JS, duration, which also hides its stopwatch until Start set; edit and delete keep Save). Pending disables the dock's button. Without JS the map is the server's render at the CSS scale, the list shows server times, and `.conn` stays `Live`. |

## 5. Departures

1. **Map size: 10 × 10 tiles**, confirmed by the user (system 16 had left
   it open). It gives 2× on a 360 px phone, with room for 12 stations two
   tiles apart, a cooler, lockers, aisles and a door.
2. **Name tags are the state colour with an ink name**, not paper on 70%
   black. System 5 says the state colour is used for the name tag; system 9
   describes it the other way. At 2× there's no room for an icon box in the
   tag, so the map shows state by colour and pose, and the word is in the
   avatar's accessible name and the list (system 2.3 still holds on the
   page as a whole).
3. **Tags cut names to 6 characters** on the map. Display names run to 20;
   the full name is in the list and the accessible name.
4. **The connection indicator sits on the map's border, not the top bar**
   (system 13). The top bar is the layout's, shared by every page; the map
   is what goes stale.
5. **The passcode moves to the map's sign** and the Room panel's `h1`
   becomes an `h2`. System 8 sketches the passcode and headcount in a gym
   top bar; the layout's top bar is unchanged here.
6. **On phones the sheet is no longer pinned; only its dock is** (system 8:
   "Bottom panel: pinned to the bottom on phones"). A pinned sheet is about
   470 px tall while resting, so with the map above it neither could be
   seen whole. The dock keeps Done pinned, and its timer copy (48 px VT323,
   above the 32 px floor) keeps the timer in view.
7. **Red waits for the server's Slacking** (30 s over). This settles the
   last revision's open question: your screen and your squad's now turn
   red at the same moment.
8. **Away has a chip** (`.chip.away`, dashed `--dim` on `--night`). It is a
   flag, not a state, so it has no colour.
9. **The recent-lift chips are buttons**, because choosing now posts. They
   look the same.
10. **The cooler and the lockers are set into the side walls**, to keep the
    lobby free for people.
11. **New patterns**: the map sign, the `Live` badge on a border, the dock
    timer. They use only tokens and the `--px` grid.
12. **Start set replaces Skip, and Done waits for it.** The last revision
    let Done log straight from a rest (one tap). Now a set is Start set,
    then Done, as system 2.1 describes, so the squad sees you lifting rather
    than slacking. Done never appears while a rest runs.
13. **The workout clock lives on the sheet, not on This workout** (8 Oct).
    Not a break from the system: the sheet is still state, lift, numbers,
    one button; the clock sits in its border, as the passcode and `Live`
    sit in the map's. One new 8 × 8 icon, `clock`.

14. **Done's acknowledgement is a stamp on the dock, not a `.banner`**
    (8 Oct). System 13 puts success in the gym in a `.banner`, which slides
    in from the top of the map. On a phone scrolled to the fields the map is
    off screen, and the banner is for what other people do to you. The stamp
    keeps the banner's 4 s, its stepped motion and its `role="status"`
    announcement (through `#sheet-news`), and moves to where Done was
    tapped. It never covers the button (system 14's rule against "a banner
    over the bottom panel"): it sits on the dock's border and lets taps
    through.
15. **Timed sets no longer pre-fill** (8 Oct, the user's call). LOG-3 says
    "Each pre-fills from the person's last set of that exercise". Now only
    weight and bodyweight lifts do; duration and cardio sets open and come
    back empty, with `p.last` as the reference, because the stopwatch counts
    on from the fields. **The build should update LOG-3 in
    `docs/product/spec-4-weeks.md`** to: "…Weight and bodyweight sets
    pre-fill from the person's last set of that exercise; duration and
    cardio sets start empty, with the last set shown for reference."
16. **On a phone, Done can scroll the page** (8 Oct). The swap otherwise
    keeps the scroll. Only after a successful Done, only on a phone, only
    when the sheet's top is above the screen, and as a jump (system 11: no
    smooth motion).
17. **The cardio bubble becomes a block** (8 Oct). The `.bubble` was a Paper
    pattern borrowed for the gym, and nobody saw it. `div.set-done` reuses
    the rest block's frame in leaf.

## 6. Open questions

- None on map size: 10 × 10 is confirmed by the user.
- **Exercise loops.** The 4-week spec asks for eight two-frame loops. The
  mockup draws one lift pose (bar overhead) and the treadmill's standing
  frame. If time is short this week, one shared two-frame lift loop for
  every piece of equipment is a reasonable first cut.
- **Opening a timed lift empty** (8 Oct). Recommended and drawn (3.3 item
  10): one rule for every timed set. If the user would rather a fresh Run
  pre-filled its distance (an interval runner repeats 1 km), the cheapest
  variant is to pre-fill distance only and never time; that's their call.
- **Crowds.** With four or more people resting (or Idle) at once, tags
  start to overlap. The showcase will test this; staggering tag heights is
  the next step if it reads badly.

## 7. Notes for the build

- Sprites: the avatar body, hair and slot classes come from the Lobby
  group's `src/sprites/avatar.ts`. The poses below are built on that body.
  The gym's tiles, scenery and equipment go in a new `src/sprites/gym.ts`
  (appendix). All are drawn with `Sprite.astro`-style rects, crisp edges,
  whole-number scale.
- Two-frame loops (system 11): Idle and Resting bob the upper body (rows 0
  to 12) 1 px every 400 ms; Lifting alternates the lift pose with the bar
  at shoulder height every 250 ms; Slacking alternates the phone glow on
  and off every 400 ms. Freeze on frame one under reduced motion.
- Keep the old ids for everything the spec tests touch: `class="passcode"`,
  `?edit=` links, `name` before `value` on `weight_kg` and `reps`.

## Appendix: the gym's sprites

### Poses (on the Lobby group's `BODY`, slots `k s t h`)

- **stand**: `BODY` with the hair overlay at row 0.
- **lift**: `BODY` with rows 9 to 12 replaced by
  `".kskttttttttksk."`, `"..kttttttttttk.."`, `"..kttttttttttk.."`,
  `"...kttttttttk..."`; arms at columns 1 to 2 and 13 to 14: row 1 is `k k`
  / `k k`, rows 2 to 8 are `k s` / `s k`. Then the hair overlay, then a bar
  prop on row 0: `"mmwwwwwwwwwwwwmm"` (`m` dim, `w` paper).
- **rest**: stand, plus a bottle prop at (12, 8):
  `".k."`, `"kwk"`, `"krk"`, `"krk"`, `"krk"`, `"kkk"` (`r` resting blue).
- **sit**: two empty rows, `BODY` rows 0 to 8, then
  `"...kkttttttkk..."`, `"..ktttkkkktttk.."`, `"..ktskkkkkkstk.."`,
  `".kkkkkkkkkkkkkk."`, `".kssk......kssk."`; the hair overlay at row 2; a
  phone glow prop `"ww"` at (7, 12).

Prop slots in CSS: `.av .pm { fill: var(--dim) }`, `.av .pw { fill:
var(--paper) }`, `.av .pr { fill: var(--resting) }`.

### Map, tiles, scenery, equipment

```ts
// src/sprites/gym.ts (proposed). Palette letters are token values:
// k ink, n night, f floor, p panel, d deep, g green, e edge, m dim, w paper, l leaf, r resting
export const MAP = [
  "WMMMKPMMMW",
  "[...::...]",
  "[::::::::]",
  "[...::...]",
  "[::::::::]",
  "[...::...]",
  "[::::::::]",
  "C...::...L",
  "[...::...]",
  "____Ee____",
];

export const STATIONS = [ // slot 1 to 12, [x, y]
  [1, 1], [3, 1], [6, 1], [8, 1], [1, 3], [3, 3], [6, 3], [8, 3], [1, 5], [3, 5], [6, 5], [8, 5],
];

export const TILES = {
  ".": [
    "pppppppppppppppp",
    "pfffffffffffffff",
    "pfffffnfffffffff",
    "pfffffffffffnfff",
    "pffnffffffffffff",
    "pfffffffffffffff",
    "pfffffffffnfffff",
    "pfffffffffffffff",
    "pffffffnffffffff",
    "pfffffffffffffff",
    "pfffffffffffffnf",
    "pffnffffffffffff",
    "pfffffffffffffff",
    "pfffffffnfffffff",
    "pfffffffffffffff",
    "pfffffffffffffff",
  ],
  ":": [
    "pppppppppppppppp",
    "pppppppppppppppp",
    "ppgppppppppgpppp",
    "pppppppppppppppp",
    "pppppppppppppppp",
    "pppppppppppppppp",
    "pppppgppppppppgp",
    "pppppppppppppppp",
    "pppppppppppppppp",
    "pppppppppppppppp",
    "ppgppppppppgpppp",
    "pppppppppppppppp",
    "pppppppppppppppp",
    "pppppppppppppppp",
    "pppppgppppppppgp",
    "pppppppppppppppp",
  ],
  "W": [
    "kkkkkkkkkkkkkkkk",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "kkkkkkkkkkkkkkkk",
    "kkkkkkkkkkkkkkkk",
  ],
  "M": [
    "kkkkkkkkkkkkkkkk",
    "dddddddddddddddd",
    "dkkkkkkkkkkkkkkd",
    "dkmmmmmmmmmwmmkd",
    "dkmmmmmmmmwmmmkd",
    "dkmmmmmmmwmmmmkd",
    "dkmmmmmmwmmmmmkd",
    "dkmmmmmwmmmmwmkd",
    "dkmmmmwmmmmwmmkd",
    "dkmmmwmmmmwmmmkd",
    "dkmmmmmmmwmmmmkd",
    "dkmmmmmmmmmmmmkd",
    "dkkkkkkkkkkkkkkd",
    "dddddddddddddddd",
    "kkkkkkkkkkkkkkkk",
    "kkkkkkkkkkkkkkkk",
  ],
  "K": [
    "kkkkkkkkkkkkkkkk",
    "dddddddddddddddd",
    "dddddkkkkkkddddd",
    "ddddkwwwwwwkdddd",
    "dddkwwwwkwwwkddd",
    "dddkwwwwkwwwkddd",
    "dddkwwwwkwwwkddd",
    "dddkwwwwkkkwkddd",
    "gggkwwwwwwwwkggg",
    "gggkwwwwwwwwkggg",
    "ddddkwwwwwwkdddd",
    "dddddkkkkkkddddd",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "kkkkkkkkkkkkkkkk",
    "kkkkkkkkkkkkkkkk",
  ],
  "P": [
    "kkkkkkkkkkkkkkkk",
    "dddddddddddddddd",
    "ddkkkkkkkkkkkkdd",
    "ddkllllllllllkdd",
    "ddkllllllllllkdd",
    "ddklkkllllkklkdd",
    "ddklkkkkkkkklkdd",
    "ddklkkllllkklkdd",
    "ggkllllllllllkgg",
    "ggklkkkkkkkklkgg",
    "ddkllllllllllkdd",
    "ddklkkkkkllllkdd",
    "ddkkkkkkkkkkkkdd",
    "dddddddddddddddd",
    "kkkkkkkkkkkkkkkk",
    "kkkkkkkkkkkkkkkk",
  ],
  "[": [
    "kdddddddddddddgk",
    "kdddddddddddddgk",
    "kdddddddddddddgk",
    "kdddddddddddddgk",
    "kdddddddddddddgk",
    "kdddddddddddddgk",
    "kdddddddddddddgk",
    "kkkkkkkkkkkkkkgk",
    "kdddddddddddddgk",
    "kdddddddddddddgk",
    "kdddddddddddddgk",
    "kdddddddddddddgk",
    "kdddddddddddddgk",
    "kdddddddddddddgk",
    "kdddddddddddddgk",
    "kkkkkkkkkkkkkkgk",
  ],
  "]": [
    "kgdddddddddddddk",
    "kgdddddddddddddk",
    "kgdddddddddddddk",
    "kgdddddddddddddk",
    "kgdddddddddddddk",
    "kgdddddddddddddk",
    "kgdddddddddddddk",
    "kgkkkkkkkkkkkkkk",
    "kgdddddddddddddk",
    "kgdddddddddddddk",
    "kgdddddddddddddk",
    "kgdddddddddddddk",
    "kgdddddddddddddk",
    "kgdddddddddddddk",
    "kgdddddddddddddk",
    "kgkkkkkkkkkkkkkk",
  ],
  "_": [
    "kkkkkkkkkkkkkkkk",
    "gggggggggggggggg",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "kkkkkkkkkkkkkkkk",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "dddddddddddddddd",
    "kkkkkkkkkkkkkkkk",
  ],
  "E": [
    "kdkggggggggggggg",
    "kdkggggggggggggg",
    "kdkggggggggggggg",
    "kdkggggggggggggl",
    "kdkgggggggggggll",
    "kdkgggggggggglll",
    "kdkgggggggggllll",
    "kdkggggggggggggl",
    "kdkggggggggggggl",
    "kdkggggggggggggl",
    "kdkggggggggggggl",
    "kdkggggggggggggl",
    "kdkggggggggggggl",
    "kdkggggggggggggg",
    "kdkggggggggggggg",
    "kdkggggggggggggg",
  ],
  "e": [
    "gggggggggggggkdk",
    "gggggggggggggkdk",
    "gggggggggggggkdk",
    "lggggggggggggkdk",
    "llgggggggggggkdk",
    "lllggggggggggkdk",
    "llllgggggggggkdk",
    "lggggggggggggkdk",
    "lggggggggggggkdk",
    "lggggggggggggkdk",
    "lggggggggggggkdk",
    "lggggggggggggkdk",
    "lggggggggggggkdk",
    "gggggggggggggkdk",
    "gggggggggggggkdk",
    "gggggggggggggkdk",
  ],
};

// drawn over the wall tile named by base
export const SCENERY = {
  C: { base: "[", grid: [
    "................",
    ".....kkkkkk.....",
    "....krrrrrrk....",
    "....krrwrrrk....",
    "....krrwrrrk....",
    "....krrrrrrk....",
    ".....kkrrkk.....",
    "...kkkkkkkkkk...",
    "...kwwwwwwwwk...",
    "...kwrkwwkrwk...",
    "...kwwwwwwwwk...",
    "...kmmmmmmmmk...",
    "...kmmmmmmmmk...",
    "...kmmmmmmmmk...",
    "...kmmmmmmmmk...",
    "...kkkkkkkkkk...",
  ] },
  L: { base: "]", grid: [
    "kkkkkkkkkkkkkkkk",
    "keeeeeekkeeeeeek",
    "kemmmmekkemmmmek",
    "keeeeeekkeeeeeek",
    "kemmmmekkemmmmek",
    "keeeeeekkeeeeeek",
    "keeeeeekkeeeeeek",
    "keeeewekkeweeeek",
    "keeeewekkeweeeek",
    "keeeeeekkeeeeeek",
    "keeeeeekkeeeeeek",
    "keeeeeekkeeeeeek",
    "keeeeeekkeeeeeek",
    "keeeeeekkeeeeeek",
    "kkkkkkkkkkkkkkkk",
    "kkkkkkkkkkkkkkkk",
  ] },
};

export const EQUIPMENT = {
  "treadmill": [
    "..kkkkkkkkkkkk..",
    "..kmmmmmmmmmmk..",
    "..kmkkkkkkkkmk..",
    "..kmkwwwwwwkmk..",
    "..kmkkkkkkkkmk..",
    "..kmmmmmmmmmmk..",
    "..kkmkkkkkkmkk..",
    "..kmmknnnnkmmk..",
    "..kmmknnnnkmmk..",
    "..kmmkkkkkkmmk..",
    "..kmmknnnnkmmk..",
    "..kmmknnnnkmmk..",
    "..kmmkkkkkkmmk..",
    "..kmmknnnnkmmk..",
    "..kmmknnnnkmmk..",
    "..kkkkkkkkkkkk..",
  ],
  "flat-bench": [
    "kkkk........kkkk",
    "kmmkwwwwwwwwkmmk",
    "kmmk.kk..kk.kmmk",
    "kkkk.kk..kk.kkkk",
    "....kkkkkkkk....",
    "....kggggggk....",
    "....kggggggk....",
    "....kggggggk....",
    "....kggggggk....",
    "....kggggggk....",
    "....kggggggk....",
    "....kggggggk....",
    "....kkkkkkkk....",
    ".....kmk.kmk....",
    ".....kmk.kmk....",
    ".....kkk.kkk....",
  ],
  "squat-rack": [
    "..kkkkkkkkkkkk..",
    "..kmmmmmmmmmmk..",
    "..kkkkkkkkkkkk..",
    "..kmk......kmk..",
    "kkkmk......kmkkk",
    "kmkmk......kmkmk",
    "kmwwwwwwwwwwwwmk",
    "kmkmk......kmkmk",
    "kkkmk......kmkkk",
    "..kmk......kmk..",
    "..kmk......kmk..",
    "..kmk......kmk..",
    "..kmk......kmk..",
    ".kkmkk....kkmkk.",
    ".kmmmk....kmmmk.",
    ".kkkkk....kkkkk.",
  ],
  "dumbbell-rack": [
    "................",
    ".kkk.kkkkkk.kkk.",
    ".kmkkkmkkmkkkmk.",
    ".kmwwwmkkmwwwmk.",
    ".kmkkkmkkmkkkmk.",
    ".kkk.kkkkkk.kkk.",
    "keeeeeeeeeeeeeek",
    "kkkkkkkkkkkkkkkk",
    ".kkk.kkkkkk.kkk.",
    ".kmkkkmkkmkkkmk.",
    ".kmwwwmkkmwwwmk.",
    ".kmkkkmkkmkkkmk.",
    ".kkk.kkkkkk.kkk.",
    "keeeeeeeeeeeeeek",
    "kkkkkkkkkkkkkkkk",
    ".kk..........kk.",
  ],
  "lifting-platform": [
    "kkkkkkkkkkkkkkkk",
    "keeeeeeeeeeeeeek",
    "keeeeeeeeeeeeeek",
    "keekkkeeeekkkeek",
    "keekmkeeeekmkeek",
    "keekmkeeeekmkeek",
    "keekmkkkkkkmkeek",
    "keekmwwwwwwmkeek",
    "keekmkkkkkkmkeek",
    "keekmkeeeekmkeek",
    "keekmkeeeekmkeek",
    "keekkkeeeekkkeek",
    "keeeeeeeeeeeeeek",
    "keeeeeeeeeeeeeek",
    "keeeeeeeeeeeeeek",
    "kkkkkkkkkkkkkkkk",
  ],
  "pull-up-bar": [
    ".kkkkkkkkkkkkkk.",
    ".kwwwwwwwwwwwwk.",
    ".kkkkkkkkkkkkkk.",
    ".kmk........kmk.",
    ".kmk........kmk.",
    ".kmk........kmk.",
    ".kmk........kmk.",
    ".kmk........kmk.",
    ".kmk........kmk.",
    ".kmk........kmk.",
    ".kmk........kmk.",
    ".kmk........kmk.",
    ".kmk........kmk.",
    "kkmkk......kkmkk",
    "kmmmk......kmmmk",
    "kkkkk......kkkkk",
  ],
  "cable-machine": [
    "..kkkkkkkkkkkk..",
    "..kmmmmmmmmmmk..",
    "..kmkkkkkkkkmk..",
    "..kmk......kmk..",
    "..kmk.kkkk.kmk..",
    "..kmk.kwwk.kmk..",
    "..kmk.kkkk.kmk..",
    "..kmk.kwwk.kmk..",
    "..kmk.kkkk.kmk..",
    "..kmk.kwwk.kmk..",
    "..kmk.kkkk.kmk..",
    "..kmk.kwwk.kmk..",
    "..kmk.kkkk.kmk..",
    ".kkmkkkkkkkkmkk.",
    ".kmmmmmmmmmmmmk.",
    ".kkkkkkkkkkkkkk.",
  ],
  "exercise-mat": [
    "................",
    "...kkkkkkkkkk...",
    "...kggggggggk...",
    "...keeeeeeeek...",
    "...kggggggggk...",
    "...kggggggggk...",
    "...keeeeeeeek...",
    "...kggggggggk...",
    "...kggggggggk...",
    "...keeeeeeeek...",
    "...kggggggggk...",
    "...kggggggggk...",
    "...keeeeeeeek...",
    "...kggggggggk...",
    "...kkkkkkkkkk...",
    "................",
  ],
};

export const CLAIM = [ // your station: leaf corners
  "llll........llll",
  "l..............l",
  "l..............l",
  "l..............l",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "l..............l",
  "l..............l",
  "l..............l",
  "llll........llll",
];
```

The empty bay is generated, not drawn: a dashed square in `e` on rows and columns 1 and 14 (pixels `i` where `((i - 1) >> 1) % 2 === 0`, plus 14), and the slot number in 3 × 5 digits in `e`, centred, from row 5. Bay 7 comes out as:

```
................
.ee..ee..ee..ee.
.e............e.
................
................
.e....eee.....e.
.e......e.....e.
.......e........
.......e........
.e.....e......e.
.e............e.
................
................
.e............e.
.ee..ee..ee..ee.
................
```

New 8 × 8 icons for `src/sprites/icons.ts` (`c` is the text colour):

```ts
export const phoneOffIcon = icon("cccc.c.c", "c..c..c.", "c..c.c.c", "c..c....", "c..c....", "cccc....", "c.cc....", "cccc....");
export const signalIcon = icon("......c.", "........", "...cc.c.", "...cc...", "cc.cc.c.", "cc.cc...", "cc.cc.c.", "........");
export const claimIcon = icon("cc....cc", "c......c", "........", "........", "........", "........", "c......c", "cc....cc");
```
