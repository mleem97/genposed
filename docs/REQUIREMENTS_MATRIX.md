# Requirements and delivery status

This matrix reconciles the owner brief, the Handoff dated 2026-11-10, the Concepts Brief, the Goldfish review, existing ADRs, and the prototype. It records requirements as pending until code and verification demonstrate completion. “Planned” is not an implementation claim.

## Product requirements

| ID | Requirement | Acceptance evidence | Current status |
| --- | --- | --- | --- |
| UX-01 | Make the common operator journey short and understandable. | Task-based usability review covers install, project setup, deploy, status, basic operations, and recovery; actionable failures are verified. | Planned; prototype UI only. |
| OWN-01 | Separate operator-owned and customer-owned projects. | Persisted ownership is checked on every API and execution boundary; cross-scope reads and writes are denied in negative tests. | Not implemented. |
| ACC-01 | Operator chooses whether each customer gets UI access. | Invitation, disable/revoke, and session behavior are tested; disabled customers cannot use APIs. | Not implemented. |
| RBAC-01 | Customer basic actions include start, stop, and restart; advanced actions use RBAC. | Server and agent enforce default-deny scoped permissions; positive and negative tests cover each action. | Not implemented. |
| GIT-01 | Deploy from GitHub and Forgejo/Gitea. | Versioned provider adapters, credential handling, webhook verification, immutable revision selection, retry/idempotency, and failure tests. | Not implemented. |
| DNS-01 | Automate Cloudflare DNS; assess other useful Cloudflare functions. | Least-privilege credential flow, planned change review, idempotent apply, partial-failure recovery, and audit tests. | Not implemented; scope open. |
| SEC-01 | Prefer rootless runtime and builds; never silently weaken isolation. | Capability probes and enforcement tests show rejection when policy cannot be met and explicit approval for configured exceptions. | Not implemented. |
| ISO-01 | Assign eligible dedicated server or VM execution profiles per customer/project; reject when none is safe. | Target selection is bound to policy and workload digest; cross-customer isolation is tested on supported targets. | Not implemented; boundary details open. |
| CMP-01 | Support the agreed Compose workload set with visible target limits. | Versioned support matrix, lossless import/edit/export guarantees, target validation, and positive/negative tests for every supported field family. | Partial prototype; support set open. |
| SEC-02 | Keep customer data, secrets, workloads, and resources separated. | Threat model plus independent tests of API, database, agent, runtime, build, logs, caches, and artifacts. | Not implemented. |
| INT-01 | Evaluate Doppler and Infisical integrations. | Approved scope and versioned adapters; secret values never appear in logs; denial, rotation, and provider-failure tests. | Planned; scope open. |
| LUNA-01 | Keep Luna separate, optional, and independently releasable; integrate through versioned contracts. | Genposed installs and operates without Luna; contract compatibility and identity/scope mapping have integration tests. | Planning direction selected; implementation absent. |
| REC-01 | Back up and restore control plane, keys, agent identity, and supported application data before production release. | Clean-environment restore exercises meet documented RPO/RTO and prove usable workloads and rotated/recovered identities. | Not implemented; objectives open. |

## Quality gates

| ID | Gate | Acceptance evidence | Current status |
| --- | --- | --- | --- |
| COV-01 | 100% statement, branch, function, and line coverage for all material production code, enforced in CI. | Coverage inventory names every runtime and file class; CI fails below 100%; generated/uninstrumentable code has explicit, justified verification methods. | The existing `userinterface` runtime passes: 21 files, 125 tests, 100% statements (1440/1440), branches (1167/1167), functions (339/339), and lines (1273/1273). The threshold is 100% for all four metrics and CI invokes it. This does not satisfy whole-project coverage: server, database, agents, and deployment runtimes do not exist yet. See the inventory below for non-instrumented file classes and evidence. |
| DEDUP-01 | Remove duplicate implementations and competing sources of truth without losing history, data, or independent security tests. | Repository and active branch review records candidates, decisions, and retained rationale; no duplicate behavior remains without an explicit reason. | Initial working-tree and remote-branch audit recorded below. UI duplicate error formatting, schema sync entry point, redundant UI action guards, and impossible fallback branches were consolidated. Architecture and tenancy docs now place operator/customer scopes in the first usable release. No production backend/runtime exists to audit. A semantic audit of all documentation claims and branch-specific code remains pending. |
| DOC-01 | Requirements, decisions, implementation, and tests remain traceable. | Each requirement links to design/code and positive and negative evidence; unresolved questions remain visibly open. | This matrix is the initial baseline. |

## Repository and branch audit

- At inspection, `main` is at `de2e91e` and equals `origin/main`; no other local branch exists. Existing worktree changes are preserved and remain uncommitted.
- Remote feature branches `origin/feat/compose-file-workspace`, `origin/feat/compose-policy-engine`, `origin/feat/structured-compose-editor`, `origin/feat/service-management`, `origin/feat/top-level-resources`, and `origin/feat/schema-field-metadata` are independent UI feature histories. Tree comparisons show each branch contains a different subset of the additions relative to `origin/in-dev-v1`; none is a superset of all the others. `origin/in-dev-v1` is a July 2026 prototype baseline. The local `userinterface/` is an untracked combined working copy with additional tests/refactors; feature branches were not merged or cherry-picked to avoid dropping independent features or changing history.
- Broader README claims about GitLab, Codeberg, native runners, and rollout strategies are product directions, not first-release commitments. They remain explicitly separated from the first usable release scope. Documentation now states that the current UI is in `userinterface/` on this worktree, not on an unspecified development branch.
- Roadmap Phase 8 now describes expanded independent workspaces; operator/customer scopes and safe target execution are first-release prerequisites. Tested restore remains a pre-production gate.
- ADR 0003 governs builder isolation and explicitly rejects a shared rootful daemon for unrelated tenants. Runtime isolation is not yet decided by that ADR; do not imply that rootless or RBAC alone is a customer boundary.
- The main branch contains no production service, API, database, worker, or agent. The only executable application is the Next.js prototype in `userinterface/`.

## Coverage inventory and evidence

The `userinterface` Vitest gate includes `lib/**/*.ts`, `components/**/*.tsx`, `app/**/*.tsx`, `scripts/**/*.mjs`, `next.config.ts`, and `postcss.config.mjs`. It runs in `.github/workflows/userinterface-ci.yml`; the test, typecheck, coverage, and production build steps are all required. Schema synchronization tests replace network and filesystem operations with controlled fakes, so they verify branching and error handling without modifying generated artifacts or depending on remote availability.

| File class | Coverage treatment | Evidence / limit |
| --- | --- | --- |
| TypeScript and TSX runtime, plus executable MJS scripts | Included, 100% all four metrics | Vitest + V8 report; `pnpm typecheck`; production build. |
| Next.js and PostCSS config modules | Included; their exported settings are asserted in `tests/config.test.ts` | Build also exercises framework and PostCSS loading. This does not cover framework internals. |
| `next-env.d.ts`, `*.d.mts`, and other declaration files | No executable statements to instrument | `pnpm typecheck` validates consumers; declarations are not presented as runtime coverage. |
| CSS | Not executable JavaScript and not statement-instrumentable | Production build proves CSS imports and PostCSS compilation. It does not prove visual correctness; rendered-browser/visual checks are still needed for that claim. |
| `package.json`, pnpm workspace/lock data, YAML workflow, Markdown, and schema/reference data | Declarative or documentation inputs, not runtime source | Dependency installation, CI execution, typecheck, tests, and build validate the paths that consume these inputs. Documentation and requirement consistency are reviewed in the matrix. No claim of line coverage is made for these files. |
| Generated schema data | No generated JSON payload is currently checked in; only the schema policy README exists | The generator's transformation/error paths are unit-tested with fakes. A real schema refresh and compatibility check remain operational evidence to perform when the generated artifacts are introduced. |
| Other runtimes (API, persistence, worker, agent, builder, deployment) | Not present; no meaningful coverage denominator yet | Their implementation requires separate runtime gates, integration/security tests, and restore/system tests before production. |

The instrumented UI slice is complete, but the Handoff's whole-project criterion remains open until all required runtimes exist and have their own gates. Never aggregate this UI percentage as overall product coverage.

## Next implementation order

1. Finish a semantic audit of documentation claims and branch-specific code; preserve unresolved product options as proposals.
2. Define and implement the server, persistence, and agent runtime boundaries, with 100% coverage gates per runtime and integration/system evidence for isolation and restore.
3. Select supported targets and formalize the authorization, approval, audit, and per-project execution-isolation contracts before enabling customer execution.
4. Implement server persistence and authentication/scope enforcement, then Compose model/editor, Git deployment, and target-bound runtime operations.
5. Implement secret/DNS integrations, Luna contracts, tested backup/restore, and production release gates.
