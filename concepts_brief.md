# genposed: rootless-first Compose platform

* **Author:** Marvin
* **Date:** 2026-11-09
* **Status:** source brief; initial ownership and isolation direction is now recorded in [ADR 0004](docs/ADR/0004-operator-customer-scopes.md). Other product and target details remain open.

## Overview

genposed is planned as a self-hosted alternative to Coolify that makes Compose deployments easier to create and operate. UX comes first: operators should manage their own projects and customer projects without navigating unnecessary pages. The first usable release should support deployment from GitHub and Forgejo/Gitea. The operator decides whether each customer gets access; basic customer operations include start, stop and restart, with other permissions controlled through RBAC.

Rootless execution is preferred wherever possible. A capability that requires elevated access needs an isolated, secured path and approval by support or an administrator, or an applicable instance rule. The security and authorization details remain to be designed. Automation and low maintenance matter; Cloudflare DNS and useful related integrations, plus Doppler and Infisical, are desired. Exact integration scope is open.

## Analysis

The seven independent Goldfish reviewers identified these unresolved issues:

1. **Customer isolation is a release blocker.** A shared rootless Docker daemon and UI-level RBAC alone do not isolate untrusted customers. ADR 0004 sets a dedicated host or VM assigned to the customer scope as the initial eligible boundary; supported provisioning backends and workload limits still require implementation and verification.
2. **Compose compatibility needs a clear contract.** Some Compose capabilities cannot be provided by every rootless runtime. Detect requirements against the selected target, report unsupported options and security implications before deployment, and never silently downgrade isolation. Approval and runtime capabilities must be rechecked when configuration or host state changes.
3. **Approval and access need enforcement.** Define customer/project scope, default-deny permissions, agent-side checks, approval authority, expiration, revocation, audit and the actual privileged execution boundary. Avoid treating approval as permission to expose a shared daemon or host.
4. **Recovery must precede production.** The existing roadmap schedules application backup and restore after the initial production milestone. Define application-consistent backups, keys and identity recovery, restoration testing, failure handling and recovery targets before claiming production readiness.
5. **The release journey needs a measurable scope.** Define installation, project creation, Git or Compose import, configuration, domain setup, deployment, status, basic operations and restore as a coherent operator journey. Specify supported host/runtime versions, Git providers, integration setup and useful failure messages.
6. **Existing documentation conflicted with this direction.** The roadmap and multi-tenancy plan deferred customer scope. The operator/customer project model is now recorded in ADR 0004 and the affected roadmap and architecture documents; implementation remains outstanding.

### Candidate approach to evaluate

A deployment flow must inspect the effective Compose configuration, identify required permissions and target capabilities, and route the whole project only to an eligible execution boundary under operator policy. Unsupported or unassigned targets fail closed. Host networking, storage, devices, provisioning cost, data ownership, and the security properties of supported providers still require design and testing.

## Goals and non-goals

### Goals

- Simple, low-maintenance Compose deployment and operation for own and customer projects.
- Optional customer access with configurable role-based permissions.
- Rootless-first execution, with isolated and authorized exceptions.
- GitHub and Forgejo/Gitea deployments in the first usable release.
- Cloudflare DNS automation; evaluate other useful Cloudflare functions and Doppler/Infisical integrations.
- Restore and security controls adequate for the eventual supported production scenario.

### Boundaries still to decide

- Supported applications, Compose capabilities and host/runtime combinations.
- Customer isolation, trust assumptions, limits and default permissions.
- First-release backup, migration, integration and recovery scope.
- Which host setup privileges and privileged workload execution methods are acceptable.

The existing plan excludes hostile workloads sharing a rootful Docker daemon. Nothing in this brief changes that security boundary by itself.

## Alternatives weighed

- **One shared rootful Docker daemon for unrelated customers:** already rejected in [ADR 0003](docs/ADR/0003-builder-isolation.md); the roadmap also excludes hostile shared-daemon workloads. It is not a safe substitute for a defined tenant boundary.
- **Rootless daemon alone as a tenant security boundary:** rejected as a sufficient guarantee by the review; rootless reduces privilege but does not establish isolation between customers sharing a daemon.
- **Separate VM or host for higher-risk execution:** candidate to evaluate; stronger isolation brings resource, provisioning, networking and storage costs. No owner decision yet.

## Key decisions and next steps

The owner has stated the product goals above and requested this review. ADR 0004 resolves the initial ownership scopes and minimum target boundary. Supported workload classes, first-release recovery objectives, exact permissions and approval policy, and provider choices remain open. The review evidence is in [the Goldfish report](goldfish_review_report.md).
