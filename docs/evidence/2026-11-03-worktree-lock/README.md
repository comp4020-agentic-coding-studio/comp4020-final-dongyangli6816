# One session per checkout: the worktree lock

Nov 3, 2026. The question: when two Claude Code sessions work in this repo at
once, they edit the same files and run git in the same checkout, so each can
overwrite or commit the other's half-done work. Can the harness make sure
only one session works in the main checkout, and send the others to a git
worktree (a second working directory on its own branch, sharing the same
repository) on their own, at a cost low enough to leave on all the time?

## What happened

1. I wrote a plan for it outside this repo, as a list of steps for the agent:
   a lock script run by four hook events, a test script for it, a rule in my
   user-level `CLAUDE.md`, a shell function, and the project's own setup.
2. An earlier session carried out the user-level steps (all outside the
   repo, so not in git) and wrote the project's `CLAUDE.md` changes, leaving
   them staged but uncommitted.
3. In this session I asked the agent how far the plan had got. It checked
   each step against the machine rather than the earlier session's account:
   everything was done except the `.worktreeinclude` file and the commit.
4. I asked what leaving `.worktreeinclude` out would change. The only
   ignored file the app could need is `mise.local.toml`, and the agent
   found it holds nothing but the Fly.io token, which neither `pnpm dev`,
   `pnpm check` nor the deploy reads (the deploy uses a GitHub secret). Copying
   it into every worktree would only multiply copies of a secret, so I left
   the file out.
5. I asked whether the lock really tells sessions apart or only goes by time.
   It goes by session id: the lock file held
   `02227089-e4a2-419d-a6fc-a18f717d8514`, and this session's
   `CLAUDE_CODE_SESSION_ID` was the same. Time only decides when a lock
   is stale.
6. I asked what the heartbeat and `pnpm install` cost per worktree, and the
   agent measured both (below). Both were cheap enough to keep.
7. The plan had the scripts' comments and messages in Chinese. I had them
   put into English, so the hook's messages read like the rest of the
   harness. The rule in `~/.claude/CLAUDE.md` quotes the start-of-session
   message, so its quote was changed to match; the tests were rerun after.
8. I asked when the check fires, and the agent found a gap in the plan's
   script: only SessionStart took the lock. It ran the case in a throwaway
   repo. A holds the lock, B starts and is refused, A ends; B's edits now
   pass, but the lock stays empty, so C starts with no warning, takes it,
   and B is refused again with its half-done edits left in the main
   checkout for C to find. The fix: PreToolUse takes a free lock too, so the
   session that changes the checkout always holds it. Three tests were added
   for the case; the old script fails exactly those three, and the new one
   passes all 14.
9. I asked for edge cases. The agent tested 26 in a throwaway repo and 8
   live in this session, with the real lock handed to a made-up session id
   for a few seconds each time. Four real problems came out:
   - **The session's folder decided, not the file's.** A session in a
     worktree could edit a main-checkout file by its absolute path, which is
     how Claude names files.
   - **A subagent could release its parent's lock.** Subagents share their
     parent's session id, so one working in a worktree looked like the
     holder moving there.
   - **Taking a stale lock raced.** In 2 of 5 rounds of 20 sessions editing
     at once, 7 and 11 got through, because clearing the old lock and
     writing the new one were two steps.
   - **The git filter was Claude Code's, and it misjudged.** The
     `if: "Bash(git *)"` condition in the settings let `bash -c 'git …'`
     through, yet sent `echo "$PWD"` to the hook, which refused it.

   Before fixing the subagent case, the agent checked its premise live: it
   logged the hook input for one tool call from a small subagent, which
   carried an `agent_id` beside the parent's `session_id`; the main session's
   input had none. The fixes: Edit/Write/NotebookEdit are judged by the
   file's folder; only a call without `agent_id` releases the lock from a
   worktree; taking the lock goes through an atomic `mkdir`, so one session
   at a time; and the script checks the command for `git` itself, with the
   settings' `if` removed so every Bash command reaches it. Two small
   failures went too: a non-numeric `CLAUDE_MAIN_LOCK_STALE` (now 1200 s)
   and an error line on input that isn't JSON. The tests grew to 36; the
   previous script fails 10 of them, and the new one passed all 36 in six
   runs. Live, `echo "$PWD"` now passes and `bash -c 'git …'` is refused.
10. The project rules and this folder were committed together in the commit
   that adds this folder.

## How it works

- **The lock** is `.git/claude-main.lock`. It sits inside `.git/`, so it is
  never in the working tree or a commit. It holds the id of the session that
  owns the main checkout.
- **A change inside a worktree is never locked.** The script compares
  `git rev-parse --absolute-git-dir` with `--git-common-dir`; when they
  differ, the folder is in a linked worktree. For Edit, Write and
  NotebookEdit the folder is the file's; for a git command it is the
  session's. If the holder itself moves into a worktree, the lock is
  released, but not when one of its subagents does (a subagent's hook input
  carries an `agent_id`).
- **The four events**, all running one script:

  | Event | What it does |
  | --- | --- |
  | SessionStart | takes a free lock; if another session holds it, tells the agent so |
  | PreToolUse (Edit, Write, NotebookEdit, and any Bash command with `git` in it) | takes a free lock; refuses the call if another session holds it, and says to use `EnterWorktree` |
  | PostToolUse (async) | the holder refreshes the lock's time (the heartbeat) |
  | SessionEnd | the holder releases the lock |

- **Taking the lock** goes through a `mkdir` of `claude-main.lock.taking`,
  which only one process can win, so two sessions can't both take it.

- **A lock is stale** after 1200 s with no heartbeat (`CLAUDE_MAIN_LOCK_STALE`),
  so a crashed session, whose SessionEnd never runs, can't hold the checkout
  forever.
- **The rule**, in my user-level `CLAUDE.md`: when told the checkout is taken,
  call `EnterWorktree` and do all the work there. The project's `CLAUDE.md`
  adds what that means here: rename the branch to `<type>/<slug>`, run
  `pnpm install`, serve on the first free port from 8081, and leave removing
  the worktree to me.

## Measurements

| What | Result |
| --- | --- |
| The test script (piped hook input, a throwaway repo and worktree) | 36 passed, 0 failed, six runs (the script before step 9: 26 passed, 10 failed) |
| The heartbeat hook, 20 runs in a row | 0.61 s, about 30 ms each, no output |
| The PreToolUse hook on a Bash command, 20 runs | about 16 ms each without `git`, 34 ms with it |
| `pnpm install --frozen-lockfile --offline` in an empty copy of the project | 1.4 s |

The heartbeat runs async, so the agent never waits for it and it adds no
tokens. The install is fast because pnpm links packages from one store on
the machine; `--offline` succeeding shows every package was already there.

## What's here

- [`checkout-lock.sh`](checkout-lock.sh), the lock script, and
  [`test-checkout-lock.sh`](test-checkout-lock.sh), its tests, copied from
  `~/.claude/hooks/`.
- [`test-output.txt`](test-output.txt): the test run above.
- [`settings-hooks.json`](settings-hooks.json): the `hooks` block of
  `~/.claude/settings.json` that registers the script.
- [`user-claude-md-section.md`](user-claude-md-section.md): the rule as it
  stands in `~/.claude/CLAUDE.md`.
- [`ccw.zsh`](ccw.zsh): the shell function from `~/.zshrc` that starts
  `claude -w` (in a new worktree) when the lock is held.

## How it was made

The files are copies taken on Nov 3, after the fixes in steps 7 to 9; the
originals live outside the repo, so these copies are the record of them, and
they won't follow later edits there. The tests were run with
`bash test-checkout-lock.sh`. The hooks were timed by piping a PostToolUse
or PreToolUse input for this session into the script 20 times under `time`.
The live checks wrote a made-up id into this repo's `.git/claude-main.lock`,
ran the commands from this session, and wrote the session's own id back.
The install was timed by copying `package.json` and `pnpm-lock.yaml` into a
temporary folder and running the install there; the folder was then deleted.

## Things to know when judging it

- **The full flow has not been tried with two real sessions yet.** The tests
  feed the script fake hook input; whether a second session, when refused,
  actually calls `EnterWorktree` on its own depends on the agent following
  the rule, which only a live run shows.
- **Shell edits get through.** Like the design gate, the Edit/Write matcher
  doesn't see a file changed with `sed` or `python3` through Bash. Git
  commands are caught, but only by the session's folder: `git -C <main
  checkout> commit` from inside a worktree passes.
- **The git check reads the command's text.** Any Bash command with `git`
  as a word in it counts, including `echo git`, and a git hidden behind a
  variable or an alias does not. The `/usr/bin/git` case was checked only in
  the tests; live, Claude Code's auto mode refused to run it.
- **The race tests depend on timing.** They passed every run here, but a
  pass shows the race wasn't seen, not that it can't happen.
- **An idle holder loses the lock.** A session that makes no tool call for
  20 minutes, say while waiting on me, looks crashed, and a new session can
  take the checkout from it. It would then be refused in its own checkout.
- **Subagents share their parent's session id**, so `pm`, `qa` and `designer`
  count as the holder, which is what's wanted. Telling them apart by
  `agent_id` rests on one observed hook input, not on documentation.
- The hooks are user-level, so they run in every repo on this machine, not
  just this one, and they aren't in this repo's `.claude/settings.json`.
