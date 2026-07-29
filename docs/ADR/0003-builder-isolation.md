# 0003 — Treat builders as tenant isolation boundaries

- Status: Accepted
- Date: 2026-07-29
- Owners: genposed maintainers

## Context

The product starts single-tenant but is expected to support multiple tenants sharing build-server capacity. A shared rootful Docker daemon leaks cache, images, credentials, workspaces, and privileged control across workloads.

## Decision

A physical build server provides capacity. Each tenant uses a logically isolated builder with its own:

- BuildKit state;
- source workspace;
- cache namespace;
- registry credentials;
- secrets;
- resource limits;
- network policy;
- logs and artifacts.

Rootless BuildKit is the minimum preferred isolation. Ephemeral builders and virtual-machine or microVM isolation may be required for higher-risk tenants.

## Consequences

- Single-tenant installations can start with one persistent builder.
- Adding build servers does not change project configuration.
- Cache sharing is explicit rather than accidental.
- Builder lifecycle and scheduling become first-class platform responsibilities.
- Rootless isolation must not be marketed as equivalent to a VM security boundary.

## Alternatives considered

### One rootful Docker daemon for every tenant

Rejected for cross-tenant security and operational contamination.

### One dedicated physical build server per tenant

Strong separation but inefficient and prevents the requested shared-capacity model.

### Delegate all builds to provider CI

Useful as an option, but does not provide a consistent native deployment pipeline or local/offline operation.
