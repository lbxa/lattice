---
name: anti-slop-code-architecture
description: Use before implementing or refactoring non-trivial application code involving domain behaviour, bounded contexts, package boundaries, integrations, persistence, async workflows, retries, lifecycle state, external effects, concurrency, durable contracts, or long-term maintainability. Requires a DDD architecture contract before code.
---

# DDD Architecture Contract

Do not write implementation code until the architecture contract is explicit and consistent with the canonical architecture documents.

The objective is not abstraction volume. The objective is a model whose language, ownership, invariants, boundaries, types, consistency, and operational behaviour reinforce one another.

## Load Canonical Architecture Selectively

Read the closest applicable `AGENTS.md` first, then load only the architecture documents needed for the change:

- Read `docs/architecture/domain-driven-design-manifesto.md` for domain behaviour, models, invariants, events, aggregates, policies, context relationships, or persistence mappings.
- Read `docs/architecture/monorepo-architecture-and-type-safety.md` for libraries, public APIs, dependency edges, contracts, boundary validation, public types, or cross-context integration.
- Read `docs/architecture/final-architectural-hardening.md` for every non-trivial architecture change involving bounded-context layout, immutable aggregate state, concurrency, idempotency, workflows, durable contracts, authorisation, or architecture enforcement.
- Read `docs/architecture/context-map.md` whenever identifying context ownership or changing a context relationship, published language, translation boundary, cross-context dependency, or capability location.

The final hardening document is the repository-specific interpretation. It overrides conflicting generic package-layout examples in the other documents. Do not copy the manifesto into task plans; link the governing sections and apply them.

## Mandatory Architecture Contract

Before coding, record:

1. Bounded context and subdomain classification: core, supporting, or generic.
2. Ubiquitous language and the domain operation being changed.
3. System boundary, context-map relationship, ownership, intended consumers, and explicit non-ownership.
4. Aggregate, entity, value object, policy, specification, or domain service responsible for each decision.
5. Invariants, illegal states, enforcement points, and proving tests.
6. Immutable transition model, including state-specific data and relevant domain events.
7. Application use cases and the separation between decisions, orchestration, persistence, and effects.
8. Ports, adapters, translation boundaries, and hostile external-system failure classification.
9. Persistence representation, restoration validation, transaction boundary, optimistic concurrency, idempotency, ordering, and recovery.
10. Package location, public exports, permitted dependencies, prohibited dependencies, and cross-context contracts.
11. Runtime boundary validation, authorisation, tenant isolation, sensitive-data handling, and explicit nondeterministic inputs.
12. Compatibility, migration, rollout, observability, and test strategy.
13. Object API and construction shape: which concept owns cohesive behaviour,
    whether construction is a constructor or factory method, and which schemas
    own parsing at each untrusted boundary.

Keep the contract proportional for a small change. It is still mandatory when the change introduces or alters domain behaviour, lifecycle state, persistence, external effects, retries, or a public contract.

## Non-Negotiable DDD Rules

- Objects are immutable by default. Value objects are always immutable; entities are immutable snapshots whose transitions return replacement state.
- The executable model, tests, contracts, and domain language must agree.
- Agents must not infer a complete model from tables, routes, or existing code alone. Surface unresolved domain knowledge before inventing rules.
- Business decisions have named owners. Do not hide them in routes, controllers, React components, workers, utilities, callbacks, SQL, or adapters.
- Make illegal states unrepresentable where practical. Use branded values, readonly collections, discriminated unions, exhaustive matching, and typed expected failures.
- Aggregate methods and domain policies decide. Application use cases coordinate. Infrastructure performs effects.
- Persisted rows and transport DTOs are representations, not domain objects. Translate and validate them explicitly.
- Domain events are immutable historical facts. Integration events are versioned published contracts.
- Infrastructure and foreign models remain behind ports, adapters, mappers, or anticorruption layers.
- Duplication is preferable to a false shared abstraction across bounded contexts.
- A capability whose operations share dependencies, invariants, lifecycle, or
  an external-system boundary must have one explicit owner in code. Prefer an
  immutable class with constructor injection over a loose family of exported
  helper functions.
- If construction is a factory, model it as an actual factory method: use a
  class-owned static method or a named factory object, and keep the constructor
  private when callers must not bypass that construction path. Do not disguise
  object construction as a freestanding `createLongCapabilityName` helper.
- Untrusted runtime input is validated by a schema owned at that boundary.
  Prefer Zod schema `parse` or `safeParse` calls over hand-written type
  predicates and scattered `parseX` wrappers. Domain value objects may expose
  their own parse or factory methods when those methods enforce domain
  invariants.

## Repository Shape and Dependency Rules

- The default unit is one library per bounded context. Use a workspace only where the repository already has workspaces; in a single-package repository, one directory per bounded context is the equivalent.
- Keep domain, application, contracts, infrastructure, interface, and testing modules inside that bounded-context library unless a separate workspace boundary has explicit justification.
- Applications are executable composition roots. They connect ports to adapters and must not own reusable business behaviour.
- Consume each context at the highest valid public entry point. Deep imports and broad barrels are forbidden.
- Other contexts consume published contracts, not entities, repositories, persistence rows, or internal domain types.
- Where the repository keeps an architecture context map, update it in the same change whenever a context, relationship, published language, translation boundary, release dependency, or capability owner changes. This repository has no `docs/` tree yet — do not create one unless asked.
- Dependencies flow inward: interface to application to domain; infrastructure to application and domain ports. Libraries never import applications.
- Library entry points are side-effect free.
- Package cycles are modelling failures. Resolve ownership or orchestration; do not conceal cycles with dynamic imports, service locators, or a generic shared package.
- Strict TypeScript is architectural enforcement. Do not weaken the shared baseline or use unchecked assertions to bypass it.
- Bun is the canonical runtime and default module resolver. TypeScript source
  executed by Bun or passed through a bundler uses extensionless relative
  specifiers. Do not append `.js` to a TypeScript source module as a NodeNext
  compatibility fiction; retain an extension only when the referenced runtime
  artifact actually has it. A genuine unbundled non-Bun package may own a
  documented, package-local resolver and specifier policy with output tests;
  it must not change the shared Bun-first baseline.

## Consistency and Effects Gate

Apply consistency requirements by their actual trigger:

- Persisted mutable aggregates define versions, optimistic concurrency, and persistence constraints for business uniqueness.
- Retried externally visible commands define an idempotency key, deduplication store, retry boundary, and duplicate outcome.
- Workflows mixing persistence and external effects define a transaction model, effect ordering, partial success, compensation, failure classes, and operator recovery.
- Integration events define stable identities, domain-to-integration translation, duplicate handling, ordering assumptions where relevant, and compatibility versions.
- Facts crossing process boundaries use an outbox/inbox or an equally strong delivery model when reliable publication or deduplication is required.
- Long-running cross-aggregate workflows use an explicitly owned process manager or saga with durable state, deadlines, retries, compensation, terminal outcomes, and recovery.
- Durable schemas define versioning and rolling-deployment compatibility.
- Long-running decisions governed by changing policy define policy-version behaviour.
- Every applicable path defines tenant, authorisation, and sensitive-data boundaries.

Retries without idempotency are forbidden. External effects inside an undefined transaction/recovery model are forbidden. Blind last-write-wins updates are not the default.

## Pattern Gate

Use a pattern only when it owns a real domain concept or protects an actual boundary:

- Policy for a named business decision.
- Specification for a meaningful composable predicate.
- Factory method or named factory object for rule-bearing construction.
- State machine or discriminated union for lifecycle-specific state.
- Gateway or adapter for an external system.
- Repository for semantic persistence operations.
- Process manager or saga for a durable cross-aggregate workflow.
- Outbox/inbox for reliable publication and duplicate consumption.

Do not create generic managers, universal repositories, mutation callbacks, decorative wrappers, or technical layer packages that erase the bounded context.

## Object Cohesion And Parsing Gate

- A gateway, adapter, repository, application service, or other capability with
  shared collaborators and related operations should normally be a cohesive,
  immutable object. Its public methods form the capability API; private methods
  own internal translation and classification.
- A factory must be visible as a factory in the API. Prefer
  `ParchmentPrescriptionProviderGateway.create(client)` or
  `CarePlanFactory.fromAssessment(input)` to a freestanding
  `createParchmentPrescriptionProviderGateway(client)`.
- Keep constructors public only when direct construction is the intended API.
  Otherwise make them private and enforce construction through the named
  factory method.
- Keep validation declarative. Define a small cohesive set of Zod schemas at
  the untrusted boundary and invoke those schemas directly. Do not replace a
  schema with `isRecord`, `isBoundedString`, `isValidPayload`, and a chain of
  bespoke parser helpers.
- Do not centralise unrelated schemas or invent a generic parsing service.
  Schema ownership follows the boundary and the foreign contract it validates.
- Pure calculations, small transformations, and deterministic predicates may
  remain functions. Do not introduce a class that owns no state, invariant,
  dependency, construction rule, or coherent behaviour.

## Required Tests

Choose tests that prove the contract:

- Value-object and invariant tests.
- Aggregate transition and illegal-state tests.
- Policy and specification tests.
- Use-case tests with conforming fake ports.
- Repository and adapter contract tests.
- Runtime boundary and authorisation tests.
- Concurrency, optimistic-lock, duplicate-message, retry, ordering, migration, tenant-isolation, and compatibility tests where relevant.
- Architecture checks for layer direction, context boundaries, deep imports, cycles, forbidden public types, and side-effect-free entry points.

## Stop Conditions

Stop and resolve the design before coding when:

- The bounded context, aggregate, decision owner, or ubiquitous language is ambiguous.
- A required business rule is being inferred without domain evidence.
- One use case mixes policy, persistence, vendor classification, and effects.
- A context needs another context's entities, repositories, tables, or internals.
- The proposed package graph is cyclic or creates a broad shared dumping ground.
- A retry or external effect lacks an idempotency and recovery model.
- Persisted or durable data cannot be migrated compatibly.
- The implementation requires weakening strict types or exposing mutable state.
- A cohesive capability is emerging as a namespace of exported `createX`,
  `parseX`, `mapX`, callback, and closure helpers without a clear object owner.
- A factory is claimed, but callers only see an unrelated freestanding creation
  function or can bypass the factory through an unrestricted constructor.
- Boundary parsing is spread across bespoke type predicates instead of an
  owning schema or domain value object's parse/factory method.
- Bun or bundled TypeScript source uses `.js` relative specifiers for other
  TypeScript source files, or restores NodeNext resolution to the shared
  baseline. A documented package-local policy for a genuine unbundled non-Bun
  runtime is not a violation.

## Output

For implementation work, report:

1. Files and bounded contexts affected.
2. Architecture contract.
3. Governing manifesto sections.
4. Implementation and migration sequence.
5. Tests and architecture checks.
6. Residual risks, explicit exceptions, and their ADRs.

Any exception to the manifesto requires a written architectural decision with the violated rule, justification, smallest scope, risks, compensating controls, owner, and review or removal condition.

Every significant modelling decision also requires an ADR, even when it complies with the manifesto. Record the domain problem, chosen model, rejected alternatives, aggregate boundaries, consistency requirements, context relationships, expected change axes, known compromises, and reconsideration conditions.
