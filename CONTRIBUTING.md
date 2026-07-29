# Contributing to genposed

genposed is in early development. Contributions should keep the architecture understandable and avoid presenting planned capabilities as completed behavior.

## Before contributing

1. Read the [documentation index](docs/README.md).
2. Review the relevant architecture and security documents.
3. Search existing issues and pull requests.
4. Open an issue before large changes to persistence, agents, authentication, Compose serialization, provider adapters, build isolation, or deployment semantics.
5. Add or update an ADR when a change alters a major architectural decision.

## Development setup

The current UI prototype is under `userinterface/` on the development branch.

```bash
cd userinterface
pnpm install
pnpm schema:sync
pnpm dev
```

Quality checks:

```bash
pnpm typecheck
pnpm build
```

Generated Compose examples should also be validated with an installed Docker Compose CLI where practical.

## Pull requests

Keep pull requests focused. Include:

- problem and intended behavior;
- implementation summary;
- screenshots for visible UI changes;
- validation performed;
- security implications;
- migration or compatibility impact;
- documentation changes;
- rollback behavior for deployment-related changes.

Do not mix broad formatting changes with functional changes.

## Code guidelines

- Use strict TypeScript.
- Validate untrusted input at boundaries.
- Keep provider-specific logic behind adapters.
- Keep Docker and agent execution out of UI components and request handlers.
- Use stable identifiers rather than display names as keys.
- Make long-running operations idempotent.
- Preserve tenant or workspace scope through every background job.
- Redact secrets before logs are emitted.
- Do not silently ignore unsupported Compose fields.

## Documentation guidelines

- Public documentation is written in English.
- Clearly label implemented, prototype, planned, and exploratory functionality.
- Include failure, retry, and rollback behavior.
- Link related ADRs.
- Avoid claiming automatic provider setup where administrator approval is required.

## Commit messages

Use clear imperative messages. Conventional Commit prefixes are encouraged:

```text
feat:
fix:
docs:
refactor:
test:
build:
ci:
chore:
```

## Security

Do not open a public issue for a suspected vulnerability. Follow [SECURITY.md](SECURITY.md).

## Licensing

A project license has not yet been selected. By contributing before a license is added, you retain copyright in your contribution and agree that the project maintainers may review and discuss it, but no broader licensing assumption should be inferred. A formal contribution policy will be updated when the project license is selected.
