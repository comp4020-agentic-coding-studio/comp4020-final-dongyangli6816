# Spotter

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
spec/                        course-fixed: checks run against the live app;
                             browser/ holds the Playwright ones (the page's script)
src/pages/                   routes; one .astro (or .ts endpoint) per URL
src/layouts/Layout.astro     page shell and every global style and token
src/components/              shared .astro components
src/lib/                     server logic: db, auth, rooms, workouts, logbook
src/sprites/                 pixel art as character grids, one subject each;
                             the only copy: mockups draw it via sprites.ts
drizzle/                     generated migrations (pnpm db:generate), no hand edits
scripts/                     repo tools; shot.mjs takes every screenshot and
                             serves mockups the sprite sheet sprites.ts builds;
                             hooks/ holds the scripts .claude/settings.json runs
docs/product/                idea.md, spec-4-weeks.md (directs the build),
                             spec-mvp.md (full spec, reference only)
docs/product/criteria/       <area>.md: acceptance criteria per spec area,
                             written by the pm agent, settled by me
docs/adr/                    NNNN-<slug>.md, one decision each
docs/design/                 system.md (design rules); <page>/ holds that
                             page's mockup.html and spec.md; no images
docs/evidence/               YYYY-MM-DD-<slug>/, one per episode PROCESS.md cites
.claude/                     agents/ (subagent definitions), settings.json (hooks)
.shots/  data/  dist/        gitignored: working screenshots, local db, build
```

- **Evidence**: read `docs/evidence/README.md` before starting a folder there.
- **Screenshots** always come from `scripts/shot.mjs`; working shots go in
  `.shots/<page>/`.
- **Temporary** scripts, seed data and servers stay outside the repo (or in
  `.shots/`) and are cleaned up afterwards.
- A commit that adds, moves or removes a folder updates this map in the same
  commit; the map lists folders and kinds of file, not single files. A folder
  that needs more than a line of rules gets its own `CLAUDE.md`, with one line
  left here.

## Deciding and testing features

A feature that adds or changes behaviour a person can see is decided before
it is designed, and tested by someone who didn't build it:

1. **`pm`** turns its requirements into acceptance criteria in
   `docs/product/criteria/<area>.md`, plus open questions, each with a
   recommended answer. Show me the questions; I settle them; send my answers
   back to the same `pm` to finalise the file.
2. **`designer`**, if a page changes (see below), designs from the agreed
   criteria.
3. **`qa`**, round one, writes the tests from the criteria and the designs,
   before the build.
4. Build until those tests pass. **Don't edit the tests to make them pass**:
   if one looks wrong, send it back to `qa` or ask me.
5. **`qa`**, round two (the same agent, continued), runs, reruns and
   screenshots, and reports code bugs, test bugs and gaps in the criteria.

While building, any behaviour a person can see that the criteria don't
decide is mine to decide: stop and ask, add the answer to the criteria
through `pm`, and have `qa` cover it. Internal details stay yours.

Server logic, fixes, docs and anything with no visible behaviour skip this.
Say in one line whether a request goes through `pm` and why.

## Designing pages

A new or redesigned page is designed by the `designer` agent before it is
built: one designer per group of sibling pages, given every page in the group
that's changing plus the designed siblings it must match. Groups can run in
parallel. A new page joins the group it most resembles, or starts its own,
and the table changes in the same commit.

| Group | Pages |
| --- | --- |
| Auth | `signin`, `signup` |
| Lobby | `home` (`index`), `join`, `avatar` |
| Logbook | `history`, `summary` |
| Gym | `room` |
| About | `readme` |

I won't ask for the designer by name. With every idea or change, decide first
whether it changes a page:

- **Designer first**: a new page; adding, removing or moving anything on a
  page; a layout change; a new state (empty, error, pending, success); a
  feature that needs new UI.
- **Edit directly**: server logic, tests and docs; a fix that doesn't change
  how a page looks; a typo or a one-line wording change; bringing a page back
  in line with its mockup.
- **Unsure**: designer first.

Say in one line which way it went and why, naming the group, so I can
overrule it. Then build from the mockups and screenshot the built pages
against them. Edit page files only with Edit and Write, never a shell command,
so the design-gate hook sees them.

## Branches and pull requests

With every request, judge its size before starting, and say in one line which
it is and why, so I can overrule it:

- **Medium or large** (a feature, a page change that goes through the
  designer, a refactor, a harness change beyond a line or two, anything that
  will take more than one commit): branch from an up-to-date `main` as
  `<type>/<slug>` (`feat/rest-timer`), one branch per request.
- **Small** (one commit: a typo, a single fix, a doc or config tweak): commit
  on the current branch.
- **Unsure**: branch.

When a branch's work is committed, propose the PR title and summary; push and
open it once I say yes. Merge only after its checks pass and I say so, since
merging to `main` deploys. Merge with a merge commit, never a squash, so the
SHAs `PROCESS.md` cites survive; then delete the branch and return to an
up-to-date `main`.

## Commits

Never commit without my approval: stage one logical unit, propose the
message, wait for a yes. Never push unless I ask, apart from the pull
request flow above. Commit each unit as it's done, not in one batch at the
end.

Conventional Commits: `<type>(<scope>): <description>`, types feat, fix,
docs, style, refactor, perf, test, build, ci, chore, revert. Subject in
lowercase imperative, under 50 characters, no period; scope only when the
change stays in one module; a body only when the why isn't obvious.
