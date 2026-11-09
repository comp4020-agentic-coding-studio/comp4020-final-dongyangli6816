# Avatar editor (`/avatar`) design spec

Mockup: `docs/design/avatar/mockup.html` (open it in a browser). Screenshots:
`node scripts/shot.mjs docs/design/avatar/mockup.html .shots/avatar/mockup` (not
kept in git).

**New page, 8 Oct 2026 (Lobby group).** Designed with `home` and `join`. Build at `src/pages/avatar.astro`, and add `avatar` to the Lobby row of the design-group table in `CLAUDE.md` (and to the design-gate hook's route map) in the same commit.

**Revision, 8 Nov 2026: accessories.** The editor gains an **Accessories**
section (AV-4) and this spec now holds the art for all 21 accessories (15
drawings). See "Accessories, Nov 8" at the end: it adds to sections 1 to 5
below, and where it disagrees with them (the laptop grid, the face rule),
it wins. Screenshots: `node scripts/shot.mjs docs/design/avatar/mockup.html
.shots/avatar/mockup --states`; the mockup's last state is the art sheet.

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
          holding a head-only `svg.av` (`viewBox="0 0 32 20"`, 2×, 64 × 40 px,
          only that style's hair group) and the visible name (`Crop`,
          `Curls`, `Wolf cut`, `Ponytail`), then `svg.tick`. A chosen tile
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
- **Output:** `svg.av` with `viewBox="0 0 32 32"` (or `"0 0 32 20"` for
  `head`). It contains `g.av-top`, holding body rows 0 to 23 and the
  hair group or groups (`g.hair.hair-{style}`), followed by body rows 24 to
  31 (`AVATAR_UPPER_ROWS = 24`).
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
  crop at 64 × 40.

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

Head crop: `viewBox="0 0 32 20"` (columns 0 to 31, rows 0 to 19: the
whole head and every style's hair, the ponytail's tail included, plus the
face and the shoulders), shown at 2×, 64 × 40 px, in home's squad list and
the editor's hair tiles (the Gen Z redesign, Oct 19).

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

*Superseded 19 Oct* by the Gen Z anchors below and the room spec's
"Exercise animations, Oct 19".

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

## Gen Z redesign, Oct 19

**What.** The person is redrawn as a cute but cool figure for an 18 to 29
audience raised on Stardew Valley and the Pokémon remakes, approved by the
user. The head is rounder and smaller (18 × 14, no ears), and the space it
frees goes to the body: an oversized boxy tee with dropped shoulders, short
wide-leg cargos in the shirt's shade, and chunky white sneakers. The face sits
low and close: 2 × 3 eyes 4 pixels apart, each with a paper catchlight, blush
in the skin shade, and a 2-pixel mouth. The four hair styles keep their stored
ids, redrawn on the bald body: `crop` is a short crop with a textured
fringe; `curls` a round cloud, the widest silhouette; `long` a middle-parted
wolf cut whose layers flick over the shoulders; `ponytail` a high, full tail
swinging out to the right, with a scrunchie in the shirt colour. The editor's
label for `long` becomes **Wolf cut**; the id stays `long`.

**Why.** The Oct 18 figure read as a potato: a box of a head, blank
wide-set dot eyes, a plain box of a body. Nobody would pick it as
themselves or screenshot it. The new one has a person's silhouette at 1×:
the white sneakers, the tee wider than the head and the hair shapes make
each figure distinct on the 320 px map.

**Rule changes** (system section 10, approved): the body may use the fixed
colours `m`, `w` and `r` (the catchlights, sneaker uppers and soles), so
`Avatar.astro` maps them to `pm`, `pw` and `pr` for the body as for props.
`AVATAR_UPPER_ROWS` becomes 24.

**New anchors**, (column, row), 0-based. These replace the person grid in the
appendix and "For the Gym group" above; the grids live in
`src/sprites/avatar.ts` once built.

- Head: outline rows 1 to 14, widest at columns 7 and 24 (rows 3 to 11); chin
  row 14 (columns 11 to 20). Neck row 15, columns 14 to 17.
- Face, which no overlay may touch (except a face accessory, over the eyes
  and never the mouth: "Accessories, Nov 8", A.6): columns 11 to 20, rows 8 to 12. Eyes at
  columns 12 to 13 and 18 to 19, rows 8 to 10; blush row 11; mouth columns
  15 to 16, row 12.
- Shoulder line row 16 (dropped shoulders, outline at columns 4 to 5 and 26
  to 27); full width row 17, outline at columns 3 and 28.
- Sleeves rows 16 to 20, hem row 20; hands rows 21 to 22 at columns 4 to 6 and
  25 to 27. Grip points (5, 22) and (26, 22).
- Tee rows 16 to 22, hem row 22; belt line row 23, the bob split (rows 0 to 23
  bob).
- Cargos rows 24 to 27, legs split at columns 15 to 16; sneakers rows 28 to
  31, columns 5 to 14 and 17 to 26.
- Hair overlays anchor at row 0, column 0 of the pose's head (`hairRow`) and
  reach at most row 16 (`long`) and column 31 (the ponytail's tail).

**Head crop**: `viewBox="0 0 32 20"`, at 2× 64 × 40 px, replacing
`"2 0 28 22"` (56 × 44) wherever a list or the editor's hair tiles draw a
head. The full width is needed for the ponytail's tail; rows 0 to 19 frame
every style's hair, the face and the shoulders.

## Accessories, Nov 8

**What.** A new **Accessories** section on the editor (AV-4), and the art
for all 21 accessories (15 drawings), designed from
`docs/product/criteria/accessories.md` (agreed 8 Nov, D1 to D12). This is
the first design on the feature: the Gym designer (room banners, room log)
and the Logbook designer (the summary's "New:" list) draw accessories from
the sheet once the grids below are in `src/sprites/`, so this section is
the only copy of the art. Everything above this section stands, except
where this section says otherwise.

### A.1 Plan

**Shared (Lobby group).** Unchanged; the shared section at the top of this
spec still holds word for word in home, join and avatar. Accessories add
nothing to it: the editor is the only Lobby page that offers them. Home's
tile and squad heads simply draw what's worn (AV-7.4, AV-7.6) with the
renderer below; home's mockup needs no change, since its tile draws Mia
from inline art and the build draws whatever she wears.

**Who and when.** The same two people as the editor already has, plus two
new moments:

- **A fresh account at the showcase** (often a marker, alone or with Dony):
  they see seven things to wear straight away and fourteen grey shapes,
  each with a plain goal they could hit in the next ten minutes. The goals
  are the reason to go back into the gym.
- **A friend a few weeks in** opening the editor to swap the bandana for the
  silver medal they just got, then checking how far off the gold is.

Never between sets: Wear it on the room's banner and the summary cover the
fresh unlock; nothing else routes through here.

With strangers: nothing here shows anyone else's unlocks or progress
(AV-4.13), so the page reads the same for someone who knows nobody in the
room.

**The one job.** Still **pick a look and keep it**; Save stays the one
primary. Accessories are a fifth and sixth and seventh choice, not a new
page, and nothing about them needs a second button.

**Hierarchy.**

1. The preview, now wearing the kit (sticky on phones, and now sticky in
   the left column on laptops too, so it stays in view while you scroll
   the kit).
2. The four look choices, as before.
3. **Accessories**: Head, Face, Neck. In each slot, what you can wear first,
   then the locked silhouettes.
4. Save.

The only numbers are the progress counts ("7 of 10"); they're VT323 at
20 px on a leaf highlight, tabular, and never a bar or a percentage.

**Reuse.** Every accessory is a `.pick` tile built exactly like a hair tile
(a real radio covering the tile, `.face`, `svg.tick`, the leaf fill when
chosen), and the slots are `fieldset.pick-group` like the look's. Locked
tiles reuse the join page's ghost outline idea (`.av.ghost`: card fill,
muted ink). New: `.kit`, `.acc-grid`, `.acc`, `.acc-frame`, `.bust`
(+ `.ghost`), `.acc-name`, `.acc-cond`, `.lock-word`, `.acc-prog`, `.lock`,
and `.stage` (the preview and Randomise as one sticky column). One new
8 × 8 icon, `lock`.

**What the template check changed.**

- **First pass: a row of icon chips per slot, locked ones greyed with a
  padlock.** That is every game's cosmetics screen with Spotter's colours.
  What changed:
- **Every tile is you wearing it.** Like the hair tiles show your own head,
  each accessory tile shows your own bust (the bald standing body in your
  current skin and shirt, from the sheet) wearing that one item, on the
  floor checker. Change your skin or shirt and every tile recolours with
  the preview, so it reads as trying things on, not shopping.
- **Locked is a ghost of you wearing its silhouette**, Pokédex-style: the
  outline of a person in muted ink with the accessory's shape filled in
  grey. You can see what the crown looks like on you before you have it,
  and that's the pull (AV-4.12). The word **Locked**, the goal in plain
  words, and how far you are sit under it.
- **Goals are what the app is already about**, in a mate's words: "Try 3
  machines", "End 3 rests on time", "Slack for a full minute". No points,
  no levels, no bar filling up.
- **The four long-haul trophies carry a gold rule** under their frame,
  earned or not, so the big ones are visible as big ones across the grid
  without a badge or a ranking.
- Would I screenshot it? The Gen Z test is the preview: Mia in a green
  Squad cap and a bronze medal on her gym floor, and a fresh account's
  grid of grey ghosts in crowns and chains. Both are group-chat
  material; a list of padlocks isn't.

### A.2 Requirements covered

| Requirement (source) | Element |
| --- | --- |
| AV-4.1 "an Accessories section after her four look choices, with one group per slot, Head, Face and Neck, each offering None" | `section.kit` after `.choices`, `h2` **Accessories**, three `fieldset.pick-group.acc-group` with legends **Head**, **Face**, **Neck**; each starts with a **None** tile (`value=""`) |
| AV-4.1 "at most one per slot and any combination across the three" | One radio group per slot: `acc_head`, `acc_face`, `acc_neck` |
| AV-4.2 starters choosable on a brand-new account | State **new account**: the seven starters are tiles with radios; nothing else is |
| AV-4.3 locked: "a grey silhouette, with the word Locked and its condition in words … can't be chosen"; progress for counts that only go up; the crown only its condition (D8) | `div.acc.locked` (no input): `.bust.ghost` silhouette, `.lock` icon, `.lock-word` **Locked**, `.acc-cond`, and `.acc-prog` "7 of 10" where the count only goes up; the crown has no `.acc-prog` |
| AV-4.4 earned: "offers it like a starter, and says what earned it and when ('Earned 3 Nov: your first PB')" | `label.acc.won` with a radio, plus `.acc-cond.earned` "Earned 22 Oct: first PB" (A.4 has every line) |
| AV-4.5 Save stores them; success, pending and error as today; a failed save keeps everything checked | Save unchanged; states **pending**, **success**, **error** with the kit kept checked |
| AV-4.6 Randomise rolls the four look choices only; a new account wears nothing | Randomise's script and the server's `intent=randomise` touch only `skin`, `hair`, `hair_colour`, `shirt`; state **new account** wears nothing |
| AV-4.7 the preview shows them at once, before Save, with or without script | The preview avatar carries every accessory as a hidden layer; generated `:has()` rules show the checked one (A.3, "No-script preview") |
| AV-4.8 a refused save shows the editor's error | State **error**, same line; the server decides (hand-made posts), never the hidden control |
| AV-4.9 old accounts load and save as before, wearing nothing | Absent `acc_*` values mean None; the None tiles are checked |
| AV-4.10 a group per slot with a name; each accessory a choice named in words; Tab between groups, arrows within; locked read as text "Crown, locked: train 4 weeks in a row", not a stop; Locked never by grey alone | Fieldset + legend per slot; radio label is the visible name; locked tiles have no input and one `.sr-only` sentence, the visible parts `aria-hidden`; the word Locked is always drawn |
| AV-4.12 starters plain, earned like trophies; a silhouette reads as a goal | Art (A.6): quiet colours for starters, metal and bright for earned; gold rule on the long-haul four; ghost-of-you silhouettes |
| AV-4.13 nothing about unlocks shown to anyone else | Only the editor (your own page) shows unlocks and progress; no other Lobby page does |
| AV-7.1–7.3, 7.9–7.12 (the art) | A.6 to A.8 and the mockup's **art sheet** |
| AV-7.6 the preview shows what's worn; the hair tiles show your head without accessories | The preview's `.worn` layer; hair tiles are drawn without it |
| AV-7.4 heads in lists show head and face items | The head crop `0 0 32 20` includes rows 0–19 of the anchor: head and face items fit; neck items (rows 15–22) are mostly cropped, accepted |
| AV-6.17 no line tells anyone off; the Nightcap teases the rest | Nightcap's goal "Slack for a full minute", its reason "a minute slacking" |
| System 12 focus ring, 44 px targets | Tiles are at least 100 px wide and 120 px tall; the ring is drawn on `.face` from the radio's `:focus-visible`, as on every `.pick` |
| Criteria Scope, design-system item 7 (accessory colours: tokens or a sprite palette) | A sprite palette in `src/sprites/accessories.ts` (A.7) |

### A.3 Structure

After `.choices`, inside `form.editor` (new names in bold):

1. *(was the preview and Randomise as two grid children)* `div.`**`stage`**
   wraps `div.floor.preview` and `button.shuffle`. On phones it is
   `display: contents`, so nothing changes; from 900 px it is the left
   column, `position: sticky; top: 1rem`. The editor's grid areas become
   `"preview choices" "preview kit" "error error" "actions actions"`; the
   error gets its own row (in the old grid it shared Save's area and was
   drawn under the button, a bug the screenshots showed).
2. The preview's `svg.av` gains one group, `g.worn`, inside `g.av-top`
   after the hair groups (so it bobs with the head and draws over the
   hair): one `use.acc.acc-slot-{slot}.acc-{id}` per accessory (editor), or
   only the worn ones (everywhere else). Its `data-wear` holds the saved
   ids, space separated, for browsers without `:has()`.
3. `section.`**`kit`** `aria-labelledby` its `h2`:
   - `h2` **Accessories**, then `p.hint.kit-hint` `Three slots, one thing in
     each. Earn the rest by training 🏋️`.
   - Three `fieldset.pick-group.`**`acc-group`**, legends **Head**,
     **Face**, **Neck**. Each holds `div.`**`acc-grid`** (3 columns at
     every width: on a laptop the kit sits in the right column, as narrow
     as a phone):
     - **None**: `label.pick.acc.none` > `input[type=radio][name=acc_{slot}][value=""]`,
       `span.face` > `span.acc-frame` > `svg.bust` (your bust wearing
       nothing) + `span.acc-name` `None`, then `svg.tick`.
     - **Wearable** (starters, then earned, in the table order of the
       criteria): `label.pick.acc` (+ `.won` if earned, + `.trophy` if
       long-haul) > radio `value="{id}"`, `span.face` > `span.acc-frame` >
       `svg.bust`, `span.acc-name` {name}, and for earned ones
       `span.acc-cond.earned` `Earned {d Mon}: {reason}`; then `svg.tick`.
     - **Locked** (quick, then long-haul, in table order):
       `div.acc.locked` (+ `.trophy`) > `span.face[aria-hidden=true]` >
       `span.acc-frame` > `svg.bust.ghost` + `svg.lock`, `span.acc-name`,
       `span.lock-word` `Locked`, `span.acc-cond` {goal}, and
       `span.acc-prog` `{n} of {target}` where the count only goes up;
       then `span.sr-only` `{Name}, locked: {goal}. {n} of {target}`.
       No input, so Tab and the arrows skip it and a hand-made post is the
       only way to name it (refused, AV-4.8).
   - **`svg.bust`**: `viewBox="2 0 28 23"` at 3× (84 × 69 px): the sheet's
     bald standing body (`av-stand`, so it takes the form's `--av-*` and
     recolours live, like the hair tiles) with the accessory's drawing over
     it at row 0 (neck items masked to the tee, A.8). Locked: `.ghost`
     sets the skin and shirt to `--card`, the outline to `--muted`, and
     draws the accessory with no palette, every letter `--muted`, its
     outline muted ink: a grey shape you can still recognise.
4. *(error only)* `p.error`, then Save, then the status line, as before.

Longer names ("Pink beanie", "Mirror shades") wrap to two lines on a
phone; the grid rows stretch, so a row's tiles stay one height.

**No-script preview.** Generated from the accessory list in
`src/sprites/accessories.ts`, like `editorCss()` (extend it, or add
`accessoriesCss()`):

```css
.preview .acc { display: none; }
.preview .av[data-wear~="crown"] .acc-crown { display: inline; }      /* no :has() */
.editor:has(input[name="acc_head"]:checked) .preview .acc-slot-head { display: none; }
.editor:has(input[name="acc_head"][value="crown"]:checked) .preview .acc-crown { display: inline; }
/* … one per slot, and one per accessory */
```

**Form and server** (what the page posts; the server's rules are the
contract's):

- Three fields, `acc_head`, `acc_face`, `acc_neck`, each an accessory id
  or empty (None). Stored with the look; AV-4.8's refusals render the
  **error** state with what was posted still checked.
- `intent=randomise` re-renders with the posted `acc_*` checked, unchanged.
- GET renders the stored ids checked; absent means None (AV-4.9).
- Each tile's state (wearable, earned with its date, locked with its
  progress) comes from the person's own unlocks, worked out on the server
  when the editor opens (AV-5.15).

**Script.** As before, plus: the "Not saved yet." check also compares
`acc_head`, `acc_face` and `acc_neck`; Randomise still rolls only the four
look fields. The mockup's inline script shows both.

**Rendering everywhere else (`Avatar.astro`, the room's script, the
logbook art).** Draw order: machine back, body, hair (or Dony's head),
props, **accessories in the order head, face, neck**, machine front. Each
at `y = hairRow`. Neck items through the tee mask (A.8). Dony never gets
the layer. The look key (`lookKey`) must include the three worn ids, or a
change won't redraw (criteria Scope); e.g. append `|head|face|neck`.

### A.4 Copy

| Where | Copy |
| --- | --- |
| Section heading | `Accessories` |
| Under it | `Three slots, one thing in each. Earn the rest by training 🏋️` |
| Slot legends | `Head` · `Face` · `Neck` |
| Empty choice | `None` |
| Locked word | `Locked` |
| Earned line | `Earned 3 Nov: {reason}` (Australian day-month, no year; the year is added only if it isn't this one: `Earned 3 Nov 2025: …`) |
| Screen-reader line for a locked one | `{Name}, locked: {goal, lower-case first letter}. {n} of {target}` e.g. `Silver medal, locked: train on 10 different days. 7 of 10` · `Crown, locked: train 4 weeks in a row` |

Goals (`.acc-cond` when locked) and reasons (after `Earned {date}:`), short
enough for a 100 px tile:

| Accessory | Goal (locked) | Progress | Reason (earned) |
| --- | --- | --- | --- |
| Sweatband | Log a working set | — | first set |
| Shades | Hit your first PB | — | first PB |
| Bronze medal | Finish a workout | — | first workout |
| Hype band | Send 5 Cheers | `n of 5` | 5 Cheers |
| Star shades | Send 3 hype messages | `n of 3` | 3 hype messages |
| Heart shades | Land a high-five | — | first high-five |
| Mirror shades | End 3 rests on time | `n of 3` | 3 rests on time |
| Bandana | Try 3 machines | `n of 3` | 3 machines |
| Squad cap | Train with someone in the room | — | first day together |
| Nightcap | Slack for a full minute | `n of 60 s` | a minute slacking |
| Silver medal | Train on 10 different days | `n of 10` | 10 days |
| Gold medal | Train on 30 different days | `n of 30` | 30 days |
| Gold chain | Train together on 5 days | `n of 5` | 5 days together |
| Crown | Train 4 weeks in a row | never (D8) | 4 weeks in a row |

"Hype messages" is the editor's word for INT-5's hype presets (the room
calls them messages; "preset" is ours). The goals are the criteria's
conditions in a mate's words, and they mean exactly the criteria's
definitions; the Terms there decide what counts.

### A.5 States

The existing states are kept and carry the kit; three change or are new.

| State | Trigger | What changes |
| --- | --- | --- |
| **Default** | GET `/avatar` | Mia, a few weeks in: wears the Squad cap and the bronze medal; 7 of 14 earned (dates and reasons shown), 7 locked with progress where it counts up (Nightcap 40 of 60 s, Silver 7 of 10, Gold 7 of 30, Chain 3 of 5, Star shades 2 of 3, Mirror shades 1 of 3), the crown with no count |
| **New account** | `/avatar?new=1&next=/` | Priya's roll, wearing nothing (None checked in all three). The seven starters choosable; all fourteen earned ones locked, counts at 0 ("0 of 5"). The shape a fresh showcase account sees |
| **Changed, not saved** | A tile or swatch changed | Mia picked the bandana and heart shades and took the medal off; the preview shows them, status `Not saved yet.` |
| **Long-time account** (new) | GET, an account with most unlocked | Tom, since September: 12 of 14 earned; only the gold medal (24 of 30) and the crown locked. Shows the grid with nearly everything choosable, and that a long list stays three columns, four rows at most |
| **Pending** | Save on slow wifi | As before; Randomise disabled too; the kit stays as picked |
| **Success** | `?saved=1` | As before; the new kit is the saved one |
| **Error** | Save fails, or AV-4.8 refuses it | As before, the line now in its own grid row on laptops; every pick, accessories included, stays checked |

A note on the **unlock that happens while the editor is open** (AV-6.13):
the editor doesn't update live. The new tile shows unlocked the next time
the editor is opened (or reloaded); the room's banner and the summary tell
the earner meanwhile. No new state.

### A.6 The art: how the drawings work

**The head anchor.** Every drawing is a grid **32 wide whose row 0 lands on
the pose's `hairRow`**, like `HAIR`. One drawing follows every pose and
frame: standing, walking, the flex, the acted moves and reactions, every
machine frame. Grids list only the rows they use (row 0 down to their last
row); a renderer treats missing rows as empty.

**Letters.** `k` ink (outline), `a` main colour, `b` its shade, `c` its
light, `d` an accent. Each accessory gives its own palette for `a b c d`;
`k` is always ink. A colour variant is the same grid with another palette
(cap/squad cap, beanie/pink beanie, headband → Sweatband/Hype band,
shades/mirror shades, medal ×3). At most four colours plus ink, inside
system 10's seven.

**Draw order.** Body, hair, props, then accessories (head, face, neck),
then the machine's front layer. A head item draws over the hair; every
head drawing was checked over all four hair styles (art sheet): the curls
and the wolf cut show below and beside a cap, beanie, bucket hat and crown;
the ponytail's tail shows beside all of them; headphones sit over the hair
at the ears. The machine front still covers everything (the squat rack's
uprights over a neck item, the treadmill rails over headphone cups), and
props drawn over the head (raised arms in `reach`, `cheer`, the flex, the
cable machine's frame 2 handles) cover the accessory just as they cover
the hair. That is correct: the arm is in front.

**What each slot may cover** (rows and columns from the anchor):

- **Head** items: rows 0–11 and columns 3–31, **never the face box**
  (columns 11–20, rows 8–12). Checked by script: no head drawing touches
  it. Brims and bands stop at row 7; only the beanie's cuff ends, the
  headphone cups, the bandana's knot and the nightcap's tail reach lower,
  all outside the face (columns 3–9 and 22–29).
- **Face** items: **the brow line, the eyes and the row under them**, rows
  6–11, columns 7–24: lenses over the eyes (rows 8–10), a rim or bridge on
  rows 7–8, temples out to the head's outline, a lower rim on row 11 (where
  the blush is). **Never the mouth** (row 12) or anything below it. This is the one
  exception to "no overlay covers the face" (`avatar.ts`'s header comment
  and the anchors in "Gen Z redesign, Oct 19" above, both to be updated).
  The person still reads as a face because the mouth, the chin and the
  face's outline stay, and every face drawing is outlined in ink with a
  pale highlight (`c`), so it reads over all six skin tones, the deepest
  included (art sheet, "Face items over the six skin tones"). Glasses are
  round plum frames with see-through lenses (the eyes show inside them) and
  no top bar; Dony's are a straight ink brow-bar with square rims, so his
  look stays his (BOT-2).
- **Neck** items: drawn **only on the tee** (A.8). Never the face, the
  legs, a machine or anyone else.

**Readable at 1×.** Every drawing was checked at 1× on the 320 px map
(art sheet). In each slot they tell apart by shape first: cap (brim
forward), beanie (ribbed cuff), bucket hat (wide brim all round), sweatband
and hype band (a stripe across the forehead, no crown on top), bandana
(dotted, knot out to the side), headphones (cups at the ears), nightcap
(tail and pompom hanging right), crown (three points, gold). Face: glasses
(thin frames, eyes visible), shades (one dark bar), star shades (points
above and below), heart shades (two pink hearts). Neck: towel (over one
shoulder, striped), medal (ribbon and a disc), chain (a gold V with a
pendant). Variants tell apart by colour (AV-7.12, art sheet row "Colour
variants").

**Starters plain, earned like trophies** (AV-4.12). Starters are everyday
kit in quiet, desaturated colours (navy cap, grey beanie, dusty pink
beanie, sand bucket hat, white headphones, black glasses, cream towel).
Earned ones are bright or metal: white and hot-pink bands, star and heart
shades, a cobalt bandana, a Spotter-green squad cap with a cream "H"
logo, mirror lenses, bronze, silver and gold, the crown's blue jewel.

**No animation** (AV-7.9). Each drawing is still and moves only with the
body (it's inside the bobbing rows on the idle loop, and on whatever frame
the pose shows).

### A.7 Palette decision: a sprite palette, not tokens

Accessory colours go in **`src/sprites/accessories.ts`**, as each
accessory's `palette`, exactly as the look's colours live in
`src/sprites/avatar.ts` and the gym's in `GYM_PALETTE`. Not tokens:

- Tokens are interface colours used by CSS rules; these are used only by
  sprite grids, like the skin, hair and shirt swatches, which system 5
  already allows as "hex values inside sprite palettes".
- 21 accessories × up to 4 colours would add some 50 tokens to `:root`
  that no rule but the renderer would read.
- A variant is a new palette object on the same grid; adding one is one
  line in the module, not a token and a rule.

The renderer applies a palette as custom properties on the accessory's
layer (`--acc-a`, `--acc-b`, `--acc-c`, `--acc-d`; `k` is `--ink`), so the
editor's locked silhouette can override them with `--muted` in CSS, and
the room's script and the server render draw the same thing. The mockup
does exactly that.

**State colours** (AV-7.10). No accessory's main colour (`a`) is a state
colour, measured as a CIE Lab distance (ΔE) from each of `--lifting`,
`--resting`, `--slacking`, `--finished`; the closest pairs:

| Accessory main | Nearest state | ΔE |
| --- | --- | --- |
| Gold `#c98614` (crown, gold medal, chain) | Finished `#f2c94c` | 27 |
| Silver `#c9c8c1` | Resting `#7cc6e8` | 31 |
| Mirror lenses `#d3d6d2` | Resting | 30 |
| Bronze `#a4552a` | Slacking `#ff6b5e` | 32 |
| Squad cap `#2f8a4c` | Lifting `#c8e66b` | 49 |

Everything else is 36 or more. **Gold** is a deep, orange-leaning metal
with a dark shade and a pale highlight, so it reads as a metal object, not
as the flat yellow of the Finished chip, which is a fill with ink text and
the trophy icon, never a sprite colour. Silver is a warm neutral grey (not
blue), so it can't pass for Resting. The squad cap was first drawn in
violet and moved to Spotter's own green: violet was ΔE 6 from the star
shades and 17 from Dony's top. State on the map is still told by the tag's
colour, icon and word (system 5), never by anything a person wears.

### A.8 The neck rule, as drawn

The criteria (AV-7.2) and the art research say a neck item shows "only
over shirt pixels (`t`/`T`)". Drawing it showed that isn't enough: **the
cargos use the shirt's shade `T` too**, so on the squat's low frame and on
the bench a medal "over `t`/`T`" lands on the knees and the shins. The rule
as built:

> A neck item is drawn only on the **tee**: pixels that are `t` or `T` in
> the body grid, from the collar (`hairRow + 15`) down to, not including,
> the **belt line** (the first row below the collar with a run of 12 or
> more ink pixels across columns 3–28), and not under a prop or the
> machine's front layer. A drawing with no belt line below the collar has
> no tee, and its neck item is hidden.

Worked out by script on all 35 drawings: the tee is rows 15–22 standing
and walking, 18–24 sitting with the phone, 19–21 on the bench, 21–24 in the
lifting platform's low frame, 15–19 hanging from the pull-up bar, 19–24 at
the cable machine; **none** in the squat's low frame and on the exercise
mat (the medal hides, accepted by AV-7.2). Compute the mask once per
drawing (it's pure data) and keep it beside the drawing, or clip at render
time; the mockup clips with an SVG `clipPath` per pose for the same
result.

### A.9 The grids: the 15 drawings

`src/sprites/accessories.ts` (new). Checked by script: every row 32
wide; no head drawing touches the face box; no face drawing leaves rows
6–11; every neck drawing sits only on the standing tee. Row 0 is the
pose's `hairRow`.

```ts
// Accessories (AV-4, AV-7; docs/design/avatar/spec.md, "Accessories, Nov 8").
// 32-wide grids whose row 0 is the pose's hairRow, drawn after the hair and
// props and before the machine's front. k ink; a main, b shade, c light,
// d accent, from the accessory's palette. Neck items only on the tee (A.8).
export type Slot = "head" | "face" | "neck";

export const ACC_DRAWINGS = {
  "cap": [ // head, rows 0-7
    "..........kkkkkkkkkkkk..........",
    "........kkaaaaaaaaaaaakk........",
    ".......kaacaadaaaadaaabbk.......",
    "......kaacaaaddddddaaaabbk......",
    "......kaaaaaadaaaadaaaabbk......",
    "......kkkkkkkkkkkkkkkkkkkk......",
    "....kccccccccccccccccccccbbk....",
    ".....kkkkkkkkkkkkkkkkkkkkkk.....",
  ],
  "beanie": [ // head, rows 0-9
    "..........kkkkkkkkkkkk..........",
    "........kkaaaaaaaaaaaakk........",
    ".......kaacaaaaaaaaaaabbk.......",
    "......kaacaaaaaaaaaaaaabbk......",
    ".....kkkkkkkkkkkkkkkkkkkkkk.....",
    ".....kcbcbcbcbcbcbcbcbcbcbk.....",
    ".....kcbcbcbcbcbcbcbcbcbcbk.....",
    ".....kcbkkkkkkkkkkkkkkkkcbk.....",
    ".....kcbk..............kcbk.....",
    "......kk................kk......",
  ],
  "bucket-hat": [ // head, rows 0-7
    "..........kkkkkkkkkkkk..........",
    "........kkaaaaaaaaaaaakk........",
    ".......kaacaaaaaaaaaaabbk.......",
    ".......kddddddddddddddddk.......",
    ".....kkaaaaaaaaaaaaaaaaabkk.....",
    "...kkaaaaaaaaaaaaaaaaaaaaabkk...",
    "..kcccccccccccccccccccccccbbbk..",
    "..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..",
  ],
  "headphones": [ // head, rows 0-11
    ".........kkkkkkkkkkkkkk.........",
    ".......kkaaaaaaaaaaaaaakk.......",
    "......kaakkkkkkkkkkkkkkaak......",
    ".....kaak..............kaak.....",
    ".....kak................kak.....",
    "....kkakk..............kkakk....",
    "...kccccbk............kccccbk...",
    "...kcddcbk............kcddcbk...",
    "...kcddcbk............kcddcbk...",
    "...kcddcbk............kcddcbk...",
    "...kbbbbbk............kbbbbbk...",
    "....kkkkk..............kkkkk....",
  ],
  "headband": [ // head, rows 0-7
    "................................",
    "................................",
    "................................",
    "......kkkkkkkkkkkkkkkkkkkk......",
    "......kaaaaaaaaaaaaaaaaaak......",
    "......kccccccccccccccccccck.....",
    "......kbbbbbbbbbbbbbbbbbbk......",
    "......kkkkkkkkkkkkkkkkkkkk......",
  ],
  "bandana": [ // head, rows 0-9
    "..........kkkkkkkkkkkk..........",
    "........kkaaaaaaaaaaaakk........",
    ".......kaacaaaacaaaacabk........",
    "......kaaaaacaaaacaaaabbk.......",
    "......kacaaaaaacaaaaacbbkkk.....",
    "......kaaaacaaaaaacaaabkbbak....",
    "......kbbbbbbbbbbbbbbbbkbkkak...",
    "......kkkkkkkkkkkkkkkkkkkkbak...",
    ".........................kbak...",
    ".........................kkk....",
  ],
  "nightcap": [ // head, rows 0-11
    "..........kkkkkkkkkkkkk.........",
    "........kkaaaaaaaaaaaaakk.......",
    ".......kaaacaaaaaaaaaaaaakk.....",
    "......kaaaaaaaaaacaaaaaaaaak....",
    "......kaaaaaaaaaaaaaaaakkaaak...",
    ".....kddddddddddddddddddkkaak...",
    ".....kddddddddddddddddddk.kak...",
    "......kkkkkkkkkkkkkkkkkk..kak...",
    "..........................kak...",
    ".........................kdddk..",
    ".........................kdddk..",
    "..........................kkk...",
  ],
  "crown": [ // head, rows 0-7
    "........kk.....kk.....kk........",
    "........kck...kcak...kck........",
    "........kcak.kcaaak.kcak........",
    "........kcaakcaaaaakcaak........",
    "........kcaaaaaaaaaaaaak........",
    "........kaacaaaddaaacaak........",
    "........kbbbbbbbbbbbbbbk........",
    "........kkkkkkkkkkkkkkkk........",
  ],
  "glasses": [ // face, rows 0-11
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...........aaaa..aaaa...........",
    ".......aaaac...aac...aaa........",
    "..........a....aa....a..........",
    "..........a....aa....a..........",
    "...........aaaa..aaaa...........",
  ],
  "shades": [ // face, rows 0-11
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "........kkkkkkkkkkkkkkkk........",
    "........kcaaaakkcaaaakk.........",
    ".........kaaaaakkaaaaak.........",
    ".........kbbbbbkkbbbbbk.........",
    "..........kkkk....kkkk..........",
  ],
  "star-shades": [ // face, rows 0-11
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "............k......k............",
    "...........kak....kak...........",
    ".........kaacaakkaacaak.........",
    "..........kaaak..kaaak..........",
    ".........kaakaakkaakaak.........",
    ".........kk...kkkk...kk.........",
  ],
  "heart-shades": [ // face, rows 0-11
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "..........kk.kkkkk.kk...........",
    ".........kcakaakkcakaak.........",
    ".........kaaaaakkaaaaak.........",
    "..........kaaak..kaaak..........",
    "...........kak....kak...........",
  ],
  "towel": [ // neck, rows 0-22
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "......kcccccck..................",
    "....kcaaaaaaabk.................",
    "....kbbkaaaaabk.................",
    "........kddddk..................",
    "........kaaaak..................",
    "........kddddk..................",
    "........kakabk..................",
  ],
  "medal": [ // neck, rows 0-22
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...........kdk....kdk...........",
    "............kdkkkkdk............",
    ".............kcaabk.............",
    "............kcaaaabk............",
    "............kaaaabbk............",
    ".............kabbbk.............",
    "..............kkkk..............",
  ],
  "chain": [ // neck, rows 0-22
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    ".........kack......kcak.........",
    "..........kcak....kack..........",
    "...........kacakkacak...........",
    "............kkcaackk............",
    ".............kacabk.............",
    ".............kcaabk.............",
    "..............kkkk..............",
  ],
} as const;

// The 21 accessories, in the criteria's table order (D1). A colour variant
// is the same drawing with another palette.
export const ACCESSORIES = [
  { id: "cap", name: "Cap", slot: "head", kind: "starter", drawing: "cap", palette: { a: "#34466e", b: "#232f4d", c: "#50669a", d: "#34466e" } },
  { id: "beanie", name: "Beanie", slot: "head", kind: "starter", drawing: "beanie", palette: { a: "#8a8d93", b: "#64676d", c: "#b3b6bb" } },
  { id: "pink-beanie", name: "Pink beanie", slot: "head", kind: "starter", drawing: "beanie", palette: { a: "#e09ab9", b: "#b8728f", c: "#f2bfd5" } },
  { id: "bucket-hat", name: "Bucket hat", slot: "head", kind: "starter", drawing: "bucket-hat", palette: { a: "#b3a172", b: "#857549", c: "#cdbf93", d: "#6b5d3a" } },
  { id: "headphones", name: "Headphones", slot: "head", kind: "starter", drawing: "headphones", palette: { a: "#d9dadc", b: "#9ea2a8", c: "#eef0f1", d: "#3d4048" } },
  { id: "glasses", name: "Glasses", slot: "face", kind: "starter", drawing: "glasses", palette: { a: "#2a2130", c: "#f4f1e6" } },
  { id: "towel", name: "Towel", slot: "neck", kind: "starter", drawing: "towel", palette: { a: "#dccfb0", b: "#a89a78", c: "#f0e8d4", d: "#56627a" } },
  { id: "sweatband", name: "Sweatband", slot: "head", kind: "quick", drawing: "headband", palette: { a: "#f5f4ee", b: "#c4c5c9", c: "#f5f4ee" } },
  { id: "shades", name: "Shades", slot: "face", kind: "quick", drawing: "shades", palette: { a: "#232a3a", b: "#141821", c: "#e9f0f3" } },
  { id: "bronze-medal", name: "Bronze medal", slot: "neck", kind: "quick", drawing: "medal", palette: { d: "#f4f1e6", a: "#a4552a", b: "#6b3415", c: "#dd9a68" } },
  { id: "hype-band", name: "Hype band", slot: "head", kind: "quick", drawing: "headband", palette: { a: "#e0399a", b: "#a8226f", c: "#fff7fb" } },
  { id: "star-shades", name: "Star shades", slot: "face", kind: "quick", drawing: "star-shades", palette: { a: "#8a55f0", c: "#f3ecff" } },
  { id: "heart-shades", name: "Heart shades", slot: "face", kind: "quick", drawing: "heart-shades", palette: { a: "#f0469a", c: "#ffe3f0" } },
  { id: "mirror-shades", name: "Mirror shades", slot: "face", kind: "quick", drawing: "shades", palette: { a: "#d3d6d2", b: "#7f8783", c: "#ffffff" } },
  { id: "bandana", name: "Bandana", slot: "head", kind: "quick", drawing: "bandana", palette: { a: "#2a56c6", b: "#1b3a8f", c: "#f4f4ee" } },
  { id: "squad-cap", name: "Squad cap", slot: "head", kind: "quick", drawing: "cap", palette: { a: "#2f8a4c", b: "#1d5e32", c: "#4fae6a", d: "#f4f1e6" } },
  { id: "nightcap", name: "Nightcap", slot: "head", kind: "quick", drawing: "nightcap", palette: { a: "#3d4699", c: "#f1e9cf", d: "#f1e9cf" } },
  { id: "silver-medal", name: "Silver medal", slot: "neck", kind: "long", drawing: "medal", palette: { d: "#f4f1e6", a: "#c9c8c1", b: "#86857e", c: "#ffffff" } },
  { id: "gold-medal", name: "Gold medal", slot: "neck", kind: "long", drawing: "medal", palette: { d: "#f4f1e6", a: "#c98614", b: "#86500c", c: "#ffe08a" } },
  { id: "gold-chain", name: "Gold chain", slot: "neck", kind: "long", drawing: "chain", palette: { a: "#c98614", b: "#86500c", c: "#ffe08a" } },
  { id: "crown", name: "Crown", slot: "head", kind: "long", drawing: "crown", palette: { a: "#c98614", b: "#86500c", c: "#ffe08a", d: "#3a5ccc" } },
] as const;
```

**The lock icon**, for `src/sprites/icons.ts` (8 × 8, in the text colour):

```ts
export const lockIcon = icon("..cccc..", ".c....c.", ".c....c.", "cccccccc", "ccc..ccc", "ccc..ccc", "cccccccc", "........");
```

Once these are in `src/sprites/` and `scripts/sprites.ts` emits them
(suggested ids: `acc-<drawing>` with no palette, coloured by the `--acc-*`
properties, and `i-lock`), the mockup's hidden symbols go back to
`/sprites.svg#acc-…` and `#i-lock`, and the Gym and Logbook designers draw
accessories from the sheet. A figure with an accessory in a mockup is then
`<use href="/sprites.svg#av-stand-long"/>` followed by
`<use href="/sprites.svg#acc-cap" y="{hairRow}" style="--acc-a:…"/>`.

**Cut order.** Unchanged from the criteria; all fifteen are drawn, so
nothing needs cutting for the art. The build can still cut from the end of
the criteria's list if building time runs short.

### A.10 Departures

- **Face accessories cover the eyes** (an exception to "no overlay covers
  the face", agreed by the criteria): eyes and brow line only, never the
  mouth (A.6). Change the comment in `avatar.ts` and the "Face, which no
  overlay may touch" anchor above when building.
- **The neck rule is stricter than the criteria's words** (A.8): shirt
  letters above the belt line, not any `t`/`T`. Same intent (AV-7.2);
  `pm` should take the wording into the criteria.
- **The preview's column is sticky on laptops** too now (it was sticky only
  on phones), so the kit's choices, below the fold, still change a preview
  you can see. Not over any button.
- **Three accessory tiles a row at every width**, not four from 900 px:
  in the laptop's right column four would squeeze names like "Headphones"
  past their tile.
- **Locked tiles are text, not disabled radios**, so they aren't keyboard
  stops (AV-4.10). A screen-reader user hears them as they read through
  the group.
- **Field names, as built (9 Nov):** the build follows the contract
  (`spec/accessories.test.ts`): the slots post as `head`, `face`, `neck`,
  with `none` for None, not `acc_head` and `""` as A.3 has them. The
  generated preview rules match the built names. Nothing a person sees
  changes.
- None of this changes the Lobby's shared section.
