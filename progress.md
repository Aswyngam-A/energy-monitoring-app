# EnergyWatch — Progress

**Current milestone:** M1a — Local foundations (in progress)

## How we work
- **L — Learning mode** (first time a concept appears): Claude explains what/why/which files/new concepts step by step. You write the code. Claude reviews and explains each mistake.
- **S — Shared mode** (concept seen before): Claude writes the structure with `// TODO`s and explains each one. You write the business logic and at least one test. Claude runs the checks and fixes only what isn't yours.
- **I — Infra, taught** (compose, CI, Dockerfiles, Playwright config): Claude teaches the pieces, you write them, Claude verifies and corrects. Pure boilerplate is announced before Claude writes it.
- No file is written without its purpose being explained first.
- Every milestone after M1 ships backend + frontend + e2e for its feature.
- Open semantics are decided in the milestone where they come up.

## Milestones
| # | Milestone | Status | File |
|---|---|---|---|
| M1a | Local foundations | In progress | [docs/milestones/M1a-local-foundations.md](docs/milestones/M1a-local-foundations.md) |
| M1b | Running it together | Not started | [docs/milestones/M1b-running-together.md](docs/milestones/M1b-running-together.md) |
| M2 | Sites | Not started | [docs/milestones/M2-sites.md](docs/milestones/M2-sites.md) |
| M3 | Sensors | Not started | [docs/milestones/M3-sensors.md](docs/milestones/M3-sensors.md) |
| M4 | Readings ingestion | Not started | [docs/milestones/M4-readings.md](docs/milestones/M4-readings.md) |
| M5 | Alerts | Not started | [docs/milestones/M5-alerts.md](docs/milestones/M5-alerts.md) |
| M6 | Alert lifecycle | Not started | [docs/milestones/M6-alert-lifecycle.md](docs/milestones/M6-alert-lifecycle.md) |
| M7 | Dashboard + hardening | Not started | [docs/milestones/M7-dashboard-hardening.md](docs/milestones/M7-dashboard-hardening.md) |

## Open questions (decide when the milestone needs them)
| Question | Decide in |
|---|---|
| ~~Test DB~~ → **Quarkus Dev Services (PostgreSQL 18 in Docker)**, decided 2026-11-11 | M1a ✓ |
| ~~Error body shape~~ → **`{ status, error, message, details[] }`** (custom record, not RFC 9457), decided 2026-11-12 | M1a ✓ |
| ~~Run `*IT` tests in verify?~~ → **Yes**, `skipITs=false` in pom, decided 2026-11-12 | M1a ✓ |
| Frontend → API: Vite dev proxy or `VITE_API_URL`; CORS | M1a / M1b |
| CI triggers and jobs; does CI run e2e? | M1b |
| E2E data reset between tests | M1b |
| Sensor auth (none assumed) | M3 |
| Reading units; timestamp client- or server-set; UTC | M4 |
| Threshold comparison `>` or `>=`; per-site only? | M5 |
| Alert dedup: one per reading or one open per sensor | M6 |
| Chart library | M7 |
| "3 attempts" rule: per check or per task? | Any time |

## Log
- 2026-11-11 — Planning docs created. Verified frontend tooling: `ts-jest@29.4.15` supports `jest@30` (peer `^29 || ^30`), `npm run check` green, no version change needed. Git repo initialised locally.
- 2026-11-11 — Initial commit `d70d1bb` pushed to `origin/main`. M1a started (step 1: backend persistence dependencies, learning mode).
- 2026-11-11 — M1a step 1 done (written by user, no corrections): Panache, JDBC PostgreSQL, Flyway (+ flyway-postgresql) added; datasource kind, Flyway migrate-at-start, Hibernate schema strategy `none` configured. `./mvnw verify` green with Dev Services.
- 2026-11-12 — M1a step 2 done (written by user, reviewed): `GET /api/v1/health` via `quarkus.rest.path=/api/v1`, `HealthResponse` record, `HealthResourceTest` with `@TestHTTPEndpoint`, Greeting scaffold removed. Duplicate nested `HealthResponse` removed by user.
- 2026-11-12 — Enabled integration tests (`skipITs=false`). `./mvnw verify` green: `HealthResourceTest` (Surefire) + `HealthResourceIT` (Failsafe, packaged app).
- 2026-11-12 — M1a step 3 done (written by user with step-by-step guidance): `ErrorResponse` record + `ErrorMapper` (`@ServerExceptionMapper` for `WebApplicationException`), `ErrorMapperTest`/`IT`. `./mvnw verify` green (2 + 2 tests). User not yet fully at ease with the mapper → revisit when M2 throws its first `NotFoundException`.

## Known issues / blocked
- None.
