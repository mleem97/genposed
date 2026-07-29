export type FieldCategory = "compose" | "build" | "runtime" | "networking" | "storage" | "security" | "health" | "swarm" | "traefik" | "caddy" | "coolify" | "framework";
export type FieldTarget = "top-level" | "service" | "service-labels" | "deploy-labels";

export interface ComposeField {
  id: string;
  category: FieldCategory;
  group: string;
  title: string;
  target: FieldTarget;
  path: string[];
  sample: unknown;
  description: string;
  compatibility?: string;
  keywords?: string[];
}

export const categoryLabels: Record<FieldCategory, string> = {
  compose: "Compose", build: "Build", runtime: "Runtime", networking: "Netzwerk",
  storage: "Storage", security: "Security", health: "Health", swarm: "Swarm",
  traefik: "Traefik", caddy: "Caddy", coolify: "Coolify", framework: "Frameworks",
};

const f = (id: string, category: FieldCategory, group: string, title: string, path: string[], sample: unknown, description: string, compatibility?: string, target: FieldTarget = "service"): ComposeField => ({ id, category, group, title, target, path, sample, description, compatibility });
const top = (id: string, title: string, sample: unknown, description: string, compatibility?: string) => f(id, "compose", "Projekt", title, id.split(".").slice(1), sample, description, compatibility, "top-level");
const labels = (id: string, category: FieldCategory, group: string, title: string, sample: Record<string, unknown>, description: string, swarm = false) => f(id, category, group, title, [], sample, description, undefined, swarm ? "deploy-labels" : "service-labels");

const standard: ComposeField[] = [
  top("top.name", "Projektname", "genposed-demo", "Expliziter Compose-Projektname."),
  top("top.version", "Legacy-Version", "3.9", "Nur für Rückwärtskompatibilität; moderne Compose-Versionen ignorieren das Feld.", "deprecated"),
  top("top.include", "Include", [{ path: "./compose.observability.yaml", project_directory: ".", env_file: ".env" }], "Bindet weitere Compose-Anwendungsmodelle ein.", "Compose 2.20+"),
  top("top.x-service-defaults", "x-Extension", { restart: "unless-stopped", init: true }, "Freie Erweiterung für Anker und externes Tooling."),
  f("service.image", "runtime", "Image", "Image", ["image"], "ghcr.io/example/app:latest", "OCI-Image des Services."),
  f("service.pull_policy", "runtime", "Image", "Pull Policy", ["pull_policy"], "missing", "Image-Pull-Verhalten."),
  f("service.platform", "runtime", "Image", "Platform", ["platform"], "linux/amd64", "Zielplattform des Containers."),
  f("service.command", "runtime", "Prozess", "Command", ["command"], ["node", "server.js"], "Überschreibt das Image-CMD."),
  f("service.entrypoint", "runtime", "Prozess", "Entrypoint", ["entrypoint"], ["/usr/bin/tini", "--"], "Überschreibt den Image-Entrypoint."),
  f("service.working_dir", "runtime", "Prozess", "Working directory", ["working_dir"], "/app", "Arbeitsverzeichnis im Container."),
  f("service.init", "runtime", "Prozess", "Init", ["init"], true, "Kleiner PID-1-Init-Prozess."),
  f("service.tty", "runtime", "Interaktiv", "TTY", ["tty"], true, "Pseudo-TTY allokieren."),
  f("service.stdin_open", "runtime", "Interaktiv", "STDIN offen", ["stdin_open"], true, "STDIN offen halten."),
  f("service.attach", "runtime", "Ausgabe", "Attach", ["attach"], false, "Automatisches Anhängen an Service-Ausgabe."),
  f("service.container_name", "runtime", "Identität", "Containername", ["container_name"], "genposed-app", "Fester Name; verhindert horizontale Skalierung."),
  f("service.hostname", "networking", "DNS", "Hostname", ["hostname"], "app", "Container-Hostname."),
  f("service.domainname", "networking", "DNS", "Domainname", ["domainname"], "internal.example", "NIS-Domainname."),
  f("service.user", "security", "Identität", "User", ["user"], "1000:1000", "UID/GID oder Nutzername."),
  f("service.group_add", "security", "Identität", "Zusatzgruppen", ["group_add"], ["docker", "1001"], "Zusätzliche Gruppen."),
  f("service.restart", "runtime", "Lifecycle", "Restart", ["restart"], "unless-stopped", "Lokale Restart-Policy."),
  f("service.stop_signal", "runtime", "Lifecycle", "Stop Signal", ["stop_signal"], "SIGTERM", "Signal zum Beenden."),
  f("service.stop_grace_period", "runtime", "Lifecycle", "Stop Grace Period", ["stop_grace_period"], "30s", "Wartezeit vor SIGKILL."),
  f("service.post_start", "runtime", "Lifecycle", "Post-start Hook", ["post_start"], [{ command: ["/bin/sh", "-lc", "echo started"], user: "root" }], "Hook nach Containerstart.", "neuere Compose-Versionen"),
  f("service.pre_stop", "runtime", "Lifecycle", "Pre-stop Hook", ["pre_stop"], [{ command: ["/bin/sh", "-lc", "echo stopping"] }], "Hook vor dem Stoppen.", "neuere Compose-Versionen"),
  f("service.environment", "runtime", "Umgebung", "Environment", ["environment"], { NODE_ENV: "production", LOG_LEVEL: "info" }, "Umgebungsvariablen als Mapping."),
  f("service.env_file", "runtime", "Umgebung", "Env files", ["env_file"], [{ path: ".env", required: false }, { path: ".env.production", required: true, format: "raw" }], "Environment-Dateien in Langsyntax."),
  f("service.labels", "runtime", "Metadaten", "Labels", ["labels"], { "com.example.owner": "platform" }, "Containerlabels."),
  f("service.label_file", "runtime", "Metadaten", "Label files", ["label_file"], ["./labels/common.labels"], "Labels aus Dateien.", "Compose 2.32+"),
  f("service.annotations", "runtime", "Metadaten", "Annotations", ["annotations"], { "example.com/description": "Genposed" }, "Plattformneutrale Service-Anmerkungen."),
  f("service.profiles", "compose", "Profile", "Profiles", ["profiles"], ["production", "edge"], "Service nur für ausgewählte Profile."),
  f("service.depends_on", "compose", "Abhängigkeiten", "Depends on", ["depends_on"], { postgres: { condition: "service_healthy", restart: true, required: true } }, "Abhängigkeiten mit Condition, Restart und Required."),
  f("service.extends", "compose", "Wiederverwendung", "Extends", ["extends"], { file: "./compose.base.yaml", service: "app-base" }, "Erweitert einen Service."),
  f("service.provider", "compose", "Provider", "Provider Service", ["provider"], { type: "awesomecloud", options: { type: "mysql", tier: "premium" } }, "Externer Lifecycle-Provider.", "Compose provider extension"),

  f("build.context", "build", "Kontext", "Build context", ["build", "context"], ".", "Build-Kontext als Pfad oder URL."),
  f("build.dockerfile", "build", "Kontext", "Dockerfile", ["build", "dockerfile"], "Dockerfile", "Dockerfile-Pfad."),
  f("build.dockerfile_inline", "build", "Kontext", "Inline Dockerfile", ["build", "dockerfile_inline"], "FROM node:22-alpine\nWORKDIR /app", "Dockerfile direkt im Compose-Dokument."),
  f("build.args", "build", "Parameter", "Build args", ["build", "args"], { NODE_VERSION: "22" }, "Build-Time-Argumente."),
  f("build.additional_contexts", "build", "Kontext", "Additional contexts", ["build", "additional_contexts"], { assets: "./assets", base: "docker-image://node:22-alpine" }, "Zusätzliche Build-Kontexte."),
  f("build.target", "build", "Output", "Build target", ["build", "target"], "runner", "Zielstage eines Multi-Stage-Builds."),
  f("build.platforms", "build", "Output", "Platforms", ["build", "platforms"], ["linux/amd64", "linux/arm64"], "Multi-Platform-Buildziele."),
  f("build.tags", "build", "Output", "Tags", ["build", "tags"], ["ghcr.io/example/app:latest"], "Zusätzliche Image-Tags."),
  f("build.cache_from", "build", "Cache", "Cache from", ["build", "cache_from"], ["type=registry,ref=ghcr.io/example/app:cache"], "BuildKit-Cachequellen."),
  f("build.cache_to", "build", "Cache", "Cache to", ["build", "cache_to"], ["type=registry,ref=ghcr.io/example/app:cache,mode=max"], "BuildKit-Cacheziele."),
  f("build.no_cache", "build", "Policy", "No cache", ["build", "no_cache"], false, "Build ohne Cache."),
  f("build.no_cache_filter", "build", "Policy", "No-cache filter", ["build", "no_cache_filter"], ["deps"], "Cache für ausgewählte Stages deaktivieren."),
  f("build.pull", "build", "Policy", "Pull", ["build", "pull"], true, "Basisimages aktualisieren."),
  f("build.privileged", "build", "Security", "Privileged build", ["build", "privileged"], false, "Privilegierter Build."),
  f("build.provenance", "build", "Supply chain", "Provenance", ["build", "provenance"], "mode=max", "Provenance-Attestierung."),
  f("build.sbom", "build", "Supply chain", "SBOM", ["build", "sbom"], true, "SBOM-Attestierung."),
  f("build.secrets", "build", "Security", "Build secrets", ["build", "secrets"], [{ source: "npm_token", target: "npm_token" }], "Secrets nur während des Builds."),
  f("build.ssh", "build", "Security", "SSH forwarding", ["build", "ssh"], ["default"], "SSH-Agent für BuildKit."),
  f("build.entitlements", "build", "Security", "Entitlements", ["build", "entitlements"], ["network.host"], "BuildKit-Entitlements."),
  f("build.network", "build", "Runtime", "Build network", ["build", "network"], "host", "Netzwerkmodus während des Builds."),
  f("build.extra_hosts", "build", "Runtime", "Build extra hosts", ["build", "extra_hosts"], ["host.docker.internal=host-gateway"], "Hosteinträge im Buildcontainer."),
  f("build.shm_size", "build", "Runtime", "Build shm_size", ["build", "shm_size"], "1g", "Shared Memory des Buildcontainers."),
  f("build.ulimits", "build", "Runtime", "Build ulimits", ["build", "ulimits"], { nofile: { soft: 1024, hard: 2048 } }, "Ulimits während des Builds."),

  f("network.ports", "networking", "Ports", "Ports Langsyntax", ["ports"], [{ name: "http", target: 3000, published: "8080", host_ip: "0.0.0.0", protocol: "tcp", app_protocol: "http", mode: "host" }], "Port-Publishing mit allen Langsyntaxfeldern."),
  f("network.expose", "networking", "Ports", "Expose", ["expose"], ["3000", "9090/udp"], "Interne Ports dokumentieren."),
  f("network.networks", "networking", "Netzwerke", "Networks Langsyntax", ["networks"], { frontend: { aliases: ["web"], ipv4_address: "172.28.0.10", interface_name: "eth0", gw_priority: 100, priority: 1000 } }, "Netzwerkzuordnung mit IP, Alias und Priorität."),
  f("network.network_mode", "networking", "Netzwerke", "Network mode", ["network_mode"], "service:gateway", "Host-, none-, service:- oder container:-Modus."),
  f("network.dns", "networking", "DNS", "DNS", ["dns"], ["1.1.1.1", "8.8.8.8"], "Benutzerdefinierte Resolver."),
  f("network.dns_search", "networking", "DNS", "DNS search", ["dns_search"], ["internal.example"], "DNS-Suchdomänen."),
  f("network.dns_opt", "networking", "DNS", "DNS options", ["dns_opt"], ["use-vc"], "Resolver-Optionen."),
  f("network.extra_hosts", "networking", "DNS", "Extra hosts", ["extra_hosts"], { "host.docker.internal": "host-gateway" }, "Zusätzliche /etc/hosts-Einträge."),
  f("network.mac_address", "networking", "Link", "MAC address", ["mac_address"], "02:42:ac:1c:00:0a", "Benutzerdefinierte MAC-Adresse."),
  f("network.links", "networking", "Legacy", "Links", ["links"], ["postgres:db"], "Legacy-Service-Links.", "legacy"),
  f("network.external_links", "networking", "Legacy", "External links", ["external_links"], ["legacy-db:db"], "Links zu externen Containern.", "legacy"),

  f("storage.volumes", "storage", "Mounts", "Volumes Langsyntax", ["volumes"], [{ type: "volume", source: "app-data", target: "/app/data", volume: { nocopy: true, subpath: "tenant-a" } }, { type: "bind", source: "./config", target: "/app/config", read_only: true, bind: { create_host_path: true, propagation: "rprivate" } }, { type: "tmpfs", target: "/tmp", tmpfs: { size: 67108864, mode: 1777 } }], "Volume-, Bind-, Tmpfs- und Image-Mounts."),
  f("storage.tmpfs", "storage", "Mounts", "Tmpfs", ["tmpfs"], ["/run:size=64m,mode=1777"], "Temporäres In-Memory-Dateisystem."),
  f("storage.configs", "storage", "Configs", "Configs", ["configs"], [{ source: "app_config", target: "/app/config.yaml", uid: "1000", gid: "1000", mode: 292 }], "Deklarative Konfigurationen mounten."),
  f("storage.secrets", "storage", "Secrets", "Secrets", ["secrets"], [{ source: "db_password", target: "db_password", uid: "1000", gid: "1000", mode: 256 }], "Secrets mit Dateirechten mounten."),
  f("storage.volumes_from", "storage", "Legacy", "Volumes from", ["volumes_from"], ["backup:ro"], "Mounts eines anderen Containers übernehmen.", "legacy"),
  f("storage.storage_opt", "storage", "Treiber", "Storage opts", ["storage_opt"], { size: "1G" }, "Container-Storage-Treiberoptionen."),

  f("health.healthcheck", "health", "Healthcheck", "Healthcheck", ["healthcheck"], { test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/health || exit 1"], interval: "30s", timeout: "5s", retries: 5, start_period: "20s", start_interval: "2s" }, "Healthcheck mit Startintervall."),
  f("health.disable", "health", "Healthcheck", "Healthcheck deaktivieren", ["healthcheck"], { disable: true }, "Image-Healthcheck deaktivieren."),
  f("health.logging", "health", "Observability", "Logging", ["logging"], { driver: "json-file", options: { "max-size": "10m", "max-file": "3" } }, "Logging-Treiber und Optionen."),

  f("security.read_only", "security", "Filesystem", "Read-only root", ["read_only"], true, "Root-Dateisystem schreibgeschützt."),
  f("security.privileged", "security", "Privilegien", "Privileged", ["privileged"], false, "Erweiterte Hostrechte."),
  f("security.capabilities", "security", "Privilegien", "Capabilities", [], { cap_drop: ["ALL"], cap_add: ["NET_BIND_SERVICE"] }, "Linux-Capabilities gezielt setzen."),
  f("security.security_opt", "security", "Isolation", "Security options", ["security_opt"], ["no-new-privileges:true", "seccomp=./seccomp.json"], "Seccomp, AppArmor und no-new-privileges."),
  f("security.sysctls", "security", "Kernel", "Sysctls", ["sysctls"], { "net.core.somaxconn": "1024" }, "Namespaced Kernelparameter."),
  f("security.devices", "security", "Devices", "Devices", ["devices"], ["/dev/ttyUSB0:/dev/ttyUSB0:rwm"], "Hostgeräte oder CDI-Devices."),
  f("security.gpus", "security", "Devices", "GPUs", ["gpus"], "all", "GPU-Zugriff in Kurz- oder Langsyntax."),
  f("security.device_rules", "security", "Devices", "Device cgroup rules", ["device_cgroup_rules"], ["c 188:* rmw"], "Cgroup-Gerätezugriffsregeln."),
  f("security.credential_spec", "security", "Windows", "Credential spec", ["credential_spec"], { file: "my-credential-spec.json" }, "Windows gMSA Credential Spec."),
  f("security.namespaces", "security", "Namespaces", "Namespaces", [], { ipc: "private", pid: "host", uts: "host", userns_mode: "host", cgroup: "private", cgroup_parent: "genposed.slice" }, "IPC-, PID-, UTS-, User- und Cgroup-Namespace."),
  f("security.oom", "security", "OOM", "OOM tuning", [], { oom_kill_disable: false, oom_score_adj: -500 }, "OOM-Killer und Priorität."),
  f("security.ulimits", "security", "Limits", "Ulimits", ["ulimits"], { nofile: { soft: 65536, hard: 65536 }, nproc: 4096 }, "POSIX-Ressourcenlimits."),

  f("runtime.cpu", "runtime", "Ressourcen", "CPU-Limits", [], { cpus: "1.50", cpu_count: 2, cpu_percent: 50, cpu_shares: 1024, cpu_period: 100000, cpu_quota: 150000, cpu_rt_period: 1000000, cpu_rt_runtime: 950000, cpuset: "0-2" }, "CPU-Begrenzungen und Scheduling-Parameter."),
  f("runtime.memory", "runtime", "Ressourcen", "Memory-Limits", [], { mem_limit: "1g", mem_reservation: "256m", memswap_limit: "2g", mem_swappiness: 20, shm_size: "128m" }, "Speicher-, Swap- und Shared-Memory-Limits."),
  f("runtime.pids", "runtime", "Ressourcen", "PIDs limit", ["pids_limit"], 256, "Maximale Prozessanzahl."),
  f("runtime.blkio", "runtime", "Ressourcen", "Block IO", ["blkio_config"], { weight: 500, device_read_bps: [{ path: "/dev/sda", rate: "12mb" }], device_write_iops: [{ path: "/dev/sda", rate: 120 }] }, "Block-I/O-Gewichtung und Gerätegrenzen."),
  f("runtime.scale", "runtime", "Skalierung", "Scale", ["scale"], 2, "Lokale Instanzanzahl."),
  f("runtime.runtime", "runtime", "Runtime", "OCI runtime", ["runtime"], "runc", "Explizite OCI-Runtime."),
  f("runtime.isolation", "runtime", "Runtime", "Isolation", ["isolation"], "default", "Plattformspezifischer Isolation-Modus."),
  f("develop.watch", "framework", "Development", "Compose Watch", ["develop", "watch"], [{ action: "sync", path: "./src", target: "/app/src", ignore: ["node_modules/"], initial_sync: true }, { action: "rebuild", path: "package.json" }, { action: "restart", path: ".env" }], "Sync-, Restart- und Rebuild-Aktionen."),

  f("swarm.mode", "swarm", "Skalierung", "Deploy mode", ["deploy", "mode"], "replicated", "replicated, global, replicated-job oder global-job."),
  f("swarm.replicas", "swarm", "Skalierung", "Replicas", ["deploy", "replicas"], 3, "Anzahl der Swarm-Tasks."),
  f("swarm.endpoint_mode", "swarm", "Netzwerk", "Endpoint mode", ["deploy", "endpoint_mode"], "vip", "VIP oder DNSRR."),
  f("swarm.placement", "swarm", "Placement", "Placement", ["deploy", "placement"], { constraints: ["node.role == worker", "node.labels.region == eu-central"], preferences: [{ spread: "node.labels.zone" }], max_replicas_per_node: 2 }, "Constraints, Spread und Replikate pro Node."),
  f("swarm.update", "swarm", "Rollout", "Update config", ["deploy", "update_config"], { parallelism: 2, delay: "10s", monitor: "30s", max_failure_ratio: 0.2, failure_action: "rollback", order: "start-first" }, "Rolling-Update-Verhalten."),
  f("swarm.rollback", "swarm", "Rollout", "Rollback config", ["deploy", "rollback_config"], { parallelism: 1, delay: "5s", monitor: "20s", max_failure_ratio: 0.1, failure_action: "pause", order: "stop-first" }, "Rollback-Verhalten."),
  f("swarm.restart", "swarm", "Lifecycle", "Restart policy", ["deploy", "restart_policy"], { condition: "on-failure", delay: "5s", max_attempts: 3, window: "2m" }, "Swarm-Restart-Policy."),
  f("swarm.resources", "swarm", "Ressourcen", "Deploy resources", ["deploy", "resources"], { limits: { cpus: "2.0", memory: "2g", pids: 512 }, reservations: { cpus: "0.5", memory: "256m", generic_resources: [{ discrete_resource_spec: { kind: "GPU", value: 1 } }], devices: [{ capabilities: ["gpu"], driver: "nvidia", count: 1 }] } }, "Limits, Reservierungen, GPUs und Generic Resources."),
  labels("swarm.labels", "swarm", "Metadaten", "Deploy labels", { "com.example.stack": "genposed", "prometheus.scrape": "true" }, "Labels auf Swarm-Serviceebene.", true),
];

const extensions: ComposeField[] = [
  labels("traefik.enable", "traefik", "Discovery", "Traefik aktivieren", { "traefik.enable": "true", "traefik.docker.network": "proxy" }, "Docker-Discovery und Proxy-Netzwerk."),
  labels("traefik.http.router", "traefik", "HTTP Router", "HTTP Router", { "traefik.http.routers.app.rule": "Host(`app.example.com`) && PathPrefix(`/`)", "traefik.http.routers.app.entrypoints": "websecure", "traefik.http.routers.app.service": "app", "traefik.http.routers.app.priority": "100", "traefik.http.routers.app.middlewares": "secure-headers@docker,compress@docker", "traefik.http.routers.app.tls": "true", "traefik.http.routers.app.tls.certresolver": "letsencrypt", "traefik.http.routers.app.tls.domains[0].main": "example.com", "traefik.http.routers.app.tls.domains[0].sans": "*.example.com", "traefik.http.routers.app.observability.accesslogs": "true", "traefik.http.routers.app.observability.metrics": "true", "traefik.http.routers.app.observability.tracing": "true" }, "Rule, EntryPoints, TLS, Middleware und Observability."),
  labels("traefik.http.service", "traefik", "HTTP Service", "HTTP Load Balancer", { "traefik.http.services.app.loadbalancer.server.port": "3000", "traefik.http.services.app.loadbalancer.server.scheme": "http", "traefik.http.services.app.loadbalancer.passhostheader": "true", "traefik.http.services.app.loadbalancer.preservepath": "false", "traefik.http.services.app.loadbalancer.responseforwarding.flushinterval": "100ms", "traefik.http.services.app.loadbalancer.healthcheck.path": "/health", "traefik.http.services.app.loadbalancer.healthcheck.interval": "10s", "traefik.http.services.app.loadbalancer.healthcheck.timeout": "3s", "traefik.http.services.app.loadbalancer.sticky.cookie": "true", "traefik.http.services.app.loadbalancer.sticky.cookie.name": "app_session", "traefik.http.services.app.loadbalancer.sticky.cookie.secure": "true", "traefik.http.services.app.loadbalancer.sticky.cookie.httponly": "true", "traefik.http.services.app.loadbalancer.sticky.cookie.samesite": "lax" }, "Port, Healthcheck, Sticky Cookie und Forwarding."),
  labels("traefik.middleware.headers", "traefik", "Middleware", "Security headers", { "traefik.http.middlewares.secure-headers.headers.framedeny": "true", "traefik.http.middlewares.secure-headers.headers.contenttypenosniff": "true", "traefik.http.middlewares.secure-headers.headers.stsseconds": "31536000", "traefik.http.middlewares.secure-headers.headers.stsincludesubdomains": "true", "traefik.http.middlewares.secure-headers.headers.stspreload": "true", "traefik.http.middlewares.secure-headers.headers.referrerpolicy": "strict-origin-when-cross-origin", "traefik.http.middlewares.secure-headers.headers.permissionspolicy": "camera=(), microphone=(), geolocation=()" }, "HTTP-Sicherheitsheader."),
  labels("traefik.middleware.auth", "traefik", "Middleware", "Auth middlewares", { "traefik.http.middlewares.basic-auth.basicauth.usersfile": "/run/secrets/htpasswd", "traefik.http.middlewares.basic-auth.basicauth.realm": "Genposed", "traefik.http.middlewares.forward-auth.forwardauth.address": "http://auth:4181/verify", "traefik.http.middlewares.forward-auth.forwardauth.trustforwardheader": "true", "traefik.http.middlewares.forward-auth.forwardauth.authresponseheaders": "X-User,X-Email" }, "BasicAuth und ForwardAuth."),
  labels("traefik.middleware.routing", "traefik", "Middleware", "Routing middlewares", { "traefik.http.middlewares.redirect-https.redirectscheme.scheme": "https", "traefik.http.middlewares.redirect-https.redirectscheme.permanent": "true", "traefik.http.middlewares.strip-api.stripprefix.prefixes": "/api", "traefik.http.middlewares.add-v1.addprefix.prefix": "/v1", "traefik.http.middlewares.replace-path.replacepath.path": "/", "traefik.http.middlewares.regex-redirect.redirectregex.regex": "^https://example.com/(.*)", "traefik.http.middlewares.regex-redirect.redirectregex.replacement": "https://www.example.com/$${1}", "traefik.http.middlewares.chain.chain.middlewares": "secure-headers,compress" }, "Redirect-, Prefix-, Path- und Chain-Middleware."),
  labels("traefik.middleware.traffic", "traefik", "Middleware", "Traffic middlewares", { "traefik.http.middlewares.compress.compress": "true", "traefik.http.middlewares.buffering.buffering.maxrequestbodybytes": "10485760", "traefik.http.middlewares.retry.retry.attempts": "3", "traefik.http.middlewares.ratelimit.ratelimit.average": "100", "traefik.http.middlewares.ratelimit.ratelimit.burst": "50", "traefik.http.middlewares.ratelimit.ratelimit.period": "1s", "traefik.http.middlewares.inflight.inflightreq.amount": "100", "traefik.http.middlewares.ipallow.ipallowlist.sourcerange": "10.0.0.0/8,192.168.0.0/16" }, "Compression, Buffering, Retry, RateLimit, InFlightReq und IP-Allowlist."),
  labels("traefik.tcp", "traefik", "TCP", "TCP Router & Service", { "traefik.tcp.routers.postgres.rule": "HostSNI(`db.example.com`)", "traefik.tcp.routers.postgres.entrypoints": "postgres", "traefik.tcp.routers.postgres.service": "postgres", "traefik.tcp.routers.postgres.tls": "true", "traefik.tcp.routers.postgres.tls.passthrough": "true", "traefik.tcp.services.postgres.loadbalancer.server.port": "5432", "traefik.tcp.services.postgres.loadbalancer.server.tls": "false", "traefik.tcp.middlewares.tcp-ipallow.ipallowlist.sourcerange": "10.0.0.0/8", "traefik.tcp.middlewares.tcp-inflight.inflightconn.amount": "50" }, "TCP-Router, Service und Middleware."),
  labels("traefik.udp", "traefik", "UDP", "UDP Router & Service", { "traefik.udp.routers.dns.entrypoints": "dns", "traefik.udp.routers.dns.service": "dns", "traefik.udp.services.dns.loadbalancer.server.port": "53" }, "UDP-Router und Service."),
  labels("traefik.swarm", "traefik", "Swarm", "Traefik in Swarm", { "traefik.enable": "true", "traefik.swarm.network": "proxy", "traefik.http.routers.app.rule": "Host(`app.example.com`)", "traefik.http.services.app.loadbalancer.server.port": "3000" }, "Traefik-Labels im deploy-Block.", true),
  labels("caddy.site", "caddy", "Site", "Caddy site", { caddy: "app.example.com", "caddy.reverse_proxy": "{{upstreams 3000}}", "caddy.encode": "zstd gzip" }, "Caddy-Docker-Proxy-Site."),
  labels("caddy.matchers", "caddy", "Routing", "Matcher & route", { "caddy.@api.path": "/api/*", "caddy.route.0_handle": "@api", "caddy.route.0_handle.0_uri": "strip_prefix /api", "caddy.route.0_handle.1_reverse_proxy": "{{upstreams 3000}}", "caddy.route.1_handle": "/*", "caddy.route.1_handle.0_reverse_proxy": "{{upstreams 3000}}" }, "Named Matcher, Route und Handle über Punktnotation."),
  labels("caddy.tls", "caddy", "TLS", "Caddy TLS", { "caddy.tls": "{$ACME_EMAIL}", "caddy.tls.dns": "cloudflare {$CLOUDFLARE_API_TOKEN}", "caddy.header.Strict-Transport-Security": "\"max-age=31536000; includeSubDomains; preload\"" }, "TLS- und Header-Direktiven; Plugins beachten."),
  labels("caddy.ingress", "caddy", "Discovery", "Caddy ingress network", { caddy_ingress_network: "proxy", "caddy.reverse_proxy": "{{upstreams http 3000}}" }, "Ingress-Netzwerk für Caddy Docker Proxy."),
  labels("caddy.swarm", "caddy", "Swarm", "Caddy in Swarm", { caddy: "app.example.com", "caddy.reverse_proxy": "{{upstreams 3000}}", caddy_ingress_network: "proxy" }, "Caddy-Labels auf Serviceebene.", true),
  labels("coolify.managed", "coolify", "Metadaten", "Coolify metadata", { "coolify.managed": "true", "coolify.applicationId": "${COOLIFY_APPLICATION_ID:-0}", "coolify.type": "application" }, "Von Coolify verwendete Metadaten."),
  f("coolify.exclude_hc", "coolify", "Health", "Vom Gesamt-Healthcheck ausschließen", ["exclude_from_hc"], true, "Coolify-Erweiterung für One-shot-Services."),
  f("coolify.magic", "coolify", "Environment", "Magic environment variables", ["environment"], { APP_URL: "${SERVICE_URL_APP}", APP_FQDN: "${SERVICE_FQDN_APP}", ADMIN_USER: "${SERVICE_USER_ADMIN}", ADMIN_PASSWORD: "${SERVICE_PASSWORD_ADMIN}" }, "Generierte URL-, FQDN-, User- und Password-Werte."),
  f("coolify.required", "coolify", "Environment", "Required variables", ["environment"], { DATABASE_URL: "${DATABASE_URL:?DATABASE_URL is required}", APP_PORT: "${APP_PORT:?3000}", LOG_LEVEL: "${LOG_LEVEL:-info}" }, "Required-, Default- und Optional-Interpolation."),
  labels("coolify.raw_proxy", "coolify", "Raw Compose", "Coolify proxy labels", { "traefik.enable": "true", "traefik.http.routers.coolify-app.rule": "Host(`app.example.com`) && PathPrefix(`/`)", "traefik.http.routers.coolify-app.entrypoints": "https", "traefik.http.routers.coolify-app.tls": "true", "traefik.http.services.coolify-app.loadbalancer.server.port": "3000" }, "Proxy-Konfiguration für Raw Compose Deployment."),
  f("framework.next", "framework", "JavaScript", "Next.js", [], { build: { context: ".", target: "runner", args: { NEXT_TELEMETRY_DISABLED: "1" } }, environment: { NODE_ENV: "production", PORT: "3000", HOSTNAME: "0.0.0.0" }, expose: ["3000"], healthcheck: { test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/api/health || exit 1"], interval: "30s", timeout: "5s", retries: 5 } }, "Standalone-Next.js-Profil."),
  f("framework.node", "framework", "JavaScript", "Node.js API", [], { image: "node:22-alpine", working_dir: "/app", command: ["node", "dist/server.js"], environment: { NODE_ENV: "production" }, expose: ["3000"], init: true }, "Generisches Node.js-API-Profil."),
  f("framework.bun", "framework", "JavaScript", "Bun", [], { image: "oven/bun:1-alpine", working_dir: "/app", command: ["bun", "run", "start"], expose: ["3000"] }, "Bun-Runtime-Profil."),
  f("framework.deno", "framework", "JavaScript", "Deno", [], { image: "denoland/deno:alpine", command: ["run", "--allow-net", "--allow-env", "main.ts"], expose: ["8000"] }, "Deno mit expliziten Permissions."),
  f("framework.laravel", "framework", "PHP", "Laravel", [], { build: { context: ".", target: "app" }, environment: { APP_ENV: "production", APP_DEBUG: "false", APP_KEY: "${APP_KEY:?}" }, command: ["php-fpm", "-F"] }, "Laravel/PHP-FPM-Profil."),
  f("framework.django", "framework", "Python", "Django", [], { build: { context: "." }, command: ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"], environment: { DJANGO_SETTINGS_MODULE: "config.settings.production", DATABASE_URL: "${DATABASE_URL:?}" }, expose: ["8000"] }, "Django mit Gunicorn."),
  f("framework.fastapi", "framework", "Python", "FastAPI", [], { build: { context: "." }, command: ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"], expose: ["8000"] }, "FastAPI mit Uvicorn."),
  f("framework.rails", "framework", "Ruby", "Rails", [], { build: { context: "." }, command: ["bundle", "exec", "puma", "-C", "config/puma.rb"], environment: { RAILS_ENV: "production", RAILS_MASTER_KEY: "${RAILS_MASTER_KEY:?}" }, expose: ["3000"] }, "Rails mit Puma."),
  f("framework.go", "framework", "Compiled", "Go", [], { build: { context: ".", target: "runtime" }, environment: { GOMAXPROCS: "2" }, expose: ["8080"], read_only: true, tmpfs: ["/tmp"] }, "Minimaler Go-Service."),
  f("framework.spring", "framework", "JVM", "Spring Boot", [], { build: { context: ".", target: "runtime" }, environment: { SPRING_PROFILES_ACTIVE: "prod", JAVA_TOOL_OPTIONS: "-XX:MaxRAMPercentage=75" }, expose: ["8080"], stop_grace_period: "45s" }, "Spring-Boot-Profil."),
  f("framework.dotnet", "framework", ".NET", "ASP.NET Core", [], { build: { context: ".", target: "final" }, environment: { ASPNETCORE_ENVIRONMENT: "Production", ASPNETCORE_URLS: "http://+:8080" }, expose: ["8080"] }, "ASP.NET-Core-Profil."),
];

export const composeFields = [...standard, ...extensions];
export const fieldCountByCategory = composeFields.reduce<Record<FieldCategory, number>>((counts, item) => {
  counts[item.category] += 1;
  return counts;
}, { compose: 0, build: 0, runtime: 0, networking: 0, storage: 0, security: 0, health: 0, swarm: 0, traefik: 0, caddy: 0, coolify: 0, framework: 0 });
