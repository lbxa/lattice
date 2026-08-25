#!/usr/bin/env bash
set -Eeuo pipefail

# Smoke test for the WorktreeCreate hook. Drives the hook with the payload
# Claude Code actually sends, asserts the stdout contract and the provisioning
# the hook is responsible for, then removes what it created.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/worktree_create.sh"

GIT_COMMON_DIR="$(git -C "$SCRIPT_DIR" rev-parse --path-format=absolute --git-common-dir)"
REPO_ROOT="$(dirname "$GIT_COMMON_DIR")"

NAME="hook-smoke-$$"
TARGET="$REPO_ROOT/.claude/worktrees/$NAME"
BRANCH="claude/$NAME"

EXPLICIT_NAME="hook-smoke-explicit-$$"
EXPLICIT_TARGET="$REPO_ROOT/.claude/worktrees/$EXPLICIT_NAME"
EXPLICIT_BRANCH="claude/$EXPLICIT_NAME"

FAILURES=0
pass() { printf "ok   - %s\n" "$*"; }
fail() {
  printf "FAIL - %s\n" "$*"
  FAILURES=$((FAILURES + 1))
}

remove_worktree() {
  git -C "$REPO_ROOT" worktree remove --force "$1" >/dev/null 2>&1 || true
  git -C "$REPO_ROOT" branch -D "$2" >/dev/null 2>&1 || true
}

cleanup() {
  remove_worktree "$TARGET" "$BRANCH"
  remove_worktree "$EXPLICIT_TARGET" "$EXPLICIT_BRANCH"
  git -C "$REPO_ROOT" worktree prune >/dev/null 2>&1 || true
  rm -f "$OUT_CREATE" "$OUT_REUSE" "$OUT_EXPLICIT" 2>/dev/null || true
  rm -f "$SENTINEL_ENV" 2>/dev/null || true
}

OUT_CREATE="$(mktemp)"
OUT_REUSE="$(mktemp)"
OUT_EXPLICIT="$(mktemp)"
trap cleanup EXIT

[ -x "$HOOK" ] || {
  printf "FAIL - hook is missing or not executable: %s\n" "$HOOK"
  exit 1
}

# The real event carries the requested name and nothing else. Claude Code builds
# it as {...common, hook_event_name:"WorktreeCreate", name}; a payload invented
# from any other shape would let a broken hook pass this suite.
name_payload() {
  printf '{"session_id":"smoke","transcript_path":"/dev/null","cwd":"%s","permission_mode":"default","hook_event_name":"WorktreeCreate","name":"%s"}' \
    "$REPO_ROOT" "$NAME"
}

# Gitignored files are in no ref, so the worktree can only receive them if setup
# copies them across. Plant a real one first: without it this assertion passes
# whether or not the mechanism works.
SENTINEL_ENV="$REPO_ROOT/.env.smoke-$$"
SENTINEL_VALUE="worktree-smoke-$$"
printf 'SMOKE_TOKEN=%s\n' "$SENTINEL_VALUE" > "$SENTINEL_ENV"

printf "==> Creating a worktree from a name-only payload\n"
if name_payload | "$HOOK" >"$OUT_CREATE"; then
  pass "hook exited 0"
else
  fail "hook exited non-zero"
fi

# The path is the hook's entire contract with Claude Code: any setup output that
# leaks onto stdout makes the session fail to enter the worktree.
if [ "$(cat "$OUT_CREATE")" = "$TARGET" ]; then
  pass "stdout is exactly the derived worktree path"
else
  printf "     expected: %s\n     actual:   %s\n" "$TARGET" "$(cat "$OUT_CREATE")"
  fail "stdout is not exactly the derived worktree path"
fi

if [ -d "$TARGET/node_modules" ]; then
  pass "workspace dependencies installed"
else
  fail "node_modules is missing from the worktree"
fi

CARRIED="$TARGET/$(basename "$SENTINEL_ENV")"
if [ ! -f "$CARRIED" ]; then
  fail "gitignored env file was not carried over to the worktree"
elif [ "$(cat "$CARRIED")" != "$(cat "$SENTINEL_ENV")" ]; then
  printf "     expected: %s\n     actual:   %s\n" "$(cat "$SENTINEL_ENV")" "$(cat "$CARRIED")"
  fail "carried env file does not match the main checkout"
else
  pass "gitignored env files carried over from the main checkout"
fi

# The worktree must not inherit tracked files from the main checkout's dirty
# working tree — only from the ref it was branched from.
if git -C "$REPO_ROOT" ls-files --error-unmatch "$(basename "$SENTINEL_ENV")" >/dev/null 2>&1; then
  fail "sentinel env file is tracked; the carryover assertion proves nothing"
else
  pass "sentinel env file is untracked, so carryover was the only way in"
fi

printf "\n==> Re-running against the existing worktree\n"
if name_payload | "$HOOK" >"$OUT_REUSE"; then
  pass "hook exited 0 when reusing an existing worktree"
else
  fail "hook failed when reusing an existing worktree"
fi

if [ "$(cat "$OUT_REUSE")" = "$TARGET" ]; then
  pass "reuse still prints exactly the worktree path"
else
  fail "reuse did not print exactly the worktree path"
fi

printf "\n==> Honouring an explicit worktree_path when a payload supplies one\n"
if printf '{"session_id":"smoke","hook_event_name":"WorktreeCreate","worktree_path":"%s"}' "$EXPLICIT_TARGET" \
  | "$HOOK" >"$OUT_EXPLICIT"; then
  pass "hook exited 0 for an explicit worktree_path"
else
  fail "hook failed for an explicit worktree_path"
fi

if [ "$(cat "$OUT_EXPLICIT")" = "$EXPLICIT_TARGET" ]; then
  pass "explicit worktree_path is used verbatim"
else
  fail "explicit worktree_path was not used verbatim"
fi

printf "\n==> Rejecting an unusable payload\n"
if printf '{"session_id":"smoke","hook_event_name":"WorktreeCreate"}' | "$HOOK" >/dev/null 2>&1; then
  fail "hook exited 0 for a payload carrying neither name nor worktree_path"
else
  pass "hook fails a payload carrying neither name nor worktree_path"
fi

printf "\n"
if [ "$FAILURES" -eq 0 ]; then
  printf "All WorktreeCreate hook checks passed.\n"
  exit 0
fi

printf "%d WorktreeCreate hook check(s) failed.\n" "$FAILURES"
exit 1
