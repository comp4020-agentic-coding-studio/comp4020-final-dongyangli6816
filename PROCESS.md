# Process overview

Version 1, written for Crit 8 (week 9). This page is rewritten at each crit, so
it always describes the project as it stands.

## From the brief to a spec

I started with my own problem, not a feature list: since moving to Australia I
haven't trained, because the friend who kept me honest isn't here.
[`docs/product/idea.md`](docs/product/idea.md) is that idea in my own words. A full product
spec came next, but it was written for a public launch over twenty weeks. So I
cut it down to [a four-week spec](docs/product/spec-4-weeks.md) that fits the
course setup: one 256 MB machine, one volume, and a machine that stops when idle.
That cut, with the reason for each item dropped, is in
[`88b3e0d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/88b3e0d).

The four-week spec is what directs the agent. Each requirement has an ID, and
each week's row in its delivery plan says what ships. Week 9 is accounts, rooms,
logging and history as plain pages, with no gym yet.

## The stack

Astro in server mode on Node, with SQLite on the `/data` volume through Drizzle.
The reasons and the options I rejected (Hono, `node:sqlite`, a single-page app)
are in [ADR 0001](docs/adr/0001-stack.md). The short version: I had already
deployed this stack to Fly in Crit 7, and the cutoff was a day away. Before
trusting it, I ran the CI checks against the Docker image under a 256 MB memory
cap. Its peak was 164 MB.

## How I worked with the agent

I planned in plan mode, deciding which spec copy was current and how big this
week's slice was, before any code. [`CLAUDE.md`](CLAUDE.md) holds my rules,
including that nothing is committed without my approval. The build landed as
one commit per unit, and the feature commits cite the requirement IDs they
build:
[`eb72012...cdcb62f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/compare/eb72012...cdcb62f).
The checks in `spec/` came with the code, in
[`01ce3ef`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/01ce3ef).

One correction: the agent's first commit script didn't stop when a step
failed. A file deletion landed in the wrong commit and the scaffold commit went
missing. Its output showed the error, the agent reported it, and the local
commits were undone and redone in order, before anything was pushed. Because the
redo happened locally, the history no longer shows the mistake, so this paragraph
is the record. The lesson for the harness is that batch steps must stop at the
first failure.
