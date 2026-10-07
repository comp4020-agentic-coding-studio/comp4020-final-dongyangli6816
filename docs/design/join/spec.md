# Join (`/join`) design

Mockup: `docs/design/join/mockup.html` (open it in a browser). Screenshots: `node scripts/shot.mjs docs/design/join/mockup.html .shots/join/mockup`
(not kept in git).

## 1. Plan

**Who and when.** Someone in the squad who has just been sent a six-character
code in the group chat, often at the gym with the phone in one hand, switching
from the chat app to Spotter. Home already has its own join form that posts
here, so most people only *see* `/join` after a code failed. The common case is
"that didn't work, compare what I typed with the chat". Some people also land
here from a typed URL or a bookmark.

**The one job.** Get six characters in correctly and press **Join**. The one
primary action is Join.

**Hierarchy.**
1. The passcode slots. They are the only "numbers" on the page, and they must
   read character by character so they can be checked against the chat
   (`K7N2QX` against `K7M2QX`).
2. The error, directly under the slots, when there is one.
3. **Join**.
Then, quietly, below the card: a way out when the room has closed (**New
room**).

**Reuse.** `.card` for the panel, `label`/`.hint`/`.error`/`.actions`/
`button.wide` from the layout, and `.button.secondary` for New room. One new
component, `.code-input`, which the design system already names (section 9,
"New"). One small sprite (the gym door) drawn the same way as the top-bar logo:
an inline SVG with `crispEdges`.

**Template check.** The first draft was "card, heading, text field, button",
which would fit any app. What changed it:
- **The code looks the same where you type it and where you see it.** The
  passcode on the room page is `.passcode` (leaf letters on an ink box with a
  green edge, in Press Start 2P). The slots here use the same three colours and
  the same font, so the code you type looks like the chip on your mate's screen.
- **It is a name-entry screen.** Six dark slots, each with an underline, like
  naming your character in the Pokémon games and like a Minecraft hotbar. Gen Z
  players read it straight away as "type six characters here", and the slots
  make a wrong character easy to spot.
- **You are walking in the gym door.** A 16 × 16 sprite of the gym entrance
  (a sign with the dumbbell, a lit doorway, a door swung open, a doormat) sits
  beside the heading. In the room, new arrivals walk in through the entrance
  (SES-3), so the page shows the door you are about to walk through.
- **The heading says "Join your squad", not "Join a room"**, which matches
  Home's card and says who is on the other side of the door.

## 2. Requirements covered

| Requirement (source) | Where it is met |
| --- | --- |
| "Any signed-in user with the passcode can join. A wrong code gives one generic error message." (ROOM-2, 4-week spec) | One `.error` under the slots, whatever went wrong. The copy still starts with the string the spec test checks: `No open room has that passcode.` |
| Passcode alphabet has no `0 O 1 I L` (ROOM-1) | Hint: `6 characters · no 0 O 1 I L`. The optional script drops those characters as they are typed. |
| "Join with code: six large character boxes, paste support" (MVP spec, Key screens) | `.code-input`: six slots drawn over **one** real `<input>`. Pasting works natively. |
| `.code-input` "accepts paste, forces uppercase, rejects 0 O 1 I L as you type" (system 9) | Paste is native. Uppercase is shown with CSS and also applied by the server. Rejecting characters is done by the optional script, and the hint explains it. |
| Form POSTs one `passcode` field to itself, max 8 characters, normalised on the server, and works with no JS (task brief, `join.astro`, `spec/core-loop.test.ts`) | Unchanged: `<form method="post">` with no action, and `name="passcode"`, `maxlength="8"`, `required`, `autocomplete="off"`, `autocapitalize="characters"`, `value={passcode}`. The slots are pure CSS, so with no JS the page still has one ordinary field. |
| Errors say what to do next, in the person's terms (system 3) | `No open room has that passcode. Check it with your squad.` |
| Signed-out users are redirected to sign in (system 13) | Unchanged: 303 to `/signin`. |
| Tap targets at least 44 px, ink focus ring on Paper (system 12) | Slot row is 64 px tall (80 px at ≥ 900 px). The focus ring is drawn on the slot frame. |
| Primary action in the thumb zone (system 8) | Join sits straight under the slots. On a phone the keyboard is open while typing, and the visible area is roughly the top 540 px. That puts Join in the bottom third of what is visible, just above the keyboard. `enterkeyhint="go"` also lets the keyboard's own key submit. |
| Invite links `/join/:code` | Not designed, as instructed. |

## 3. Structure (top to bottom)

The page shell (`.topbar`, `main`, `footer`) is the layout's, unchanged.
Signed in, the nav shows History and Sign out.

1. **`div.card.join-card`**. `.join-card` (new) caps the card at `30rem` and
   centres it, so on a laptop the slots and the Join button are about the same
   width.
   1. **`div.join-head`** (new): flex row.
      - `svg.door`, 64 × 64, `viewBox="0 0 16 16"`, `aria-hidden="true"`,
        `shape-rendering="crispEdges"`. Copy the eleven `<rect>`s from the
        mockup. Fills are palette hex, as the logo's are (allowed for sprites
        in system 10). Four colours: ink, leaf, green, deep.
      - `h1`: `Join your squad`.
   2. **`p`**: `Got the code? Pop it in 📲`. This is the only emoji. It sits at
      the end of a VT323 line, and the words work without it.
   3. **`form.join-form`** with `method="post"` (no action, as today).
      - `label for="passcode"`: `Passcode`.
      - `p.hint#passcode-hint`: `6 characters · no 0 O 1 I L`.
      - **`div.code-input`** (new), with `invalid` added when there is an
        error. Inside it is the existing input, with every attribute it has
        today plus `spellcheck="false" autocorrect="off" enterkeyhint="go"
        autofocus aria-describedby="passcode-hint[ passcode-error]"`, and
        `aria-invalid="true"` when there is an error.
      - `p.error#passcode-error`, only when there is an error.
      - `div.actions` > `button[type=submit].wide`: `Join`.
      - `p.hint.join-status[role=status]`: empty, so it is hidden by
        `:empty`. The script fills it while the form is pending.
2. **`div.join-alt`** (new), below the card: `p.hint`
   `Room closed? Start a new one and send the squad the code.` and a
   `form method="post" action="/rooms"` holding
   `button.button.secondary`: `New room`. This is the same action as Home's
   "Create a room". It is secondary, so Join is still the only primary
   button on the screen.

### How `.code-input` works with no JS

The slots are just the background of a wrapper `div`. Inside it sits one
transparent `<input>` in Press Start 2P. Every glyph in that font is exactly
1 em wide, so `letter-spacing: calc(var(--cell) - var(--glyph))` steps each
character into its own slot. The input is two cells wider than the frame, and
the frame has `overflow: hidden`. That means the sixth character (and up to
`maxlength` 8) never makes the row scroll out of line, and anything past six is
simply hidden. The focus ring goes on the frame (`:focus-within`) because the
frame clips the input. Sizes:

| Width | Cell | Glyph | Slot height | Frame width |
| --- | --- | --- | --- | --- |
| below 900 px | 44 px | 24 px | 48 px | 276 px (fits a 360 px phone with 4 px to spare) |
| 900 px and up | 64 px | 32 px | 64 px | 396 px |

Everything else comes from tokens. The CSS to copy is in
`<style id="page">`, below the "layout changes" part.

### Optional enhancement script

The page works without this script. It adds the "as you type" behaviour and the
pending state:

```html
<script>
  const form = document.querySelector(".join-form");
  const input = form.passcode;
  const status = form.querySelector(".join-status");
  input.addEventListener("input", () => {
    const v = input.value.toUpperCase().replace(/[^ABCDEFGHJKMNPQRSTUVWXYZ2-9]/g, "").slice(0, 6);
    if (v !== input.value) input.value = v;
  });
  form.addEventListener("submit", () => {
    form.querySelector("button").disabled = true;
    input.readOnly = true;
    status.textContent = "Checking the code…";
  });
  // coming Back from the room must not leave the form stuck as pending
  addEventListener("pageshow", () => {
    form.querySelector("button").disabled = false;
    input.readOnly = false;
    status.textContent = "";
  });
</script>
```

The character class is `PASSCODE_ALPHABET` from `src/lib/passcode.ts`. Import
the constant rather than repeating it, if that is easy.

## 4. States

| State | Trigger | What changes |
| --- | --- | --- |
| **Default** (this is also the empty state) | `GET /join`, signed in | Six empty slots, each showing its green underline. The input has `autofocus`. Without JS it looks exactly the same. |
| **Typing** | The field has focus | Leaf characters fill the slots from the left, and the ink focus ring is drawn on the frame, `--px` outside it. In the mockup, focus is faked with `.mock-focus`; the build uses `:focus-within`. |
| **Error: wrong code** | `POST` where `joinRoom` returns null. Status 404, as today. | The normalised code is shown back in the slots (`value={passcode}`), so it can be compared with the chat slot by slot. The frame gets `.invalid` (border `--error`), and the input gets `aria-invalid="true"` and points at the error. Below it: `.error` `No open room has that passcode. Check it with your squad.` |
| **Pending** | Submit, with JS | Join is `disabled`: it stays pressed down, filled `--muted`, and keeps its label (see the disabled-button layout change). The input is `readonly`, and `Checking the code…` appears in the status line. With no JS the browser simply loads, and nothing is drawn. |
| **Success** | Join worked | Nothing on this page. The 303 into `/rooms/:id` is the confirmation, and arriving in the gym belongs to the room page's design. |
| **Room full** (later, ROOM-4, not built) | `joinRoom` has no capacity check yet | The same slot with different copy: `This gym's full: 12 of 12 are in.` It is drawn so the slot is ready. Don't build it until the room capacity exists. |
| **Rate limited** (later, ROOM-7, not built) | Not built | It should use the same slot: `Too many tries. Give it a minute.` Keep it generic, and keep the code shown in the slots. |
| **Signed out** | No session | Unchanged: 303 to `/signin`. Nothing is drawn. |

## 5. Departures

- **The passcode input is dark (ink slots, leaf text) on a Paper page.** Other
  Paper inputs are white. The design system names `.code-input` but doesn't say
  what it looks like. I matched it to `.passcode`, which is already ink and leaf
  on Paper, so this extends the system rather than breaking it. Leaf on ink is
  11.7:1, and the ink ring sits `--px` outside the frame, on `--card`.
- **"Six boxes" are one field drawn as six.** The task allowed this as long as
  it degrades to a single field. It does more than degrade: it *is* a single
  field at all times. The only cost is that characters 7 and 8 (possible
  without JS, if spaces are pasted) are hidden past slot 6. The server still
  normalises them, so the join still works.

## Layout changes

These are shown in the mockup's page block marked `/* layout change: ... */`.
Reconcile them once in `Layout.astro`; they are not part of the page CSS.

1. **Paper focus ring is ink** (known gap 1): `:focus-visible { outline-color: var(--ink); }`
   on Paper. Night will need `--focus` back via `body.night`.
2. **Hover token** (known gap 2): `--green-hover: #1a5c32`, used by
   `button:hover, .button:hover`.
3. **8 px grid sizes** (known gap 3): `h1` 24 px, and 16 px at ≤ 420 px.
   Button labels go to 16 px. The scale table in system section 6 says "8–12
   elsewhere" for buttons, which contradicts known gap 3 (only 8 or 16 are
   crisp). I took 16 px, because 8 px is too small for a button label. The main
   agent should settle this across all seven pages.
4. **`button:disabled`** (new, needed by every Pending state): the button stays
   pressed down (the `:active` transform and shadow), with a `--muted` fill,
   the `--paper` label kept (6.5:1), and `cursor: progress`.
5. **Tool note, not CSS.** `scripts/shot.sh` gives a misleading mobile shot.
   Headless Chrome will not make a window narrower than 500 px, so the "390"
   shot is a 500 px layout cropped to 390. The `≤ 420px` breakpoint never fires,
   and the right edge looks clipped. Every designer's mobile shot has this
   problem. A fix is to screenshot a wrapper page holding a 390 px `<iframe>`,
   or to use a tool that sets a mobile viewport.
