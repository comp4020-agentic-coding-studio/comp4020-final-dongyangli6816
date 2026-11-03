# ccw: start Claude in a new worktree when another Claude session holds the main checkout
ccw() {
  local common lock stale=${CLAUDE_MAIN_LOCK_STALE:-1200} mtime
  common=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)
  lock="$common/claude-main.lock"
  if [ -n "$common" ] && [ -f "$lock" ]; then
    mtime=$(stat -c %Y "$lock" 2>/dev/null || stat -f %m "$lock")
    if [ $(( $(date +%s) - mtime )) -lt "$stale" ]; then
      echo "The main checkout is held by another Claude session; starting in a new worktree…"
      claude -w "$@"
      return
    fi
  fi
  claude "$@"
}
