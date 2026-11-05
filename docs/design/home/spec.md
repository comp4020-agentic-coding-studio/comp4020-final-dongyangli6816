# Home (`/`) design spec

Mockup: `docs/design/home/mockup.html` (open it in a browser). Screenshots:
`node scripts/shot.mjs docs/design/home/mockup.html .shots/home/mockup` (not
kept in git).

**Revision, 8 Oct 2026 (Lobby group).** Designed with `join` and the new `avatar` page. This revision adds the `.player` header (your avatar, `Hi, Mia`, Edit avatar), draws the join field as join's six slots, and makes the landing's squad faces the real avatar heads. Everything else (notices, totals, Best per kind, logbook buttons) is as built and as the 8 Oct spec described.

## 1. Plan

### Shared (Lobby group: `home`, `join`, `avatar`)

This section is identical in all three Lobby specs.

- **Opening: you, standing on a patch of gym floor.** Every Lobby page shows
  the person's own avatar on `.floor` (the gym-floor patch signup introduced:
  a `--deep` wall with a green skirting line over the page's checker), name
  tag above (`.nametag`), bobbing in the two-frame idle loop (400 ms a frame,
  `steps(1)`, frozen under reduced motion; the upper body moves 2 sprite
  pixels). Sprites are 32 × 32 (ADR 0005), shown at 2× (64 px) except in the
  editor, where you're the subject (3×, 96 px, on phones; 4×, 128 px, from
  900 px). A list's head crop is `viewBox="0 0 32 20"` at 2× (64 × 40 px).
  - home: a 9 rem tile beside `Hi, Mia`, with **Edit avatar** under the
    greeting;
  - join: the floor sits under the `h1` and lead, with the gym's open
    doorway beside you;
  - avatar: the floor is the live preview, under the `h1` and lead.
  - Signed out (the invite), the spot is a ghost outline tagged `You?`.
- **Titles:** one `h1` in Press Start 2P (16 px phone, 24 px laptop) and, on
  join and avatar, a one-line `.lead` under it inside the card, the way
  signup does (`This is you in the gym.` is signup's lead, reused on avatar).
- **The passcode is one object drawn one way.** Where it's typed or invited
  it is `.code-input`, six ink name-entry slots with leaf letters. That
  covers join, the invite, and now home's door card too, which used a plain
  field. Where it's mentioned it is the `.passcode` key tag (Your rooms, the
  notices). Hint everywhere: `6 characters · no 0 O 1 I L`.
- **Actions:** one primary per page, `.wide`, last in its card:
  - home: **Join**;
  - join: **Join**, or **Sign up** on the invite;
  - avatar: **Save**.

  Everything else is `.button.secondary`: Create room, New room, Sign in on
  the invite, Randomise, Later, See summary, All history.
- **Under the card,** `.lobby-alt`: one short hint and one secondary way out
  (join: `New room`; invite: `Sign in`; new-account avatar: `Later`). It is
  signin's "New here? Sign up" row, renamed for the Lobby.
- **Fields, errors, pending:**
  - Fields are the layout's `label` + `.hint` + field.
  - Errors are `.error` directly under the thing they're about. A field the
    error is *about* gets `aria-invalid` and a red frame; an error that
    isn't the field's fault (room full, save failed) doesn't.
  - Pending is the tapped button `disabled`, label kept, plus a
    `.hint.status-line[role=status]` line (`Checking the code…`,
    `Saving…`). Never a spinner.
- **Messages:** at most one `.bubble`, directly above the card that does the
  job. One emoji, at the end.
- **Links between them:**
  - Home's tile and Edit avatar go to `/avatar`.
  - Home's door card posts to `/join`.
  - The invite links to `/signup?next=/join/CODE` and `/signin?next=/join/CODE`.
  - The avatar editor goes back home via the brand, or **Later** /
    `next` for a new account.
- **Voice:** a mate in the group chat; plain on codes, errors and choices.

**What the template check changed (group):** a lobby of cards, a code field
and a settings form with colour pickers would fit any app. What makes it
Spotter's:

- **You are on every screen as the sprite the squad will see**, on the same
  floor patch you first stood on at sign up.
- **Joining is walking up to the gym's doorway.** An invite shows an empty
  spot waiting for you.
- **The code looks the same** wherever you type it, are sent it, or hold it.
- **The editor's choices are your own head and a Game Boy palette chart**,
  not a generic picker.

### Who and when

- **Signed out:** a friend who got a link in the squad chat, on a phone,
  deciding in a few seconds whether to sign up. Or, at the showcase,
  someone on a laptop who has never heard of Spotter.
- **Signed in:** arriving at the gym with a phone in one hand, a passcode
  already in the chat or about to be made. Also arriving *from* a room
  (left, or closed: the notices), or straight after sign up with a brand-new
  random avatar.

### The one job

- Signed out: show what being "spotted" looks like, then **Sign up**.
  Unchanged.
- Signed in: **get into a room with the squad.** The primary is **Join**,
  with **Create room** secondary. New in this revision: *who you are* is on
  the page too, with a quiet way to change it (AV-3, spec "Screens").

### Hierarchy (signed in)

0. You: your avatar on its floor tile, beside `Hi, Mia`, with Edit avatar.
   It is compact (152 px tall) and doesn't push Join out of the thumb zone:
   on a 390 × 844 phone, Join lands around y = 640.
1. The notice bubble, only when there is one.
2. The passcode slots and **Join**.
3. Your rooms, as key tags.
4. The last workout. Its numbers must read at a glance: the Best column
   (`62.5 kg × 8`, `BW + 10 kg × 8`, `1:30`, `5 km · 25:00`) and the
   totals (`16`, `2,207.5 kg`, `6.2 km`).

### Reuse

- **Everything existing stays:** `.pitch`, `.peek`, `.squad`, `.howto`,
  `.notice`, `.door`, `.room-keys`, `.logbook`, `.totals`, `table` + `.num`.
- **Lobby shared:** `.floor`, `.stand`, `.nametag`, `.av`, `.code-input`.
- **New page CSS:** `.player` (the header grid), `.player-tile`,
  `.edit-link`. The `pencil` icon already exists in `src/sprites/icons.ts`.
- **Removed:** `.passcode-input`, replaced by the shared `.code-input`.

### What the template check changed (this page)

- **The greeting has a body.** A "Hi, Mia" heading with an Edit profile link
  would fit any app. Here Mia stands on her patch of gym floor with her
  name tag, the way the squad will see her. Tapping her opens the editor.
  It reads like a trainer card in the Pokémon games.
- **One code, one look.** Home's join field was the last place a passcode
  looked like an ordinary text box. It now uses join's six slots, so a code
  typed on home looks the same as the one in the chat, in the room's top
  bar, and on the invite.
- **The landing's squad are the real avatars.** The four faces in "What
  your squad sees" are now the avatar heads from the new sprite (Mia's long
  brown hair, Ji-woo's pink ponytail), so the same people look the same on
  every page.

The earlier template-check changes (logbook steps, squad preview, key tags,
dimmed closed key, logbook-style Best column) stand.

## 2. Requirements covered

| Requirement (source) | Element |
| --- | --- |
| "`/` (signed in): Create a room, join with code, **edit avatar**, history, last workout" (4-week spec, Screens) | `.player` header with **Edit avatar** (new); `.door` card; Your rooms; Last workout with All history |
| AV-3 "A new account gets a random avatar it can edit straight away" | The first-use state shows the new account's random avatar, one tap from the editor (tile or Edit avatar) |
| Task: "Show the person's own avatar where it makes sense" | `.player` tile, idle loop, name tag |
| AV-2 palette swaps | The tile and the landing faces use the shared `.av` renderer (avatar spec) |
| "`/` (signed out): What Spotter is, in two sentences; sign up, sign in, link to `/readme/`" | Unchanged |
| ROOM-1 / ROOM-2 create and join | `form action=/rooms` (Create room) and `form action=/join` with `name=passcode`: every attribute kept; the field is now drawn as `.code-input` |
| ROOM-5 / ROOM-6 notices | Unchanged copy and markup; the bubble now sits under the `.player` header |
| LOG-6 / LOG-7 | See summary, All history (unchanged) |
| System 8 "One primary button per screen", thumb zone | Join stays the only primary; Edit avatar is a text link |
| System 12 tap targets ≥ 44 px, keyboard | `.edit-link` is 44 px tall. The tile is `tabindex="-1" aria-hidden="true"` (a pointer shortcut), so keyboard and screen-reader users get one "Edit avatar" link, not two |

## 3. Structure

The shell is the layout's. **Bold** names are new, from `<style id="page">`.

### Signed out

As built, with one change. In `ul.squad`, each `li`'s first child becomes
the person's avatar head: the shared avatar renderer with `head` set
(`viewBox="0 0 32 20"`, drawn at 2×, 64 × 40 px, no animation). It
replaces the 8 × 8 `head()` sprite. The grid's first column goes from
32px to 64px. The mockup people's looks are in the avatar spec. The
`head()` export in `avatar.ts` can then go.

### Signed in

1. `header.`**`player`**: a grid, `9rem 1fr`, centred vertically.
   - `a.floor.`**`player-tile`** `href="/avatar" tabindex="-1"
     aria-hidden="true"` > `span.stand` > `span.nametag` {displayName} +
     the avatar (`svg.av`, 2×, 64 px, idle loop).
   - `div` > `h1` `Hi, {displayName}` + `a.`**`edit-link`**`[href=/avatar]`
     with the `pencil` icon (8 × 8 at 2×) + `Edit avatar`.
2. **One bubble at most** (unchanged logic and copy): Left, Ended (with a
   workout), Ended (nothing logged), or First use.
3. `section.card.door`:
   - Create room form: unchanged.
   - `.or`: unchanged.
   - **Join form** (`method=post action=/join`), changed:
     - `label for="passcode"` `Passcode`.
     - `p.hint#passcode-hint` `6 characters · no 0 O 1 I L`. This is
       join's hint, and it now sits *above* the slots, as on join.
     - `div.code-input` > the existing input, keeping `id="passcode"`,
       `name="passcode"`, `autocomplete="off"`, `autocapitalize="characters"`,
       `maxlength="8"`, `required` and `aria-describedby="passcode-hint"`.
       Add `spellcheck="false" autocorrect="off" enterkeyhint="go"`. Drop
       `class="passcode-input"`.
     - `div.actions` > `button.wide` `Join`: unchanged.
4. Your rooms: unchanged.
5. Last workout: unchanged.

### Script

Add join's input filter to home's join field (uppercase, drop `0 O 1 I L`,
cap at 6), sharing the function with join. The pending script is
unchanged, and also sets the field `readonly` while the post is out, as
join does.

### Data

`Astro.locals.user` needs the avatar JSON (or a lookup on `users.avatar`),
so the tile can render. Use the same "roll and store if null" helper as the
editor.

## 4. States

| State | Trigger | What changes |
| --- | --- | --- |
| Signed out | No session | Landing; squad faces are the real avatar heads |
| Signed in, default | Has open rooms and/or a workout | `.player` header (Mia), door card with slots, Your rooms, Last workout |
| Left (success) | `/?left=K7M2QX` | Left bubble under the header (Tom) |
| Ended, with a workout | `/?ended=9BDMXE` (+ the workout lookup or `&logged=1`) | Ended bubble with the dimmed key and history link (Ji-woo); Your rooms hidden when none are open |
| Ended, nothing logged | as above, no workout there | Ended bubble pointing at Create room (Priya) |
| First use (empty) | `myRooms.length === 0 && !last`, no notice; e.g. straight after sign up, or after **Later** in the editor | The new account's random avatar in the header; welcome bubble; empty logbook |
| Pending | Join submitted on a slow connection | Join disabled, label kept; the slots `readonly` with the code still showing |
| Error | — | None on home. Wrong, closed or full rooms render on `/join` with the code kept |

## 5. Departures

- **Landing primary not in the bottom third** (unchanged from the first
  design): on a phone, Sign up sits in the middle third so it's visible
  without scrolling.
- **Squad preview shows gym states** (unchanged): an illustration.
- **Two links to `/avatar`** (tile and text). The tile is hidden from
  assistive tech and the tab order, so there's one accessible link.
- **The key tag inside a bubble** makes that line a few pixels taller
  (unchanged, accepted).

## Logbook links, Nov 4

The criteria are `docs/product/criteria/logbook.md`: **LB-3.11** (`/plans` is
one tap from home) and **LB-5.7** (every exercise name on home's Last workout
card links to its page). Only home changes. `join` and `avatar` don't change,
and the earlier sections above still hold. The mockup's signed-in default and
first-use states show the change. The other states' cards have the same
links, but their labels don't call them out.

### 1. Plan

**Shared (Lobby).** Unchanged. Nothing here touches the opening, the door
card, the one primary per page, or the voice.

**Shared with the Logbook group.** Two things are borrowed from it so the
same job looks the same on both groups' pages (`history/spec.md`, "Shared:
the Logbook group, Nov 4", "Links"):

- **An exercise name is a plain underlined link with no arrow**, 44 px tall
  without making its row taller. The rule is the one history uses for
  `.log th.lift a`, applied to home's `td`.
- **"Your plans" is the summary's `a.to-plans`**: the same words, the same
  plain link, 44 px tall, last among the card's logbook links.

**Who and when.** Mia on the way to the gym, looking at last session before
she taps Join. Or at home after training, curious how her bench is going.
Neither link is needed to train with the squad, so both stay quiet.

**The one job.** Unchanged: get into a room. **Join** stays the only
primary and Create room stays secondary. Both new links sit inside the
Last workout card, the fourth thing on the page, below the door card and
Your rooms. On a phone that is below the fold, so neither competes with
Join.

**Where the plans link goes, and why.** At the end of the Last workout
card's `.actions`, after See summary and All history: `See summary · All
history · Your plans`.

- That card is home's corner of the logbook, and plans are part of the
  logbook (Logbook group, D10). It is also where the summary puts the link.
- Other places considered:
  - the top bar: History is the only nav link (Logbook shared block), so it
    stays that way;
  - the door card: it would compete with Join;
  - a new card: too big for one link.
- It is a text link, not a third `.button.secondary`. The card already has
  two secondary buttons, and a third would wrap to its own row on a phone
  and look as important as All history. As a text link it is one tap, one
  Tab stop and one Enter (LB-3.11).
- It shows in **every** signed-in state, the first-use (empty) state
  included. With no plans, `/plans` explains how to get one ("Finish a
  workout, then save it as a plan from its summary", LB-3.8). In first use,
  where there are no buttons, it sits alone in an `.actions` row under the
  hint.

**Hierarchy inside the card.** Unchanged: the totals, then the Best column.
The names are now links, so they turn green and underlined. The Best
figures stay ink and read first, because they are what the card is for.

**Reuse.** The layout's `a`, `.actions` and `:focus-visible`. The summary's
`.to-plans`. History's 44 px link rule. There is **no new component and no
new art**.

**What the template check changed.** Nothing new to check: the page's
character is the player tile, the six code slots and the key tags, and none
of them moves. The check here was the reverse: don't add a "Plans" button or
a dashboard tile that would make home look like a fitness-app hub. One
logbook link inside the logbook card keeps home about the squad.

**What the brief's correction settled.** Home's card keeps its **one row per
exercise** (Lift · Sets · Best, from `bestLabel`). It has no per-set rows, so
it shows **no** set-type marks, record marks, RPE or notes. Those live on the
summary and history, one tap away through See summary and All history.

### 2. Requirements covered

| Requirement (source) | Element that meets it |
| --- | --- |
| LB-3.11 "Given Mia is on home or a summary, then `/plans` is one tap (or one Enter) away" | `a.to-plans[href=/plans]` "Your plans", last in the Last workout card's `.actions`, in every signed-in state (including first use and a Live workout) |
| LB-5.7 "every exercise name in a set table is a link to that exercise's page, at least 44 px tall and reachable by keyboard" (home's Last workout card) | Each `td`'s name is wrapped in `a[href=/exercises/{exerciseId}]`, with `.logbook td a` `min-height: 44px` and the layout's focus ring |
| LB-5.7 / D20 "The room's sheet has no such link" | Not home's concern, so nothing changes in the room |
| LB-0.3 old sets read as before | The card's figures and markup are as before; only the name gains a link |
| System 8, one primary per screen | Join stays the only primary; both additions are plain links |
| System 12, tap targets 44 px and keyboard use | Both links are 44 px tall, native `a` elements in DOM order (Join, rooms, then the names, See summary, All history, Your plans) |

### 3. Structure

Changes only, all inside `section.card.logbook`:

1. **Table body rows:** `tr > td > a[href=/exercises/{id}]` {name}, then the
   Sets and Best cells unchanged. `{id}` is the group's exercise id. The
   rows from `history()` already carry `exerciseId`, so
   `g.sets[0].exerciseId` works, with no new query. The header stays `Lift ·
   Sets · Best`, and the empty row (`td.empty`, no link) is unchanged.
2. **`div.actions`** (a workout exists): See summary (finished only), All
   history, then **`a.to-plans[href=/plans]` "Your plans"**.
3. **First use** (no workout): after `p.hint` "Your first set lands here…",
   a **`div.actions` > `a.to-plans`** "Your plans".

**Page block additions** (`<style id="page">`, built from tokens):

```css
.logbook td a { display: inline-block; min-height: 44px; margin: -0.5rem 0; padding: 0.5rem 0; }
.logbook td a:hover { color: var(--deep); }
.to-plans { display: inline-flex; align-items: center; min-height: 44px; }
```

- The negative margin cancels the padding, so the rows stay as tall as
  before (a 24 px VT323 line plus the cell's 0.5rem padding), while the
  link's box reaches 44 px.
- A long name ("Incline walk" on a phone) wraps inside the link, and the
  box grows with it.
- `.to-plans` is the summary's rule, unchanged. If the main agent moves it
  to one place, both pages use it.

### 4. States

| State | What changes |
| --- | --- |
| Signed in, default; Left; Ended with a workout | The names are links; "Your plans" ends the card's actions row. At 1280 px it shares the row with the two buttons. At 390 px it wraps to its own line under All history |
| Live workout (`Live` badge, no See summary) | `All history · Your plans`. The names link as usual; the exercise page shows the open workout as a Live session (exercise spec) |
| First use (empty) | No names to link. "Your plans" sits alone under the hint |
| Ended, nothing logged; pending | Shown cut short in the mockup, so the card isn't drawn; when it shows, it is as above |
| Signed out | Unchanged: no card, no links |
| Error | None on home (unchanged) |

### 5. Departures

- **"Your plans" is a text link beside two buttons**, not a third button. It
  matches the summary's `.to-plans` and keeps the card's buttons to two.
- **The links in the card's Lift column have no arrow**, as history's
  exercise links don't (history spec, Nov 4 departures).

Otherwise none.

### Open questions (behaviour the criteria don't decide)

Listed, not decided. The mockup draws the first option in each.

1. **Does "Your plans" show when Mia has no plans?** Drawn: always, because
   `/plans` explains how to get one. The alternative is to hide it until she
   has a plan. That would make LB-3.11 conditional, which its wording isn't.
2. **Does the card's Best show RPE?** `bestLabel` builds on `setLabel`, which
   now appends ` @ 8`. The Logbook mockups write Best **without** RPE (for
   example, history's "Best 85 kg × 5" for a set logged `@ 9.5`). Drawn: no
   RPE, matching them. Whichever rule history and the summary use, home
   should use too.
3. **Can a warm-up be a workout's Best?** LB-2.10 keeps warm-ups out of
   records but says nothing about the per-workout "Best" line. It only
   matters when every set of an exercise is a warm-up, or a warm-up was the
   heaviest. Home should follow whatever `bestLabel` does for history.
