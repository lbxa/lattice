---
name: browser-harness
description: Use `@halo/browser-harness` for Halo local app browser validation, runtime walkthroughs, screenshots, console and network failure capture, and JSONL browser tool automation. Trigger when app behavior changes, when evidence under `.harness/evidence` is needed, or when an agent needs to inspect/interact with the local web UI.
---

# Browser Harness

Use the repo-owned browser harness for Halo app runtime validation. It is
generic, local-first, and independent of external orchestrators.

## Build the package entrypoint

Build before importing the package entrypoint or invoking the compiled binary:

```bash
bun run --filter '@halo/browser-harness' build
```

Before the first browser run in an environment, install Chromium and check the
runner capability:

```bash
bun run --filter '@halo/browser-harness' install:browsers
bun run --filter '@halo/browser-harness' smoke
```

## One-shot evidence

Use the relevant app package's dev command and loopback URL:

```bash
bun run --silent --cwd libs/browser-harness cli -- start \
  --workspace "$PWD" \
  --app-command "bun run --cwd <app-package-dir> dev" \
  --app-url "http://127.0.0.1:<port>"
```

## Attach to an existing server

```bash
bun run --silent --cwd libs/browser-harness cli -- serve \
  --workspace "$PWD" \
  --start-app false \
  --app-url "http://127.0.0.1:<port>"
```

Do not run the interactive `serve` command through Bun's workspace `--filter`
runner; it does not preserve the JSONL stdin stream. Use `--filter` for the
non-interactive build, browser install, smoke, and verification tasks above.

For an owned app process, choose an unused target port. Readiness requires an
HTTP 2xx response. On startup failure, report the surfaced app-output tail
before investigating higher layers.

Send JSONL tool calls on stdin:

```json
{"id":"1","method":"browser.snapshot","params":{}}
{"id":"2","method":"browser.click","params":{"selector":"button:has-text('Send')"}}
{"id":"3","method":"browser.screenshot","params":{"name":"after-send"}}
{"id":"4","method":"browser.close","params":{}}
```

## Report

In handoff notes, include:

- the command used
- relevant `.harness/evidence` paths
- console errors from `console.json`
- failed requests from `network.json`
- any runtime behavior not covered by the walkthrough

## Guardrails

- Prefer this harness over ad hoc Playwright or `agent-browser` commands for
  Halo local app validation.
- Use `playwright` skill for arbitrary external websites.
- Do not add issue-tracker, source-control host, or worktree assumptions to this
  harness.
- Treat `browser.close`, stdin EOF, `SIGINT`, and `SIGTERM` as terminal session
  events; the harness must release the browser and owned app without manual
  process cleanup.
- Use only trusted local apps: explicit targets are loopback-checked, but
  redirects and click-driven destinations are not yet revalidated.
- Treat console and page-error payloads as sensitive because the current harness
  captures and exports them verbatim. Confirm expected evidence files exist after
  shutdown before citing them.
