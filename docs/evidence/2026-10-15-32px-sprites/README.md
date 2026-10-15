# Redrawing every sprite at 32 px, with four designers and a budget

Oct 14–15, 2026. The question: can the agent redraw all of an app's pixel art
at four times the pixels, through the designer agents the harness requires,
without the app ever looking broken, and what does that cost?

## What happened

1. **The groundwork came first** (#13): the art moved to one place,
   `src/sprites/`, and the mockups started drawing it from a shared sheet, so
   a redraw changes one copy, not nine.
2. **The decision** ([`e22d836`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/e22d836)),
   ADR 0005: 32 × 32 sprites and tiles, a map of 320 px or 640 px (whole-number
   scaling rules out today's 480), and 7 colours per sprite instead of 4. I
   first chose 6; the agent pointed out that a shade for each of skin, hair and
   shirt makes 7, and I changed it.
3. **Upscale before redrawing** ([`c428c74`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/c428c74)):
   every 16 × 16 grid was exported doubled, so the code stopped assuming 16
   while the app looked the same. All 169 mockup state screenshots matched
   before and after, pixel for pixel.
4. **Four designers, by who owns what.** The person appears on every page, so
   one group (Lobby) owned it and the Gym group built its poses from it
   afterwards, rather than four designers drawing four different people:
   - Logbook, the empty logbook's dumbbell ([`eeaddf1`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/eeaddf1));
   - Auth, the sign-in door ([`ddd45fe`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/ddd45fe));
   - Lobby, the person, four hair styles and a hand-picked shade for all 22
     swatches ([`6394a84`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/6394a84));
   - Gym in two runs: the poses, Dony and the poster ([`0fa31a7`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/0fa31a7)),
     then the tiles and machines ([`3da4a20`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/3da4a20)).
5. **The budget ran out mid-flight.** The first three designers were launched
   on 14 Oct with the week's $200 nearly spent; all three stopped before
   writing anything. They were resumed the next morning, under a new $100
   week, with a tighter brief: shoot only changed states, at most three rounds
   of look-and-fix per grid.
6. **The build** ([`aa448e9`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/aa448e9)):
   the grids went into `src/sprites/`, and the mockups were pointed back at the
   shared sheet. All 127 of their state screenshots matched the designers' own
   copies, so the code draws exactly what was designed. A designer's finding
   changed the plan here: the map was held at 320 px on a laptop by the page's
   width, not its height, so the room page widened (room spec, Departure 19).

## What's here

- `before/` and `after/`: the room, avatar editor, home and sign-in pages,
  each at 390 px and 1280 px wide, before the upgrade and after it.

## How it was made

A throwaway script (not kept) started the production build with an empty
database, signed up four people with fixed looks (AV-1), opened a room with
them in different states, and shot each page with `scripts/shot.mjs`, with
animation turned off. The same script ran before the upgrade and after it.

## Things to know when judging it

- **Before and after aren't pixel-comparable on built pages**: each run has a
  new passcode and live clocks. The pixel-exact checks were on the mockups
  (steps 3 and 6), where nothing is live.
- **The 1280 px desktop shot is 1280 × 800 of viewport.** A real 1280 × 800
  laptop has a shorter browser window, about 710 px inside, so there the map
  is still 320 px. 640 px needs a window at least about 760 px tall.
- **Cost, from the course proxy:** the four designer groups took about $28
  of the second week's budget: Logbook and Auth about $3 together, Lobby $3.40
  (18 minutes), Gym part 1 $15.50 (65 minutes, 84 tool calls), Gym part 2
  $6.50 (32 minutes, 49 tool calls). Part 2 was briefed to make far fewer tool
  calls than part 1, and did.
- **Page weight**: drawing 32 px art one `<rect>` per run took the room page
  from 519 KB to 779 KB of HTML; one `<path>` per colour took it to 209 KB.
- **Known imperfections**, as the Gym designer reported them: at 1× the cable
  machine and the pull-up bar read mainly as frames, and the "1" of bay 10
  sits slightly left.
