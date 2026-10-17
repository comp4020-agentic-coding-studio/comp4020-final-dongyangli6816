# ADR 0005: Sprites and tiles at 32 × 32

Status: accepted, 14 Oct 2026. Draft by the agent; edit before citing.

## Context

Every sprite in Spotter is a 16 × 16 character grid, and the gym map is 10 ×
10 tiles of 16 px (GYM-1, BOT-2, `docs/design/system.md` section 10). At that
size a face is about 8 × 7 pixels: two pixels per eye, no room for a mouth,
and four hair styles that differ by a handful of pixels. Dony's glasses and
outfit (BOT-2) only just read. The art is the first thing anyone sees, and it
is holding the app back.

Two rules constrain any fix:

- **Whole-number scaling only** (system section 10). A fractional zoom makes
  pixels uneven, and is a blocker.
- **The map fits a phone and a laptop without scrolling** (GYM-1). Today it is
  160 px drawn at 2× (320 px) on a phone and 3× (480 px) on a laptop.

Since #13, every sprite lives in one place, `src/sprites/`, and the design
mockups draw from it, so changing the art no longer means redrawing every
mockup.

## Options

1. **Keep 16 × 16 and add colours.** Shading helps, but a 16 × 16 face stays
   a 16 × 16 face. The cheapest option, and it doesn't fix the problem.
2. **Only the people at 32 × 32, tiles at 16.** The map stays exactly as it
   is. But a person would be drawn at twice the detail of the floor they
   stand on, and the poster, the machines and the scenery stay coarse.
3. **Everything at 32 × 32, map at 10 × 10 tiles.** The map becomes 320 px at
   1×. On a phone that's the same 320 px as today. On a laptop the only whole
   numbers are 1× (320 px, smaller than today's 480) and 2× (640 px, which
   needs a window about 760 px tall). The most work: about 60 grids, each
   four times the pixels.
4. **Everything at 32 × 32, the map scrolls.** Always 640 px on a laptop, and
   the map panel scrolls when it doesn't fit. This breaks GYM-1's "without
   scrolling", and on a phone you'd lose sight of half the gym.

## Decision

Option 3, with three choices about how:

- **The map's scale stays automatic.** `fitMap()` picks the largest whole
  number that fits, as it does now: 1× on phones and short laptops, 2× where
  640 px fits. A 1280 × 800 laptop gets 320 px, smaller than today; a taller
  screen gets 640 px, larger than today.
- **Upscale first, then redraw.** A script doubles every grid (each pixel
  becomes 2 × 2), so the app looks the same while the code stops assuming 16.
  Each sprite is then redrawn with real 32 × 32 detail, by the designer for
  each group of pages, or by me in a pixel editor.
- **At most 7 colours per sprite plus transparency**, up from 4: ink, the
  look's skin, hair and shirt, and a darker shade of each of those three.
  Each shade comes with its colour choice, so a look is still three choices
  and recolouring stays a palette swap (AV-2).

UI decoration doesn't change: the 4 px decoration pixel (`--px`), borders,
the Paper checker, the 8 × 8 icons, the logo and the 8 px font grid are
interface, not art.

## Consequences

- **Laptops see a smaller map, or a bigger one.** 480 px is gone: it's 320 or
  640, depending on the window. I accept this to keep whole-number scaling
  and a map that never scrolls.
- **Nothing stored changes.** A look is four ids (AV-1), never pixels, and
  positions are tile coordinates (`src/lib/floor.ts`), so there's no
  migration, and walking, stations and the poster keep their logic.
- **Sizes chosen as multiples of 16 must move** to multiples of 32: the head
  crop (42 × 33 px), the avatar editor on a laptop (112 px), the sign-in door
  (80 px). The designer for each group confirms the new ones.
- **About four times the drawing**, the biggest risk in `spec-4-weeks.md`.
  The upscale keeps the app shippable at every step, so if time runs short,
  the sprites not yet redrawn stay as doubled 16 × 16 art.
- **Spec appendices stop copying grids.** At 32 × 32 a copy would be four
  times as long and go stale; `src/sprites/` is the only copy.
- **One branch, one PR.** `main` keeps the 16 × 16 art until all of this is
  done, so Crit 10 (21 Oct) isn't at risk from an unfinished change.
