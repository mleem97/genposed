# 0004 — Enforce operator and customer scopes before customer execution

- Status: Accepted
- Date: 2026-11-10
- Owners: genposed maintainers

## Context

The first usable release must support operator-owned and customer-owned projects. The operator chooses whether each customer gets UI access, and customer actions are permission-scoped. A workspace label or UI role does not isolate workloads from one another. Rootless execution also does not provide a sufficient boundary for hostile customers sharing a host daemon.

## Decision

- Every project and environment belongs to exactly one operator or customer scope.
- Customer UI access is optional and can be revoked. Server-side authorization checks scope and permission for every read, write, and action; the UI is not an authorization boundary.
- Customer start, stop, and restart are separate permissions and are granted only on projects in that customer's scope. Other capabilities default to denied until explicitly assigned.
- Every deployment request is bound to its project scope and an eligible execution target. For untrusted customer workloads, the initial eligible boundary is a dedicated host or VM assigned to that scope. Rootless mode is defense in depth, not a replacement for that boundary.
- If no target satisfies the project's scope and policy, execution is rejected before any external side effect. No automatic fallback to a shared or rootful daemon is allowed.
- Independent workspaces beyond the operator/customer model may be added later, but cannot change or erase the initial ownership and authorization checks.

## Consequences

- Database uniqueness, API queries, jobs, audit events, agent commands, and deployment records must carry immutable scope identifiers.
- Cross-scope access denial and target-selection rejection require negative tests at service and agent boundaries.
- The initial release needs dedicated-host/VM target assignment and safe rejection before it can enable customer deployment.
- VM provisioning providers, supported operating systems, and the exact approval workflow for privileged exceptions remain open decisions; unsupported configurations must fail closed.

## Alternatives considered

### Defer customer scope until multi-tenancy

Rejected because customer projects and optional access are first-release requirements.

### Use UI visibility or RBAC as runtime isolation

Rejected because authorization does not isolate processes, files, credentials, caches, or networks on a shared execution host.

### Permit shared rootful Docker execution with a warning

Rejected because it silently exposes host-level authority and does not provide a safe failure boundary.

## Follow-up

- Implement persistent scoped ownership and service-level authorization with positive and cross-scope denial tests.
- Implement target capability/assignment checks and prove no-target rejection has no side effects.
- Define supported VM and dedicated-host provisioning adapters before claiming automated isolation.
