# Graph Report - genposed  (2026-11-09)

## Corpus Check
- 49 files · ~23,173 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 3, .css 1)

## Summary
- 944 nodes · 1062 edges · 74 communities (65 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `de2e91e9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Build farm
- Deployment-Strategien
- Architekturentscheidungen
- Git providers and CI runners
- Rootless security boundary
- Compose Studio
- Core specifications and tools
- Architekturentscheidungen
- Produktüberblick
- Systemarchitektur
- Produktmodule
- package.json
- labels
- Spezifikationen und Tools
- Self-Hosting
- Architekturentscheidungen
- api
- labels
- build
- app
- compose-editor.tsx
- low-level-runtime-demo
- deploy
- web
- Contributing to genposed
- userinterface-ci.yml
- postgres
- compose.kitchen-sink.yaml
- compilerOptions
- environment
- volumes
- ports
- gpu-worker
- Rootless-first product hypothesis
- bug_report.md
- Comparable projects
- feature_request.md
- Start here
- PULL_REQUEST_TEMPLATE.md
- labels
- watch
- Rootless-first product brief
- Unreleased
- Code of Conduct
- sync-schemas.mjs
- configs
- Multi-project Compose usability
- documentation.md
- Overview
- Synced schemas
- env_file
- post_start
- AGENTS.md
- annotations
- extra_hosts
- pre_stop
- sysctls
- dependencies
- next
- Multi-tenancy evolution
- Roadmap
- services
- scripts
- update_config
- rollback_config
- worker
- caddy
- restart_policy
- extends
- traefik
- allowBuilds
- engines

## God Nodes (most connected - your core abstractions)
1. `labels` - 50 edges
2. `web` - 48 edges
3. `Deployment strategies` - 28 edges
4. `low-level-runtime-demo` - 27 edges
5. `build` - 23 edges
6. `Compose Studio` - 18 edges
7. `Architecture` - 18 edges
8. `Build farm` - 17 edges
9. `app` - 17 edges
10. `Git providers and CI runners` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Phase 4 — Build farm` --conceptually_related_to--> `Build farm`  [INFERRED]
  docs/ROADMAP.md → docs/BUILD_FARM.md
- `Current repository status` --references--> `Build farm`  [EXTRACTED]
  README.md → docs/BUILD_FARM.md
- `Phase 6 — Progressive and client-aware deployments` --conceptually_related_to--> `Deployment strategies`  [INFERRED]
  docs/ROADMAP.md → docs/DEPLOYMENTS.md
- `Current repository status` --references--> `Deployment strategies`  [EXTRACTED]
  README.md → docs/DEPLOYMENTS.md
- `Current repository status` --references--> `Product scope`  [EXTRACTED]
  README.md → docs/PRODUCT.md

## Import Cycles
- None detected.

## Communities (74 total, 9 thin omitted)

### Community 0 - "Build farm"
Cohesion: 0.07
Nodes (27): Build agent inventory, Build farm, Build request, Build security, Cache, Failure handling, Isolation levels, Level 1: persistent rootless builder per tenant (+19 more)

### Community 1 - "Deployment-Strategien"
Cohesion: 0.08
Nodes (26): A/B Deployment, Active-Active, Blue-Green Deployment, Canary Release, Client-aware web updates, Common gates, Dark Launching, Deployment model (+18 more)

### Community 2 - "Architekturentscheidungen"
Cohesion: 0.07
Nodes (28): 0001 — Separate control plane from execution agents, Alternatives considered, Consequences, Context, Decision, Direct SSH execution, Execute deployments inside Next.js requests, Public Docker API with TLS (+20 more)

### Community 3 - "Git providers and CI runners"
Cohesion: 0.14
Nodes (14): Codeberg, Ephemeral runners, Forgejo, Git providers and CI runners, Gitea, GitHub, GitLab, Monorepo discovery (+6 more)

### Community 4 - "Rootless security boundary"
Cohesion: 0.29
Nodes (10): Privileged exception lifecycle, Authorized shared-host configuration, Customer operations and configurable RBAC, First release customer project separation, GitHub Forgejo and Gitea deployments, Hosting and homelab operators, Isolated privileged exceptions, Optional customer access per customer (+2 more)

### Community 5 - "Compose Studio"
Cohesion: 0.10
Nodes (20): Candidate isolated execution routing, Compose capability contract, Validated deployment flow, Deployment and provider implementation, Compose schema validation, Compose Studio, Document representations, Editor behavior (+12 more)

### Community 6 - "Core specifications and tools"
Cohesion: 0.22
Nodes (9): BuildKit, Caddy, Compose Specification, Core specifications and tools, Docker Buildx, Docker Compose documentation, Docker Engine API, Open Container Initiative (+1 more)

### Community 7 - "Architekturentscheidungen"
Cohesion: 0.24
Nodes (11): Domain and authorization work, Independently installable genposed, Product independence and repository layout, Independent Luna and genposed releases, Luna and genposed service boundary, Existing Luna Turborepo, Luna hosting and sales platform, Lunexor Luna integration proposal (+3 more)

### Community 8 - "Produktüberblick"
Cohesion: 0.12
Nodes (16): Builds and runners, Compose Studio, Contributing, Core principles, Deployment and Docker management, Development, genposed, Git and application discovery (+8 more)

### Community 9 - "Systemarchitektur"
Cohesion: 0.13
Nodes (15): Agent protocol, Agents, Architecture, Build agent capabilities, Compose ownership modes, Control plane, Durable workers, Failure domains (+7 more)

### Community 10 - "Produktmodule"
Cohesion: 0.13
Nodes (15): Build Farm, Client Update Coordinator, Compose Studio, Deployment Engine, Docker Manager, Initial target, Intended users, Major modules (+7 more)

### Community 11 - "package.json"
Cohesion: 0.15
Nodes (16): tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, devDependencies, tailwindcss@^4.1.0, @tailwindcss/postcss@^4.1.0 (+8 more)

### Community 12 - "labels"
Cohesion: 0.07
Nodes (27): labels, command, expose, image, labels, networks, traefik.enable, traefik.http.routers.api.entrypoints (+19 more)

### Community 13 - "Spezifikationen und Tools"
Cohesion: 0.20
Nodes (10): Codeberg CI, Forgejo Actions, Forgejo authorized integrations, Git and runner documentation, Gitea Actions, Gitea OAuth2 provider, GitHub Apps, GitHub self-hosted runners (+2 more)

### Community 14 - "Self-Hosting"
Cohesion: 0.20
Nodes (10): Phase 7 — Operations and integrations, Additional servers, Backups, Initial installation, Installation flow, Network exposure, Recovery, Requirements (+2 more)

### Community 15 - "Architekturentscheidungen"
Cohesion: 0.25
Nodes (8): Customer isolation release gate, Execution profile alternatives, Configurable execution profiles, Customer isolation design question, Incus and Proxmox candidate integrations, Execution isolation alternatives, Execution profile implementation, Shared daemon isolation boundary

### Community 16 - "api"
Cohesion: 0.06
Nodes (35): command, depends_on, environment, expose, image, networks, postgres, redis (+27 more)

### Community 17 - "labels"
Cohesion: 0.05
Nodes (44): caddy.@api.path, caddy.encode, caddy.header.Strict-Transport-Security, caddy.route.0_handle, caddy.route.0_handle.0_uri, caddy.route.0_handle.1_reverse_proxy, caddy.route.1_handle, caddy.route.1_handle.0_reverse_proxy (+36 more)

### Community 18 - "build"
Cohesion: 0.06
Nodes (36): base, ui, build, NEXT_TELEMETRY_DISABLED, NODE_VERSION, additional_contexts, args, cache_from (+28 more)

### Community 19 - "app"
Cohesion: 0.06
Nodes (35): aliases, attachable, driver, driver_opts, enable_ipv4, enable_ipv6, gw_priority, interface_name (+27 more)

### Community 20 - "compose-editor.tsx"
Cohesion: 0.08
Nodes (35): HomePage(), ALL_CATEGORIES, analyzeCompose(), ComposeEditor(), addProject(), addSelectedField(), resetYaml(), saveProjects() (+27 more)

### Community 21 - "low-level-runtime-demo"
Cohesion: 0.06
Nodes (32): device_read_bps, weight, path, rate, blkio_config, cap_add, cap_drop, cgroup (+24 more)

### Community 22 - "deploy"
Cohesion: 0.21
Nodes (12): deploy, endpoint_mode, mode, placement, replicas, constraints, max_replicas_per_node, preferences (+4 more)

### Community 23 - "web"
Cohesion: 0.07
Nodes (28): web, attach, cap_add, cap_drop, command, dns, dns_opt, dns_search (+20 more)

### Community 24 - "Contributing to genposed"
Cohesion: 0.08
Nodes (23): Before contributing, Code guidelines, Commit messages, Contributing to genposed, Development setup, Documentation guidelines, Licensing, Pull requests (+15 more)

### Community 25 - "userinterface-ci.yml"
Cohesion: 0.08
Nodes (25): concurrency, cancel-in-progress, group, run, jobs, verify, name, on (+17 more)

### Community 26 - "postgres"
Cohesion: 0.11
Nodes (23): POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, interval, retries, start_interval, start_period, test (+15 more)

### Community 27 - "compose.kitchen-sink.yaml"
Cohesion: 0.10
Nodes (21): include, env_file, path, project_directory, driver, options, name, max-file (+13 more)

### Community 28 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 29 - "environment"
Cohesion: 0.20
Nodes (10): environment, CADDY_DOCKER_EVENT_THROTTLE_INTERVAL, CADDY_DOCKER_LABEL_PREFIX, CADDY_DOCKER_MODE, CADDY_DOCKER_POLLING_INTERVAL, CADDY_DOCKER_PROCESS_CADDYFILE, CADDY_DOCKER_PROXY_SERVICE_TASKS, CADDY_DOCKER_SCAN_STOPPED_CONTAINERS (+2 more)

### Community 30 - "volumes"
Cohesion: 0.14
Nodes (14): create_host_path, propagation, mode, size, nocopy, subpath, bind, read_only (+6 more)

### Community 31 - "ports"
Cohesion: 0.31
Nodes (9): app_protocol, host_ip, mode, name, protocol, published, target, ports (+1 more)

### Community 32 - "gpu-worker"
Cohesion: 0.12
Nodes (17): resources, command, deploy, gpus, image, profiles, runtime, cpus (+9 more)

### Community 33 - "Rootless-first product hypothesis"
Cohesion: 0.22
Nodes (9): Production recovery release gate, Recovery and release verification, Production recovery gate, Coolify replacement scope, Rootless bootstrap and ownership, Rootless capability detection, Rootless-first product hypothesis, Rootless public ingress (+1 more)

### Community 34 - "bug_report.md"
Cohesion: 0.22
Nodes (8): Actual behavior, Branch or commit, Environment, Expected behavior, Logs or screenshots, Security impact, Steps to reproduce, Summary

### Community 35 - "Comparable projects"
Cohesion: 0.25
Nodes (8): CapRover, Comparable projects, Coolify, Dockge, Dokploy, dyrector.io, Komodo, Portainer

### Community 36 - "feature_request.md"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Alternatives, Documentation impact, Problem, Proposed behavior, Safety and compatibility, Scope

### Community 37 - "Start here"
Cohesion: 0.29
Nodes (7): Documentation status, genposed documentation, Start here, Writing guidelines, License note, Public references, Current repository status

### Community 38 - "PULL_REQUEST_TEMPLATE.md"
Cohesion: 0.29
Nodes (6): Documentation, Problem, Screenshots, Security and operations, Solution, Validation

### Community 39 - "labels"
Cohesion: 0.29
Nodes (7): labels, caddy, caddy_ingress_network, caddy.reverse_proxy, traefik.http.routers.web.rule, traefik.http.services.web.loadbalancer.server.port, traefik.swarm.network

### Community 40 - "watch"
Cohesion: 0.29
Nodes (7): watch, action, ignore, initial_sync, path, target, develop

### Community 41 - "Rootless-first product brief"
Cohesion: 0.33
Nodes (6): Rootless-first product brief, Design goals and boundaries, Implementation planning breakdown, Rootless-first design overview, Technical plan draft, Goldfish brainstorm review

### Community 42 - "Unreleased"
Cohesion: 0.33
Nodes (5): Added, Changed, Changelog, Security, Unreleased

### Community 43 - "Code of Conduct"
Cohesion: 0.33
Nodes (5): Attribution, Code of Conduct, Enforcement, Our standard, Scope

### Community 44 - "sync-schemas.mjs"
Cohesion: 0.18
Nodes (6): typescript, typescript@^5.9.3, docsDirectory, manifest, schemaDirectory, sources

### Community 45 - "configs"
Cohesion: 0.33
Nodes (6): gid, mode, source, target, uid, configs

### Community 46 - "Multi-project Compose usability"
Cohesion: 0.40
Nodes (5): WebUI and integration planning, Automation and low maintenance, Cloudflare Doppler and Infisical integrations, Cloudflare DNS automation, Multi-project Compose usability

### Community 47 - "documentation.md"
Cohesion: 0.40
Nodes (4): Document, Implementation status, Problem, Proposed correction

### Community 48 - "Overview"
Cohesion: 0.27
Nodes (14): Build agent pool, Control-plane API, Deployment worker, Docker Compose CLI, Docker Engine, Durable queue, Isolated BuildKit builders, Next.js panel (+6 more)

### Community 49 - "Synced schemas"
Cohesion: 0.40
Nodes (4): Deployment validation, Rules, Sources, Synced schemas

### Community 50 - "env_file"
Cohesion: 0.50
Nodes (4): format, path, required, env_file

### Community 52 - "post_start"
Cohesion: 0.67
Nodes (3): command, user, post_start

### Community 59 - "dependencies"
Cohesion: 0.15
Nodes (13): monaco-editor, @monaco-editor/react, next-themes, radix-ui, react-dom, yaml, dependencies, monaco-editor@^0.52.2 (+5 more)

### Community 60 - "next"
Cohesion: 0.20
Nodes (6): next, react, metadata, nextConfig, next@^16.0.0, react@^19.2.0

### Community 61 - "Multi-tenancy evolution"
Cohesion: 0.22
Nodes (9): Data isolation, Future tenant boundary, Migration plan, Multi-tenancy evolution, Quotas, Runtime isolation, Shared build servers, Starting point (+1 more)

### Community 62 - "Roadmap"
Cohesion: 0.22
Nodes (9): Not scheduled, Phase 0 — Foundation and documentation, Phase 1 — Compose Studio prototype, Phase 2 — Local runtime management, Phase 3 — Git provider hub, Phase 4 — Build farm, Phase 5 — Native runner management, Phase 6 — Progressive and client-aware deployments (+1 more)

### Community 63 - "services"
Cohesion: 0.25
Nodes (8): profiles, provider, tier, type, options, type, services, external-provider-demo

### Community 64 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, schema:sync, start, test, typecheck

### Community 65 - "update_config"
Cohesion: 0.29
Nodes (7): update_config, delay, failure_action, max_failure_ratio, monitor, order, parallelism

### Community 66 - "rollback_config"
Cohesion: 0.33
Nodes (6): rollback_config, delay, failure_action, monitor, order, parallelism

### Community 67 - "worker"
Cohesion: 0.33
Nodes (6): worker, command, exclude_from_hc, image, networks, profiles

### Community 68 - "caddy"
Cohesion: 0.40
Nodes (5): image, networks, ports, volumes, caddy

### Community 69 - "restart_policy"
Cohesion: 0.40
Nodes (5): restart_policy, condition, delay, max_attempts, window

### Community 70 - "extends"
Cohesion: 0.40
Nodes (5): file, service, extends, profiles, inherited-service

### Community 71 - "traefik"
Cohesion: 0.40
Nodes (5): traefik, command, image, networks, volumes

## Knowledge Gaps
- **206 isolated node(s):** `Build agent inventory`, `Build request`, `Build security`, `Cache`, `Failure handling` (+201 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 646 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `web` connect `web` to `pre_stop`, `watch`, `configs`, `api`, `labels`, `build`, `env_file`, `app`, `extra_hosts`, `annotations`, `deploy`, `post_start`, `sysctls`, `postgres`, `compose.kitchen-sink.yaml`, `ports`, `volumes`, `services`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **What connects `Build agent inventory`, `Build request`, `Build security` to the rest of the system?**
  _206 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Build farm` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Why does `services` connect `services` to `gpu-worker`, `worker`, `caddy`, `extends`, `traefik`, `labels`, `api`, `low-level-runtime-demo`, `web`, `postgres`, `compose.kitchen-sink.yaml`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Should `Deployment-Strategien` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Why does `Start here` connect `Start here` to `Build farm`, `Deployment-Strategien`, `Architekturentscheidungen`, `Git providers and CI runners`, `Compose Studio`, `Systemarchitektur`, `Produktmodule`, `Self-Hosting`, `Multi-tenancy evolution`, `Roadmap`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `Architekturentscheidungen` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._

## Handoff-Ergänzung

Der Graph enthält den Handoff und seine verbindlichen Ziele: 100 % Test-Coverage, vollständige Umsetzung und Deduplizierung. Diese Ziele sind offen und nicht als erreicht bestätigt. Acht semantische Knoten wurden quellengestützt ergänzt; Community-Zuordnung wurde übernommen und nicht neu berechnet.
