# Synced schemas

This directory is populated by the schema synchronization script:

```bash
pnpm schema:sync
```

Generated schema files are intentionally not committed by the initial prototype scaffold.

## Sources

The synchronization process may collect:

- the official Compose Specification JSON Schema;
- SchemaStore Compose variants used for compatibility comparison;
- supplied documentation snapshots used by the field catalogue;
- metadata needed to identify schema source, version, and retrieval time.

## Rules

- Treat the official Compose Specification as the primary schema source.
- Do not assume that a schema field is supported by every installed Docker Compose version.
- Keep target-version and platform compatibility in separate UI metadata.
- Do not silently merge conflicting schemas.
- Record source URLs and retrieval timestamps for generated files.
- Never place credentials, access tokens, or private provider documentation in this directory.
- Generated files must be reproducible through `pnpm schema:sync`.

## Deployment validation

JSON Schema validation is not sufficient to guarantee that a Compose project can run. Before deployment, genposed is intended to validate the rendered files through the target agent with the installed Compose implementation:

```bash
docker compose -f compose.yaml config --format json
```

See [Compose Studio](../../../docs/COMPOSE_STUDIO.md) for the complete validation and round-trip model.
