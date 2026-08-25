#!/usr/bin/env bash
set -Eeuo pipefail

# WorktreeCreate hook. Claude Code invokes this instead of its built-in
# `git worktree` logic, so this script owns both creating the worktree and
# provisioning it through ./scripts/setup.sh.
#
# Claude Code reads the worktree path from stdout and nothing else, so stdout is
# moved to file descriptor 3 and the real stdout is pointed at stderr. Setup
# output stays visible to the user without corrupting the path.

exec 3>&1 1>&2

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

fail() {
  printf "\nERROR: %s\n" "$*" >&2
  exit 1
}

command -v jq >/dev/null 2>&1 || fail "jq is required by the WorktreeCreate hook."

HOOK_INPUT="$(cat)"

# The event supplies the requested worktree name; the hook chooses the path.
# `worktree_path` is read first only so that a future payload carrying an
# explicit path is honoured instead of being second-guessed.
WORKTREE_NAME="$(printf '%s' "$HOOK_INPUT" | jq -r '.name // empty')"
WORKTREE_PATH="$(printf '%s' "$HOOK_INPUT" | jq -r '.worktree_path // empty')"

git -C "$SCRIPT_DIR" rev-parse --git-dir >/dev/null 2>&1 \
  || fail "The WorktreeCreate hook must run inside a Git repository."

# Resolve the main checkout rather than the current one, so a session already
# inside a worktree still creates new worktrees under the main repository.
GIT_COMMON_DIR="$(git -C "$SCRIPT_DIR" rev-parse --path-format=absolute --git-common-dir)"
if [ "$(basename "$GIT_COMMON_DIR")" = ".git" ]; then
  REPO_ROOT="$(dirname "$GIT_COMMON_DIR")"
else
  REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
fi

if [ -z "$WORKTREE_PATH" ]; then
  [ -n "$WORKTREE_NAME" ] \
    || fail "WorktreeCreate input supplied neither name nor worktree_path."

  case "$WORKTREE_NAME" in
    */* | *..*)
      fail "Refusing a worktree name containing a path separator or '..': $WORKTREE_NAME"
      ;;
  esac

  WORKTREE_PATH="$REPO_ROOT/.claude/worktrees/$WORKTREE_NAME"
fi

# The event carries no base ref, so mirror Claude Code's default of branching
# from the remote default branch. Nothing is fetched here; run `git fetch` for a
# newer base.
#
# A clone made with `git clone` caches origin/HEAD, but one created by `git init`
# plus `git remote add` does not. Resolve it from the remote's cached refs when
# it is missing, and if it still cannot be determined, say so loudly — branching
# from whatever happens to be checked out is a silent way to base a worktree on
# mid-feature work.
if ! git -C "$SCRIPT_DIR" rev-parse --verify --quiet origin/HEAD >/dev/null 2>&1; then
  if git -C "$SCRIPT_DIR" remote get-url origin >/dev/null 2>&1; then
    # --auto would query the network; prefer the already-fetched refs.
    for candidate in main master; do
      if git -C "$SCRIPT_DIR" rev-parse --verify --quiet "origin/$candidate" >/dev/null 2>&1; then
        git -C "$SCRIPT_DIR" symbolic-ref "refs/remotes/origin/HEAD" \
          "refs/remotes/origin/$candidate" >/dev/null 2>&1 || true
        break
      fi
    done
  fi
fi

if git -C "$SCRIPT_DIR" rev-parse --verify --quiet origin/HEAD >/dev/null 2>&1; then
  BASE_REF="origin/HEAD"
else
  BASE_REF="HEAD"
  printf "WARNING: origin/HEAD is unresolved, so this worktree branches from local HEAD (%s)\n" \
    "$(git -C "$SCRIPT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo detached)" >&2
  printf "         Run 'git fetch origin && git remote set-head origin --auto' for a clean base.\n" >&2
fi

# A worktree is a checkout of a committed ref: uncommitted edits and unpushed
# commits in the main checkout are not in it. That includes `scripts/setup.sh`
# itself, so a change to the provisioning script only reaches new worktrees once
# it lands in the base ref. Say so rather than letting it be discovered by a
# worktree that provisions with stale logic.
if [ "$BASE_REF" = "origin/HEAD" ]; then
  AHEAD="$(git -C "$SCRIPT_DIR" rev-list --count origin/HEAD..HEAD 2>/dev/null || echo 0)"
  if [ "$AHEAD" != "0" ]; then
    printf "NOTE: local HEAD is %s commit(s) ahead of origin/HEAD; those commits are NOT in this worktree.\n" \
      "$AHEAD" >&2
  fi
fi
if ! git -C "$SCRIPT_DIR" diff --quiet HEAD 2>/dev/null; then
  printf "NOTE: the main checkout has uncommitted changes; they are NOT in this worktree.\n" >&2
fi

BRANCH="claude/$(basename "$WORKTREE_PATH")"
WORKTREE_CREATED=0
BRANCH_CREATED=0
SUCCEEDED=0

# Roll back only what this invocation created. A reused worktree is never
# removed, so a failed setup cannot destroy work already in progress there.
on_exit() {
  if [ "$SUCCEEDED" = "1" ]; then
    return 0
  fi

  if [ "$WORKTREE_CREATED" = "1" ]; then
    printf "Rolling back the worktree created by this hook.\n" >&2
    git -C "$SCRIPT_DIR" worktree remove --force "$WORKTREE_PATH" >/dev/null 2>&1 || true
  fi

  if [ "$BRANCH_CREATED" = "1" ]; then
    git -C "$SCRIPT_DIR" branch -D "$BRANCH" >/dev/null 2>&1 || true
  fi
}
trap on_exit EXIT

if [ -d "$WORKTREE_PATH" ]; then
  printf "==> Reusing the existing worktree at %s\n" "$WORKTREE_PATH"
else
  printf "==> Creating a worktree at %s from %s\n" "$WORKTREE_PATH" "$BASE_REF"

  # Ownership is recorded before the command that creates the worktree and
  # branch, so a partial failure still rolls both back.
  if git -C "$SCRIPT_DIR" show-ref --verify --quiet "refs/heads/$BRANCH"; then
    WORKTREE_CREATED=1
    git -C "$SCRIPT_DIR" worktree add "$WORKTREE_PATH" "$BRANCH"
  else
    WORKTREE_CREATED=1
    BRANCH_CREATED=1
    git -C "$SCRIPT_DIR" worktree add -b "$BRANCH" "$WORKTREE_PATH" "$BASE_REF"
  fi
fi

[ -f "$WORKTREE_PATH/scripts/setup.sh" ] \
  || fail "scripts/setup.sh is missing from $WORKTREE_PATH."

bash "$WORKTREE_PATH/scripts/setup.sh"

SUCCEEDED=1
printf '%s\n' "$WORKTREE_PATH" >&3
