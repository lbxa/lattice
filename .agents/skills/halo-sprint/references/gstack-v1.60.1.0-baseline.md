---
owner: engineering
authority: canonical
scope: repository
---

# gstack `v1.60.1.0` Pilot Baseline

This file freezes the gstack inputs directly routed by `$halo-sprint`. It is
not proof that a sprint used them: each `halo.sprint/v1` record must copy the
applicable hashes and record the actual invocation.

## Source Identity

- Repository: `garrytan/gstack`
- Version file: `1.60.1.0`
- Commit: `a3259400a366593e0c909dd9ac3e59752efd2488`
- Commit subject: `Merge pull request #2264 from time-attack/time-attack/wave-test-infra-isolated-review`
- Version provenance: `VERSION` and `package.json` agree. The local checkout is
  shallow/grafted and has no local tags, so `v1.60.1.0` is a VERSION-derived
  label here, not a locally verified Git tag.
- Hash algorithm below: SHA-256 over the exact Git blob content emitted by
  `git show a325940:<path>`

## Canonical Template Hashes

The checked-in `<skill>/SKILL.md` files are generated Claude renders, not the
canonical authoring source or necessarily the Codex runtime. The source
baseline therefore uses each main `SKILL.md.tmpl`; the full commit pins any
routed `sections/*.md.tmpl`, generator/resolver code, and static references.
The full commit is the strongest canonical source anchor; the template hashes
make the directly routed inputs easy to compare.

| Method                | Canonical source                   | SHA-256                                                            |
| --------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| version               | `VERSION`                          | `a05442e1220521c44bac111462a2a311da807c141cbefba49249f2e8599f44bb` |
| `$autoplan`           | `autoplan/SKILL.md.tmpl`           | `1fd099a03d6c7dc06c1301189990b67423cb181aafd001dce01ff1ad0dc8e8cd` |
| `$canary`             | `canary/SKILL.md.tmpl`             | `19110ab667bfa93f2a2b225be71efc570a7bc7c9dbf2a191220d01ac071b95fb` |
| `$land-and-deploy`    | `land-and-deploy/SKILL.md.tmpl`    | `d2f8d4710caf87e45cfeaffa64864fd32ac8f57286edf564470171af59bf8450` |
| `$office-hours`       | `office-hours/SKILL.md.tmpl`       | `0a964e63f76a1bf419abe32f8b62827e02c1ff3ae077ba173859e42733b6f2fa` |
| `$plan-ceo-review`    | `plan-ceo-review/SKILL.md.tmpl`    | `d87c73a60a67ec137a863911fda0dc2bd719c8bb36f6eb1ea99d535fa5074736` |
| `$plan-design-review` | `plan-design-review/SKILL.md.tmpl` | `412bb57ed787a75df32b38b854cf02d1fa32f6121fafcd5e8573d6e75fae187a` |
| `$plan-devex-review`  | `plan-devex-review/SKILL.md.tmpl`  | `e48efdc3f693b22f968683a5fdca6bfc265290ac6e48ebe7db259153f765a8de` |
| `$plan-eng-review`    | `plan-eng-review/SKILL.md.tmpl`    | `f0fbd9ea5d1c3ba3cade6c36bd3c8ace0cbd566dab52b065576abd51036d03c7` |
| `$qa`                 | `qa/SKILL.md.tmpl`                 | `1e3f07d20bcf070b4d946ce80026a4dce68fcc4c946332cf2ff1c2de99f31f82` |
| `$retro`              | `retro/SKILL.md.tmpl`              | `5b1d3fb29e5f21bbb6cf22f84266846296d53ad5ce4d4c45d24c502c079fc417` |
| `$review`             | `review/SKILL.md.tmpl`             | `c803e5d15c02e6f54b7db7c8bb8afba524a410f94614a0e4b7fdb2cbf3257204` |
| `$ship`               | `ship/SKILL.md.tmpl`               | `2bc9e62882ae74bc46c7242e770ea70fc1e9ad0423086c809ec9c1f5ab1ab6d9` |

## Installed Codex Runtime Hashes

These are the actual generated files present in the clean local gstack
checkout at the source commit above. They cover the rendered skill content,
including composed sections. Recompute them at the start of every pilot run;
generated runtime files are not pinned merely because the Git checkout is.

| Method                | Installed runtime path                              | SHA-256                                                            |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| `$autoplan`           | `.agents/skills/gstack-autoplan/SKILL.md`           | `866d10d7fb13716da797018fe7da8752fbf098862d84e25b787a11ab30e2d3d7` |
| `$canary`             | `.agents/skills/gstack-canary/SKILL.md`             | `052a0474884bab1302e9f92c90850f68ee033582dc2994cb251247e6364d45de` |
| `$land-and-deploy`    | `.agents/skills/gstack-land-and-deploy/SKILL.md`    | `2305654154a0e884ce92c91d31deed270c877ac3e22f48788c3b3b8f9fc81aeb` |
| `$office-hours`       | `.agents/skills/gstack-office-hours/SKILL.md`       | `b3e9896225e2eb58dba7709629cd48d9590b50d89d5964f476bed6fcddcadb77` |
| `$plan-ceo-review`    | `.agents/skills/gstack-plan-ceo-review/SKILL.md`    | `e7cfb1cc18679f9031cf00b50deb8f33d402c878143ba42d318699cb378d6e94` |
| `$plan-design-review` | `.agents/skills/gstack-plan-design-review/SKILL.md` | `c5dde965fecaa8eb7a863ec435aea2aa4bda8fc4113aebc9bd4f3858acf29f23` |
| `$plan-devex-review`  | `.agents/skills/gstack-plan-devex-review/SKILL.md`  | `14021ec1074aceb3cacc831223426f8d5e8248259b609a351786992720ecc44b` |
| `$plan-eng-review`    | `.agents/skills/gstack-plan-eng-review/SKILL.md`    | `70401ca36d2d6ebef37de3a037b0ffcdf777538ddfd5aa35a67810f8a05c71a8` |
| `$qa`                 | `.agents/skills/gstack-qa/SKILL.md`                 | `aace00b6d714a493b26b5bbe4602121dbe7f741e7d1f22bd3568a5a72a534f7b` |
| `$retro`              | `.agents/skills/gstack-retro/SKILL.md`              | `d61f5abb42e9995055b1fe7fed83f7283518300f5d8afe37afee3133a670b553` |
| `$review`             | `.agents/skills/gstack-review/SKILL.md`             | `9b1b05c996aca104a05c1a0d3b36389505de88a770aad23c8621c26c1f3aee4a` |
| `$ship`               | `.agents/skills/gstack-ship/SKILL.md`               | `0b5ea4be319a70e0d63dc5a4fa728b61cac6c0c67e2cb10d39f592436755b5e7` |

Every runtime file above currently contains `MODEL_OVERLAY: claude`. That is
evidence of the Codex generation defect documented by this pilot, not evidence
that Claude was the model that executed a sprint.

If a routed skill loads another gstack file, record that additional runtime
file's hash in the sprint record. Do not claim these tables cover dynamically
selected or newly added child skills.

## Model Lock

Every pilot run must record the exact host-visible primary model identifier,
reasoning mode, and reviewer provenance before Think begins. Environment
variables `CODEX_MODEL` and `OPENAI_MODEL` were not available to the overlay
implementation session, so that session is not an acceptable source for the
pilot model lock.

If the host does not expose an exact identifier, set the sprint to
`needs_decision`; do not substitute a generated overlay label or infer the
model from marketing language. Hold the recorded primary model constant for
the two shadow replays and two live sprints.
