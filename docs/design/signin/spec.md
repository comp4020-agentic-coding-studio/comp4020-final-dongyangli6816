# Sign in (`/signin`): design spec

Mockup: `docs/design/signin/mockup.html` (open it by double-clicking).
Screenshots: `node scripts/shot.mjs docs/design/signin/mockup.html .shots/signin/mockup`
(not kept in git).

## 1. Plan

**Who and when.** Someone who already has an account and has been signed out.
Three situations:

1. **They tapped a gym link in the group chat** (`/rooms/12`, the room
   redirects to `/signin?next=/rooms/12`). They're probably at the gym, phone
   in one hand, and want to be on the floor in seconds. Their password manager
   most likely fills both fields.
2. **They opened History** while signed out (`/signin?next=/history`).
3. **A new device, or the showcase laptop**: they come from the home page or
   the top bar and there's no `next`.

There's a fourth person on this page who isn't signed out but has **no account
yet**: a friend who opened an invite link. Rooms send them to sign in, not to
sign up, so this page has to hand them on to sign up without losing `next`.

**The one job.** Get back in and carry on to where you were going. The
primary action is **Sign in**. **Sign up** is the only secondary action.

**Hierarchy.**
1. The door and the line saying where you're headed ("Sign in and you'll walk
   straight into the gym."), so you know this is the way back in.
2. The two fields. They're usually autofilled; when they aren't, they're big
   enough to type into with a thumb.
3. **Sign in**, full width, at the bottom of the card. On a 390 × 844 phone
   it sits at about y = 480, just above the bottom third, which starts at
   y = 563. Once the keyboard is up, it sits right above the keys. The door
   band is what pushes it this far down; a smaller header would raise it.
4. Below the card, the sign-up stub for the friend with no account.

There are no numbers on this page, so the "must read at a glance" rule doesn't
apply here.

**Reuse.** `.card`, `label`, `input`, `button.wide`, `.actions`,
`.error`, `.hint`, `.button.secondary`. Only one thing is new: the card's
head band with the door sprite (`.entry-head`, `.entry-door`,
`.entry-where`), plus two tiny helpers (`.entry-status`, `.entry-alt`).

**Template check.** The first draft was today's page: a card with a heading,
two fields and a button, plus a text link below. That would fit any app with
the colours swapped. Three things changed because of the check:

- **The front door.** The card's head is a `--deep` band, and a 16 × 16 pixel
  gym door stands on its ink bottom edge, which works as the threshold. The
  door has a dumbbell sign and lit windows. Signing in is walking back into
  the gym, the same gym the room page draws.
- **Where you're headed.** The server already reads `next`, so the line
  under the heading says where the sign-in will take you. That's the gym for
  `/rooms/…`, your logbook for `/history`, and a light tease otherwise. This
  is specific to Spotter's invite-link flow, and it costs no new server
  capability.
- **The friend with an invite.** Sign up is now a real `.button.secondary`
  stub rather than a small inline link. On room links the stub promises
  "You'll still land in the gym", because that's the flow ROOM-3 protects.

The joke goes in the context line only. Labels, the error and the pending text
stay plain, as section 3 of the design system requires.

## 2. Requirements covered

| Requirement (source) | Met by |
| --- | --- |
| "Sign up and sign in with email and password." (`spec-4-weeks.md`, Scope) | `email` and `password` fields, unchanged |
| ACC-3: "Sign in and sign out. A sign-in lasts 30 days on that browser" (4-weeks spec) | Same `<form method="post">` with no `action`, so it posts to the current URL with `?next=` kept. The server logic is untouched. |
| Spec check: a set "is in their history after signing out and back in" (`spec/core-loop.test.ts` posts `email` and `password` to `/signin` and expects 303) | Field `name`s, `type`s, the POST and the 303 redirect are all unchanged |
| One generic error, "so the form doesn't reveal who has an account" (comment in `signin.astro`) | One `.error` for both cases, with new copy that still doesn't say which field was wrong |
| ROOM-3: invite links "survive signing up first"; `/join/:code` "asks the person to sign in or sign up first and then joins" (4-weeks spec, Screens) | The sign-up stub's `href` is `/signup?next=${encodeURIComponent(next)}`, as today. For `/rooms/…` the stub says "You'll still land in the gym." |
| "Tap targets are at least 44 px; the main button sits within thumb reach" (4-weeks spec, Screens) | Inputs and buttons are 48 px tall. **Sign in** is full width at the bottom of the card. |
| "reachable by keyboard with a visible focus ring" (4-weeks spec, Screens; design system section 12) | Native form order: email, password, Sign in, Sign up. Paper ink ring (Layout change L1). |
| "Works from 360 px wide to a full laptop window" (4-weeks spec, Screens) | Checked at 360, 390 and 1280. The band text wraps beside the door; nothing overflows. |
| "Sign up and sign in: Email, password, display name, date of birth, forgot password" (MVP spec, Key screens) | Email and password only. Forgot password is left out: see Departures. |
| Autocomplete values (current page) | `autocomplete="email"` and `autocomplete="current-password"`, unchanged |

## 3. Structure

Top to bottom inside `<Layout title="Sign in">`:

1. **Top bar** (layout). With Layout change L5, the "Sign in" nav link gets
   `aria-current="page"` and shows in `--leaf` with an underline.
2. **`div.card`**: the same card as today.
   1. **`div.entry-head`** (new): a `--deep` band that runs edge to edge
      inside the card border, using negative margins equal to the card
      padding (1.25rem, or 1rem at ≤ 420 px). It has a `--px` ink bottom
      border.
      - **`svg.entry-door`** (new): the door sprite, `viewBox="0 0 16 16"`,
        drawn at 80 × 80 (a whole 5×), `shape-rendering="crispEdges"`,
        `aria-hidden="true"`. In the mockup it's a `<symbol>` used four
        times; in the build, inline the rects once or render them from
        a grid (below).
      - **`div`** holding:
        - **`h1`** "Sign in", in `--paper`.
        - **`p.entry-where`** (new): VT323 body size in `--leaf` (8.8:1 on
          `--deep`). The text comes from `next`; see the code below.
   2. **`form method="post"`** (no `action`, as today):
      - `label[for=email]` "Email", then `input#email` with `name="email"`,
        `type="email"`, `autocomplete="email"`, `value={email}` and
        `required`.
      - `label[for=password]` "Password", then `input#password` with
        `name="password"`, `type="password"`,
        `autocomplete="current-password"` and `required`.
      - `p.error#signin-error`, only when there's an error (see States).
      - `div.actions` > `button[type=submit].wide` "Sign in".
      - **`p.hint.entry-status[role=status]`** (new): always rendered, empty
        until the form is submitted.
3. **`div.actions.entry-alt`** (new modifier) below the card:
   - `p`: "New here?", or "New here? You'll still land in the gym." when
     `next` starts with `/rooms/`.
   - `a.button.secondary` "Sign up", with
     `href={`/signup?next=${encodeURIComponent(next)}`}` (same href as
     today; only the class is new).

### Frontmatter additions

```ts
const where = next.startsWith("/rooms/")
  ? "Sign in and you'll walk straight into the gym."
  : next === "/history"
    ? "Sign in to open your logbook."
    : "Welcome back. The weights missed you.";
const stub = next.startsWith("/rooms/") ? "New here? You'll still land in the gym." : "New here?";
// error copy (still one message for both cases):
error = "That email and password don't match an account. Check both and try again.";
```

Don't look up the room to show its passcode or name. `/signin?next=/rooms/N`
is reachable by anyone, so that would leak the passcode for any room id.

### Pending script

This is the page's only script, and the form works without it.

```html
<script>
  const form = document.querySelector("form");
  const button = form.querySelector("button[type=submit]");
  const status = form.querySelector(".entry-status");
  form.addEventListener("submit", () => {
    button.disabled = true;               // label stays "Sign in"
    status.textContent = "Checking you in…";
  });
  // coming back with the browser's Back button restores the page from cache
  addEventListener("pageshow", () => {
    button.disabled = false;
    status.textContent = "";
  });
</script>
```

The form keeps native `required` validation (no `novalidate`), so `submit`
only fires once both fields are filled.

### Door sprite

Four colours plus transparency, with an `--ink` outline (design system
section 10). Its palette is `k` `#0b2416` (ink), `l` `#c8e66b` (leaf),
`g` `#1f6b3a` (green) and `p` `#e8f0d8` (paper):

```
..kkkkkkkkkkkk..
..klkllllllklk..
..klkkkkkkkklk..
..klkllllllklk..
..kkkkkkkkkkkk..
.kkkkkkkkkkkkkk.
.kllllllllllllk.
.klggggkkgggglk.
.klgppgkkgppglk.
.klgppgkkgppglk.
.klggggkkgggglk.
.klgggpkkpggglk.
.klggggkkgggglk.
.klggggkkgggglk.
.klggggkkgggglk.
kkkkkkkkkkkkkkkk
```

Each run of one letter is one `<rect height="1">`; the mockup has them
merged already. If `src/sprites/` exists by the time this is built, put the
grid there as `door.ts`, because the system says sprites are data.

### New CSS

The whole `/* signin page */` part of `<style id="page">` in the mockup:
`.entry-head`, `.entry-door`, `.entry-head h1`, `.entry-where`,
`.entry-status`, `.entry-alt`, and one `≤ 420px` rule. It uses tokens only.
The rules marked `/* layout change: … */` below it are **not** page CSS; see
"Layout changes". The `<style id="mockup-only">` block (state labels, forced
focus ring) is not for the build.

## 4. States

| State | Trigger | What changes |
| --- | --- | --- |
| **Default** | `GET /signin` with no `next`, or `next=/` | Line: "Welcome back. The weights missed you." Stub: "New here?" |
| **Heading to a gym** | `GET /signin?next=/rooms/12` (the room redirects here) | Line: "Sign in and you'll walk straight into the gym." Stub: "New here? You'll still land in the gym." The stub's href is `/signup?next=%2Frooms%2F12`. |
| **Heading to History** | `?next=/history` (shown in the Pending state of the mockup) | Line: "Sign in to open your logbook." |
| **Error** | `POST` with a wrong email or password (status 400, as today) | The email stays filled and the password is empty. `p.error#signin-error` appears under the password field and above the button. Both inputs get `aria-invalid="true"` and `aria-describedby="signin-error"`, and the password input gets `autofocus`, so the person can retype straight away. The context line still follows `next`. |
| **Pending** | The person taps **Sign in** (script above) | The button is disabled with its label kept and stays pressed down (L4): `--muted` fill, no drop shadow, moved down `--px`. Below it, "Checking you in…" appears in `.hint` inside the `role="status"` region. No spinner. |
| **Success** | `POST` matches (status 303 to `next`) | No page of its own: the person arrives where `next` points, as today. Nothing to draw here. |
| **Empty / signed out** | n/a | This page *is* the signed-out destination. On first use the fields are empty, which is the Default state. |
| **Narrow and wide** | 360, 390, 1280 | At 1280 the card fills the 44rem column. At ≤ 420 px the band padding drops to 1rem and the text wraps beside the door. |

A signed-in person who opens `/signin` sees the form, as today. Redirecting
them to `next` would be kinder, but this page doesn't do it now; it's listed
under Open questions.

## 5. Departures

- **No "Forgot password" link.** The MVP spec lists one for this screen, but
  the four-week spec rules out password-reset emails ("No email service in the
  course setup"), and the server has no reset route. A link that leads nowhere
  is worse than none. If the user wants some help here, the honest option is a
  `.hint` under the password field, for example "Forgot it? There's no reset
  yet, so ask whoever runs this Spotter." The user should decide that, so it
  isn't in the mockup.
- Nothing else breaks the design system. The door sprite follows section 10:
  4 colours, ink outline, whole-number 5× scaling and `crispEdges`.

## 6. Layout changes

These belong in `Layout.astro`, not in this page's CSS. The mockup previews
them at the bottom of `<style id="page">`, each commented
`/* layout change: Ln … */`, so the screenshots show the intended result.
Reconcile them once with the other six designers' lists.

- **L1. Paper focus ring** (gap 1). Set `:focus-visible` to
  `outline-color: var(--ink)`, and `body.night :focus-visible` to
  `var(--focus)`. Also raise **`.error` margin-top from 0.5rem to 0.75rem**:
  the ink ring reaches 8 px past a field (4 px offset plus 4 px width), so
  with the current 0.5rem it sits on the red box beneath. You can see this in
  the Error state, where the password field shows the ring.
- **L2. Hover tokens** (gaps 2 and 5). Add `--green-hover: #1a5c32`
  (6.8:1 with the paper label) and `--leaf-hover: #d6ef86`, and use them in
  `button:hover` / `.button:hover` and `.button.secondary:hover`.
- **L3. Display sizes on the 8 px grid** (gap 3). Make `h1` 24 px, and 16 px
  at ≤ 420 px (system scale "16 → 24"), replacing `clamp(18px, 5vw, 26px)`.
  Make button labels 16 px, replacing 12 px. This page shows only these two.
  The rest of gap 3 (`h2` 14 → 16, `h3` 12 → 16, `th` 10 → 8, `.badge` 9 → 8,
  `.stat` 12 → 8 or 16) is for whoever owns those pages. Also off the grid,
  though not listed in gap 3: `.brand` is 13 px at ≤ 420 px.
- **L4. Pending button style** (system section 13, "Pending"). The layout
  needs a global `button:disabled` rule: `--muted` fill and `--paper` label
  (6.5:1), held down by `--px` with the `:active` shadow, and
  `cursor: progress`. Signup and join need the same thing, so it should be
  global.
- **L5. Current nav link.** In the layout, put `aria-current="page"` on the
  nav link whose `href` matches `Astro.url.pathname`, and style
  `.topbar nav a[aria-current="page"]` with `--leaf` (8.8:1 on `--deep`, as
  the system's contrast table already lists for "active nav") plus a `--px`
  underline, so the cue isn't colour alone.
- **L6 (if signup adopts it). Promote the entry band.** If the signup
  designer uses the same door band (recommended, so the two pages read as
  siblings), move `.entry-head`, `.entry-door`, `.entry-where`,
  `.entry-status` and `.entry-alt` into the layout. That follows the
  system's rule that a component moves to the layout once a second page needs
  it. For signup I'd suggest the same door, the line "Get your key to the
  gym." (or the same room line when `next` is `/rooms/…`), and the stub
  "Already have one?" with a `.button.secondary` "Sign in".

## 7. Open questions

- **Forgot password** (Departures): leave it out, or add the plain hint?
- **`/join` drops the destination.** `join.astro` redirects signed-out people
  to `/signin` with no `?next=/join`, so someone who opens the join page signed
  out lands on home after signing in. This is the join page's to fix (add
  `?next=/join`), but it matters to this page's "where you're headed" line.
- **Signed-in visitors** to `/signin` could be redirected to `next`. That's a
  small server change outside this design.

## Tooling note

On this machine, Chrome 154 headless won't make a layout viewport narrower
than 500 px. As a result, `scripts/shot.sh`'s "mobile" image is a 500 px
layout cropped to 390 px, and pages look clipped on the right even when they
fit. `shot-narrow-390-360.png` shows the real 390 px and 360 px layouts,
rendered inside iframes of those widths. The critic should use that one for
narrow checks.
