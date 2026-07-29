# Security architecture

## Trust boundaries

genposed handles several high-risk capabilities:

- source-code access;
- registry credentials;
- arbitrary container images;
- Docker Engine administration;
- build execution;
- proxy and DNS changes;
- application secrets;
- interactive exec sessions;
- database migrations.

The control plane, agents, builds, repositories, runtime containers, and browser clients are separate trust domains.

## Threat model

Relevant threats include:

- stolen provider or registry credentials;
- malicious Compose configuration;
- Docker socket or host filesystem escape;
- cross-tenant cache, workspace, secret, or network access;
- forged webhooks;
- replayed agent commands;
- compromised build output;
- dependency or image supply-chain attacks;
- proxy-rule takeover;
- secret leakage through logs;
- unsafe database migrations;
- unauthorized exec or destructive Docker actions;
- denial of service through builds, logs, or unbounded resources.

## Agent identity

Agents enroll with a short-lived bootstrap token and receive a unique identity. Normal operation uses mutually authenticated transport.

Requirements:

- outbound connection from agent to control plane;
- certificate or key rotation;
- revocation;
- server and capability binding;
- command expiry and replay protection;
- protocol version negotiation;
- audit event for enrollment, rotation, and revocation.

## Secrets

Use envelope encryption:

- one encrypted data key per tenant or security scope;
- master key in a dedicated key-management system or protected installation secret;
- ciphertext and key version stored in the database;
- plaintext only in memory for the shortest required period;
- per-command delivery to agents;
- automatic log masking;
- explicit secret access audit.

Secrets are never embedded in Git commits or normal deployment logs.

## Compose policy

Critical policies may block deployment:

- `privileged: true`;
- host PID, IPC, user, or network namespace;
- Docker socket mount;
- dangerous `/proc`, `/sys`, `/dev`, or host-root mounts;
- unrestricted device mappings;
- `cap_add: [ALL]` or high-risk capabilities;
- untrusted logging drivers;
- public management interfaces;
- dangerous BuildKit entitlements.

Exceptions require scope, owner, reason, expiry, and audit history.

## Docker access

The Docker daemon remains local to the runtime agent. The control plane never asks users to publish an unauthenticated Docker TCP socket.

Interactive exec and destructive operations require dedicated permissions and confirmation policies.

## Build isolation

See [BUILD_FARM.md](BUILD_FARM.md). Tenant isolation requires separate builders, cache namespaces, source workspaces, credentials, and resource controls. Rootless builders reduce risk but are not equivalent to virtual-machine isolation.

## Webhooks

- validate signatures against the raw request body;
- use constant-time comparison;
- reject unsupported algorithms;
- deduplicate delivery IDs;
- limit payload size;
- enqueue only after validation;
- retain redacted delivery metadata;
- support safe replay from stored normalized events.

## Supply chain

Planned controls:

- source pinned to commit SHA;
- source archive digest;
- immutable image digest;
- SBOM;
- provenance;
- vulnerability scanning;
- optional signature verification;
- policy on base images and registries;
- deployment record linking source, build, image, and runtime.

## Browser update coordinator

Client heartbeats and session identifiers are security-sensitive metadata. Store only what is required for rollout coordination. Avoid exposing user assignment, tenant routing, or internal deployment headers to untrusted clients.

Header-based routing must remove user-supplied internal headers at ingress.

## Audit

Audit records cover:

- authentication and permission changes;
- secrets access;
- provider and runner changes;
- Compose edits and exports;
- policy exceptions;
- builds and entitlements;
- deployments and rollbacks;
- proxy and DNS changes;
- Docker exec and destructive commands;
- agent enrollment and revocation.

Audit events are append-only from the application perspective.

## Security maturity

The early prototype is not a hardened deployment platform. Production use requires completed authentication, authorization, encryption, agent identity, policy enforcement, audit retention, backup, recovery, and dependency-management processes.
