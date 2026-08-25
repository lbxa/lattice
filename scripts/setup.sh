#!/usr/bin/env bash
set -Eeuo pipefail

# Provisions a checkout so it can run `next dev` / `next build`.
#
# Called by hand after cloning, and by the WorktreeCreate hook
# (.claude/hooks/worktree_create.sh) for every new worktree. Must be
# idempotent: a reused worktree runs it again.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

command -v bun >/dev/null 2>&1 || {
  printf "ERROR: bun is required (package.json pins packageManager: bun).\n" >&2
  exit 1
}

# Gitignored files exist in no ref, so a fresh worktree checkout never receives
# them. Env files are the ones that matter: without them the dev server starts
# silently misconfigured. Carry them from the main checkout.
GIT_COMMON_DIR="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
if [ -n "$GIT_COMMON_DIR" ] && [ "$(basename "$GIT_COMMON_DIR")" = ".git" ]; then
  MAIN_ROOT="$(dirname "$GIT_COMMON_DIR")"
else
  MAIN_ROOT="$REPO_ROOT"
fi

if [ "$MAIN_ROOT" != "$REPO_ROOT" ] && [ -d "$MAIN_ROOT" ]; then
  copied=0
  for src in "$MAIN_ROOT"/.env*; do
    [ -f "$src" ] || continue
    name="$(basename "$src")"
    # Tracked env files already arrive with the checkout; copying them would
    # drag the main checkout's uncommitted edits into the worktree.
    if git -C "$MAIN_ROOT" ls-files --error-unmatch "$name" >/dev/null 2>&1; then
      continue
    fi
    cp "$src" "$REPO_ROOT/$name"
    copied=$((copied + 1))
  done
  if [ "$copied" -gt 0 ]; then
    printf "==> Carried %s env file(s) over from %s\n" "$copied" "$MAIN_ROOT"
  fi
fi

printf "==> Installing dependencies with bun\n"
bun install

# `next dev`/`next build` generate .next/dev/types/routes.d.ts, which declares
# the global PageProps/LayoutProps types that app/layout.tsx depends on.
# Without them a fresh checkout fails typecheck, so seed them here rather than
# leaving the first `bun run verify` to fail confusingly.
if [ ! -f ".next/dev/types/routes.d.ts" ] && [ ! -f ".next/types/routes.d.ts" ]; then
  printf "==> Generating route types (next build)\n"
  bun run build
fi

printf "==> Setup complete\n"
