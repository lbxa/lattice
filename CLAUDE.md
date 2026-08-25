# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Status

`lattice` is an unmodified `create-next-app` scaffold (one route, one layout, no
app code of its own yet). There is no domain architecture to learn — the notes
below cover the toolchain, which differs from the defaults you may assume.

## Commands

The package manager is **bun** (`bun.lock`, `packageManager: bun@1.3.14`) — the
README's npm/yarn/pnpm alternatives are boilerplate, ignore them.

```bash
bun install          # install deps
bun run dev          # dev server on http://localhost:3000
bun run build        # production build (type-checks; does NOT lint — see below)
bun run start        # serve the production build
bun run lint         # eslint, flat config auto-discovered from eslint.config.mjs
bun run typecheck    # tsc --noEmit
bun run verify       # lint + typecheck (what the Stop hook runs)
bun run verify:full  # verify + production build
```

`scripts/setup.sh` provisions a fresh checkout or worktree: `bun install`, plus a
build to generate the route types described below.

No test framework is configured. If you add one, add its script here.

## Toolchain notes

**Next.js 16 + React 19.** Read `node_modules/next/dist/docs/` before writing
Next-specific code (see AGENTS.md). Version-16 breaking changes that bite most
often are listed in `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`.

**Route props are globals, not imports.** `next dev`/`next build` generate
`.next/dev/types/routes.d.ts`, which declares `PageProps<Route>` and
`LayoutProps<Route>` globally, keyed by literal route strings — hence
`export default function RootLayout(props: LayoutProps<"/">)` in
[app/layout.tsx](app/layout.tsx) with no import. `params` and `searchParams` are
Promises and must be awaited. These types only exist after a build has run; a
fresh clone type-errors until `bun run dev` or `bun run build` regenerates them.

**`next lint` is gone.** `next build` no longer runs ESLint in Next 16, so a
green build says nothing about lint. Run `bun run lint` separately. The script is
bare `eslint` with no path argument, so it lints everything under the repo root.
`.agents/**` and `.claude/**` are therefore in `globalIgnores` in
[eslint.config.mjs](eslint.config.mjs) — they hold agent tooling, not app source.
Any other tooling directory that lands at the root needs the same treatment.

**Tailwind v4, configured in CSS.** There is no `tailwind.config.ts`. Theme
tokens live in the `@theme inline` block in [app/globals.css](app/globals.css)
and map to CSS custom properties (`--background`, `--foreground`, and the Geist
font variables set by `next/font/google` in the root layout). Add design tokens
there, not in a JS config. PostCSS wires this up via `@tailwindcss/postcss`.

**Import alias.** `@/*` resolves to the repo root, so `@/app/...`,
`@/components/...` — not `@/` meaning `src/`. There is no `src/` directory.

## Agent configuration

`.claude/` and `.agents/` were ported from a Bun + Turborepo monorepo and adapted
for this single-package app. Two things about the layout are not obvious:

- **Skills live in `.agents/skills/`**, with `.claude/skills` as a symlink to it.
  Claude Code only discovers project skills under `.claude/skills/`, while the
  `.agents/` path is what other AGENTS.md-ecosystem tools read. The symlink keeps
  one copy serving both. Add new skills to `.agents/skills/`.
- **Two hooks are wired in `.claude/settings.json`.** `Stop` runs
  `scripts/agent-hooks/stop-checks.sh` (lint + typecheck; exit 2 blocks the
  handoff and feeds failures back). `WorktreeCreate` runs
  `.claude/hooks/worktree_create.sh`, which creates the worktree under
  `.claude/worktrees/` and provisions it via `scripts/setup.sh` — so that script
  must be **committed**, or worktree creation fails on a checkout of the base ref.

There is no monorepo tooling here: `turbo` and `bun --filter` do not apply, and
there are no nested package `AGENTS.md` files.

## AGENTS.md is partly machine-managed

`AGENTS.md` hosts the `<!-- BEGIN:nextjs-agent-rules -->` block, which `next dev`
rewrites whenever it drifts. Because that file owns the block, `next dev` leaves
`CLAUDE.md` alone — put hand-written guidance here. If the block reappears as an
uncommitted diff, commit it rather than deleting it; deleting only recreates it.
