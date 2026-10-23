# Where a tester's time went: qa's round one on interactions

Oct 22, 2026. The question: `qa`'s round one on the interactions feature
took 2 h 40 min, against about an hour for both of its rounds on the
animations (`../2026-10-20-qa-agent/`). Where did the time go, and what in
the agent's instructions caused it?

## What happened

The feature was interactions, presets and emoji
(`docs/product/criteria/int.md`: about 90 checkable criteria, decisions D1
to D28, INT-1 to INT-5, INT-8 and BOT-6). `pm` and the designer had
finished; round one is `qa` writing the tests before any of it is built.

1. **The first pass**, 07:09 to 09:50 UTC: 71 tool calls, 160 minutes. It
   wrote 65 tests in three files (`spec/interactions.test.ts`,
   `spec/dony-emoji.test.ts`, `spec/browser/interactions.spec.ts`), about
   2,750 lines, more than the room page they test (2,388).
2. **The user asked why it took so long.** I measured the agent's own
   transcript (`timeline.jsonl`):

   | Where | Minutes | Share |
   | --- | --- | --- |
   | The model generating, with no tool running | about 138 | 86% |
   | Inside tools, nearly all running browser tests | about 23 | 14% |
   | Reading and writing files | under 1 | 0% |

   It produced about 336,000 output tokens. The three files it wrote come
   to about 140,000 characters, under 40,000 tokens, so roughly nine tenths
   of the output was the model's own reasoning. Its context grew from
   10,000 tokens to 265,000 over the pass, and each step slows as it grows.
3. **Four causes**, read from the timeline:
   - **Testing looks as well as behaviour.** Many criteria were pixel
     measures from the design (a 52 × 48 px tab, a tray 48 px clear of
     Done). `qa` wrote a browser test for each, with bounding-box and
     hit-test helpers. The largest file, 79,407 characters, followed 4 to 9
     minutes of generation.
   - **Reading whole design files.** The room's design spec is 3,979 lines
     and its mockup 6,402. The first 80 minutes went on reading them and
     the page, a few hundred lines at a time, with 5 to 11 minute gaps
     between reads (`model_s_before` in the timeline).
   - **Running browser tests on a page without the feature.** Every
     locator waits out Playwright's timeout, so the runs took 10.0, 8.8 and
     1.9 minutes to report that nothing was there. They did find one useful
     thing: a test that passed on the unbuilt app.
   - **One agent for four parts at once**, one after another: the contract,
     the HTTP tests, Dony's tests and the browser tests.
4. **The user chose four of five proposed fixes**, made on
   `chore/qa-scope`; the one left out was splitting the work across
   agents:
   - round one tests behaviour only; sizes, positions, colours and art move
     to round two's screenshots, by criterion ID;
   - round one type-checks and runs the HTTP tests once, and doesn't run
     browser tests to watch them fail;
   - `qa` reads only the sections of a design spec it's pointed to, and
     searches the mockup rather than reading it; `CLAUDE.md` tells me to
     name those sections when I brief it;
   - `qa` runs at medium effort.
5. **The revision pass**, 09:50 to 10:11, is in the timeline too: 23 calls
   in 21 minutes, about 13,000 output tokens. The user had also asked for
   faster tests, so `qa` replaced real-time waits with a test-only hook
   that moves stored times back. It was told mid-pass not to run browser
   tests, and didn't.

## What's here

- `timeline.jsonl`: one line per tool call `qa` made, in order: `pass`
  (`first` or `revision`), `at` (UTC), `model_s_before` (seconds since the
  previous tool call ended, the model generating), `tool`, `tool_s`
  (seconds inside the tool), `what` (its description or file), and `chars`
  for a write. No file contents and no tool output.

## How it was made

The agent's transcript is a JSONL file the harness keeps for a background
agent. A Python script paired each `tool_use` with its `tool_result` by id,
took both timestamps, and wrote the lines above; it summed `output_tokens`
and the context size from each turn's `usage`. The transcript itself isn't
kept: it holds the whole of every file the agent read.

## Things to know when judging it

- **"Model generating" is an inference.** The timeline shows when tools ran,
  not what the model was doing between them. Time between calls includes
  waiting on the API as well as reasoning; the token count, not the clock,
  is what says most of it was reasoning.
- **This is one run.** The comparison with the animations feature is rough:
  that feature had 52 criteria, this one about 90, and that time came from
  the agent's usage report, not a timeline.
- **The fixes aren't measured yet.** Whether they shorten the next round
  one is for the next feature to show. The risk is the other way: pixel
  criteria now depend on someone reading screenshots carefully, and the
  last episode's worst bug (missing hair) was a visual one.
- **Medium effort may write thinner tests.** The user accepted that trade.
