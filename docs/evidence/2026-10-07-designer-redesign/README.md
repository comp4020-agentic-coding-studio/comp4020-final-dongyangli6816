# Designer-agent redesign: before and after

Oct 7, 2026. The question: does adding the `designer` subagent
(`.claude/agents/designer.md`) and the design system (`docs/design/system.md`)
make the pages look better than the main agent styling them on its own?

## What happened

1. Every page and state was screenshotted as it stood
   ([`4fc046e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/4fc046e)).
2. Seven `designer` agents ran in parallel, one per page, each writing a
   mockup and a spec to `docs/design/<page>/`
   ([`3a67afc`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/3a67afc)).
   Each was told to keep every form, field and link, and to list changes to
   the shared layout separately so the main agent could reconcile them once.
3. The main agent built the pages from the mockups and merged the seven
   layout-change lists
   ([`55fad94`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/55fad94)).
4. The same pages and states were screenshotted again
   ([`132f839`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/132f839)).

## What's here

- `before/` and `after/`: 16 states × 2 widths each, named
  `<state>-mobile.png` (390 px) and `<state>-desktop.png` (1280 px), whole
  page.
- `compare.html`: open it by double-clicking; each state before and after,
  side by side, with a width toggle.

## How the shots were made

A local dev server on a throwaway database, seeded through the app's own forms:
Mia, Ji-woo and Tom in one room, Mia with a finished workout (bench press,
back squat, lat pulldown) and a live one (deadlift, pull-up), and Priya, a new
account alone in her own room, for the empty states. Error states were made by
filling and submitting the form in the browser. The same seed and the same
capture script were used for both sets, so the only change between them is the
code. "12 min ago" and "So far" figures depend on when the shot was taken.

The capture script became `scripts/shot.mjs`. Its predecessor, `shot.sh`,
couldn't render below 500 px wide; all seven designers reported this
independently (see the end of each `docs/design/<page>/spec.md`).

## Things to know when judging it

- The sign-in and sign-up designs don't match each other (a gym door versus an
  avatar with a name tag): the parallel designers couldn't see each other's
  work, and the main agent built each as drawn rather than merging them.
- The `design-critic` agent was not run on this round.
