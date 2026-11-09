# Workflow diagram

## The question

What does the workflow look like at submission: how several agent teams run
at once, and what one team does with a feature, from the line I write to the
merge I approve?

## What happened

The workflow grew one piece at a time, across three crits, and `PROCESS.md`
told it in that order. This diagram draws it as it stands at submission, in
two levels: on 5 November three features were built at once, one team per
worktree (PRs #27, #30 and #31), and the room interaction lane is drawn again
close up, step by step.

## What's here

- `workflow.png`: the diagram that `PROCESS.md` shows.
- `workflow.html`: the page it was taken from.

## How it was made

`workflow.html` draws each role with the app's own sprites (from
`/sprites.svg`, which `scripts/shot.mjs` builds from `src/sprites/`) and the
Night colours of `docs/design/system.md`. The tool in each role's hand
(clipboard, stamp, palette, magnifying glass, wrench, camera) isn't in the
app, so it is drawn as a pixel grid in the page's own script. To make the
image again:

```
node scripts/shot.mjs docs/evidence/2026-11-09-workflow-diagram/workflow.html .shots/workflow/workflow
```

and copy `.shots/workflow/workflow-desktop.png` here as `workflow.png`.

## Things to know when judging it

- **What git shows for the three lanes.** All three branches were cut from
  the same commit, `1503a8e` (4 Nov, 12:48), and the two merged later each
  had to merge `main` back in (`28e7ed7`, `6ad6621`, `340674e`). The reflog
  shows `feat/room-interaction` created on 4 Nov at 18:26, a day before any of
  the three branches had a commit. Their commit times on 5 Nov run one after
  another (delivery 09:41 to 10:52, logbook 11:48 to 14:01, room 18:22 to
  20:31), because each branch was committed when its feature was finished,
  not as the work went. So the commits show three branches from one base, but
  not the exact hours the work overlapped.
- **What the lanes don't claim.** The NOW tags show one example moment, not a
  record. The worktree folders and dev-server ports are left out: only
  `.claude/worktrees/room-interaction` still exists, so the other two can't
  be checked.
- **The close-up's request** is the start of the one quoted, translated, in
  `docs/product/criteria/room-feel.md`, "The request" (4 Nov).
- The close-up shows the path of a feature that changes a page. Server logic,
  fixes and docs skip the `pm`, designer and `qa` steps.
- I appear as Dony, the app's own character. The other characters and their
  colours are illustration. They aren't part of the harness.
- It shows the steps only. The rules that hold throughout (`CLAUDE.md`, the
  design-gate hook, the design system) and the stack are in `PROCESS.md`.
- It was drawn after the work, on 9 November, not captured while it happened.
