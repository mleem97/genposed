# Self-hosting model

## Initial installation

The first supported topology may run on one Linux server:

```text
reverse proxy
control plane
worker
PostgreSQL
object storage
OCI registry
runtime agent
build agent
BuildKit
```

Components remain independently addressable so that build and runtime capacity can move to additional servers later.

## Requirements

Proposed baseline:

- Linux host;
- current supported Docker Engine;
- Docker Compose plugin;
- persistent PostgreSQL storage;
- persistent application and agent identity storage;
- domain name and TLS;
- sufficient disk for images, build cache, logs, and backups;
- outbound access to connected Git providers and registries.

Exact supported versions will be defined before the first release.

## Installation flow

1. Start the control-plane stack.
2. Create the initial administrator.
3. Initialize the default workspace and environment.
4. Enroll the local runtime and build roles.
5. Configure a domain and proxy.
6. Connect a Git provider.
7. Connect or initialize an OCI registry.
8. Import or create a Compose project.
9. Validate and deploy.

## Additional servers

The panel generates a short-lived enrollment command. The agent connects outward, reports capabilities, and waits for approval.

Server roles:

- runtime;
- build;
- runner;
- proxy;
- storage;
- combined.

Roles are logical. A server may hold several roles in a small installation.

## Backups

A complete control-plane backup includes:

- PostgreSQL;
- encryption-key material or external key references;
- object storage;
- agent trust and enrollment state;
- proxy configuration;
- certificate state where managed locally;
- registry metadata and, when required, image storage.

Application volume backup is configured separately per project.

## Updates

genposed self-updates use the same deployment engine principles:

- preflight compatibility check;
- backup and migration gate;
- new control-plane version starts in parallel;
- readiness and smoke tests;
- client update notification;
- connection draining;
- rollback retention.

## Recovery

Documented recovery must cover:

- lost control-plane host with surviving runtime servers;
- restored database with changed agent connections;
- lost build cache;
- unavailable registry;
- partial proxy configuration;
- failed database migration;
- revoked provider credentials.

Runtime applications should continue operating during a control-plane outage. Management and new deployments may be unavailable until recovery.

## Network exposure

Only the public proxy and intended application ports should be internet-facing. PostgreSQL, object storage administration, BuildKit, Docker sockets, and agent control channels should remain private or mutually authenticated.
