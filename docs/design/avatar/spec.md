# Avatar editor (`/avatar`) design spec

Mockup: `docs/design/avatar/mockup.html` (open it in a browser). Screenshots:
`node scripts/shot.mjs docs/design/avatar/mockup.html .shots/avatar/mockup` (not
kept in git).

**New page, 8 Oct 2026 (Lobby group).** Designed with `home` and `join`. Build at `src/pages/avatar.astro`, and add `avatar` to the Lobby row of the design-group table in `CLAUDE.md` (and to the design-gate hook's route map) in the same commit.

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
  900 px). A list's head crop is `viewBox="2 0 28 22"` at 2× (56 × 44 px).
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

- **New account**, seconds after sign up, on a phone: they get a random
  look and either keep it or tweak it, then get on with joining the squad.
  No pressure, one tap to leave.
- **Showcase and downtime:** someone on a laptop or phone poking at choices
  to look funny next to their mates (pink hair, orange shirt). Fun to tap,
  never a chore.
- Never between sets: nothing in the gym routes through here.

### The one job

**Pick a look and keep it.** The primary action is **Save**. Randomise is
secondary.

### Hierarchy

1. The live preview: you on the floor, with your name tag.
2. The four choices, in the order the eye reads a sprite: skin, hair style,
   hair colour, shirt.
3. **Save**, at the bottom of the card, in the thumb zone.

There are no numbers to read on this page.

### Reuse

- **Existing:** `.card`, `.bubble`, `.actions`, `.wide`, `.button.secondary`,
  `.error`, `.hint`, and the shared Lobby `.floor`, `.stand`, `.nametag`,
  `.av`, `.lead`, `.lobby-alt` and `.status-line`.
- **The props** (kettlebell, dumbbell) are signup's, from
  `src/sprites/props.ts`.
- **New:** `.swatch`, which the system already names in section 9, built as
  `.pick.swatch`. Also `.pick.style` (a hair-style tile showing your own head
  in that style), `.pick-group` (fieldset) and a `.sr-only` utility. Two new
  8 × 8 icons, `tick` and `die`, go in `src/sprites/icons.ts`.
- **A new avatar renderer** is needed: Sprite.astro fills each rect with a
  fixed hex value, and a palette swap needs class-based fills (below).

### What the template check changed (this page)

The first pass was a settings form: a preview box, four rows of colour
circles and a Save button. What changed:

- **The preview is the gym floor, with your name tag, at a whole-number
  zoom, bobbing.** It is signup's floor with the same kettlebell and
  dumbbell, so the person recognises "me in the gym" from sign up.
- **Hair styles are shown as your own head** in your current skin and hair
  colour, not as icons or words alone. Changing hair colour recolours all
  four tiles at once, so it reads like trying things on.
- **The colours are a palette chart:** square swatches, in rows of four, in
  a pixel border, like a Game Boy Color palette. No circles, no gradient
  picker.
- **Randomise is a die roll**, and the new-account bubble says so: `We
  rolled you a random look. Keep it, or make it yours 🎲`.

## 2. Requirements covered

| Requirement (source) | Element |
| --- | --- |
| AV-1 "skin tone, hair style (4), hair colour and shirt colour, stored as JSON on the user, never as an image" (4-week spec) | Four `fieldset.pick-group` radio groups: `skin` (6), `hair` (4), `hair_colour` (8), `shirt` (8). Saved as `{"skin":"3","hair":"long","hairColour":"dark-brown","shirt":"teal"}` in `users.avatar` |
| AV-2 "sprites drawn from code… Colours are palette swaps" | One body grid and four hair grids in `src/sprites/avatar.ts`. Colours are three custom properties, `--av-skin`, `--av-hair` and `--av-shirt`; the outline is `--ink` |
| AV-3 "A new account gets a random avatar it can edit straight away, with a live preview playing the idle animation" | Random roll at sign up. The **new account** state at `/avatar?new=1`. The `.floor.preview` plays the two-frame idle loop |
| Task: "choices must be real form controls (radio groups) so it works without JS and by keyboard, 44 px tap targets" | Real `<input type="radio">` per choice, covering its 44 × 44 swatch or 64 px-tall tile. Arrow keys move inside a group, Tab between groups |
| Task: live preview without JS | CSS `:has()` sets the palette from the checked radios (Structure, "Live preview") |
| Spec "Screens": "Avatar editor: live preview, choices, randomise, save" | `.preview`, `.choices`, **Randomise**, **Save** |
| System 10 "6 skin tones… 4 hair styles, 8 hair colours (natural plus a few bright dyed), 8 shirt colours… distinguishable from the state colours" | Palettes below. No shirt is red, and none matches a state fill: leaf, water blue, slacking coral and trophy yellow are all avoided |
| System 10 "At most 4 colours per sprite… outlines are `--ink`" | Body: ink, skin, shirt. Hair overlay: ink, hair. Four in total |
| System 10 "Hair… overlay layers drawn at a head anchor" (4-week spec, Art direction) | Hair grids are drawn over the body inside the bobbing group, so they follow the head in every frame |
| System 9 `.swatch` "A 44 px square of the colour with an ink border; the chosen one gets a `--leaf` inner ring and a tick" | `.pick.swatch` exactly. The tick is a leaf badge with an ink tick, so the choice is never shown by colour alone |
| System 12 keyboard, focus ring, 44 px targets | The ink ring is drawn on `.face` when the radio has `:focus-visible`. Swatches are 44 px, tiles 64 px tall, buttons 48 px |
| System 8 "primary action in the bottom third"; "one primary button" | **Save** `.wide` at the card's end. Randomise and Later are secondary |
| System 11 "two frames… about 400 ms per frame"; reduced motion freezes loops | `.floor .av-top` 800 ms `steps(1)`, `none` under `prefers-reduced-motion` |
| System 13 Success: "confirmation in place (`.bubble`)" | `Saved. That's you in the gym now 💪` above the card |
| System 13 Signed out: "Pages that need an account redirect to sign in" | 303 to `/signin?next=/avatar` |
| ACC-4 "display names… shown above the person's avatar" | `.nametag` over the preview |

## 3. Structure

The page shell is the layout's (Paper, signed-in nav). Bold names are new,
from `<style id="page">`.

1. *(state only)* `p.bubble`: the new-account or saved line (States).
2. `div.card`, with an inline `style` holding the **saved** palette:
   `--av-skin: …; --av-hair: …; --av-shirt: …`. Browsers without `:has()`
   draw the saved look from it.
   1. `h1` `Your avatar`; `p.lead` `This is you in the gym.`
   2. `form.`**`editor`** `method="post" action="/avatar"`. Phones use one
      column. From 900 px it is a grid: `16rem 1fr`, areas
      `preview choices / shuffle choices / actions actions`, rows
      `auto 1fr auto`.
      - `div.floor.`**`preview`** `aria-hidden="true"`:
        - `svg.floor-prop.kettlebell`, then `div.stand` > `span.nametag`
          {displayName} + the avatar `svg.av` with **all four** hair groups
          and `data-hair="{saved style}"`, then `svg.floor-prop.dumbbell`.
        - `--s` is 3px on phones (96 px) and 4px from 900 px (128 px). The
          props scale with it: the kettlebell is 12 × 12 sprite pixels with
          its left edge at `50% - 26 * --s`, the dumbbell 16 × 8 at
          `50% + 14 * --s`, one sprite pixel beyond each hand (the body
          spans columns 3 to 28).
        - `position: sticky; top: 0` on phones, so the preview stays in view
          while you scroll the swatches. Not sticky from 900 px.
      - `button.button.secondary.`**`shuffle`** `type="submit"
        form="avatar-shuffle"`: the `die` icon + `Randomise`. Its `form`
        attribute points at a separate form, so pressing Enter on a radio
        submits **Save**, never Randomise (Save is the main form's only
        submit button).
      - `div.`**`choices`** > four `fieldset.`**`pick-group`**, each with a
        `legend` (`Skin tone`, `Hair`, `Hair colour`, `Shirt`):
        - **Swatch groups** (`skin`; `hair_colour` and `shirt` with
          `.swatches.`**`of-8`**, a 4-column grid): each choice is
          `label.`**`pick swatch`** `title="{name}" style="--c: {hex}"`
          containing `input[type=radio][name][value]`, `span.face`,
          `svg.tick` (8 × 8 at 2×) and `span.`**`sr-only`** `{name}`.
          Skin names are `Skin tone 1, lightest` … `Skin tone 6, deepest`.
          The skin group is one row of 6 at both widths.
        - **Hair** (`div.`**`styles`**, a 2 × 2 grid): each choice is
          `label.`**`pick style`** containing the radio, then `span.face`
          holding a head-only `svg.av` (`viewBox="2 0 28 22"`, 2×, 56 × 44 px,
          only that style's hair group) and the visible name (`Crop`,
          `Curls`, `Long`, `Ponytail`), then `svg.tick`. A chosen tile
          fills `--leaf`.
      - *(error only)* `p.error#save-error`.
      - `div.actions` > `button.wide[type=submit]` `Save` (no `name`; an
        absent `intent` means save).
      - `p.hint.status-line[role=status]`: empty, `Not saved yet.` or
        `Saving…`.
   3. `form#avatar-shuffle method="post" action="/avatar"` with
      `input[type=hidden][name=intent][value=randomise]` (and `next`, if
      present), placed after the main form, since forms can't nest.
3. *(new account only)* `div.lobby-alt` > `p.hint` `Change it any time from
   home.` + `a.button.secondary[href={next}]` `Later`.

### The sprite (`src/sprites/avatar.ts`)

One body grid with no hair, plus four hair overlays drawn from row 0. Slot
letters: `k` ink, `s` skin, `t` shirt, `h` hair, and `S`, `T`, `H` for the
darker shade of each. The 32 × 32 grids, the shades and the prop and doorway
art are in "Appendix: 32 × 32 art (ADR 0005)" at the end of this spec, the
only copy.

The palettes are ordered as they appear. `id` is the stored value and
`name` the accessible name.

Each swatch also has a hand-picked shade (`shade`), listed in the appendix.

| `skin` | hex | `hair_colour` | hex | `shirt` | hex |
| --- | --- | --- | --- | --- | --- |
| `1` Skin tone 1, lightest | `#f6d7bd` | `black` Black | `#1d1714` | `purple` Purple | `#6a4c93` |
| `2` Skin tone 2 | `#e9bd94` | `dark-brown` Dark brown | `#4a2c1a` | `navy` Navy | `#2e3f7f` |
| `3` Skin tone 3 | `#d09a68` | `brown` Brown | `#7d4e2b` | `teal` Teal | `#1f8a86` |
| `4` Skin tone 4 | `#ad7447` | `ginger` Ginger | `#b5552a` | `charcoal` Charcoal | `#3b3b45` |
| `5` Skin tone 5 | `#8a5532` | `blonde` Blonde | `#d6ad55` | `orange` Orange | `#e07b28` |
| `6` Skin tone 6, deepest | `#6e4429` | `silver` Silver | `#c3c7bd` | `pink` Pink | `#d65a9a` |
| | | `pink` Pink | `#e46fae` | `white` White | `#eeeee6` |
| | | `blue` Blue | `#4d6bd6` | `grey` Grey | `#8c8f94` |

Mockup people, so every page draws them the same:

| Person | Skin | Hair | Colour | Shirt |
| --- | --- | --- | --- | --- |
| Mia | 3 | long | dark-brown | teal |
| Tom | 1 | crop | ginger | navy |
| Ji-woo | 2 | ponytail | pink | white |
| Priya | 5 | curls | black | orange |
| Priya's first random roll | 5 | crop | blue | purple |

### Rendering: a new `Avatar.astro`

- **Props:** `avatar` (the JSON), `editor?: boolean`, `head?: boolean`,
  `class`.
- **Output:** `svg.av` with `viewBox="0 0 32 32"` (or `"2 0 28 22"` for
  `head`). It contains `g.av-top`, holding body rows 0 to 25 and the
  hair group or groups (`g.hair.hair-{style}`), followed by body rows 26 to
  31 (`AVATAR_UPPER_ROWS = 26`).
- **Rects carry a class per slot** (`k`, `s`, `t`, `h`, `S`, `T`, `H`),
  never a `fill`.
  The shared CSS maps them: `.av .s { fill: var(--av-skin) }` and so on.
- **Variables:** outside the editor, the SVG gets an inline
  `style="--av-skin:…;--av-skin-2:…;--av-hair:…;…"`, each colour with
  its shade. In the editor they come
  from the card and the `:has()` rules instead.
- **Hair groups:** outside the editor, only the chosen one is rendered.
  With `editor`, all four are rendered, plus `data-hair`.
- **Sizes:** whole-number multiples of 32 via CSS (`.floor .av` uses
  `--s`): 64 px on home and join, 96 or 128 px in the editor, and the head
  crop at 56 × 44.

### Live preview with no JavaScript

These rules are generated from the palettes, not hand-copied (for example a
`<style set:html={avatarEditorCss()}>` built in `src/sprites/avatar.ts`):

```css
.preview .hair { display: none; }
.preview .av[data-hair="crop"] .hair-crop, … { display: inline; }   /* no :has() */
.editor:has(input[name="hair"]:checked) .preview .hair { display: none; }
.editor:has(input[name="hair"][value="crop"]:checked) .preview .hair-crop { display: inline; }
.editor:has(input[name="skin"][value="1"]:checked) { --av-skin: #f6d7bd; }
/* … one rule per skin, hair colour and shirt */
```

The variables are set on the form. The saved look sits on the card's inline
style one level up, so the checked radio always wins. The hair-style tiles
inherit the same variables, so they recolour with the preview. The mockup
has the full block.

### Server (`src/pages/avatar.astro`)

- **GET**, signed in: render the saved avatar.
  - `?new=1`: the new-account bubble and the **Later** row.
  - `?saved=1`: the saved bubble.
  - `?next=` is kept: a path starting with `/`, as signup does.
- **POST**, `intent=randomise`: roll each choice and render it checked
  (status 200, **nothing stored**), with `Not saved yet.` in the status
  line.
- **POST**, otherwise (save):
  - Each value must be an id in its palette; anything else is the error
    state, status 400.
  - On success, store the JSON, then 303 to `next` if given, else to
    `/avatar?saved=1`.
- **Sign up** (`src/pages/signup.astro`, server logic only):
  - Store a random avatar on the new user.
  - When `next` is `/` (not an invite), redirect to `/avatar?new=1&next=/`.
    Invites keep going straight to `/join/CODE`.
  - An existing user with a null avatar gets one rolled and stored on first
    read.

### Script (progressive, runs on `astro:page-load`, only on `/avatar`)

- **Randomise:** `preventDefault`, check one random radio per group, then
  update the status line. No request.
- **Status line:** on any `change`, compare with the saved values (from
  `data-saved-*` on the form, or a `FormData` taken at load), and show
  `Not saved yet.` or nothing.
- **On submit of Save:** disable it, set `aria-busy`, and set the status to
  `Saving…`.
- **`pageshow`:** re-enable, as signin does.

The mockup's inline script shows the first two.

## 4. States

| State | Trigger | What changes |
| --- | --- | --- |
| **Default** | GET `/avatar`, signed in (from home's tile or Edit avatar) | Saved look checked and previewed; status line empty. Mockup: Mia |
| **New account** (empty-ish: first use) | `/avatar?new=1&next=/`, straight after sign up | `p.bubble` `We rolled you a random look. Keep it, or make it yours 🎲` above the card; `.lobby-alt` below it: `Change it any time from home.` + **Later** → `next`. Save also goes to `next`. Mockup: Priya's roll |
| **Changed, not saved** | Any radio changed, or Randomise (JS: local; no JS: POST `intent=randomise`) | Preview and tiles show the new look; status line `Not saved yet.`. Mockup: Mia rolled silver curls and an orange shirt |
| **Pending** | Save submitted on a slow connection | Save `disabled` (pressed, `--muted`, label kept); form `aria-busy`; status `Saving…`. Choices stay as picked |
| **Success** | 303 back to `/avatar?saved=1` | `p.bubble[role=status]` `Saved. That's you in the gym now 💪`; the new look is now the saved one |
| **Error** | POST save fails (server error, or a value not in the palette): 400/500 | `p.error` above Save: `Couldn't save your avatar. Check your connection and try again.`; the posted choices stay checked so nothing is lost; Save is `aria-describedby` the error |
| **Signed out** | No session | 303 to `/signin?next=/avatar`; no screen |
| **Without JS / without `:has()`** | — | Same screen. Without JS the preview still updates (CSS), Randomise posts. Without `:has()` the preview shows the saved look until Save |
| Narrow and wide | — | Phone: one column, sticky preview at 3× (96 px). 900 px and up: preview at 4× (128 px) and Randomise in a 16 rem left column, choices right, Save across the bottom |

## 5. Departures

- **The avatar SVG uses classes and custom properties for fills**, not
  Sprite.astro's `fill` attributes. The hex values still come only from the
  sprite palette module (system 5 allows hex there). This is what makes the
  palette swap and the no-JS preview possible.
- **4× (128 px) on laptops, not 5×.** At 5× the kettlebell and dumbbell no
  longer fit on a 16 rem floor beside the 26-pixel-wide body. 4× is a whole
  number (ADR 0005).
- **Hand-picked shades, not the ink mix** (ADR 0005 allows either). Mixing
  towards the green ink turns skin olive and white, silver and blonde
  grey-green; the appendix gives every swatch its own shade.
- **The sticky preview on phones** is new to Paper pages. It only sticks
  inside the editor form, and it is never over a button the person needs.
- **Skin tone 6 is dark enough that the ink eyes are low-contrast**
  (about 1.9:1). They are decoration; the name tag carries identity. If it
  reads poorly in the gym, lighten tone 6 a step rather than recolouring the
  eyes, which would add a fifth colour.
- **8 hair colours and 8 shirts, not 4 to 6** as the brief suggested: system
  section 10 fixes 6 / 4 / 8 / 8, and the system wins.

### Open questions (for the main agent or the user)

- **Sign up → avatar.** Sending new, non-invite accounts to `/avatar?new=1`
  is a server-only change in `signup.astro`, outside this group. If it's
  declined, AV-3 is still met by home's tile and Edit avatar.
- **Signup's preview** (Auth) still draws the old placeholder sprite. Once
  `avatar.ts` changes, it should draw the new body with a neutral hair and
  palette, or the roll that sign up will store. That's a one-line change to
  the sprite it passes, with no new design.

## Appendix: 32 × 32 art (ADR 0005)

The only copy of this group's art. Every grid was checked by script to be
exactly 32 wide (the props 12 and 16) and is ready to paste into
`src/sprites/`, replacing the 16 × 16 grid and its `upscale()` call. After
that, the mockups' `#doorway32`, `#kettlebell32` and `#dumbbell32`
symbols go back to `/sprites.svg#doorway`, `#kettlebell` and `#dumbbell`.

### The person

Front-facing, 26 pixels wide (columns 3 to 28) and 31 tall (rows 1 to 31).
A big head (rows 1 to 16, two thirds of the height, Pokémon-overworld
proportions), eyes 2 × 3 pixels with a mouth, the shirt's sides and hem in
`T`, the skin's jaw and cheek edge in `S`, trainers in `T` so shoes
follow the shirt. The hair overlays draw their own ink outline over the
head's and keep their lower layer and fringe tips in `H`.

`src/sprites/avatar.ts`, replacing `BODY16`, `HAIR16` and the
`upscale` calls for them (`BODY` and `HAIR` become these directly):

```ts
// Rows 0 to 25 bob in the idle loop: everything above the belt (row 26).
export const AVATAR_UPPER_ROWS = 26;

export const BODY = [
  "................................",
  "..........kkkkkkkkkkkk..........",
  "........kksssssssssssskk........",
  ".......kssssssssssssssssk.......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  ".....ksssskksssssssskkssssk.....",
  ".....kSssskksssssssskksssSk.....",
  ".....ksssskksssssssskkssssk.....",
  "......kSssssssssssssssssSk......",
  "......kSssssssssssssssssSk......",
  ".......kSsssssskkssssssSk.......",
  "........kksssssssssssskk........",
  "..........kkkSSSSSSkkk..........",
  "......kkkktttTTTTTTtttkkkk......",
  "....kkTttttttttttttttttttTkk....",
  "...kTttkTttttttttttttttTkttTk...",
  "...kTttkTttttttttttttttTkttTk...",
  "...kssskTttttttttttttttTksssk...",
  "...kssskTttttttttttttttTksssk...",
  "...kSSSkTttttttttttttttTkSSSk...",
  "....kkkkkTTTTTTTTTTTTTTkkkkk....",
  ".......kkkkkkkkkkkkkkkkkk.......",
  ".......kkkkkkk....kkkkkkk.......",
  "........kssssk....kssssk........",
  "........kSsssk....ksssSk........",
  ".......kTTTTTk....kTTTTTk.......",
  ".......kkkkkkk....kkkkkkk.......",
];

// Overlays start at row 0, column 0: the head anchor of the front-facing idle
// frames. They draw over the head's outline, never inside the face (rows
// 10 to 16, columns 8 to 23).
export const HAIR = {
  crop: [
    "..........kkkkkkkkkkkk..........",
    "........kkhhhhhhhhhhhhkk........",
    ".......khhhhhhhhhhhhhhhhk.......",
    "......khhhhhhhhhhhhhhhhhhk......",
    "......khhhhhhhhhhhhhhhhhhk......",
    "......khhhhhhhhhhhhhhhhhhk......",
    "......khHhhhhhhhhhhhhhhHhk......",
    "......kHHHhHHhhHHhhHHhHHHk......",
    "......kH..H...H..H...H..Hk......",
  ],
  curls: [
    "........kkk.kkkkkkkk.kkk........",
    "......kkhhhkhhhhhhhhkhhhkk......",
    ".....khhhhhhhhhhhhhhhhhhhhk.....",
    "....khhHhhhhHhhhhhhHhhhhHhhk....",
    "....khhhhhhhhhhhhhhhhhhhhhhk....",
    "...khhHhhhhHhhhhhhhhHhhhhHhhk...",
    "...khhhhhhhhhhhhhhhhhhhhhhhhk...",
    "...khHhhHhhhHhhHHhhHhhhHhhHhk...",
    "...khhhHH.HHH.HHHH.HHH.HHhhhk...",
    "...kHhhH...H........H...HhhHk...",
    "...khHhk................khHhk...",
    "...kHhhk................khhHk...",
    "...khHhk................khHhk...",
    "....kHk..................kHk....",
  ],
  long: [
    "..........kkkkkkkkkkkk..........",
    "........kkhhhhhhhhhhhhkk........",
    ".......khhhhhhhhhhhhhhhhk.......",
    "......khhhhhhhhhhhhhhhhhhk......",
    ".....khhhhhhhhhhhhhhhhhhhhk.....",
    ".....khhhhhhhhhhhhhhhhhhhhk.....",
    "....khhhhhhhhhhhhhhhhhhhhhhk....",
    "....khhhHhhhhhhHHhhhhhhHhhhk....",
    "....khhHHH.HHHHHHHHHH.HHHhhk....",
    "....khhH................Hhhk....",
    "....khHk................kHhk....",
    "....khHk................kHhk....",
    "....khHk................kHhk....",
    "....khHk................kHhk....",
    "....khHk................kHhk....",
    "....khHk................kHhk....",
    "....khHk................kHhk....",
    "....khHk................kHhk....",
    "....khHk................kHhk....",
    "....kHHk................kHHk....",
    "....kkkk................kkkk....",
  ],
  ponytail: [
    "..........kkkkkkkkkkkk..........",
    "........kkhhhhhhhhhhhhkk.kkk....",
    ".......khhhhhhhhhhhhhhhhkhhhk...",
    "......khhhhhhhhhhhhhhhhhhkkkkk..",
    "......khhhhhhhhhhhhhhhhhhkhhhk..",
    "......khhhhhhhhhhhhhhhhhhkhhHk..",
    "......khHhhhhhhhhhhhhhhHhkhhHk..",
    "......kHHHhHHhhHHhhHHhHHHkhhHk..",
    "......kH..H...H..H...H..HkhHHk..",
    ".........................khHk...",
    ".........................kHHk...",
    "..........................kk....",
  ],
} as const;
```

Head crop: `viewBox="2 0 28 22"` (columns 2 to 29, rows 0 to 21: the
whole head and every hair style, the curls and ponytail included, plus the
shoulders), shown at 2×, 56 × 44 px, in home's squad list and the editor's
hair tiles. Every overlay ends by row 20, so nothing is cut.

### Shades

Hand-picked for every swatch: the 30 % ink mix in `Avatar.astro` is not good
enough for any palette (it turns light skin olive, white and silver
grey-green, since ink is green). Add each as `shade` on its swatch in
`src/sprites/avatar.ts`; `lookVars()` and `editorCss()` already emit
`--av-*-2` when it's set. Keep the mix only as the fallback.

- **SKINS**: a step down, warmed towards red-brown. `#f6d7bd` → `#e0b69a`, `#e9bd94` → `#cf9a73`, `#d09a68` → `#b37a4f`, `#ad7447` → `#8f5a36`, `#8a5532` → `#6e4026`, `#6e4429` → `#55311d`.
- **HAIR_COLOURS**: a step down, cooled slightly. `#1d1714` → `#3a2e28`, `#4a2c1a` → `#33190f`, `#7d4e2b` → `#5a3319`, `#b5552a` → `#873a1d`, `#d6ad55` → `#ad7f37`, `#c3c7bd` → `#8f929a`, `#e46fae` → `#b4488a`, `#4d6bd6` → `#3446a3`. Black's
  shade is *lighter* than the hair on purpose: a darker black vanishes into
  the ink outline, and a lighter lower layer reads as sheen.
- **SHIRTS**: a step down, cooled slightly. `#6a4c93` → `#4c3470`, `#2e3f7f` → `#1f2a5c`, `#1f8a86` → `#156663`, `#3b3b45` → `#282832`, `#e07b28` → `#b0561a`, `#d65a9a` → `#a83c76`, `#eeeee6` → `#bdbcc4`, `#8c8f94` → `#66686f`.

Against the state colours (AV-1): every shade is darker and less saturated
than its own swatch, so none moves towards `--leaf`, `--resting`,
`--slacking` or `--finished`; the lightest, white's `#bdbcc4`, is a grey
that sits next to the Idle chip's paper without matching it, and no shade is
red. The ghost (`.av.ghost`) sets `--av-skin-2` and `--av-shirt-2` to
`--card` as well, so it stays a clean outline.

### The doorway

`src/sprites/door.ts`, replacing `doorway`'s grid. The lintel carries the
dumbbell sign on a lit panel, the opening shows a lit gym with a squat rack
and its floor, the green door is swung in against the right post, and a mat
lies at the threshold. Same palette as today, plus `p`, five colours:

```ts
export const doorway: Sprite = {
  grid: [
    "................................",
    ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.",
    ".kggggggggggggggggggggggggggggk.",
    ".kggkkkkkkkkkkkkkkkkkkkkkkkkggk.",
    ".kggkllkkllllllllllllllkkllkggk.",
    ".kggklkkkkkkkkkkkkkkkkkkkklkggk.",
    ".kggkllkkllllllllllllllkkllkggk.",
    ".kggkkkkkkkkkkkkkkkkkkkkkkkkggk.",
    ".kggggggggggggggggggggggggggggk.",
    ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.",
    "..kgkaaaaaaaaaaaaaaaaaaaaaakgk..",
    "..kgkllllllllllllllkkkkkkkkkgk..",
    "..kgkllllllllllllllkagggggkkgk..",
    "..kgklllgllllllglllkagggggkkgk..",
    "..kgklglgllllllglglkagaaagkkgk..",
    "..kgklgggggggggggglkagaaagkkgk..",
    "..kgklglgllllllglglkagggggkkgk..",
    "..kgklllgllllllglllkagggggkkgk..",
    "..kgklllgllllllglllkaglgggkkgk..",
    "..kgklllgllllllglllkagggggkkgk..",
    "..kgklllgllllllglllkagggggkkgk..",
    "..kgklllgllllllglllkagaaagkkgk..",
    "..kgkggggggggggggggkagaaagkkgk..",
    "..kgkppppppppppppppkagaaagkkgk..",
    "..kgkppppppppppppppkagggggkkgk..",
    "..kgkppppppppppppppkagggggkkgk..",
    "..kgkppppppppppppppkagggggkkgk..",
    "..kgkppppppppppppppkkkkkkkkkgk..",
    "kkkkaaaaaaaaaaaaaaaaaaaaaaaakkkk",
    "kkkkaaggggggggggggggggggggaakkkk",
    "kkkkaaaaaaaaaaaaaaaaaaaaaaaakkkk",
    ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.",
  ],
  palette: { k: INK, l: "#c8e66b", g: "#1f6b3a", a: "#0f3d22", p: "#e8f0d8" },
};
```

### The floor props

`src/sprites/props.ts`, replacing `kettlebell` and `dumbbell`. Same sizes
as today's doubled art (12 × 12 and 16 × 8), redrawn with a handle you can
see through and a highlight and shadow. Two new colours, both darker or
lighter steps of `--muted` so the props stay quieter than the person:

```ts
export const kettlebell: Sprite = {
  grid: [
    "...kkkkkk...",
    "..kaaaaaak..",
    ".kak....kak.",
    ".kak....kak.",
    ".kkkkkkkkkk.",
    "kaeeaaaaaaak",
    "kaeaaaaaaaak",
    "kaeaaaaaaaak",
    "kaaaaaaaaaak",
    "kaaaaaaaaadk",
    ".kddddddddk.",
    "..kkkkkkkk..",
  ],
  palette: { k: INK, a: "#3d5a45", e: "#6f8f78", d: "#2a4232" },
};

export const dumbbell: Sprite = {
  grid: [
    ".kkk........kkk.",
    "keaak......keaak",
    "keaakkkkkkkkeaak",
    "keaakeeeeeekeaak",
    "kaaakeeeeeekaaak",
    "kaaakkkkkkkkaaak",
    "kddak......kdddk",
    ".kkk........kkk.",
  ],
  palette: { k: INK, a: "#3d5a45", e: "#6f8f78", d: "#2a4232" },
};
```

### For the Gym group: building the poses from this body

Coordinates are (column, row), 0-based, in the 32 × 32 grid.

- **Head**: rows 1 to 16, outline at columns 6 and 25 for rows 4 to 9 and
  at 5 and 26 for the cheeks (rows 10 to 12, the widest); chin row 16, neck
  row 17 (columns 13 to 18, `S`). Eyes in ink at columns 10 to 11 and 20 to
  21, rows 10 to 12; mouth at columns 15 to 16, row 15. The hair overlay anchors at row 0 of whatever row the head starts
  on (`hairRow`).
- **Shoulders**: row 18 is the collar (outline columns 6 to 9 and 22 to 25);
  the shoulder line is row 19, outline at columns 4 to 5 and 26 to 27.
- **Arms**: hanging at the sides, sleeves rows 20 to 21 (columns 4 to 6 and
  25 to 27), outlined at columns 3 and 7 (left) and 24 and 28 (right).
- **Hands**: rows 22 to 24, columns 4 to 6 (left) and 25 to 27 (right),
  rows 22 and 23 in `s`, row 24 in `S`; outlined at columns 3 and 7, and 24
  and 28. A held prop's grip point is the hand's centre: (5, 23) left and
  (26, 23) right. For **rest**, the bottle stands with its base on row 25 and
  overlaps the right hand at (25 to 27, 21 to 24).
- **Torso**: rows 18 to 25, columns 8 to 23 inside the outline at 7 and
  24; hem row 25 in `T`.
- **Hips and shorts**: dark shorts in ink, row 26 across columns 7 to 24
  (the belt line and the upper-rows split) and row 27 split into two legs
  (columns 7 to 13 and 18 to 24).
- **Legs and feet**: bare legs rows 28 to 29 at columns 9 to 12 and 19 to
  22 (row 29 in `S`), trainers row 30 (`T`, columns 8 to 12 and 19 to 23), sole row 31.
- **Sit**: drop the head and torso 2 rows as today, replace rows 26 to 31
  with thighs drawn forward (the knees at about columns 7 and 24) so the
  figure ends near row 31.
- **Lift**: raise the arms from row 19 to rows 2 to 18 at columns 3 to 7
  and 24 to 28, the hands at rows 2 to 4 (wider than the head's 6 to 25),
  and the bar across row 1; the hair overlay still starts at row 0.
- **Stand**: this body unchanged.
