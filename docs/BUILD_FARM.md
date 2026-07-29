# Build farm

## Principle

A build server is a capacity host. A builder is the isolation boundary.

```text
Build server
├── tenant A builder
├── tenant B builder
├── tenant C ephemeral builder
└── provider-native runner containers
```

The first single-tenant installation may use one persistent builder. The same model scales to multiple tenants and multiple servers.

## Build agent inventory

Each build agent reports:

- CPU cores and available CPU;
- total and available memory;
- disk and cache usage;
- architecture;
- supported target platforms;
- rootless support;
- QEMU support;
- maximum concurrency;
- current jobs;
- labels and maintenance state;
- BuildKit and Buildx versions.

## Build request

A request declares:

- workspace or tenant;
- project and environment;
- immutable source digest;
- Dockerfile and context;
- target stage;
- build arguments;
- secret references;
- SSH requirements;
- target platforms;
- CPU, memory, disk, and timeout limits;
- required server labels;
- cache namespace;
- registry destination;
- provenance and SBOM policy.

## Scheduling

Candidate servers are filtered by hard requirements and scored by:

- architecture and platform support;
- available capacity;
- active build count;
- tenant placement policy;
- cache locality;
- data residency or region;
- dedicated-server preference;
- queue priority.

The scheduler reserves capacity before source transfer and releases it after cleanup.

## Isolation levels

### Level 1: persistent rootless builder per tenant

Appropriate for the first trusted single-tenant release and lower-risk hosted use.

### Level 2: ephemeral rootless builder per build

Reduces state persistence and cross-build contamination. Cache is externalized to a tenant registry namespace.

### Level 3: ephemeral virtual machine or microVM per build

Preferred for hostile multi-tenant builds, privileged build requirements, or strong compliance boundaries.

A shared rootful Docker daemon is not considered tenant isolation.

## Cache

Cache keys and storage are scoped by tenant and optionally project.

Example namespace:

```text
registry.example.com/genposed-cache/<tenant>/<project>/<builder-policy>
```

Cache import across tenants is disabled unless an explicit trusted shared-base policy exists.

## Registry

Build output is pushed by immutable digest. Deployments consume the digest, not a mutable tag.

Credentials are:

- scoped to one tenant or project;
- delivered just in time;
- removed after the job;
- masked in logs;
- excluded from build context and provenance.

## Build security

- disallow `security.insecure`, host networking, and device access by default;
- use rootless BuildKit where possible;
- isolate source workspaces;
- enforce context size and file-count limits;
- limit CPU, memory, disk, process count, and duration;
- control outbound network access;
- scan final images;
- generate SBOM and provenance when enabled;
- clean temporary credentials and workspaces;
- audit every entitlement exception.

## Failure handling

A failed agent heartbeat causes its reservation to expire. Jobs without a published result become retryable. Jobs that already published an image digest are reconciled rather than rebuilt automatically.

Partial cache exports are not treated as deployable artifacts.

## Scaling

Additional build servers register through the panel and become scheduling candidates after capability and trust checks. Servers can be drained, dedicated to a tenant, restricted by labels, or excluded from specific workloads.
