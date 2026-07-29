# Roadmap

The roadmap is ordered by architectural dependency, not marketing priority.

## Phase 0 — Foundation and documentation

- product scope and architecture;
- canonical terminology;
- repository structure;
- security policy;
- contribution process;
- ADR process;
- target license decision.

**Exit criteria:** core trust boundaries and single-tenant assumptions are documented.

## Phase 1 — Compose Studio prototype

- Next.js application shell;
- canonical Compose model;
- schema and extension registries;
- structured service editing;
- repeatable map and list controls;
- YAML import/export;
- diagnostics;
- multiple Compose file detection;
- kitchen-sink reference;
- CI typecheck and build.

**Exit criteria:** a user can create, import, edit, export, and locally validate a non-trivial Compose project without editing indentation manually.

## Phase 2 — Local runtime management

- PostgreSQL-backed projects and environments;
- local runtime agent;
- Docker and Compose capability detection;
- containers, images, networks, volumes, logs, stats, and exec;
- deployment records and durable steps;
- manual Compose deployment;
- policy checks;
- Traefik domain and middleware basics.

**Exit criteria:** one self-hosted installation can safely deploy and manage one production environment.

## Phase 3 — Git provider hub

- GitHub App;
- GitLab.com OAuth;
- GitLab Self-Managed wizard;
- Gitea and Forgejo capability detection;
- Codeberg profile;
- repository discovery;
- webhook validation;
- branch and Compose-file selection;
- commit status;
- repository-managed and hybrid modes.

**Exit criteria:** push-triggered deployments work for supported hosted providers and at least one self-hosted provider.

## Phase 4 — Build farm

- build agent enrollment;
- BuildKit/Buildx execution;
- registry integration;
- immutable image digest deployment;
- cache namespace;
- resource limits;
- build logs and cancellation;
- multiple build-server scheduling;
- SBOM and provenance foundations.

**Exit criteria:** builds can move between at least two build servers without changing project configuration.

## Phase 5 — Native runner management

- GitHub Actions runners;
- GitLab runners;
- Gitea Actions runners;
- Forgejo Actions runners;
- Codeberg-compatible runner flow;
- persistent and ephemeral modes;
- labels, limits, health, update, rotation, and removal.

**Exit criteria:** a user can register a runner through the panel without manually operating a runner host.

## Phase 6 — Progressive and client-aware deployments

- rolling and blue-green;
- graceful connection draining;
- canary and linear traffic shifts;
- sticky sessions;
- browser update SDK;
- active-client adoption tracking;
- side-by-side API versions;
- automatic metric-based rollback;
- Expand and Contract migration workflow.

**Exit criteria:** a supported web application can update without serving mixed incompatible frontend/backend versions.

## Phase 7 — Operations and integrations

- Caddy;
- full Cloudflare DNS and tunnel workflows;
- Coolify and Dokploy API adapters;
- volume backup and restore;
- notifications;
- metrics and retained logs;
- registry management and scanning;
- self-update workflow.

## Phase 8 — Multi-tenancy

- tenant administration;
- tenant encryption keys;
- isolated builders, caches, runners, and registry namespaces;
- quotas and usage;
- dedicated runtime placement;
- billing integration if required;
- external security review.

**Exit criteria:** two unrelated tenants can share the control plane and build capacity without access to each other's data, credentials, workspaces, cache, logs, or artifacts.

## Not scheduled

- Kubernetes support;
- generalized cloud infrastructure provisioning;
- hostile-tenant workloads on a shared Docker daemon;
- every possible reverse proxy or CI provider;
- automatic database compatibility inference without application cooperation.
