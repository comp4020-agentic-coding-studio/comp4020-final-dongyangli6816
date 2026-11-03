#!/usr/bin/env bash
# checkout-lock.sh — a lock on the main checkout for Claude Code sessions.
# Only one Claude session at a time may change code in a repo's main checkout;
# any other session is told, refused, and pointed to a worktree.
# Shared by the SessionStart, PreToolUse, PostToolUse and SessionEnd hooks.

input=$(cat)
field() { jq -r "$1 // empty" <<<"$input" 2>/dev/null; }
event=$(field .hook_event_name)
sid=$(field .session_id)
cwd=$(field .cwd)
{ [ -n "$event" ] && [ -n "$sid" ] && [ -n "$cwd" ]; } || exit 0

STALE=${CLAUDE_MAIN_LOCK_STALE:-1200}
case $STALE in ''|*[!0-9]*) STALE=1200 ;; esac

# Sets gitdir, common and lock for the repo holding directory $1
repo_of() {
  gitdir=$(git -C "$1" rev-parse --absolute-git-dir 2>/dev/null) || return 1
  common=$(git -C "$1" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || return 1
  lock="$common/claude-main.lock"
}

mtime_of() { stat -c %Y "$1" 2>/dev/null || stat -f %m "$1" 2>/dev/null; }

# Sets owner to the lock's session id, or empty when the lock is free or
# stale; a lock that vanishes while being read is free
read_owner() {
  local id mtime
  owner=""
  id=$(cat "$lock" 2>/dev/null) || return 0
  mtime=$(mtime_of "$lock") || return 0
  if [ $(( $(date +%s) - mtime )) -lt "$STALE" ]; then owner=$id; fi
}

# Takes the lock if it is still free, one session at a time: mkdir is atomic,
# so a session that loses the race waits, then reads back the winner
take_lock() {
  local mutex="$lock.taking" tries=0
  until mkdir "$mutex" 2>/dev/null; do
    tries=$((tries + 1))
    # taking lasts milliseconds; a mutex still there after 3 s was left by a
    # session that died inside, so clear it
    if [ "$tries" -ge 30 ]; then rmdir "$mutex" 2>/dev/null; tries=0; fi
    sleep 0.1
  done
  read_owner
  if [ -z "$owner" ]; then
    printf '%s\n' "$sid" > "$lock.$$" && mv -f "$lock.$$" "$lock" && owner=$sid
  fi
  rmdir "$mutex"
}

# The nearest existing directory holding path $1 (a new file's folder may not
# exist yet)
dir_of() {
  local p=$1
  case $p in /*) ;; *) p="$cwd/$p" ;; esac
  p=$(dirname "$p")
  while [ ! -d "$p" ]; do p=$(dirname "$p"); done
  printf '%s\n' "$p"
}

if [ "$event" = PreToolUse ]; then
  if [ "$(field .tool_name)" = Bash ]; then
    # git anywhere in the command, however it's started (bash -c 'git …',
    # /usr/bin/git, $(git …)), but not inside a word like .gitignore or github
    field .tool_input.command | grep -Eq '(^|[^[:alnum:]_.-])git([^[:alnum:]_.-]|$)' || exit 0
    where=$cwd
  else
    # the file being changed decides, not where the session is
    file=$(field '.tool_input.file_path // .tool_input.notebook_path')
    where=$cwd
    if [ -n "$file" ]; then where=$(dir_of "$file"); fi
  fi
  repo_of "$where" || exit 0
  [ "$gitdir" != "$common" ] && exit 0               # a change inside a worktree
  read_owner
  if [ -z "$owner" ]; then take_lock; fi             # whoever changes the checkout holds it
  if [ -n "$owner" ] && [ "$owner" != "$sid" ]; then
    jq -n '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",
      permissionDecisionReason:"The main checkout is held by another Claude Code session. Use EnterWorktree to enter a new worktree named after the current feature, then continue."}}'
  fi
  exit 0
fi

repo_of "$cwd" || exit 0
read_owner

# A session in a linked worktree isn't bound by the lock. If its main session
# holds the lock, it has moved there, so release it; a subagent (agent_id set)
# shares its parent's session id, so its working in a worktree leaves the
# parent's lock alone
if [ "$gitdir" != "$common" ]; then
  if [ "$owner" = "$sid" ] && [ -z "$(field .agent_id)" ]; then rm -f "$lock"; fi
  exit 0
fi

case "$event" in
  SessionStart)
    if [ -z "$owner" ]; then
      take_lock
    elif [ "$owner" = "$sid" ]; then
      touch "$lock"                                   # renew on resume / compact
    fi
    if [ -n "$owner" ] && [ "$owner" != "$sid" ]; then
      echo "The main checkout is held by another Claude Code session ($owner). This session's file edits and git commands in the main checkout will be refused by a hook; work in a worktree instead."
    fi
    ;;
  PostToolUse)
    if [ "$owner" = "$sid" ]; then touch "$lock"; fi
    ;;
  SessionEnd)
    if [ "$owner" = "$sid" ]; then rm -f "$lock"; fi
    ;;
esac
exit 0
