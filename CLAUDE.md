# Your harness

This file is yours, and it arrives empty on purpose. The rules you hold the
agent to are part of what gets marked, so they should be rules you decided on.

Nothing about the template is recorded here. What the repo ships is explained
where it lives --- `fly.toml`, the `Dockerfile`, the CI workflow and
`spec/README.md` each say what they fix --- and the course website publishes the
[final project brief](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/assessments/final-project/).
What the agent needs to carry from any of it is your call.

## Enrolment

I'm enrolled in **COMP8020**, not COMP4020. That means:

- the submission includes `research-note.md` in the repo root: a cited position
  on good agentic development practice, 600–800 words, worth a quarter of the
  project. No crit and no check covers it, so don't let it drop off the plan.
- the project weights are process 35%, deployed app 20%, response to the brief
  20%, research note 25%.
- the research note argues about the field, from the literature; arguments about
  this app belong in `README.md`, and arguments about how I worked belong in
  `PROCESS.md`.


## Repository map

Where things live, one line per folder. Look here before creating a file, and
put it where its kind already goes.

```
CLAUDE.md  PROCESS.md        course-fixed, root: the harness; how I worked
README.md  research-note.md  course-fixed, root: the app's case; the note
reflections/crit-N.md        course-fixed names, one per crit (8, 9, 10)
spec/                        course-fixed: checks run against the live app
src/pages/                   routes; one .astro (or .ts endpoint) per URL
src/layouts/Layout.astro     page shell and every global style and token
src/components/              shared .astro components
src/lib/                     server logic: db, auth, rooms, workouts, logbook
src/sprites/                 pixel art as character grids, one subject each
drizzle/                     generated migrations (pnpm db:generate), no hand edits
scripts/                     repo tools; shot.mjs takes every screenshot
docs/product/                idea.md, spec-4-weeks.md (directs the build),
                             spec-mvp.md (full spec, reference only)
docs/adr/                    NNNN-<slug>.md, one decision each
docs/design/                 system.md (design rules); <page>/ holds that
                             page's mockup.html and spec.md; no images
docs/evidence/               YYYY-MM-DD-<slug>/, one per episode PROCESS.md cites
.claude/agents/              subagent definitions (designer)
.shots/  data/  dist/        gitignored: working screenshots, local db, build
```

Rules for placing things:

- **Evidence** is captured when it happens, before the state is gone. Each
  folder's `README.md` gives the question, what happened with commit links,
  what's in it, how it was made, and what to watch for when judging it.
- **Screenshots** always come from `scripts/shot.mjs`. Working shots go in
  `.shots/<page>/`; one kept as evidence is copied into its evidence folder as
  `<state>-mobile.png` / `<state>-desktop.png`.
- **Temporary** scripts, seed data and servers stay outside the repo (or in
  `.shots/`) and are cleaned up afterwards.

Keeping the map true:

- A commit that adds, moves or removes a folder, or starts a new kind of file,
  updates this map in the same commit. A stale map is worse than none.
- List folders and kinds of file, not single files, except the few every
  change touches.
- When one folder needs more than a line or two of its own rules, give it its
  own `CLAUDE.md` (Claude Code reads it when working there) and leave one line
  here. Keep this file short.

## Designing pages

A new or redesigned page is designed by the `designer` agent before it is
built, one designer per group of sibling pages, so pages that do the same kind
of job share their patterns. Give it every page of the group that's changing,
plus the siblings already designed that it must match without redesigning
them. Groups can be designed in parallel.

| Group | Pages |
| --- | --- |
| Auth | `signin`, `signup` |
| Lobby | `home` (`index`), `join` |
| Logbook | `history` |
| Gym | `room` |
| About | `readme` |

A new page joins the group it most resembles, or starts its own; update this
table in the same commit.

I won't ask for the designer by name. With every idea or change I give you,
decide first whether it changes a page, and if it does, send it to the
designer before touching `src/`:

- **Designer first**: a new page; adding, removing or moving anything on a
  page; a layout change; a new state (empty, error, pending, success); a
  feature that needs new UI.
- **Edit directly**: server logic, tests and docs; a fix that doesn't change
  how a page looks; a typo or a one-line wording change; bringing a page back
  in line with its mockup.
- **Unsure**: designer first.

Before acting, say in one line which way it went and why, naming the group
("this adds a field to sign up, so it goes to the Auth designer"), so I can
overrule it. Then build from the mockups, and screenshot the built pages
against them.

## Git Commit Convention

Never commit without my approval: stage the logical unit, propose the message,
and wait for a yes. Never push unless I ask.

Commit after each logical unit of work; don't batch everything into one commit
at the end. Follow [Conventional Commits](https://www.conventionalcommits.org/):

- Format: `<type>(<scope>): <description>`
- Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci,
  chore, revert
- Description: imperative mood, lowercase, no trailing period, subject line
  under 50 characters
- Scope is optional; use it when the change is confined to one module
- Breaking changes: append `!` after the type and add a
  `BREAKING CHANGE: <what broke>` line in the body
- Add a body only when the "why" isn't obvious from the subject line

Examples:

```
feat(auth): add password reset flow
fix(cart): prevent duplicate items on rapid clicks
perf(query): cache user lookup to avoid n+1
refactor(api): extract validation into middleware
```