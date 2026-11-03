#!/usr/bin/env bash
# Tests checkout-lock.sh with fake hook input
set -u
HOOK="${1:-$HOME/.claude/hooks/checkout-lock.sh}"
pass=0; fail=0
check() { if eval "$2"; then echo "PASS $1"; pass=$((pass+1)); else echo "FAIL $1"; fail=$((fail+1)); fi; }

# a main checkout with a space in its path, and a worktree nested inside it,
# where EnterWorktree puts one
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
main="$tmp/my repo"; wt="$main/.claude/worktrees/feat"; mkdir -p "$main/src"
git -C "$main" init -q
git -C "$main" -c user.name=t -c user.email=t@t commit -q --allow-empty -m init
git -C "$main" worktree add -q "$wt" -b feat; mkdir -p "$wt/src"
lock="$(git -C "$main" rev-parse --path-format=absolute --git-common-dir)/claude-main.lock"

ev()   { jq -nc --arg e "$1" --arg s "$2" --arg c "$3" '{hook_event_name:$e,session_id:$s,cwd:$c}' | bash "$HOOK"; }
sub()  { jq -nc --arg e "$1" --arg s "$2" --arg c "$3" '{hook_event_name:$e,session_id:$s,cwd:$c,agent_id:"sub1"}' | bash "$HOOK"; }
edit() { jq -nc --arg s "$1" --arg c "$2" --arg f "$3" '{hook_event_name:"PreToolUse",session_id:$s,cwd:$c,tool_name:"Edit",tool_input:{file_path:$f}}' | bash "$HOOK"; }
run()  { jq -nc --arg s "$1" --arg c "$2" --arg x "$3" '{hook_event_name:"PreToolUse",session_id:$s,cwd:$c,tool_name:"Bash",tool_input:{command:$x}}' | bash "$HOOK"; }
deny() { [ "$(jq -r '.hookSpecificOutput.permissionDecision // empty' <<<"$1" 2>/dev/null)" = deny ]; }
ago()  { date -d "-$1 min" +%Y%m%d%H%M 2>/dev/null || date -v-"$1"M +%Y%m%d%H%M; }
age()  { echo $(( $(date +%s) - $(stat -c %Y "$lock" 2>/dev/null || stat -f %m "$lock") )); }

out=$(ev SessionStart A "$main")
check "A starts in the main checkout and takes the lock"   '[ "$(cat "$lock")" = A ] && [ -z "$out" ]'
out=$(ev SessionStart B "$main")
check "B is told at start; the lock stays with A"          '[[ "$out" == *"held by another"* ]] && [ "$(cat "$lock")" = A ]'
out=$(ev PreToolUse B "$main")
check "B's tool call in the main checkout is denied"       'deny "$out"'
out=$(ev PreToolUse A "$main")
check "A's own tool call passes"                           '[ -z "$out" ]'
out=$(ev PreToolUse B "$wt")
check "B passes in a worktree"                             '[ -z "$out" ]'

# the file being changed decides, not where the session is
out=$(edit B "$wt" "$main/src/app.ts")
check "B in its worktree editing a main-checkout file is denied" 'deny "$out"'
out=$(edit B "$wt" "$wt/new/deeper/file.ts")
check "B writing a file in a new folder of its worktree passes"  '[ -z "$out" ]'
out=$(edit B "$wt" "src/app.ts")
check "a relative path resolves from the session's folder"        '[ -z "$out" ]'
out=$(edit B "$main" "$wt/src/app.ts")
check "B in the main checkout editing a worktree file passes"     '[ -z "$out" ]'

# which Bash commands count as git
out=$(run B "$main" 'ls -la && echo "$PWD"')
check "B's non-git command passes"                         '[ -z "$out" ]'
out=$(run B "$main" 'cat .gitignore; gh pr list; open https://github.com')
check "words containing git (.gitignore, github) pass"     '[ -z "$out" ]'
out=$(run B "$main" 'cd src && git status')
check "git after cd && is denied"                          'deny "$out"'
out=$(run B "$main" "bash -c 'git commit -m x'")
check "git inside bash -c is denied"                       'deny "$out"'
out=$(run B "$main" '/usr/bin/git log')
check "git by absolute path is denied"                     'deny "$out"'
out=$(run B "$main" 'echo "$(git rev-parse HEAD)"')
check "git inside \$( ) is denied"                         'deny "$out"'
out=$(run B "$wt" 'git commit -m x')
check "B's git in its worktree passes"                     '[ -z "$out" ]'

touch -t "$(ago 10)" "$lock"; ev PostToolUse A "$main" >/dev/null
check "A's PostToolUse refreshes the heartbeat"            '[ "$(age)" -lt 60 ]'
sub PostToolUse A "$wt" >/dev/null
check "A's subagent working in a worktree keeps A's lock"  '[ "$(cat "$lock")" = A ]'
ev SessionEnd B "$main" >/dev/null
check "a non-holder's SessionEnd keeps the lock"           '[ -f "$lock" ]'
ev SessionEnd A "$main" >/dev/null
check "the holder's SessionEnd releases the lock"          '[ ! -f "$lock" ]'
out=$(ev PreToolUse B "$main")
check "B's edit after A ends passes and takes the lock"    '[ -z "$out" ] && [ "$(cat "$lock")" = B ]'
out=$(ev SessionStart C "$main")
check "C, starting after that, is told B holds it"         '[[ "$out" == *"session (B)"* ]] && [ "$(cat "$lock")" = B ]'
out=$(ev PreToolUse C "$main")
check "C's tool call in the main checkout is then denied"  'deny "$out"'
ev SessionEnd B "$main" >/dev/null

ev SessionStart A "$main" >/dev/null; touch -t "$(ago 30)" "$lock"
out=$(ev SessionStart B "$main")
check "a new session takes over a stale lock"              '[ "$(cat "$lock")" = B ] && [ -z "$out" ]'
ev PostToolUse B "$wt" >/dev/null
check "the holder releases the lock on moving to a worktree" '[ ! -f "$lock" ]'

ev SessionStart A "$main" >/dev/null; touch -t "$(ago 21)" "$lock"
out=$(CLAUDE_MAIN_LOCK_STALE=3600 ev PreToolUse B "$main")
check "CLAUDE_MAIN_LOCK_STALE=3600 keeps a 21-minute lock" 'deny "$out"'
touch "$lock"
out=$(CLAUDE_MAIN_LOCK_STALE=abc ev PreToolUse B "$main")
check "a non-numeric CLAUDE_MAIN_LOCK_STALE falls back to 1200 s" 'deny "$out"'
rm -f "$lock"; : > "$lock"
out=$(ev SessionStart B "$main")
check "an empty lock file (a crash mid-write) is taken over" '[ "$(cat "$lock")" = B ] && [ -z "$out" ]'
rm -f "$lock"

# many sessions at once; each round must leave exactly one holder
for round in 1 2 3; do
  for i in $(seq 20); do ev SessionStart "S$i" "$main" > "$tmp/o$i" & done; wait
  silent=$(for i in $(seq 20); do [ -s "$tmp/o$i" ] || echo "S$i"; done)
  check "round $round: 20 starting at once leaves one holder, who alone isn't told" '[ "$silent" = "$(cat "$lock")" ]'
  rm -f "$lock"
done
for round in 1 2 3; do
  echo OLD > "$lock"; touch -t "$(ago 30)" "$lock"
  for i in $(seq 20); do ev PreToolUse "S$i" "$main" > "$tmp/o$i" 2>&1 & done; wait
  silent=$(for i in $(seq 20); do [ -s "$tmp/o$i" ] || echo "S$i"; done)
  check "round $round: 20 edits at once on a stale lock let exactly the new holder through" '[ "$silent" = "$(cat "$lock")" ]'
  rm -f "$lock"
done
rm -f "$tmp"/o*

out=$(echo 'not json' | bash "$HOOK" 2>&1); code=$?
check "input that isn't JSON: exit 0, no output at all"    '[ $code -eq 0 ] && [ -z "$out" ]'
out=$(ev PreToolUse X "$tmp")
check "a directory outside git passes"                     '[ -z "$out" ]'

echo "---- $pass passed, $fail failed"
[ "$fail" -eq 0 ]
