---
name: halo-sprint
description: Coordinate an opt-in HALO engineering sprint through goal definition, risk classification, planning, implementation, independent review, evidence-backed verification, PR preparation, separately approved release, canary validation, and reflection. Use when the user explicitly invokes $halo-sprint, uses the /halo-sprint conversational alias, asks to start or resume the HALO sprint protocol, or requests its status.
owner: engineering
authority: canonical
scope: repository
---

# HALO Sprint

Coordinate HALO's sprint protocol without duplicating or weakening the
specialist workflows it invokes. The canonical policy is
`docs/sprint-blueprint.md`; read it completely before starting, inspecting, or
resuming a sprint.

## Supported Invocations

Codex discovers this repository skill through:

- `$halo-sprint <goal>`
- `$halo-sprint status`
- `$halo-sprint resume`

Accept these conversational aliases as the same intents:

- `/halo-sprint <goal>`
- `/halo-sprint status`
- `/halo-sprint resume`

If the request does not match one of those shapes, infer `start`, `status`, or
`resume` only when the intent is unambiguous. Otherwise ask one concise
question.

## Sources Of Authority

Apply these in order:

1. System and user instructions.
2. The closest applicable `AGENTS.md`.
3. `docs/sprint-blueprint.md`.
4. `docs/authority-map.md`, package documentation, source, tests, and current
   runtime evidence.
5. The current `.notes/sprints/` working record.

The sprint record is noncanonical. If it disagrees with a current canonical
source or fresh evidence, update the record and stop at `needs_decision` when
the conflict affects intent, risk, authority, or release safety.

## Non-Negotiable Boundaries

- Preserve the user's dirty checkout and unrelated changes.
- Start write-capable implementation in a clean worktree based on current
  `origin/main`, unless the user explicitly selected another base.
- Use Bun and the repository's documented commands.
- Use synthetic data by default.
- Never store PHI, credentials, secret-emitting output, raw production
  payloads, or sensitive screenshots in sprint records or synced artifacts.
- Keep artifact and GBrain sync off unless separately approved for the exact
  provider, data class, access, residency, retention, and target.
- Never infer authority to merge, deploy, change configuration, apply a
  migration, mutate production data, move real money, or send an external
  message.
- Dan owns product, merge, deployment, production configuration, production
  data, and migration actions. Fred advises on strategy, scope, and taste.
  Dr Taylor Kline or the specifically named clinician owns clinically material
  approval.
- Bind approval to the exact action, SHA, environment, target, scope, approver,
  and timestamp. Changed bindings invalidate the approval.
- Do not let an implementing agent certify its own high-risk completion.
- Stop after three repair cycles for the same unresolved failure or finding.

## gstack Pilot Compatibility

The pilot baseline is gstack `v1.60.1.0` at commit `a325940`. Until upstream
Codex compatibility is reverified:

- use
  [`references/gstack-v1.60.1.0-baseline.md`](references/gstack-v1.60.1.0-baseline.md)
  for the full commit and routed-skill hashes;

- invoke planning skills individually instead of relying on `$autoplan`
  composition;
- use the `next-dev-loop` skill for runtime/browser evidence rather than
  trusting a gstack browser-setup preflight;
- record the actual host and model from the running session; do not treat a
  generated `MODEL_OVERLAY` label as provenance;
- invoke named skills directly instead of depending on the plain gstack router;
- use native Codex collaboration reviewers when gstack suppresses an
  adversarial or Review Army section, and label them honestly as same-model or
  independent-model review;
- pin the source commit and skill hashes in the sprint record instead of
  depending on the current Codex update check.

Remove a workaround only after a clean-home host test demonstrates the
corresponding path, composition, metadata, and model behavior.

## Start: `$halo-sprint <goal>`

### 1. Preflight

Before writing files:

1. Confirm the repository root, current branch, `origin/main`, current HEAD,
   dirty state, and registered worktrees.
2. Read all applicable `AGENTS.md` files and the canonical sprint protocol.
3. Locate any existing sprint record for the same goal or branch. Resume it
   rather than creating a duplicate.
4. Establish whether the request authorizes implementation or only planning.
5. Record the actual primary model, reasoning mode when known, skill versions,
   and reviewer provenance. Never claim independent-model agreement when only
   same-model subagents are available.

### 2. Create The Working Record

Copy
`references/sprint-record-template.md` into
`.notes/sprints/<YYYY-MM-DD>-<slug>.md` and complete its working-record
frontmatter and Think section.

The record uses `halo.sprint/v1` and only these phase statuses:

- `not_started`
- `in_progress`
- `passed`
- `blocked`
- `needs_decision`
- `skipped`

Do not mark a phase `passed` until its required output and fresh evidence are
both present. The record indexes evidence; it is not proof by itself.

### 3. Think

Use `$office-hours` for material product shaping when available. Establish:

- measurable goal and intended user or stakeholder;
- acceptance criteria;
- explicit exclusions and forbidden side effects;
- protected people, systems, data, and external relationships;
- risk class and reasons;
- named authorities;
- unresolved decisions and stop conditions.

The highest applicable risk class wins:

- `R0`: local, reversible, no sensitive data or user-visible behavior.
- `R1`: user-visible or shared behavior with a reversible blast radius.
- `R2`: auth/RLS, privacy, financial logic, payments code, integrations,
  webhooks, or schema definitions.
- `R3`: clinical meaning, real money movement, external communication,
  production data, migrations, configuration, merge, or deployment.

If classification is uncertain, set Think to `needs_decision`. Reclassify
upward whenever the proposed scope or diff touches a higher-risk surface.

### 4. Plan

Ground every named file, symbol, command, API, schema, calculation, and
dependency in current code or primary documentation. Use Context7 where the
repository requires it for library, framework, SDK, API, CLI, or cloud-service
decisions.

The plan must include interfaces, data flow, edge cases, ownership, tests,
evidence, rollout, rollback, exclusions, and every later approval point.

At the pilot baseline, invoke available gstack plan skills individually:

1. `$plan-ceo-review`
2. `$plan-design-review` when UI or visual behavior changes
3. `$plan-eng-review`
4. `$plan-devex-review` when developer workflows or package contracts change

Do not rely on `$autoplan` composition until a clean Codex install test proves
its child-skill resolution works. These reviewers advise; they do not
authorize implementation or later release actions.

### 5. Build

When implementation is authorized:

1. Use a fresh worktree from current `origin/main` and run the repository setup
   flow.
2. Assign one owner per write surface. Parallelize independent discovery,
   tests, or files without overlapping ownership.
3. Follow Red-Green-Refactor for new behavior.
4. Implement the smallest approved change and avoid unrelated cleanup.
5. Update the sprint record after material decisions and at phase boundaries.
6. Return to Plan if the implementation approach or risk materially changes.

### 6. Review And Test

Use `$review` when available, then an independent cold verifier appropriate to
the risk class. Give the verifier the goal, approved plan, diff, tests, and
evidence without requiring it to accept the implementer's rationale.

Agents may automatically repair a finding only when it is mechanical,
reversible, in scope, testable, and outside all judgment or one-way authority
boundaries. After a repair:

1. prove the focused test fails before and passes after where applicable;
2. re-review the changed diff;
3. rerun affected verification;
4. increment the repair-cycle counter.

Use `$qa` when available and apply the canonical change-aware matrix:

- every implementation: focused tests and `bun run verify`;
- build/configuration/export risk: `bun run verify:full`;
- UI: observable behavior tests and `next-dev-loop` evidence where
  jsdom is insufficient;
- schema/RLS/database: affected DB E2E and shared-schema ledger compliance;
- webhooks/integrations: signature, replay, duplicate, out-of-order, retry,
  partial-failure, and test-record outbound-refusal scenarios;
- clinical or financial behavior: governing-source trace, sandboxed side
  effects, named human adjudication, and package-specific tests.

Map each acceptance criterion to fresh evidence from the same SHA and
environment. Missing, stale, skipped, flaky, or wrong-environment mandatory
proof is a failure, not a warning.

### 7. PR, Approval, Deploy, And Canary

`$ship` or `/ship` prepares or updates a PR. It does not authorize merge or
deployment.

Before any merge, deployment, migration, configuration change, production
effect, external communication, or real-money action:

1. record the exact proposed action, SHA, environment, target, scope, and
   recovery plan;
2. obtain the named authority for that action;
3. revalidate the approval immediately before acting.

`$land-and-deploy` or `/land-and-deploy` is a separate release operation.
Production deployment is outside the default pilot boundary.

After an authorized deployment, use `$canary` plus HALO-specific synthetic
checks. Record exact deployment identity, observation window, thresholds,
owner, rollback trigger, and outcome. Trigger rollback or escalation rather
than self-repairing through an unsafe production state.

### 8. Reflect

Use `$retro` when available. Complete
`references/pilot-scorecard-template.md` for pilot sprints and record:

- accepted outcome and evidence completeness;
- defects caught or escaped;
- elapsed and human time;
- cost and rework;
- repair cycles and false-completion incidents;
- useful, evidence-supported lessons.

Promote only durable decisions into canonical documentation or the relevant
README changelog. Preserve transient history in the noncanonical sprint
record. Canonical current context always overrides memory.

## Status: `$halo-sprint status`

Status is read-only unless the user separately asks for repair or continuation.

1. Find sprint records associated with the current branch/worktree.
2. If none match, report that no active record was found; do not select another
   worktree's newest record.
3. If several match, use explicit branch, sprint ID, or user-provided path;
   never guess.
4. Revalidate current HEAD and report stale evidence or approval.
5. Summarize goal, risk, current phase, blockers, open decisions, approvals,
   latest fresh evidence, and next safe action.

## Resume: `$halo-sprint resume`

Resume from the working record, not chat or memory alone.

1. Select the record bound to the current branch/worktree or explicit path.
2. Re-read canonical context and applicable `AGENTS.md` files.
3. Compare recorded base, branch, worktree, HEAD, environment, evidence, and
   approvals with current state.
4. Mark mismatches `blocked` or `needs_decision` before making changes.
5. Continue from the first phase that is neither `passed` nor intentionally
   `skipped`.

Do not reuse another worktree's checkpoint or approval because it is newer.

## Handoff

Every handoff reports:

- sprint ID, risk class, current phase, branch, worktree, and HEAD;
- files changed and scope exclusions preserved;
- verification commands, results, and acceptance-criterion evidence;
- reviewer/model provenance;
- approvals still required and actions intentionally not taken;
- blockers, rollback/canary state, and next safe action.
