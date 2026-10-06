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