# Acceptance criteria: How the gym room feels (answers, room moments, juice)

- **Area**: Interactions and messages, and the gym (`docs/product/spec-4-weeks.md`),
  plus Dony. A second round on the room page, after `int.md` and
  `animations.md` (both agreed, both left as they are; this file adds to them
  and says below exactly where it overrides them).
- **Requirements covered**: **GYM-17** (P1, in the spec: a new personal best
  plays a flex everyone sees), and six rows **proposed for the spec**, none
  in it yet:
  - **INT-9**, answering an interaction (proposed P1);
  - **INT-10**, the High-five (proposed P1);
  - **GYM-18**, the room's moment for a personal best (proposed P1);
  - **INT-11**, reactions that feel good to send and to get (proposed P1);
  - **INT-12**, sound for interactions, and the sound setting (proposed P1);
  - **BOT-7**, Dony and the things above (proposed P1, with the other BOT rows).

  Proposed build order, by how much each serves README's "being seen does
  the work": INT-9, GYM-17, GYM-18, INT-12, INT-11, INT-10, BOT-7.
- **Status**: agreed
- **Date**: 4 Nov 2026 (drafted and agreed the same day: the user accepted
  every recommendation, F1 to F10, and R1 to R11 stand; F11 to F13 added
  5 Nov 2026 from qa's round two, under the user's standing instruction;
  F14 and F15 added 5 Nov 2026 by the user, reconciling GYM-17 with
  `logbook.md`'s records; see Decisions).
  Numbering: **F1 to F10** are this file's decisions, **R1 to R11** the ones
  made by recommendation; a bare **D** number (D9, D14, D24, D27) is always
  a decision in `int.md`.

## The request

The user, 4 Nov 2026 (translated from Chinese): "The interaction part in the
gym is a bit monotonous, I want to improve it." Asked which kind of
monotony, they chose all three of these, and said to ignore the 9 November
deadline (they have an extension):

1. **Interactions are one-way.** After a Cheer, Poke or Slap the target can
   only read the banner. Wanted: a way to answer.
2. **No whole-room moments.** Everyone trains on their own; nothing makes the
   whole room notice at once. Wanted: GYM-17 (a personal best plays a flex
   everyone sees) and a celebration moment for the room.
3. **Not enough feedback.** Pressing things doesn't feel satisfying:
   reactions are short, silent and small. Wanted: polish of the reactions,
   and sound for interactions and emoji, with an on/off control.

## What this file overrides

Read this before the criteria. Everything not listed here in `int.md`,
`animations.md` and `docs/design/system.md` still holds.

| Earlier decision | Where | What this file does | Decided by |
| --- | --- | --- | --- |
| **D27**: no sound for interactions, presets or emoji, and no sound toggle; and **INT-3.16**, which tests that | `int.md` | **Reversed.** Interactions, replies, High-fives, presets to you, your own emoji and personal bests get sound, behind a sound setting on the room page (INT-12). D24's banner blip comes back in a wider form. The rest-over sound is unchanged while the setting allows it. | F6, F7 |
| **"Any sound for interactions or emoji, and a sound toggle"** in Scope, Out | `int.md` | Reversed, as D27. | F6, F7 |
| **"High-five (MVP spec)"** in Scope, Out ("Cheer and the emoji cover praise") | `int.md` | **Reversed.** High-five comes in as a two-person move that only happens when both press (INT-10). The sender's avatar still never walks over. | F1 |
| **"Dony sending interactions or presets"** in Scope, Out | `int.md` | **Narrowed.** Dony still never starts an interaction, preset or High-five, and never replies; but he completes a High-five someone offers him (BOT-7.2). | F8 |
| **INT-1** menu: Cheer, Poke, Slap, Message | `int.md` INT-1.1 | The menu gains **High-five** (INT-10) and, when there's something to answer, **a reply as its first row** (INT-9). | F1 |
| **INT-2.14** which action is highlighted | `int.md` | Extended: an open High-five, then a reply, then a fresh personal best, come before the state rule (INT-9.10). | F1, R5 |
| **INT-3.4 and room spec I.5**: the banner takes no taps (`pointer-events: none`) | `int.md`, `docs/design/room/spec.md` | A banner may now carry **one button** (a reply, a High-five, or Cheer on a personal best). It still never takes focus, never covers the dock, and the rest of it still lets taps through. | F1 |
| **INT-3.5**: a banner goes after 4 s | `int.md`; system.md section 11 | A banner **with a button** stays 6 s; one without stays 4 s. "The newest replaces the current one" (D9) still holds, across every kind of banner. | R1 |
| **INT-5.8**: the room log holds presets and interactions | `int.md` | It also holds **replies, completed High-fives and personal bests** (with no numbers). Still no emoji; High-five offers that lapsed are never in it. | F1, F5, R3 |
| **BOT-6.8**: Dony answers at most once every 10 s | `int.md`, spec BOT-6 | The cap is shared with his High-five acceptances: an emoji answer and an accepted High-five both count as "an answer". | F8 |
| **"Sound. No sound goes with any animation."** in Scope, Out | `animations.md` | Reversed for reactions and the personal-best flex (INT-12). Exercise animations stay silent. | F6 |
| **Section 11**: reactions "last under 1 s"; "the rest-over sound is the only one on by default"; "one sound toggle lives in the gym menu" | `docs/design/system.md` | Reactions may last up to 1.5 s (INT-11.4). All sounds are on by default. There is no gym menu today: the designer places the sound setting on the room page (INT-12.8). | F7, R10 |
| **LOG-5**: when rest ends the page plays a sound and flashes | spec | The sound can now be turned off by the person (setting "Off"); the flash and the words are unchanged and always show. | F7 |
| **"Personal records"** in the spec's Out table, cut from the MVP spec | `spec-4-weeks.md` | GYM-17 (already P1 in the same spec) brings back **a personal-best moment in the room**. Records themselves, on the lifter's own pages, came back with `logbook.md` LB-4; this file only adds the room's moment for them. | F14 |
| **LB-4.13**: "nobody else in the room can tell" a record was set (no animation, banner, room-log line, squad change or stream event); "GYM-17, if built, should be a setting" | `logbook.md` | **Overridden** for the room's moment: a Done that sets a record is a PB, and the room sees the flex, the room banner (no numbers), the room-log line and hears the fanfare (GYM-17.7, GYM-18). No setting in this build. Everything else about records (which ones, the numbers, the marks) stays private to the lifter, as LB-4 says. LB-4.13 is marked superseded in `logbook.md`. | F15 |

**Not overridden** (they shape this file): `int.md` D4 (anyone, any state),
D5 (Slap refused while the target is Lifting or Finished; Slap back follows
it), D7 (emoji not stored), D9 (the newest banner replaces), D11 (Dony as a
target, no banner for him); `animations.md` D7 (reactions are effects drawn
over any pose; the flex is a body pose, which `animations.md` already set
aside for GYM-17: "the flex follows a Done … so it needs only a standing
body frame"); and system.md section 14 (no streaks, no feeds, no
leaderboards).

## Terms

Used with these meanings throughout. Terms already defined in `int.md`
(sender, target, interaction, preset, emoji, menu, reaction, banner, bubble,
room log, panel, dock, state, Away, Dony's visit, within a second) keep
those meanings.

- **Reply**: an answer to an interaction you received: **Thanks** to a
  Cheer, **Poke back** to a Poke, **Slap back** to a Slap (F2). A
  reply is itself an interaction from you to the person who sent the
  original: it plays a reaction on them and gives them a banner.
- **Answerable**: an interaction you can still reply to. It is the newest
  interaction that person sent you, it was accepted less than 30 s ago, it
  is not itself a reply, and you haven't replied to it yet.
- **High-five**: a two-person move. One person **offers** it to another;
  it only **happens** if the other **accepts** within 10 s. Otherwise the
  offer **lapses**.
- **Open offer**: a High-five offer that has neither happened nor lapsed.
- **Record** and **record type**: as `logbook.md` defines them (Terms,
  LB-4): a working set (not a warm-up) whose value for a record type
  (Heaviest, Best e1RM and Most reps for weight lifts; Most reps and
  Heaviest added for bodyweight; Longest hold; Longest distance and Longest
  time for cardio) is strictly greater than every earlier working set's.
  The first set to measure a type sets nothing.
- **PB** (personal best, the Australian word): a Done that stores a set
  which is a record for at least one record type (F14). One Done is at most
  one PB, however many types it breaks.
- **Flex**: the short body pose an avatar plays on a PB, seen by everyone in
  the room.
- **Room banner**: a banner that goes to everyone in the room at once, not
  only to a target. Only a PB makes one (GYM-18).
- **The logged stamp**: the confirmation that appears on the dock's top
  border after Done ("Set 3 logged: 105 kg × 5"), as built today.
- **Sound setting**: the person's choice of which sounds the room page
  plays: **All sounds**, **Rest timer only** or **Off**, kept in that browser
  (F7).
- **Confirmation line**: a short line on the sender's screen saying their
  move went (INT-11.5).

## Scope

**In**

- **Answering (INT-9).** A one-tap reply on the banner, and the same reply
  from the sender's menu, for 30 s after an interaction arrives.
- **High-five (INT-10).** Offered from the menu, accepted from a banner or
  the menu, happening on both avatars on every screen.
- **PBs (GYM-17).** A Done that sets a logbook record (F14), worked out on
  the server when Done stores the set; a flex on every screen; the lifter's
  own confirmation is logbook's record mark on the logged stamp.
- **The room's PB moment (GYM-18).** A room banner on everyone else's screen
  with a one-tap Cheer, a room log line, a short window where the lifter's
  menu suggests Cheer and High-five.
- **Juice (INT-11).** Bigger, clearer reactions within fixed limits, a
  confirmation for the sender when the target is out of view, and the
  constraints the designer works within.
- **Sound (INT-12).** Which events make a sound on which screens, the sound
  setting, how it persists, and how it behaves with many events at once.
- **Dony (BOT-7)** for each new thing: High-fives offered to him, a planned
  PB per visit, his sounds, and what he never does.
- Refusals, server log lines and accessibility for all of the above.

**Out, with the reason**

- **The sender walking over** for a High-five or a reply. As in `int.md`:
  it would take the sender off their station mid-workout. Both avatars stay
  where their state puts them; the High-five plays on both where they are.
- **Replying to a reply**, and chains of replies. One return of serve ends
  the exchange; after that, people use the menu as usual, under the 10 s
  limit. Endless ping-pong between two banners is a feed by another name.
- **Replying to a preset or an emoji**, and replying from the room log.
  Presets and emoji aren't interactions; the log is not a chat (`int.md`).
- **A "decline" button on a High-five.** Saying no out loud is colder than
  letting it lapse.
- **Group High-fives**, and anyone but the addressee completing one.
- **A cheer crowd counter** ("3 people are hyping Mia"), combos, streaks of
  PBs, PB counts, "PB of the week", or any ranking between people.
  system.md section 14 rules out streaks and leaderboards; `int.md` ruled
  out counters and combos for emoji.
- **Other whole-room moments** (someone finishing their workout, everyone
  lifting at once, a room milestone). Announcing "Mia's done" to a Drifter
  who hasn't started is pressure, not banter; the others are counters. PB is
  the one moment that celebrates effort without comparing people. They can
  be asked for later.
- **Anything about records on the lifter's own pages** (the marks on
  history, the summary and the exercise page, the "N new records" count).
  That is `logbook.md` LB-4's, unchanged here. This file adds only the
  room's moment.
- **A PB of its own definition.** A PB is exactly a logbook record (F14),
  so there is one idea of "you beat your best", not two. Volume PBs stay
  out, as they are out of LB-4.
- **Vibration.** iPhone browsers can't vibrate (MVP spec), so half a squad
  would never feel it.
- **Sound for other people's interactions, emoji or presets, or for Dony's
  emoji.** Twelve people's emoji a second would be noise (D24's reason).
- **Sound when the page is closed or the phone is locked.** The page only
  reaches someone who has it open.
- **Anything any of this does to anyone's workout.** No reply, High-five,
  PB, flex, banner or sound ends a rest, changes a state, moves a station,
  changes a set or touches a logbook; a PB only reads the logbook.
- **Mute, block, report.** Only needed with strangers.

**What this makes harder later**

- **Strangers: Slap back turns one slap into an exchange.** Between friends,
  a return slap is the point. From someone you've never met, it's an
  escalation. A stranger room needs INT-7's slap setting to cover Slap back
  too, and probably the MVP spec's consent rule ("both users allow slaps").
- **Strangers: the High-five is the right shape.** It only happens when both
  press, so it is consent built in: the Shy Regular's ideal first step after
  a Cheer. What a stranger room would need is mute (an offerer who keeps
  offering every 10 s).
- **Strangers: PB announcements say you're training, by name.** Withholding
  the numbers (F5) is the MVP spec's own rule for public rooms ("weights …
  off in public rooms"); a stranger room would also need a per-person
  "share my PBs with the room" setting, in the vision's "who you let see
  you" question. `logbook.md` LB-4.13 asked for that setting now; F15 puts
  it off until public rooms, because today's rooms are friends-only.
- **Mute (MVP spec)** would have to silence a muted person's sounds, hide
  their High-five offers and drop their replies, not only their bubbles.
- **The room log fills faster.** Replies, High-fives and PBs share its
  newest 50 with presets and interactions (and INT-6's free text later), so
  presets scroll out sooner in a busy room.
- **Banners with buttons, replaced by the newest (D9)**, lose their button
  more often as more kinds of banner arrive. The menu keeps every reply and
  every open offer reachable, so nothing is lost, but the designer should
  watch how often the banner's button vanishes under a thumb.
- **A records feature later (MVP LOG-12)** may define "best" differently
  (heaviest, most reps at a weight, estimated one-rep max). A PB announced
  under this file's rule might not be a record under that one; the two
  would need reconciling, not two words for nearly the same thing.
  *(Resolved 5 Nov, F14: a PB is a logbook record.)*
- **More PBs from people who don't mark warm-ups.** Under F14, a second
  set heavier than the first is a record (LB-4.3 only spares the very first
  set). A Drifter who ramps up 40, 50, 60 kg without tapping Warm-up gets a
  PB on each new exercise's second set and again on the third, each with a
  room banner. F4's "whole first workout sets the bar" guarded against
  that; the user chose logbook's rule knowing this. If it proves noisy, the
  lever is the room's moment (for example, one PB moment per exercise per
  workout), not the record rule.
- **The sound setting lives in one browser** (F7). A settings page later
  (ACC-5) won't know it; moving it to the account is small, but people
  would set it once more.
- **Dony's planned PBs** are pretend: if a records page or PB history ever
  arrives, they must stay out of it (BOT-5).

**Existing behaviour this changes or exposes**

- **Stored interactions have three kinds** (`interactions.kind` in
  `src/lib/schema.ts`: cheer, poke, slap; `KINDS` in `src/lib/moves.ts`).
  Replies and High-fives add kinds, a link from a reply to what it answers,
  and offers with their outcome. The 10 s check in `interact()`
  (`src/lib/interactions.ts`) counts any stored row from sender to target;
  replies and acceptances must count toward it without being blocked by it
  (INT-9.8, INT-10.9).
- **The banner** is built in the room page's script (`banner()` in
  `src/pages/rooms/[id].astro`) as a status line with no buttons and a fixed
  4 s; its slot is shared, so a room banner and a personal banner replace
  each other (D9).
- **Reactions** are three to four frames over the tile, 600 to 800 ms
  (`FX_FRAMES`, `FX_MS` and `.fx` in the room page), with nothing for the
  sender. INT-11 replaces the art and the timing within the limits below.
- **Sound** is one function, `beep()`, used only for the rest-over sound;
  the audio context is unlocked on the first **pointer** press only. A
  keyboard-only person never unlocks sound today, so they'd never hear the
  rest-over beep either. INT-12.11 fixes that.
- **Records** are decided by `logbook.md` LB-4 when a set is stored, per
  record type, from working sets only. GYM-17 reads that result (F14); it
  never defines a best of its own, and `topSet` (a workout's "Best" line)
  is not used for it.
- **Done lands in `logSet`** (`src/lib/workouts.ts`), followed by a redirect
  and the logged stamp. A PB is decided there, in the same step that stores
  the set, so it can never slow Done.
- **Dony's emoji answers** are planned from stored interactions in
  `src/lib/dony.ts` (`answers()`, `ANSWER_EVERY_MS`). His High-five
  acceptances and his PB join that plan (BOT-7), so they survive a restart
  the same way.

**Spec and design-system changes this needs** (not made here; the main
agent makes or proposes them):

In `docs/product/spec-4-weeks.md`:

1. **New rows**, P1, worded as the "Proposed wording" under each heading
   below: INT-9 (answering), INT-10 (High-five), INT-11 (reactions),
   INT-12 (sound and the sound setting) in Interactions and messages;
   GYM-18 (the room's PB moment) in The gym; BOT-7 (Dony and the new
   things) in Dony.
2. **GYM-17 reworded** (F14, F15): "A Done that sets at least one personal
   record (LB-4: working sets only; the first set to measure a record type
   sets nothing) is a personal best. It plays a flex everyone in the room
   sees, with a room banner and log line that name the exercise but no
   numbers (GYM-18)." And LB-4's row loses "Nobody else in the room is
   told (GYM-17 stays separate)", which F15 overturns.
3. **The "Out" table's personal-records row**: GYM-17 is in. (Already
   reworded on main by the logbook work: personal records came back with
   LB-4, and the row says a personal best is celebrated in the room.)
4. **INT-1** reworded: the menu also offers **High-five**, and a reply as
   its first row while one is open to you.
5. **INT-3**: a banner may carry one button (a reply, a High-five, or Cheer
   on a PB) and then stays 6 s; others stay 4 s; the newest still replaces.
6. **INT-4**: replies and High-five acceptances are never refused by the
   10 s limit but count toward it (F10).
7. **INT-5**: the room log also keeps replies, completed High-fives and PBs
   (without numbers).
8. **LOG-5**: "… plays a sound (unless the person has turned it off) and
   flashes …".
9. **BOT-6**: the one-answer-every-10-s cap is shared with his High-five
   acceptances (F8).
10. **Data model**: `interactions` gains the new kinds, a link from a reply
    to what it answers, and High-five offers with their outcome; a set's PB
    is recorded or derivable (implementation is the main agent's).
11. **Risks**: "Slap back reads as escalation" (it follows Slap's rule, once
    per slap, within 30 s); "Sound annoys at the gym or in class" (three-way
    setting, one blip a second at most).
12. **Candidate checks**: a second reply to the same interaction is refused;
    a reply after 30 s is refused; a High-five accepted after 10 s is
    refused; a set equal to the best is not a PB; a warm-up is never a PB;
    the first set to measure a record type is not a PB.

In `docs/design/system.md`:

13. **Section 3, copy bank**: every line marked *(new)* below (reply
    banners, High-five lines, "left you hanging", the PB banner (the stamp
    uses logbook's record mark),
    the confirmation lines, "Too late to answer that one.", "Already
    answered.", "Ji-woo's away right now.", "Too slow. Mia's hand is
    down.").
14. **Section 9, components**: the banner may hold one button; the menu's
    High-five row and reply row; the room banner.
15. **Section 11, motion and sound**: reactions up to 1.5 s, the flex up to
    2 s; all sounds on by default with a three-way setting (All sounds /
    Rest timer only / Off), kept per browser; the setting lives on the room
    page where the designer puts it (there is no gym menu); interaction
    sounds at most one a second.
16. **Section 12, accessibility**: a PB's room banner is announced to
    everyone once, the one exception to "other people's changes are
    quiet"; a key press unlocks sound as a tap does.

## Criteria

Each criterion says how it can be checked: **HTTP** (a request against the
running app), **browser** (needs the page's script, Playwright) or
**judged** (a person has to look or listen). Names follow system.md section
13: Mia, Ji-woo, Tom, Priya. Unless stated, all are members of the same open
room, each signed in in their own browser with the room open, and sound is
on.

Copy marked *(new)* is in the copy bank's voice and goes into the copy bank
(system.md section 3) with this file; the designer may tune its wording.

### INT-9 (proposed for the spec): answering an interaction

> *Proposed wording:* After a Cheer, Poke or Slap, the target can answer it
> once, within 30 s, in one tap from the banner or from the sender's menu:
> **Thanks** to a Cheer, **Poke back** to a Poke, **Slap back** to a Slap.
> The answer plays on the sender and gives them a banner. An answer can't be
> answered.

**INT-9.1** Given Mia cheers Ji-woo and it is accepted, then Ji-woo's banner
("Mia is hyping you up 🔥") carries one button, **Thanks**. Given a Poke,
the button is **Poke back**; given a Slap, **Slap back** (F1, F2).
The banner's words are unchanged from `int.md` INT-3.2. *browser*

**INT-9.2** Given Ji-woo taps Thanks and it is accepted, then within a
second, on every open screen in the room, a thanks reaction plays on
**Mia's** avatar; Mia's screens get the banner "Ji-woo says thanks 🙏"
*(new)*; the room log gets "Ji-woo thanked Mia". The server stores it as
Ji-woo's interaction with Mia, linked to the cheer it answers. *HTTP* (the
event arrives on Tom's stream; the log holds the line) and *browser*

**INT-9.3** Given Ji-woo taps Poke back, then the poke reaction plays on
Mia, Mia's banner reads "Ji-woo poked you back 👉" *(new)*, and the log reads
"Ji-woo poked Mia back". Given Slap back, the slap reaction plays on Mia,
her banner reads "Ji-woo returned the slap 👋" *(new)* (not "slapped you
back", which would read like the Slap's own "slapped you back to work"), and
the log reads "Ji-woo returned Mia's slap". *browser* (F2)

**INT-9.4** Given Ji-woo's reply is accepted, then the banner it gives Mia
has **no** button, and Mia's menu on Ji-woo offers no reply for it: a reply
can't be answered. Mia can still cheer, poke or slap Ji-woo from the menu,
under the 10 s limit. *HTTP* (a reply to a reply is refused) and *browser*

**INT-9.5** Given Mia's slap to Ji-woo was accepted at time T, when Ji-woo's
Slap back reaches the server at T + 29.999 s, then it is accepted; at T +
30.000 s or later it is refused, nothing is stored or played, and Ji-woo
sees "Too late to answer that one." *(new)* in the calm refusal style
(`int.md` INT-3.14). The 30 s are counted on the server from the stored time
of the interaction being answered. *HTTP*

**INT-9.6** Given Ji-woo's reply to Mia's cheer was accepted, when another
reply to the same cheer reaches the server (a double tap, a second tab, a
second device, or from the menu after the banner), then it is refused and
nothing is stored or played. A double tap shows Ji-woo nothing; a later
attempt shows "Already answered." *(new)*. Of two sent at the same moment,
exactly one is accepted. *HTTP*

**INT-9.7** Given Mia cheered Ji-woo, and 12 s later poked her, then only the
poke is answerable: the cheer can no longer be answered, and Ji-woo's
banner and menu offer Poke back. Given Mia **and** Tom both slapped Ji-woo,
then each slap is answerable on its own: Slap back to Mia from Mia's menu,
Slap back to Tom from Tom's, and the banner carries the reply for whichever
arrived last (D9). *HTTP*

**INT-9.8** Given Ji-woo slapped Mia herself 3 s ago, when Mia's slap
arrives and Ji-woo taps Slap back, then the reply is accepted: a reply is
never refused by the 10 s limit. Once accepted, it counts as Ji-woo's
latest interaction with Mia, so her menu's Cheer, Poke, Slap and High-five
on Mia are unavailable for the next 10 s (F10). *HTTP*

**INT-9.9** Given Mia slapped Ji-woo and Mia has since tapped Start set (she
is Lifting) or finished, when Ji-woo's Slap back reaches the server, then it
is refused by Slap's own rule (`int.md` D5), decided by Mia's state when the
reply arrives, with the copy bank's words: "Mia is mid-set. Cheer instead?"
or "Mia's done for today. Cheer instead?". The slap stays answerable for the
rest of its 30 s, so if Mia rests again in time, Slap back works. Thanks and
Poke back have no state rule. *HTTP*

**INT-9.10** Given Ji-woo opens Mia's menu (from her avatar or her squad row)
while Mia's interaction is answerable, then the menu's first row is the
reply (Thanks, Poke back or Slap back), marked with the ▶ cursor as the
highlighted action. The usual rows follow, as before. When the 30 s run out,
or the reply is sent, the row goes without the menu closing. Highlight
order when several apply: an open High-five offer from Mia to Ji-woo
(INT-10) first, then a reply, then Mia's fresh PB (GYM-18.6), then
`int.md` INT-2.14's rule by state. *browser*

**INT-9.11** Given a banner carries a button, then it stays 6 s (not 4 s)
from when it appears on that screen; a newer banner still replaces it at
once (D9). Its button does nothing for a tap that lands in the first half
second after the banner appears, so a tap already on its way to what was
underneath isn't caught. The rest of the banner still lets taps through.
*browser*

**INT-9.12** Given the banner with a reply shows on Ji-woo's phone while she
is scrolled down to her set's fields, then it still covers no part of her
dock and doesn't move her panel's button (`int.md` INT-3.4, INT-3.15). Its
button is reachable by Tab while it shows, but focus never moves to it by
itself. A screen reader announces the banner's line once, as before; the
button's name says who it answers ("Slap back Mia"). *browser*

**INT-9.13** Given Ji-woo reloads, reopens or reconnects the room while Mia's
slap is still answerable, then no old banner shows (`int.md` INT-3.6), but
Mia's menu still offers Slap back until the 30 s are up. The same holds
after a server restart: what is answerable is worked out from what is
stored. *HTTP* (after a restart, a reply within 30 s is accepted) and
*browser*

**INT-9.14** Given Mia has left the room, when Ji-woo replies to her, then it
is refused with "Mia's left the gym." (`int.md` INT-2.9), and on Ji-woo's
screen the reply row and the banner's button go when Mia leaves. *HTTP*

**INT-9.15** Given Ji-woo is in any state (Idle, Lifting mid-set, Resting,
Slacking, Finished), Away or not, then she can send a reply: what the
replier is doing never matters (as `int.md` INT-2.7). Sending it changes
nothing about her set, her rest, her slacking time or her station, and
nothing about Mia's. *HTTP*

**INT-9.16** Given Dony, then nothing he does can be replied to (he never
sends interactions, `int.md` D11), so no reply button or row ever names him.
A hand-made reply addressed to Dony is refused as having nothing to answer.
*HTTP*

**INT-9.17** Given a reply from someone who isn't a member, someone signed
out, to a closed room, or naming an interaction that isn't addressed to the
sender of the reply, then it is refused as `int.md` INT-2.10 and INT-2.11,
and nothing is stored or shown. *HTTP*

**INT-9.18** Given any accepted reply, then the server log has one line with
the sender's id and display name, the target's id, the reply's kind, the
interaction it answers and the room; given a refusal, one line with the
reason (too late, already answered, a reply to a reply, target lifting or
finished, target gone, nothing to answer). No line holds a password, token,
passcode or full email. *judged* (read the log by hand)

**INT-9.19** Given the showcase, then a Slap back reads as playing along, a
Thanks reads as warm, and a Poke back reads as "you too". *judged* — With
strangers: a Slap back from someone you don't know is an escalation, not a
joke (see "What this makes harder later"); a Thanks to a stranger's Cheer is
the safest answer in the file.

### INT-10 (proposed for the spec): the High-five

> *Proposed wording:* From the menu, offer someone a High-five. It shows on
> every screen for 10 s, and only happens if they accept in that time, from
> a banner or your menu. Then both avatars play it on every screen. An offer
> nobody takes lapses quietly. Not while the target is Away.

INT-10 exists because of F1 (both answers: a reply and a High-five).

**INT-10.1** Given the menu on Ji-woo, then it offers **High-five** beside
Cheer, Poke, Slap and Message, available in every state of Ji-woo's except
Away (INT-10.3), and subject to the 10 s limit like the other interactions
(`int.md` INT-4.7). *browser*

**INT-10.2** Given Mia offers Ji-woo a High-five and it is accepted by the
server, then within a second: on every open screen in the room, Mia's avatar
shows an open offer that says it is for Ji-woo (how is the designer's call,
within INT-10.18);
Ji-woo's screens get the banner "Mia wants a high-five ✋" *(new)* with one
button, **High-five**; Ji-woo's screen reader announces the line once. The
offer is stored with its time. *HTTP* and *browser*

**INT-10.3** Given Ji-woo is Away, when Mia offers her a High-five, then the
server refuses it, nothing is stored or shown, and Mia sees "Ji-woo's away
right now." *(new)*; the menu shows High-five unavailable with that reason,
like a refused Slap (`int.md` INT-2.13). A High-five needs both people
there. *HTTP*

**INT-10.4** Given Mia's offer counts as an interaction, then it starts Mia's
10 s on Ji-woo (`int.md` INT-4.1: any kind counts), so she can't make a
second offer to Ji-woo, or cheer, poke or slap her, until the 10 s are up.
Because the offer lasts 10 s too, there is never more than one open offer
from one person to another. *HTTP*

**INT-10.5** Given Mia's offer was accepted by the server at time T, when
Ji-woo's acceptance (the banner's button, or High-five in Mia's menu)
reaches the server at T + 9.999 s, then the High-five happens; at T +
10.000 s or later it is refused, nothing is stored or played, and Ji-woo
sees "Too slow. Mia's hand is down." *(new)*. *HTTP*

**INT-10.6** Given the High-five happens, then within a second, on every open
screen in the room, both avatars play the High-five at the same moment where
each one is (neither walks), and Mia's open offer goes. Mia's screens get
the banner "Ji-woo high-fived you 🙌" *(new)*; Ji-woo's offer banner goes, and
her screen reader hears "You high-fived Mia" once. The room log gets "Mia
and Ji-woo high-fived" for everyone else; on each of the two people's own
screens the viewer comes first, as "You": "You and Ji-woo high-fived" on
Mia's, "You and Mia high-fived" on Ji-woo's, both with the leaf edge of a
line about you (`int.md` D14) (F13). *HTTP* and *browser*

**INT-10.7** Given Mia offers Ji-woo a High-five and Ji-woo offers Mia one at
the same moment, then exactly one High-five happens: whichever reaches the
server second is taken as accepting the first. Given Ji-woo double-taps the
banner's button, or accepts from two tabs at once, then one High-five
happens and the other attempt shows nothing. *HTTP*

**INT-10.8** Given Tom presses High-five in Mia's menu while Mia has an open
offer to Ji-woo, then Tom makes his own offer to Mia; he never completes
Mia's offer to Ji-woo. Only the person an offer is for can accept it.
*HTTP*

**INT-10.9** Given Ji-woo interacted with Mia 4 s ago, when she accepts Mia's
offer, then the acceptance is accepted: it is never refused by the 10 s
limit. Once it happens, it counts as Ji-woo's latest interaction with Mia
(F10). *HTTP*

**INT-10.10** Given nobody accepts Mia's offer, then at 10 s it lapses: the
open offer goes from Mia's avatar on every screen; if Mia has the room open,
she sees "Ji-woo left you hanging ✋" *(new)* for 4 s in the calm refusal
style, where refusals appear (`int.md` INT-3.14). Nobody else is told,
Ji-woo is not told, nothing goes in the room log, and no sound plays. When
asked after the 10 s, the server reports the offer as lapsed; it needs no
timer to do so. *HTTP* (an acceptance after 10 s is refused; the log has no
line) and *browser*

**INT-10.11** Given Ji-woo leaves the room, or Mia does, or the room closes,
while an offer between them is open, then the offer ends at once, with no
"left you hanging" line, and an acceptance is refused with "Mia's left the
gym." as `int.md` INT-2.9. *HTTP*

**INT-10.12** Given Mia's offer was made 4 s ago, when Tom's screen opens,
reloads or reconnects, then Tom sees Mia's open offer for the 6 s left, as a
bubble does (`int.md` INT-5.6). Given Ji-woo's screen reloads, then her offer
banner doesn't come back (`int.md` INT-3.6), but Mia's menu still offers
High-five, highlighted, as the way to accept. After a server restart the
offer is still open until its 10 s are up. *HTTP* and *browser*

**INT-10.13** Given Ji-woo is Lifting mid-set when she accepts, then her set,
stopwatch and panel are exactly as they were; given either of them is
Resting or Slacking, their rest and slacking time keep counting. A
High-five changes nobody's workout. *HTTP*

**INT-10.14** Given Mia uses only a keyboard, then she can offer from the
menu (via Ji-woo's avatar or squad row), and accept an offer from Mia's
menu, where High-five is the highlighted first action while the offer is
open (INT-9.10). The banner's button is reachable by Tab but never takes
focus by itself. *browser*

**INT-10.15** Given someone has reduced motion turned on, then on their
screen the open offer shows without moving and the High-five shows as one
still frame for about a second; the banners still say what happened.
*browser*

**INT-10.16** Given any offer, acceptance, refusal or lapse, then the server
log has one line with the sender's id and display name, the other person's
id, what happened and the room; refusals carry their reason (target away,
too slow, target gone, rate limit). A lapse is logged when the server first
learns of it, never by a timer. *judged* (read the log by hand)

**INT-10.17** Given the showcase (twelve people, nobody lifting), then a
High-five between two people on opposite sides of the map still reads as a
High-five between those two, and "left you hanging" reads as a joke, not a
rejection. *judged* — With strangers: an offer only happens if both press,
so it is consent by design; "left you hanging" from a stranger's point of
view may sting more and might want softer words there.

**INT-10.18** Given Mia's open offer shows on the map (her raised palm on
her avatar, and the bubble saying it is for Ji-woo), then the bubble is
drawn under every avatar, as emoji pops are (`int.md` INT-8.23): every name
tag and every head draws over it, so for its 10 s it never covers anyone's
tag, a neighbour's included. Given Mia sends a preset while her offer is
open, then the preset's bubble replaces the offer's bubble, as any newer
bubble of hers does (`int.md` INT-5.5), and the raised palm on her avatar
stays until the offer happens, lapses or ends, so the offer can still be
seen and accepted (F12). *browser* (in a room of twelve, an offer's bubble
box never covers a tag's box; after a preset, the palm is still shown)

### GYM-17: a personal best

> A Done that sets at least one personal record (`logbook.md` LB-4) is a
> personal best, and plays a flex everyone in the room sees. *(F14 and F15,
> 5 Nov; the spec's row is reworded to match.)*

**GYM-17.1** Given Mia's Done stores a set that is a record for at least one
record type (`logbook.md` LB-4.1), then that Done is a PB; given it is a
record for none, it isn't. One Done is one PB however many types it breaks:
Mia's best bench was 100 kg × 5, and 100 kg × 6 (a record for Most reps and
Best e1RM, LB-4.2) is one PB, with one flex and one room banner. 100 kg × 5
again is not a PB (equal is never a record); 102.5 kg × 1 is (Heaviest);
60 kg × 12 after a best of 60 kg × 10 is (Most reps) (F14). *HTTP*

**GYM-17.2** Given every kind, then a PB follows the record types of
`logbook.md`'s Terms with nothing added or left out: Heaviest, Best e1RM
and Most reps for weight lifts; Most reps and Heaviest added for bodyweight
lifts; Longest hold; Longest distance and Longest time for cardio (F14).
*HTTP*

**GYM-17.3** Given the first set to measure a record type (Mia's first ever
working set of Back squat, or her first pull-up with weight added), then it
is not a record (LB-4.3, LB-4.6), so it is not a PB. Her next working set
that beats it is, even in the same workout: there is no "first workout"
rule (F14, replacing F4). *HTTP*

**GYM-17.4** Given a Warm-up set, then it is never a PB and never the bar a
later set must beat (`logbook.md` LB-2.10, LB-4.4). Given Mia logs two
records on Bench press in one workout (102.5 kg, then 105 kg), then both
Dones are PBs. *HTTP*

**GYM-17.5** Given Mia's PB is decided, then it is decided by the server in
the same step that stores the set, from the record rule as it stands at that
moment. Given two Dones from two of her tabs reach the server at the same
moment with the same new best weight, then exactly one is a record and a PB
(the one stored first); the other is equal to it. *HTTP*

**GYM-17.6** Given Mia edits or deletes a set (LOG-8), then `logbook.md`
LB-4.9 may move record marks on her own pages, but no PB is announced to the
room, and none already announced is taken back: the room's moment happens
only on Done, and a PB once announced stays in the room log. *HTTP* (R4)

**GYM-17.7** Given Mia's Done is a PB, then within a second, on every open
screen in the room, her avatar plays the flex once, then goes on to where
her state puts her (the cooler, after a weight, bodyweight or duration set).
Her own sheet turns Resting at once, as on any Done: the flex never delays
her sheet, Done, Start set or anything she can tap. *browser*

**GYM-17.8** Given Mia's PB is on cardio (after a cardio Done she stays
Lifting on the treadmill, LOG-4), then the flex plays where she is and she
goes back to running on the treadmill afterwards. *browser*

**GYM-17.9** Given Mia's Done is a PB, then on her own screen the
confirmation is `logbook.md`'s record mark on the logged stamp, naming each
record the set broke ("New record: heaviest, best e1RM", LB-4.10), which her
screen reader hears once. There is no separate "New PB" stamp or wording:
she gets no room banner (GYM-18.3), and nothing new appears over or beside
Done (F14). *browser*

**GYM-17.10** Given Mia's Done is a PB, then the time from her tap to her
Resting sheet is the same as for a Done that isn't one. *judged* (on a
mid-range phone) and *HTTP* (the PB is part of the same response; no second
request is needed)

**GYM-17.11** Given a PB happened, when a screen opens, reloads or
reconnects afterwards, or after a server restart, then no flex is replayed.
Someone who was Away finds it only in the room log (GYM-18.5). *browser*

**GYM-17.12** Given someone has reduced motion turned on, then on their
screen the flex shows as one still frame for about a second, then Mia is
drawn where her state puts her. *browser*

**GYM-17.13** Given any avatar look (every skin, hair style, hair colour and
shirt) and Dony's head, then the flex shows them as chosen, as every
animation does (`animations.md` GYM-10.11). *judged* (the art sheet)

**GYM-17.14** Given any PB at any weight, then the flex reads as proud and
playful, the same for everyone whatever they lifted, and never shows effort
as strain, a body as changed, or one lifter as better than another (banter,
not shame). *judged*

**GYM-17.15** Given a PB, then the server log has one line with the person's
id and display name, the exercise, the kind and the room (the numbers are
already in the set's own log line). *judged* (read the log by hand)

### GYM-18 (proposed for the spec): the room's moment for a PB

> *Proposed wording:* When someone hits a PB, everyone else in the room gets
> a banner naming them and the exercise, without numbers, with a one-tap
> Cheer. The PB goes in the room log. For 30 s their menu suggests Cheer and
> High-five.

**GYM-18.1** Given Mia's Done is a PB on Bench press, then within a second
every other open screen in the room shows the room banner "Mia hit a PB on
bench press 🏆" *(new)*, with one button, **Cheer**. It shows no weight, reps,
time or distance (F5). *browser* and *HTTP* (the event on Tom's
stream carries the exercise and no numbers)

**GYM-18.2** Given Tom taps Cheer on the room banner, then it is exactly a
Cheer to Mia from the menu: the same rules (`int.md` INT-2.1, the 10 s limit
INT-4), the same reaction, the same banner on Mia's screens ("Tom is hyping
you up 🔥", with its Thanks, INT-9.1), the same log line. If Tom cheered Mia
in the last 10 s, he sees "Easy, give them 10 seconds." *HTTP* and
*browser*

**GYM-18.3** Given Mia hits the PB, then her own screens get no room banner;
her logged stamp says it (GYM-17.9). The cheers that follow arrive as
ordinary banners, each replacing the last (D9). *browser*

**GYM-18.4** Given a room banner shows on Ji-woo's screen, when an
interaction to her arrives (or another PB), then the newest replaces it, and
the other way round: a room banner replaces her current banner (D9). The
room banner carries a button, so it stays 6 s (INT-9.11). *browser*

**GYM-18.5** Given Mia's PB, then the room log gets "Mia hit a PB on bench
press" for everyone else and "You hit a PB on bench press" on Mia's screen,
with no numbers, kept after a reload and a server restart, marked as about
Mia with `int.md`'s leaf edge on her screen (D14) (F5). *HTTP* and
*browser*

**GYM-18.6** Given Mia's PB was stored less than 30 s ago, when anyone opens
her menu, then Cheer and High-five are the highlighted actions (unless an
open offer or a reply comes first, INT-9.10). After 30 s the usual
highlighting returns, without reopening the menu. *browser*

**GYM-18.7** Given a screen reader, then everyone else in the room hears the
room banner's line once ("Mia hit a personal best on bench press"), even
though other people's changes are otherwise quiet (system.md section 12): a
PB is rare, and the point is that the whole room notices. The banner's Cheer
button is reachable by Tab while it shows and never takes focus; the
keyboard path is Mia's menu, where Cheer is highlighted (GYM-18.6).
*browser*

**GYM-18.8** Given a PB happened while Priya was Away or had the room closed,
then she never gets its banner later; she finds it in the room log. *browser*

**GYM-18.9** Given Mia's PB, then nothing the room can see counts, ranks or
compares it: no "third PB this week", no PB tally, no list of who has the
most, no mention of anyone's numbers or of which record types were broken.
(Mia's own summary counting her records, `logbook.md` LB-4.12, is hers
alone and unchanged.) *judged* (and *HTTP*: no room page or stream carries a
PB count, a record type or a number)

**GYM-18.10** Given the showcase (nobody lifting real sets), then the room's
PB moment still happens, through Dony (BOT-7.5); and given a real squad, a
PB banner reads as "go Mia", not as "look what you haven't done". *judged* —
With strangers: naming the person tells strangers you're training and on
what; without numbers it can't invite comparison, but a public room would
need a setting to keep PBs to yourself.

### INT-11 (proposed for the spec): reactions that feel good

> *Proposed wording:* Every reaction is big and clear enough to tell its kind
> at a glance on a phone at arm's length, and the sender always knows their
> move landed, even with the target out of view. Reactions never cover the
> dock, delay Start set or Done, or cover a name tag.

What each reaction looks like, its frames and its motion are the designer's.
These criteria are the limits it works within and what a person must notice.

**INT-11.1** Given each reaction (Cheer, Poke, Slap, Thanks, Poke back, Slap
back, the High-five, the flex), then someone who glances at the map on a
phone at 1× while it plays can tell which one it was, and on whom. *judged*
(at the rehearsal, five reactions shown at random, named correctly)

**INT-11.2** Given a reaction plays on Ji-woo, then her own sprite may react
with it (a jolt, a hop, a spin, as `animations.md` D7 allows: effects and a
movement of the whole sprite, never new body frames), but her tag stays
where it is and keeps saying who she is and her state (`animations.md`
GYM-15.5). *browser* (the tag's box doesn't move during a reaction)

**INT-11.3** Given a reaction plays, then it may spill outside Ji-woo's tile,
but never covers anyone's name tag, never covers or moves the dock or its
button, the emoji tab or tray, or the menu, and never takes a tap: a tap on
an avatar under it still selects that avatar. *browser*

**INT-11.4** Given any reaction, then it lasts at most 1.5 s (system.md
section 11 says under 1 s; this raises it), and a newer reaction on the same
avatar restarts it, as today. The flex may last up to 2 s. *browser*
(decided, R10)

**INT-11.5** Given Mia's interaction, reply, offer or acceptance is accepted
and Ji-woo's avatar is not in view on Mia's screen (on a phone, scrolled
down to her fields), then Mia sees a short confirmation line where refusals
appear (`int.md` INT-3.14), for 2 s, naming what she did and to whom ("You
slapped Ji-woo 👋", "You offered Ji-woo a high-five ✋") *(new)*. If Ji-woo's
avatar is in view, the reaction itself is the confirmation and no line
shows. Either way Mia's screen reader hears it once ("Slapped Ji-woo").
*browser* (decided, R9)

**INT-11.6** Given someone has reduced motion turned on, then every reaction
shows as one still frame for about a second (as `int.md` INT-3.9 for the
first three), the sprite doesn't jolt, and sound (if on) is unchanged.
*browser*

**INT-11.7** Given any reaction or flex, then nothing on the map flashes more
than three times in any second, and no large area changes brightness that
often (WCAG 2.3.1). *judged*

**INT-11.8** Given a room of twelve plus Dony, everyone cheering, slapping,
high-fiving and sending emoji as fast as they're allowed for a minute, then
Start set and Done respond as quickly as in an empty room, a phone at 1×
stays responsive, and every avatar can still be told apart by its tag.
*judged* (at the rehearsal) and *browser* (the dock is never covered)

**INT-11.9** Given emoji pops, then the designer may make them livelier, but
`int.md` INT-8.23 still holds (under every avatar, never covering a tag), and
they still go at 3 s. *browser*

**INT-11.10** Given the polished reactions side by side with today's, then
a Gen Z squad would call them more satisfying to send and to get, and the
slap still reads as slapstick, never as hurting (`int.md` INT-3.17).
*judged*

### INT-12 (proposed for the spec): sound, and the sound setting

> *Proposed wording:* The room page plays short sounds for things that are
> about you (an interaction, reply, High-five or preset to you; your own
> moves landing), a fanfare everyone hears for a PB, and the rest-over
> sound. Never for other people's interactions or emoji. A setting on the
> room page chooses All sounds, Rest timer only, or Off; it is remembered in
> that browser.

**INT-12.1** Given sound is on (the setting is "All sounds"), then these
sounds play, each only on the screens listed (F6):

| What happens | Whose screens play a sound |
| --- | --- |
| A Cheer, Poke, Slap, Thanks, Poke back, Slap back, or a High-five offer, to Ji-woo | Ji-woo's, a sound for each kind |
| A preset addressed to Ji-woo | Ji-woo's, a soft one |
| Ji-woo's own interaction, reply, offer or acceptance is accepted | Ji-woo's, a short confirmation |
| Ji-woo's own emoji is accepted | Ji-woo's, a soft pop |
| A High-five happens between Mia and Ji-woo | Mia's and Ji-woo's |
| Anyone's PB, Dony's included | everyone's in the room, the PB fanfare |
| Ji-woo's rest runs out (LOG-5) | Ji-woo's, unchanged |

*browser* (an audio start is observed for each row, and on no other screen)

**INT-12.2** Given anything else (another person's interaction, reply,
High-five or emoji, a preset to someone else, Dony's emoji, a refusal, a
failure, a lapsed offer, a bubble, a reload), then no sound plays. *browser*

**INT-12.3** Given the sound setting, then it has three values: **All
sounds**, **Rest timer only** (exactly today's behaviour: only the rest-over
sound) and **Off** (no sound at all, the rest-over sound included). A
browser that has never chosen starts on All sounds (F7). *browser*

**INT-12.4** Given Ji-woo sets Off, then from that moment her screens in that
browser play nothing, and when her rest runs out the panel still flashes and
says "Rest's up. Back under the bar 🔔" (LOG-5): sound never carries anything
on its own (system.md section 11). *browser*

**INT-12.5** Given Ji-woo chooses a setting, then it is remembered in that
browser: after a reload, after leaving and joining another room, and after
signing out and in again on the same browser. Another browser or device of
hers keeps its own setting. Nothing about it is sent to or stored by the
server, and no log line is written (F7). *browser*

**INT-12.6** Given Ji-woo's browser won't remember anything (storage blocked,
a private window that forgets), then the room page starts on the default
each time it opens, and everything else works. *browser*

**INT-12.7** Given Ji-woo changes the setting, then it takes effect at once:
a sound already playing stops when she chooses Off. *browser*

**INT-12.8** Given the room page, then the sound setting is on it, in a
place the designer chooses, under these rules: not in the dock, not beside
or over Start set, Done, Save or Choose, not in the emoji tray or the
interaction menu; reachable by Tab with a visible focus ring; its current
value shown in words, never by an icon or colour alone; changed in one tap
or key press (or one choice from a short list); available in every panel
state, mid-set included. It never prompts, nags or pops up to suggest
turning sound on. *browser*

**INT-12.9** Given twelve people cheer Ji-woo within two seconds (a PB
cascade), then her screen plays at most one interaction sound in any one
second; the extra ones are skipped, while every reaction and banner still
shows. The PB fanfare and the rest-over sound always play, and an
interaction sound never starts while one of them is playing. *browser*
(decided, R8)

**INT-12.10** Given the browser hasn't yet allowed the page to play sound
(nobody has tapped, clicked or pressed a key on it since it opened), then a
sound that would play is skipped silently and nothing else changes. No
prompt asks to allow sound. *browser*

**INT-12.11** Given Ji-woo uses only a keyboard, then her first key press on
the room page counts, as a tap does, as the gesture that lets the page play
sound, so she hears the rest-over sound and the rest. (Today only a pointer
press does.) *browser*

**INT-12.12** Given Ji-woo has the room open in two tabs or on two devices,
then each plays its own sounds by its own setting. *browser*

**INT-12.13** Given Ji-woo reloads or reconnects, then no sound for anything
that happened before is played. *browser*

**INT-12.14** Given the sounds, then they are short chiptune blips that fit
the gym's pixel style, every one quieter than the rest-over sound, each kind
distinguishable from the others, and still not annoying after ten minutes
of the showcase. *judged*

**INT-12.15** Given the showcase (a room of laptops, sound on by default),
then a PB fanfare playing on every laptop at once makes the physical room
notice, and nothing plays often enough that people reach for Off within
the first few minutes. *judged*

### BOT-7 (proposed for the spec): Dony and the new things

> *Proposed wording:* Dony never offers a High-five or replies to anyone. If
> offered a High-five he accepts about a second later, unless he answered
> anything in the last 10 s, in which case he leaves you hanging. Once per
> visit he hits a PB, planned like the rest of his schedule. Everything is
> worked out from the room, his summon time and what is stored.

Unless stated, Dony is out of his poster. His numbers (one second, the
shared 10 s cap, one PB per visit 4 to 8 minutes in) were agreed with F8,
F9 and F11.

**BOT-7.1** Given Dony is out, then he never offers a High-five, never sends
a reply, and never sends an interaction or preset (`int.md` D11 still holds
for everything he starts). *HTTP*

**BOT-7.2** Given Mia offers Dony a High-five, and Dony hasn't answered
anything (an emoji answer, BOT-6.7, or an accepted High-five) in the last
10 s, then about a second after the offer he accepts: the High-five plays on
both avatars on every screen, Mia gets "Dony high-fived you 🙌", the room log
gets "Mia and Dony high-fived", and he sends no emoji answer for it. Given he
answered in the last 10 s, then he doesn't accept, and Mia's offer lapses
with "Dony left you hanging ✋" as INT-10.10. So twelve people offering at
once get one High-five between them (F8). *HTTP* (his acceptance
arrives on another member's stream; a second offer within 10 s lapses)

**BOT-7.3** Given Dony's acceptances, then every screen, a page opened
later, and the server after a restart agree on which offers he accepted:
they are worked out from the stored offers, as his emoji answers are
(BOT-6.5). One whose moment fell while nobody's stream was open still counts
as accepted (the log has it), but no animation is replayed. His schedule,
state and station are unchanged by any of it. *HTTP* (with a restart)

**BOT-7.4** Given Dony's offer acceptance and his emoji answers, then they
share one cap: an emoji answer to Tom's cheer means Dony won't accept Mia's
offer in the next 10 s, and an accepted High-five means he sends no emoji
answer in the next 10 s. *HTTP*

**BOT-7.5** Given Dony's visit, then once per visit he hits a PB, at a time
planned from the room and his summon time, between 4 and 8 minutes after he
lands (F11):
- if he finishes a set in that window, it is the Done of the first one;
- if no set ends in it (a long run, for example), it falls mid-set at a
  planned moment in the window while he is Lifting, on the lift he's on then
  (a run passes his best distance while he is still running); he flexes and
  goes straight back to the lift, as GYM-17.8 for a person's cardio PB;
- if he is by the lockers for the whole window, it falls as he starts his
  next lift, on that lift. Since a spell by the lockers lasts at most
  6 minutes, this is still no later than 10 minutes after landing.

So every visit's PB lands within its first ten minutes (BOT-7.9). It plays
exactly as a person's does: the flex on every screen (GYM-17.7), the room banner "Dony hit a PB on
deadlift 🏆" with Cheer (GYM-18.1, the lift being the one he is on), the PB
fanfare (INT-12.1), and 30 s of Cheer and High-five highlighted in his menu
(GYM-18.6). It is never in the room log, in any logbook, or in the summary
(BOT-5). Cheering him from the banner gets his usual emoji answer
(BOT-6.7) (F9, F11). *browser* and *HTTP* (two members' streams carry
his PB at the same server time, one opened before a restart and one after;
over many summon times, every planned PB falls 4 to 8 minutes after
landing, or at the start of the first lift after a lockers spell covering
that whole window)

**BOT-7.6** Given Dony's PB time falls while nobody's stream is open, or he
is sent back before it, then it is missed, never sent late, and never sent
twice; the next summon plans a fresh one. A screen that opens or reloads
after a mid-set PB sees him on his lift with no flex replayed (GYM-17.11).
*HTTP*

**BOT-7.7** Given anything Dony does in this file, then it doesn't count as
room activity (BOT-5, ROOM-6). An offer or interaction aimed at him is
logged as a person's (INT-10.16); his own acceptances and PBs write no log
line, as for his other planned moves. *HTTP* (the room's last-active time
doesn't move)

**BOT-7.8** Given Dony's sounds, then his emoji stay silent for everyone
(INT-12.2); his accepted High-five plays the High-five sound on the
offerer's screens; his PB plays the fanfare on every screen. *browser*

**BOT-7.9** Given the showcase, then within the first ten minutes of
summoning Dony, the room sees him flex for a PB and gets a reason to cheer
him at once, and a roomful of offers to him reads as a joke ("Dony left you
hanging"), not as broken. *judged*

## Open questions

None. All ten were settled on 4 Nov 2026 (F1 to F10), R1 to R11 stand as
written, three gaps found by qa in round two were settled on 5 Nov 2026
(F11 to F13), and the clash with `logbook.md` on 5 Nov 2026 (F14, F15);
see Decisions.

## Decisions

F1 to F10 and R1 to R11 are dated **4 Nov 2026**. The user's answer,
relayed by the main agent (translated): "All as recommended." F1 to F10
accept the recommended answer to Q1 to Q10 of the draft; R1 to R11 were
decided by recommendation in the draft and the user let them stand.

F11 to F13 are dated **5 Nov 2026**: gaps qa found in round two, settled by
recommendation under the user's standing instruction of 4 Nov (translated):
"any pending questions afterwards, go with what you recommend." They can be
overruled like any recommendation.

F14 and F15 are dated **5 Nov 2026**, settled by the user directly when
merging main brought in `logbook.md`; they replace F3 and F4. The criteria
above are written to match.
(F and R numbers are this file's; a bare D number is a decision in
`int.md`.)

| # | Question | Decision | Why | Criteria |
| --- | --- | --- | --- | --- |
| F1 (Q1) | How does someone answer an interaction? | **Both**: a one-tap reply on the banner and in the sender's menu (INT-9), **and** a mutual High-five that only happens when both press (INT-10). **Reverses `int.md`'s exclusion of High-five.** If they ship apart, the reply comes first. | A reply makes a slap something you can return, which is what makes it banter for the Drifter, and it works when only one or two people are there (the usual case). The High-five is the two-person moment for a full room, and needs both to agree, the right shape for strangers later. Neither touches the dock. | INT-9 (all), INT-10 (all), BOT-7.2 to BOT-7.4 |
| F2 (Q2) | What can each interaction be answered with? | Thanks to a Cheer, Poke back to a Poke, Slap back to a Slap. Slap back follows Slap's rule. A reply can't be answered. | "Thanks" is what people say to a cheer and is safe from a stranger; returning a poke or slap in kind is the playful part; nobody is slapped mid-set by a reply; no ping-pong. | INT-9.1 to INT-9.4, INT-9.9 |
| F3 (Q3) | What counts as a PB? **Replaced by F14 (5 Nov).** | Every kind, by what history already calls each exercise's "Best": weight then reps; reps then added weight; longest hold; longest distance then faster time. Strictly better than every earlier set; equal is never a PB. GYM-17's "heaviest weight" is widened to match. | One rule that matches history's "Best", as ADR 0002 planned; otherwise five of the sixteen exercises could never celebrate. (F14 keeps the "every kind" and "strictly better" parts, through LB-4's record types.) | (GYM-17.1, GYM-17.2, now under F14) |
| F4 (Q4) | Can a first workout with an exercise produce a PB? **Replaced by F14 (5 Nov).** | No: the whole first workout with an exercise sets the bar; PBs start from the next workout. | A new user's warm-ups would otherwise be a burst of fake PBs in front of the room. Dony covers the showcase (F9). | (GYM-17.3, now under F14) |
| F5 (Q5) | What does the room see of a PB? | The name and exercise, no numbers, in a room banner (with Cheer) and in the room log. The lifter sees their numbers in the logged stamp, with logbook's record mark (F14). | Numbers invite comparison (shame about ability); the banner is the whole-room moment; the log line reaches people who were away. | GYM-18.1, GYM-18.5, BOT-7.5 |
| F6 (Q6) | Which sounds exist? | Sounds for things about you (an interaction, reply, High-five offer or preset to you), a confirmation for your own moves and emoji landing, the High-five sound for both people, the PB fanfare for everyone, and the rest-over sound. Never for other people's moves or emoji, or Dony's emoji. **Reverses D27.** | Pressing things should feel like something to the sender too; the fanfare makes the whole room notice; other people's moves stay silent, or a room of emoji becomes noise. | INT-12.1, INT-12.2, INT-12.14, INT-12.15, BOT-7.8 |
| F7 (Q7) | Sound default, choices, where remembered | On by default; three values (All sounds, Rest timer only, Off); remembered per browser, nothing on the server. Placement on the room page is the designer's, within INT-12.8. LOG-5's sound can now be turned off; the flash and words always show. | Off by default means nobody hears it; three values let the Anchor keep only the rest beep and a lecture-room laptop go silent; sound belongs to the device and place. | INT-12.3 to INT-12.8 |
| F8 (Q8) | Does Dony accept High-fives? | Yes, about a second after the offer, sharing his one-answer-every-10-s cap with his emoji answers; otherwise he leaves you hanging. He still never starts anything. | Rooms are usually one person plus Dony, so this makes the High-five work alone; twelve offers giving one High-five is the joke. | BOT-7.1 to BOT-7.4, BOT-7.8 |
| F9 (Q9) | Does Dony hit PBs? | Once per visit, early in the visit (timing refined by F11: always 4 to 8 minutes after landing), with the flex, room banner, fanfare and highlighted menu; never in the room log or any logbook. | Without it the showcase, where nobody lifts and nobody has history, never sees the room's PB moment. | BOT-7.5, BOT-7.6, GYM-18.10 |
| F10 (Q10) | Do replies and High-five acceptances obey the 10 s limit? | Never refused by it, but they count as your latest interaction with that person. | Being told to wait when returning a slap feels broken; each interaction can be answered only once, so answers are already capped; counting them stops a reply followed instantly by a menu slap. | INT-9.8, INT-10.9 |

**Settled 5 Nov 2026 by recommendation, under the user's standing
instruction (gaps raised by qa, round two):**

| # | Question | Decision | Why | Criteria |
| --- | --- | --- | --- | --- |
| F11 | When does Dony's PB fall? F9's "the first set he finishes at least 4 minutes after landing" put it 4 to 20 minutes in (median about 7.6, about 40% after 9 minutes), because visits often open with an 8 to 20 minute run. | Always planned between 4 and 8 minutes after landing: the Done of the first set he finishes in that window; if none ends in it, mid-set at a planned moment in the window while he is Lifting, on the lift he's on (a run passes his best distance while still running); if he is by the lockers for the whole window, as he starts his next lift (at most 10 minutes in). Still planned from the room and summon time, still once per visit. Refines F9. | The showcase is why Dony's PB exists, so it must land inside a ten-minute demo (BOT-7.9). | BOT-7.5, BOT-7.6 |
| F12 | The High-five offer's bubble can cover a neighbour's name tag, for 10 s. | The offer's bubble is drawn under every avatar, as emoji pops are (`int.md` INT-8.23): tags and heads always draw over it. A preset from the same sender replaces it as their bubble (`int.md` INT-5.5); the raised palm on their avatar stays while the offer is open. | Tags carry who and what state, so they always win (`int.md` D20); the palm keeps the offer visible and acceptable. | INT-10.2, INT-10.18 (new) |
| F13 | How does the accepter's room log read for a High-five? | The viewer first, as "You", on either side: "You and Mia high-fived" on Ji-woo's screen, the same shape as the offerer's "You and Ji-woo high-fived". | One line shape for both people, as `int.md` D28 did for presets. | INT-10.6 |

**Settled 5 Nov 2026 by the user directly, reconciling GYM-17 with
`logbook.md` (agreed, merged from main):**

| # | Question | Decision | Why | Criteria |
| --- | --- | --- | --- | --- |
| F14 | `logbook.md` LB-4 defines records per record type (Heaviest, Best e1RM, Most reps; Most reps, Heaviest added; Longest hold; Longest distance, Longest time), working sets only, the first set to measure a type setting nothing, marked "New record: …" on the lifter's stamp. This file defined a PB as one combined best per kind (F3), from the second workout on (F4), with its own "New PB 🏆" stamp. Which wins? The user chose: "use logbook's records to trigger the room-wide moment." | **A PB is any Done that sets at least one logbook record.** F3 and F4 are replaced by LB-4's rule (so only the first set of a type sets nothing, not the whole first workout); warm-ups never count (LB-2.10). The room's moment is unchanged: flex, room banner without numbers, room-log line, fanfare, 30 s menu highlight (GYM-17.7 onwards, GYM-18). The lifter's confirmation is logbook's record mark on the stamp (LB-4.10); there is no separate "New PB" stamp. This is what `logbook.md` D18 anticipated. | One idea of "you beat your best" across the app, so the room and the lifter's own pages never disagree; the Anchor's real records drive the moment. Cost, accepted: more PBs early on from unmarked warm-ups (see "What this makes harder later"). | GYM-17.1 to GYM-17.6, GYM-17.8, GYM-17.9; Terms (Record, PB); Scope; overrides |
| F15 | `logbook.md` LB-4.13 says nobody else in the room can tell a record was set ("GYM-17, if built, should be a setting"). The user chose: "public, overturn LB-4.13." | **Public, with no setting in this build.** The room sees a PB's moment as GYM-17 and GYM-18 describe, never the numbers or which record types. LB-4.13 is superseded for that moment and marked so in `logbook.md`; everything else in LB-4 stays private to the lifter. A per-person setting comes with public rooms. | Rooms are friends-only by passcode; the room is shown no numbers, so it celebrates without comparing; a setting is needed when strangers can be in the room, not before. | Overrides table; GYM-17.7 to GYM-17.15, GYM-18 (as written), GYM-18.9 |

**Decided by recommendation in the draft, left standing by the user:**

| # | Decision | Why | Criteria |
| --- | --- | --- | --- |
| R1 | A banner with a button stays 6 s instead of 4 s, and its button ignores taps in its first half second. | On a phone the banner is at the top of the screen and the thumb is at the bottom; 4 s is too short to read and reach. The half second stops a tap meant for a field underneath from becoming a Slap back. | INT-9.11, GYM-18.4 |
| R2 | Reply window 30 s; one reply per interaction; only the newest from each sender; a reply can't be answered. | Long enough to finish a rep and look; short enough that "returned the slap" still reads as a reply; no ping-pong. | INT-9.4 to INT-9.7 |
| R3 | High-five lasts 10 s (the same as the 10 s limit); refused while the target is Away; a lapse is told only to the offerer ("left you hanging"); offers never go in the log, completed High-fives do. | Matching the limit means at most one open offer per pair with no new rule. Away means the page is closed, so they can't press. A lapse in the permanent log would be the target publicly "leaving someone hanging". | INT-10.3 to INT-10.5, INT-10.10 |
| R4 | A PB is announced on Done only; editing or deleting a set never announces or withdraws one. | Corrections should be quiet; logging is where the moment is; nothing un-plays. | GYM-17.6 |
| R5 | For 30 s after a PB, menus on that person highlight Cheer and High-five. | Points the room at the one thing to do, the way the MVP spec highlights High-five after a PB. | GYM-18.6 |
| R6 | A PB's room banner is announced to every screen reader in the room, once. | Rare and celebratory; otherwise screen-reader users miss the whole-room moment. | GYM-18.7 |
| R7 | The lifter's PB confirmation is in the existing logged stamp (since F14, logbook's record mark there); the lifter gets no room banner. | It's where their thumb and eyes already are after Done, and it leaves the banner free for the cheers. | GYM-17.9, GYM-18.3 |
| R8 | At most one interaction sound per second per screen; the PB fanfare and the rest-over sound always play. | A cheer cascade would otherwise be a wall of blips. | INT-12.9 |
| R9 | The sender's confirmation line shows only when the target's avatar is out of view. | On a laptop the reaction beside the menu is the confirmation; on a phone scrolled to the fields there's none today. | INT-11.5 |
| R10 | Reactions may last up to 1.5 s (the flex up to 2 s), up from system.md's "under 1 s". | "Too short" is part of the user's complaint; 1.5 s still never queues behind the next. | INT-11.4 |
| R11 | A key press unlocks sound as a tap does. | Today a keyboard-only person never hears the rest-over beep. | INT-12.11 |

**Resolved with these decisions:** the spec's "Out" table lists "personal
records" while GYM-17 is a P1 row. The user's direction (4 Nov): narrow the
Out row so GYM-17 is in; the wording is item 3 of "Spec and design-system
changes this needs". The spec itself is not edited here.
