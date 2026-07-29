# Deployment strategies

## Deployment model

A deployment is an immutable record linked to a source revision, rendered configuration, image digests, migration steps, target servers, routing state, health evidence, client adoption, and rollback reference.

Every application, Compose project, service, or environment selects a deployment strategy and may combine compatible routing, session, client-update, and database-migration mechanisms.

## Common gates

Before traffic reaches a new version:

- source digest verified;
- Compose configuration normalized;
- policy checks accepted;
- required images available by immutable digest;
- containers started;
- readiness checks passed;
- smoke tests passed;
- proxy candidate configuration validated.

Automatic rollback may use health, HTTP error rate, latency, resource usage, custom application metrics, client errors, or migration checks.

## Supported strategies

### Rolling Update

New instances replace old instances incrementally. The proxy adds only ready instances and drains old instances before termination.

### A/B Deployment

Users are deterministically assigned to an old or new version by criteria such as account, role, beta status, region, language, cookie, header, authentication claim, or percentage bucket.

### Blue-Green Deployment

A complete new environment starts beside the current environment. Validation occurs before an atomic traffic switch. The previous environment remains available for rollback during a retention period.

### Canary Release

A small traffic percentage reaches the new version first. Traffic increases manually, on a schedule, or when metrics remain within thresholds.

### Shadow Deployment

Selected live requests are mirrored to the new version while its responses are discarded. Side effects must be blocked, mocked, or directed to isolated dependencies.

### Ring Deployment

Rollout progresses through defined audiences such as automated tests, developers, internal users, beta users, selected customers, and general availability.

### Feature Toggles

Code deployment and feature release are separated. New functionality can be enabled by environment, user, tenant, role, region, percentage, or schedule, with audit history and kill switches.

### Linear Rollout

Traffic moves by a fixed amount at a fixed interval, for example ten percentage points every five minutes.

### Expand and Contract

Database-safe workflow:

1. add compatible schema;
2. deploy dual-compatible code;
3. backfill data;
4. switch reads;
5. stop old writes;
6. remove old schema in a later deployment.

### Strangler Fig

Paths, hosts, methods, or API capabilities are progressively routed from the old application to the replacement.

### Active-Active

Multiple complete stacks serve traffic. One stack is drained, updated, verified, and returned before the next stack is updated.

### Dark Launching

The new version runs against real inputs while results remain hidden. Feature flags or routing rules expose behavior only after validation.

### Immutable Infrastructure

A new host or virtual machine is created, bootstrapped, deployed, verified, and activated through a load balancer or DNS. The previous host is retained temporarily.

### Graceful Shutdown and Connection Draining

The proxy stops new requests to an old instance while active HTTP requests, HTTP/2 streams, WebSockets, Server-Sent Events, queue jobs, and background work finish.

### Hot Standby

A passive full environment is updated and tested before becoming active. The previous active environment becomes the new standby.

### Side-by-Side API Versioning

Old and new APIs remain available under paths, hosts, headers, or media types such as `/api/v1` and `/api/v2`.

### Header-Based Routing

Trusted request metadata selects a version. Internal routing headers must be stripped from untrusted ingress and replaced or signed by trusted components.

### Request Buffering

A proxy or queue briefly holds eligible requests during a switch. Streaming protocols and unsafe non-idempotent requests require separate behavior.

### Stateful Rollout with Sticky Sessions

Existing sessions stay on the old version while new sessions use the new version. The old version remains until sessions migrate or expire, subject to a maximum deadline.

## Client-aware web updates

Applications may integrate a lightweight client SDK.

The SDK can:

- expose the loaded deployment version;
- maintain a heartbeat for active clients;
- receive update events by WebSocket, Server-Sent Events, polling, or service-worker events;
- show a customizable update prompt;
- reload immediately, after an action, on navigation, on logout, on session expiry, or when leaving the page;
- acknowledge successful loading of the new version;
- report JavaScript chunk and compatibility failures;
- preserve and restore supported editor or navigation state.

The control plane tracks known active clients and sessions per deployment version.

Old containers can retire when:

- no new traffic is routed to them;
- active requests and long-lived connections are drained;
- all known active clients or sessions migrated or expired;
- background work completed;
- the configured minimum adoption threshold is met;
- or the maximum drain deadline is reached.

A permanently offline or suspended tab cannot be tracked forever. Every policy therefore defines a heartbeat timeout and absolute deadline.

## Updating genposed itself

The web control plane, workers, and agents are versioned independently.

A self-update must:

- keep active deployments and builds durable outside the web process;
- start and health-check the new control-plane version;
- preserve backwards-compatible agent protocols;
- use Expand and Contract database migrations;
- notify connected panel clients;
- preserve unsaved Compose editor state where possible;
- reconnect streams after reload;
- drain the old control-plane version;
- roll back if readiness, migrations, or compatibility checks fail.

## Strategy compatibility

The UI should recommend safe combinations, for example:

- Blue-Green plus connection draining;
- Canary plus sticky assignment;
- Canary plus feature toggles;
- Shadow before Canary;
- Rolling Update plus client notifications;
- Side-by-Side API plus forced client reload;
- Expand and Contract before Blue-Green;
- Active-Active plus per-node rolling updates.

Incompatible combinations are blocked with an explanation rather than accepted and silently degraded.
