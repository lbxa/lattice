#!/usr/bin/env bash
set -Eeuo pipefail

# Stop hook: verify the repository is in a handoff-ready state.
#
# Runs lint and typecheck — the two checks Next.js 16 does NOT do for you.
# `next lint` was removed and `next build` no longer runs ESLint, so a green
# build says nothing about lint. Deliberately excludes `next build`: this
# fires on every turn, including markdown-only ones.
#
# Exit 2 blocks the stop and returns stderr to Claude, which then has to fix
# the tree before handing back.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

HOOK_INPUT="$(cat 2>/dev/null || true)"

# Claude Code re-fires this hook after a block-and-continue. Without this
# guard a persistently failing check would loop forever.
if [ -n "$HOOK_INPUT" ] && command -v jq >/dev/null 2>&1; then
  if [ "$(printf '%s' "$HOOK_INPUT" | jq -r '.stop_hook_active // false')" = "true" ]; then
    exit 0
  fi
fi

# tsc resolves the global PageProps/LayoutProps from generated route types.
# When they are absent (fresh clone, cleaned .next) every route file fails for
# a reason unrelated to the change being verified, so skip rather than lie.
TYPES_READY=1
if [ ! -f ".next/dev/types/routes.d.ts" ] && [ ! -f ".next/types/routes.d.ts" ]; then
  TYPES_READY=0
fi

FAILURES=""

if ! LINT_OUT="$(bun run lint 2>&1)"; then
  FAILURES="${FAILURES}
--- lint failed ---
${LINT_OUT}"
fi

if [ "$TYPES_READY" = "1" ]; then
  if ! TYPE_OUT="$(bun run typecheck 2>&1)"; then
    FAILURES="${FAILURES}
--- typecheck failed ---
${TYPE_OUT}"
  fi
else
  printf "note: skipped typecheck — no generated route types. Run 'bun run build' or 'scripts/setup.sh'.\n" >&2
fi

if [ -n "$FAILURES" ]; then
  printf "Repository checks failed before handoff. Fix these, then stop again:%s\n" "$FAILURES" >&2
  exit 2
fi

exit 0
