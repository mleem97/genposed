# Graph Report - genposed  (2026-11-10)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1340 nodes · 2077 edges · 105 communities (96 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `de2e91e9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- scripts/setup-operator.ts
- Deployment-Strategien
- Architekturentscheidungen
- compose-file-workspace.ts
- compose-document.ts
- Compose Studio
- package.json
- Architekturentscheidungen
- Produktüberblick
- Systemarchitektur
- Produktmodule
- vitest
- Contributing to genposed
- Spezifikationen und Tools
- Self-Hosting
- Architekturentscheidungen
- compose-editor.tsx
- postgres
- Compose Studio
- build
- Git and runner documentation
- 0000_majestic_maddog.sql
- compilerOptions
- structured-field-editor.tsx
- app
- genposed
- dependencies
- Architecture
- Product scope
- sync-schemas.mjs
- ServiceManager
- Overview
- Build farm
- Git providers and CI runners
- layout.tsx
- volumes
- Security architecture
- services
- Rootless-first product hypothesis
- deploy
- gpu-worker
- labels
- scripts
- Self-hosting model
- next
- worker
- Customer isolation release gate
- api
- postgres
- environment
- x-service-defaults
- proxy
- project-access.test.ts
- Independent Luna and genposed releases
- Multi-tenancy evolution
- Roadmap
- bug_report.md
- ports
- Comparable projects
- feature_request.md
- yaml-editor.tsx
- config
- environment
- projects.ts
- Start here
- PULL_REQUEST_TEMPLATE.md
- compose.kitchen-sink.yaml
- labels
- update_config
- watch
- migration
- Rootless-first product brief
- Unreleased
- Code of Conduct
- configs
- rollback_config
- Multi-project Compose usability
- documentation.md
- Handoff current status and work
- secrets
- nofile
- caddy
- restart_policy
- labels
- extends
- reservations
- traefik
- x-security-defaults
- Synced schemas
- Production recovery release gate
- Scoped customer authorization
- env_file
- allowBuilds
- sync-schemas.d.mts
- additional_contexts
- args
- post_start
- sample-compose.ts
- AGENTS.md
- pre_stop
- docsDirectory
- schemaDirectory
- sources

## God Nodes (most connected - your core abstractions)
1. `labels` - 50 edges
2. `web` - 48 edges
3. `ComposeEditor()` - 47 edges
4. `vitest` - 34 edges
5. `isRecord()` - 33 edges
6. `Deployment strategies` - 28 edges
7. `low-level-runtime-demo` - 27 edges
8. `build` - 23 edges
9. `ComposeFileWorkspacePanel()` - 21 edges
10. `userFacingErrorMessage()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Current local editor prototype` --conceptually_related_to--> `ComposeEditor()`  [EXTRACTED]
  HANDOFF.md → userinterface/components/compose-editor.tsx
- `Phase 6 — Progressive and client-aware deployments` --conceptually_related_to--> `Deployment strategies`  [INFERRED]
  docs/ROADMAP.md → docs/DEPLOYMENTS.md
- `Current repository status` --references--> `Deployment strategies`  [EXTRACTED]
  README.md → docs/DEPLOYMENTS.md
- `Phase 1 — Compose Studio prototype` --conceptually_related_to--> `Compose Studio`  [INFERRED]
  docs/ROADMAP.md → docs/COMPOSE_STUDIO.md
- `Current repository status` --references--> `Compose Studio`  [EXTRACTED]
  README.md → docs/COMPOSE_STUDIO.md

## Import Cycles
- None detected.

## Communities (105 total, 9 thin omitted)

### Community 0 - "scripts/setup-operator.ts"
Cohesion: 0.07
Nodes (45): better-auth, drizzle-orm, AuthMethod, GET(), handleAuthRequest(), POST(), AuthInstance, AuthEnvironment (+37 more)

### Community 1 - "Deployment-Strategien"
Cohesion: 0.05
Nodes (44): caddy.@api.path, caddy.encode, caddy.header.Strict-Transport-Security, caddy.route.0_handle, caddy.route.0_handle.0_uri, caddy.route.0_handle.1_reverse_proxy, caddy.route.1_handle, caddy.route.1_handle.0_reverse_proxy (+36 more)

### Community 2 - "Architekturentscheidungen"
Cohesion: 0.09
Nodes (29): HomePage(), REPORT_STATUSES, SchemaCompatibilityPanel(), STATUS_LABELS, categoryLabels, composeFields, extensions, f() (+21 more)

### Community 3 - "compose-file-workspace.ts"
Cohesion: 0.16
Nodes (30): ComposeFileWorkspacePanel(), activateFile(), captureCurrentAsBase(), captureCurrentContent(), deleteFile(), importComposeFiles(), saveWorkspace(), updateDisplayName() (+22 more)

### Community 4 - "compose-document.ts"
Cohesion: 0.17
Nodes (29): yaml, ComposeField, applyFieldSample(), assertServiceAvailable(), assertServiceExists(), assertServiceName(), CloneableYamlNode, cloneComposeValue() (+21 more)

### Community 5 - "Compose Studio"
Cohesion: 0.06
Nodes (34): example.com/description, host.docker.internal, web, net.core.somaxconn, annotations, attach, cap_add, cap_drop (+26 more)

### Community 6 - "package.json"
Cohesion: 0.08
Nodes (29): jsdom, tailwindcss, @tailwindcss/postcss, @testing-library/jest-dom, @types/node, @types/react, @types/react-dom, typescript (+21 more)

### Community 7 - "Architekturentscheidungen"
Cohesion: 0.06
Nodes (32): device_read_bps, weight, path, rate, blkio_config, cap_add, cap_drop, cgroup (+24 more)

### Community 8 - "Produktüberblick"
Cohesion: 0.19
Nodes (27): addReference(), assertResourceAvailable(), assertResourceExists(), assertResourceName(), CloneableYamlNode, cloneTopLevelResource(), collectArrayResourceReferences(), collectResourceReferences() (+19 more)

### Community 9 - "Systemarchitektur"
Cohesion: 0.13
Nodes (25): activeComposeContent(), ComposePolicyPanel(), applyFix(), refreshReport(), SEVERITIES, SEVERITY_LABELS, addResult(), analyzeComposePolicies() (+17 more)

### Community 10 - "Produktmodule"
Cohesion: 0.07
Nodes (28): 0001 — Separate control plane from execution agents, Alternatives considered, Consequences, Context, Decision, Direct SSH execution, Execute deployments inside Next.js requests, Public Docker API with TLS (+20 more)

### Community 11 - "vitest"
Cohesion: 0.13
Nodes (16): react, @testing-library/react, @testing-library/user-event, vitest, LoginPage(), authClient, LoginForm(), react@^19.2.0 (+8 more)

### Community 12 - "Contributing to genposed"
Cohesion: 0.08
Nodes (23): Before contributing, Code guidelines, Commit messages, Contributing to genposed, Development setup, Documentation guidelines, Licensing, Pull requests (+15 more)

### Community 13 - "Spezifikationen und Tools"
Cohesion: 0.08
Nodes (26): A/B Deployment, Active-Active, Blue-Green Deployment, Canary Release, Client-aware web updates, Common gates, Dark Launching, Deployment model (+18 more)

### Community 14 - "Self-Hosting"
Cohesion: 0.08
Nodes (25): concurrency, cancel-in-progress, group, run, jobs, verify, name, on (+17 more)

### Community 15 - "Architekturentscheidungen"
Cohesion: 0.16
Nodes (21): Current local editor prototype, analyzeCompose(), ComposeEditor(), addSelectedField(), cloneComposeResource(), cloneComposeService(), commitYaml(), createComposeResource() (+13 more)

### Community 16 - "compose-editor.tsx"
Cohesion: 0.11
Nodes (20): ALL_CATEGORIES, ComposeAnalysis, Diagnostic, DiagnosticTone, EditorMode, EMPTY_RESOURCES, actionLabel(), RESOURCE_BASE_NAMES (+12 more)

### Community 17 - "postgres"
Cohesion: 0.11
Nodes (23): POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, interval, retries, start_interval, start_period, test (+15 more)

### Community 18 - "Compose Studio"
Cohesion: 0.10
Nodes (20): Candidate isolated execution routing, Compose capability contract, Validated deployment flow, Deployment and provider implementation, Compose schema validation, Compose Studio, Document representations, Editor behavior (+12 more)

### Community 19 - "build"
Cohesion: 0.11
Nodes (20): build, cache_from, cache_to, context, dockerfile, entitlements, extra_hosts, isolation (+12 more)

### Community 20 - "Git and runner documentation"
Cohesion: 0.10
Nodes (19): BuildKit, Caddy, Codeberg CI, Compose Specification, Core specifications and tools, Docker Buildx, Docker Compose documentation, Docker Engine API (+11 more)

### Community 21 - "0000_majestic_maddog.sql"
Cohesion: 0.17
Nodes (15): "account", account_user_id_idx, "customer_memberships", customer_memberships_user_id_idx, "customers", "projects", projects_customer_id_idx, projects_customer_name_unique (+7 more)

### Community 22 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 23 - "structured-field-editor.tsx"
Cohesion: 0.24
Nodes (15): ListEditor(), MapEditor(), renameMapKey(), ScalarEditor(), ScalarEditorProps, StructuredFieldEditor(), StructuredFieldEditorProps, ValueNodeEditor() (+7 more)

### Community 24 - "app"
Cohesion: 0.12
Nodes (17): aliases, attachable, driver, driver_opts, enable_ipv4, enable_ipv6, gw_priority, interface_name (+9 more)

### Community 25 - "genposed"
Cohesion: 0.12
Nodes (16): Builds and runners, Compose Studio, Contributing, Core principles, Deployment and Docker management, Development, genposed, Git and application discovery (+8 more)

### Community 26 - "dependencies"
Cohesion: 0.12
Nodes (16): @better-auth/drizzle-adapter, monaco-editor, @next/env, postgres, radix-ui, react-dom, dependencies, better-auth@^1.7.18 (+8 more)

### Community 27 - "Architecture"
Cohesion: 0.13
Nodes (15): Agent protocol, Agents, Architecture, Build agent capabilities, Compose ownership modes, Control plane, Durable workers, Failure domains (+7 more)

### Community 28 - "Product scope"
Cohesion: 0.13
Nodes (15): Build Farm, Client Update Coordinator, Compose Studio, Deployment Engine, Docker Manager, Initial target, Intended users, Major modules (+7 more)

### Community 29 - "sync-schemas.mjs"
Cohesion: 0.32
Nodes (11): buildComposeFieldIndex(), collectNodeTypes(), docsDirectory, fieldEntry(), propertyIndex(), resolveLocalReference(), resolveSchemaNode(), runCli() (+3 more)

### Community 30 - "ServiceManager"
Cohesion: 0.18
Nodes (11): actionLabel(), ServiceAction, ServiceManager(), beginAction(), handleDraftKeyDown(), submitAction(), ServiceManagerProps, SERVICE_NAME_PATTERN (+3 more)

### Community 31 - "Overview"
Cohesion: 0.27
Nodes (14): Build agent pool, Control-plane API, Deployment worker, Docker Compose CLI, Docker Engine, Durable queue, Isolated BuildKit builders, Next.js panel (+6 more)

### Community 32 - "Build farm"
Cohesion: 0.14
Nodes (14): Build agent inventory, Build farm, Build request, Build security, Cache, Failure handling, Isolation levels, Level 1: persistent rootless builder per tenant (+6 more)

### Community 33 - "Git providers and CI runners"
Cohesion: 0.14
Nodes (14): Codeberg, Ephemeral runners, Forgejo, Git providers and CI runners, Gitea, GitHub, GitLab, Monorepo discovery (+6 more)

### Community 34 - "layout.tsx"
Cohesion: 0.16
Nodes (4): @astryxdesign/theme-neutral, metadata, RootLayout(), @astryxdesign/theme-neutral@^0.7.11

### Community 35 - "volumes"
Cohesion: 0.14
Nodes (14): create_host_path, propagation, mode, size, nocopy, subpath, bind, read_only (+6 more)

### Community 36 - "Security architecture"
Cohesion: 0.15
Nodes (13): Agent identity, Audit, Browser update coordinator, Build isolation, Compose policy, Docker access, Secrets, Security architecture (+5 more)

### Community 37 - "services"
Cohesion: 0.15
Nodes (13): command, expose, image, networks, profiles, provider, tier, type (+5 more)

### Community 38 - "Rootless-first product hypothesis"
Cohesion: 0.24
Nodes (12): Privileged exception lifecycle, Authorized shared-host configuration, Coolify replacement scope, First release customer project separation, GitHub Forgejo and Gitea deployments, Hosting and homelab operators, Isolated privileged exceptions, Privileged action approval (+4 more)

### Community 39 - "deploy"
Cohesion: 0.21
Nodes (12): deploy, endpoint_mode, mode, placement, replicas, constraints, max_replicas_per_node, preferences (+4 more)

### Community 40 - "gpu-worker"
Cohesion: 0.17
Nodes (12): resources, command, deploy, gpus, image, profiles, runtime, cpus (+4 more)

### Community 41 - "labels"
Cohesion: 0.17
Nodes (12): traefik.tcp.middlewares.tcp-ipallow.ipallowlist.sourcerange, traefik.tcp.routers.postgres.entrypoints, traefik.tcp.routers.postgres.rule, traefik.tcp.routers.postgres.service, traefik.tcp.routers.postgres.tls, traefik.tcp.routers.postgres.tls.passthrough, traefik.tcp.services.postgres.loadbalancer.server.port, command (+4 more)

### Community 42 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, coverage, db:generate, db:migrate, dev, lint, schema:sync (+4 more)

### Community 43 - "Self-hosting model"
Cohesion: 0.18
Nodes (11): Phase 7 — Operations and integrations, Rootless bootstrap and ownership, Additional servers, Backups, Initial installation, Installation flow, Network exposure, Recovery (+3 more)

### Community 44 - "next"
Cohesion: 0.20
Nodes (6): drizzle-kit, next, { loadEnvConfig }, nextConfig, next@^16.0.0, drizzle-kit@^0.31.11

### Community 45 - "worker"
Cohesion: 0.20
Nodes (11): environment, DATABASE_URL, REDIS_URL, environment, worker, command, environment, exclude_from_hc (+3 more)

### Community 46 - "Customer isolation release gate"
Cohesion: 0.20
Nodes (10): Customer isolation release gate, Execution profile alternatives, Configurable execution profiles, Customer isolation design question, Incus and Proxmox candidate integrations, Execution isolation alternatives, Execution profile implementation, Shared daemon isolation boundary (+2 more)

### Community 47 - "api"
Cohesion: 0.20
Nodes (10): command, expose, image, labels, networks, traefik.http.routers.api.entrypoints, traefik.http.routers.api.rule, traefik.http.routers.api.tls (+2 more)

### Community 48 - "postgres"
Cohesion: 0.22
Nodes (10): depends_on, postgres, redis, depends_on, condition, required, restart, condition (+2 more)

### Community 49 - "environment"
Cohesion: 0.20
Nodes (10): environment, CADDY_DOCKER_EVENT_THROTTLE_INTERVAL, CADDY_DOCKER_LABEL_PREFIX, CADDY_DOCKER_MODE, CADDY_DOCKER_POLLING_INTERVAL, CADDY_DOCKER_PROCESS_CADDYFILE, CADDY_DOCKER_PROXY_SERVICE_TASKS, CADDY_DOCKER_SCAN_STOPPED_CONTAINERS (+2 more)

### Community 50 - "x-service-defaults"
Cohesion: 0.22
Nodes (10): driver, options, max-file, max-size, logging, x-service-defaults, init, logging (+2 more)

### Community 51 - "proxy"
Cohesion: 0.20
Nodes (10): networks, observability, proxy, attachable, driver, aliases, external, name (+2 more)

### Community 52 - "project-access.test.ts"
Cohesion: 0.27
Nodes (8): authorizeProjectAction(), ProjectAccessActor, ProjectPermission, ProjectScope, customer, customerScope, operator, operatorScope

### Community 53 - "Independent Luna and genposed releases"
Cohesion: 0.31
Nodes (9): Independently installable genposed, Product independence and repository layout, Independent Luna and genposed releases, Luna and genposed service boundary, Existing Luna Turborepo, Luna hosting and sales platform, Lunexor Luna integration proposal, Luna repository relationship options (+1 more)

### Community 54 - "Multi-tenancy evolution"
Cohesion: 0.22
Nodes (9): Data isolation, Future tenant boundary, Migration plan, Multi-tenancy evolution, Quotas, Runtime isolation, Shared build servers, Starting point (+1 more)

### Community 55 - "Roadmap"
Cohesion: 0.22
Nodes (9): Not scheduled, Phase 0 — Foundation and documentation, Phase 1 — Compose Studio prototype, Phase 2 — Local runtime management, Phase 3 — Git provider hub, Phase 4 — Build farm, Phase 5 — Native runner management, Phase 6 — Progressive and client-aware deployments (+1 more)

### Community 56 - "bug_report.md"
Cohesion: 0.22
Nodes (8): Actual behavior, Branch or commit, Environment, Expected behavior, Logs or screenshots, Security impact, Steps to reproduce, Summary

### Community 57 - "ports"
Cohesion: 0.31
Nodes (9): app_protocol, host_ip, mode, name, protocol, published, target, ports (+1 more)

### Community 58 - "Comparable projects"
Cohesion: 0.25
Nodes (8): CapRover, Comparable projects, Coolify, Dockge, Dokploy, dyrector.io, Komodo, Portainer

### Community 59 - "feature_request.md"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Alternatives, Documentation impact, Problem, Proposed behavior, Safety and compatibility, Scope

### Community 60 - "yaml-editor.tsx"
Cohesion: 0.25
Nodes (6): @astryxdesign/core, @monaco-editor/react, MonacoEditor, YamlEditorProps, @astryxdesign/core@^0.7.11, @monaco-editor/react@^4.7.0

### Community 61 - "config"
Cohesion: 0.25
Nodes (8): ipam, reserved, aux_addresses, gateway, ip_range, subnet, config, driver

### Community 62 - "environment"
Cohesion: 0.25
Nodes (8): ADMIN_PASSWORD, ADMIN_USER, APP_FQDN, APP_URL, HOSTNAME, NODE_ENV, PORT, environment

### Community 63 - "projects.ts"
Cohesion: 0.32
Nodes (6): LEGACY_KEY, Project, PROJECTS_KEY, ProjectStore, readProjects(), validStore

### Community 64 - "Start here"
Cohesion: 0.29
Nodes (7): Documentation status, genposed documentation, Start here, Writing guidelines, License note, Public references, Current repository status

### Community 65 - "PULL_REQUEST_TEMPLATE.md"
Cohesion: 0.29
Nodes (6): Documentation, Problem, Screenshots, Security and operations, Solution, Validation

### Community 66 - "compose.kitchen-sink.yaml"
Cohesion: 0.29
Nodes (6): include, env_file, path, project_directory, name, version

### Community 67 - "labels"
Cohesion: 0.29
Nodes (7): labels, caddy, caddy_ingress_network, caddy.reverse_proxy, traefik.http.routers.web.rule, traefik.http.services.web.loadbalancer.server.port, traefik.swarm.network

### Community 68 - "update_config"
Cohesion: 0.29
Nodes (7): update_config, delay, failure_action, max_failure_ratio, monitor, order, parallelism

### Community 69 - "watch"
Cohesion: 0.29
Nodes (7): watch, action, ignore, initial_sync, path, target, develop

### Community 70 - "migration"
Cohesion: 0.29
Nodes (7): command, exclude_from_hc, image, networks, profiles, restart, migration

### Community 71 - "Rootless-first product brief"
Cohesion: 0.33
Nodes (6): Rootless-first product brief, Design goals and boundaries, Implementation planning breakdown, Rootless-first design overview, Technical plan draft, Goldfish brainstorm review

### Community 72 - "Unreleased"
Cohesion: 0.33
Nodes (5): Added, Changed, Changelog, Security, Unreleased

### Community 73 - "Code of Conduct"
Cohesion: 0.33
Nodes (5): Attribution, Code of Conduct, Enforcement, Our standard, Scope

### Community 74 - "configs"
Cohesion: 0.33
Nodes (6): gid, mode, source, target, uid, configs

### Community 75 - "rollback_config"
Cohesion: 0.33
Nodes (6): rollback_config, delay, failure_action, monitor, order, parallelism

### Community 76 - "Multi-project Compose usability"
Cohesion: 0.40
Nodes (5): WebUI and integration planning, Automation and low maintenance, Cloudflare Doppler and Infisical integrations, Cloudflare DNS automation, Multi-project Compose usability

### Community 77 - "documentation.md"
Cohesion: 0.40
Nodes (4): Document, Implementation status, Problem, Proposed correction

### Community 78 - "Handoff current status and work"
Cohesion: 0.40
Nodes (5): Mandatory complete functionality, Mandatory 100 percent test coverage, Mandatory deduplication, Handoff current status and work, Outstanding implementation work

### Community 79 - "secrets"
Cohesion: 0.50
Nodes (5): secrets, mode, source, target, secrets

### Community 80 - "nofile"
Cohesion: 0.40
Nodes (5): ulimits, hard, soft, nofile, ulimits

### Community 81 - "caddy"
Cohesion: 0.40
Nodes (5): image, networks, ports, volumes, caddy

### Community 82 - "restart_policy"
Cohesion: 0.40
Nodes (5): restart_policy, condition, delay, max_attempts, window

### Community 83 - "labels"
Cohesion: 0.40
Nodes (5): labels, traefik.enable, traefik.udp.routers.dns.entrypoints, traefik.udp.routers.dns.service, traefik.udp.services.dns.loadbalancer.server.port

### Community 84 - "extends"
Cohesion: 0.40
Nodes (5): file, service, extends, profiles, inherited-service

### Community 85 - "reservations"
Cohesion: 0.40
Nodes (5): cpus, devices, generic_resources, memory, reservations

### Community 86 - "traefik"
Cohesion: 0.40
Nodes (5): traefik, command, image, networks, volumes

### Community 87 - "x-security-defaults"
Cohesion: 0.40
Nodes (5): x-security-defaults, cap_drop, read_only, security_opt, tmpfs

### Community 88 - "Synced schemas"
Cohesion: 0.40
Nodes (4): Deployment validation, Rules, Sources, Synced schemas

### Community 89 - "Production recovery release gate"
Cohesion: 0.50
Nodes (4): Production recovery release gate, Recovery and release verification, Production recovery gate, Rootless recovery and updates

### Community 90 - "Scoped customer authorization"
Cohesion: 0.50
Nodes (4): Domain and authorization work, Scoped customer authorization, Customer operations and configurable RBAC, Optional customer access per customer

### Community 91 - "env_file"
Cohesion: 0.50
Nodes (4): format, path, required, env_file

### Community 93 - "allowBuilds"
Cohesion: 0.50
Nodes (3): allowBuilds, @astryxdesign/core, esbuild

### Community 95 - "additional_contexts"
Cohesion: 0.67
Nodes (3): base, ui, additional_contexts

### Community 96 - "args"
Cohesion: 0.67
Nodes (3): NEXT_TELEMETRY_DISABLED, NODE_VERSION, args

### Community 97 - "post_start"
Cohesion: 0.67
Nodes (3): command, user, post_start

## Knowledge Gaps
- **216 isolated node(s):** `Alternatives considered`, `Consequences`, `Context`, `Decision`, `Direct SSH execution` (+211 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 748 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `web` connect `Compose Studio` to `Deployment-Strategien`, `post_start`, `volumes`, `pre_stop`, `services`, `watch`, `deploy`, `configs`, `secrets`, `postgres`, `postgres`, `x-service-defaults`, `build`, `proxy`, `nofile`, `ports`, `env_file`, `environment`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **What connects `Alternatives considered`, `Consequences`, `Context` to the rest of the system?**
  _216 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `scripts/setup-operator.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06504494976203067 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `scripts/setup-operator.ts`, `Architekturentscheidungen`, `compose-file-workspace.ts`, `compose-document.ts`, `layout.tsx`, `package.json`, `sample-compose.ts`, `Produktüberblick`, `Systemarchitektur`, `next`, `Architekturentscheidungen`, `project-access.test.ts`, `structured-field-editor.tsx`, `sync-schemas.mjs`, `projects.ts`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `Deployment-Strategien` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Why does `services` connect `services` to `compose.kitchen-sink.yaml`, `Compose Studio`, `migration`, `Architekturentscheidungen`, `gpu-worker`, `labels`, `worker`, `api`, `caddy`, `postgres`, `extends`, `traefik`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `Architekturentscheidungen` be split into smaller, more focused modules?**
  _Cohesion score 0.09246088193456614 - nodes in this community are weakly interconnected._