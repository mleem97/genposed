# Compose Studio

## Objective

Compose Studio prevents common YAML and Compose mistakes by editing a typed document model through field-specific controls.

The user should be able to add another port, environment variable, volume, label, device, health-check command, build argument, middleware, or nested object without managing indentation, quoting, or list syntax.

## Document representations

```text
YAML source
↕
YAML AST/CST
↕
canonical typed Compose model
↕
form state and diagnostics
```

The canonical model is the primary application state. YAML remains the portable import/export and Git synchronization format.

## Editor behavior

- maps render as key/value rows;
- lists render as reorderable entries;
- nested objects render as collapsible groups;
- unions render as explicit variants;
- secrets use protected inputs and references;
- service references use searchable selectors;
- dynamic names such as Traefik routers remain user-defined keys;
- unsupported fields remain visible but marked by target capability;
- unknown `x-*` extensions round-trip without data loss;
- raw YAML is available as an advanced mode, not the default mode.

## Short and long syntax

Compose accepts compact and expanded forms for many fields. The editor normalizes both into one internal type.

Example:

```yaml
ports:
  - "8080:80"
```

becomes internally equivalent to:

```yaml
ports:
  - target: 80
    published: "8080"
    protocol: tcp
```

Export may preserve the original representation where safe or emit canonical long syntax.

## Round-trip requirements

An import/edit/export cycle should preserve, where practical:

- comments;
- key order;
- anchors and aliases;
- scalar styles;
- extension fields;
- unrelated unknown fields;
- values not changed by the user.

When a construct cannot be represented safely in the form editor, it is shown as an advanced block rather than silently rewritten.

## Validation pipeline

### Syntax validation

- valid YAML;
- duplicate keys;
- valid anchors and aliases;
- scalar and collection type errors;
- interpolation syntax.

### Compose schema validation

A versioned registry combines the official Compose schema with UI metadata:

- label and description;
- examples;
- target scope;
- minimum Compose or Docker version;
- deprecation state;
- platform support;
- editor control;
- compatibility relationships.

### Runtime normalization

Before deployment, the target agent runs:

```bash
docker compose \
  --project-name validation \
  --file compose.yaml \
  --env-file generated.env \
  config --format json
```

The normalized output is compared with the intended canonical model.

### Policy validation

Policy results include severity, path, explanation, target compatibility, and optional autofix.

Example rules:

- privileged containers;
- host networking, PID, IPC, or user namespace;
- Docker socket and dangerous host mounts;
- excessive Linux capabilities;
- root execution;
- unpinned images;
- missing health checks;
- missing resource limits;
- plain-text secrets;
- missing log rotation;
- public database ports;
- unsafe build entitlements.

## Multiple Compose files

The repository scanner detects conventional and custom files. Users may define named actions:

```text
Development → compose.yml + compose.local.yml
Staging     → compose.yml + compose.staging.yml
Production  → compose.yml + compose.production.yml
```

Each environment records file order, profiles, variable sources, generated overrides, and target capabilities.

## Git synchronization

Repository-managed changes produce a semantic diff before commit. The generated commit should describe affected services and fields rather than only line changes.

Concurrent repository changes require a three-way merge:

- repository base revision;
- latest repository revision;
- panel-edited canonical model.

Conflicts are resolved at field level where possible and fall back to YAML conflict resolution when semantics are ambiguous.

## Extension registries

Provider and platform features are modeled as data-driven extension registries rather than hardcoded UI branches.

Initial registries:

- Traefik labels and file-provider objects;
- Caddy Docker Proxy and JSON/Caddyfile concepts;
- Coolify metadata and API mappings;
- Dokploy API mappings;
- Cloudflare DNS and tunnel configuration;
- common framework presets;
- organization policy templates.

## Export guarantee

Compose Studio guarantees syntactically valid serialized YAML. Deployment validity still depends on the target Docker Engine, Compose implementation, operating system, image behavior, required files, secrets, networks, and external services. The UI must distinguish formatting guarantees from runtime guarantees.
