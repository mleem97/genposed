# 0002 — Use a canonical typed Compose model

- Status: Accepted
- Date: 2026-07-29
- Owners: genposed maintainers

## Context

The primary product promise is safe, easy field-based Compose editing. Treating YAML text as form state makes nested updates, validation, compatibility, autofixes, and conflict resolution unreliable.

## Decision

Use a canonical typed Compose model as primary state, with YAML AST/CST for import, export, comments, anchors, and formatting preservation.

- Forms mutate typed structures.
- Schema metadata generates controls and compatibility information.
- Short and long syntax normalize into common types.
- Unknown extensions remain round-trippable.
- Raw YAML mode validates and produces a semantic diff before replacing form state.
- Target agents run `docker compose config` before deployment.

## Consequences

- The UI can add repeated and nested fields without indentation errors.
- Schema evolution and target-version compatibility can be managed centrally.
- Perfect formatting preservation is not always possible.
- Anchors, aliases, unions, and unknown fields require explicit advanced-editor behavior.
- Canonical serialization must be deterministic.

## Alternatives considered

### Text-only YAML editor

Too close to existing tools and does not provide the intended error prevention.

### Parse and fully re-stringify after every edit

Simpler but destroys comments, scalar styles, and much of the user's formatting.

### Store only normalized Docker Compose JSON

Insufficient for portable Git round-tripping and comments.
