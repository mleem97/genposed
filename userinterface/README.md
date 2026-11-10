# genposed user interface

This directory contains the current Next.js prototype for the schema-driven Docker Compose workbench.

> **Status:** prototype. It demonstrates catalogue-driven field insertion, YAML editing, diagnostics, and platform-extension presets. It is not yet connected to a production control plane, database, runtime agent, build farm, Git provider gateway, or deployment engine.

For the complete product direction, start with the repository [README](../README.md) and [documentation index](../docs/README.md).

## Implemented in this prototype

- Next.js App Router, React 19, and Tailwind CSS 4.
- `@meyermedia/ui` theme and primitives.
- Monaco-based YAML editor with local autosave, copy, and export.
- Searchable Compose and extension catalogue with more than 100 field and preset groups.
- Field insertion into a selected service or the top-level Compose model.
- Merge-aware insertion for Docker, Traefik, Caddy, Coolify, and Swarm labels.
- Basic YAML and cross-field diagnostics.
- Framework presets for common frontend and backend stacks.
- Downloadable kitchen-sink Compose reference.
- Schema synchronization script for official Compose schemas and documentation snapshots.
- GitHub Actions workflow for type checking and Next.js builds.
- PostgreSQL schema for authentication, customers, customer memberships, and scope-bound Compose projects.
- Better Auth email/password sign-in with public registration disabled and a server-side session gate on the workbench.
- One-time operator bootstrap command; customer access defaults to disabled and project ownership consistency is enforced by PostgreSQL.

## Not implemented yet

- canonical typed Compose form state for every field;
- full comment, anchor, alias, and formatting round-trip guarantees;
- database persistence and accounts;
- runtime and build agents;
- GitHub, GitLab, Gitea, Forgejo, and Codeberg integrations;
- native CI runner management;
- Docker and Compose execution;
- reverse-proxy and Cloudflare application;
- deployment orchestration and rollback;
- client-aware zero-downtime updates;
- production authentication, authorization, secret storage, and audit logs.

## Important limitation

The database-backed sign-in and ownership foundation is now present, but project/customer API operations, invitations, membership administration, and server-side project persistence are still being implemented. Existing editor documents remain browser-local until that API migration is complete.

There is no single deployable Compose file that can safely activate every possible field at once. Several options are:

- mutually exclusive, such as `network_mode` and service-level `networks`;
- runtime-, platform-, or operating-system-specific;
- optional parts of the Compose Specification;
- deprecated but still accepted for compatibility;
- dynamic namespaces, such as Traefik router, service, and middleware names;
- platform extensions, such as Coolify metadata;
- security-sensitive, such as privileged mode, device access, or host mounts.

The prototype therefore separates three concerns:

1. **Official schema** — the Compose Specification is the validation source of truth.
2. **Extension registries** — Traefik, Caddy, Coolify, Swarm, and framework presets are data-driven templates.
3. **Kitchen-sink document** — a readable capability catalogue, not a production manifest.

## Development

Requirements:

- Node.js 20.9 or newer;
- pnpm 11;
- optional Docker Engine and Docker Compose plugin for external validation.

```bash
pnpm install
cp .env.example .env.local
# Set BETTER_AUTH_SECRET, BETTER_AUTH_URL and DATABASE_URL in .env.local.
pnpm db:migrate
pnpm schema:sync
pnpm dev
```

Create the first operator after applying migrations. Enter credentials without echoing the password into terminal history:

```bash
read -r -p "Operator name: " GENPOSED_OPERATOR_NAME
read -r -p "Operator email: " GENPOSED_OPERATOR_EMAIL
read -r -s -p "Operator password: " GENPOSED_OPERATOR_PASSWORD
printf '\n'
export GENPOSED_OPERATOR_NAME GENPOSED_OPERATOR_EMAIL GENPOSED_OPERATOR_PASSWORD
pnpm setup:operator
unset GENPOSED_OPERATOR_NAME GENPOSED_OPERATOR_EMAIL GENPOSED_OPERATOR_PASSWORD
```

The setup command refuses to create a second initial operator. Additional operator/customer administration will be provided through authenticated, scope-checked application flows.

Open `http://localhost:3000`.

Quality checks:

```bash
pnpm typecheck
pnpm test
pnpm coverage
pnpm build
```

Vitest measures all `lib/**/*.ts`, `components/**/*.tsx`, `app/**/*.ts`, `app/**/*.tsx`, `scripts/**/*.mjs`, and `scripts/**/*.ts` modules, plus Next.js, PostCSS, and Drizzle configuration. The gate is 100% statements, branches, functions, and lines. The latest measured result is recorded in the [requirements matrix](../docs/REQUIREMENTS_MATRIX.md). Schema sync and auth wiring tests replace network, database, and filesystem boundaries with controlled fakes; the generated migration still needs execution against PostgreSQL. Declaration files have no executable statements; CSS is checked by the production build but not visually; workflow and metadata files are declarative. This remains the UI/control-plane foundation only: project API operations, agents, builders, and deployment runtimes are not implemented.

## Validation

The browser currently performs YAML parsing and a limited set of semantic checks. Before deployment, validate generated output using the actual target platform:

```bash
docker compose -f examples/compose.kitchen-sink.yaml config
```

For Swarm-specific examples:

```bash
docker stack config -c examples/compose.kitchen-sink.yaml
```

The kitchen-sink file intentionally references demonstration files and contains incompatible alternatives and profiles. For a deployable output, start with an empty document or remove unused catalogue examples.

## Architecture

```text
app/
  layout.tsx                 application shell and theme
  page.tsx                   editor route
components/
  compose-editor.tsx         state, field insertion, diagnostics, and workbench UI
  yaml-editor.tsx            client-only Monaco boundary
lib/
  catalog.ts                 Compose and platform extension registry
  sample-compose.ts          embedded kitchen-sink source
examples/
  compose.kitchen-sink.yaml  human-readable capability reference
public/schemas/
  README.md                  generated-schema policy
scripts/
  sync-schemas.mjs           schema and documentation synchronization
```

## Registry model

Every palette item declares:

- a stable ID and category;
- target scope: top-level, service, container labels, or Swarm service labels;
- a path or merge strategy;
- a sample value;
- compatibility notes.

This allows the curated registry to be replaced incrementally by generated records from JSON Schema without rewriting the editor UI.

The intended long-term model is described in [Compose Studio](../docs/COMPOSE_STUDIO.md).

## Contribution notes

- Keep planned behavior clearly separated from implemented behavior.
- Add compatibility notes for target-specific fields.
- Do not add examples containing real credentials or private endpoints.
- Validate catalogue additions against official documentation.
- Update project documentation or an ADR when a change affects the canonical model, schema behavior, or security boundary.

See [CONTRIBUTING.md](../CONTRIBUTING.md).
