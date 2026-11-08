# Acceptance criteria: Avatar accessories, and how they're unlocked

- **Area**: Avatar (`docs/product/spec-4-weeks.md`, AV-1 to AV-4), where it
  meets the logbook (LB-4, LB-6, LB-7), the gym's room moments (GYM-13,
  GYM-17, GYM-18), interactions and presets (INT-3, INT-5, INT-10, INT-12)
  and Dony (BOT-5).
- **Requirements covered**: **AV-4** reworded, and three rows **proposed for
  the spec**, none in it yet. All four are **P1**. The build starts now (D12),
  in this order, cut from the end if time runs short: AV-4 (the slots, the
  starters, the editor), AV-7 (accessories drawn everywhere, live), AV-5's
  ten quick unlocks, AV-6 (being told, Wear it), then AV-5's four long-haul
  unlocks. If drawing time runs short, accessories are cut in the order under
  "The accessories".
  - **AV-4** Accessories: three slots, and the starters (replaces "Accessories
    (cap, headband, sweatband) as one more overlay layer")
  - **AV-5** Earning accessories (proposed)
  - **AV-6** Being told about an unlock, and Wear it (proposed)
  - **AV-7** Where accessories show, and live updates (proposed)
- **Status**: agreed (every open question settled)
- **Date**: 8 Nov 2026 (drafted and settled the same day); D13 to D17 added
  9 Nov 2026 from the Lobby designer's art and editor
  (`docs/design/avatar/spec.md`, "Accessories, Nov 8", A.1 to A.10); see
  Decisions

## The request

The user, 8 Nov 2026 (translated): "Mostly follow your suggestions. Add some
accessories you can choose from the start. Make most accessories' unlock
conditions loose, because grading and showcase time is limited. Make a small
number of them unlock only through sustained use. Let pm design the details."
On the draft, the same day: a bigger list than the draft's fourteen, with more
starters and more quick unlocks, for more to play with at the showcase; the
four long-haul unlocks as they were (D1).

A marker or showcase visitor spends 10 to 20 minutes in the app, often with a
fresh account, often alone or with Dony. Most unlocks have to be reachable in
that window by doing what the app is about (logging sets, resting,
interacting, a PB). A few take weeks, so the scheme isn't hollow.

Settled before this file and not reopened here (the art research, 8 Nov):
three slots, at most one item each, all three worn together; head items and
neck items are drawn once at the head anchor and follow every pose; a neck
item shows only on the tee (made precise on 9 Nov, D13); wristbands and bracelets are out;
accessories carry their own fixed colours, and a colour variant of one
drawing is nearly free; accessories are drawn, never uploaded, and stored as
ids on the user like the look (AV-1).

The principles the user accepted with the draft: reward turning up and
training together, not strength; an unlock is worn on the avatar, where the
room sees it; everything is worked out on the server from stored data, so it
is right after a restart and existing accounts get what they've already
earned; warm-up sets don't count (as LB-4); Dony never earns or wears one
(BOT-5).

## Terms

Used with these meanings throughout. Terms defined in `logbook.md` (working
set, record, record mark, week, streak) and `room-feel.md` (PB, room banner,
logged stamp, sound setting) keep those meanings.

- **Accessory**: a small drawing worn over the avatar, in one **slot**:
  **head** (worn over the hair), **face** (over the brow, eyes and the row
  under them, never the mouth; D17) or **neck** (on the tee only; D13). At
  most one per slot; all three can be worn at once.
- **The tee**: the pixels of the avatar's shirt from the collar down to, not
  including, the belt line, in whatever pose it is drawn, and not under a
  prop or a machine's front. The cargos share the shirt's shade but are not
  the tee. A pose with no belt line below the collar (the squat's low frame,
  the exercise mat) has no tee (D13; avatar spec A.8).
- **Drawing**: one piece of pixel art. Several accessories can share a
  drawing in different fixed colours (a **colour variant**), as the three
  medals do.
- **Starter**: an accessory anyone can choose from their first visit, as they
  choose a hair style.
- **Earned**: an accessory that can only be chosen once its condition has
  been met. Until then it is **locked**. The moment it becomes choosable is
  its **unlock**; the person is the **earner**.
- **Quick unlock**: one of the ten earned accessories meant for a first
  session. **Long-haul unlock**: one of the four meant to take weeks.
- **Wearing**: the accessories the person has chosen, stored on their
  account with their look. **Wear it**: a one-tap action that puts a newly
  unlocked accessory in its slot, replacing whatever was there.
- **Finished workout** (for unlocks): a workout that has ended (by Finish, or
  by its room closing, ROOM-6) and holds at least one working set.
- **Day trained**: a calendar day in Australia/Sydney time (`logbook.md` D21)
  on which the person completed at least one working set, by the server's
  clock.
- **Day trained together**: a day trained on which the person and at least
  one other person (never Dony) each completed a working set in the same
  room.
- **Cheer sent**: an accepted Cheer from the person, from the menu or from a
  room banner, to anyone, Dony included (D5). Replies (Thanks) are not
  Cheers.
- **Hype preset sent**: an accepted preset from the hype group (INT-5: "One
  more rep!", "Light weight!", "Let's gooo", "Lock in", "That's a W set"), to
  anyone, Dony included (INT-5.15). Nudge presets are not counted. On screen
  these are "hype messages"; "preset" is never shown to people (D16).
- **High-five landed**: a High-five that happened (INT-10.6), with the person
  as offerer or acceptor, with anyone, Dony included (D5). A lapsed offer is
  not one.
- **On-time rest**: a rest after a working set (not after a cardio set,
  which has none, LOG-4) that ended before it turned Slacking: the person's
  next Start set, or a skipped rest, came less than 30 s past its target
  (GYM-11). A rest still running, or the last set of a workout with no next
  Start set, is not one yet.
- **Machine tried**: a piece of equipment (GYM, the equipment table) on
  which the person has completed at least one working set, ever. The two
  exercises on one machine count as one machine.
- **Slacking time**: the time spent Slacking, as the workout summary counts
  it (LOG-6), totalled over all the person's workouts.

### The accessories (D1)

Twenty-one accessories from fifteen drawings. Colour variants share a
drawing.

| Accessory | Slot | Kind | Condition | Drawing |
| --- | --- | --- | --- | --- |
| Cap | head | starter | none | cap |
| Beanie | head | starter | none | beanie |
| Pink beanie | head | starter | none | beanie (pink) |
| Bucket hat | head | starter | none | bucket hat |
| Headphones | head | starter | none | headphones |
| Glasses | face | starter | none | glasses |
| Towel | neck | starter | none | towel |
| Sweatband | head | quick | Your first working set | headband (white) |
| Shades | face | quick | Your first PB: a set of yours carries a record mark (LB-4.10) | shades |
| Bronze medal | neck | quick | Your first finished workout | medal (bronze) |
| Hype band | head | quick | 5 Cheers sent | headband (bright) |
| Star shades | face | quick | 3 hype presets sent | star shades |
| Heart shades | face | quick | Your first High-five landed | heart shades |
| Mirror shades | face | quick | 3 on-time rests | shades (mirrored lenses) |
| Bandana | head | quick | 3 machines tried | bandana |
| Squad cap | head | quick | Your first day trained together | cap (Spotter green, cream logo; D14) |
| Nightcap | head | quick, the joke one (D4) | 60 s of Slacking time in total | nightcap |
| Silver medal | neck | long-haul | 10 days trained | medal (silver) |
| Gold medal | neck | long-haul | 30 days trained | medal (gold) |
| Gold chain | neck | long-haul | 5 days trained together | chain |
| Crown | head | long-haul | A streak of 4 weeks (LB-6.5) | crown |

**By slot**: head 11 accessories from 8 drawings (cap, beanie, bucket hat,
headphones, headband, bandana, nightcap, crown); face 5 from 4 (glasses,
shades, star shades, heart shades); neck 5 from 3 (towel, medal, chain). Four
drawings carry colour variants: beanie (2), cap (2), headband (2), shades (2),
medal (3). Every drawing is a 32 × 32 overlay at the head anchor.

**Cut order** if drawing time runs short, first cut first. Each step removes
one drawing and every accessory on it; the variants cost almost nothing once
their drawing exists, so they are never cut on their own. The long-haul four
are never cut (D1).

1. Headphones (starter): the hardest head drawing, since it sits at the sides
   of the head over every hair style.
2. Bandana (quick).
3. Bucket hat (starter).
4. Star shades (quick).
5. Towel (starter): a neck item, the least readable at 1×.
6. Heart shades (quick).
7. Beanie and Pink beanie (starters).

After all seven cuts, 11 accessories from 8 drawings remain: Cap, Squad cap,
Glasses, Sweatband, Hype band, Shades, Mirror shades, Bronze medal, Nightcap,
the long-haul four (Silver and Gold medal, Gold chain, Crown). That is still
two starters, six quick unlocks and the four long-haul ones.

Why this shape, in short (the full case is D1):

- **Every quick unlock comes from a thing the app is about**: logging, a PB,
  finishing, resting on time (and, for the joke, not), trying the gym's
  machines, cheering, hyping, high-fiving, training with someone. A person
  alone with Dony reaches nine of the ten in about fifteen minutes; the
  Squad cap needs a second person, which two browsers give a marker.
- **Long-haul ones count calendar days and weeks, never taps**, so no amount
  of tapping in one afternoon fakes them. Two are for consistency (the crown
  is a Drifter's month of one session a week; the medals count days, not
  workouts), one is for training together (the chain, the product's point),
  and none is for strength.
- **Nothing rewards a Slap, a Poke or a nudge preset**, so unlocks never push
  anyone to slap or nag more. Nothing measures weight, reps or distance, so
  nothing ranks ability (banter, not shame).
- **The Nightcap and the Mirror shades are a pair**: one teases the long
  rest, the other rewards getting back under the bar on time. Neither is
  about the person.
- **Glasses are a starter, never locked**: people who wear glasses should be
  able to look like themselves on day one. They are drawn unlike Dony's, so
  his look stays his (BOT-2).
- **Starters are plain, everyday kit** in quiet colours (the gym-bag basics a
  Gen Z squad already wears: a cap, beanies, a bucket hat, headphones);
  earned ones look like trophies (metal, bright colours, stars, a shape you'd
  notice across the room). That, and the fact that only earned ones are ever
  told, is what keeps earned ones feeling like something (AV-4.12).

**Farming.** Quick unlocks are loose on purpose and can be "farmed" in
minutes (log one set and finish; cheer Dony five times; skip three rests).
That doesn't matter here: rooms are friends-only, nothing is ranked or
compared, and an accessory gives no advantage, it only decorates. Long-haul
unlocks can't be farmed, because they need days to pass on the server's
clock.

## Scope

**In**

- AV-4: the three slots; seven starters; a new Accessories section in the
  avatar editor, with earned ones choosable and locked ones shown as grey
  silhouettes with their condition; what the server accepts and refuses.
- AV-5: the fourteen conditions, exactly what counts for each, when they are
  checked, and that an unlock is kept for good.
- AV-6: how the earner is told (a banner with Wear it in the room, the
  summary's "New:" list, the editor); how the room is told of long-haul
  unlocks; how this fits with PB banners, the room log and sound.
- AV-7: accessories wherever the avatar is drawn, in every pose; a change
  showing on every screen in the room within a second.
- Refusals, server log lines and accessibility for all of the above.

**Out, with the reason**

- **Wristbands and bracelets.** Settled by the art research: almost invisible
  at 1×, and the hands move in every frame, so each would need placing by
  hand in about 37 drawings.
- **Uploaded or user-coloured accessories.** Accessories have fixed colours;
  a colour is a separate accessory (a variant), as the medals are.
- **Accessories on Dony.** BOT-5: he earns nothing, and BOT-2 makes his head
  his identity.
- **Points, XP, levels, a currency, a shop, an achievements page, a list of
  other people's unlocks, or any ranking.** system.md section 14 rules out
  leaderboards and feeds; an unlock is something you wear, not a score.
- **Unlocks for Slaps, Pokes or nudge presets.** It would reward slapping
  (spec Risks: "Slapping reads as mean") and turn nudges, which are banter
  one at a time, into spam aimed at the Drifter.
- **Unlocks for emoji.** Emoji are never stored (INT-8), so nothing could be
  worked out from them after a restart.
- **Unlocks for strength** (a weight, a rep count, a distance). It would rank
  ability; the app is for the lazy friend.
- **"You're close!" prompts, reminders, or any nudge to come back for an
  unlock.** system.md section 14 (no nagging, no countdown pressure). The
  editor shows the goals; nothing chases anyone with them.
- **Taking accessories off, or swapping them, from the room page.** The room
  offers only Wear it on a fresh unlock; everything else is the editor's, so
  nothing new sits near the dock.
- **Animated accessories** (a sparkling crown). Each is a still drawing that
  moves with the body; less to draw, nothing new to freeze under reduced
  motion.
- **Head coverings that replace the hair** (a hijab, a turban, a durag). They
  are hair styles, not accessories, because they replace the hair overlay
  rather than sitting on it. Worth adding to AV-1's hair styles later; nothing
  here blocks it.
- **A way for markers to see a long-haul unlock in a short session** (a
  seeded account or a test hook). That is the contract's business (CLAUDE.md
  step 3), not behaviour; the editor shows every long-haul condition, and
  a test hook would need to say what else it changes.

**What this makes harder later** (the vision: strangers who train together)

- **Worn trophies are status signals.** Between friends a crown is a flex;
  for the Shy Regular, "the person in the crown who's always on the squat
  rack" is a natural hello, but from a stranger it can also read as "they
  train more than me". Because no condition measures strength, it never
  ranks ability; but a public room would want the PB setting `room-feel.md`
  owes ("share my PBs") to cover long-haul unlock banners too.
- **"Days trained together" counts anyone in the room.** Among friends that
  is a friend. In a public room it would be anyone, so the Squad cap would
  come from the first stranger who logs a set, and the chain from minutes'
  worth of overlap over five days. A friends list (MVP spec) would have to
  redefine both.
- **Rewarding hype presets** is fine between friends. With strangers, three
  "Let's gooo" to someone you've never met to win star shades is noise; a
  public room might count only presets to people you've trained with.
- **Cosmetics for sale (MVP spec, "designed so they could be sold later").**
  If accessories are ever sold, earned ones must stay unbuyable, or they stop
  meaning anything. Slots and ids make adding sold ones easy; that rule has
  to be kept on purpose.
- **The editor grows with every accessory.** The head slot already holds
  eleven; past about a dozen per slot it needs paging or categories.
- **Long-haul room-log lines** share INT-5's newest 50 with everything else.
  They are rare, so the cost is small.

**Existing behaviour this changes or exposes**

- **The look is four choices.** `asLook`, `lookKey` and `lookFromKey`
  (`src/sprites/avatar.ts`) describe a look as skin, hair, hair colour and
  shirt, and the room's script uses the look key to tell whether a drawn
  avatar is still right. What someone wears has to be part of whatever tells
  drawings apart, or a change won't show (AV-7.7).
- **The face is off limits to overlays today** ("no overlay or prop covers
  it", columns 11 to 20, rows 8 to 12, in `avatar.ts` and the avatar spec).
  Face accessories are the one exception: they may cover the brow line, the
  eyes and the row under them, never the mouth (AV-7.3, D17; avatar spec
  A.6).
- **GYM-15.2** says a squad row shows "the same head of the standing figure".
  It now shows head and face accessories on that head; the words are
  unchanged (AV-7.4).
- **LB-7.5** draws the logbook's art in "her skin, hair style, hair colour and
  shirt"; it now draws what she wears too (AV-7.5). **GYM-17.13** (the flex
  shows the look as chosen) likewise.
- **INT-5** room log gains one line kind, long-haul unlocks (AV-6.9).
- **system.md section 12** makes a PB's room banner the one exception to
  "other people's changes are quiet". A long-haul unlock's room banner joins
  it (AV-6.7).
- **AV-3** rolls a random look for a new account; it rolls no accessories
  (AV-4.6). **Randomise** in the editor rolls the four look choices only.
- **ADR 0006** says a person's look is seen by everyone in a room with them
  and changed only by them. What they wear joins the look; what they have
  unlocked, and their progress, are theirs alone (AV-4.13).
- **The editor's hair tiles** show your head in each style. They stay
  without accessories, or a cap would hide the very thing the tile shows.
- **The earner's own banner slot gets busier.** Ten quick unlocks in a first
  session are up to ten banners on the earner's own screen, each replacing
  whatever banner was there (`int.md` D9), a reply's or a High-five's button
  included. The menu keeps every reply and offer reachable, and the summary
  and editor keep every unlock, so nothing is lost; the designer should
  watch it at the rehearsal.

**Pages this touches** (CLAUDE.md, "Designing pages"; designer first for
each): the avatar editor (Lobby group: a new Accessories section, locked
silhouettes); the room (Gym group: the earner's banner with Wear it, the
long-haul room banner, the room-log line); the workout summary (Logbook
group: the "New:" list with Wear it). Home and history only draw the avatar,
so they change by AV-7 without a redesign.

**Spec and design-system changes this needs** (not made here; the main agent
proposes them to the user):

In `docs/product/spec-4-weeks.md`:

1. **AV-4 reworded, AV-5 to AV-7 added**, all P1, with the proposed wording
   under each heading below, and the build order in the header.
2. **Data model**: `users` gains what the person wears (accessory ids, one
   per slot, with the look); unlocks are stored per person with the time each
   was earned, so one is never lost (AV-5.16). Implementation is the main
   agent's.
3. **Screens**: the avatar editor gains Accessories; the workout summary
   gains what the workout unlocked.
4. **INT-5**: the room log also keeps long-haul unlocks.
5. **Art direction, "What has to be drawn"**: accessories, fifteen drawings
   over the head anchor (eight head, four face, three neck), with colour
   variants for 21 accessories; cut from the end of the cut order above.

In `docs/design/system.md`:

6. **Section 3, copy bank**: every line marked *(new)* below.
7. **Section 10, the gym art**: accessories carry their own fixed colours,
   like props, outlined in ink; no accessory's main colour is a state colour
   (AV-7.10). Section 14 rules out colours outside the tokens, so the
   accessory colours need adding as tokens or as a sprite palette, as the
   look's are; that is the designer's call.
8. **Section 12**: a long-haul unlock's room banner is announced once, like
   a PB's.

## Criteria

Each criterion says how it can be checked: **HTTP** (a request against the
running app), **browser** (needs the page's script, Playwright) or
**judged** (a person has to look). Names follow system.md section 13. Unless
stated, Mia is signed in, a member of an open room with Ji-woo and Tom, each
in their own browser with the room open, and sound is on. Copy marked *(new)*
goes into the copy bank; the designer may tune its wording.

### AV-4 (reworded): accessories, and the starters

> *Proposed wording:* Accessories in three slots, head, face and neck, at
> most one in each and all three worn together. Drawn in code at the head
> anchor so one drawing follows every pose, in their own fixed colours, and
> stored as ids on the user with the look. Seven plain ones (cap, beanie,
> pink beanie, bucket hat, headphones, glasses, towel) can be chosen from the
> first visit; the rest are earned (AV-5). Dony wears none.

**AV-4.1** Given Mia opens the avatar editor, then it has an Accessories
section after her four look choices, with one group per slot, **Head**,
**Face** and **Neck**, each offering **None** and that slot's accessories.
She can choose at most one per slot and any combination across the three,
all three included. *HTTP* (the page holds three groups, each with None)

**AV-4.2** Given a brand-new account (the editor at `?new=1`, straight after
sign up), then the seven starters (Cap, Beanie, Pink beanie, Bucket hat,
Headphones, Glasses, Towel) can be chosen at once, with nothing earned first
(D1). Any starter cut by the cut order is simply absent. *HTTP*

**AV-4.3** Given an accessory Mia hasn't earned, then the editor shows it in
its slot's group as a grey silhouette, with the word **Locked** and its goal
in a mate's words ("Hit your first PB", "Send 3 hype messages", "Train on 10
different days"); it can't be chosen. Each goal is its condition in Terms
reworded to fit a tile (the full list is avatar spec A.4), and means exactly
that condition: Terms decide what counts, never the goal's wording. On screen
a preset is a "hype message", never a "preset" (D16). For a condition that
counts up (Cheers, hype messages, rests on time, machines tried, Slacking
time, days trained, days trained together), the goal also says how far she
is ("7 of 10", "2 of 3", "40 of 60 s"); for the crown it says only "Train 4
weeks in a row", never "2 of 4 weeks", since a streak can fall back (D8).
*HTTP*

**AV-4.4** Given an accessory Mia has earned, then the editor offers it like
a starter, and says when and what earned it, as "Earned {day}: {reason}"
("Earned 8 Nov: first PB", "Earned 3 Nov: 3 machines"; the year only when
it isn't this one; avatar spec A.4). There is no "New" marker on a fresh
unlock (D15). *HTTP*

**AV-4.5** Given Mia picks accessories and taps **Save**, then they are
stored on her account with her look, and the editor's success state shows
as today ("Saved. That's you in the gym now 💪"). Pending and error states are
the editor's existing ones; a failed save keeps everything she picked
checked. *HTTP*

**AV-4.6** Given Mia taps **Randomise**, then it rolls her four look choices
only; what she wears is untouched. Given a new account, then it starts
wearing nothing; AV-3's random roll includes no accessory (D11). *HTTP* (a
randomise post returns the same accessories as before; a new account wears
none)

**AV-4.7** Given Mia changes accessories in the editor, then the live
preview shows them at once, before Save, with or without the page's script,
as her colour choices do today. *browser* (with script) and *HTTP* (the
no-script preview rules are in the page)

**AV-4.8** Given a save that names a locked accessory, an id that doesn't
exist, an accessory in the wrong slot, or two in one slot (a hand-made
request), then the server refuses the whole save with the editor's error
("Couldn't save your avatar. Check your connection and try again."), stores
nothing, and logs the refusal with its reason. Hiding the silhouette's
control is never the protection (ADR 0006). *HTTP*

**AV-4.9** Given an account from before accessories, then its saved look
loads and saves exactly as before, wearing nothing, and every page draws it
as before until the person chooses something. *HTTP*

**AV-4.10** Given a keyboard or screen-reader user, then each slot is a group
with a name ("Head"), each accessory a choice named in words ("Cap",
"Mirror shades"), reachable by Tab between groups and arrow keys within one,
with a visible focus ring, as the look's choices are. A locked one is read as
text with its goal and any progress, "Silver medal, locked: train on 10
different days. 7 of 10" or "Crown, locked: train 4 weeks in a row" (avatar
spec A.4, D16), and isn't a choice the
keyboard stops on. Locked is never shown by grey alone: the word is always
there. *browser*

**AV-4.11** Given Dony, then he can't be picked in the editor (BOT-2) and
never wears an accessory, anywhere. *HTTP*

**AV-4.12** Given the editor at a glance, then the starters read as plain
everyday kit and the earned ones as trophies you'd want, so a locked
silhouette reads as a goal, not a chore. *judged*

**AV-4.13** Given Tom, then he sees what Mia wears wherever her avatar is
drawn, and nothing else about it: not which accessories she has unlocked,
not her locked ones, not her progress. Only her long-haul unlocks are ever
told to a room (AV-6.7). *HTTP* (no page or stream of Tom's carries Mia's
unlocks or progress) — With strangers: the same split works, and is the
right one; wearing is choosing to be seen.

### AV-5 (proposed for the spec): earning accessories

> *Proposed wording:* Fourteen accessories are earned, worked out on the
> server from what is stored. Ten in a first session: first working set,
> first finished workout, first PB, five Cheers sent, three hype presets
> sent, first High-five, three rests ended on time, three machines tried,
> first day training alongside someone in the same room, and (the joke) a
> minute spent Slacking. Four over weeks: 10 and 30 days trained, 5 days
> training alongside someone, a 4-week streak. Warm-ups never count. Once
> earned, an accessory is never lost. Cheers, presets and High-fives with
> Dony count; Dony himself earns nothing.

#### What counts

**AV-5.1** Given Mia logs her first working set (Normal or Failure, any kind
of exercise), then the Sweatband unlocks with that Done. Given her first set
is a Warm-up, then nothing unlocks; her next working set does it. Sets from
before set types (no stored type) count as working sets (LB-4.8). *HTTP*

**AV-5.2** Given Mia finishes a workout holding at least one working set,
then the Bronze medal unlocks. A workout finished with no sets, or with only
warm-ups, unlocks nothing. A workout finished by its room closing (ROOM-6)
counts like one she finished herself. *HTTP*

**AV-5.3** Given Mia's Done stores a set that is a record (LB-4.1, so a PB),
then Shades unlocks with that Done. Her first working set of an exercise is
never a record (LB-4.3), so she needs a second working set that beats it;
an equal set isn't one. *HTTP*

**AV-5.4** Given Mia's fifth Cheer sent is accepted, then the Hype band
unlocks. Refused Cheers (the 10 s limit) don't count; Thanks don't count; a
Cheer from a room banner counts; Cheers to Dony count (D5). *HTTP*

**AV-5.5** Given Mia's first High-five lands, whether she offered or
accepted it, then Heart shades unlocks for her, and, if it's their first too,
for the other person. A High-five Dony accepts counts for the offerer, as
every screen agrees it happened (BOT-7.3) (D5). A lapsed offer counts for
nobody. *HTTP*

**AV-5.6** Given Mia's Slacking time reaches 60 s in total, then the Nightcap
unlocks the next time it is checked. 59 s doesn't; 60 s does. It counts the
time the summary counts, so it unlocks once that time is stored (at her
next Start set or when the workout ends), never during the rest itself
(D4). *HTTP*

**AV-5.7** Given Mia's third hype preset sent is accepted, then Star shades
unlocks. Nudge presets ("Put the phone down", "Bro is scrolling") never
count; refused presets (the 2 s limit) don't count; hype presets to Dony
count (INT-5.15, D5). *HTTP*

**AV-5.8** Given Mia's third on-time rest ends (her Start set, or a skipped
rest, comes less than 30 s past the rest's target), then Mirror shades
unlocks with that Start set or skip. 29.9 s past the target is on time;
30.0 s past is Slacking (GYM-11) and doesn't count. Rests after warm-ups
don't count; a cardio set has no rest and doesn't count. The rests can be in
any workouts, with any rest length she chose. *HTTP*

**AV-5.9** Given Mia completes a working set on her third different machine
tried, then the Bandana unlocks with that Done. Bench press and Incline bench
press are one machine (the flat bench); a set in any workout, in any room,
counts. A delivery her choice causes (GYM-6) is incidental; only the working
set counts. *HTTP*

**AV-5.10** Given Mia and Ji-woo each complete a working set in the same room
on the same day for the first time, then the Squad cap unlocks for each of
them who hasn't got it, with the Done that completes the pair, whoever logged
second (AV-5.13). Dony never counts (D5). This is the one quick unlock that
needs a second person. *HTTP*

**AV-5.11** Given Mia completes a working set on her tenth different day
trained, then the Silver medal unlocks with that Done; on her thirtieth, the
Gold medal. Days are Australia/Sydney calendar days by the server's clock,
never the phone's; a session past midnight puts any working set after
midnight on the new day. Nine days, however many workouts, isn't ten.
*HTTP*

**AV-5.12** Given Mia and Ji-woo each complete a working set in the same room
on the same day, then that is one day trained together for each of them;
on the fifth such day the Gold chain unlocks. It can be five days with the
same person or with different people. Sets in different rooms, or a day
when only one of them logged a working set, don't count. Dony never makes a
day trained together. *HTTP*

**AV-5.13** Given the Done that makes Mia's day trained together, then it is
the one that completes the pair (whoever logged second), so it can unlock
the Squad cap or the Gold chain for both people at once, including the one
who didn't just act. *HTTP*

**AV-5.14** Given Mia's streak, as history shows it (LB-6.5), reaches 4 at
any time, then the Crown unlocks. A past run of four consecutive weeks counts
as much as the current one. The streak counts a week with any workout that
has a set, warm-ups included (LB-6.3), and the crown follows it exactly, so
history's number and the crown never disagree: this is the one condition
where a warm-up counts (D1). *HTTP*

#### When it's worked out, and for good

**AV-5.15** Given any of these, then the server works out Mia's unlocks from
what is stored whenever she logs a set, starts one, skips a rest, finishes a
workout, sends a Cheer or a preset, takes part in a High-five, opens the
editor or opens a summary. Anything newly true is recorded as unlocked at
that moment. No timer is involved, so it is the same after a restart
(GYM-12). *HTTP* (with a restart between the action and the check)

**AV-5.16** Given an accessory Mia has unlocked, then she keeps it for good:
deleting or editing the set that earned it (LOG-8), a record mark moving
(LB-4.9) or a streak breaking never locks it again, and never takes it off
her (D6). *HTTP*

**AV-5.17** Given an account that already met conditions before this
feature shipped, then the first time its unlocks are worked out, everything
already earned is recorded at once, with nothing told to anyone (no banner,
no room log, no summary line, AV-6.14). *HTTP*

**AV-5.18** Given a Done, a Start set, a skip, a Cheer, a preset or a
High-five that unlocks something, then the unlock is decided in the same
step that stores it, so the action is no slower than one that unlocks
nothing, and Done reaches the Resting sheet, and Start set the Lifting
sheet, as fast as ever. *judged* (on a mid-range phone) and *HTTP* (the
unlock comes in the same response; no second request)

**AV-5.19** Given a double tap, two tabs or two devices doing the same thing
at the same moment, then each accessory is unlocked once, with one unlock
time, and the earner is told once per open screen. *HTTP*

**AV-5.20** Given an unlock, then it changes nothing about anyone's state,
rest, slacking time, station, sets or workout. *HTTP*

**AV-5.21** Given Dony, then nothing he does earns anything for him: his
PBs, emoji, acceptances and lifts are not stored in any logbook (BOT-5) and
count toward no one's conditions, except that a High-five he accepts counts
for the person who offered it (AV-5.5), and Cheers and hype presets to him
count for the sender (AV-5.4, AV-5.7). *HTTP*

**AV-5.22** Given a fresh account alone in a room with Dony, then nine of the
ten quick unlocks (all but the Squad cap) can be reached in about fifteen
minutes by doing what the app is for: four sets on three machines with the
second heavier, three rests ended on time and one long one, five Cheers,
three hype presets, a High-five, Finish. Given a second browser in the room,
the Squad cap comes with both people's first working sets. *judged* (at the
rehearsal, timed)

### AV-6 (proposed for the spec): being told, and Wear it

> *Proposed wording:* An unlock is never put on for you. The earner gets a
> banner in the room with Wear it, and the summary lists what a workout
> unlocked, each with Wear it; the editor shows locked accessories as grey
> silhouettes with what earns them. Only the four long-haul unlocks are told
> to the room: a banner with Cheer, a room-log line and the fanfare. The
> Nightcap is told to nobody else, ever.

**AV-6.1** Given Mia's Done unlocks Shades and her room page is open, then
within a second her screens get the banner "New: shades 😎" *(new)* with one
button, **Wear it** (D3). Like every banner with a button, it stays 6 s,
ignores taps in its first half second, never covers or moves the dock,
never takes focus, and its line is announced once (INT-9.11, INT-9.12).
Her logged stamp is unchanged: it still carries the record mark (GYM-17.9).
*browser*

**AV-6.2** Given Mia taps **Wear it**, then Shades goes into her face slot,
replacing whatever was there, and within a second every open screen in the
room, hers included, draws her wearing them (AV-7.7); the banner goes, and
her screen reader hears "Wearing the shades" once. Nothing else about her
changes. Given she's offline, then she sees "That didn't save. Try again."
and nothing changes. *HTTP* and *browser*

**AV-6.3** Given an unlock, then nothing is ever put on for Mia by itself:
she wears it only after Wear it or a Save in the editor (D3). *HTTP*

**AV-6.4** Given one action unlocks two or more at once (a Done that is a
PB on her tenth day trained), then Mia gets one banner naming them all
("New: silver medal and shades 🎉" *(new)*), and Wear it puts on the first
named: long-haul ones first, then in the order of the table in Terms. The
rest can be worn from the summary or the editor. *browser*

**AV-6.5** Given an unlock banner arrives while another banner shows on
Mia's screen, or another arrives after it, then the newest replaces the
current one (`int.md` D9); nothing queues. Given the unlock comes from a
High-five, then the unlock's banner replaces the High-five's; the High-five
still plays on both avatars and stays in the room log. An unlock whose
banner was replaced is still offered on the summary and in the editor.
*browser*

**AV-6.6** Given Mia finishes a workout in which she unlocked anything, then
its summary lists each, in the order earned: "New: bronze medal" *(new)*, each
with **Wear it** (except the Nightcap, AV-6.15), or "Wearing it" if she
already is. It works with no script. Coming back to that summary later shows
the same list, as a record of the workout. Accessories recorded by AV-5.17
(already earned before this shipped) are never listed on a summary. *HTTP*

**AV-6.7** Given Mia unlocks a long-haul accessory (Silver medal, Gold
medal, Gold chain, Crown), then within a second every other open screen in
the room shows the room banner "Mia unlocked the crown 👑" *(new)*, with one
button, **Cheer**, which is exactly a Cheer to Mia (GYM-18.2), and every
screen reader in the room hears it once, as a PB's (GYM-18.7). Mia gets her
own banner (AV-6.1), not the room's. Quick unlocks, all ten, make no room
banner and send nothing to anyone else (D2). *browser* and *HTTP* (the event
reaches Tom's stream for a long-haul unlock, and no event for a quick one) —
With strangers: telling a room "Mia trained 30 days" says something about her
habits; a public room would want a setting to keep it to herself.

**AV-6.8** Given the Done that unlocks a long-haul accessory is also a PB,
then everyone else gets one room banner, not two: "Mia hit a PB on back
squat and unlocked the crown 👑" *(new)*, with one Cheer, and one fanfare
(D9). *browser*

**AV-6.9** Given a long-haul unlock, then the room log gets "Mia unlocked
the crown" for everyone else and "You unlocked the crown" on Mia's screen
*(new)*, kept after a reload and a restart, with no numbers. Quick unlocks,
the Nightcap and AV-5.17's quiet ones never go in the room log (D2). *HTTP*

**AV-6.10** Given sound is on (INT-12), then an unlock plays the earner's
short "about you" sound on the earner's screens, and a long-haul unlock
plays the PB fanfare on every screen in the room, once, even when it comes
with a PB. INT-12.9's limits hold; with the setting at Rest timer only or
Off, nothing plays. *browser*

**AV-6.11** Given Mia's Squad cap or Gold chain was unlocked by Ji-woo's Done
while Mia was Away or had the room closed (AV-5.13), then Mia never gets its
banner later; she finds it in the editor, and a Gold chain in the room log.
*browser*

**AV-6.12** Given Mia reloads, reopens or reconnects the room, or the server
restarts, then no unlock banner is shown again, and no fanfare replays.
*browser*

**AV-6.13** Given Mia unlocks something while she isn't on the room page
(on the editor, or an action from another tab), then her open room screens
get the banner as AV-6.1; if none is open, the next summary lists it
(AV-6.6), and the editor offers it as choosable with when it was earned
(AV-4.4). "The editor tells her" means only that: the editor has no "New"
marker, and an editor already open doesn't change while it is open; the
unlock shows as choosable the next time the editor is opened or reloaded
(D15). *browser* (an open editor is unchanged; after a reload the tile is
choosable with its "Earned" line)

**AV-6.14** Given the accessories recorded at once for an account that had
already earned them (AV-5.17), then nobody is told: no banner, no room log,
no sound, no summary line. They are simply choosable in the editor. *HTTP*

**AV-6.15** Given the Nightcap unlocks, then nobody but Mia is ever told,
and Mia only on that workout's summary and in the editor: no banner on any
screen, hers included, no room log line, no sound. It is never worn unless
she chooses it in the editor; it has no Wear it on the summary (D4). *HTTP*

**AV-6.16** Given any unlock, Wear it, accessory save or refusal, then the
server log has one line with the person's id and display name, the
accessory, and for an unlock its condition and whether it was told or quiet
(AV-5.17). No line holds a password, token, passcode or full email (OPS-1,
OPS-2). *judged* (read the log by hand)

**AV-6.17** Given a Drifter's first session, then the unlocks read as a mate
saying "nice one", not as a game nagging; no unlock line, condition or
summary entry ever tells someone off for what they haven't done; and the
Nightcap's condition and name tease the rest, never the person ("Slack for a
full minute", not "Lazy"). *judged*

### AV-7 (proposed for the spec): where accessories show

> *Proposed wording:* Accessories are worn wherever the avatar is drawn: the
> map in every pose, the squad list, home, the logbook's art and the editor.
> Putting one on or taking it off shows on every open screen in the room
> within about a second.

**AV-7.1** Given Mia wears a head, a face and a neck accessory, then the map
draws them on her in every pose: standing, walking, resting at the cooler,
Slacking on the seat, on each of the eight machines (lying on the bench and
down in the squat included), the flex, every acted move and reaction, and
Away (faded with her). They move with her head, frame by frame. *browser*
and *judged* (the art sheet)

**AV-7.2** Given Mia wears a neck accessory, then it is drawn only on her
tee (Terms): never on her cargos, though they share the shirt's shade, nor
under a prop or a machine's front, so in some poses part of it is hidden
(lying on the bench, at the cable machine), and in a pose with no tee (the
squat's low frame, the exercise mat) all of it is. It is never drawn over
her legs, a machine, her face or anyone else (D13; avatar spec A.8).
*judged* (the art sheet: no neck pixel lands below the belt line in any
drawing)

**AV-7.3** Given a face accessory, then it covers at most the brow line, the
eyes and the row under them (where the blush is), out to the head's
outline, and never the mouth or anything below it, so the person still
reads as a face at 1× over every skin tone (D17; avatar spec A.6). *judged*

**AV-7.4** Given the squad list and home's lists of people, which show a
head and shoulders, then head and face accessories show on that head; a neck
accessory is mostly cropped there, and that's accepted. The rows' words are
unchanged. *HTTP*

**AV-7.5** Given Mia's history, a summary or an exercise page (LB-7's art),
then she is drawn wearing what she wears now, as her look is (D39). *HTTP*

**AV-7.6** Given the editor's preview and home's tile, then they show what
Mia wears. The editor's hair-style tiles show her head without accessories,
so the styles can still be told apart. *HTTP*

**AV-7.7** Given Mia changes what she wears (Wear it, or Save in the editor)
while she is a member of an open room, then within a second every open
screen in that room draws her new accessories, with no reload; someone who
joins, reloads or reconnects later, or opens after a restart, sees them as
stored (D7). *HTTP* (the change reaches Tom's stream) and *browser*

**AV-7.8** Given Mia wears anything, then her avatar's accessible name, her
tag, her squad row's text and her hit area are exactly as without it
("Mia, resting, flat bench 2"); accessories are named in the editor, the
banners and the summary, and nowhere else (D10). *HTTP*

**AV-7.9** Given an accessory, then it has no animation of its own: it moves
only with the body, and under reduced motion it is as still as the body.
Nothing about it flashes. *browser*

**AV-7.10** Given an accessory's colours, then no accessory's main colour can
be mistaken for a state colour (Lifting, Resting, Slacking, Finished), it is
outlined in ink like every sprite, and it is drawn at the same whole-number
scale as the avatar. State is still told by the tag's colour, icon and word.
*judged*

**AV-7.11** Given every head accessory with every hair style (the ponytail's
tail and the curls' width included) and every skin tone, then it looks worn,
not pasted on, and the hair style can still be told. *judged* (the art sheet)

**AV-7.12** Given a phone at 1×, then at arm's length someone can tell each
drawing from the others in its slot: a cap from a beanie and a bucket hat;
the sweatband and the bandana from each other and from headphones; a crown
from all of them; the four face drawings apart. Colour variants of one
drawing (the two caps, the two beanies, the two headbands, shades and
mirror shades, the three medals) differ by colour on the map and by name in
the editor. *judged*

**AV-7.13** Given Dony, then he is drawn with no accessory in every pose, on
every screen. *HTTP*

**AV-7.14** Given a room of twelve plus Dony, everyone wearing three
accessories, then the map at 1× on a mid-range phone stays as smooth, and
Start set and Done respond as quickly, as with none. *judged* and *browser*

**AV-7.15** Given the showcase, then a classmate who sees a friend in star
shades and a bandana wants to know how to get them, and the earned ones look
like something to show off in a screenshot. *judged*

## Open questions

None. All twelve were settled on 8 Nov 2026; see Decisions.

## Decisions

All dated **8 Nov 2026**, from the user, relayed by the main agent. Q2, Q4
and Q12 the user answered directly; Q1 the user answered by asking for a
bigger list, which pm designed (D1); Q3, Q5 to Q11 take the recommendation,
which the user was told would stand unless they objected, and they didn't.
D numbers here are this file's own (D1 is Q1, and so on); D39 cited in
AV-7.5 is `logbook.md`'s, and D9 is `int.md`'s, as marked where used. The
criteria above are written to match; nothing in them rests on an open
question.

| # | Question | Decision | Why | Criteria |
| --- | --- | --- | --- | --- |
| D1 (Q1) | The list: which accessories, which are starters, what earns each? | **A bigger list than the draft's (a), designed by pm at the user's request**: 21 accessories from 15 drawings. Seven starters (the draft's cap, beanie, glasses, towel, **plus pink beanie, bucket hat, headphones**). Ten quick unlocks (the draft's sweatband, shades, bronze medal, hype band, heart shades, nightcap, **plus star shades: 3 hype presets; mirror shades: 3 on-time rests; bandana: 3 machines tried; squad cap: first day trained together**). The four long-haul ones unchanged (silver and gold medal at 10 and 30 days trained, gold chain at 5 days trained together, crown at a 4-week streak). Cut order from the end as listed under "The accessories"; the long-haul four are never cut. | The user wants more to play with at the showcase. The additions are cheap (three of the seven are colour variants; the four new drawings are all head or face items, which read at 1×) and each comes from a thing the app is about: hyping a mate, getting back under the bar on time, trying the gym's machines (which brings the delivery worker out), training with someone. None rewards a Slap, a Poke or a nudge, and none measures weight. Nine of the ten quick unlocks are reachable alone with Dony in about fifteen minutes; the squad cap shows a marker's two browsers the point of the app. | Terms, AV-4.2, AV-4.3, AV-5.1 to AV-5.14, AV-5.22, AV-7.12 |
| D2 (Q2) | Which unlocks does the room hear about? | **(b)**: only the four long-haul ones get a room banner (with Cheer), a room-log line and the fanfare. Quick unlocks are told to the earner only; the room sees them when worn. | Ten quick unlocks each for twelve people would be a room banner every few seconds, replacing everyone's reply and High-five buttons, and would push everything else out of the room log's 50. Rare is what makes it a moment. | AV-6.7, AV-6.9, AV-6.10 |
| D3 (Q3) | Put on automatically, or offered? | **Offered**: one-tap Wear it on the earner's banner and the summary, and the editor; never put on by itself. | What you look like is yours; automatic would knock off a crown for a sweatband, and can't tell "never chose" from "chose None". The tap is the moment of showing off. | AV-6.1 to AV-6.4, AV-6.6 |
| D4 (Q4) | The "shame" accessory? | **(a), the Nightcap**: unlocked by 60 s of Slacking time in total; never put on for anyone, never rolled by Randomise, told only on the summary (with no Wear it) and in the editor, never to the room. | Owning the joke is banter; every way it could become shame (announced, worn for you, rolled onto you) is removed. It teases the rest, not the person. Mirror shades (D1) are its on-time twin. | AV-5.6, AV-6.15, AV-6.17, AV-4.6 |
| D5 (Q5) | Do interactions with Dony count? | **Yes** for Cheers, hype presets and High-fives (the hype band, star shades, heart shades); **never** for days trained together (the squad cap and the chain). Dony earns nothing himself. | Rooms are usually one person, markers often test alone, and Dony accepting High-fives already exists so the room works alone (`room-feel.md` F8). Training together means a person. | AV-5.4, AV-5.5, AV-5.7, AV-5.10, AV-5.12, AV-5.21 |
| D6 (Q6) | Can an earned accessory be lost? | **Never**: recorded when earned, kept through edits, deletions and broken streaks. | Losing a crown when a streak breaks is streak-loss shaming (system.md section 14); losing shades for fixing a typo punishes honesty. Matches `room-feel.md` R4 (a PB once announced is never taken back). | AV-5.16 |
| D7 (Q7) | Does a change of accessories show live? | **Yes**, within a second on every open screen in the room (GYM-13), from Wear it and from an editor Save. | Wear it exists so the room sees it now. | AV-7.7, AV-6.2 |
| D8 (Q8) | Does a locked accessory show progress? | **For counts that only go up** ("4 of 10 days", "2 of 3 machines"); the crown shows only its condition. | "Next goal" is why locked ones show as silhouettes, and a rising count is a pat on the back; a streak count can fall to 0, which is the feeling section 14 rules out. | AV-4.3 |
| D9 (Q9) | A Done that is a PB and a long-haul unlock: one banner or two? | **One combined room banner**, one Cheer, one fanfare. | Both facts reach the room and nothing piles up or wipes the other. | AV-6.8 |
| D10 (Q10) | Is an accessory named for screen readers on the map and in the squad list? | **No**: names and rows stay as they are; accessories are named in the editor, banners and summary. | Hair and shirt aren't in the name either; state is what the list is for, and shorter names are faster to tab between sets. The moments that matter are announced. | AV-7.8 |
| D11 (Q11) | Randomise and new accounts? | **Randomise never touches accessories; new accounts wear nothing.** | Randomise rolling the nightcap onto someone would undo D4; starting plain makes the first earned one show. | AV-4.6 |
| D12 (Q12) | Priority and build order? | **P1, and the build starts now** (the user, 8 Nov), in this order, cut from the end: AV-4, AV-7, AV-5's ten quick unlocks, AV-6, AV-5's four long-haul unlocks. Drawings are cut by the cut order under "The accessories". Designer first for the Lobby group (the editor), the Gym group (the banners, the room log) and the Logbook group (the summary). | Starters plus worn accessories already give the showcase something to play with; quick unlocks add the reason to keep poking; long-haul ones can't be seen in a demo, so they go last. Nothing here may risk a P0 or the research note. | Header, everything |

**Settled 9 Nov 2026 from the Lobby designer's art and editor**
(`docs/design/avatar/spec.md`, "Accessories, Nov 8", A.1 to A.10). The user
was asleep and had said to go with recommendations; the main agent settled
these on that instruction, not the user directly. They can be overruled like
any recommendation. None reopens D1 to D12.

| # | Question | Decision | Why | Criteria |
| --- | --- | --- | --- | --- |
| D13 | A neck item "only over shirt pixels" lands on the knees and shins in some poses, because the cargos use the shirt's shade too. What is the rule? | **Only on the tee**: shirt pixels from the collar down to, not including, the belt line, and not under a prop or a machine's front. A pose with no belt line below the collar (the squat's low frame, the exercise mat) has no tee and hides the neck item (avatar spec A.8). | The art research's words weren't enough once drawn; a medal on someone's shins reads as a mistake. Hiding it in two poses was already accepted. | Terms (Accessory, The tee), AV-7.2 |
| D14 | What is the Squad cap's "squad colour"? | **There is none**: the Squad cap is a fixed Spotter green with a cream logo, a colour variant of the cap. | Squads have no colour of their own in the app. Violet, tried first, was too close to the star shades and Dony's top (avatar spec A.7). | The accessories table |
| D15 | What does "the editor tells her" about a fresh unlock mean? | **Only that it is choosable there, with when it was earned** ("Earned 8 Nov: first PB"). The editor has no "New" marker and doesn't update while open; an unlock shows the next time it is opened or reloaded. The room's banner and the summary tell her meanwhile. | Keeps the editor a plain page with no live connection; the moments of telling are the banner and the summary. | AV-4.4, AV-6.13 |
| D16 | Locked tiles need goals short enough for a tile, and users don't say "preset". Do the criteria's words change? | **The editor's goals are the conditions reworded** (avatar spec A.4: "Send 3 hype messages", "End 3 rests on time", "Try 3 machines", "Train with someone in the room"). On screen a preset is a "hype message". Terms still decide what counts; AV-4.3's examples match A.4. | A mate's words fit the tile and the voice; one source of truth for what counts stays here. | AV-4.3, AV-4.10 |
| D17 | How much of the face may a face item cover? | **The brow line, the eyes and the row under them** (rows 6 to 11 from the head anchor, out to the head's outline), **never the mouth** or below. | Frames and lower rims need the brow and blush rows; the mouth, chin and outline are what keep it a face over every skin tone (avatar spec A.6). | Terms (Accessory), AV-7.3, "Existing behaviour" (the face exception) |
