# 0001 — Separate control plane from execution agents

- Status: Accepted
- Date: 2026-07-29
- Owners: genposed maintainers

## Context

genposed must manage Docker, Compose, proxy configuration, builds, logs, and commands on local and remote servers. Publishing Docker sockets or executing every operation inside Next.js request handlers creates security, reliability, and lifecycle problems.

## Decision

Use a control-plane and agent architecture.

- Next.js provides the UI, API, authentication, and desired-state management.
- Durable workers own long-running orchestration.
- Runtime and build agents initiate authenticated outbound connections.
- Docker and BuildKit endpoints remain local to their agents.
- Agent commands are versioned, authorized, expiring, idempotent, and audited.

## Consequences

- Control-plane restarts do not stop deployed applications.
- Remote servers do not require public Docker APIs.
- Agent protocol compatibility becomes a release requirement.
- Enrollment, rotation, revocation, and reconciliation must be implemented.
- Local single-server installations contain more components, but the same topology scales outward.

## Alternatives considered

### Direct SSH execution

Simple initially, but weak for continuous events, capability reporting, streaming, identity rotation, and reliable reconciliation.

### Public Docker API with TLS

Operationally fragile and exposes a highly privileged endpoint. Client credentials effectively grant host-level control.

### Execute deployments inside Next.js requests

Rejected because builds and deployments exceed request lifetimes and require durable retry semantics.
