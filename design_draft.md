# genposed: rootless-first Compose platform

**Author:** Marvin  
**Status:** Draft — overview and goals for review  
**Context:** [Concept brief](concepts_brief.md) · [Goldfish review](goldfish_review_report.md)

## The problem

Operators need to deploy and maintain Compose projects for themselves and for customers. Existing workflows can require too much navigation and manual configuration, while a platform that handles customer workloads also needs enforceable security boundaries, recoverability and clear permissions. Rootless operation reduces exposure, but a rootless daemon alone does not isolate unrelated customers.

The existing roadmap assumes one workspace first and defers tenant administration and isolation. The intended first usable release now needs separate customer projects and optional customer access. The relationship between customers, workspaces and isolation remains to be designed.

## Overview

genposed aims to provide a self-hosted control plane for Compose with an approachable, low-maintenance deployment and operation experience. Operators manage their own projects and projects for customers, decide per customer whether access is granted, and control permissions through RBAC. GitHub and Forgejo/Gitea are required deployment sources.

Run rootless where possible. Where a workload needs capabilities unavailable to the chosen rootless runtime, an isolated and secured route and authorization are required. Neither the isolation mechanism nor an automatic fallback is decided here.

## Goals

- Allow operators to distinguish their own projects and customer projects in the first usable version.
- Let authorized customers perform basic operations such as start, stop and restart; make further access configurable through RBAC.
- Provide effective access to Compose capabilities while explaining target-specific incompatibilities and required approvals.
- Minimize navigation and manual maintenance; make deployment and routine operation understandable.
- Prefer rootless runtime and builds, while designing secure, isolated handling of privileged exceptions.
- Support GitHub and Forgejo/Gitea deployment, and Cloudflare DNS automation. Evaluate other useful Cloudflare features and Doppler/Infisical integration.
- Establish customer isolation, security and tested recovery before claiming support for a production scenario.

## Non-goals and boundaries

- Claiming that rootless execution or RBAC alone isolates mutually untrusted customers.
- Silently switching to a rootful runtime when a rootless deployment is unsupported.
- Claiming all Compose options work on every host or runtime.
- Assuming that customer self-service or every integration is enabled for every installation.
- Treating the current prototype and planning documents as implemented production features.

## Open questions

The isolation boundary, customer/workspace model, permission defaults, runtime compatibility matrix, privileged approval lifecycle, supported recovery targets and integration scope still require decisions and review. The existing ADRs and roadmap remain in effect until explicitly revised.

## Technical plan — working draft

The components below describe responsibilities and constraints. Names and deployment boundaries are candidates, not approved implementation choices.

### Customer and project boundaries

An installation has an operator-controlled administrative scope and customer scopes. Projects belong to an explicit owner scope; environments, deployments, secrets, logs and integrations are associated with that scope. A customer can have no login or an invitation to a customer-scoped account. The final relationship among installations, workspaces and customers remains open; the model must prevent a customer from reading or changing another customer's resources even when object identifiers are known.

The control plane enforces role and resource scope on every API request. An agent accepts only authenticated, authorized, time-limited commands bound to the customer, project, target and operation. Agents revalidate authorization or a revocable authorization grant before execution. Start, stop and restart can be assigned independently from advanced operations such as editing Compose, exec, reading secrets and changing domains. Default roles and policy remain to be decided. Record successful and denied sensitive actions without persisting secret values.

### Deployment flow

1. The operator selects a customer or own project, connects GitHub or Forgejo/Gitea or imports a Compose file, and selects the target environment.
2. Resolve an immutable source revision where Git is used. Render the effective Compose configuration for the selected target and validate against its supported Compose/runtime version. Treat imported Compose and build contexts as untrusted input.
3. Determine required host access, devices, namespaces, exposed ports, storage, build permissions and policy exceptions. Detect whether required constraints can actually be enforced. Explain unsupported capabilities and show relevant fixes in the same flow.
4. Select an eligible execution boundary according to the configured policy and available capacity. If none can satisfy the workload and policy, stop with an actionable reason. A rootful or less isolated target must never be selected silently.
5. When required, request an explicit approval from a permitted support/admin actor or evaluate an applicable instance rule. Bind the decision to the effective configuration digest, customer, target, granted capability, scope and expiry. Revalidate policy, actor authorization, configuration and target before execution; an expired or changed approval must not authorize the new request.
6. Queue a durable deployment, build or pull images, apply the configuration, verify health and activate routing. Preserve an audit trail and report failures and recovery actions. A retry first reconciles the actual target state.

**Security constraint:** rendering and inspection must not execute repository-supplied code, run arbitrary Compose lifecycle hooks, expose secrets in logs, or grant host access. Builds happen only after policy and isolation decisions.

### Execution isolation — configurable profiles selected

The owner selected configurable execution profiles. An authorized operator can assign an eligible server or VM boundary per customer or project. Policy selects among configured targets; the system must stop if no target satisfies the workload and required isolation. Rootless remains preferred inside each supported target. A profile does not make unsafe host access safe merely through an approval button.

Incus and Proxmox VE are candidates for integration; neither is selected as a required dependency or supported release target yet. Both offer VMs and system containers. System containers share the host kernel, whereas VMs have their own kernel; do not treat these as interchangeable isolation guarantees. The guest agent, orchestration credentials, provisioning privileges, networking, storage, lifecycle and recovery must be assessed for each supported backend. See [Incus: containers and VMs](https://linuxcontainers.org/incus/docs/main/explanation/containers_and_vms/) and the [Proxmox VE administration guide](https://pve.proxmox.com/pve-docs/pve-admin-guide.pdf).

The following alternatives were considered:

1. **Dedicated server per isolation boundary.** An operator provisions a distinct machine for each boundary; workloads and privileged exceptions are confined to that machine. This is straightforward to reason about but costs more and fails to provide shared-host isolation when only one machine is available.
2. **Separate VM per isolation boundary on a shared server.** A host provisions isolated VMs, each with its own runtime and agent. This enables physical host sharing but needs virtualization support, lifecycle management, capacity and secure networking/storage. It is unsuitable where virtualization is unavailable or the host administrator is untrusted.
3. **Configurable execution profiles.** The operator chooses a supported dedicated server or VM boundary per customer or project, and the deployment planner selects an eligible preconfigured target. This permits different cost and isolation choices but increases configuration and testing scope. It cannot safely treat a shared Docker daemon as a hostile-customer boundary and must reject deployments with no eligible target.

The owner selected option 3. The meaning of an isolation boundary (customer or project), VM provisioning responsibility and protection against compromised host administrators still require design. Rootless containers sharing a daemon are not presented as an isolation solution for mutually untrusted customers.

### Privileged exception lifecycle

An instance policy can explicitly allow a scoped capability, or an authorized support/admin actor can approve a request. Policies and approvals define customer/project scope, exact capability, target boundary, author, reason, validity and revocation. Approval does not override unsupported host capabilities or mandatory isolation. Default-deny, enforcement location, delegation, race handling and detailed audit retention must be specified before implementation.

### UX and automation

The project overview is the starting point for source, configuration, deployment status, logs and basic operations. Show normal deployment progress in one task flow; display advanced configuration when needed without hiding security-relevant decisions. Automate DNS configuration through Cloudflare when authorized, with clearly scoped credentials, an explanation of changes and actionable failures. Doppler and Infisical are candidate secret providers; exact supported operations, authentication and failure behavior are open. Do not copy secret values into repository commits, approvals or routine logs.

### Recovery and reliability

Before a supported production release, provide a documented and tested restoration path for control-plane state, encrypted secrets and keys, agent identity, configuration, and supported application data. Database-consistent backup mechanisms are needed where file copies alone are insufficient. Define backup destinations, encryption, access scope, restore verification, upgrade/rollback behavior and recovery objectives for the supported scenario. Runtime applications should continue operating if the control plane is temporarily unavailable, subject to their host and dependency availability.

### Release verification

- Test cross-customer access denial, object-scoped RBAC, revoked or expired approvals, and unauthorized agent commands.
- Exercise supported rootless hosts and versions: reboot, daemon identity, cgroup enforcement, ingress, certificate renewal, bind-mount ownership and unsupported Compose options.
- Deploy and update representative projects from GitHub and Forgejo/Gitea; test webhook failure, duplicate delivery and credential revocation.
- Verify Cloudflare DNS behavior with scoped credentials and recovery from failed or partial changes.
- Restore control-plane and supported application data into a clean environment and verify access, secrets and application health.
- Observe operators completing deployment and routine operations; agree measurable task completion criteria before calling the UX goal achieved.

Exact host matrix, example workloads, recovery objectives and measurable UX thresholds are open decisions.

## Alternatives considered

### Configurable execution profiles — selected by author

Authorized operators choose suitable execution targets per customer or project, including dedicated servers and VMs. A policy checks workload requirements against eligible targets. This gives different installations and workloads different isolation and cost profiles, but needs clear defaults, capacity checks, backend-specific tests and a refusal path when no target is suitable. The exact isolation unit, provisioning method, backend and profile defaults are not yet selected.

### Dedicated physical server for every isolation boundary

A dedicated server for every boundary gives a clear physical separation and can remain one supported execution profile. Requiring it for every customer would increase server cost and operational burden and prevent shared-host VM deployments. The author selected configurable profiles instead of mandating this as the only deployment model.

### VM for every isolation boundary

A VM for every boundary provides a separate guest kernel and can remain a supported profile on suitable hardware. Making it mandatory would require virtualization and extra capacity for all installations, including small homelabs. The author selected configurable profiles instead of mandating this as the only deployment model. A VM boundary still relies on a trusted host and secure configuration.

### Shared rootful daemon for unrelated tenants

The existing [builder isolation ADR](docs/ADR/0003-builder-isolation.md) rejects one shared rootful Docker daemon as a tenant isolation boundary. The [roadmap](docs/ROADMAP.md) excludes hostile-tenant workloads on a shared Docker daemon. These decisions remain in effect until explicitly revised.

### Shared rootless daemon as the sole tenant boundary

The Goldfish review found that rootless operation reduces host privilege but does not by itself establish isolation between mutually untrusted customers sharing the daemon. It is not accepted here as a sufficient hostile-customer boundary; authorization and target isolation need independent enforcement. Whether shared daemon profiles are appropriate for explicitly trusted workloads is still a policy decision.

### Incus and Proxmox VE

Both are candidates to evaluate as providers for execution profiles, not chosen dependencies. Incus supports VMs and system containers; Proxmox VE supports KVM VMs and LXC containers. A container shares the host kernel, so its security properties must be evaluated separately from a VM. Integration cost, supported APIs, privileges, provisioning, networking, storage, backup and release scope remain open. Sources: [Incus documentation](https://linuxcontainers.org/incus/docs/main/explanation/containers_and_vms/) and [Proxmox VE administration guide](https://pve.proxmox.com/pve-docs/pve-admin-guide.pdf).

## Detailed implementation — planning draft

This is a proposed delivery breakdown, not a claim that the paths or features exist. The repository currently contains planning documents on this branch; concrete source paths, runtime technology, data schemas, profile providers and release criteria must be settled before implementation. The proposed paths below are based on the repository layout in [README.md](README.md); each is a work area to refine into an exact file list after the implementation stack is chosen.

1. **Resolve the domain and authorization model.** Define installation, customer, project, environment, membership and execution target, including ownership, membership changes and scope inheritance. Design server-side RBAC with deny-by-default rules, resource-scoped checks, revocation and audit. Define whether a boundary is assigned per customer, project or both; prevent customer selection of a weaker profile without an authorized policy. Update [docs/PRODUCT.md](docs/PRODUCT.md), [docs/MULTI_TENANCY.md](docs/MULTI_TENANCY.md), [docs/SECURITY_ARCHITECTURE.md](docs/SECURITY_ARCHITECTURE.md) and add a new ADR under `docs/ADR/` so the first-release customer model and security boundary are explicit. Update [docs/ADR/README.md](docs/ADR/README.md) to index the ADR.
2. **Define profile contracts and target enrollment.** Under proposed `packages/agent-protocol/` define versioned target identity, scope, capability and command contracts; under proposed `agents/runtime-agent/` define outbound enrollment, restricted local access, capability reporting, cancellation, replay protection and reconciliation. Under proposed `apps/worker/` define the decision flow for eligible targets. Design support for dedicated servers and VMs without assuming both are automatically provisioned. Incus and Proxmox adapters remain candidates with separate privilege, transport, lifecycle, network, storage, failure and recovery assessments. Revise [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md). Preserve the accepted control-plane/agent separation in [ADR 0001](docs/ADR/0001-control-plane-and-agents.md) unless an explicit later decision changes it.
3. **Define workload validation and privilege approvals.** Under proposed `packages/compose-model/` represent the effective Compose document and source locations; under proposed `packages/compose-policy/` define target capability checks, policy results and approval requirements. Ensure inspection does not execute untrusted build contexts or lifecycle hooks. Record an approval's scoped subject, capability, target, configuration digest, expiry and revocation; enforce it at execution, with no silent degradation. Document exception handling and host security in [docs/SECURITY_ARCHITECTURE.md](docs/SECURITY_ARCHITECTURE.md), [docs/COMPOSE_STUDIO.md](docs/COMPOSE_STUDIO.md) and a new ADR when the enforcement boundary is chosen.
4. **Define durable deployment and provider workflows.** Under proposed `apps/worker/` design idempotent jobs, locks, state reconciliation, cancellation, redacted logs and failure recovery. Under proposed `services/provider-gateway/` design GitHub and Forgejo/Gitea adapters for source acquisition, webhooks and credential lifecycle; provider-specific capabilities and supported versions need verification. Under proposed `agents/build-agent/` and `services/build-coordinator/` design isolated builds only after the trust boundary and BuildKit deployment model are selected. Update [docs/GIT_AND_RUNNERS.md](docs/GIT_AND_RUNNERS.md), [docs/BUILD_FARM.md](docs/BUILD_FARM.md) and [docs/DEPLOYMENTS.md](docs/DEPLOYMENTS.md).
5. **Design the interface and integrations.** Under proposed `apps/panel/` design customer/project selection, source import, Compose editing, deployment progress, customer operations, scoped RBAC and approvals in a small number of coherent flows. The user's forthcoming WebUI instructions will determine layout and interaction. Under proposed provider/integration modules, specify Cloudflare DNS permissions, changes, partial-failure recovery and audit; evaluate Doppler and Infisical secret read/rotation behavior without logging values. Update [docs/PRODUCT.md](docs/PRODUCT.md), [docs/COMPOSE_STUDIO.md](docs/COMPOSE_STUDIO.md) and [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md). Exact integration modules and first-release scope remain open.
6. **Make recovery a production gate.** Define application-consistent backup and restore for supported data, control-plane state, encryption keys and agent identity, including destinations, retention, access scope, restore verification and failure recovery. Set and test scenario-specific recovery objectives and upgrade/rollback behavior before production release. Update [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md), [docs/DEPLOYMENTS.md](docs/DEPLOYMENTS.md) and [docs/ROADMAP.md](docs/ROADMAP.md); choose exact implementation paths after the storage and backup mechanisms are decided.
7. **Build a verification matrix alongside each implementation.** Add tests adjacent to the eventual modules; exact test filenames depend on the chosen stack. Cover cross-customer denial, actor revocation, approval expiry and configuration changes, agent command scope/replay, lack of enforceable resource limits, unsupported Compose options, target loss/reconciliation, provider webhook authentication and duplicates, Cloudflare failure, rootless reboot and ingress, and restore into a clean environment. Test actual isolation against the defined threat model; UI-only tests are insufficient. Measure user task completion once representative workflows and targets are agreed.
8. **Reconcile release documentation.** Update [README.md](README.md), [docs/README.md](docs/README.md), [docs/ROADMAP.md](docs/ROADMAP.md) and affected ADRs only after the relevant decisions are approved. State which scenarios, providers, execution profiles and recovery paths are actually supported, and keep future features explicitly marked as planned. Refresh the Graphify graph after each approved planning change.

### Decisions required before implementation

The exact customer/project isolation unit; trusted versus untrusted workload policy; supported Linux/runtime matrix; VM provisioning ownership and initial backend; authorization roles and defaults; initial Cloudflare/secret-provider scope; migration expectations; recovery objectives; user acceptance measures; and the user's WebUI instructions remain open. Until resolved, no exhaustive file-by-file implementation plan or production security guarantee can be asserted.

## Luna integration — exploratory addition

The owner proposes using **Lunexor Luna** (formerly Lunexor-WHMCS) as a common foundation for hosting management and internal deployment management, including setup, in a Turborepo with Vercel CI. This is a proposed integration direction, not yet a decision to merge repositories, move files, deploy the control plane to Vercel, or make payment features mandatory for homelab users.

### Existing local evidence

The local Luna checkout at `/mnt/win/Repositories/Webapps/Lunexor/lnxr-luna` has the former `lnxr-whmcs` Git remotes. Its `turbo.json` and `pnpm-workspace.yaml` already define a Turborepo/pnpm workspace with `apps/*`, `services/*` and `packages/*`. Its `apps/dashboard/README.md` describes a customer portal and shared UI/auth components; `apps/admin/README.md` describes an administrative interface. `packages/installer/README.md` describes a setup wizard. These are repository documentation and configuration, not proof that every listed feature works or is secure. Existing identity, customer authorization, deployment and installer behavior require code and runtime verification before reuse.

### Design consequences

- Evaluate a Luna-hosted deployment workspace alongside Luna's hosting-management workflows, with a focused operator journey and optional customer access. The placement of deployment functionality in existing apps versus a separate app is open.
- Keep a clear, versioned boundary between user-facing Luna workflows and genposed's durable orchestration, agent commands and isolation policies. Whether this is an internal package or service API is open. Authorization must be enforced at the service/agent boundary as well as in the UI.
- Setup should support both a deployment-focused installation and hosting-management capabilities without requiring unused billing features. The exact packaging and optionality are open design work.
- A common Turborepo can orchestrate builds, tests and CI; using Vercel for CI does not by itself decide where long-running workers, agents, the control plane or tenant workloads run. Self-hosted operation and local agent connectivity remain requirements to validate.
- Audit how Luna's existing customer and tenant models, auth, RBAC, audit, secrets and setup align with the genposed threat model before selecting reuse or migration. Check dependency and licensing compatibility as part of the repository decision.

### Repository relationship — selected direction

1. **Extend Luna's existing Turborepo:** add the genposed UI and execution components there. This reuses the workspace immediately, but requires a clear migration and ownership plan for this repository and its history.
2. **Keep separate repositories:** integrate Luna with genposed through versioned contracts and independent CI. This preserves independent lifecycle and Git history, but requires cross-repository compatibility and a clear setup experience.
3. **Create a new shared Turborepo:** combine selected Luna and genposed components under a new root. This can establish shared tooling and boundaries, but introduces migration, history, CI and maintenance work.

The chosen planning direction is option 2: retain separate repositories and integrate through versioned contracts. Luna retains its existing Turborepo; genposed can use its own workspace as needed. Each product has independent builds, releases and installation. Define compatibility versions, upgrade sequencing and integration tests before implementation. The decision avoids a repository migration while preserving the option of a future shared repository if evidence justifies it.

No files in the Luna repository have been changed for this planning exercise.

### Product independence and Lunexor.de

The owner confirmed that genposed must be independently installable without Luna's hosting and billing functions. Luna is intended for the broader case: operators can install it to manage and sell their services, and it is also intended as the foundation of the owner's Lunexor.de platform. Luna and genposed must also be independently versioned and released. The repositories remain separate; the detailed integration contract remains open.

The installation, identity, service contracts and configuration must allow a deployment-only operator to use genposed without requiring commerce functions. A Luna-enabled installation may expose hosting and sales workflows according to its enabled capabilities and authorization. The design must establish service ownership, tenant identity mapping, trusted callers and permission enforcement before implementation; shared code or a common repository alone does not establish a security boundary.

Both separate repositories with versioned contracts and a shared Turborepo can preserve independent installation and independent releases if packaging, runtime dependencies, versioning and CI release pipelines are designed accordingly. The choice of repository layout must not be confused with the choice of which product features an operator installs.
