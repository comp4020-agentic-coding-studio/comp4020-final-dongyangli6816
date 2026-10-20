# Process overview

Version 3, written for Crit 10 (week 11).

## From the brief to a spec (Crit 8)

The final project asks for something completely different from the crits and the earlier assignments. All it requires is a multi-user website, which is easy. But that also means there is much more room to show what I learned and thought about this semester.

The easy way to pick a topic would be to ask Claude for suggestions. The problem is how attention works: Claude's ideas are always reinventing the wheel. You can find a thousand similar websites online. I wanted to build something nobody had tried before, and something that actually solves a problem.

So I wrote down [a rough idea](docs/product/idea.md) from my own story: a virtual gym that lets people work out together even when they live apart. I believe an app like this would actually push someone like me to go back to the gym and start training again.

Then I fed this rough idea to the agent. I asked for a production-grade spec, and it gave me [a launch plan stretching over twenty weeks](docs/product/spec-mvp.md). So I had to ask it again to cut the plan down to [four weeks](docs/product/spec-4-weeks.md), which is what this project actually needs ([`88b3e0d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/88b3e0d)). From then on I used that doc to keep the agent pointed at the goal ([`fce8475`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/fce8475), [`36eea8b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/36eea8b)).

## Choose the tech stack (Crit 8)

When selecting tech stacks, I asked Claude to give me several options based on the project. Eventually I chose Astro in server mode on Node, with SQLite on the `/data` volume through Drizzle.
Full details in [ADR 0001](docs/adr/0001-stack.md). In short, the machine has256 MB, one volume and no database server, so the stack has to be one process that owns its own file.

## First build (Crit 8)

With the spec doc ready, I started building. The first thing I did was migrate my `CLAUDE.md` rules from [the last crit](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-dongyangli6816/blob/960131a/CLAUDE.md), but this time I only brought over the git rule instead of all of them ([`c8718ed`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/c8718ed)). This project is not like any of the previous crits or assignments. It is a full stack app that will take more than a month and around $1000 of tokens to build, so rules that worked on a small prototype may not work here. I kept the git rule and started the rest fresh.

The building stage for Crit 8 went smoothly. The spec doc was good enough that a couple of simple prompts got me a small demo page ([`c8718ed...01ce3ef`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/compare/c8718ed...01ce3ef)). The design is not as good as I pictured though ([the pages as shipped](docs/evidence/2026-10-07-designer-redesign/before/), tag [`crit-8`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/tree/crit-8)), so next week, on top of the crit tasks, I want to work on the design of the app.

## My first agent - designer (Crit 9)
This follows up on my concern from last week. When I built the first version of the app, the only design instruction I gave Claude was pixel style and a deep green theme ([`8f3c111`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/8f3c111)). The result was so AI. Every page was just words and buttons. It read like a ten thousand word essay written by AI, the kind that makes you lose interest in a millisecond.

What fixed it was a separate agent that only does design. At my last job as a software engineer I always worked with a UI/UX designer, and they designed our pages off a big design system: which colors to use, which colors to avoid, who our users are, and so on. I wanted the same thing in my workflow, so I asked Claude to build my first custom agent, [the designer](.claude/agents/designer.md), along with [the design system](docs/design/system.md) it designs from ([`f010c1b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/f010c1b)).

To put the designer into the workflow, I added a `CLAUDE.md` rule: the main agent has to decide whether a feature touches a page. If it does, it has to wake the designer first and design the page before implementing it ([`2286a37`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/2286a37)). The main
agent is not allowed to edit any front end code without a design in hand. I also added the same rule as a hook ([`4acfc6b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/4acfc6b); [why a hook](docs/evidence/2026-10-08-design-gate-hook/README.md)).

Then I ran the existing pages back through this workflow, and it worked incredibly well ([`4fc046e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/4fc046e), [`3a67afc`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/3a67afc), [`55fad94`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/55fad94), [`132f839`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/132f839); [how it was run](docs/evidence/2026-10-07-designer-redesign/README.md)). The contrast is below.

| Home, before | Home, after | Join, before | Join, after |
| --- | --- | --- | --- |
| <img src="docs/evidence/2026-10-07-designer-redesign/before/home-signed-out-mobile.png" width="160" alt="The signed-out home page at 390 px before the redesign: a headline card and three identical text cards, one per step"> | <img src="docs/evidence/2026-10-07-designer-redesign/after/home-signed-out-mobile.png" width="160" alt="The signed-out home page at 390 px after the redesign: a preview of what the squad sees, with avatars and lifting, resting, slacking and finished badges, then the three steps as numbered sets"> | <img src="docs/evidence/2026-10-07-designer-redesign/before/join-mobile.png" width="160" alt="The join page at 390 px before the redesign: a single card with a passcode field and a Join button"> | <img src="docs/evidence/2026-10-07-designer-redesign/after/join-mobile.png" width="160" alt="The join page at 390 px after the redesign: a door icon, six character boxes for the passcode with a hint about letters it never uses, and a way to start a new room if the old one has closed"> |

It does come at a cost. On the same page, the designer workflow uses about five times as many tokens and takes about ten times as long as doing it without a design step. Thanks to the Opus 5.5 update brought the price down though, so I can live with the trade off.

## Other Claude.md rules I added (Crit 9)
**Repository map** As the project got bigger, every new conversation started the same way: I asked Claude to do something, and it spent longer and longer walking the project to find the file it had to edit. The docs were part of the problem. Every workflow I added left more of them lying around the repo, with no order to any of it. So I made a repository map, so the agent can look up which file to edit and where a new file belongs ([`fce8475`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/fce8475)).

**Branches and pull requests** This is for repo protection and it is a common practice in industry. AI is non-deterministic, and on a project this size it can run out of context and just commit everything it has, finished or not, straight to my main branch. I added the rule to keep that off main and keep the commit history readable ([`4fbc0ed`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/4fbc0ed)). Before it, every commit went straight to `main` ([`88b3e0d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/88b3e0d) to [`207ea31`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/207ea31)); after it, each feature arrived as its own pull request ([`9337b9d...c8e3dd3`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/compare/9337b9d...c8e3dd3)).

## My second and third agents - pm, qa (Crit 10)
For Crit 8 and Crit 9 I did not pay much attention to the tests. I let the main agent write all the CI checks and they all passed, so I left them alone. Then, while I was submitting last week's work, I noticed one check had failed twice in five PRs. I went looking for what went wrong, and it turned out to be a badly designed test. The agent wanted to check that changing the shirt color works, so it wrote a check that always picks the grey shirt and then looks at whether the color changed. But the shirt color is picked at random when the page loads, so one time in eight the shirt is already grey, the color does not change, and the test fails ([the test](spec/browser/lobby.spec.ts), fixed in [`ef92e02`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/ef92e02)).

I asked Claude to fix the test, then started thinking about how to avoid bugs like it. After looking into it, I think the mix of roles is the reason. The main agent wrote all the tests right after it finished writing the code. When you ask someone to check their own work, they look for the passes. With Claude it is worse: a lot of the time it will just loosen the test until it passes. So I decided to separate testing from coding (the "Deciding and testing features" rule in [CLAUDE.md](CLAUDE.md)).

The idea behind this agent is that the QA agent's only source of truth should be the spec doc, not the coder, so the tests it writes stay faithful to what the app is supposed to do. But I found [my spec doc](docs/product/spec-4-weeks.md) is too vague for a QA agent. It usually describes a feature in one line and says nothing about edge cases. In the past weeks that was fine, because the main agent decided most of those cases itself while implementing, and only asked me about a few.

So I added [a PM agent](.claude/agents/pm.md). Its job is to take a one line feature and turn it into a doc listing the expected behaviors, based on things like who our users are and the vibe of the app ([its criteria files](docs/product/criteria/), for example [the animations](docs/product/criteria/animations.md)). With that doc in hand, I could finally build [the QA agent](.claude/agents/qa.md) ([`17f564f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/17f564f)). Below is the full workflow for a feature that touches the front end.

```mermaid
flowchart LR
  input(["me<br/>one-line feature"]) --> size["main agent<br/>size, branch"]
  size --> pm
  pm["pm<br/>criteria"] --> me{"me<br/>settle"}
  me --> designer["designer<br/>mockups"]
  designer --> qa1["qa round 1<br/>tests"]
  qa1 --> build["main agent<br/>build"]
  build --> qa2["qa round 2<br/>run, screenshot"]
  qa2 --> merge(["I approve<br/>and merge"])
  qa2 -.->|code bug| build
  build -.->|test looks wrong| qa1
  qa2 -.->|criteria gap| me
```
After adopting this workflow, my tokens and time flowed away like water: on the first feature through it, the exercise animations, qa's two rounds alone took about two hours of agent time and 240k tokens, and its new tests add about a minute to every `pnpm check`. It did catch some bugs the main agent had missed. But the main agent also found four bugs in the tests themselves ([evidence](docs/evidence/2026-10-20-qa-agent/README.md); criteria [`cc9fb84`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/cc9fb84), feature and tests [`85f65d8`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/85f65d8)), so I will keep working on the workflow.
