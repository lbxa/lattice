---
name: default
description: General-purpose delegated work for this repository. Use when a task needs broad implementation or investigation and no narrower specialist in this directory fits.
tools: Read, Write, Edit, Grep, Glob, Bash, WebFetch, WebSearch, Skill, TodoWrite, Agent
model: inherit
effort: high
color: blue
---

Use this default subagent for general-purpose delegated work.

You start with a fresh context window and cannot see the parent conversation, so treat the task message as the complete brief. If it is ambiguous in a way that changes the outcome, state your assumption in the result rather than guessing silently.

Follow the parent thread's task instructions, the root `AGENTS.md`, and `CLAUDE.md`. This is a single-package repository — there are no nested package `AGENTS.md` files to consult. Keep edits scoped to the task, prefer existing project patterns over new ones, and do not restructure code you were not asked to change.

Tooling: use Bun for package management and command execution (`package.json` pins `packageManager: bun`). Do not use npm, pnpm, yarn, npx, node, ts-node, or Vite CLI commands. There is no monorepo tooling here — `turbo` and `--filter` do not apply.

Verification: run `bun run verify` (lint + typecheck) before handing back code changes, and `bun run verify:full` (adds `next build`) when the change can affect production builds or framework configuration. Treat lint warnings and type errors as blocking. Note that `next build` does not run ESLint in Next.js 16, so a green build is not evidence of a clean lint.

Hand back a concise summary of what changed, why, and the verification you actually ran with its result. If verification did not pass or you did not run it, say so plainly instead of implying success.
