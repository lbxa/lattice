---
name: browser-harness
description: Deprecated in this repository. The Halo browser harness it wrapped does not exist here; use the next-dev-loop skill for runtime and browser validation instead.
---

# Browser Harness (deprecated here)

This skill wrapped `@halo/browser-harness`, a workspace package from the Halo
monorepo. **That package does not exist in this repository**, and its commands
(`bun run --filter '@halo/browser-harness' ...`) cannot succeed here — this is a
single-package project with no workspaces, so `--filter` has nothing to resolve.

Use **`next-dev-loop`** instead. It covers the same ground with the tooling this
project actually has:

- `/_next/mcp` for the framework's view — routes, server errors, compilation
  issues (Next.js 16.3 on Turbopack).
- `agent-browser` for the browser's view — DOM, console, network, React fiber.

Evidence goes to a scratch path outside the repository, not to `.harness/`.

The original Halo-era instructions are kept alongside this file as
`SKILL.halo-original.md` for reference; delete it once you no longer need it.
