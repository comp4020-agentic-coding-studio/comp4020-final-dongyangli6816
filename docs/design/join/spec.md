# Join (`/join`, `/join/:code`) design spec

Mockup: `docs/design/join/mockup.html` (open it in a browser). Screenshots:
`node scripts/shot.mjs docs/design/join/mockup.html .shots/join/mockup` (not
kept in git).

**Revision, 8 Oct 2026 (Lobby group).** Designed with `home` and the new `avatar` page. This revision adds invite links (ROOM-3), the room-full error (ROOM-4), and the scene: your avatar at the gym's doorway.

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

- **Signed in at `/join`:** someone in the squad switching from the group
  chat with a code, often at the gym with one hand. Most people only *see*
  this page after a code from home's card failed, so the common case is
  "compare what I typed with the chat". New in this revision: the room can
  also be **full** (ROOM-4).
- **Signed out at `/join/K7M2QX`:** a friend tapping an invite link in the
  chat, often brand new to Spotter, deciding in a few seconds. They need to
  know (1) they're invited somewhere real, (2) what one tap gets them in,
  and (3) that signing up won't lose the invite.
- **Signed in at `/join/K7M2QX`:** they just want to be in the room. No
  screen at all.

### The one job

- Signed in: get six characters in correctly, then press **Join**.
- Invite: **Sign up** and land in the room. Sign in is the secondary for
  people who already have an account.

### Hierarchy

1. The passcode slots. They are the "numbers" here, and they must read
   character by character so they can be checked against the chat
   (`K7N2QX` against `K7M2QX`).
2. The error, directly under the slots.
3. The primary button.

Above them, the scene sets the context in one glance (your sprite at the
gym's doorway) but carries no information you have to read. Below the
card, quietly, the way out.

### Reuse

- **Existing:** `.card`, `label`, `.hint`, `.error`, `.actions`,
  `button.wide` / `a.button.wide`, `.button.secondary`.
- **Lobby shared:** `.floor`, `.stand`, `.nametag`, `.av`, `.lead`,
  `.code-input` (unchanged from the last design apart from also styling a
  read-only `.code`), `.lobby-alt` (was `.join-alt`), `.status-line` (was
  `.join-status`).
- **Sprites:** the existing `doorway` sprite (`src/sprites/door.ts`), and the
  new avatar (see the avatar spec).
- **New page CSS:** `.scene` (the floor laid out as a row), `.av.ghost`,
  `.code-label`.

### What the template check changed (this page)

Before this revision the door sat beside the `h1` as an icon. Now:

- **The door is a place.** The doorway stands on the gym floor and *your*
  avatar stands beside it with your name tag. That is literally what
  happens next: you walk in through the entrance.
- **The invite has an empty spot for you:** a ghost outline tagged `You?`
  (the same leaf "not yet" tag signup shows before you've typed a name).
  It shows that the squad's gym is waiting for one more sprite, without
  revealing anything about the room.
- **The invite shows the code in the same six slots** you'd type it into,
  already filled, so the link and the code read as one thing, and the
  person can say it aloud or type it later.

## 2. Requirements covered

| Requirement (source) | Element |
| --- | --- |
| ROOM-2 "with the passcode can join. A wrong code gives one generic error message" (4-week spec) | One `.error`, whatever was wrong (unknown, closed, malformed): `No open room has that passcode. Check it with your squad.` (the spec test checks this string's start; unchanged) |
| ROOM-3 "Invite links of the form `/join/K7M2QX` work, and survive signing up first" | **Invite** state (signed out): Sign up → `/signup?next=%2Fjoin%2FK7M2QX`, Sign in → `/signin?next=%2Fjoin%2FK7M2QX`. Both already redirect to `next` after success, which lands on `/join/K7M2QX` signed in, which joins and 303s to the room |
| Spec "Screens": "`/join/:code` joins the room, or asks the person to sign in or sign up first and then joins" | Signed in: no screen (join + 303). Signed out: the invite card |
| MVP "invite links skip this screen" | Signed in, the link never shows the form |
| ROOM-4 "The 13th gets a clear 'room is full' message" | **Room full** state: `This gym's full: 12 of 12 are in. Wait for someone to leave, or start a new room below.` (copy bank line, plus what to do next) |
| ROOM-6 "A closed room's passcode can be reused" | A closed room is "no open room": the generic error, including when an invite's room closed while they were signing up |
| ROOM-1 alphabet (no `0 O 1 I L`) | Hint `6 characters · no 0 O 1 I L`; the script drops those as typed |
| MVP "Join with code: six large character boxes, paste support" / system 9 `.code-input` | Unchanged `.code-input`: one real field drawn as six slots |
| System 13 Signed out: "invite links (`/join/:code`) keep the code through sign up" | `next` carries the full `/join/CODE` path |
| System 3 "Errors say what to do next" | Both errors end in an action; New room sits right below |
| System 8 one primary, thumb zone | Join (or Sign up) `.wide`, last in the card, which sits in the lower half of a 390 × 844 screen with the keyboard closed |
| System 12 keyboard, focus, 44 px | The slot frame takes the ink ring (`:focus-within`); buttons 48 px |
| AV-3 "Show the person's own avatar where it makes sense" (task) | Your avatar and name tag in the scene |

## 3. Structure

Routing: keep `src/pages/join.astro` for `/join`, and add `/join/[code]`
(for example `src/pages/join/[code].astro`, or one
`src/pages/join/[...code].astro` that handles both). Both render the card
below. Factor the card into a component if two files are used, so it's
drawn once.

### Signed in (`/join`, or `/join/CODE` after a failed join)

1. `div.card.join-card`. `.join-card` caps the card at 30rem, centred.
   1. `h1` `Join your squad`; `p.lead` `Got the code? Pop it in 📲`.
   2. `div.floor.`**`scene`** `aria-hidden="true"`: `svg.doorway` (64 px)
      + `div.stand` > `span.nametag` {displayName} + `svg.av` (4×,
      idle loop).
   3. `form.join-form method="post" action="/join"`. The action is now
      explicit, because the same card renders at `/join/CODE`.
      - `label for="passcode"` `Passcode`; `p.hint#passcode-hint`
        `6 characters · no 0 O 1 I L`.
      - `div.code-input` (+ `.invalid` only for the wrong-code error) >
        the existing input. Keep every attribute it has today: `id`,
        `name="passcode"`, `value={passcode}`, `autocomplete="off"`,
        `autocapitalize="characters"`, `maxlength="8"`, `required`,
        `spellcheck="false"`, `autocorrect="off"`, `enterkeyhint="go"`,
        `autofocus` on error, `aria-describedby`, and `aria-invalid` (wrong
        code only).
      - *(error)* `p.error#passcode-error`.
      - `div.actions` > `button.wide[type=submit]` `Join`.
      - `p.hint.status-line[role=status]` (was `.join-status`).
2. `div.lobby-alt.join-alt`: `p.hint` `Room closed or full? Start a new
   one and send the squad the code.` + `form method=post action=/rooms` >
   `button.button.secondary` `New room`. The wording now covers the full
   room too.

### Signed out (`/join/CODE`): the invite

1. `div.card.join-card`:
   1. `h1` `You're invited`; `p.lead` `Your squad's training. Sign up and
      you'll walk straight in 🏋️`.
   2. `div.floor.scene`: `svg.doorway` + `div.stand` > `span.nametag.is-empty`
      `You?` + `svg.av.`**`ghost`** (the body grid only, outline in
      `--muted`, filled `--card`, idle loop).
   3. `p.`**`code-label`**`#invite-code-label` `Room passcode`, then
      `div.code-input[role=group][aria-labelledby=invite-code-label]` >
      `span.code` `K7M2QX`. This is the same slots with a read-only code
      instead of an input. It isn't a form field, because a signed-out
      person can't post to `/join`.
   4. `div.actions` > `a.button.wide[href=/signup?next=%2Fjoin%2FK7M2QX]`
      `Sign up`.
2. `div.lobby-alt.join-alt`: `p.hint` `Already on Spotter? You'll land in
   the same room.` + `a.button.secondary[href=/signin?next=%2Fjoin%2FK7M2QX]`
   `Sign in`.

**Nothing about the room is looked up for a signed-out visitor.** Not
whether it exists, not who is in it. Otherwise the invite page would be an
unauthenticated way to test codes, outside ROOM-7's per-account limit. The
code is only shown back, after the same format check as home's `?left`
(six characters of `PASSCODE_ALPHABET`, uppercased). A malformed code
redirects to `/signin?next=/join`.

### Server

- **`GET /join`**, signed out: 303 to `/signin?next=/join`. The `next` is
  new; it used to be bare `/signin`.
- **`GET /join/CODE`**, signed in: normalise, then `joinRoom`.
  - **Joined, or already a member:** 303 to `/rooms/:id`.
  - **Unknown, closed or malformed:** render the card with the code in the
    slots and the generic error, status 404.
  - **Full:** render the card with the room-full error, status 409.
- **`POST /join`:** as today, plus the full case: `joinRoom` needs to tell
  "full" apart from "no such room" (for example by returning
  `{ error: "full" }`). It returns 409 with the code kept, and doesn't mark
  the field invalid, because the code is right.
- **Invite links are GETs that join.** Don't let the client router prefetch
  them: set `data-astro-prefetch="false"` on any in-app `/join/…` link, if
  one is ever added (the room's Invite button copies the URL and doesn't
  navigate).
- **Signin copy (Auth, a one-line fix, not a redesign):** signin's `toRoom`
  only checks `next.startsWith("/rooms/")`. Add `/join/`, so an invitee who
  signs in sees `Sign in and you'll walk straight into the gym.`, which
  matches signin's own "heading to a gym" mockup state. Signup's `fromRoom`
  already includes `/join/`.

### Script

Unchanged from today, except the class rename `.join-status` →
`.status-line`. It still uppercases, drops `0 O 1 I L`, caps at 6, and on
submit disables Join, sets the input `readonly`, and shows `Checking the
code…`. Home's door card should run the same input filter (see home spec),
so share the function.

## 4. States

| State | Trigger | What changes |
| --- | --- | --- |
| **Default** (also empty) | GET `/join`, signed in | Your avatar at the door; six empty slots; autofocus only on error. No-JS looks identical |
| **Typing** | Field focused | Leaf characters fill from the left; ink ring on the frame (`:focus-within`; the mockup fakes it with `.mock-focus`) |
| **Invite, signed out** (new) | GET `/join/K7M2QX`, no session | `You're invited` card: ghost `You?` at the door, code in the slots, **Sign up** primary, Sign in below. Topbar is signed-out (Sign in / Sign up links, unchanged) |
| **Invite, signed in** (new) | GET `/join/K7M2QX` with a session | No screen: join + 303 to the room (or straight there if already a member) |
| **Error: unknown or closed** | POST `/join` or GET `/join/CODE` (signed in) with no open room for that code; 404 | Code echoed, normalised, in the slots; `.invalid` red frame; `aria-invalid`; `.error` `No open room has that passcode. Check it with your squad.` |
| **Error via invite** (new) | Signed up from `/join/9BDMXE`, but the room closed meanwhile | The same error state, with the code from the link and the new account's fresh avatar. New room sits right below |
| **Room full** (new) | `joinRoom` finds 12 active members; 409 | Code kept in the slots, **not** marked invalid; `.error` `This gym's full: 12 of 12 are in. Wait for someone to leave, or start a new room below.` |
| **Pending** | Submit with JS | Join disabled, label kept; input `readonly`; `Checking the code…` |
| **Signed out at `/join`** | No session, no code | 303 to `/signin?next=/join` |
| **Success** | Joined | Nothing here; arriving in the gym is the confirmation |
| Rate limited (ROOM-7, P1, not drawn) | — | If built, the same error slot: `Too many tries. Give it a minute.`, code kept, not invalid |

## 5. Departures

- **The passcode slots are dark (ink and leaf) on a Paper page**, as in the
  previous join design: they are drawn to match `.passcode`. Unchanged.
- **The invite's code is shown in an input's clothing but isn't an input.**
  It is `role="group"` with a label, so it's read as "Room passcode,
  K7M2QX". It could be a `readonly` input instead, but it would then be
  focusable and look editable for no gain.
- **Room full is an error that doesn't mark the field.** The system says to
  put errors under their field; this one sits in the same place but
  without `aria-invalid` or the red frame, because the code is correct.
