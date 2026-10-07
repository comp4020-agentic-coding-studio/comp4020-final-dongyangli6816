# Spotter design system

Oct 7, 2026 · the fixed rules every Spotter page follows. The `designer` agent
designs from this file, so a rule that isn't written here isn't a rule. A page
that needs to break one says so under "Departures" in its own
`docs/design/<page>/spec.md`.

The live implementation is the `<style is:global>` block in
`src/layouts/Layout.astro`. Where this document and that block disagree, this
document says what should be true, and "Known gaps" at the end lists the
places the code hasn't caught up yet.

## 1. Who we design for

**A squad of two to eight Gen Z friends** (roughly 18 to 29) who used to train
together and now live apart. They grew up on Minecraft, Stardew Valley and
Pokémon remakes, so pixel art reads to them as warm and playful rather than
old. They live in group chats, screenshot things to send to each other, and
switch off quickly when an app feels corporate, preachy or like a template.

Design for two situations at once (from `docs/product/spec-4-weeks.md`):

1. **Between sets at the gym.** A phone in one sweaty hand, 60 to 180 seconds
   of rest, glances rather than reading, often bad reception. This is the hard
   case and it wins every tie.
2. **The showcase.** A room of people on laptops and phones, nobody lifting,
   poking each other's avatars for ten minutes. The gym must be fun to watch
   and fun to tap even when no one is training.

## 2. Principles

In priority order. When two conflict, the higher one wins.

1. **Logging is never slower than a plain logger.** A normal set is two taps
   in the gym: **Start set**, then **Done**. Nothing playful (an animation, a
   banner, a delivery, a menu) may sit between the person and those two
   buttons. This protects the disciplined friend; if they leave, everyone does.
2. **Readable at arm's length.** The numbers that matter (weight, reps, the
   rest timer) are big, in VT323, and never share space with decoration.
3. **Being seen is the feature.** State (lifting, resting, slacking) is the
   loudest thing on the gym screen, and it is always shown three ways: colour,
   a pixel icon, and a word.
4. **Banter, not shame.** Slacking is funny and visible, never punished. Copy
   teases like a mate in the group chat; it never guilt-trips like a fitness
   brand.
5. **Made by hand, for these friends.** Every visual comes from the pixel grid
   and the palette below. If a screen would look the same in any other app
   with the colours swapped, it isn't finished.

## 3. Voice and copy

**Tone: playful, no swearing.** Talk like a friend in the squad chat: short,
teasing, warm. The audience is Gen Z, but the showcase and the markers are in
the room too, so nothing crude and nothing mean.

- **Australian English**: colour, kilograms, "mate" is fine. Weights are
  always kg.
- **Short**: one line wherever possible. Buttons are a verb, two words at most
  (`Start set`, `Done`, `Join`, `Cheer`).
- **Sentence case** in VT323 text. The display font is uppercase by CSS, so
  write the source text in sentence case anyway.
- **Functional text stays plain.** Form labels, errors and anything about
  passwords, passcodes or data are clear before they are funny. The joke
  goes in banners, empty states, presets and the summary.
- **Never mean about bodies, weight or ability.** Tease the behaviour (resting
  too long, scrolling), never the person.
- **Errors say what to do next**, in the person's terms: "That passcode didn't
  work. Check it with your squad." Never a code, never blame.

### Emoji

Emoji are allowed anywhere they add feeling, under these rules:

- **One emoji per string, at the end.** `Your squad can see you 👀`, not
  `👀 Your 👀 squad`.
- **Never the only carrier of meaning.** The words must work if the emoji is
  removed, because screen readers read emoji names aloud ("eyes") and some
  phones draw them differently.
- **Never inside numbers, timers, passcodes, form labels or error messages.**
- **Not in Press Start 2P headings.** The pixel fonts have no emoji, so the
  phone draws its own glossy one at a mismatched size. Put emoji in VT323 text
  (banners, bubbles, presets, empty states), where the size is close enough.
- **State is never shown by emoji.** States use the pixel icons in section 9.

### Copy bank

Use these, or match their voice.

| Where | Copy |
| --- | --- |
| Own screen while Slacking (GYM-11) | `Your squad can see you 👀` |
| Rest over (LOG-5) | `Rest's up. Back under the bar 🔔` |
| Cheered (INT-3) | `Mia is hyping you up 🔥` |
| Poked (INT-3) | `Mia poked you. Rest's over? 👉` |
| Slapped (INT-3) | `Mia slapped you back to work 👋` |
| Poke/slap refused while target lifts | `Ji-woo is mid-set. Cheer instead?` |
| Rate-limited (INT-4) | `Easy, give them 10 seconds.` |
| Room full (ROOM-4) | `This gym's full: 12 of 12 are in.` |
| Wrong passcode (ROOM-2) | `That passcode didn't work. Check it with your squad.` |
| Empty history | `No workouts yet. Your future self is waiting 🏋️` |
| Alone in a room | `Just you so far. Send the passcode to the squad 📲` |
| Delivery on the way (GYM-7) | `Equipment's on its way. Start whenever 🚚` |

**Preset messages (INT-5)**, about 10 in two groups:

- **Hype:** `One more rep! 💪` · `Light weight!` · `Let's gooo 🔥` ·
  `Lock in 🔒` · `That's a W set 🏆`
- **Nudge:** `Put the phone down 📵` · `Rest's over, mate ⏰` ·
  `I can see you 👀` · `Bro is scrolling 💀` · `Water break or nap? 😴`

## 4. Two surfaces: Paper and Night

Spotter has two themes, chosen by page, not by the phone's setting.

| Surface | Used on | Feel |
| --- | --- | --- |
| **Paper** (light) | Home, sign up, sign in, join, history, avatar editor, `/readme/` | A Game Boy screen in daylight: pale green paper, faint floor-tile checker, dark ink |
| **Night** (dark) | The gym (`/rooms/:id`) and the workout summary that follows it | The gym after hours: near-black green, the pixel scene and the state colours glow |

Why: the gym screen is where people spend almost all their time, often in a
dim gym or late at night, and Gen Z users expect a dark interface there. The
paper pages are forms and lists, read briefly, and the light theme keeps them
crisp. Switching to Night also signals "you're in the gym now".

Night is applied with a `night` class on `<body>` that swaps the surface
tokens; components don't get separate dark versions. The top bar and footer
are `--deep` on both surfaces.

## 5. Colour

Every colour on screen is a token on `:root`. No raw hex values in page styles,
except inside sprite palettes (section 10).

### Core tokens (exist today)

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#0b2416` | Text, borders and pixel outlines on Paper |
| `--deep` | `#0f3d22` | Top bar, footer, table headers |
| `--green` | `#1f6b3a` | Primary button fill on Paper, links, `h2` |
| `--leaf` | `#c8e66b` | Highlight: secondary button, badge, bubble, the Lifting state |
| `--paper` | `#e8f0d8` | Paper page background; light text on dark fills |
| `--card` | `#f7fbef` | Card fill on Paper |
| `--muted` | `#3d5a45` | Hints and secondary text on Paper |
| `--error` | `#a3241b` | Error fill (white text) and error text on Paper |
| `--focus` | `#f2c94c` | Focus ring on Night (see section 12) |
| `--px` | `4px` | One unit of pixel decoration (section 7) |

### Night tokens (new)

| Token | Value | Use |
| --- | --- | --- |
| `--night` | `#081a10` | Night page background |
| `--floor` | `#0f2a1a` | Second checker shade, gym floor behind the map |
| `--panel` | `#143822` | Panels on Night (the bottom panel, people list, menus) |
| `--edge` | `#3f8f5a` | Panel borders and dividers on Night |
| `--dim` | `#8fa896` | Secondary text on Night |

On Night, text is `--paper`, highlights are `--leaf`, and the primary button
fill becomes `--leaf` with `--ink` text, because `--green` disappears against
the dark background.

### State tokens (new)

The five states from GYM-9 plus the Away flag (GYM-14). One colour each, used
for the state chip, the avatar's name tag and the people-list row.

| State | Token | Value | Pixel icon | Word |
| --- | --- | --- | --- | --- |
| Idle | `--idle` | `#e8f0d8` (= paper) | standing figure | Idle |
| Lifting | `--lifting` | `#c8e66b` (= leaf) | dumbbell | Lifting |
| Resting | `--resting` | `#7cc6e8` | water drop | Resting |
| Slacking | `--slacking` | `#ff6b5e` | phone | Slacking |
| Finished | `--finished` | `#f2c94c` | trophy | Finished |
| Away (flag) | — | avatar at 50% opacity | phone with a cross | Away |

Rules:

- **State colour is a fill with `--ink` text on it**, never coloured text on a
  background. That works on both surfaces: ink on every state colour passes
  AA (lowest is Slacking at 5.9:1).
- **Exception:** the Slacking timer counts up in `--slacking` text on Night
  (6.5:1 on `--night`, 4.6:1 on `--panel`, so only at the large timer size).
- **Red means slacking or an error, nothing else.** No red buttons, no red
  decoration.
- **Water blue is the only non-green hue besides the state colours.** It
  belongs to resting and the water cooler.
- Away is shown by fading the avatar and appending the icon and the word, so
  "Resting · Away" keeps both pieces of information.

### Checked contrast pairs

Measured with the WCAG 2.2 formula. AA needs 4.5:1 for body text, 3:1 for
large text (24 px and up in VT323, roughly) and for borders that identify a
control.

| Pair | Ratio | OK for |
| --- | --- | --- |
| `--ink` on `--paper` / `--card` | 14.0 / 15.7 | everything |
| `--green` on `--card` | 6.2 | links, `h2` |
| `--muted` on `--paper` | 6.5 | hints |
| `--paper` on `--green` | 5.6 | primary button label |
| white on `--error` | 7.4 | error messages |
| `--leaf` on `--deep` | 8.8 | footer link, active nav |
| `--paper` on `--night` / `--panel` | 15.4 / 11.1 | Night text |
| `--dim` on `--panel` | 5.1 | Night secondary text |
| `--ink` on `--leaf` | 11.7 | Night primary button, Lifting chip |
| `--ink` on `--resting` / `--slacking` / `--finished` | 8.7 / 5.9 / 10.4 | state chips |
| `--edge` on `--panel` | 3.3 | Night panel borders |
| `--focus` on `--night` | 11.4 | Night focus ring |
| `--focus` on `--paper` | **1.4** | fails: never use the yellow ring on Paper |

## 6. Typography

Two self-hosted pixel fonts, loaded from `@fontsource`, no third-party
requests. No other fonts, ever, except the monospace fallback.

| Font | Token | Job |
| --- | --- | --- |
| Press Start 2P | `--display` | Headings, button labels, table headers, the passcode. Uppercase, short. |
| VT323 | `--body` | Everything people read, and **every number**. It keeps 5/S, 8/B and 0/O distinct, which matters when the text is a weight you're about to lift. |

Pixel fonts have one weight: `font-synthesis: none` stays on, and nothing is
bold or italic. Emphasis comes from size, colour or a `--leaf` highlight.

### Scale

Press Start 2P is drawn on an 8-pixel grid, so it is crisp only at multiples
of 8 px. New display text uses 8, 16, 24 or 32 px.

| Role | Font | Size (phone → laptop) |
| --- | --- | --- |
| Page title `h1` | display | 16 → 24 |
| Section `h2` | display | 16 |
| Small heading `h3`, button label | display | 8 → 16 (buttons: 16 on primary gym actions, 8–12 elsewhere) |
| Table header, badge, chip label | display | 8 |
| Body text, labels | body | 21 → 22 |
| Inputs | body | 26 |
| Table cells | body | 24 |
| Weight and reps in the gym panel | body | 48 |
| Rest timer | body | 80 |
| Summary stat numbers | body | 48 |

Rules:

- **VT323 never below 20 px**; its letters are short and get hard to read.
- **Press Start 2P never below 8 px**, and at 8 px only for short uppercase
  labels (a chip, a table header), never sentences.
- **Gym numerals are at least 32 px** (from the MVP spec), and the timer and
  the set's weight and reps are much bigger, so they read at arm's length.
- **Numbers line up**: `font-variant-numeric: tabular-nums` and right-aligned
  in tables (the existing `.num` class). Always show the unit: `82.5 kg`,
  `8 reps`, `1:30`.
- Line length on Paper stays under about 60 characters (the 44 rem `main`
  width does this).

## 7. The pixel grid, spacing and shape

- **One decoration pixel is `--px` (4 px).** Borders are `--px` thick,
  shadows are offset by whole multiples of `--px`, and notches are one `--px`
  square. Only table cell borders use 2 px.
- **Spacing comes from the scale** 4, 8, 12, 16, 24, 32, 48 px (`0.25rem` to
  `3rem`). No 10 px, no 18 px.
- **Corners are square.** `border-radius` is 0 everywhere. Rounded shapes are
  drawn as stepped pixels (like the button's notched outline), never curved.
- **Shadows are hard**, with no blur: the card's two-step drop shadow (`--green`
  then `--ink`) and the button's under-shadow. On Night, panels drop a single
  `--px` shadow in `#000`.
- **The background is a 16 px checker** of floor tiles: `--paper`/`#dbe7c6` on
  Paper, `--night`/`--floor` on Night.

## 8. Layout

- **Widths**: works from 360 px to a full laptop window, and survives a resize
  mid-use (spec "Screens"). Paper pages are a single column, `max-width:
  44rem`, 16 px side gutters. No horizontal scroll at any width.
- **Breakpoints**: `≤ 420px` (phone tweaks, already in the layout) and
  `≥ 900px` (the gym switches to two columns). Avoid adding others.
- **Thumb zone**: on phones, the page's primary action sits in the bottom third
  of the screen. In the gym it is pinned there.
- **One primary button per screen.** Everything else is `.secondary` or a link.

### The gym screen

```
 Phone (portrait)                     Laptop (≥ 900 px)
┌──────────────────────┐            ┌──────────────────────────┬─────────────┐
│ K7M2QX · 4 in  ⋯     │ top bar    │ K7M2QX · 4 in · Invite · Leave · 🔊    │
├──────────────────────┤            ├──────────────────────────┬─────────────┤
│                      │            │                          │ bottom panel│
│      gym map         │            │        gym map           │ (your state)│
│  (whole-number zoom) │            │   (whole-number zoom)    ├─────────────┤
│                      │            │                          │ people list │
├──────────────────────┤            │                          │             │
│ people list (scroll) │            └──────────────────────────┴─────────────┘
├──────────────────────┤
│ bottom panel, pinned │ ← Start set / Done live here
└──────────────────────┘
```

- **Top bar**: passcode (tap to copy), headcount, and a menu with Invite,
  sound on/off and Leave. Room actions never compete with the set buttons.
- **Map**: shown whole, never scrolled or cropped. Scaled by the largest whole
  number that fits (spec "Rendering"). To get a 2× zoom on a 360 px phone, the
  map should be at most 10 tiles (160 px) wide; see "Open questions".
- **Bottom panel**: pinned to the bottom on phones, the right column on
  laptops. Its content follows your state (section 9).
- **People list** (GYM-15): the same information as the map in text, so it is
  never hidden, only placed below the map on phones.

## 9. Components

Reuse before inventing. A new component is justified only when none of these
can carry the job, and it goes in the page's `<style id="page">` first, moving
to the layout once a second page needs it.

### Existing (in `Layout.astro`)

| Class / element | What it is | Notes |
| --- | --- | --- |
| `.topbar`, `.brand`, `nav` | Deep-green bar with the pixel dumbbell logo | Same on both surfaces |
| `.card` | Pixel panel with a two-step hard shadow | Paper only; on Night use `.panel` |
| `button`, `.button` | Notched pixel button that presses down 4 px | Primary: `--green` on Paper, `--leaf` on Night |
| `.button.secondary` | `--leaf` fill, ink label | |
| `.wide` | Full-width button | Primary gym actions are always `.wide` on phones |
| `.linklike` | A button that looks like a nav link | Top bar only |
| `input`, `select`, `label` | 48 px tall fields, inset pixel shadow | |
| `.error` | White on `--error`, thick ink left edge | Directly under the field it's about |
| `.hint` | Muted helper text | |
| `.actions` | Row of buttons with consistent gaps | |
| `.passcode-box`, `.passcode` | Passcode in leaf on ink, display font | |
| `.bubble` | Leaf speech bubble with a pixel tail | Paper flash messages, and the gym speech bubble |
| `.roster` | Row of name chips with a square bullet | Becomes the people list on Night |
| `table`, `.num` | Pixel table, tabular numbers | History, this workout |
| `.badge` | Tiny leaf label (`LIVE`) | |
| `.stat` | Small display-font figure | |

### New, for weeks 10 and 11

Build these when the page that needs them is designed. Names are the class
names to use.

- **`.chip.state-<name>`**: the state chip. State colour fill, `--ink` text,
  8 px display label, pixel icon on the left, 2 px ink border. Used in the
  people list, under name tags, and at the top of the bottom panel.
- **`.panel`**: the Night version of `.card`: `--panel` fill, `--edge` border,
  `#000` hard shadow.
- **`.sheet`**: the gym's bottom panel. A `.panel` pinned to the bottom on
  phones, with the state chip, then the exercise and set number, then the big
  numbers, then one `.wide` primary button. Its content by state:
  - Idle: exercise picker grouped by equipment, with what's on the floor now
    marked (a `--leaf` square), recently used first.
  - Lifting: exercise name, `Set 3`, last time's numbers, a large **Done**.
  - Resting: the countdown, the set just logged with steppers to fix it,
    `−15 s` / `+15 s`, a large **Start set**.
  - Slacking: Resting, but the timer counts up in `--slacking` and the line
    `Your squad can see you 👀` appears above it.
- **`.timer`**: VT323 at 80 px, `m:ss`, tabular. Counts down while Resting,
  up while Slacking. Announced to screen readers only at state changes, not
  every second.
- **`.stepper`**: `−` value `+` with each button at least 48 × 48 px. Weight
  steps 2.5 kg, reps step 1. The value is an input, so typing works too.
- **`.avatar`**: a sprite inside a `<button>`. The sprite is 16 × 16 drawn at
  the map's scale, but the button's hit area is at least 44 × 44 px. A name
  tag (VT323, `--paper` on `#000` at 70%) floats above it, with a speech
  bubble above that when the person sends a preset.
- **`.menu`**: the interaction menu (INT-1) that opens on an avatar: the
  person's name and state chip, then **Cheer**, **Poke**, **Slap**,
  **Message** as 48 px rows. Poke and Slap are disabled, not hidden, while
  the target is Lifting, with the reason shown ("Ji-woo is mid-set"). The menu
  highlights the fitting action: Slap and Poke for a slacker, Cheer for a
  lifter. Closes on Escape, tap outside, or after an action.
- **`.banner`**: the message you get when someone interacts with you (INT-3).
  Slides in from the top of the map, never covers the bottom panel, stays 4 s,
  and is `role="status"`.
- **`.code-input`**: the join screen's six large character boxes (MVP spec
  "Join with code"). Accepts paste, forces uppercase, rejects `0 O 1 I L`
  as you type.
- **`.swatch`**: an avatar-editor colour choice. A 44 px square of the colour
  with an ink border; the chosen one gets a `--leaf` inner ring and a tick.
- **`.summary`**: the workout summary (LOG-6). A single `.panel` sized to fit
  one phone screen (about 390 × 700 px), so a screenshot captures all of it
  for the group chat: your avatar, duration, sets, volume, slacking time in
  big VT323 numbers, and one joke line based on the slacking time ("Iron
  discipline: 0 s slacking 🏆" or "Professional slacker: 6 min 12 s 💀").

## 10. The gym art

The look is the early Game Boy and Game Boy Color Pokémon overworld: top-down,
16 px tiles, small sprites, few colours, two-frame animations. The style is
borrowed; no Nintendo assets are.

- **Sprites are data**: character grids in `src/sprites/`, one module per
  subject, rendered once per palette in the browser (spec "Art direction").
- **At most 4 colours per sprite plus transparency.** Avatar palettes are
  skin, hair, shirt and outline (`--ink`).
- **Outlines are `--ink`** on every sprite, so sprites stay readable on the
  dark floor.
- **Whole-number scaling only**, with `image-rendering: pixelated`. A
  fractional zoom makes pixels uneven and is a blocker.
- **Avatar choices** (AV-1): 6 skin tones covering a realistic range of
  people, 4 hair styles, 8 hair colours (natural ones plus a few bright dyed
  ones, since this is a Gen Z squad), 8 shirt colours. Every choice must stay
  distinguishable from the state colours when it sits next to a state chip.
- **State in the scene**: Lifting plays the equipment's loop; Resting stands
  at the water cooler with a bottle; Slacking sits and scrolls a phone, with a
  small pixel phone glow; Finished does a flex then waves; Away is faded to
  50% with the phone-off icon above the head.
- **The gym worker** (GYM-6) is visibly different from members: a staff
  uniform in a fixed palette nobody can pick, and bigger shoulders. The worker
  should be funny, not slow: a delivery takes about 4 s on screen and never blocks a
  button.
- **Tiles**: floor, wall, entrance, aisle, empty-station marker (a dashed
  square in `--edge`), water cooler (the one place `--resting` appears in the
  scenery).

## 11. Motion and sound

Pixel games move in steps, so Spotter does too.

- **Every animation uses `steps()`**, never a smooth ease. The button press is
  60 ms `steps(1)`.
- **Sprite frames**: two frames per loop, about 400 ms per frame when idle or
  resting, 250 ms when lifting.
- **Walking** moves a tile at a time along the aisles at about 8 tiles a
  second.
- **Banners** slide in over 160 ms in 4 steps and leave the same way.
- **Interaction reactions** (slap spin with stars, poke jump, cheer sparkle)
  last under 1 s and play on every screen.
- **Rest-over flash** (LOG-5): the bottom panel's border flashes `--leaf` at
  most twice a second, three times, never the whole screen. WCAG forbids more
  than three flashes a second.
- **Sound**: short chiptune blips made with the Web Audio API (square wave),
  no audio files. The rest-over sound is the only one on by default;
  interaction sounds are quieter. One sound toggle lives in the gym menu.
  Sound never carries information on its own; the flash and text do.
- **Reduced motion** (`prefers-reduced-motion: reduce`): avatars jump to their
  destination instead of walking, loops freeze on their first frame, the
  delivery worker is skipped (the equipment appears), and the rest-over flash
  becomes a steady `--leaf` border. State is still shown, by sprite, chip and
  text.

## 12. Accessibility

The target is WCAG 2.2 AA, from the MVP spec.

- **Keyboard**: every action, including choosing an avatar and interacting
  with it, works by keyboard (spec "Screens"). Avatars are buttons in a
  sensible tab order; the menu traps focus while open and returns it to the
  avatar when closed.
- **Focus ring**: always visible and on the `--px` grid. On **Paper** it is a
  `--px` solid `--ink` outline with a `--px` offset. On **Night** it is
  `--focus` yellow. The yellow ring on Paper fails contrast (1.4:1).
- **Tap targets** at least 44 × 44 px everywhere, and 48 px for the gym's
  primary actions and steppers.
- **No colour alone**: every state has its colour, pixel icon and word.
  Errors have the red fill and a text message.
- **Live regions**: banners and state changes for *you* are `role="status"`.
  Other people's changes update the people list quietly; they are not
  announced one by one.
- **No required gestures**: taps only. No swipe, drag or long-press is needed
  for anything (MVP spec "UX rules").
- **Text alternatives**: the people list mirrors the map (GYM-15), and every
  sprite button has an accessible name like "Mia, resting, flat bench".
- **Zoom**: pages still work at 200% browser zoom without horizontal
  scrolling on Paper pages.

## 13. Every page designs these states

A page design isn't done until each state that applies is drawn, one after
another, in its mockup.

| State | What it must show |
| --- | --- |
| **Default** | Realistic Australian data: real lift names, kg, plausible numbers (`Bench press · 82.5 kg × 8`), names from a mixed squad (Mia, Ji-woo, Tom, Priya). |
| **Empty** | First use: no history, a room with only you. A friendly line from the copy bank and the one action that fixes it. |
| **Error** | Every form error under its field in `.error`, and the page-level failures (wrong passcode, room full, server error). |
| **Pending** | What happens between tap and response on a slow connection: the button disabled with its label kept, never a spinner that hides the numbers. |
| **Success** | Confirmation in place (`.bubble` on Paper, `.banner` in the gym), never a separate page. |
| **Signed out** | Pages that need an account redirect to sign in; invite links (`/join/:code`) keep the code through sign up. |
| **Reconnecting** (gym only) | The connection dropped: a small `Reconnecting…` chip in the top bar. Logging keeps working; nothing turns red. |
| **Each person state** (gym only) | Idle, Lifting, Resting, Slacking, Finished, and Away, for you (bottom panel) and for someone else (map and people list). |
| **Narrow and wide** | 390 px and 1280 px, checked with `scripts/shot.mjs`. |

## 14. Ruled out

No design may use any of these.

- Rounded corners, soft or blurred shadows, glassmorphism, gradients (the floor
  checker and the select arrow are the only gradients, and they draw pixels).
- Any font other than Press Start 2P and VT323; faux bold or italic.
- Photos, stock illustrations, smooth vector art, or anti-aliased sprites.
- Fractional scaling of pixel art.
- Colours outside the tokens; red used for anything but Slacking and errors.
- State shown by colour alone, or by emoji.
- Anything that delays **Start set** or **Done**: a modal, a confirmation, a
  required animation, a banner over the bottom panel.
- Required swipes, drags or long-presses.
- Guilt and growth-hacking patterns: streak-loss shaming, countdown pressure
  outside the rest timer, nagging prompts to invite more friends, leaderboards
  against strangers, infinite feeds.
- Swearing, and jokes about bodies, weight or ability.
- A hamburger menu when there are three items or fewer; carousels.
- Lorem ipsum, or imperial units.
- Third-party requests for fonts, icons or scripts.

## 15. Known gaps in the current code

Places where `Layout.astro` doesn't yet meet this document. Fix them when the
page that shows them is next touched.

1. **Focus ring on Paper fails contrast.** `:focus-visible` uses `--focus`
   yellow on every surface (1.4:1 on `--paper`). Switch Paper to the ink ring
   in section 12.
2. **Button hover fails contrast.** `button:hover` uses `#26804a`, giving
   4.2:1 with the 12 px label. Use a darker hover such as `#1a5c32` (6.8:1)
   and make it a token.
3. **Display sizes off the 8 px grid.** `h2` 14 px, `h3` and buttons 12 px,
   table headers 10 px and badges 9 px render Press Start 2P slightly blurred.
   Move them to 8 or 16 px.
4. **Night tokens and state tokens don't exist yet.** Add them to `:root` with
   the gym page in week 10.
5. **Hard-coded hex values** (`#dbe7c6`, `#eef5e1`, `#26804a`, `#d6ef86`) in
   the layout should become tokens.

## 16. Open questions

For the user to decide; the designer agent should not settle these alone.

- **Map size.** A map 10 tiles wide gets a 2× zoom on a 360 px phone (320 px)
  and fits 12 stations, a water cooler and an entrance only if laid out
  tightly. A wider map drops to 1× on small phones, with 16 px avatars, which
  is too small to read. Decide the tile dimensions before drawing tiles.
- **Final name.** "Spotter" is still a working title (spec open questions);
  the logo and copy assume it.
- **Slap.** The copy and the menu keep the slap; revisit after the Crit 9 pod
  has used it.

## Sources

Gen Z guidance here is grounded mainly in the spec's own research (README) and
in design-trade writing, which is opinion rather than peer-reviewed research:

- [Design for Nostalgia: why pixel art and retro UI are dominating 2025](https://www.newsletter.designproject.io/p/design-for-nostalgia-why-pixel-art-and-retro-ui-are-dominating-2025): "secondhand nostalgia" for pixel aesthetics via Stardew Valley and Minecraft.
- [Dark mode design becomes a Gen Z expectation (Digital Silk, 2025)](https://www.newsfilecorp.com/release/252131/Dark-Mode-Design-Becomes-a-Gen-Z-Expectation-in-2025-Reports-Digital-Silk): demand for dark and dual-mode interfaces.
- [Designing for Gen Z (Aufait UX)](https://www.aufaitux.com/blog/gen-z-digital-design-strategies/): scepticism of polished, template-like design.
- [W3C, WCAG 2.2](https://www.w3.org/TR/WCAG22/): contrast (1.4.3, 1.4.11), focus appearance, target size (2.5.8), three flashes (2.3.1).
