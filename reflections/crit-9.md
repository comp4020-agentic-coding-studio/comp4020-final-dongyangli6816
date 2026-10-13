# Crit 9 reflection

## What was the breakthrough that moved the work forward?

Giving design its own agent. After Crit 8 the app worked, but every page was
words and buttons, because my only design instruction had been "pixel style,
deep green". Asking the main agent to try harder wouldn't have fixed that,
since it was deciding what a page should be and building it in the same
breath. So I split the job the way my last team did: a `designer` agent that
works from a design system and hands over a mockup, and a main agent that
builds from it. Running the existing pages through that split changed them
more than any prompt had. The join page gained things nobody had asked for:
a hint about the letters a code never uses, and a way out when the room has
closed. The cost is about five times the tokens, and I decided that was worth
paying.

## What did this work change about who I want to be as a software developer?

I want to be the person who designs the team, not only the code. With an
agent, the roles I used to get for free at work (a designer, a branch
policy, a repo someone keeps tidy) only exist if I write them down. This
week I wrote three: the designer, the repository map and the branch rule.
I also learned to decide how hard each rule should push. A rule in
`CLAUDE.md` depends on the agent remembering it, so the design rule also got
a hook. I chose a hook that reminds rather than blocks, because blocking
would have stopped typo fixes too. Writing a rule is easy. Deciding how much
to trust it is the part I want to get better at.
