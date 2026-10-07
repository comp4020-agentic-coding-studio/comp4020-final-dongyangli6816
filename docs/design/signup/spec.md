# Sign up: design spec

Mockup: `docs/design/signup/mockup.html` (open it directly in a browser).
Page: `src/pages/signup.astro`. Surface: **Paper**.

## 1. Plan

**Who and when.** Someone a mate has just talked into Spotter. They are
usually on a phone, and they often arrive from a link in the group chat: a
room link sends them to sign in, then to here, with `?next=/rooms/12`. They
might be standing in a gym, but they aren't mid-set. This is the one Spotter
page where they have time, and they will judge in about ten seconds whether
the app is "made for us" or just another fitness signup form.

**The one job.** Create an account in one go, then land wherever `next`
points. The primary action is **Create account**. Everything else (the
preview, the hints, the switch to sign in) helps that one button succeed on
the first try.

**Hierarchy.**
1. The patch of gym floor with *you* on it, and your name tag above your head.
   This answers the only question the form raises ("what's a display name
   for?") before anyone reads a word.
2. The three fields, in this order: display name (what your squad sees), then
   email and password (only you use these, in the same order as the sign-in
   page).
3. **Create account**, full width, at the bottom of the card, in the thumb
   zone.
The page has no gym numerals. The only number is in the hint text ("2 to 20
characters", "At least 8 characters"). It is VT323 at body size and always has
its unit.

**Reuse.** `.card`, `h1`, `label`, `input`, `.hint`, `.error`, `.actions`,
`button.wide` and `.bubble` carry almost everything. New pieces: the floor
preview (`.tag-field`, `.floor`, `.nametag`, the sprite and two props) and a
small `.lead`. `.nametag` is the gym's avatar name tag from system section 9,
built here first. It moves to the layout when the gym page uses it.

**Template check.** The first draft was the generic form: card, three
labelled fields and a button. With the colours swapped it could have been any
app's signup. Three things changed:
- **The name-tag preview.** A pixel room with a wall, a floor checker, a
  kettlebell and a dumbbell, and your avatar standing in it. The tag follows the
  display name as you type. On a laptop it sits beside the display name field,
  so the two read as one unit.
- **Field order.** Display name comes first, because it is the part your squad
  sees. Email and password follow in the same order as on the sign-in page.
- **The hints speak about the squad.** "Your squad never sees it" on the email
  field says who sees what, in this app's own terms.

There is also a bubble for people who arrive from a mate's room link: "Sign up
and you go straight into your squad's room 🏋️".

## 2. Requirements covered

| Requirement | Source | Met by |
| --- | --- | --- |
| "Sign up with email, password and a display name. Email is unique and case-insensitive. Passwords are at least 8 characters." | 4-week spec ACC-1 | The three fields, unchanged names and validation; "At least 8 characters." hint; the email-taken error |
| "Display names are 2 to 20 characters and shown above the person's avatar." | 4-week spec ACC-4 | "2 to 20 characters." hint, `minlength`/`maxlength` kept, and the live name tag floating above the avatar in `.floor` |
| "Invite links ... survive signing up first." | 4-week spec ROOM-3, system section 13 "Signed out" | `next` kept on the switch link and on the "Sign in instead" link in the email-taken error; the invite bubble when `next` points at a room |
| "Sign up and sign in: email, password, display name ..." | MVP spec, Key screens | Same fields. Date of birth and forgot password are left out on purpose (see Departures) |
| "Passwords are not returned by any endpoint" | 4-week spec, checks; README "Enforced" | The password input never gets a `value` from the server, so after an error it comes back empty |
| "Every form error under its field in `.error`" | system section 13 | Each error is directly under its input, linked with `aria-describedby`, and the input gets `aria-invalid="true"` |
| "Errors say what to do next" | system section 3 | Server messages are kept as they are. "Sign in instead" in the email-taken error becomes a link |
| "Pending: button disabled with its label kept" | system section 13 | The `button:disabled` style (Layout changes) plus the submit script below |
| Tap targets at least 44 px | system section 12 | Inputs and button are 48 px; the "Sign in" switch link gets a 44 px box (`.switch a`) |
| One primary per screen, in the thumb zone | system section 8 | Only **Create account** is a filled button, and it ends the card |
| Paper focus ring in ink | system section 12, gap 1 | Layout changes |
| Works 360 to 1280, no horizontal scroll | system section 8 | Checked at true 360, 390 and 1280 |

## 3. Structure

Top to bottom, as rendered inside `<Layout title="Sign up">`:

1. **Invite bubble**, shown only when `next` starts with `/rooms/` or `/join/`:
   `<p class="bubble">Sign up and you go straight into your squad's room 🏋️</p>`.
   Existing `.bubble`. It sits above the card, and its tail points down into
   the card.
2. **`div.card`**
   1. `h1` "Sign up".
   2. `p.lead` "This is you in the gym." **(new)**
   3. `form method="post" novalidate` (no `action`, as now, so the query
      string and `next` are kept on post).
      1. `div.tag-field` **(new)**: a grid, stacked on phones and two columns
         (`16rem 1fr`) from 900 px.
         - `div.floor` **(new)**, `aria-hidden="true"`, because it only
           repeats the input: the props `svg.floor-prop.kettlebell`, then
           `span.nametag[data-nametag]` **(new)**, then `svg.sprite` (16 × 16
           viewBox drawn at 64 px, top half in `g.sprite-top` for the idle
           bob), then `svg.floor-prop.dumbbell`. Copy the SVG rects from the
           mockup. The palette is skin, hair, shirt and `--ink` outline, as
           system section 10 allows. The tag shows the submitted
           `displayName`, or "Your name" with class `is-empty` when blank.
         - a plain `div` with `label[for=display_name]` "Display name",
           `p.hint.field-hint#name-hint` "2 to 20 characters.", then the input
           exactly as now (`id/name=display_name`, `autocomplete="nickname"`,
           `minlength="2" maxlength="20" required`, `value={displayName}`),
           plus `aria-describedby="name-hint"` (add ` display_name-error` when
           there is one), then `p.error#display_name-error` when there is an
           error.
      2. `label[for=email]` "Email", `p.hint.field-hint#email-hint` "Your
         squad never sees it.", the input as now (`type=email`,
         `autocomplete="email"`, `value={email}`), `aria-describedby`, then
         `p.error#email-error`.
      3. `label[for=password]` "Password", `p.hint.field-hint#password-hint`
         "At least 8 characters.", the input as now (`type=password`,
         `autocomplete="new-password"`, `minlength="8"`, **no value**),
         `aria-describedby`, then `p.error#password-error`.
      4. `div.actions` > `button[type=submit].wide` "Create account".
3. **`p.switch`**: "Already have one?" then
   `<a href={`/signin?next=${encodeURIComponent(next)}`}>Sign in</a>`.
   `.switch` is listed under Layout changes because sign in uses it too.

**Server additions (markup only, no behaviour change):**
- `aria-invalid="true"` on each input that has an error.
- `autofocus` on the first input with an error, so the keyboard and screen
  reader land on the thing to fix. The mockup leaves this out, because there
  are several forms on one page.
- The email-taken message renders "Sign in instead" as a link to
  `/signin?next=${encodeURIComponent(next)}`. The sentence stays the same.
- `const fromRoom = next.startsWith("/rooms/") || next.startsWith("/join/")`
  decides whether the bubble shows.
- Field order changes from email, name, password to name, email, password.
  The names, `id`s and `autocomplete` values don't change, so password
  managers and `spec/helpers.ts` (which posts by name) are unaffected.

**Script** (inline, a progressive enhancement; the page works the same
without it):

```js
const form = document.querySelector("form");
const input = form.querySelector('[name="display_name"]');
const tag = form.querySelector("[data-nametag]");
const button = form.querySelector('button[type="submit"]');
input.addEventListener("input", () => {
  const v = input.value.trim();
  tag.textContent = v || "Your name";
  tag.classList.toggle("is-empty", !v);
});
form.addEventListener("submit", () => {
  button.disabled = true;
  form.setAttribute("aria-busy", "true");
});
// back button restores the page from cache with the button still disabled
addEventListener("pageshow", () => {
  button.disabled = false;
  form.removeAttribute("aria-busy");
});
```

**`<style id="page">`**: the rules above the `layout change` comment in the
mockup: `.lead`, `.tag-field` (plus its 900 px rule), `.floor`, `.nametag`,
`.nametag.is-empty`, `.sprite`, `.sprite-top` + `@keyframes idle`,
`.floor-prop` (`.kettlebell`, `.dumbbell`), `.field-hint`, and the
reduced-motion rule that stops the idle bob. `.floor` uses `var(--tile)`,
which only exists once the first Layout change lands.

## 4. States

| State | Trigger | What changes |
| --- | --- | --- |
| **Default / empty** | `GET /signup` | Empty fields. The tag reads "Your name" in `--leaf` (`.is-empty`). No bubble. |
| **From a shared room link, typing** | `GET /signup?next=/rooms/12` (reached from sign in when a signed-out person opens a room link) | The bubble appears above the card. The tag follows the display name as it is typed ("Priya"). The switch link carries `next=%2Frooms%2F12`. |
| **Error: every field** | `POST` with `display_name=M`, `email=priya@`, a 5-character password; status 400 | Each input gets `aria-invalid` and a red inset, with its `.error` directly beneath. Name and email keep their values, the password is empty, and the tag shows "M". |
| **Error: email already used** | `POST` that passes validation but whose email exists; 400 | Only the email field is in error. The message ends in a white "Sign in instead" link that keeps `next`. |
| **Pending** | Submit tapped, waiting on a slow connection | The button is `disabled`: pressed in by `--px`, no drop shadow, `--muted` fill, label still "Create account". The fields keep what was typed. No spinner. |
| **Success** | Valid `POST` | 303 to `next` (or `/`), as now. Nothing is drawn on this page. A welcome `.bubble` would belong to the destination page (see open questions). |
| **Signed out** | This page is only for signed-out people | No change. Sign-ups that start from a room link keep `next` throughout, as shown. |
| **Narrow and wide** | 360, 390, 1280 | Phones stack the preview over the display name field. From 900 px they sit side by side. |

Phone height: at 390 × 844, **Create account** ends about 810 px down, so on a
phone with browser toolbars it is one short scroll away when the page loads.
The keyboard's Go key submits the form, and the page scrolls once a field is
focused anyway, so I kept the preview rather than squeezing it.

## 5. Departures

- **No date of birth and no "forgot password"**, although the MVP spec's Key
  screens table lists both. The 4-week spec rules them out: no age gate, since
  the app isn't for strangers, and no email service, so no reset. Neither is
  drawn. If reset ever ships, a "Forgot password?" link would sit in the
  `.switch` line on sign in, not here.
- **A sprite on a Paper page.** System section 10 places sprites in the gym.
  This one keeps every gym art rule: at most 4 colours plus transparency, an
  `--ink` outline, whole-number 4× scaling, and a two-frame idle with
  `steps(1)` at 400 ms per frame that stops under reduced motion. Until AV-3
  (random avatar per account) exists, it is a fixed placeholder avatar. Once
  AV-3 lands, the server could render the avatar this account will actually
  get.
- **Hints sit between the label and the input**, not under the input, so that
  each `.error` stays directly under its field, as system section 13 asks.

## Layout changes

These belong in `Layout.astro`, not in this page. The mockup shows each one in
its `<style id="page">` block under a `/* layout change: ... */` comment.
Reconcile them with the other six designers' lists.

1. **Tokens (gap 5):** add `--tile: #dbe7c6` and use it in the body checker
   and the input inset. Add `--green-hover: #1a5c32`.
2. **Focus ring (gap 1):** `:focus-visible { outline-color: var(--ink) }` on
   Paper. Keep `--focus` yellow inside `.topbar`, `footer` and (later)
   `body.night`.
3. **Button hover (gap 2):** `button:hover, .button:hover { background:
   var(--green-hover) }`.
4. **Grid sizes (gap 3):** `h1` 16 px, then 24 px from 900 px.
   `button.wide`/`.button.wide` labels at 16 px. Other buttons, `h2`/`h3`,
   `th` and `.badge` are left to whoever owns those pages.
5. **Active nav:** `.topbar nav a[aria-current="page"]` in `--leaf` with a
   `--px` underline. The layout should set `aria-current="page"` on the nav
   link that matches `Astro.url.pathname`.
6. **Pending button:** `button:disabled` stays pressed in by `--px` without the
   drop shadow, with a `--muted` fill (paper on muted passes AA), `cursor:
   progress`, and the same look on hover.
7. **Invalid field:** `input[aria-invalid="true"]` swaps the inset shadow to
   `--error`. Sign in and join need this too.
8. **Links in errors:** `.error a { color: #fff }`.
9. **Auth switch line:** `.switch` (a flex row) and `.switch a` (a 44 px tap
   target), shared with sign in ("New here? Sign up").
10. **Sibling with sign in:** I suggest sign in uses the same skeleton: `.card`
    > `h1` > `p.lead` > fields with `.field-hint` > `button.wide`, then
    `p.switch`. Sign in could show the same `.floor` without an input,
    welcoming the person back. That is for its designer to decide.

## Open questions

- **Signed-in visitors.** A signed-in person who opens `/signup` still sees
  the form, as today. Redirecting them to `/` is a one-line server change, but
  it is a behaviour change, so the user decides.
- **Show password.** A "Show" toggle on the password field would help on
  phones. It needs no server support, but nobody has asked for it, so it isn't
  drawn.
- **Welcome after sign up.** On success the page redirects. A "You're in,
  Priya" `.bubble` on the destination page would need a flash mechanism the app
  doesn't have yet.
