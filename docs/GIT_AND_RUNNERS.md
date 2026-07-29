# Git providers and CI runners

## Objective

Connecting a repository or native CI runner should feel like installing an application: choose a provider, authorize access, select scope, and let genposed create supported webhooks, statuses, and registrations.

Provider differences cannot be removed completely. Self-hosted instances may require a one-time administrator registration or an explicitly copied registration token. The UI must expose this as a guided fallback rather than claiming impossible zero-configuration behavior.

## Provider adapter

Each adapter normalizes:

- instance discovery and version;
- authentication and token refresh;
- namespaces, organizations, groups, users, and repositories;
- branches, tags, commits, and archives;
- webhooks and delivery signatures;
- commit or deployment statuses;
- application or monorepo discovery;
- runner registration and lifecycle capabilities.

Capabilities are stored per connection. Product behavior depends on detected capability rather than only provider name.

## GitHub

Preferred integration:

- GitHub App;
- repository selection during installation;
- short-lived installation access tokens;
- push, pull-request, installation, and repository webhooks;
- commit and deployment statuses;
- organization or repository self-hosted runner registration;
- just-in-time ephemeral runner configuration where available.

GitHub Enterprise Server requires an application registered for that enterprise instance.

## GitLab

Supported modes:

- GitLab.com OAuth application;
- self-managed user, group, or instance application;
- project and group webhooks;
- token refresh with atomic credential replacement;
- project, group, and instance runners;
- current runner-authentication-token workflow rather than deprecated registration patterns.

Some setup operations require instance administrator permission. The connection wizard detects this and switches to a limited user mode or admin-assisted mode.

## Gitea

Supported modes:

- user, organization, or instance OAuth application;
- repository or organization webhooks;
- Gitea Actions runner registration;
- repository, organization, or instance scope according to version and permissions;
- persistent or ephemeral runner deployment.

Gitea API behavior is capability-detected because self-hosted versions vary.

## Forgejo

Preferred modes:

- authorized integration with a genposed OIDC issuer and JWKS endpoint where supported;
- OAuth2 fallback;
- repository, user, organization, or instance webhooks;
- Forgejo Actions runners at supported scopes;
- persistent or single-job ephemeral runners.

Each tenant receives separate runner processes even if one runner implementation can technically connect to multiple instances.

## Codeberg

Codeberg is presented as a preconfigured Forgejo provider.

Supported CI modes may include:

- Forgejo Actions runner;
- Woodpecker agent.

Automatic runner registration is attempted through available APIs. When Codeberg or account permissions do not allow this, the UI requests a one-time registration token and performs the remaining installation automatically.

## Repository connection workflow

```text
select provider
→ choose hosted or self-hosted
→ enter instance URL when required
→ detect product and capabilities
→ authorize
→ select namespace and repositories
→ create supported webhooks
→ choose branch and Compose files
→ discover applications
→ configure environment
```

## Monorepo discovery

The scanner may detect:

- Compose files;
- Dockerfiles;
- npm, pnpm, Yarn, and Bun workspaces;
- Turborepo and Nx;
- common frontend and backend frameworks;
- application ports;
- build and start commands;
- required environment variables;
- service dependencies.

Discovery produces suggestions. It must not silently commit configuration or deploy inferred services.

## Runner lifecycle

A managed runner record contains:

- provider connection and external scope;
- assigned build server;
- runner mode;
- labels;
- architecture;
- resource limits;
- registration expiry;
- runner software version;
- last heartbeat and job;
- credential rotation state;
- tenant and project scope.

### Persistent runners

Remain registered and execute multiple jobs. Suitable for trusted internal workloads with controlled cleanup.

### Ephemeral runners

Receive one job and are destroyed afterwards. Preferred for untrusted or multi-tenant workloads.

## Security constraints

- Never expose registration tokens in logs.
- Registration credentials are short-lived and delivered only to the selected build agent.
- Runner containers do not share writable workspaces across tenants.
- Docker socket access is disabled by default.
- Workflows requiring container builds use an isolated BuildKit endpoint rather than a shared rootful Docker socket.
- Provider webhook payloads are verified before JSON processing and deduplicated by delivery ID.
- Repository source is pinned to a resolved commit SHA.
