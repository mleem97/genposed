# genposed documentation

This directory contains the product, architecture, security, deployment, and operating model for genposed.

## Start here

| Document | Purpose |
| --- | --- |
| [Product scope](PRODUCT.md) | Product goals, users, boundaries, and major modules |
| [Architecture](ARCHITECTURE.md) | Control plane, workers, agents, storage, and execution model |
| [Compose Studio](COMPOSE_STUDIO.md) | Typed visual editing, YAML round-tripping, validation, and policies |
| [Deployment strategies](DEPLOYMENTS.md) | Zero-downtime, client-aware, progressive, and database-safe rollouts |
| [Git providers and runners](GIT_AND_RUNNERS.md) | GitHub, GitLab, Gitea, Forgejo, Codeberg, and native CI runners |
| [Build farm](BUILD_FARM.md) | BuildKit isolation, scheduling, cache, registries, and scaling |
| [Security architecture](SECURITY_ARCHITECTURE.md) | Threat model, trust boundaries, secrets, policies, and auditability |
| [Self-hosting](SELF_HOSTING.md) | Intended installation modes and operational requirements |
| [Multi-tenancy](MULTI_TENANCY.md) | Evolution from a single workspace to isolated tenants |
| [Roadmap](ROADMAP.md) | Proposed delivery phases and acceptance criteria |
| [Public references](REFERENCES.md) | Comparable open-source projects and official specifications |
| [Architecture decisions](ADR/README.md) | Decision records and the reasoning behind major constraints |

## Documentation status

These documents describe the intended product. They distinguish between:

- **Implemented** — present in the repository and usable.
- **Prototype** — present but incomplete or not production-hardened.
- **Planned** — approved product direction without complete implementation.
- **Exploratory** — under evaluation and subject to replacement.

When implementation diverges from the documentation, update the relevant document and add an ADR for decisions that change trust boundaries, persistence formats, agent behavior, provider authentication, tenant isolation, or deployment semantics.

## Writing guidelines

- Use English for repository documentation and public APIs.
- Describe guarantees separately from goals.
- Mark destructive or security-sensitive behavior explicitly.
- Prefer diagrams and state machines over ambiguous prose.
- Include failure behavior, rollback behavior, and ownership for long-running operations.
- Do not present an integration as automatic when a provider requires administrator registration or manual approval.
