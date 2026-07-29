# Product scope

## Vision

genposed makes Docker Compose operable through a structured interface without hiding or replacing the underlying standards. It combines visual configuration, Git-driven delivery, build capacity, runtime management, reverse-proxy automation, and progressive application updates in one self-service control plane.

## Initial target

The first supported installation model is:

```text
one installation
└── one workspace
    └── one primary environment
        ├── one or more projects
        ├── one or more runtime servers
        └── one or more build servers
```

The initial release does not require billing, customer onboarding, organization hierarchies, or complex tenant administration.

## Intended users

- Developers operating personal or company Docker environments.
- Small teams that want PaaS-like workflows on existing servers.
- Platform engineers standardizing Compose configuration and deployment.
- Hosting providers that may later expose isolated workspaces as a managed service.
- Operators who need Portainer-like controls without separating deployments from project configuration.

## Major modules

### Compose Studio

A schema-driven visual editor that maps every supported Compose field to typed controls. Repeated values are edited as rows, nested values as structured groups, and advanced values through scoped raw editors.

### Provider Hub

Connections to hosted and self-hosted GitHub, GitLab, Gitea, Forgejo, and Codeberg instances. It normalizes repositories, namespaces, branches, archives, webhooks, statuses, and provider capabilities.

### Runner Manager

Registration and lifecycle management for provider-native CI runners. It uses provider APIs where available and guided registration-token workflows where automation is restricted.

### Build Farm

A pool of build servers that run isolated BuildKit builders and optional CI runners. Builders are tenant-scoped even when several tenants share one physical build server.

### Deployment Engine

A durable workflow engine for source acquisition, validation, policy checks, builds, migrations, Compose application, health verification, routing, rollout progression, rollback, and cleanup.

### Docker Manager

Container, image, network, volume, registry, event, log, stats, exec, and Compose operations through authenticated runtime agents.

### Proxy Manager

Traefik, Caddy, Cloudflare, certificate, DNS, route, middleware, load-balancing, and rollout-routing configuration.

### Client Update Coordinator

An optional browser SDK and server-side session model that coordinate frontend update notifications, service-worker activation, version acknowledgement, session migration, and graceful retirement of old containers.

## Non-goals for the first release

- Kubernetes orchestration.
- Arbitrary infrastructure provisioning across every cloud.
- A public multi-tenant SaaS.
- Fully trusted execution of unreviewed third-party Compose files.
- A generic replacement for every CI system.
- Transparent automation where a Git provider requires instance-administrator registration.
- Strong isolation between hostile tenants on a shared rootful Docker daemon.

## Product invariants

- A deployable version always references an immutable source revision.
- Generated configuration can be exported and inspected.
- Agent commands are authenticated, authorized, time-bounded, and audited.
- Old application versions are not removed solely because a new container started; rollout completion follows the selected strategy.
- A lost browser tab cannot keep an old version alive forever; client-aware draining always has an inactivity timeout and maximum deadline.
- Destructive database changes occur after compatibility phases, not in the first rollout step.
- Provider-specific features are capability-detected instead of assumed.
