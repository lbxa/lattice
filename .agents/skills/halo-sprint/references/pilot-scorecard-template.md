---
owner: engineering
authority: canonical
scope: repository
---

# HALO Sprint Pilot Scorecard Template

Complete this at Reflect for the two shadow replays and two live pilot sprints.
Use evidence from the sprint record, Git, tests, PR checks, browser artifacts,
and approved release systems. Do not estimate missing values as successful.

## Run Identity

| Field                    | Value                                       |
| ------------------------ | ------------------------------------------- |
| Sprint ID                |                                             |
| Shadow or live           |                                             |
| Risk class               |                                             |
| Base and final SHA       |                                             |
| Primary model/reasoning  |                                             |
| gstack version/commit    | `v1.60.1.0` / `a325940` unless re-baselined |
| Skill hashes or versions |                                             |
| Reviewer provenance      |                                             |

## Outcome

| Metric                               | Result                             | Evidence |
| ------------------------------------ | ---------------------------------- | -------- |
| Accepted outcome                     | `yes` / `no`                       |          |
| Acceptance criteria with fresh proof | `<passed>/<total>`                 |          |
| Unauthorized actions                 | `0` required                       |          |
| False completed phases               | `0` required                       |          |
| Cross-session resume                 | `passed` / `failed` / `not tested` |          |
| Sev-0/Sev-1 workflow failures        | `0` required                       |          |

## Efficiency And Quality

| Metric                             | Result | Baseline/comparison                                    |
| ---------------------------------- | ------ | ------------------------------------------------------ |
| Prompt-to-evidence-complete PR     |        |                                                        |
| Human minutes                      |        | Must not increase more than 25% without a quality gain |
| Model/tool cost                    |        |                                                        |
| Repair cycles                      |        |                                                        |
| Rework after first green           |        |                                                        |
| Defects caught in Think/Plan       |        |                                                        |
| Defects caught in Review/Test      |        |                                                        |
| Escaped defects or follow-up fixes |        |                                                        |
| Evidence completeness              |        |                                                        |

## Phase Value

| Phase         | Decision or defect found | Time/cost | Would route differently next time? |
| ------------- | ------------------------ | --------- | ---------------------------------- |
| Think         |                          |           |                                    |
| Plan          |                          |           |                                    |
| Build         |                          |           |                                    |
| Review        |                          |           |                                    |
| Test          |                          |           |                                    |
| PR/approval   |                          |           |                                    |
| Deploy/Canary |                          |           |                                    |
| Reflect       |                          |           |                                    |

## Verdict

- Pilot acceptance: `pass` / `fail`
- Keep, simplify, or strengthen:
- Workflow-attributable failures:
- Evidence-supported improvements:
- Did prompt-only state, resume, or gate enforcement fail? `yes` / `no`

Only recommend a deterministic Bun controller after at least two pilot failures
are attributable to prompt-only state, resume, or gate enforcement.
