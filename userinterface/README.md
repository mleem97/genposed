# Genposed User Interface

Schema-driven GUI editor for Docker Compose with extension registries for Traefik, Caddy Docker Proxy, Coolify, Docker Swarm and common application frameworks.

## What is included

- Next.js App Router, React and Tailwind CSS 4
- `@meyermedia/ui` theme, primitives and styles
- Monaco-based YAML editor with local autosave
- searchable field registry with more than 100 field and preset groups
- field insertion into a selected service or the top-level Compose model
- merge-aware insertion for Docker, Traefik, Caddy and Coolify labels
- basic YAML and cross-field diagnostics
- downloadable kitchen-sink `compose.yaml`
- an educational example covering Compose Build, Develop, Deploy/Swarm, networks, volumes, configs, secrets, models, lifecycle hooks, low-level runtime settings, Traefik HTTP/TCP/UDP labels, Caddy Docker Proxy labels and Coolify extensions
- schema synchronization script for the official Compose schema, SchemaStore and the supplied documentation snapshots

## Important limitation

There is no single deployable Compose file that can safely activate every possible field at once. Several options are:

- mutually exclusive, such as `network_mode` and service-level `networks`
- runtime- or OS-specific
- optional parts of the Compose Specification
- deprecated but still accepted for compatibility
- dynamic namespaces, such as Traefik router/service/middleware names and Caddy directive nesting
- platform extensions, such as Coolify's `exclude_from_hc`

The application therefore separates three concerns:

1. **Official schema** — the Compose Specification is the validation source of truth.
2. **Extension registries** — Traefik, Caddy, Coolify and framework presets are data-driven templates.
3. **Kitchen-sink document** — a readable catalogue, not a production manifest.

## Development

```bash
pnpm install
pnpm schema:sync
pnpm dev
```

Open `http://localhost:3000`.

## Validation

The browser performs YAML parsing and a small set of semantic checks. Before deployment, validate with the Docker CLI and the actual target platform:

```bash
docker compose -f examples/compose.kitchen-sink.yaml config

docker stack config -c examples/compose.kitchen-sink.yaml
```

The kitchen-sink file intentionally references demonstration files and contains incompatible profile examples. For a deployable output, start with an empty document or remove unused profiles and catalogue-only alternatives.

## Architecture

```text
app/
  layout.tsx                 mm-ui theme and global shell
  page.tsx                   editor route
components/
  compose-editor.tsx         state, insertion, diagnostics and workbench UI
  yaml-editor.tsx            client-only Monaco boundary
lib/
  catalog.ts                 Compose and platform extension registry
  sample-compose.ts          embedded kitchen-sink source
examples/
  compose.kitchen-sink.yaml  human-readable reference document
scripts/
  sync-schemas.mjs           official schemas and supplied docs sync
```

## Registry model

Every palette item declares:

- a stable ID and category
- target scope: top-level, service, container labels or Swarm service labels
- a path or merge strategy
- a sample value
- compatibility notes

This makes it possible to replace the current curated registry with generated records from JSON Schema without rewriting the editor UI.
