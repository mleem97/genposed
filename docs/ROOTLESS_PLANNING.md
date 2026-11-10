# Rootless-first product planning

**Status: exploratory working hypothesis.** This document identifies decisions to resolve with the project owner; it does not supersede accepted ADRs or promise implementation.

## Product hypothesis

genposed should let a small team replace its Coolify installation with a self-hosted, Compose-compatible control plane whose normal installation, build and application runtime prefer unprivileged operation. Keep the existing single-workspace starting point, portable Compose model, outbound agents, and separation between the control plane and execution.

The owner prioritizes UX and usability above all: operators need a low barrier to entry, straightforward deployment without navigating many separate pages, multiple projects, and effective access to everything they can express in Compose. Rootless operation is the preferred case wherever possible. When a capability cannot run rootless, the owner requires a separately isolated and secured solution; security takes priority. The isolation mechanism and acceptance criteria remain open. Automation and low maintenance are priorities: minimize routine user work while making important status and decisions understandable. Integrations of interest include Cloudflare, Doppler and Infisical. Cloudflare should automate DNS and other useful functions; certificate management and tunnels are candidates to evaluate, not agreed requirements. The precise launch scope remains open. The rest of the replacement boundary and first release are not yet agreed. The existing repository describes a broad eventual product and is not evidence that these features exist today.

## Intended operators

The owner identifies infrastructure providers such as web hosts, their customers, and individuals operating homelabs as potential users. Authorized operators must be able to configure whether customers can execute their own Compose projects on shared servers. For a customer request requiring elevated privileges or host access, approval should be possible through support or an administrator, or through instance configuration. The exact authorization model, isolation guarantees, scope and permitted configurations remain to be defined. These groups have different operating and trust boundaries; supporting them does not establish a release order or guarantee multi-tenant isolation. The first usable version must distinguish the owner’s own projects from projects for their customers, all maintained by the owner. The operator decides per customer whether that customer receives access to the interface; projects can also remain operator-managed. The existing single-workspace-first roadmap therefore needs revision; customers should be able to perform simple operations such as start, stop and restart when authorized. More advanced access is controlled through configurable role-based access control (RBAC); exact roles, default permissions and security isolation remain open. GitHub and Forgejo/Gitea deployments are required.

## Existing decisions and gaps

- [ADR 0001](ADR/0001-control-plane-and-agents.md) separates the control plane from runtime and build agents; it does not require the runtime agent or Docker daemon to be rootless.
- [ADR 0003](ADR/0003-builder-isolation.md) prefers rootless builders and explicitly states that rootless isolation is not equivalent to a VM boundary.
- [Self-hosting](SELF_HOSTING.md) assumes Docker and Compose but does not define user identity, bootstrap privileges, daemon selection, reboot persistence, or exposure of ports 80 and 443.
- [Roadmap](ROADMAP.md) schedules volume backup and restore in phase 7, after the phase 2 production-environment criterion. A replacement scope needs an explicit recovery requirement before its first production release.
- [Coolify's service model](https://coolify.io/docs/services) supports Compose stacks and templates; its [database documentation](https://coolify.io/docs/databases/) describes engine-dependent scheduled backup and restore. Which of these workflows are required for replacement remains open.

## Rootless constraints to validate

1. **Bootstrap and ownership.** Define the supported Linux distributions, user account, daemon and agent identity, prerequisites, unattended restart and what, if anything, requires an administrator. Rootless Docker needs subordinate UID/GID ranges and supporting host tools; enabling user-service lingering can require administrator privileges. See [Docker rootless mode](https://docs.docker.com/engine/security/rootless/) and [rootless tips](https://docs.docker.com/engine/security/rootless/tips/).
2. **Public ingress.** Decide how HTTP and HTTPS reach a rootless proxy on ports 80 and 443. Docker documents privileged-port configuration options that involve host administration. Record any privileged setup separately from the long-running services, and test client IP handling and certificate renewal. See [Docker rootless tips](https://docs.docker.com/engine/security/rootless/tips/) and [known limitations](https://docs.docker.com/engine/security/rootless/troubleshoot/).
3. **Capability detection.** Detect the actual daemon, socket owner, user namespace, storage, network, cgroup version and delegated controllers. Refuse or clearly report unavailable guarantees: Docker notes that resource limits depend on cgroup v2, systemd and controller delegation. Do not silently fall back to a rootful daemon. See [Docker rootless tips](https://docs.docker.com/engine/security/rootless/tips/).
4. **Security boundary.** A rootless daemon socket still grants control over the daemon owner's workloads and files accessible to that account. Avoid mounting it into untrusted applications; scope agent access, secrets and audit records. Rootless operation is risk reduction, not isolation of mutually hostile tenants.
5. **Compose compatibility.** Validate the selected Compose file on the target runtime and explain unsupported fields before deployment. Host networking, privileged features, bind-mount ownership, devices and networking can differ by runtime and version; never claim universal compatibility.
6. **Recovery and updates.** Define and test backup and restoration of application data, control-plane data, encryption keys and agent identity, as well as upgrades and rollback. Persistent volumes alone are not backups.

## Decisions to resolve

- What concrete workflows, applications and migration paths beyond multi-project Compose deployment define a successful first replacement?
- Which RBAC roles and default permissions govern basic operations, advanced actions, support and administration?
- What isolation and security guarantees must privileged exceptions meet, and which host-level privileges are acceptable?
- Which operating systems, architectures, installation environments and external dependencies are in the first support matrix?
- Which services, database engines, backup destinations and recovery objectives are required before production use?
- Which Git providers, build methods, proxy features and deployment strategies are required at launch, and which can follow later?
- What user-visible behavior is required when a Compose file or host cannot satisfy rootless constraints?

After these boundaries are agreed, use fresh-context Goldfish reviews to challenge the resulting design and update the affected ADRs, roadmap and Graphify graph.
