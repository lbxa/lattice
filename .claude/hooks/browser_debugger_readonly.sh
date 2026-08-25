#!/usr/bin/env bash
# PreToolUse(Bash) guard for the browser-debugger subagent.
#
# browser-debugger is contracted by AGENTS.md to gather evidence without
# editing application code, but it needs Bash to drive agent-browser and the
# Next.js dev server.
# A subagent's permissionMode is ignored when the parent session runs in
# acceptEdits or bypassPermissions, so prose instructions and plan mode are
# both insufficient on their own. This hook rejects source-mutating commands
# at the permission layer, where the parent's mode cannot override it.
#
# Exit 0 allows the command; exit 2 blocks it and returns stderr to the agent.
#
# This is a guard, not a sandbox. It rejects the mutation patterns an agent
# realistically reaches for; it cannot make arbitrary shell input safe.

set -euo pipefail

input="$(cat)"
command_text="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"

if [ -z "$command_text" ]; then
  exit 0
fi

block() {
  printf 'Blocked: browser-debugger gathers evidence and must not modify tracked source.\n%s\nWrite evidence to a scratch path outside the repo instead, or report the blocker to the parent agent.\n' "$1" >&2
  exit 2
}

# Source trees this agent must never mutate. Single-package Next.js layout:
# `app/` is the App Router source, not the monorepo-style `apps/`.
source_dirs='(app|public|scripts|\.github|\.claude|\.agents)'

# Root-level config files have no directory prefix to match on, so they need
# their own alternation.
root_files='(package\.json|tsconfig\.json|next\.config\.ts|eslint\.config\.mjs|postcss\.config\.mjs|bun\.lock|AGENTS\.md|CLAUDE\.md)'

# Redirection into a tracked source path, e.g. `echo x > apps/foo/page.tsx`.
if printf '%s' "$command_text" | grep -Eq '>>?[[:space:]]*("|'"'"')?(\./)?'"$source_dirs"'/'; then
  block "Reason: output redirection into a tracked source directory."
fi

if printf '%s' "$command_text" | grep -Eq '>>?[[:space:]]*("|'"'"')?(\./)?'"$root_files"'\b'; then
  block "Reason: output redirection into a tracked root config file."
fi

# In-place edits and destructive filesystem operations on tracked source.
if printf '%s' "$command_text" | grep -Eq '\b(rm|mv|cp|truncate|install|chmod|chown|ln)\b[^|;&]*[[:space:]]("|'"'"')?(\./)?'"$source_dirs"'/'; then
  block "Reason: destructive filesystem operation on a tracked source directory."
fi

if printf '%s' "$command_text" | grep -Eq '\b(rm|mv|cp|truncate|chmod|chown|ln)\b[^|;&]*[[:space:]]("|'"'"')?(\./)?'"$root_files"'\b'; then
  block "Reason: destructive filesystem operation on a tracked root config file."
fi

# sed/perl in-place editing anywhere: the target is frequently a variable.
if printf '%s' "$command_text" | grep -Eq '\bsed\b[^|;&]*-[a-zA-Z]*i|\bperl\b[^|;&]*-[a-zA-Z]*i[^|;&]*-[a-zA-Z]*e'; then
  block "Reason: in-place stream editing (sed -i / perl -i)."
fi

# tee writing into tracked source.
if printf '%s' "$command_text" | grep -Eq '\btee\b[^|;&]*[[:space:]]("|'"'"')?(\./)?'"$source_dirs"'/'; then
  block "Reason: tee writing into a tracked source directory."
fi

# Git operations that rewrite the working tree, history, or the remote.
if printf '%s' "$command_text" | grep -Eq '\bgit\b[^|;&]*\b(checkout|restore|reset|clean|apply|revert|commit|merge|rebase|cherry-pick|push|stash)\b'; then
  block "Reason: git command that would modify the working tree, history, or remote."
fi

exit 0
