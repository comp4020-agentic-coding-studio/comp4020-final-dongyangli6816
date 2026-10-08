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
  `steps(1)`, frozen under reduced motion). Sprites are 4× (64 px) except in
  the editor, where you're the subject (6× on phones, 7× from 900 px).
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
(`viewBox="1 0 14 11"`, drawn at 3×, 42 × 33 px, no animation). It
replaces the 8 × 8 `head()` sprite. The grid's first column goes from
32px to 42px. The mockup people's looks are in the avatar spec. The
`head()` export in `avatar.ts` can then go.

### Signed in

1. `header.`**`player`**: a grid, `9rem 1fr`, centred vertically.
   - `a.floor.`**`player-tile`** `href="/avatar" tabindex="-1"
     aria-hidden="true"` > `span.stand` > `span.nametag` {displayName} +
     the avatar (`svg.av`, 4×, idle loop).
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
