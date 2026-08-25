---
owner: engineering
authority: canonical
scope: repository
---

# `halo.sprint/v1` Record Template

Copy this template to `.notes/sprints/<YYYY-MM-DD>-<slug>.md`. The copied file
is a noncanonical working record and an index to evidence; it does not override
repository instructions or prove its own claims.

Do not include PHI, credentials, secret-emitting output, raw production
payloads, or sensitive screenshots.

```markdown
---
schema: halo.sprint/v1
owner: <sprint-owner>
authority: working-record
scope: sprint
sprint_id: <YYYY-MM-DD-slug>
status: in_progress
risk: <R0|R1|R2|R3>
data_classification: synthetic
base_branch: origin/main
base_sha: <sha>
branch: <branch>
worktree: <absolute-path>
head_sha: <sha>
primary_model: <provider-and-model>
reasoning_mode: <mode-or-unknown>
---

# <Sprint Title>

## Goal

<Measurable outcome>

## Acceptance Criteria

- [ ] AC-1: <criterion>
- [ ] AC-2: <criterion>

## Scope Exclusions

- <explicit exclusion>

## Forbidden Side Effects

- <forbidden effect>

## Protected Surfaces And Data

- Data: <synthetic or approved classification>
- People: <affected users or authorities>
- Systems: <auth, clinical, finance, vendors, schema, production>

## Authorities

- Product and final scope: Dan
- Strategy and taste adviser: Fred
- Clinical: Dr Taylor Kline or <named clinician when applicable>
- Merge: Dan
- Deploy/configuration: Dan
- Production migration/data action: Dan

## Canonical Sources

- `<path or primary-documentation URL>`

## Phase Ledger

| Phase    | Status      | Required output | Artifact/evidence | Updated |
| -------- | ----------- | --------------- | ----------------- | ------- |
| Think    | in_progress |                 |                   |         |
| Plan     | not_started |                 |                   |         |
| Build    | not_started |                 |                   |         |
| Review   | not_started |                 |                   |         |
| Test     | not_started |                 |                   |         |
| PR       | not_started |                 |                   |         |
| Approval | not_started |                 |                   |         |
| Deploy   | skipped     |                 |                   |         |
| Canary   | skipped     |                 |                   |         |
| Reflect  | not_started |                 |                   |         |

Allowed statuses: `not_started`, `in_progress`, `passed`, `blocked`,
`needs_decision`, `skipped`.

## Decisions And Open Questions

| ID  | Decision/question | Owner | Status | Evidence |
| --- | ----------------- | ----- | ------ | -------- |

## Evidence

| Acceptance criterion | Command or journey | Result | SHA | Environment/role | Artifact | Verifier | Timestamp |
| -------------------- | ------------------ | ------ | --- | ---------------- | -------- | -------- | --------- |

## Approvals

| Action | Approver | SHA | Environment | Target | Scope/conditions | Timestamp | Status |
| ------ | -------- | --- | ----------- | ------ | ---------------- | --------- | ------ |

An approval is stale if its action, SHA, environment, target, or scope changes.

## Repair Cycles

| Finding/failure | Cycle | Change | Re-review | Verification | Outcome |
| --------------- | ----- | ------ | --------- | ------------ | ------- |

Stop after three repair cycles for the same unresolved issue.

## Release, Canary, And Recovery

- PR: <URL or not_started>
- Deployment: <exact SHA/target or skipped>
- Recovery strategy: <feature disable, app rollback, forward fix, down migration, reconciliation>
- Owner: <name>
- Trigger: <measurable threshold>
- Canary window and evidence: <reference or skipped>

## Handoff

- Current safe state:
- Remaining approvals:
- Actions intentionally not taken:
- Next safe action:

## Reflection

- Outcome:
- Defects caught/escaped:
- Human time:
- Cost/rework:
- False-completion incidents:
- Evidence-supported learnings:
```
