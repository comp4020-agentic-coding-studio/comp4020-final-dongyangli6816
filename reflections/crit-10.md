# Crit 10 reflection

## What was the breakthrough that moved the work forward?

Taking the tests away from the agent that writes the code. For two crits every
check passed and I left them alone, until one failed twice in five pull
requests. The cause was a test that always picked the grey shirt to check that
the colour changed, when one new account in eight already wore grey. The agent
had written it straight after the code, and an author checking its own work
looks for the passes. So I gave testing to a `qa` agent whose only source of
truth is the spec. Then I found my spec was too thin for that: one line per
feature, and every edge case left to whoever built it. That is why a `pm` agent
now turns each line into acceptance criteria, and I settle its open questions,
before anything is designed, tested or built. On the first feature through
this, the tests caught bugs the builder had missed. The builder also caught
four bugs in the tests, and the rule that it can't edit them meant each one had
to be argued, not quietly loosened.

## What did this work change about who I want to be as a software developer?

I want to stop trusting a check because it is green. A passing test tells me
only as much as the person who wrote it was trying to find, so I want to ask
who wrote it, and from what. I also learned that a rule which keeps everyone
honest has a price. `qa`'s two rounds took about two hours and 240k tokens for
one feature, and added a minute to every test run. I want to be the developer
who weighs that price feature by feature, instead of either skipping the
checks or paying for them everywhere.
