# A tester who didn't build it: the qa agent on the exercise animations

Oct 19–20, 2026. The question: does a separate `qa` agent, writing tests
from the acceptance criteria before the code exists and forbidding the
builder from editing them, catch bugs the builder would have shipped? And
what does it cost?

## What happened

The feature was the biggest change on the branch: a redesigned person and
eight two-frame exercise animations, the person drawn on the machine between
its back and front layers (`docs/product/criteria/animations.md`, 52
criteria, decisions D1 to D8). It went through the pipeline `CLAUDE.md`
describes under "Deciding and testing features": `pm` wrote the criteria, I
settled eight questions, a designer drew the art, `qa` wrote the tests, I
built, `qa` ran them.

1. **Round one, before the build.** `qa` wrote 7 HTTP tests
   (`spec/animations.test.ts`) and 26 browser tests
   (`spec/browser/animations.spec.ts`) from the criteria and the design
   spec, never from code. Where the design hadn't fixed a hook it wrote a
   contract (for example: `data-pose` is the machine's id while Lifting; the
   two drawings are `g.frame-1` and `g.frame-2`), and I built to it.
   Against the old build, 29 of the 33 failed for the right reason; the 4
   that passed guard behaviour that must not change.
2. **The build, first run.** All 71 HTTP tests passed. In the browser, 37
   of 44 passed. The 7 failures turned out to be three code bugs and four
   test bugs. The rule *don't edit the tests to make them pass* meant each
   one had to be argued, not patched:
   - **Code bugs, which I fixed:**
     - your own avatar jumped to the machine after Start set instead of
       walking there. The page swaps the whole room section in place, map
       included. Other people's screens were right, and so were my
       screenshots, which were taken from someone else's view;
     - under reduced motion the standing figure still bobbed (a CSS
       specificity mistake, invisible in a still);
     - Dony sometimes walked in his standing pose after hopping off his
       poster (two timers racing).
   - **A bug I thought I'd found, and hadn't.** The reconnect test's
     failure looked like an old bug on `main`: a room page whose first
     live-update request fails never reconnects. `reconnect-trace.jsonl` is
     what convinced me: the stream request fails at 50.810 (`status: -1`),
     and no new one follows before the trace ends. I wrote a fix that
     retried after a second, and told `qa` the bug was real. Before
     committing, I ran the original code with a longer watch. The browser's
     EventSource does retry on its own, 3 s after the failure. The trace
     simply stopped 2 s after the failure, before the retry. The fix was
     dropped, and the test, once `qa` made it wait for the new stream
     request, passes on the original code.
   - **Test bugs, which I sent back** with my reasons, since I couldn't edit
     the tests:
     - a helper cut the rest to 0 s, but the server only counts a rest above
       0 s, so the slacking test could never reach Slacking. The same mistake
       in an HTTP test meant that test could never fail;
     - two tests filled a form on a page that doesn't show it;
     - a reconnect test waited for a "Live" badge that shows from the start,
       so it proved nothing;
     - a probe read the page between a change and its next sampling frame.
3. **What `qa` missed, and I caught.** On every machine the hair was gone.
   The body was drawn over it, and the screenshot showed bald people.
   GYM-10.11 ("every hair style reads in every frame") is marked *judged*,
   so no test checks it.
4. **Round two.** `qa` agreed with all four test bugs and fixed them without
   loosening an assertion. Rerunning each browser test 20 times found a
   fifth (1 failure in 20, a walk of a single tile can't show both strides).
   `pnpm check` is green: typecheck, 71 HTTP, 44 browser tests. It
   compared screenshots with the room mockup and listed two gaps in the
   criteria for me to decide: whether "Wolf cut" may wrap at 390 px, and
   whether a 0 s rest should ever turn Slacking.

The feature is [`85f65d8`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/85f65d8),
on top of its criteria ([`cc9fb84`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/cc9fb84))
and the tile and prop redraw ([`ea64cb6`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/ea64cb6)).
`qa`'s tests are in the feature commit with the code, because they were
only final once round two had fixed them.

## What's here

- `reconnect-trace.jsonl`: every request to the room from the failing
  reconnect test's late screen, from the Playwright trace. It is the
  evidence that misled me: it ends 2 s after the failed request, a second
  before the browser's own retry.
- `busy-room-*.png`: after the fixes. People on their machines; Ji-woo,
  Tom and Priya slacking in front of theirs with the machine shown whole.
- `away-*.png`: everyone else has been offline over 60 s. People fade, the
  machines' front parts don't (GYM-14.1).
- `eight-machines-frame-1-*.png` and `-frame-2-*.png`: one person on each
  of the eight machines, with both frames forced, so a still shows both
  drawings.

## How it was made

- The tests run with `pnpm check` against the production build:
  `pnpm build`, then `DATA_DIR=<empty dir outside the repo> PORT=8080
  node dist/server/entry.mjs`.
- The reruns (each new browser test 20 times, each HTTP test 10) and the
  screenshots are `qa`'s, from its round-two report. The screenshots come
  from `scripts/shot.mjs` against that server, with the frames held still
  for the frame-1 and frame-2 pair; the exact commands weren't kept.
- The trace is Playwright's `--trace on` for the reconnect test before the
  fix, reduced to the room's requests with `jq`.

## Things to know when judging it

- **The test bugs were cheap to make because the tests came first.** Five
  of the 33 new tests were wrong, and one couldn't fail. `qa` couldn't check
  its tests against real behaviour, and the builder couldn't fix them. The
  rule that forced an argument for each failure is also what made those
  arguments slow. Either way, none was fixed by weakening a check.
- **The builder's diagnosis needs checking too.** I first counted four code
  bugs, and told the user so. The reconnect one wasn't a bug, and only a
  second, longer experiment showed it. A rule that stops the builder
  editing tests doesn't stop the builder misreading a failure; this time
  the failure would have been "fixed" with code nobody needed.
- **Visual problems need eyes.** The worst bug, the missing hair, sat in a
  criterion marked *judged*. `qa`'s round-two screenshots would probably
  have shown it, but I found it first, in my own screenshot.
- **Cost:** `qa`'s two rounds took about two hours of agent time and about
  240k tokens, from the agent's own usage report.
  The new tests add about a minute to `pnpm check`, because three of them
  have to wait out real time (45 s, 47 s and 65 s).
- **Some judged criteria are still open.** GYM-10.26 (a newcomer names 6 of
  the 8 animations) needs a person. `qa` flagged the bench and the platform
  as the pair most likely to be confused at 1×.
- **Reduced motion isn't shown here**, because `shot.mjs` can't emulate
  it; the GYM-10.23 test covers it.
