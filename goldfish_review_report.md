# Goldfish brainstorm review

**Target:** [Rootless-first product planning](docs/ROOTLESS_PLANNING.md)  
**Date:** 2026-11-09  
**Status:** findings are proposals and open design questions, not implemented guarantees.

## Reviewer status

| Reviewer | Status | Focus |
| --- | --- | --- |
| Design critic | Completed | Isolation, authorization, privileged operations |
| Codebase details | Completed | Existing decisions, observability, release dependencies |
| Zoom out | Completed | Product scope, viability and first user journey |
| Comprehension | Completed | UX, customer journeys and actionable errors |
| Implementation readiness | Completed | Recovery, migration and acceptance gates |
| Structural | Completed | Domain model, document consistency and traceability |
| Inventive catalyst | Completed | Capability-based routing and user-facing workflows |

## Prioritized findings

### Blocker: customer isolation and authorization

[Planning](docs/ROOTLESS_PLANNING.md) introduces customer access and shared-server execution while the trust boundary and isolation are unresolved. The [multi-tenancy plan](docs/MULTI_TENANCY.md) and [roadmap](docs/ROADMAP.md) defer tenant isolation and exclude hostile shared-daemon workloads. Define which actors may submit workloads, how resources and credentials are isolated, where project-scoped permissions are enforced, and how the system handles an unenforceable boundary. Test cross-customer access, denial, revocation and resource exhaustion. Rootless alone and UI RBAC are insufficient guarantees.

### Blocker: production recovery is not a release gate

[Roadmap phase 2](docs/ROADMAP.md) targets a production environment; backup and restore appear in phase 7. Define supported backups and application consistency, encryption keys, agent identity recovery, restoration tests, upgrade/rollback behavior and recovery objectives before claiming production readiness.

### Major: Compose and privilege compatibility

The goal of broad Compose support and rootless-first execution requires a versioned capability contract. Validate the effective configuration against the target, explain unsupported features and security requirements, and enforce scoped, expiring, auditable approvals at execution. Avoid silent rootful fallback. Revalidate after relevant configuration, policy or host changes.

### Major: customer and operator experience

Define a single practical journey through install, connect Git, import Compose, configure domain and secrets, deploy, operate and recover. Describe customer invitation, permissions, approval requests and status, and ensure errors identify the affected option and a usable remedy. Measure the journey rather than assuming a low page count is sufficient.

### Major: first-release scope and existing decisions

Separate owner projects and customer projects, optional customer access, GitHub and Forgejo/Gitea are first-release requirements in the working hypothesis. Define the customer/workspace/project relationship and revise the roadmap, security and product documentation after decisions. Define provider and runtime acceptance tests, supported versions and behavior when integrations are unavailable.

### Major: migration, observability and resource limits

Define whether and how a Coolify installation can be migrated, including data, credentials, DNS, cutover and rollback. Expose host/agent health, actual daemon identity, capability failures, limits, deployments, backup status and audit events without leaking secrets. Decide how CPU, memory, disk and concurrency limits are enforced and what happens when the host cannot enforce them.

## Candidate design direction

Inspect the effective Compose configuration before deployment and route the entire project to a rootless or separately isolated execution boundary selected by policy. Keep exceptional approval in the same user flow, bind it to the target and configuration, and recheck at execution. A dedicated VM or host is one candidate boundary; cost, provisioning, host-specific Compose semantics and data access require evaluation. This is not an approved architecture.
