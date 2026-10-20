# Acceptance criteria: Interactions and messages

- **Area**: Interactions and messages (`docs/product/spec-4-weeks.md`)
- **Requirements covered**: INT-1, INT-2, INT-3, INT-4, INT-5 (all P0)
- **Status**: draft
- **Date**: 18 Oct 2026

## Terms

Used with these meanings throughout.

- **Sender**: the person who acts. **Target**: the person whose avatar was
  selected.
- **Interaction**: a Cheer, a Poke or a Slap.
- **Message**: one of the preset lines in INT-5. There is no free text in
  this file (INT-6 is P1).
- **Menu**: what opens when you select someone else's avatar (INT-1).
- **Reaction**: the short animation an interaction plays on the target's
  avatar (system.md section 11: under 1 s).
- **Banner**: the line the target gets when someone interacts with them
  (INT-3; system.md section 9: 4 s, `role="status"`).
- **Bubble**: the speech bubble a message shows above its sender's avatar.
- **Room log**: the list of messages (and, if Q5 says so, interactions) that
  INT-5 keeps for the room.
- **State**: what the server reports for a person at that moment: Idle,
  Lifting, Resting, Slacking or Finished (GYM-9). **Away** is a separate flag
  on top of a state (GYM-14): "Resting, Away" is a Resting person whose page
  hasn't been in touch for 60 s.
- **Within a second**: as GYM-13, the change reaches every other open screen
  in the room within about a second, with no reload.

## Scope

**In**

- The menu on another person's avatar, reachable by tap, click and keyboard
  (INT-1).
- Which interactions are allowed for which target states, decided on the
  server (INT-2, ADR 0006).
- The reaction on every screen and the banner for the target (INT-3).
- The 10-second limit per sender per target (INT-4).
- About ten preset messages in two groups, the bubble, and the room log
  (INT-5), using the copy bank's presets in `docs/design/system.md` section 3.
- What every refusal looks like to the sender and what the server log
  records (OPS-1, OPS-2).

**Out, with the reason**

- **The sender's avatar walking over to the target** (the MVP spec does
  this). The sender would leave their station mid-workout, and the walk
  would put an animation between them and Start set. The sender's avatar
  stays where it is; only the target reacts.
- **High-five** (MVP spec). Not in the four-week spec; Cheer covers praise.
- **Push notifications, sounds as the only signal, alerts to a closed
  page.** No push in the setup; the page only reaches someone who has it
  open. Whether a reaction or banner also plays a sound is the designer's
  call within system.md section 11, as long as the sound never carries
  meaning on its own.
- **Mute, block, report.** Only needed with strangers.
- **Anything an interaction does to the target's workout.** A slap never
  ends a rest, changes a state, moves a station or touches a logbook.
- **Free-text messages (INT-6) and the slap setting (INT-7)**: P1, not
  specified here. What the decisions below would make harder for them:
  - **INT-6, addressee.** INT-6 sends free text *to the room*. If P0 makes
    every message addressed to one person (Q2), the room log and the bubble
    must still allow a message with no addressee, or INT-6 needs a second
    kind of entry. Recommended: an addressee is optional in everything the
    log and bubble show, from the start.
  - **INT-6, rate limit.** INT-6 limits free text to one every 2 s. If P0
    presets share INT-4's 10 s limit (Q3), the two kinds of message end up
    with different limits. Recommended: presets get one message every 2 s
    now, so INT-6 can share the same limit later.
  - **INT-6, escaping.** Presets are fixed text, so it would be easy to build
    the bubble and the log in a way that inserts text as HTML. Free text
    later must never be rendered as HTML. Recommended: message text is always
    put on the page as plain text, presets included, from day one.
  - **INT-6, logs.** OPS-2 forbids passwords, tokens and emails in the logs,
    not message text, but free text is personal. Presets can be logged by
    their key; free text should be logged by length only.
  - **INT-7, a third reason Slap is unavailable.** The menu shows a disabled
    Slap with its reason (INT-2.12), and the server's refusal names a reason
    (INT-2.3). INT-7 adds "they've turned slaps off" as one more reason, so
    both must be built to carry more than one reason rather than the single
    "mid-set" case. The menu's "fitting action" highlight (Slap for a
    slacker) must fall back to Poke when Slap is unavailable.
  - **INT-7, the past.** Slaps already sent stay in the room log (if Q5 puts
    them there) after someone turns slaps off.

**Existing behaviour this exposes.** INT-2 trusts the state the server
already reports (`roomView` in `src/lib/presence.ts`), so two quirks there
now decide who can be poked:

- After a cardio set there is no rest (LOG-4), so the person stays
  **Lifting** until they choose another lift, and can't be poked or slapped.
- A rest that has run more than 30 minutes past its end stops counting as a
  rest, and the person is reported as **Lifting** again (or Idle). So
  someone who has been Slacking for half an hour becomes un-slappable,
  exactly when a slap is most deserved. This belongs to the gym area, not
  here, but the build should know it, and the user may want it fixed first.

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
Poke, Slap and Message. Nothing is sent, and nobody else's screen changes.
*browser*

**INT-1.2** Given Mia is using only a keyboard, when she tabs to Ji-woo's
avatar and presses Enter or Space, then the same menu opens and focus moves
into it; Tab (and the arrow keys) move between its actions; Enter or Space
on an action does it; Escape closes the menu and returns focus to Ji-woo's
avatar. Focus never leaves the menu while it is open, except by closing it.
*browser*

**INT-1.3** Given the menu is open, when Mia presses Escape, taps outside
the menu, or does an action, then the menu closes. Taps outside are not
swallowed: if the tap lands on Start set or Done, the menu closes **and**
the button acts, in the same tap. *browser*

**INT-1.4** Given the menu is open, when Mia looks at her own bottom panel,
then the menu covers none of it, and Start set and Done keep their place
and can be tapped. *browser*

**INT-1.5** Given the menu on Ji-woo is open on Mia's screen, when Ji-woo's
state changes (for example she taps Start set), then the menu updates in
place within a second: her state, and which actions are available
(INT-2.12). It doesn't close. *browser*

**INT-1.6** Given the menu on Ji-woo is open, when Ji-woo leaves the room
(or the room closes), then the menu closes. If Ji-woo left, focus moves to
a sensible place on the map (the designer picks it), never to the top of
the page. If the room closed, the page does what it does today (goes home
and says so). *browser*

**INT-1.7** Given Mia selects her own avatar, then no menu opens; her
avatar keeps today's behaviour (focus moves to the dock's button). *browser*

**INT-1.8** Given a screen reader, when it reaches Ji-woo's avatar, then it
announces the existing accessible name ("Ji-woo, resting, flat bench 2")
and that the button opens a menu. *browser*

**INT-1.9** *(rests on Q8)* Given the squad list below the map (GYM-15),
when Mia selects Ji-woo's row (tap, click or keyboard), then the same menu
opens, behaving exactly as from the avatar. Mia's own row opens nothing.
*browser*

**INT-1.10** *(rests on Q4)* Given Dony is out of his poster, when Mia
selects his avatar or his squad-list row, then the same menu opens, naming
Dony and his state. *browser*

### INT-2: what is allowed when

> **Cheer** is always allowed. **Poke** and **Slap** are only allowed when
> the target is Resting or Slacking, never while they are Lifting.

**INT-2.1** Given Ji-woo is in any state (Idle, Lifting, Resting, Slacking,
Finished), Away or not, when Mia sends a Cheer, then the server accepts and
stores it, with sender, target, kind, room and the server's time. *HTTP*

**INT-2.2** Given Ji-woo is Resting or Slacking, Away or not, when Mia sends
a Poke or a Slap, then the server accepts and stores it. (An Away slacker
is the person the product exists for: their phone is locked, the squad can
still see them.) *HTTP*

**INT-2.3** Given Ji-woo is Lifting, when Mia sends a Poke or a Slap, then
the server refuses it and stores nothing; Mia sees "Ji-woo is mid-set.
Cheer instead?" (copy bank); Ji-woo and everyone else see nothing; the
server logs the refusal with its reason. *HTTP* (refusal) and *browser*
(the words)

**INT-2.4** *(rests on Q1)* Given Ji-woo is Idle or Finished, when Mia sends
a Poke or a Slap, then the server refuses it and stores nothing, and Mia
sees why: for Idle, "Ji-woo hasn't started yet. Cheer instead?"; for
Finished, "Ji-woo's done for today. Cheer instead?" (proposed copy, in the
copy bank's voice). *HTTP*

**INT-2.5** Given Mia's menu showed Ji-woo as Resting, when Ji-woo taps
Start set and Mia's Slap reaches the server after that, then the server
decides by Ji-woo's state **when the request arrives**, so it refuses as in
INT-2.3. What Mia's screen showed doesn't count. *HTTP*

**INT-2.6** Given Mia, when she sends any interaction to herself, then the
server refuses it and stores nothing. *HTTP*

**INT-2.7** Given Tom has left the room, or never joined it, when Mia sends
him anything, then the server refuses it, stores nothing, and Mia sees
"Tom's left the gym." (proposed copy). The answer is the same whether Tom
is in another room, in no room, or doesn't exist, so it says nothing about
him beyond this room. *HTTP*

**INT-2.8** Given someone who isn't a member of the room, when they send an
interaction or a message to it, then they get the same 404 as for a room
that doesn't exist (ADR 0006), nothing is stored, and the refusal is
logged. Given someone signed out, they are sent to sign in, as the room
page does today, and nothing is stored. *HTTP*

**INT-2.9** Given a request with an unknown interaction kind, a missing or
malformed target, or a room that has closed, then the server refuses it and
stores nothing. *HTTP*

**INT-2.10** Given Mia is in any state, Finished included, when she sends an
interaction that INT-2.1 to INT-2.4 allow, then it is accepted: what the
sender is doing never matters. *HTTP*

**INT-2.11** Given Ji-woo is Slacking with 45 s over her rest, when Mia
slaps her, then Ji-woo's state, rest timer, slacking time, station and
logbook are exactly as they would have been without the slap. Her
slacking time keeps counting until she taps Start set or Done. *HTTP*

**INT-2.12** Given the menu is open, then each action's availability matches
the server's rule for the target's current state: Poke and Slap appear
disabled, not hidden, when they would be refused, with the reason in words
(as INT-2.3 and INT-2.4); tapping a disabled action sends nothing. *browser*

**INT-2.13** Given the menu is open on someone Slacking, then Poke and Slap
are the highlighted actions; on someone Lifting, Cheer is (system.md
section 9). *browser*

### INT-3: what everyone sees

> An interaction plays an animation on the target's avatar on every screen
> in the room, and shows the target a banner ("Mia slapped you back to
> work").

**INT-3.1** Given Mia's interaction with Ji-woo is accepted, then within a
second the reaction for that kind (cheer, poke or slap) plays on Ji-woo's
avatar on every open screen in the room, Mia's and Ji-woo's included, with
no reload. *HTTP* (the event arrives on another member's stream within a
second) and *browser* (it plays)

**INT-3.2** Given an interaction to Ji-woo is accepted, then Ji-woo's
screen shows a banner naming the sender and the interaction, in the copy
bank's words: "Mia is hyping you up 🔥", "Mia poked you. Rest's over? 👉",
"Mia slapped you back to work 👋". *browser*

**INT-3.3** Given Ji-woo has the room open in two tabs or on two devices,
then the banner appears on each of them. Nobody except the target ever
gets a banner for an interaction. *browser*

**INT-3.4** Given a banner is showing, then it covers no part of Ji-woo's
bottom panel, doesn't take focus, doesn't move Start set or Done, and is
announced once to screen readers. Ji-woo can tap Start set or Done while it
shows. *browser*

**INT-3.5** Given a banner is showing, then it goes after 4 s. *(rests on
Q6)* If another interaction to Ji-woo arrives while it shows, the newest
replaces it and runs its own 4 s; banners never queue. Every one of them
still plays its reaction. *browser*

**INT-3.6** Given an interaction happened, when a screen opens, reloads or
reconnects afterwards (including after a server restart), then it plays no
old reaction and shows no old banner. *browser*

**INT-3.7** Given Ji-woo is Away (phone locked, page closed), when Mia slaps
her, then the reaction plays on everyone else's screen; Ji-woo gets no
banner then or later. *(rests on Q5)* She can find it in the room log when
she comes back. *browser*

**INT-3.8** Given someone has reduced motion turned on, then the reaction
doesn't move (the designer decides what stands in for it), and the banner
still appears for the target, so the interaction is still perceivable.
*browser*

**INT-3.9** Given Mia taps an action, then the menu closes at once and the
reaction arrives when the server confirms it; Mia's screen never plays a
reaction the server didn't accept. If the request fails (no connection, a
server error), Mia sees "That didn't send. Try again." (proposed copy),
and nothing is stored or played. *browser*

**INT-3.10** *(rests on Q4)* Given Dony is out and Resting, when Mia slaps
him, then the slap reaction plays on his avatar on every screen; there is
no banner (he has no screen); his schedule is unchanged, so he goes back to
lifting exactly when he would have anyway. *HTTP* (his schedule is
unchanged) and *browser*

**INT-3.11** Given any accepted interaction, then the server log has one
line with the sender's id and display name, the target's id, the kind and
the room; given any refusal, one line with the same and the reason (target
lifting, idle or finished; rate limit; not in room; self; unknown kind).
No line holds a password, token, passcode or full email (OPS-1, OPS-2).
*judged* (read the log by hand, as ADR 0006 does)

**INT-3.12** Given the showcase (several people, nobody lifting), then a
slap reads as playful, not mean, to the person slapped and to the people
watching; a cheer reads as a cheer. *judged*

### INT-4: the 10-second limit

> One interaction per sender per target every 10 s.

**INT-4.1** Given Mia's interaction with Ji-woo was accepted, when Mia sends
Ji-woo another interaction of any kind (Cheer then Slap counts) less than
10 s later, then the server refuses it, stores nothing and plays nothing;
Mia sees "Easy, give them 10 seconds." (copy bank). *HTTP*

**INT-4.2** The 10 s are counted on the server from the time of Mia's last
**accepted** interaction with Ji-woo. 9.999 s after it is refused; 10.000 s
after it is accepted. Refused attempts don't restart the count. *HTTP*

**INT-4.3** Given Mia just interacted with Ji-woo, when Mia interacts with
Tom straight away, then it is accepted: the limit is per target. Given Mia
and Tom both slap Ji-woo in the same second, then both are accepted: the
limit is per sender. *HTTP*

**INT-4.4** Given Mia sends two interactions to Ji-woo at the same moment
(two tabs, or two requests in flight), then exactly one is accepted and
the other refused, never both. *HTTP*

**INT-4.5** Given Mia double-taps Slap, then one slap is sent and Mia sees
no rate-limit message. *browser*

**INT-4.6** Given Mia's last accepted interaction with Ji-woo was 4 s ago,
when the server restarts (or the machine sleeps and wakes), then a new one
is still refused until the 10 s are up: the limit comes from what is
stored, not from memory. *HTTP* (with a restart between requests)

**INT-4.7** Given Mia's interaction with Ji-woo was accepted, when Mia
reopens the menu on Ji-woo within 10 s (or reloads and reopens it), then
Cheer, Poke and Slap show as unavailable with "Easy, give them 10
seconds."; they become available when the 10 s are up, without reopening
the menu. *(rests on Q3)* Message stays available. *browser*

### INT-5: preset messages and the room log

> About 10 preset messages in two groups, hype ("One more rep!") and nudge
> ("Put the phone down"), shown as a speech bubble for 5 s and kept in a
> room message log.

**INT-5.1** Given the menu on Ji-woo is open, when Mia chooses Message,
then she sees the ten presets from the copy bank in two groups:
**Hype**: "One more rep! 💪", "Light weight!", "Let's gooo 🔥", "Lock in 🔒",
"That's a W set 🏆"; **Nudge**: "Put the phone down 📵", "Rest's over, mate
⏰", "I can see you 👀", "Bro is scrolling 💀", "Water break or nap? 😴".
Choosing one sends it; there is no confirmation step. *browser*

**INT-5.2** Given a request to send a message, then the server accepts only
one of the ten presets, named by the server's own list; anything else
(unknown preset, free text, an empty message) is refused and nothing is
stored. *HTTP*

**INT-5.3** *(rests on Q2)* Given Mia sends "Put the phone down 📵" from
Ji-woo's menu and it is accepted, then within a second a bubble with that
text appears above **Mia's** avatar on every open screen in the room, and
shows that it is addressed to Ji-woo (how is the designer's call). *browser*

**INT-5.4** Given a bubble is showing, then it shows for 5 s from when it
reaches each screen, then goes. If Mia sends another message in that time,
her new bubble replaces the old one and runs its own 5 s. Bubbles from
different people show at the same time. *browser*

**INT-5.5** Given Mia's message was sent 2 s ago, when Tom's screen opens,
reloads or reconnects, then Tom sees the bubble for the remaining 3 s;
a message sent 5 s ago or more shows no bubble, only its room-log entry.
*browser*

**INT-5.6** Given a message is accepted, then it is stored and an entry
appears in the room log on every open screen in the room within a second:
the sender's name, the addressee's name *(rests on Q2)*, the text, and when
it was sent. The entry is still there after a reload, a sign-out and back
in, and a server restart. *HTTP* and *browser*

**INT-5.7** *(rests on Q9 and Q5)* Given a member opens the room, then the
room log shows the newest 50 entries from the room's whole current life,
including those sent before they joined, and including interactions as
one-line entries ("Mia slapped Ji-woo"). Entries by people who have since
left keep their name. *HTTP*

**INT-5.8** Given nothing has been sent in the room yet, then the room log
shows an empty state with a friendly line and points to the one action
(select someone's avatar). The designer writes the line. *browser*

**INT-5.9** Given Mia is in any state, then she can send a message: what the
sender is doing never matters. *(rests on Q7)* A **Hype** preset can go to
anyone in any state; a **Nudge** preset follows Poke's rule (target Resting
or Slacking), is refused otherwise as in INT-2.3 and INT-2.4, and shows as
disabled with the reason in the menu. *HTTP*

**INT-5.10** *(rests on Q3)* Given Mia's message was accepted, when she
sends another message to anyone less than 2 s later, then it is refused and
nothing is stored. Messages never count toward INT-4's 10 s limit, and
interactions never count toward this one, so Mia can slap Ji-woo and then
tell her "Put the phone down 📵" straight away. *HTTP*

**INT-5.11** Given a message addressed to Ji-woo is accepted, then Ji-woo's
screen reader announces it once ("Mia: Put the phone down"); other people's
messages are not announced, only added to the log. Ji-woo gets no banner
for a message (banners are for interactions). *browser*

**INT-5.12** Given someone who isn't a member asks for the room log or sends
a message, then they get the same 404 as for a room that doesn't exist
(ADR 0006). *HTTP*

**INT-5.13** Given Mia sends an interaction or a message, then it counts as
activity: Mia is not Away, and the room's last-active time moves on
(ROOM-6). *HTTP*

**INT-5.14** Given any accepted message, then the server log has one line
with the sender's id and display name, the addressee's id, the preset's
key and the room; refusals are logged with their reason. *judged* (read the
log by hand)

**INT-5.15** *(rests on Q4)* Given Dony is out, then Mia can send him a
message like anyone. He never sends messages or interactions himself.
*HTTP*

**INT-5.16** Given a message fails to send (no connection, server error),
then Mia sees "That didn't send. Try again." (proposed copy), and no
bubble or log entry appears anywhere. *browser*

## Open questions

Ordered by how much each answer changes the feature.

| # | Question | Options | Recommendation and why | Blocks |
| --- | --- | --- | --- | --- |
| Q1 | Poke and Slap only work on someone Resting or Slacking. In the showcase nobody is lifting, so everyone is Idle and only Cheer works. Do Poke and Slap stay as written? | (a) Keep INT-2 as written: refused for Idle and Finished, with a reason. (b) Allow Poke on Idle, Slap stays Resting or Slacking. (c) Allow both on Idle. | **(a).** The rule is what keeps the slap from reading as mean: you get slapped for resting too long, never for having just walked in or for being done (banter, not shame; the Drifter is the one who'd feel judged). The showcase still has targets: Dony rests and slacks on his own once someone calls him out, and anyone can become slappable by logging one set (pick a lift, Done), which is itself the best demo of the product. | INT-2.4 |
| Q2 | Is a preset message addressed to the person whose menu it was sent from, or said to the whole room? | (a) Addressed: the bubble and log name the addressee. (b) To the room: Message is in the menu only as a shortcut. | **(a).** Message sits in one person's menu, and "Put the phone down" only works if it's clearly aimed at someone, which is the being-seen point. Keep the addressee optional in what's shown so INT-6's room-wide free text fits later (see Scope). | INT-5.3, INT-5.6 |
| Q3 | Does sending a message count toward INT-4's 10 s limit? | (a) Yes, a message is an interaction. (b) No: messages get their own limit of one every 2 s per sender. | **(b).** A slap followed by "Put the phone down" is the natural combo, and (a) would refuse the second half. 2 s matches INT-6's limit, so presets and free text can share it later. The menu closes after each send, so 2 s can't be spammed by accident. | INT-4.7, INT-5.10 |
| Q4 | Can Dony be the target of interactions and messages? | (a) Yes, all four, same rules, no banner, his schedule unchanged. (b) Cheer only. (c) Not selectable. | **(a).** In the showcase Dony is the one who actually rests and slacks, so slapping him back to work is the best moment in the demo. He has no screen, so no banner, and since his schedule is worked out from his summon time, a slap can't change it (BOT-3). The room spec already expects him to "take cheers like anyone" once the menu ships. | INT-1.10, INT-3.10, INT-5.15 |
| Q5 | Does the room log also list interactions ("Mia slapped Ji-woo"), or only messages as INT-5 says? | (a) Both. (b) Messages only. | **(a).** A banner only reaches an open page, so someone whose phone was locked never learns they were slapped unless it's written down. One line per interaction costs little, and the log is capped (Q9). | INT-3.7, INT-5.7 |
| Q6 | When several interactions reach one person within a banner's 4 s, what does the banner do? | (a) The newest replaces the current one. (b) They queue, 4 s each. (c) They group: "Mia and 2 others are nudging you". | **(a).** In a room of twelve a queue could run for most of a minute, and grouping mixed kinds needs new copy and rules. Every reaction still plays on the map and every interaction goes in the log, so nothing is lost. Grouping is a good later polish if the showcase shows floods. | INT-3.5 |
| Q7 | Do Nudge presets ("Put the phone down", "Rest's over, mate") follow Poke's rule, or can they go to anyone? | (a) Nudge follows Poke's rule; Hype goes to anyone. (b) Every preset to anyone. | **(a).** A nudge to someone mid-set is a distraction under a bar (MVP spec's risk) and reads as nagging; it's also the same rule people already learn for Poke. | INT-5.9 |
| Q8 | Does selecting someone's row in the squad list open the same menu? | (a) Yes. (b) Only the avatar on the map. | **(a).** On a phone the map is drawn at 1×, and resting people stand together at the water cooler, so tags overlap and the right avatar is hard to hit with a sweaty thumb. The list is already the accessible mirror of the map (GYM-15). The designer decides how it looks. | INT-1.9 |
| Q9 | What does a member see in the room log: everything in the room's current life (including before they joined), or only what was sent since they joined? How many entries? | (a) Everything, newest 50. (b) Since they joined. (c) Everything, uncapped. | **(a).** Everyone in a room is a friend with the passcode, so there's nothing to hide from a latecomer, and catching up on the banter is part of arriving. 50 (the MVP spec's number) keeps the page light. | INT-5.7 |
| Q10 | When a room closes, are its messages and interactions kept or deleted? (Touches the spec's open question "does a room ever need history".) | (a) Kept in the database, shown nowhere. (b) Deleted at close. | **(a).** Nobody can see them after close either way, so nothing changes for a person now, and keeping them leaves room history possible later without a migration. They're preset lines, so keeping them holds nothing personal. | none (storage only) |
| Q11 | The slap is still an open question in the spec ("keep the slap, or replace it with something softer"). Is it in for this build? | (a) Keep Slap with these safeguards, judge it at the showcase. (b) Replace it now with something softer. | **(a).** It's the most memorable thing in the pitch, and it is already fenced: only on someone Resting or Slacking, rate-limited, cartoonish, never changes their workout, and INT-7 can turn it off. INT-3.12 is where it gets judged. If dropped, INT-2.2 and INT-2.3 lose Slap and nothing else changes. | INT-2.2, INT-2.3, INT-3.2, INT-3.12 |

## Decisions

None yet. When the user answers, each answer goes here with its date, and
the criteria that rest on it are rewritten to match.
