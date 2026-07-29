# Security policy

## Project maturity

genposed is currently an early prototype and is not production-ready. Authentication, authorization, secret encryption, agent identity, tenant isolation, and deployment policy enforcement are not yet complete.

Do not expose the prototype directly to the public internet or grant it access to production Docker environments.

## Reporting a vulnerability

Do not report vulnerabilities through public GitHub issues, discussions, pull requests, or chat channels.

Use GitHub's private vulnerability reporting feature for this repository when it is enabled. If private reporting is unavailable, contact the repository owner privately through a verified channel listed on the maintainer's GitHub profile.

Include:

- affected branch, commit, or version;
- impact;
- reproduction steps;
- required access level;
- logs or proof of concept with secrets removed;
- suggested mitigation when known.

Do not access data that is not yours, persist access, disrupt services, or publish details before remediation coordination.

## Response expectations

Because the project is pre-release and currently maintained on a best-effort basis, fixed response-time guarantees are not yet offered. Reports will be acknowledged and triaged as capacity permits.

## Security-sensitive areas

Extra care is required for changes involving:

- Docker or BuildKit sockets;
- agent enrollment and command execution;
- provider, registry, or runner credentials;
- webhook verification;
- secrets and environment variables;
- Compose policy exceptions;
- interactive exec;
- proxy and DNS configuration;
- source archives and build contexts;
- tenant scoping;
- browser routing or update headers;
- database migrations.

See [docs/SECURITY_ARCHITECTURE.md](docs/SECURITY_ARCHITECTURE.md) for the intended model.
