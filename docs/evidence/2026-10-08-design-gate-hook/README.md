# From an instruction to a hook: the design gate

Oct 8, 2026. The question: a rule in `CLAUDE.md` only works while the agent
remembers it and judges well. Does backing it with a harness hook, which runs
whatever the agent remembers, close that gap, and at what cost?

## What happened

1. The rule came first, as an instruction: with every idea or change, the
   agent decides whether it changes a page and, if so, sends it to the
   `designer` before touching `src/`, saying in one line which way it went
   ([`2286a37`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/2286a37)).
2. The agent pointed out that an instruction is not a guarantee: it could
   misjudge a change as small, or forget. Three hook strengths were weighed:
   - **A, remind**: let the edit through, and tell the agent this page has no
     fresh design;
   - **B, ask**: pause, and ask me to approve the edit;
   - **C, block**: refuse the edit until a designer has run.

   I chose A. It keeps me out of the loop for routine edits and puts the
   reminder in front of the agent at the moment the rule matters. B would
   have made me the check; C would also have stopped typo fixes and needed a
   way around it.
3. The hook was built, tested, and registered in the commit that adds this
   folder: `scripts/hooks/design-gate.mjs`, run by `.claude/settings.json` on
   every Edit and Write.

## How it decides

- Only page files count: `src/pages/**/*.astro`, `src/layouts/Layout.astro`
  and `src/components/`. Anything else passes silently.
- A page has a **fresh** design when its `docs/design/<page>/mockup.html` was
  modified after the page file's last commit, i.e. a designer has drawn it
  since. For the shared shell, any fresh mockup counts.
- With no fresh design, it adds a reminder to the agent's context (and a
  one-line notice in my terminal) and logs the edit to
  `.shots/design-gate.log`. It never blocks, and any failure in the script
  stays silent.

## Tests

Piped hook input, before registering it:

| Case | Result |
| --- | --- |
| `src/lib/workouts.ts` (server code) | silent |
| `src/pages/join.astro`, mockup older than the page | reminder |
| the same, mockup just redrawn | silent |
| `src/layouts/Layout.astro`, no fresh mockup | reminder |
| `src/pages/summary.astro`, a new page with no mockup | reminder |
| `src/pages/rooms/[id].astro` (maps to `room`) | reminder |

Live, after registering it: a one-line comment added to
`src/pages/history.astro` and then removed brought the reminder both times,
and both were logged. The agent answered each by saying it was a test, not a
page change. Writing this file, which is not a page, brought nothing.

## Things to know when judging it

- **It doesn't see shell edits.** The agent often edits files with
  `python3` or `sed` through the Bash tool, which the `Edit|Write` matcher
  misses. `CLAUDE.md` now says page files are edited only with Edit and
  Write; that part is still an instruction.
- **"Fresh" is a file-time heuristic.** It proves a design was drawn after the
  page last changed, not that the edit matches it. Whether the build follows
  the mockup is still checked by screenshots.
- **It fires on every edit of a stale page**, including legitimate small
  ones, so its value depends on the agent answering it honestly rather than
  waving it through.
- The log in `.shots/` is not kept in git. Counting its lines later shows how
  often the reminder fired; whether it ever changed a decision has to be
  recorded when it happens.
