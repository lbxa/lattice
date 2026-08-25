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
