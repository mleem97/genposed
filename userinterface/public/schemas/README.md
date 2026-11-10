# Synced schemas

This directory is populated by the schema synchronization script:

```bash
pnpm schema:sync
```

Generated schema files are intentionally not committed by the prototype scaffold. Production builds should generate them from pinned and reviewed source revisions.

## Generated files

The synchronization process produces:

- `compose-spec.json` — the official Compose Specification JSON Schema;
- `docker-compose.schemastore.json` — the SchemaStore Compose variant used for comparison;
- `compose-field-index.json` — a normalized index of top-level, service, and build fields generated from the official schema;
- `manifest.json` — source URLs, byte sizes, and synchronization timestamps;
- documentation snapshots under `source-docs/`.

The generated field index records schema-derived information such as:

- field scope and name;
- JSON value types;
- description;
- default and example values;
- enumerated values;
- read-only, write-only, and deprecation markers where present.

## Metadata boundaries

The official schema remains the primary source for field structure, but it does not solve every compatibility question.

Keep the following information in separate, versioned UI or capability metadata:

- minimum Docker Compose version;
- Docker Engine API requirements;
- BuildKit and Buildx requirements;
- Swarm-only behavior;
- Traefik, Caddy, Coolify, and other platform extensions;
- fields accepted by a provider but not portable Compose;
- security and best-practice policy classification.

Unknown compatibility must remain `unknown`; genposed must not silently assume support.

## Rules

- Treat the official Compose Specification as the primary schema source.
- Do not assume that a schema field is supported by every installed Docker Compose version.
- Keep target-version and platform compatibility in separate UI metadata.
- Do not silently merge conflicting schemas.
- Record source URLs and retrieval timestamps for generated files.
- Never place credentials, access tokens, or private provider documentation in this directory.
- Generated files must be reproducible through `pnpm schema:sync`.
- Review source revisions before using newly synchronized schemas in a release.

## Deployment validation

JSON Schema validation is not sufficient to guarantee that a Compose project can run. Before deployment, genposed is intended to validate rendered files through the target agent with the installed Compose implementation:

```bash
docker compose -f compose.yaml config --format json
```

See [Compose Studio](../../../docs/COMPOSE_STUDIO.md) for the complete validation and round-trip model.
