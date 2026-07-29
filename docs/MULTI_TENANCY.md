# Multi-tenancy evolution

## Starting point

The first release exposes one workspace and one primary environment. Users may operate several projects and servers within that workspace.

Internally, persistent resources use a workspace identifier from the beginning.

## Future tenant boundary

A tenant owns:

- users, roles, and service accounts;
- projects and environments;
- Git and registry connections;
- secrets and encryption keys;
- domains and Cloudflare accounts;
- runtime placement policy;
- builders, caches, and runners;
- audit logs;
- quotas and usage records.

## Shared build servers

Several tenants may use the same physical build server, but never the same logical builder state.

Required separation:

- rootless or virtualized builder;
- source workspace;
- cache namespace;
- registry credentials;
- secret delivery;
- process and resource limits;
- network policy;
- runner process;
- logs and artifacts.

A dedicated server can be assigned to selected tenants through placement labels and policy.

## Runtime isolation

Early hosted deployments should prefer dedicated runtime servers per tenant. Running hostile tenant workloads on one Docker daemon requires stronger sandboxing and is outside the first multi-tenant milestone.

Possible future options:

- dedicated host per tenant;
- virtual machine per tenant;
- microVM or sandboxed container runtime;
- Kubernetes namespace and policy integration.

## Data isolation

- every query is tenant-scoped;
- unique constraints include tenant where appropriate;
- object-storage paths and signed URLs include tenant scope;
- registry repositories use tenant namespaces;
- secret encryption uses tenant-specific data keys;
- audit exports cannot cross tenant scope;
- background jobs carry immutable tenant context.

Authorization is enforced in service boundaries, not only UI routes.

## Quotas

Potential quotas:

- concurrent builds;
- builder CPU, memory, disk, and duration;
- build cache and artifact retention;
- runtime servers and projects;
- deployment frequency;
- log and metric retention;
- registry storage;
- runner concurrency;
- domains and certificates.

## Migration plan

1. Introduce workspace scope in the single-tenant schema.
2. Centralize authorization checks.
3. Add tenant-specific encryption data keys.
4. Add quotas and usage accounting.
5. Isolate builders and caches.
6. Add tenant administration and invitations.
7. Add dedicated-runtime placement.
8. Perform external security review before public hosted access.
