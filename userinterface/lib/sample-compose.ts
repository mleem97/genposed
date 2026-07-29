export const initialCompose = `# Genposed Compose workbench example
# Catalogue document: remove mutually exclusive or runtime-specific options before deployment.
version: "3.9"
name: genposed-kitchen-sink

x-service-defaults: &service-defaults
  init: true
  restart: unless-stopped
  stop_grace_period: 30s
  logging:
    driver: json-file
    options:
      max-size: 10m
      max-file: "3"

services:
  web:
    <<: *service-defaults
    image: ghcr.io/mleem97/genposed-web:\${APP_TAG:-latest}
    pull_policy: missing
    platform: linux/amd64
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
      args:
        NODE_VERSION: "22"
      additional_contexts:
        ui: ../mm-ui
        base: docker-image://node:22-alpine
      cache_from:
        - type=registry,ref=ghcr.io/mleem97/genposed-web:cache
      cache_to:
        - type=registry,ref=ghcr.io/mleem97/genposed-web:cache,mode=max
      no_cache: false
      no_cache_filter: [deps]
      pull: true
      provenance: mode=max
      sbom: true
      secrets:
        - source: npm_token
          target: npm_token
      ssh: [default]
      tags:
        - ghcr.io/mleem97/genposed-web:latest
      platforms: [linux/amd64, linux/arm64]
    command: ["node", "server.js"]
    entrypoint: ["/usr/bin/tini", "--"]
    working_dir: /app
    user: "1000:1000"
    group_add: ["1001"]
    hostname: web
    init: true
    stop_signal: SIGTERM
    environment:
      NODE_ENV: production
      PORT: "3000"
      DATABASE_URL: \${DATABASE_URL:?DATABASE_URL is required}
      APP_URL: \${SERVICE_URL_WEB:-https://app.example.com}
      APP_FQDN: \${SERVICE_FQDN_WEB:-app.example.com}
      ADMIN_USER: \${SERVICE_USER_ADMIN:-admin}
      ADMIN_PASSWORD: \${SERVICE_PASSWORD_ADMIN:?}
    env_file:
      - path: .env
        required: false
      - path: .env.production
        required: false
        format: raw
    depends_on:
      postgres:
        condition: service_healthy
        restart: true
        required: true
      redis:
        condition: service_started
        required: false
    expose: ["3000"]
    ports:
      - name: http
        target: 3000
        published: "3000"
        host_ip: 127.0.0.1
        protocol: tcp
        app_protocol: http
        mode: host
    networks:
      app:
        aliases: [frontend]
        ipv4_address: 172.28.0.10
        interface_name: eth0
        gw_priority: 100
        priority: 1000
      proxy:
        priority: 2000
    volumes:
      - type: volume
        source: web-data
        target: /app/data
        volume:
          nocopy: true
          subpath: tenant-a
      - type: bind
        source: ./config
        target: /app/config
        read_only: true
        bind:
          create_host_path: true
          propagation: rprivate
      - type: tmpfs
        target: /tmp
        tmpfs:
          size: 67108864
          mode: 1777
    configs:
      - source: app_config
        target: /app/config.yaml
        uid: "1000"
        gid: "1000"
        mode: 0444
    secrets:
      - source: db_password
        target: db_password
        mode: 0400
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/api/health || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 20s
      start_interval: 2s
    read_only: true
    cap_drop: [ALL]
    cap_add: [NET_BIND_SERVICE]
    security_opt: ["no-new-privileges:true"]
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
    labels:
      traefik.enable: "true"
      traefik.docker.network: proxy
      traefik.http.routers.web.rule: "Host(\`app.example.com\`) && PathPrefix(\`/\`)"
      traefik.http.routers.web.entrypoints: websecure
      traefik.http.routers.web.service: web
      traefik.http.routers.web.middlewares: secure-headers@docker,compress@docker,rate-limit@docker
      traefik.http.routers.web.tls: "true"
      traefik.http.routers.web.tls.certresolver: letsencrypt
      traefik.http.routers.web.tls.domains[0].main: example.com
      traefik.http.routers.web.tls.domains[0].sans: "*.example.com"
      traefik.http.services.web.loadbalancer.server.port: "3000"
      traefik.http.services.web.loadbalancer.healthcheck.path: /api/health
      traefik.http.services.web.loadbalancer.sticky.cookie: "true"
      traefik.http.services.web.loadbalancer.sticky.cookie.name: genposed_session
      traefik.http.middlewares.secure-headers.headers.framedeny: "true"
      traefik.http.middlewares.secure-headers.headers.contenttypenosniff: "true"
      traefik.http.middlewares.secure-headers.headers.stsseconds: "31536000"
      traefik.http.middlewares.compress.compress: "true"
      traefik.http.middlewares.rate-limit.ratelimit.average: "100"
      traefik.http.middlewares.rate-limit.ratelimit.burst: "50"
      traefik.http.middlewares.retry.retry.attempts: "3"
      caddy: app.example.com
      caddy.reverse_proxy: "{{upstreams 3000}}"
      caddy.encode: zstd gzip
      caddy.@api.path: /api/*
      caddy.route.0_handle: "@api"
      caddy.route.0_handle.0_uri: strip_prefix /api
      caddy.route.0_handle.1_reverse_proxy: "{{upstreams 3000}}"
      caddy_ingress_network: proxy
      coolify.managed: "true"
      coolify.applicationId: \${COOLIFY_APPLICATION_ID:-0}
      coolify.type: application
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
          ignore: [node_modules/]
          initial_sync: true
        - action: rebuild
          path: package.json
    deploy:
      mode: replicated
      replicas: 3
      endpoint_mode: vip
      placement:
        constraints:
          - node.role == worker
          - node.labels.region == eu-central
        preferences:
          - spread: node.labels.zone
        max_replicas_per_node: 2
      update_config:
        parallelism: 2
        delay: 10s
        monitor: 30s
        max_failure_ratio: 0.2
        failure_action: rollback
        order: start-first
      rollback_config:
        parallelism: 1
        delay: 5s
        monitor: 20s
        failure_action: pause
        order: stop-first
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 2m
      resources:
        limits:
          cpus: "2.0"
          memory: 2g
          pids: 512
        reservations:
          cpus: "0.5"
          memory: 256m
      labels:
        traefik.enable: "true"
        traefik.swarm.network: proxy
        traefik.http.routers.web.rule: "Host(\`app.example.com\`)"
        traefik.http.services.web.loadbalancer.server.port: "3000"
        caddy: app.example.com
        caddy.reverse_proxy: "{{upstreams 3000}}"
        caddy_ingress_network: proxy

  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: \${POSTGRES_DB:-genposed}
      POSTGRES_USER: \${SERVICE_USER_POSTGRES:-genposed}
      POSTGRES_PASSWORD: \${SERVICE_PASSWORD_POSTGRES:?}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks: [app]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d genposed"]
      interval: 10s
      timeout: 5s
      retries: 10

  redis:
    image: redis:8-alpine
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redis-data:/data
    networks: [app]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  migration:
    image: ghcr.io/mleem97/genposed-api:\${APP_TAG:-latest}
    command: ["node", "dist/migrate.js"]
    environment:
      DATABASE_URL: \${DATABASE_URL:?}
    depends_on:
      postgres:
        condition: service_healthy
    networks: [app]
    restart: "no"
    exclude_from_hc: true
    profiles: [migration]

networks:
  app:
    name: genposed-app
    driver: bridge
    attachable: true
    internal: true
    enable_ipv4: true
    enable_ipv6: true
    ipam:
      config:
        - subnet: 172.28.0.0/16
          gateway: 172.28.0.1
  proxy:
    name: proxy
    external: true

volumes:
  web-data:
    driver: local
    labels:
      com.example.backup: daily
  postgres-data:
  redis-data:

configs:
  app_config:
    content: |
      server:
        port: 3000
  external_config:
    name: company-shared-config
    external: true

secrets:
  db_password:
    environment: SERVICE_PASSWORD_POSTGRES
  npm_token:
    file: ./.secrets/npm_token
  external_secret:
    name: company-shared-secret
    external: true
`;
