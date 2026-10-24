# Acceptance criteria: Interactions and messages

- **Area**: Interactions and messages (`docs/product/spec-4-weeks.md`), plus
  the part of Dony that sends emoji
- **Requirements covered**: INT-1, INT-2, INT-3, INT-4, INT-5 (all P0);
  **INT-8, emoji (proposed for the spec, P0)**; **BOT-6, Dony's emoji
  (proposed for the spec, P1, with the other BOT rows)**. Neither proposed
  row is in the spec yet (see "Spec changes this needs" at the end of Scope).
- **Status**: agreed
- **Date**: 22 Oct 2026 (redrafted and agreed the same day; the room page
  designer's proposals, settled by the user the same day, added as D14 to
  D26; two answers to qa's round one added as D27 and D28; see Decisions)

**This version replaces the draft of 18 Oct.** On 22 Oct the user asked for
"a general gym interaction mechanism. It shouldn't only be triggerable when
someone is slacking. People should also be able to send emoji and the like
while they are working out." The 18 Oct draft treated interaction as a
response to slacking: Poke, Slap and the Nudge presets only worked on someone
Resting or Slacking. This version makes interaction an any-time social layer
of the gym, adds emoji that anyone can send in any state (mid-set included),
and keeps a state rule only for Slap (D5). The same day the user settled
every question, and added one thing: "let Dony also send emoji from time to
time" (D11, BOT-6).

**What carried over from 18 Oct, and what changed**

| Carried over unchanged | Changed, and why |
| --- | --- |
| The menu on another avatar and how it opens, closes and is used by keyboard (INT-1) | Poke and every preset now go to anyone in any state (D4); before, Poke and Nudge presets needed the target Resting or Slacking |
| The 10 s limit per sender per target for Cheer, Poke and Slap, counted from stored times (INT-4) | Slap is now refused only while the target is Lifting or Finished, so it works on Idle people (D5); before, Resting or Slacking only |
| Presets addressed to one person, bubble above the sender for 5 s, own 2 s limit (INT-5) | Poke's banner has a second wording for when the target isn't resting (INT-3.2) |
| The room log (presets and interactions, newest 50) | The sender's state is now stated outright as never mattering, Lifting included (INT-2.7) |
| Dony as a target; banners replace rather than queue; the squad list row opens the menu; data kept after a room closes | New: emoji (INT-8), sent from your own panel in every state, shown above your own avatar, not kept |
| | New: Dony sends emoji himself now and then, and in reply to interactions (BOT-6) |

## Terms

Used with these meanings throughout.

- **Sender**: the person who acts. **Target**: the person whose avatar was
  selected.
- **Interaction**: a Cheer, a Poke or a Slap: something one person does to
  another, with a reaction on the target and a banner for them.
- **Preset**: one of the ten fixed lines in INT-5, sent to one person. There
  is no free text in this file (INT-6 is P1).
- **Emoji**: one of the eight fixed small pictures in D3 that a person sends
  from their own panel. It shows above **their own** avatar, to the whole
  room, addressed to nobody (D1). Emoji are not presets and not interactions.
- **The emoji set** (D3): 👋 Hi, 💪 Flex, 🔥 Fire, 👏 Clap, 😂 Haha, 💀 Dead,
  👀 Eyes, ❤️ Love, drawn as pixel art, each with its word.
- **Menu**: what opens when you select someone else's avatar (INT-1).
- **Emoji tab** (also called the **emoji button**) and **emoji tray**: the
  one button rising from the right of your dock's top border, which opens the
  tray holding the emoji set (D2, D16).
- **Reaction**: the short animation an interaction plays on the target's
  avatar (system.md section 11: under 1 s), drawn over whatever pose they are
  in (animations.md, D7).
- **Banner**: the line the target gets when someone interacts with them
  (INT-3; system.md section 9: 4 s, `role="status"`).
- **Bubble**: the speech bubble a preset shows above its sender's avatar.
- **Emoji pop**: what an emoji shows above its sender's avatar, for 3 s.
- **Room log**: the list of presets and interactions the room keeps
  (INT-5.8), shown in its own panel under the squad list (D14). Emoji are not
  in it (D7).
- **Back row**: the row of stations against the mirrors at the top of the
  map, where there is no room above an avatar at 1×.
- **Panel** (or **sheet**): your own part of the gym page, whose one button
  follows your state: **Choose** while Idle, **Done** while Lifting, **Start
  set** while a rest runs (Resting, Rest up, Slacking), **Save** while
  editing a set. The **dock** is the strip that holds that button, pinned to
  the bottom of a phone.
- **State**: what the server reports for a person at that moment: Idle,
  Lifting, Resting, Slacking or Finished (GYM-9). **Away** is a separate flag
  on top of a state (GYM-14): "Resting, Away" is a Resting person whose page
  hasn't been in touch for 60 s.
- **Dony's visit**: the time from one summon of Dony to the next send back
  (BOT-1, BOT-4). His **schedule** is everything he does in a visit, worked
  out from the room and the summon time (BOT-3).
- **Within a second**: as GYM-13, the change reaches every other open screen
  in the room within about a second, with no reload.

## Scope

**In**

- The menu on another person's avatar, reachable by tap, click and keyboard
  (INT-1), usable whatever the sender is doing, mid-set included.
- Which interactions and presets are allowed for which target states,
  decided on the server (INT-2, ADR 0006). The default is "allowed"; only
  Slap has a state rule (D5).
- The reaction on every screen and the banner for the target (INT-3).
- The 10-second limit per sender per target for interactions (INT-4).
- Ten preset messages in two groups, the bubble, and the room log (INT-5),
  using the copy bank's presets in `docs/design/system.md` section 3.
- **Emoji (INT-8)**: eight fixed pixel emoji sent from a button beside your
  dock in every state, shown above your own avatar to the room for 3 s, one a
  second per person, never in the way of Start set or Done, not kept.
- **Dony's emoji (BOT-6)**: Dony sends the same emoji, now and then while
  he's out, fitting what he's doing, and in reply to interactions, all worked
  out from what the server stores.
- What every refusal looks like to the sender and what the server log
  records (OPS-1, OPS-2).

**Out, with the reason**

- **The sender's avatar walking over to the target** (the MVP spec does
  this). The sender would leave their station mid-workout, and the walk would
  sit between them and Done. The sender's avatar stays put; only the target
  reacts.
- **High-five** (MVP spec). Not in the four-week spec; Cheer and the emoji
  cover praise.
- **Emoji sent to a chosen person** (D1). Cheer and the Hype presets already
  say "you, specifically". Adding it later is one more item in the menu.
- **Any emoji from the phone's keyboard, or free text** (D3). A keyboard
  covers the dock, is slow one-handed, and an open set is the free-text
  problem (INT-6, and with strangers, misuse). Only the fixed set is
  accepted.
- **Keyboard shortcuts for emoji** (number keys on a laptop). They would fire
  while someone types a weight into the set's fields. The emoji button is
  reachable by Tab like everything else.
- **Reacting to a room log entry with an emoji** (as in Discord), counters,
  combos or streaks of emoji. Feeds and streaks are ruled out (system.md
  section 14), and the log is not a chat.
- **Dony sending interactions or presets.** He sends emoji only (D11). He
  never cheers, pokes, slaps or messages anyone, and never replies to a
  preset.
- **Push notifications, sounds as the only signal, alerts to a closed page.**
  The page only reaches someone who has it open.
- **Any sound for interactions or emoji, and a sound toggle** (D27). Not in
  this build; the banner and the reaction carry it (INT-3.16). The rest-over
  sound is unchanged.
- **Mute, block, report.** Only needed with strangers.
- **Anything an interaction or emoji does to anyone's workout.** Nothing in
  this file ends a rest, changes a state, moves a station, touches a logbook
  or changes Dony's schedule, for the target or the sender.
- **Free-text messages (INT-6) and the slap setting (INT-7)**: P1, not
  specified here.

**What this makes harder later**

- **INT-6 (free text to the room), addressee.** Presets are addressed (D8);
  INT-6's free text is not. An addressee is optional in everything the log
  and the bubble show, from the start.
- **INT-6, rate limit.** INT-6 limits free text to one every 2 s; presets get
  the same 2 s now (D6), so the two can share one limit later.
- **INT-6, escaping.** Presets are fixed text, so it would be easy to put
  them on the page as HTML. Preset text and emoji names are always put on the
  page as plain text from day one, so free text later can't be rendered as
  HTML.
- **INT-6, logs.** Presets and emoji are logged by their key; free text
  should be logged by length only, since it is personal.
- **INT-7 (turn slaps off).** It adds a third reason Slap is refused ("they've
  turned slaps off") beside Lifting and Finished (INT-2.4, INT-2.5), so the
  refusal and the menu's disabled Slap must carry more than one reason, and
  the menu's highlight must fall back to Poke when Slap is unavailable.
- **Strangers: Poke at any time** (D4). Between friends a poke mid-set is a
  tap on the shoulder. From someone you don't know it is unwanted attention,
  six times a minute under the 10 s limit. A stranger room would need the MVP
  spec's per-sender cap (10 a minute), mute and block, and probably Poke
  behind a setting like INT-7's.
- **Strangers: emoji are the right shape.** Broadcast from your own avatar,
  from a fixed set, they can't be aimed at one person, and "👋 to the room" is
  exactly the Shy Regular's low-stakes first step. Keeping them unstored (D7)
  means there is no record to report from; that is fine for a fixed, harmless
  set, and would not be for free emoji.
- **Strangers: the room log shows history from before you joined** (D7).
  Fine among friends; in a findable room it means a newcomer reads a
  stranger's past banter. The MVP spec's public rooms would need "since you
  joined".
- **Strangers: Dony with no bot marker** (BOT-5). A Dony who sends emoji and
  replies to a cheer is more convincing as a person. Among friends who all
  watched him hop out of a poster that is the joke; in a room of strangers, a
  regular who turns out to be a bot is a trust problem, and a stranger room
  may need him marked.
- **Sound, later** (D27). Interactions and emoji make no sound in this
  build, because the room page has no sound toggle (only the rest-over beep
  exists). A sound toggle plus a quiet banner blip for the target, as D24
  first proposed, can come later. It needs a designer pass first: where the
  toggle lives on the room page, and how it sits with the rest-over sound.

**Existing behaviour this changes or exposes**

- **Nothing of INT is built yet.** `src/lib/schema.ts` has no interactions
  or messages table ("arrive with the gym"). The room page's avatars do
  nothing for others' avatars beyond focus, and your own avatar moves focus
  to the dock's button (room spec 3.2). That stays (D2).
- **The design system still describes the old rule.** system.md section 9
  (`.menu`) says Poke and Slap are disabled while the target is Lifting, and
  the copy bank's Poke line assumes a rest. The designer updates both from
  these criteria.
- **Two gym quirks decide who can be slapped** (`roomView` in
  `src/lib/presence.ts`, raised in animations.md D6). After a cardio set
  there is no rest (LOG-4), so the person stays **Lifting** and can't be
  slapped. A rest that runs more than 30 minutes past its end stops counting,
  and the person is reported as Lifting (un-slappable) or Idle (slappable),
  depending on their last stored state. Under D5 only the first matters.
- **Every room update today re-reads and re-sends the whole room**
  (`broadcast` in `src/lib/realtime.ts`). At the showcase twelve people can
  send up to twelve emoji a second; sent that way, each would be a full room
  read and a full redraw on twelve screens. The "within a second" promise
  (INT-8.3) depends on emoji travelling as their own small event.
- **Dony's next change** is already looked up by a timer per room that "only
  says when to look again" (`donyTimers` in `src/lib/realtime.ts`), with his
  schedule planned from a seeded sequence in `src/lib/dony.ts`. His emoji
  join that schedule, so the timer must also wake for his next emoji; what he
  sends is still worked out from the database, never kept in memory (BOT-6.6).

**Spec changes this needs** (not made here; the main agent proposes them to
the user): INT-1, INT-2, INT-3, INT-4 and INT-5 reworded; a new INT-8 for
emoji; a new BOT-6 for Dony's emoji; the Risks table's slap line and a new
emoji line; the candidate checks; and the Lifting panel in "Screens".

## Criteria

Each criterion says how it can be checked: **HTTP** (a request against the
running app), **browser** (needs the page's script, Playwright) or
**judged** (a person has to look). Names follow system.md section 13: Mia,
Ji-woo, Tom, Priya. Unless stated, all of them are members of the same open
room, each signed in in their own browser.

### INT-1: the menu

> Selecting another person's avatar (by tap, click or keyboard) opens a
> menu: **Cheer**, **Poke**, **Slap**, **Message**.

**INT-1.1** Given Mia and Ji-woo are in the room, when Mia taps or clicks
Ji-woo's avatar, then a menu opens on Mia's screen naming Ji-woo, showing
her state (colour, icon and word, never colour alone), and offering Cheer,
Poke, Slap and Message, and no emoji (D1). Nothing is sent, and nobody
else's screen changes. *browser*

**INT-1.2** Given Mia is using only a keyboard, when she tabs to Ji-woo's
avatar and presses Enter or Space, then the same menu opens and focus moves
into it; Tab (and the arrow keys) move between its actions; Enter or Space
on an action does it; Escape closes the menu and returns focus to Ji-woo's
avatar. Focus never leaves the menu while it is open, except by closing it.
Both Tab and the arrow keys work inside it, as written (D26). *browser*

**INT-1.3** Given the menu is open, when Mia presses Escape, taps outside the
menu, or does an action, then the menu closes. Taps outside are not
swallowed: if the tap lands on Start set, Done, Save or Choose, the menu
closes **and** the button acts, in the same tap. *browser*

**INT-1.4** Given the menu is open, then it covers no part of Mia's dock, and
her panel's button keeps its place, size and label and can be tapped.
*browser*

**INT-1.5** Given Mia is Lifting, with Done in her dock and (for a timed set)
the stopwatch running, when she opens Ji-woo's menu and sends a Cheer, then
Mia stays Lifting, and her panel is exactly as it was: the same fields and
numbers, the stopwatch still running, Done in the same place. Her next tap on
Done logs the set as it would have without the cheer. *browser*

**INT-1.6** Given the menu on Ji-woo is open on Mia's screen, when Ji-woo's
state changes (for example she taps Start set), then the menu updates in
place within a second: her state, and whether Slap is available (INT-2.13).
It doesn't close. *browser*

**INT-1.7** Given the menu on Ji-woo is open, when Ji-woo leaves the room (or
the room closes), then the menu closes. If Ji-woo left, focus moves to the
next person's avatar in tab order, or to the dock's button if there is
nobody else (room spec I.2, settled with D17), never to the top of the
page. If the room closed, the page does what it does today (goes home and
says so). *browser*

**INT-1.8** Given Mia selects her own avatar, then no menu and no emoji tray
opens; her avatar keeps today's behaviour (focus moves to the dock's button)
(D2). *browser*

**INT-1.9** Given a screen reader, when it reaches Ji-woo's avatar, then it
announces the existing accessible name ("Ji-woo, resting, flat bench 2") and
that the button opens a menu. *browser*

**INT-1.10** Given the squad list below the map (GYM-15), when Mia selects
Ji-woo's row (tap, click or keyboard), then the same menu opens, behaving
exactly as from the avatar. Mia's own row opens nothing (D10). *browser*

**INT-1.11** Given Dony is out of his poster, when Mia selects his avatar or
his squad-list row, then the same menu opens, naming Dony and his state
(D11). *browser*

**INT-1.12** Given Mia opens Ji-woo's menu on a laptop (900 px wide or
more), then the menu sits beside Ji-woo's avatar on the map, clear of her
name tag; opened from her squad row, it sits under the row. Given Mia opens
it on a phone (under 900 px), then it is pinned to the screen, full width
less 16 px each side, its bottom 56 px above the top of Mia's dock, so it
covers neither the dock's button nor the emoji tab, wherever Mia has
scrolled; if it is taller than the space above, it scrolls inside itself
(D17). *browser* (at 390 px and 1280 px: the menu's box and the dock's box,
emoji tab included, never intersect)
### INT-2: what is allowed when

> **Cheer** is always allowed. **Poke** and **Slap** are only allowed when
> the target is Resting or Slacking, never while they are Lifting.
> *(The spec's current wording. The agreed rule, D4 and D5, replaces it:
> Cheer, Poke and every preset go to anyone in any state; Slap is refused
> while the target is Lifting or Finished.)*

**INT-2.1** Given Ji-woo is in any state (Idle, Lifting, Resting, Slacking,
Finished), Away or not, when Mia sends a Cheer, then the server accepts and
stores it, with sender, target, kind, room and the server's time. *HTTP*

**INT-2.2** Given Ji-woo is in any state, Away or not, when Mia sends a Poke,
then the server accepts and stores it (D4). *HTTP* — With strangers: a poke
mid-set from someone you don't know is unwanted attention, not a nudge (see
"What this makes harder later").

**INT-2.3** Given Ji-woo is Idle, Resting or Slacking, Away or not, when Mia
sends a Slap, then the server accepts and stores it (D5). (An Away slacker is
the person the product exists for: their phone is locked, the squad can still
see them.) *HTTP* — With strangers: a slap from someone you've never met
isn't banter; it would need both people's consent, as the MVP spec's slap
setting does.

**INT-2.4** Given Ji-woo is Lifting, when Mia sends a Slap, then the server
refuses it and stores nothing; Mia sees "Ji-woo is mid-set. Cheer instead?"
(copy bank); Ji-woo and everyone else see nothing; the server logs the
refusal with its reason (D5). *HTTP* (refusal) and *browser* (the words)

**INT-2.5** Given Ji-woo is Finished, when Mia sends a Slap, then the server
refuses it and stores nothing, and Mia sees "Ji-woo's done for today. Cheer
instead?" (in the copy bank's voice; to be added to the copy bank) (D5).
*HTTP*

**INT-2.6** Given Mia's menu showed Ji-woo as Resting, when Ji-woo taps Start
set and Mia's Slap reaches the server after that, then the server decides by
Ji-woo's state **when the request arrives**, and refuses as in INT-2.4. What
Mia's screen showed doesn't count. *HTTP*

**INT-2.7** Given Mia is in any state (Idle; Lifting, mid-set; Resting; Rest
up; Slacking; Finished), Away or not, when she sends an interaction or a
preset that INT-2.1 to INT-2.5 allow, then it is accepted: what the sender is
doing never matters. *HTTP*

**INT-2.8** Given Mia, when she sends an interaction or a preset to herself,
then the server refuses it and stores nothing. *HTTP*

**INT-2.9** Given Tom has left the room, or never joined it, when Mia sends
him an interaction or a preset, then the server refuses it, stores nothing,
and Mia sees "Tom's left the gym." The answer is the same whether Tom is in
another room, in no room, or doesn't exist, so it says nothing about him
beyond this room. *HTTP*

**INT-2.10** Given someone who isn't a member of the room, when they send an
interaction, a preset or an emoji to it, then they get the same 404 as for a
room that doesn't exist (ADR 0006), nothing is stored or shown, and the
refusal is logged. Given someone signed out, they are sent to sign in, as the
room page does today, and nothing is stored. *HTTP*

**INT-2.11** Given a request with an unknown interaction kind, a missing or
malformed target, or a room that has closed, then the server refuses it and
stores nothing. *HTTP*

**INT-2.12** Given Ji-woo is Slacking with 45 s over her rest, when Mia
slaps, pokes or cheers her, then Ji-woo's state, rest timer, slacking time,
station and logbook are exactly as they would have been without it. Her
slacking time keeps counting until she taps Start set or Done. The same holds
for Mia's own state and workout. *HTTP*

**INT-2.13** Given the menu is open, then Slap's availability matches the
server's rule for the target's current state: it appears disabled, not
hidden, when it would be refused, with the reason in words (as INT-2.4 and
INT-2.5); tapping it then sends nothing. Cheer, Poke and Message are always
available, except for the limit in INT-4.7. *browser*

**INT-2.14** Given the menu is open on someone Slacking, then Poke and Slap
are the highlighted actions; on someone Lifting, Cheer is; on anyone else
nothing is highlighted (system.md section 9). *browser*

**INT-2.15** Given an action is highlighted (INT-2.14), then it is marked by
a ▶ cursor in front of its label as well as its fill, so the highlight never
rests on colour alone; an unavailable action (INT-2.13, INT-4.7) never shows
the cursor (D17). *browser*

### INT-3: what everyone sees

> An interaction plays an animation on the target's avatar on every screen in
> the room, and shows the target a banner ("Mia slapped you back to work").

**INT-3.1** Given Mia's interaction with Ji-woo is accepted, then within a
second the reaction for that kind (cheer, poke or slap) plays on Ji-woo's
avatar on every open screen in the room, Mia's and Ji-woo's included, with
no reload. *HTTP* (the event arrives on another member's stream within a
second) and *browser* (it plays)

**INT-3.2** Given an interaction to Ji-woo is accepted, then Ji-woo's screen
shows a banner naming the sender and the interaction:
- Cheer: "Mia is hyping you up 🔥" (copy bank);
- Slap: "Mia slapped you back to work 👋" (copy bank);
- Poke: if Ji-woo was Resting or Slacking when it was accepted, "Mia poked
  you. Rest's over? 👉" (copy bank); in any other state, "Mia poked you 👉"
  (to be added to the copy bank) (D4). *browser*

**INT-3.3** Given Ji-woo has the room open in two tabs or on two devices,
then the banner appears on each of them. Nobody except the target ever gets
a banner for an interaction. *browser*

**INT-3.4** Given a banner is showing, then it covers no part of Ji-woo's
dock, doesn't take focus, doesn't move her panel's button, and is announced
once to screen readers. Ji-woo can tap Start set or Done while it shows; if
she is mid-set, nothing about her set changes. *browser*

**INT-3.5** Given a banner is showing, then it goes after 4 s. If another
interaction to Ji-woo arrives while it shows, the newest replaces it and runs
its own 4 s; banners never queue (D9). Every one of them still plays its
reaction. *browser*

**INT-3.6** Given an interaction happened, when a screen opens, reloads or
reconnects afterwards (including after a server restart), then it plays no
old reaction and shows no old banner. *browser*

**INT-3.7** Given Ji-woo is Away (phone locked, page closed), when Mia pokes
her, then the reaction plays on everyone else's screen; Ji-woo gets no
banner then or later. She can find it in the room log when she comes back
(D7). *browser*

**INT-3.8** Given Ji-woo is Lifting on a machine, when a reaction plays on
her, then it is drawn over her machine animation, which keeps playing; her
tag stays where it is (animations.md GYM-15.5), and she goes on being drawn
in her state's place. *browser*

**INT-3.9** Given someone has reduced motion turned on, then the reaction
doesn't move (the designer decides what stands in for it), and the banner
still appears for the target, so the interaction is still perceivable.
*browser*

**INT-3.10** Given Mia taps an action, then the menu closes at once and the
reaction arrives when the server confirms it; Mia's screen never plays a
reaction the server didn't accept. If the request fails (no connection, a
server error), Mia sees "That didn't send. Try again.", and nothing is
stored or played. *browser*

**INT-3.11** Given Dony is out, when Mia cheers, pokes or (if he is Idle,
Resting or Slacking) slaps him, then the reaction plays on his avatar on
every screen; there is no banner (he has no screen); his schedule is
unchanged, so he goes back to lifting exactly when he would have anyway
(D11). He may answer with an emoji (BOT-6.7). *HTTP* (his schedule is
unchanged) and *browser*

**INT-3.12** Given any accepted interaction, then the server log has one line
with the sender's id and display name, the target's id (Dony's own id for
him), the kind and the room; given any refusal, one line with the same and
the reason (target lifting or finished; rate limit; not in room; self;
unknown kind). No line holds a password, token, passcode or full email
(OPS-1, OPS-2). *judged* (read the log by hand, as ADR 0006 does)

**INT-3.13** Given the showcase (several people, nobody lifting), then a slap
reads as playful, not mean, to the person slapped and to the people watching;
a cheer reads as a cheer; a poke reads as "hey", not as a telling-off.
*judged*

**INT-3.14** Given Mia's interaction is refused (target mid-set, done for
today, the 10 s limit, or the target gone), then the reason, in the words of
INT-2.4, INT-2.5, INT-2.9 or INT-4.1, appears as a calm dashed line in the
look of the "Reconnecting…" chip, never in red, for 4 s, announced once
(`role="status"`). It appears where the menu was: on a laptop beside the
target on the map; on a phone just above the dock's top border on the left,
clear of the emoji tab. Given the request fails instead (no connection,
server error), then "That didn't send. Try again." appears in the same place
in the red error style, announced at once (`role="alert"`): red is kept for
that (D21). *browser*

**INT-3.15** Given Ji-woo is the target of an accepted interaction, then on
a laptop her banner appears centred at the top of the map panel; on a phone
it is fixed to the top of the screen, 8 px in, wherever she has scrolled
(for example, down to her set's fields), so it reaches her without
scrolling and is as far from her dock as it can be (D18). *browser* (at
390 px, scrolled to the fields: the banner is inside the viewport and does
not intersect the dock)

**INT-3.16** Given any interaction, preset or emoji reaches any screen in
the room (Ji-woo's banner, a reaction on the map, a bubble, an emoji pop,
hers, anyone's or Dony's), then no sound plays: the banner and the reaction
carry it. The room page gains no sound toggle. The rest-over sound (LOG-5)
is unchanged and still plays when a rest ends (D27, replacing D24's blip).
*browser* (no audio is started for an interaction, preset or emoji)

**INT-3.17** Given a Slap is accepted, then its reaction is a white cartoon
glove swinging in, a yellow "POW" and dizzy stars round the head: never a
red mark, never on the body or over the face. It can't be mistaken for the
👋 Hi emoji (INT-8.24) (D23). *judged*

**INT-3.18** Given an emoji appears inside text (a banner, a preset, a room
log line, for example "Mia poked you 👉"), then it is the phone's own glyph,
as the copy bank writes it. Only the eight sent emoji (in the tray, on the
emoji tab and in pops) are drawn as the gym's pixel art (D25). *browser*

### INT-4: the 10-second limit

> One interaction per sender per target every 10 s.

**INT-4.1** Given Mia's interaction with Ji-woo was accepted, when Mia sends
Ji-woo another interaction of any kind (a Cheer then a Slap counts) less than
10 s later, then the server refuses it, stores nothing and plays nothing; Mia
sees "Easy, give them 10 seconds." (copy bank). *HTTP*

**INT-4.2** The 10 s are counted on the server from the time of Mia's last
**accepted** interaction with Ji-woo. 9.999 s after it is refused; 10.000 s
after it is accepted. Refused attempts don't restart the count. *HTTP*

**INT-4.3** Given Mia just interacted with Ji-woo, when Mia interacts with Tom
straight away, then it is accepted: the limit is per target. Given Mia and
Tom both poke Ji-woo in the same second, then both are accepted: the limit is
per sender. *HTTP*

**INT-4.4** Given Mia sends two interactions to Ji-woo at the same moment
(two tabs, or two requests in flight), then exactly one is accepted and the
other refused, never both. *HTTP*

**INT-4.5** Given Mia double-taps Cheer, then one cheer is sent and Mia sees
no rate-limit message. *browser*

**INT-4.6** Given Mia's last accepted interaction with Ji-woo was 4 s ago,
when the server restarts (or the machine sleeps and wakes), then a new one is
still refused until the 10 s are up: the limit comes from what is stored, not
from memory. *HTTP* (with a restart between requests)

**INT-4.7** Given Mia's interaction with Ji-woo was accepted, when Mia
reopens the menu on Ji-woo within 10 s (or reloads and reopens it), then
Cheer, Poke and Slap show as unavailable with "Easy, give them 10
seconds."; they become available when the 10 s are up, without reopening the
menu. Message stays available, and so does Mia's emoji button (D6).
*browser*

### INT-5: preset messages and the room log

> About 10 preset messages in two groups, hype ("One more rep!") and nudge
> ("Put the phone down"), shown as a speech bubble for 5 s and kept in a room
> message log.

**INT-5.1** Given the menu on Ji-woo is open, when Mia chooses Message, then
she sees the ten presets from the copy bank in two groups: **Hype**: "One
more rep! 💪", "Light weight!", "Let's gooo 🔥", "Lock in 🔒", "That's a W set
🏆"; **Nudge**: "Put the phone down 📵", "Rest's over, mate ⏰", "I can see you
👀", "Bro is scrolling 💀", "Water break or nap? 😴". Choosing one sends it;
there is no confirmation step. *browser*

**INT-5.2** Given a request to send a preset, then the server accepts only
one of the ten, named by the server's own list; anything else (an unknown
preset, free text, an empty message) is refused and nothing is stored.
*HTTP*

**INT-5.3** Given Ji-woo is in any state, Away or not, and Mia is in any
state, when Mia sends any preset, Hype or Nudge, then it is accepted. No
preset is greyed out because of anyone's state (D4). *HTTP* — With strangers:
"Bro is scrolling 💀" from a stranger reads as mockery, not teasing; the Nudge
group may need to be friends-only.

**INT-5.4** Given Mia sends "Put the phone down 📵" from Ji-woo's menu and it
is accepted, then within a second a bubble with that text appears above
**Mia's** avatar on every open screen in the room, and shows that it is
addressed to Ji-woo (how is the designer's call) (D8). *browser*

**INT-5.5** Given a bubble is showing, then it shows for 5 s from when it
reaches each screen, then goes. If Mia sends another preset in that time, her
new bubble replaces the old one and runs its own 5 s. Bubbles from different
people show at the same time. An emoji from Mia never hides her bubble
(INT-8.7). *browser*

**INT-5.6** Given Mia's preset was sent 2 s ago, when Tom's screen opens,
reloads or reconnects, then Tom sees the bubble for the remaining 3 s; a
preset sent 5 s ago or more shows no bubble, only its room-log entry.
*browser*

**INT-5.7** Given a preset is accepted, then it is stored, and an entry
appears in the room log on every open screen in the room within a second:
the sender's name, the addressee's name (D8), the text, and when it was
sent. The entry is still there after a reload, a sign-out and back in, and a
server restart. *HTTP* and *browser*

**INT-5.8** Given a member opens the room, then the room log shows the newest
50 entries from the room's whole current life, including those sent before
they joined, and including interactions as one-line entries ("Mia slapped
Ji-woo", "Tom cheered Priya", "Priya cheered Dony"). Emoji, people's or
Dony's, are never in it (D7). Entries by people who have since left keep
their name, and so do entries about Dony after he has been sent back.
*HTTP* — With strangers: a newcomer would read banter from before they
arrived (see "What this makes harder later").

**INT-5.9** Given nothing has been sent in the room yet, then the room log
shows "Quiet in here. Tap someone on the map to cheer them on 👀" (D22).
*browser*

**INT-5.10** Given Mia's preset was accepted, when she sends another preset
to anyone less than 2 s later, then it is refused and nothing is stored
(2.000 s after is accepted, counted from the last accepted one, on the
server, from what is stored). Presets never count toward INT-4's 10 s limit
or the emoji limit, and neither of those counts toward this one, so Mia can
slap Ji-woo and tell her "Put the phone down 📵" straight away (D6). *HTTP*

**INT-5.11** Given a preset addressed to Ji-woo is accepted, then Ji-woo's
screen reader announces it once ("Mia: Put the phone down"); other people's
presets are not announced, only added to the log. Ji-woo gets no banner for a
preset (banners are for interactions). *browser*

**INT-5.12** Given someone who isn't a member asks for the room log or sends
a preset, then they get the same 404 as for a room that doesn't exist (ADR
0006). *HTTP*

**INT-5.13** Given Mia sends an interaction, a preset or an emoji, then it
counts as activity: Mia is not Away, and the room's last-active time moves on
(ROOM-6). Nothing Dony sends counts as activity (BOT-5). *HTTP*

**INT-5.14** Given any accepted preset, then the server log has one line with
the sender's id and display name, the addressee's id, the preset's key and
the room; refusals are logged with their reason. *judged* (read the log by
hand)

**INT-5.15** Given Dony is out, then Mia can send him a preset like anyone
(D11). He never sends presets or interactions himself, and never answers a
preset; his only output is emoji (BOT-6). *HTTP*

**INT-5.16** Given a preset fails to send (no connection, server error), then
Mia sees "That didn't send. Try again.", and no bubble or log entry appears
anywhere. *browser*

**INT-5.17** Given a room has closed, then its presets and interactions are
kept in the database and shown nowhere: no page, stream or request returns
them (D12). *HTTP* (a closed room's log is a 404 like the room)

**INT-5.18** Given two preset bubbles overlap on the map (at 1×, senders
close together), then the newer one draws on top of the older; neither is
moved or stacked over a name tag. The room log keeps both in full (D19).
*browser*

**INT-5.19** Given Mia's preset bubble shows while she is on the back row
of stations (the row against the mirrors), then the bubble hangs below her,
pointing up at her, rather than above, so it stays on the map. Elsewhere it
sits above her. If she also has an emoji showing, the bubble steps up over
it so both read (INT-8.7) (D20). *browser*

**INT-5.20** Given Mia is in the room, then the room log is its own panel,
titled "Room log", directly after the Squad panel: under the squad list in
the left column on a laptop, after it on a phone. On a phone it is reached
by scrolling, as everything else on the page is: there is no button, drawer
or separate page for it, and nothing is added near the dock (D14). *HTTP*
(the room's first render holds the panel straight after the squad list) and
*browser*

**INT-5.21** Given the room log has entries, then they are newest first; the
five newest show, and the rest of the newest 50 are behind "Show older (n
more)", which unfolds in place. A new entry arrives at the top within a
second, without being announced (D14). *browser*

**INT-5.22** Given an entry was sent by Mia or is about her (to her, or an
interaction on her), then on Mia's screen it has a leaf edge on its left and
calls her "you" ("Ji-woo slapped you", "You cheered Mia"); entries about
others have no edge. The edge is not the only sign: the word "you" says it
too (D14). Mia's own preset reads like anyone else's, with "You" as the
sender: You @Ji-woo "Put the phone down 📵" (D28). A preset sent to her reads
Ji-woo @you "Put the phone down 📵". *browser*

**INT-5.23** Given Mia joined the room after some entries were sent, then a
dashed line reading "You walked in · <time>" (for example "You walked in ·
6:12 pm", the time she joined) separates the entries from before she joined
(below it) from those after (above it). It shows only when there are entries
on both sides of it (D14). *browser*

### INT-8 (proposed for the spec): emoji

> *Proposed wording:* From a button beside your dock, in every state
> including mid-set, send one of eight fixed emoji in at most two taps. It
> pops above your own avatar on every screen in the room for 3 s. One a
> second per person. Never covers or moves Start set or Done. Not stored,
> not in the room log.

**INT-8.1** Given Mia is in the room with her panel in any state (Idle with
Choose; Lifting with Done, stopwatch running or not; Resting, Rest up or
Slacking with Start set; editing a set with Save; a set being saved, its
button pending), then the emoji tab is on her dock (INT-8.20), and she can send
an emoji without leaving that state in two taps: the button, then an emoji
(D2). *browser*

**INT-8.2** Given Mia opens the emoji tray, then it offers exactly the eight
emoji of D3 (👋 Hi, 💪 Flex, 🔥 Fire, 👏 Clap, 😂 Haha, 💀 Dead, 👀 Eyes, ❤️ Love),
drawn as pixel art, each with its word shown or announced with it. Choosing
one sends it, with no confirmation step, and the tray closes. *browser*

**INT-8.3** Given Mia's emoji is accepted, then within a second it pops above
**Mia's own** avatar on every open screen in the room, hers included,
wherever her avatar is (on a machine, at the cooler, by the lockers,
walking). It is addressed to nobody, and nobody gets a banner for it. It
shows for 3 s from when it reaches each screen, then goes (D1). *browser* —
With strangers: broadcast from a fixed set, it can't be aimed at one person;
this is the safest interaction in the file.

**INT-8.4** Given Mia's dock shows Done (or Start set, Save or Choose), then
the emoji button, opening the tray, choosing an emoji, and the emoji
appearing never move, cover, resize or disable that button. A tap on the
dock's button while the tray is open closes the tray **and** does the
button's job in the same tap. A tap on an emoji or the emoji button never
logs a set, starts a set or saves an edit. *browser*

**INT-8.5** Given Mia is Lifting, Resting or Slacking, when she sends an
emoji, then her state, set fields, stopwatch, rest timer, slacking time,
station and logbook are exactly as they would have been without it. In
particular, a Slacking Mia who sends an emoji is still Slacking: only Start
set or Done end a rest. *HTTP*

**INT-8.6** Given Mia's map is off her screen (on a phone, scrolled down to
her set's fields), when her emoji is accepted, then she can still tell it was
sent, near where she tapped: the emoji tab shows it (INT-8.22). It never
covers the dock's button and never hides or replaces the "Set 2 logged"
stamp after a Done (D15). *browser*

**INT-8.7** Given Mia's emoji is showing, when she sends another, then the
new one replaces the old and runs its own 3 s. An emoji never hides a preset
bubble that is still showing above the same person: both are visible at once
(how is the designer's call). Emoji from different people show at the same
time, each above its own sender. *browser*

**INT-8.8** Given Mia's emoji was accepted, when she sends another less than
1 s later, from any tab or device, then the server refuses it and nothing
shows anywhere. 0.999 s after the last accepted one is refused; 1.000 s after
is accepted; refused attempts don't restart the count. Mia sees no message
for this refusal; the tray may simply show as unavailable for the rest of
the second. Two emoji sent at the same moment from two tabs: exactly one is
accepted (D6). *HTTP* and *browser*

**INT-8.9** Given a request to send an emoji, then the server accepts only
one of the eight, named by the server's own list; anything else (another
emoji, text, an empty value) is refused, and nothing shows. *HTTP*

**INT-8.10** Given an emoji was accepted, then it is not stored and never
appears in the room log. A screen that opens, reloads or reconnects after it
was sent never shows it, even within its 3 s; someone who was Away (phone
locked) never sees it later (D7). *HTTP* (the room log and the first render
hold no emoji) and *browser*

**INT-8.11** Given someone signed out, a non-member, or a request to a closed
room, then sending an emoji is refused as in INT-2.10 and INT-2.11, and
nothing shows. *HTTP*

**INT-8.12** Given Mia uses only a keyboard, then she can reach the emoji
button by Tab with a visible focus ring, open the tray, move between emoji,
send one with Enter or Space, and close the tray with Escape, which returns
focus to the button. Every emoji has its word as its accessible name.
*browser*

**INT-8.13** Given Mia uses a screen reader, when her emoji is accepted, then
it is announced to her once ("Sent: fire"). Other people's emoji, and Dony's,
are not announced, and the squad list doesn't change for them (system 12:
others' changes are quiet). *browser*

**INT-8.14** Given someone has reduced motion turned on, then on their screen
an emoji appears and disappears without moving. *browser*

**INT-8.15** Given Mia's emoji is showing, when she leaves the room, then it
goes with her avatar. *browser*

**INT-8.16** Given an emoji fails to send (no connection, server error), then
nothing appears anywhere, and Mia sees "That didn't send. Try again." in the
red error style just above the dock, to the left of the emoji tab, for 4 s,
never over her dock's button and never as a dialog (D21). *browser*

**INT-8.17** Given any accepted emoji, then the server log has one line with
the sender's id and display name, the emoji's key and the room; given a
refusal, one line with the reason (rate limit, unknown emoji, not a member,
closed room). *judged* (read the log by hand)

**INT-8.18** Given a room of twelve on phones and laptops, nobody lifting,
everyone sending emoji as fast as they're allowed for a minute, with Dony out,
then every avatar can still be told apart by its tag, a phone at 1× stays
responsive, and Start set and Done respond as quickly as in an empty room.
*judged* (at the showcase rehearsal) and *browser* (the dock is never
covered)

**INT-8.19** Given the eight pixel emoji, then they read as something a Gen Z
squad would actually send, none of them mocks a body, weight or ability
(banter, not shame), and the 👋 Hi reads as a wave, not as the slap. *judged*

**INT-8.20** Given Mia's panel is in any state (Choose, Done, Start set,
Save, or pending), then the emoji tab is a 52 × 48 px tab rising out of the
dock's top border on the right. It takes no width from the dock's button:
the button has the same width, height and position as it would without the
tab (D16). *browser* (the button's box at 390 px and 1280 px, in each panel
state, matches a dock without the tab, and the two never intersect)

**INT-8.21** Given Mia opens the emoji tray, then it opens above the tab,
right-aligned, with its bottom 48 px above the dock's top, so the gap
between the lowest emoji and the dock's button is never less than 48 px. It
is a grid of four by two buttons, each 64 × 64 px, in the order Hi, Flex,
Fire, Clap, then Haha, Dead, Eyes, Love, each with its word under it, and it
fits inside a 360 px wide screen (D16). *browser*

**INT-8.22** Given Mia's emoji has just been sent, then for the 1 s in which
she can't send another (INT-8.8), the emoji tab shows the emoji she sent in
place of its usual icon, is unavailable (`aria-disabled`), and is named "Send
an emoji (sent: fire)" (for Fire); while the request is still on its way it
shows the same at half strength. After the second it returns to its icon.
No "Sent" stamp appears, and the "Set 2 logged" stamp is never touched
(D15). *browser*

**INT-8.23** Given anyone's emoji pops on the map, then it is drawn in a
layer under every avatar, so it never covers anyone's name tag or sprite,
however many show at once. It is 32 × 32 px on screen at every map scale,
centred 4 px above its sender's tag; for a sender on the back row of
stations it sits beside the tag instead, on the side away from the nearer
wall. Dony's are placed the same way (D20). *browser* (in a room of twelve
plus Dony, no pop's box covers any tag's box)

**INT-8.24** Given the eight emoji, then ❤️ Love is pink and 🔥 Fire is
orange: no emoji uses the red that means Slacking or an error. 👋 Hi is a
yellow open palm, fingers spread, with wave arcs either side, unlike the
Slap reaction's white glove in colour, shape and motion (INT-3.17) (D23).
*judged* (the art sheet)

### BOT-6 (proposed for the spec): Dony's emoji

> *Proposed wording:* While he's out, Dony sends one of the same eight emoji
> now and then, fitting what he's doing, and sometimes in reply to an
> interaction aimed at him. It pops above his avatar exactly as a person's
> does. What he sends, and when, is worked out from the room, his summon time
> and the interactions stored for him, never from a timer in memory.

Unless stated, Dony is out of his poster and Mia, Tom and Priya are in the
room. Every number below was decided by recommendation (D13) and can be
overruled.

**BOT-6.1** Given Dony sends an emoji, then it is one of the eight in D3, and
on every open screen in the room it pops above his avatar exactly as a
person's does (INT-8.3, INT-8.7, INT-8.14, INT-8.15): the same pixel picture,
the same place, 3 s, no banner for anyone, nothing marking it as a bot's
(BOT-5). It is not stored and never appears in the room log (INT-8.10).
*browser*

**BOT-6.2** Given Mia summons Dony, when he lands on the walkway from his
poster, then within his 3 s warm-up he sends 👋 Hi, on every screen. This is
the first emoji of every visit, a fresh one each summon. *browser*

**BOT-6.3** Given Dony has been out for a while, then he also sends emoji on
his own: on average about one every 2 minutes over a visit, never two of
these within 60 s of each other, and never more than one in any single set,
rest or spell by the lockers. Over a 10-minute visit that is about five, plus
the 👋 on landing. *browser* (over a long visit, against a stubbed clock if
the test harness has one) and *judged* (at the rehearsal: people notice him
emote within their first few minutes, and nobody calls it spam)

**BOT-6.4** Given Dony sends an emoji on his own, then it fits the state he
is in at that moment:
- Idle (by the lockers, after the warm-up): 👋 Hi or 😂 Haha;
- Lifting: 💪 Flex or 🔥 Fire;
- Resting: 👏 Clap, 😂 Haha or ❤️ Love;
- Slacking: 💀 Dead or 👀 Eyes.

If his state changes while it is showing (a rest turns Slacking, he walks to
his station), the emoji stays its 3 s, as a person's would. *browser* and
*judged* (it reads as Dony being in on the joke)

**BOT-6.5** Given the same room and the same summon time, then every screen,
a page opened later in the visit, and the server after a restart all agree on
when Dony's own emoji fall and which emoji each is: they are part of his
schedule (BOT-3), planned from the room and the summon time, like his lifts.
*HTTP* (two members' streams carry the same Dony emoji at the same server
time, one opened before a restart and one after)

**BOT-6.6** Given the server restarts, or the machine sleeps and wakes, while
Dony is out, then his emoji after that come at the times his schedule says,
as if nothing had happened; one whose time fell while nobody's stream was
open is simply missed, never sent late, and none is sent twice. A screen that
opens, reloads or reconnects while one of his emoji is showing doesn't show
it (as INT-8.10 for people). *HTTP* (with a restart) and *browser*

**BOT-6.7** Given Mia cheers, pokes or slaps Dony and it is accepted, then
about a second after his reaction plays, Dony answers with an emoji, on every
screen:
- a Cheer: ❤️ Love or 💪 Flex;
- a Poke: 👀 Eyes;
- a Slap: 😂 Haha or 💀 Dead.

Which one is worked out from the stored interaction, so every screen shows
the same. The answer changes nothing else: his schedule, state and station
are as they would have been (INT-3.11). He never answers a preset. *browser*
and *HTTP* (his answer arrives on another member's stream, and his schedule
is unchanged)

**BOT-6.8** Given Dony answered an interaction less than 10 s ago, when Tom
also cheers him, then Tom's cheer is accepted and its reaction plays, but
Dony doesn't answer it: he answers at most once every 10 s, counted from his
last answer, worked out from the interactions stored for him. So twelve
people cheering him at once get one answer between them, not twelve. *HTTP*

**BOT-6.9** Given any two of Dony's emoji, of either kind (his own or an
answer), then they are at least 1 s apart, his INT-8.8 limit: if an answer
would fall within a second of one of his own, only one of them shows. Each new
one replaces the one showing, as a person's does. *browser*

**BOT-6.10** Given Mia sends Dony back mid-pop, then his emoji goes with his
avatar, and he sends nothing more until the next summon, which starts again
at BOT-6.2. While he is in his poster he sends nothing, and interactions
can't reach him (he has no avatar to select). *browser*

**BOT-6.11** Given Dony sends an emoji, then it doesn't count as room
activity (BOT-5, ROOM-6), isn't announced to screen readers (INT-8.13), and
doesn't change his squad-list row. The server writes no log line for it, as
for his other scheduled moves; an interaction aimed at him is logged as in
INT-3.12. *HTTP* (the room's last-active time doesn't move)

**BOT-6.12** Given a room has never had Dony out, or he has been sent back,
then the room behaves exactly as without BOT-6: no emoji from him, and
nothing in any page or stream about his emoji. *HTTP*

## Open questions

None. All twelve were settled on 22 Oct 2026, and the designer's proposals
for the room page (D14 to D26) the same day; see Decisions. The numbers in
BOT-6 were decided by recommendation (D13) and can be overruled.

## Decisions

All dated **22 Oct 2026**, from the user, relayed by the main agent. D1 to
D10 and D12 accept the recommended answer; D11 accepts it and adds Dony
sending emoji; D13 records what the main agent asked this file to decide by
recommendation. D14 to D26 were settled by the user from the room page
designer's proposal (`docs/design/room/spec.md`, "Interactions, Oct 22",
I.1 to I.15): "follow the designer". D27 and D28 were settled by the user
on questions raised by qa in round one. The criteria above are written to
match.

| # | Question | Decision | Why | Criteria |
| --- | --- | --- | --- | --- |
| D1 (Q1) | Do emoji go to the room or to a chosen person? | To the room: an emoji pops above the sender's own avatar, addressed to nobody, sent from the sender's own panel. Not in anyone's menu. | Fastest mid-set (two taps at the dock, no aiming at a small avatar), works alone, and is the safest shape for strangers later. Cheer and Hype presets already say "this one's for you". | INT-1.1, INT-8.3 |
| D2 (Q2) | Where does the emoji control live? | One emoji button beside the dock, in every panel state, opening a small tray; choosing an emoji sends it and closes the tray. Your own avatar keeps today's jump to the dock. Exact placement is the designer's. | Thumb reach in every state at two taps; closed, it takes one button's room, so Done keeps its size and place. An always-open row beside Done risks logging by accident; your own avatar is too small a target at 1×. | INT-1.8, INT-8.1, INT-8.4, INT-8.6, INT-8.12 |
| D3 (Q3) | Which emoji, and how many? | Eight, fixed, drawn as pixel art in the gym's style, each with a word: 👋 Hi, 💪 Flex, 🔥 Fire, 👏 Clap, 😂 Haha, 💀 Dead, 👀 Eyes, ❤️ Love. Fallback if the drawing doesn't fit the week: the same eight as phone emoji, nothing else changes. | Covers hello, effort, praise, laughing and teasing in one small tray; nothing mocks a body. Pixel art keeps the map hand-made (system principle 5). | INT-8.2, INT-8.9, INT-8.19, BOT-6.1 |
| D4 (Q4) | Can Cheer, Poke and every preset go to anyone, in any state? | Yes, all of them. Poke's banner reads "Mia poked you 👉" outside a rest. | The user's direction: interaction is an any-time layer, not a reply to slacking. The 10 s limit stops pokes becoming a drumroll. One rule is easier to learn than one per action. | INT-2.2, INT-3.2, INT-5.3 |
| D5 (Q5) | Does Slap stay, and does it depend on state? | Slap stays. Refused only while the target is Lifting or Finished; Idle, Resting and Slacking can be slapped. Settles the spec's open question "keep the slap" for this build. | Never punish the effort of someone mid-set, never nag someone who's done; Idle gives the showcase its best moment. INT-7 is the answer if slapping a newcomer lands badly. | INT-2.3, INT-2.4, INT-2.5, INT-2.13, INT-3.11, INT-3.13 |
| D6 (Q6) | What are the limits? | Three separate ones: interactions 1 per sender per target every 10 s (any kind counts); presets 1 per sender every 2 s; emoji 1 per sender every 1 s. | Each fits what it protects; a slap then "Put the phone down" is never refused; 1 s keeps a room of twelve readable. | INT-4.7, INT-5.10, INT-8.8, BOT-6.9 |
| D7 (Q7) | What goes in the room log? | Presets and interactions, not emoji; the newest 50 from the room's whole current life, including before you joined. Emoji are not stored at all. | A banner only reaches an open page, so the log is how a locked phone finds out. Emoji at one a second would push everything else out, and they are ambient. | INT-3.7, INT-5.8, INT-8.10, BOT-6.1 |
| D8 (Q8) | Is a preset addressed or said to the room? | Addressed: the bubble and the log name the addressee. The addressee stays optional in what's shown, for INT-6. | "Put the phone down" works only when aimed; talking to the room is the emoji's job. | INT-5.4, INT-5.7 |
| D9 (Q9) | Several banners within 4 s? | The newest replaces the current one; no queue. | With pokes open to everyone, a queue could run for a minute. Every reaction still plays and every interaction is logged. | INT-3.5 |
| D10 (Q10) | Does a squad-list row open the menu? | Yes, the same menu as the avatar; your own row opens nothing. | Avatars at the cooler are hard to hit with a thumb at 1×; the list is the accessible mirror. | INT-1.10 |
| D11 (Q11) | Can Dony be a target? **Changed from the recommendation.** | Yes: all interactions and presets, under the same rules by his state, no banner, his schedule unchanged. **And Dony also sends emoji himself from time to time** (user: "let Dony also send emoji from time to time"). He still never sends interactions or presets. | He is the one who really rests and slacks at the showcase. Emoji make him feel present without touching anyone's workout, and fit BOT-5's "like a person". | INT-1.11, INT-3.11, INT-5.15, BOT-6.1 to BOT-6.12 |
| D12 (Q12) | Kept after a room closes? | Presets and interactions are kept in the database and shown nowhere. | Nothing changes for anyone now; room history stays possible later. Nothing personal is kept. | INT-5.17 |
| D13 | How Dony's emoji behave (decided by recommendation when D11 was given; **can be overruled**) | 👋 Hi on landing each visit; then on his own about one every 2 minutes, never two within 60 s, at most one per set, rest or spell by the lockers, chosen to fit his state; an answer about a second after an accepted Cheer, Poke or Slap aimed at him, at most one answer every 10 s, never to presets; all worked out from the room, his summon time and stored interactions. | The landing wave makes him noticed in any demo's first minute; one every 2 minutes is about five in a 10-minute showcase, noticeable but never a flood beside twelve people's emoji. Fitting his state makes him read as in on the joke (💀 while slacking). Answering gives the showcase a reason to cheer him, and the 10 s cap keeps twelve cheers to one answer. Planning it like his lifts keeps GYM-12 and BOT-3 true. | BOT-6.2 to BOT-6.9 |
| D14 | Where the room log lives, and how it marks you and your arrival (designer, I.9, I.15 Q1) | Settled by the user from the designer's proposal. Its own panel, "Room log", directly under the squad list; on a phone reached by scrolling, with no button or drawer. Newest first, five showing, the rest behind "Show older (n more)". Lines about you have a leaf edge and say "you". A dashed "You walked in · <time>" line separates entries from before you joined, shown only with entries on both sides. | Nothing new near the dock (system principle 1); the page already works by scrolling; the "You walked in" line gives "since you joined" a place to go if strangers come. | INT-5.20, INT-5.21, INT-5.22, INT-5.23 |
| D15 | How you know an emoji went with the map scrolled away (designer, I.7, I.15 Q2) | Settled by the user from the designer's proposal. For the 1 s cooldown the emoji tab shows the emoji you just sent, unavailable, instead of a "Sent" stamp. | A second stamp on the dock would compete with "Set 2 logged"; the tab is where the thumb already is. | INT-8.6, INT-8.22 |
| D16 | Where the emoji control sits (designer, I.7) | Settled by the user from the designer's proposal. A 52 × 48 px tab rising from the dock's top border on the right, taking no width from Done, Start set, Save or Choose. The tray opens above it, its bottom 48 px above the dock's top: a 4 × 2 grid of 64 × 64 px emoji with their words. | Two taps at the thumb, and the main button never changes size or place (README principle 3). | INT-8.1, INT-8.20, INT-8.21 |
| D17 | Where the menu sits, and how the highlight shows (designer, I.2) | Settled by the user from the designer's proposal. Laptop: beside the avatar (under the row, from the squad list). Phone: pinned, its bottom 56 px above the dock, never covering it or the emoji tab. A ▶ cursor marks the highlighted moves. If the target leaves, focus goes to the next person's avatar, else the dock's button. | In the thumb zone on a phone, next to the person on a laptop; the cursor keeps the highlight from resting on colour alone. | INT-1.7, INT-1.12, INT-2.15 |
| D18 | Where the banner sits on a phone (designer, I.5) | Settled by the user from the designer's proposal. Fixed to the top of the screen, 8 px in, wherever you've scrolled; on a laptop, centred at the top of the map panel. | The map is usually scrolled away when you're at your fields; the top of the screen is furthest from the dock. | INT-3.15 |
| D19 | Overlapping preset bubbles (designer, I.6, I.15 Q3) | Settled by the user from the designer's proposal. The newer draws on top; the room log keeps both in full. | Stacking would cover tags; the log is the full record. | INT-5.18 |
| D20 | Where pops and bubbles go, especially on the back row (designer, I.6, I.8) | Settled by the user from the designer's proposal. Emoji pops sit in a layer under every avatar, 32 × 32 px, 4 px above the tag, never covering a tag. On the back row the pop sits beside the tag and a preset bubble hangs below the person. | Tags carry who and what state, so they always win, even with twelve emoji at once; the back row has no room above at 1×. | INT-5.19, INT-8.23 |
| D21 | How a refusal and a failure look (designer, I.3, I.7) | Settled by the user from the designer's proposal. A refusal is a calm dashed line in the "Reconnecting…" chip's look, for 4 s, where the menu was (beside the target on a laptop, above the dock on a phone). Red is kept for "That didn't send. Try again." | A refusal is news, not a failure; red means Slacking or an error (system.md section 5). | INT-3.14, INT-8.16 |
| D22 | The empty room log's line (designer, I.9, I.15 Q4) | Settled by the user from the designer's proposal: "Quiet in here. Tap someone on the map to cheer them on 👀". | In the copy bank's voice, and it points at the one action. | INT-5.9 |
| D23 | Emoji colours, the slap and Hi (designer, I.4, I.13) | Settled by the user from the designer's proposal. Heart pink, fire orange (red means Slacking or an error). The Slap reaction is a white glove with a POW and dizzy stars; Hi is a yellow open palm with wave arcs. | Keeps red's one meaning; slapstick, never a mark; Hi and the slap can't be confused. | INT-3.17, INT-8.24 |
| D24 | Sound (designer, I.15 Q5) | Settled by the user from the designer's proposal: a quiet blip for a banner, on the target's screens only, no sound for emoji, both behind the gym's sound toggle. **Revised by D27 the same day: no sound for interactions or emoji in this build, and no toggle.** The blip and toggle wait for a later designer pass. | Twelve people's emoji would be noise. The blip assumed a sound toggle the room page doesn't have. | INT-3.16 (as revised by D27) |
| D25 | Emoji inside text (designer, I.14 Departure 4) | Settled by the user from the designer's proposal. The copy bank's emoji in banners, presets and the log (like 👉) stay the phone's glyphs; only the eight sent emoji are pixel art. | Pixel emoji can't sit inside VT323 text at its size; the eight are the ones that are "sent". | INT-3.18 |
| D26 | Tab as well as the arrow keys in the menu (designer, I.14 Departure 7) | Settled by the user from the designer's proposal. INT-1.2 stands as written: Tab, Shift+Tab and the arrow keys all move inside the menu. | Keyboard users who don't know menu arrow keys still get round. | INT-1.2 |
| D27 | Sound for interactions and emoji (raised by qa, round one) | Settled by the user. Sound is out of this build: interactions, presets and emoji make no sound, and the room page gets no sound toggle. The banner and the reaction carry it. The rest-over sound is unchanged. A toggle plus a banner blip can come later, after a designer pass. Revises D24. | The room page has no sound toggle (only the rest-over beep exists), so D24's blip had no switch behind it; building one is a page change for the designer. | INT-3.16 |
| D28 | How your own preset reads in the room log (raised by qa, round one) | Settled by the user. Like anyone else's, with "You" as the sender: You @Ji-woo "Put the phone down 📵". | One line shape for every preset; "you" already marks lines about you (D14). | INT-5.22 |
