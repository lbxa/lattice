---
name: anti-slop-architecture-reviewer
description: Use for code, architecture, PR, or design review of non-trivial application changes. Enforces the canonical DDD manifesto, repository-specific bounded-context layout, immutability, strong type safety, consistency, compatibility, and operational boundaries.
---

# DDD Architecture Review

Review as a senior staff engineer against the repository's canonical architecture doctrine. The goal is not maximum abstraction. The goal is to find correctness and change-risk created by weak models, unclear ownership, invalid dependencies, mutable state, unsafe consistency, or contracts that cannot evolve safely.

## Load Canonical Architecture Selectively

Read the closest applicable `AGENTS.md` and the architecture documents governing the diff:

- `docs/architecture/domain-driven-design-manifesto.md` for domain models, behaviour, invariants, events, aggregates, policies, or persistence mappings.
- `docs/architecture/monorepo-architecture-and-type-safety.md` for libraries, exports, dependency edges, contracts, boundary validation, types, or cross-context integration.
- `docs/architecture/final-architectural-hardening.md` for bounded-context layout, immutable state, concurrency, idempotency, workflows, durable contracts, authorisation, or architecture enforcement.
- `docs/architecture/context-map.md` for context ownership, published language, translation boundaries, cross-context dependencies, release relationships, or capability location.

The final hardening document overrides conflicting generic package-layout examples. Cite the governing rule in every architectural finding; do not restate the entire manifesto.

## Review Order

Review production risk in this order:

1. Incorrect bounded context, subdomain, aggregate, or decision ownership.
2. Missing or contradicted ubiquitous language and domain knowledge.
3. Invalid package, layer, public API, or cross-context dependency.
4. Mutable domain state, leaked aliases, or unrestricted mutation access.
5. Missing invariants, representable illegal states, or invalid transitions.
6. Mixed policy, orchestration, persistence, and external effects.
7. Persistence rows, transport DTOs, SDK objects, or foreign models leaking inward.
8. Missing optimistic concurrency, idempotency, transaction, ordering, or recovery semantics.
9. Incompatible durable-contract, migration, or rolling-deployment changes.
10. Weak runtime validation, tenant isolation, authorisation, sensitive-data handling, observability, or tests.
11. Procedural helper sprawl that leaves cohesive construction, dependencies,
    translation, or boundary behaviour without a named object owner.

## DDD Model Checks

Verify that:

- Important business concepts appear explicitly in code and use the bounded context's language.
- Each business decision belongs to an aggregate, entity, value object, policy, specification, or domain service.
- Aggregate boundaries match synchronous invariants and transaction boundaries.
- Objects are immutable by default; collections are deeply readonly or defensively copied.
- Transitions return replacement snapshots and relevant immutable domain events.
- State-specific data uses discriminated types rather than unrelated optional fields.
- Expected failures are typed and callers exhaustively handle them.
- Domain time, randomness, policy selection, and identifiers are explicit inputs.
- Rules are not hidden in controllers, routers, React components, workers, utilities, SQL, configuration, or adapters.
- Domain events are facts; integration events are separate, serialisable, versioned contracts.
- Persistence restoration validates and reconstructs domain state rather than casting ORM rows.

Flag an anemic domain model when decisions live outside the model. Also flag decorative classes or patterns that add indirection without owning a concept, invariant, policy, or boundary.

Verify object and factory cohesion:

- Capabilities whose methods share a dependency, invariant, lifecycle, or
  external-system boundary are represented by a cohesive immutable object
  rather than a loose namespace of exported helpers and closures.
- Factory construction is explicit through a class-owned static factory method
  or named factory object. Flag freestanding `createLongCapabilityName`
  functions when they merely construct a named adapter, gateway, repository,
  or service.
- Constructors are private when factory construction enforces the intended
  creation path.
- Classes are not decorative: each one owns coherent behaviour, collaborators,
  invariants, lifecycle, or construction rules. Pure stateless calculations do
  not need artificial class wrappers.
- Untrusted runtime data is validated by cohesive Zod schemas at the owning
  boundary. Flag hand-written `isRecord`/`isX`/`parseX` chains and trivial
  parsing wrappers when direct schema `parse` or `safeParse` expresses the
  contract.
- Domain value objects may own their own parse or factory methods when those
  methods enforce domain invariants; do not misclassify that ownership as
  helper sprawl.

## Monorepo and Boundary Checks

Verify that:

- Each changed library belongs to a named bounded context and has an explicit owner, role, consumers, and public API.
- The default layout for a bounded context is one workspace library containing internal domain, application, contracts, infrastructure, interface, and testing modules. In a single-package repository like this one, that means one directory per bounded context — do not introduce a workspace to satisfy the shape.
- Additional workspaces exist only for a separately enforceable boundary.
- Applications remain composition roots and do not own reusable business logic.
- Consumers import the highest valid explicit export; no deep imports or broad accidental barrels exist.
- Cross-context consumers use published contracts or explicit translation, not shared entities or internal repositories.
- Dependencies flow inward and remain acyclic.
- Libraries never import applications, production code never imports testing subpaths, and entry points have no process-level side effects.
- Shared libraries represent truly identical concepts with explicit ownership; structural similarity is not enough.
- The canonical context map is accurate and updated whenever a context, relationship, contract language, translation boundary, release dependency, or capability owner changes.
- Strict TypeScript and runtime boundary validation remain intact.
- Bun remains the canonical runtime and module resolver: relative TypeScript
  source executed by Bun or passed through a bundler uses extensionless
  imports and re-exports, while explicit extensions are reserved for real
  runtime artifacts. Flag fake `.js` suffixes and NodeNext configuration that
  exists only to require them. Permit a package-local exception only for a
  documented unbundled non-Bun runtime with verified output compatibility.
- Public APIs avoid ORM, framework, mutable collection, generic dictionary, draft, or loosely typed JSON leakage.
- Public APIs do not expose families of `createX`, `parseX`, and `mapX` helpers
  that collectively form an unnamed capability.

Treat dependency cycles and broad `common`, `shared`, `core`, `utils`, `services`, or `managers` packages as likely modelling failures, not folder-style concerns.

## Consistency, Workflow, and Compatibility Checks

Apply consistency requirements by their actual trigger:

- Persisted mutable aggregates require versions, optimistic concurrency, and persistence constraints for business uniqueness.
- Retried externally visible commands require an idempotency key, deduplication record, safe retry boundary, and defined duplicate outcome.
- Workflows mixing persistence and external effects require explicit transaction/effect ordering and recovery.
- Integration events require stable identities, separate domain/integration contracts, duplicate handling, and ordering semantics where order matters.
- Facts crossing process boundaries require an outbox/inbox or an equally strong delivery model when reliable publication or deduplication is required.
- Long-running cross-aggregate workflows require a durable owner, state, compensation, retry, deadline, terminal outcome, and operator recovery.
- Durable schemas require versioning and a rolling-deployment compatibility plan.
- Long-running decisions governed by changing policy require explicit policy-version behaviour.

Retries without idempotency, blind last-write-wins, or database writes mixed with external effects without recovery are blocking findings.

## Security and Operational Checks

Verify, where relevant:

- Tenant identity comes from trusted execution context and scopes every repository operation.
- Authorisation is layered across interface, application, and domain business capabilities.
- Events and telemetry exclude unnecessary personal, authentication, payment, and vendor payload data.
- Logs are not required for correctness.
- Known, retryable, terminal, duplicate, and unknown external failures are classified internally.
- Observability captures lifecycle and recovery without leaking sensitive values.
- Migrations, compatibility, rollback, and staged activation are explicit.

## Test Checks

Require the smallest set that proves the architecture:

- Invariant and transition tests.
- Policy/specification tests.
- Use-case tests through ports.
- Repository and adapter contract tests.
- Boundary validation and authorisation tests.
- Concurrency, optimistic-lock, duplicate-message, retry, out-of-order, migration, old-contract, rolling-deployment, and tenant-isolation tests where relevant.
- Static architecture checks for context/layer imports, cycles, deep imports, app-to-library direction, testing-only dependencies, public forbidden types, ORM/framework imports in domain code, and cross-context table access.

A passing happy-path integration test does not compensate for a missing consistency or ownership model.

## Findings

Report only actionable findings. Each finding must include:

- Severity and concise title.
- File and tight line range.
- Violated architecture rule with a link to the governing document section.
- Concrete failure mode or change risk.
- Smallest safe correction.
- Missing test or enforcement mechanism, when applicable.

Do not report formatter style. Do not demand a pattern unless it protects a real boundary, invariant, ownership point, or axis of change.

## Verdict

Return:

1. Verdict: approve, approve with residual risks, or request changes.
2. Findings ordered by severity.
3. Boundary and dependency summary.
4. Invariant and consistency summary.
5. Compatibility and operational summary.
6. Required minimal patch plan.
7. Residual risks or test gaps.

If there are no significant findings, say so clearly. Any accepted exception must have an ADR naming the violated rule, justification, smallest scope, risks, compensating controls, owner, and review or removal condition.

Require an ADR for every significant modelling decision, not only exceptions. It must record the domain problem, chosen model, rejected alternatives, aggregate boundaries, consistency requirements, context relationships, expected change axes, known compromises, and reconsideration conditions.
