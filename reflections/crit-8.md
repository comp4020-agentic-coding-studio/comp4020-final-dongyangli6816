# Crit 8 reflection

## What was the breakthrough that moved the work forward?

Cutting the spec. My first spec described a product for thousands of strangers:
public rooms, moderation, age checks, push notifications, offline sync. Every
one of those was a reasonable feature, and together they made the project
impossible in four weeks. Reading Shirky's "Situated Software" changed the
question from "what does a fitness app need?" to "what do my friends and I
need?" Once the answer was "a squad of friends with a passcode", most of the
list fell away on its own, because strangers were what made it necessary. The
four-week spec that came out of that cut is short enough for the agent to
follow and for me to check its work against, requirement by requirement.

## What did this work change about who I want to be as a software developer?

I want to be someone who decides what not to build, and writes down why. The
agent will happily build everything in a spec, so the spec is where my
judgement has to be. I also learned that a batch of agent actions needs
checking as a whole: one failed step in its commit script quietly put the rest
of the history out of order. Now I check what is actually in each commit, not
just that the commits exist.
