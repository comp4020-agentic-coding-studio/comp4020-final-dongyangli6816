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

**Gen Z is the audience; friends are where it starts.** The vision
(`docs/product/vision.md`) is a social space for people who train, where
strangers from an online community, or the shy person on the next bench,
meet in the same gym. Today's rooms are still friends-only, but nothing
should be drawn so that it only makes sense between friends: a page that
would read as hostile or confusing from a stranger says so under
Departures.

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
- **The eight sent emoji are pixel art** (INT-8: Hi, Flex, Fire, Clap, Haha,
  Dead, Eyes, Love, in `src/sprites/emoji.ts`), never the phone's glyphs.
  Phone emoji stay only in copy, under the rules above.

### Copy bank

Use these, or match their voice.

| Where | Copy |
| --- | --- |
| Own screen while Slacking (GYM-11) | `Your squad can see you 👀` |
| Rest over (LOG-5) | `Rest's up. Back under the bar 🔔` |
| Cheered (INT-3) | `Mia is hyping you up 🔥` |
| Poked while resting or slacking (INT-3) | `Mia poked you. Rest's over? 👉` |
| Poked in any other state (INT-3, int.md D4) | `Mia poked you 👉` |
| Slapped (INT-3) | `Mia slapped you back to work 👋` |
| Slap refused, target lifting (INT-2) | `Ji-woo is mid-set. Cheer instead?` |
| Slap refused, target finished (INT-2, int.md D5) | `Ji-woo's done for today. Cheer instead?` |
| Target has left (INT-2) | `Tom's left the gym.` |
| Rate-limited (INT-4) | `Easy, give them 10 seconds.` |
| An interaction, preset or emoji didn't send | `That didn't send. Try again.` |
| Thanked (INT-9) | `Ji-woo says thanks 🙏` |
| Poked back (INT-9) | `Ji-woo poked you back 👉` |
| Slapped back (INT-9; not "slapped you back", which is Slap's own line) | `Ji-woo returned the slap 👋` |
| Reply too late (INT-9) | `Too late to answer that one.` |
| Reply sent twice (INT-9) | `Already answered.` |
| Offered a high-five (INT-10) | `Mia wants a high-five ✋` |
| The offer's bubble, over the offerer (INT-10) | `@Ji-woo` then `Up top ✋` |
| A high-five happened, to the offerer (INT-10) | `Ji-woo high-fived you 🙌` |
| Your offer lapsed (INT-10; only you see it) | `Ji-woo left you hanging ✋` |
| High-five to someone Away (INT-10) | `Ji-woo's away right now.` |
| Accepting after 10 s (INT-10) | `Too slow. Mia's hand is down.` |
| Your own PB, the logged stamp (GYM-17) | `New PB: 105 kg × 5 🏆` |
| Someone's PB, the room banner (GYM-18; no numbers, ever) | `Mia hit a PB on back squat 🏆` |
| Their PB, in their menu for 30 s (GYM-18) | `Just hit a PB on back squat` |
| Sent, target out of view (INT-11) | `You cheered Mia 🔥` · `You poked Mia 👉` · `You slapped Ji-woo 👋` · `You thanked Mia 🙏` · `You poked Tom back 👉` · `You returned Ji-woo's slap 👋` · `You offered Ji-woo a high-five ✋` · `You high-fived Mia 🙌` |
| Room log lines (INT-5, GYM-18) | `Ji-woo thanked Mia` · `Ji-woo poked Mia back` · `Ji-woo returned Mia's slap` · `Mia and Ji-woo high-fived` · `Mia hit a PB on bench press` |
| The sound setting's three values (INT-12) | `All sounds` · `Rest timer only` · `Sound off` |
| Empty room log (INT-5) | `Quiet in here. Tap someone on the map to cheer them on 👀` |
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
  number that fits (spec "Rendering"): 10 × 10 tiles of 32 px, so 320 px at
  1× on a phone or a short laptop, 640 px at 2× where that fits (ADR 0005).
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
- **`.avatar`**: a sprite inside a `<button>`. The sprite is 32 × 32 drawn at
  the map's scale, but the button's hit area is at least 44 × 44 px. A name
  tag (VT323, `--paper` on `#000` at 70%) floats above it, with a speech
  bubble above that when the person sends a preset, and an emoji pop when
  they send an emoji.
- **`.menu`**: the interaction menu (INT-1) that opens on another person's
  avatar or squad row (Dony's too): their head, name and state chip (plus
  Away), then **Cheer**, **Poke**, **Slap**, **Message** as 48 px rows.
  Cheer, Poke and Message are always available (Message swaps the rows for
  the ten presets in two groups). **Only Slap has a state rule: it is
  disabled, not hidden, while the target is Lifting or Finished**, with the
  reason in words under the rows ("Ji-woo is mid-set. Cheer instead?",
  "Ji-woo's done for today. Cheer instead?"); within 10 s of your last
  interaction with them, Cheer, Poke and Slap are disabled with "Easy, give
  them 10 seconds." (int.md D4, D5, D6). A ▶ cursor and a leaf fill
  highlight the fitting moves: Poke and Slap on a slacker, Cheer on a
  lifter, nothing otherwise. Beside the avatar on a laptop; pinned just
  above the dock on a phone, never over it. Traps focus; closes on Escape,
  a tap outside (which still reaches what it hit), or an action.
  **Room feel (4 Nov, room-feel.md)**: **High-five** is a fifth move,
  between Slap and Message, unavailable while the target is Away ("Ji-woo's
  away right now.") and during the 10 s. While you can answer that person
  (a reply for 30 s, or their open High-five for 10 s) the menu's **first
  row is the answer** (`li.answer`: Thanks, Poke back, Slap back, or
  High-five to accept), highlighted, with a dashed rule under it; it goes
  in place when the window ends. For 30 s after their PB, Cheer and
  High-five are highlighted under one gold line ("Just hit a PB on back
  squat"). Highlight order: an open offer, a reply, a fresh PB, then state.
- **`.banner`**: the message you get when someone interacts with you (INT-3):
  an RPG text box, ink on paper with the sender's head. At the top of the
  map on a laptop, fixed to the top of the screen on a phone; never covers
  the bottom panel, never takes focus, a newer one of any kind replaces it,
  `role="status"` on its line. **It may carry one button** (`.banner-act`,
  room-feel.md): the answer (Thanks, Poke back, Slap back), High-five to
  accept an offer, or Cheer on the room banner, at the box's bottom right,
  drawn as the menu's highlighted row with the ▶ cursor. Only the button
  takes taps, and not in its first half second (the ▶ appears when it goes
  live); it's reachable by Tab, never focused by itself. **6 s with a
  button, 4 s without.** On a laptop, a banner about someone standing in
  the map's top three rows sits at the map's foot instead, so it never
  covers them.
- **`.banner.room`**: the room banner (GYM-18), the only banner sent to
  everyone at once: a PB. The same box with a gold (`--finished`) ring and
  a gold "PB" tab with the medal icon on its border, the person's name and
  the lift, **never numbers**, and one Cheer button. Not on the lifter's
  own screens.
- **The PB stamp** (`.stamp.pb`, GYM-17): the logged stamp in gold with the
  medal, "New PB: 105 kg × 5 🏆", in the stamp's own place and time. The
  lifter's only confirmation; nothing new near Done.
- **The confirmation line** (`.note.sent`, INT-11.5): where refusals
  appear, solid leaf with a tick where a refusal is dashed, 2 s, only when
  the person you acted on is out of view.
- **`.sound`**: the sound setting (INT-12), a small sign on the gym map
  panel's bottom border at the right, opposite the passcode: icon and value
  in words (All sounds, Rest timer only, Sound off); one tap moves it on.
  Never in the dock, a menu or the tray; never prompts.
- **`.say`** (preset bubble) and **`.pop`** (emoji pop): over the sender on
  the map, each in its own layer: bubbles over avatars for 5 s, addressed
  "@name"; pops under avatars for 3 s, so a pop never covers a name tag.
- **`.emote`** and **`.tray`**: the emoji tab on the dock's top border, in
  every panel state, and the 4 × 2 tray of eight pixel emoji it opens,
  always at least 48 px clear of the dock's button (INT-8).
- **`.room-log`**: a panel under the squad list with the newest presets and
  interactions (INT-5), and since 4 Nov replies, finished high-fives and
  PBs (a gold medal, no numbers); lines about you edged in leaf; no emoji,
  no lapsed offers, nothing of Dony's PB.
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

The look is the Game Boy Color and Game Boy Advance Pokémon overworld:
top-down, 32 px tiles, small sprites, few colours, two-frame animations. The
style is borrowed; no Nintendo assets are. ADR 0005 moved the art from 16 px
to 32 px and says why.

- **Sprites are data**: character grids in `src/sprites/`, one module per
  subject, rendered once per palette in the browser (spec "Art direction").
- **At most 7 colours per sprite plus transparency** (was 4). An avatar's
  are skin, hair, shirt and outline (`--ink`), plus a darker shade of skin,
  hair and shirt. A shade comes with its colour choice, so a look is still
  three choices and recolouring stays a palette swap. Props a pose holds (the
  bar, the bottle, the phone's glow) are drawn over it in interface tokens
  and don't count. The avatar's body may use the same three fixed tokens,
  `--dim`, `--paper` and `--resting`, which don't count either: the eye
  catchlights and the white sneakers are what make the figure read as a
  person at 1×.
- **32 × 32 per sprite and tile.** The 8 × 8 interface icons, the logo and the
  Paper checker are interface, not art, and stay as they are.
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
  small pixel phone glow; Finished stands with its tag; Away is faded to
  50% with the phone-off icon above the head.
- **Acting interactions out** (room-acting.md, since 5 Nov; room spec
  "Acting it out, Nov 5", A.11). Off a machine, people have body frames
  for interactions: the walker's moves (`reach`, `swing`, `point`, `cheer`,
  `bow`), the target's reactions standing (`crouch`, `startle`, `recoil`)
  and sitting (`sit-cheer`, `sit-startle`, `sit-recoil`, `sit-reach`), all
  drawn on the shared body with moving arms as props, so every hair, skin,
  shirt and Dony's head get them, and all drawn facing east (the page
  mirrors them). On a machine there are no reaction frames: a Lifting
  sender's gesture is one hand layer (`hand1`, `hand2`) drawn over any
  machine in their own colours, and a Lifting target keeps the machine's
  loop with an effect over it. Each move has a travelling effect (star,
  finger, glove, heart, palm) and the High-five a smack, in the reaction
  palette. A new standing-type pose needs these reactions drawn, or falls
  back to the effect and jolt.
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
  resting; when lifting, 250 ms on the treadmill and 400 ms elsewhere.
- **Walking** moves a tile at a time along the aisles at about 8 tiles a
  second.
- **Banners** slide in over 160 ms in 4 steps and leave the same way; they
  stay 4 s, or 6 s when they carry a button.
- **Interaction reactions** (cheer sparkle, poke finger and "!", slap glove,
  POW and dizzy stars; since 4 Nov thanks hearts, the return arrow on Poke
  back and Slap back, the High-five's palms) are effects that play on every
  screen. Each lasts **at most 1.5 s** (about 1 s in practice: in, a held
  peak, out); frames may have their own lengths, and the sprite may move as
  a whole (a hop of 4 sprite pixels, 2 seated; a nudge; a shake), and the
  name tag never moves and draws over its own body. The room spec ("Room
  feel, Nov 4", F.6) has every effect frame and time.
- **Interactions are acted out** (since 5 Nov, room-acting.md; room spec
  "Acting it out, Nov 5", A.2 to A.10). A sender who isn't Lifting **walks
  over** along the aisles at the walk's pace to a tile diagonally in front
  of the target, does the move there in body frames, and walks straight
  back. A Lifting sender never leaves the machine: they **gesture** (a hand
  over the machine, 400 ms) and an **effect travels** to the target in
  tile steps of 125 ms, landing **within 1 s**. Off a machine the target
  **reacts with their body** (hop, startled jump, cartoon recoil, bounce)
  with the effect over it; on a machine, or walking, it stays the effect
  and a jolt. The target's banner, sound and reaction land together at
  **the hit**, at most **2.5 s** after the move arrives (capped at **3 s**,
  after which it is delivered by travelling effect); the walker is **back
  within 6 s**. One errand per avatar, never queued; nothing about it is
  stored. **Reduced motion**: nobody walks and nothing flies; one still
  frame of the move at the sender's place and one of the reaction at the
  target's, for about 1 s, at once.
- **The PB flex** is a body pose (two frames), up to **2 s** (1.9 s drawn),
  in front of the station, then the avatar goes where its state puts it.
  It never delays the lifter's own sheet. Reduced motion: one still frame
  for about 1 s.
- **No flashing**: nothing on the map changes brightness more than three
  times a second (the PB confetti swaps 2.5 times).
- **Emoji pops** rise 8 px in two steps and go at 3 s; bubbles go at 5 s.
- **Rest-over flash** (LOG-5): the bottom panel's border flashes `--leaf` at
  most twice a second, three times, never the whole screen. WCAG forbids more
  than three flashes a second.
- **Sound**: short chiptune blips made with the Web Audio API (square wave),
  no audio files (room-feel.md, INT-12; this replaces the earlier "rest-over
  sound only"). **All sounds are on by default**: things that are about you
  (an interaction, reply, High-five offer or preset to you), a short tick
  when your own move or emoji lands, the High-five sound for the two people
  in it, the PB fanfare for everyone in the room, and the rest-over sound.
  Never for other people's moves or emoji, Dony's emoji, a refusal or a
  lapse. Every interaction sound is quieter than the rest-over sound, and
  at most **one interaction sound a second** plays; the fanfare and the
  rest-over sound always play. **The sound setting** has three values,
  **All sounds**, **Rest timer only** and **Sound off**, kept in that browser
  only (nothing on the server), and lives on the room page as a sign on the
  gym map's bottom border (there is no gym menu). It never prompts. Sound
  never carries information on its own; the flash and text do.
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
  announced one by one. **The one exception is a PB's room banner**
  (GYM-18): every screen reader in the room hears it once ("Mia hit a
  personal best on back squat"), because it is rare and the point is that
  the whole room notices. A button on a banner is reachable by Tab while it
  shows and never takes focus by itself; its name says who it answers
  ("Slap back Ji-woo"). The sound setting's new value is announced once.
- **Sound needs a gesture**: the page may play sound only after the person
  has tapped, clicked **or pressed a key** on it, so a keyboard-only person
  hears the rest-over sound too. Until then sounds are skipped silently,
  with no prompt.
- **No required gestures**: taps only. No swipe, drag or long-press is needed
  for anything (MVP spec "UX rules").
- **Text alternatives**: the people list mirrors the map (GYM-15), and every
  sprite button has an accessible name like "Mia, resting, flat bench".
- **A walking avatar** (an errand, or any walk) stays selectable by tap,
  click and keyboard and keeps its place in the tab order; keyboard focus
  stays on it while it moves (the ring moves with it), and a menu already
  open on it stays where it opened. Its accessible name stays the one its
  state gives, never "walking to Ji-woo", and nothing about a walk, a
  gesture or a flight is announced: the banner and the room log say what
  happened.
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

- **Final name.** "Spotter" is still a working title (spec open questions);
  the logo and copy assume it.
- **Slap.** *Settled 22 Oct* (int.md D5): kept, refused while the target is
  Lifting or Finished; INT-7 (turn slaps off) is the answer if it lands
  badly.

## Sources

Gen Z guidance here is grounded mainly in the spec's own research (README) and
in design-trade writing, which is opinion rather than peer-reviewed research:

- [Design for Nostalgia: why pixel art and retro UI are dominating 2025](https://www.newsletter.designproject.io/p/design-for-nostalgia-why-pixel-art-and-retro-ui-are-dominating-2025): "secondhand nostalgia" for pixel aesthetics via Stardew Valley and Minecraft.
- [Dark mode design becomes a Gen Z expectation (Digital Silk, 2025)](https://www.newsfilecorp.com/release/252131/Dark-Mode-Design-Becomes-a-Gen-Z-Expectation-in-2025-Reports-Digital-Silk): demand for dark and dual-mode interfaces.
- [Designing for Gen Z (Aufait UX)](https://www.aufaitux.com/blog/gen-z-digital-design-strategies/): scepticism of polished, template-like design.
- [W3C, WCAG 2.2](https://www.w3.org/TR/WCAG22/): contrast (1.4.3, 1.4.11), focus appearance, target size (2.5.8), three flashes (2.3.1).
