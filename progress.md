# EnergyWatch — Progress

**Current milestone:** M3 — Sensors, in progress (step 1 of 6 done)

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
| M1a | Local foundations | Done | [docs/milestones/M1a-local-foundations.md](docs/milestones/M1a-local-foundations.md) |
| M1b | Running it together | Done | [docs/milestones/M1b-running-together.md](docs/milestones/M1b-running-together.md) |
| M2 | Sites | Done | [docs/milestones/M2-sites.md](docs/milestones/M2-sites.md) |
| M3 | Sensors | In progress | [docs/milestones/M3-sensors.md](docs/milestones/M3-sensors.md) |
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
| ~~Frontend → API in dev~~ → **Vite proxy** `/api` → `localhost:8080` (already in `vite.config.ts`), Axios uses relative `/api/v1`, decided 2026-11-12 | M1a ✓ |
| How the frontend container reaches the API (proxy vs CORS) | M1b |
| ~~CI triggers and jobs~~ → push to `main` + PRs; backend and frontend jobs (2026-11-15). e2e job: step 5 | M1b (partly ✓) |
| E2E data reset between tests | M1b |
| Sensor auth: none (decided 2026-11-15) | M3 |
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
- 2026-11-12 — M1a step 3 done (written by user with step-by-step guidance): `ErrorResponse` record + `ErrorMapper` (`@ServerExceptionMapper` for `WebApplicationException`), `ErrorMapperTest`/`IT`. `./mvnw verify` green (2 + 2 tests). User not yet fully at ease with the mapper → revisit when M2 throws its first `NotFoundException`. Committed `10964c3`.
- 2026-11-12 — M1a frontend split in two: step 4 = Axios + API client + Home page showing health; step 5 = React Router + Layout. Step 4 started.
- 2026-11-14 — M1a step 4 done (written by user, reviewed): Axios installed, `api/client.ts` (instance, baseURL `/api/v1`), `api/health.ts`, `pages/HomePage.tsx` (loading / data / error), `HomePage.test.tsx` with mocked API, Vite demo + `App.test.tsx` removed. `npm run check` green (2 tests). Open: stray `”` in error text, unused `error` state value, manual browser check not yet confirmed. Note: user changed the error test from `/error/i` text to `findByRole('alert')` — accepted since it was the optional suggestion, but flagged.

- 2026-11-14 — M1a step 5 in progress. User wrote Layout/App tests + stubs. Jest could not load `react-router@8` (ESM-only, `import.meta`): after 3 failed config attempts, decided to pin `react-router@^7.18.5` (CommonJS). Jest config kept: `moduleResolution: Bundler` + `types` incl. `node` in `tsconfig.jest.json`, `TextEncoder`/`TextDecoder` polyfill in `jest.setup.ts`. Remaining failures are the intended red tests (stubs render null).
- 2026-11-14 — M1a step 5 done (written by user, reviewed): `Layout` (header, `NavLink`, `Outlet`), `NotFoundPage`, routes in `App.tsx`, `BrowserRouter` in `main.tsx`, tests with `MemoryRouter` + mocked API. `npm run check` green (3 suites, 5 tests); user confirmed the browser check. Backend re-verify not possible today: Docker Desktop was not running (Dev Services needs it). Last green backend verify: 2026-11-12, backend unchanged since.
- 2026-11-14 — **M1a done.** Docker back up: `./mvnw verify` green (ErrorMapper + HealthResource, Test + IT, 4 tests); `npm run check` green (5 tests). e2e starts in M1b.

- 2026-11-15 — M1b steps 1–3 done (written by user, reviewed): multi-stage backend Dockerfile, frontend Dockerfile + `nginx.conf` (reverse proxy `/api/` → `api:8080`, SPA fallback), `docker-compose.yml` (db with healthcheck + volume, api, web on :3000). Stack verified: health through nginx returns UP, Flyway connects to Postgres. Decision: reverse proxy, not CORS. Fixed `npm run typecheck` (`tsc -b`; verified it fails on a deliberate error). Next: CI backend + frontend jobs, then e2e, then e2e job.
- 2026-11-15 — M1b step 4 done (written by user, reviewed): `.github/workflows/ci.yml` with `backend` (`./mvnw verify -B`) and `frontend` (`npm ci`, `npm run check`) jobs; triggers: push to `main` + pull requests. Fix on review: `working-directory` is a key of `run` steps, not under `with:`. First run green on GitHub for both jobs. Next: e2e folder + smoke test, then add the e2e job.
- 2026-11-15 — **M1b done.** Steps 5–6 (written by user, reviewed): `e2e/` Playwright project (chromium, baseURL :3000), smoke test (home shows UP; verified failing with stack down, passing with it up), `e2e` CI job. Stray root-level npm files from running `npm init` in the wrong folder were removed. All three CI jobs green on GitHub. Local: `./mvnw verify` exit 0, `npm run check` green (5 tests), `playwright test` 1 passed. Open: e2e data reset (decide in M2 when data exists); optional api healthcheck + `compose up --wait` if CI timing ever flakes.
- 2026-11-15 — M2 step 1 done (written by user, reviewed): `Site` Panache entity (`com.energy.site`), `V1__create_site.sql` (table + `site_seq` INCREMENT 50 to match Hibernate's id allocation; no column DEFAULT), `SiteTest` (persist + read back, `@AfterEach` cleanup, `compareTo` for BigDecimal). Decisions: threshold = `NUMERIC(12,2)`/`BigDecimal`, no unit yet; no delete. `./mvnw verify` BUILD SUCCESS (3 unit + 2 IT). Note: Docker Desktop must be running for tests.
- 2026-11-15 — M2 step 2 done (written by user, reviewed): `SiteRequest`/`SiteResponse` records, `SiteResource` `POST /api/v1/sites` (201 + Location), Bean Validation (`@NotBlank` name, `@NotNull @Positive` threshold) with `quarkus-hibernate-validator`; `SiteResourceTest` (valid 201 + Location check, blank name, zero threshold, missing threshold, malformed JSON → 400). Lessons: constraints are type-bound (`@NotBlank` on BigDecimal → 500), `@Positive` allows null. `./mvnw verify` BUILD SUCCESS (7 unit + 2 IT).
- 2026-11-15 — M2 step 3 done (shared mode): `GET /sites`, `GET /sites/{id}` (404 via `NotFoundException`), `PUT /sites/{id}` (200/400/404, dirty-checking, no `persist()`), tests written by user; plus a second `@ServerExceptionMapper` for `ConstraintViolationException` so validation 400s use `ErrorResponse` (`details` = "field: message", field name cleaned). The mapper body was written by Claude at the user's request (exception to the shared-mode split) and explained; the user wrote its test. Finding: declaring `ConstraintViolationException` is enough, Quarkus's built-in mapper does not override it. `./mvnw verify` BUILD SUCCESS (14 unit + 2 IT). Backend of M2 complete; next: frontend (steps 4-5), e2e (step 6).
- 2026-11-15 — M2 step 4 done (shared mode): frontend `api/sites.ts` (`Site`/`SiteInput` types, `listSites`, `getSite`; `createSite`/`updateSite` still TODO stubs for step 5), `SitesListPage` (loading/error/empty/list, links to detail) and `SiteDetailPage` (`useParams`, `Number(id)`, loading/"Site not found"/back link), routes `/sites` and `/sites/:id`, "Sites" nav link, tests for both pages (`MemoryRouter`). List page + tests written by user (reviewed: fixed state/function name shadowing, `Site[]` return type, `${id}` template literal); detail page + its tests written by Claude at the user's request. `npm run check` green (5 suites, 11 tests). Next: step 5 create/edit form (learning mode), step 6 e2e.
- 2026-11-15 — **Working mode changed** (user decision): from M2 step 5 on, feedback loop (Claude writes tests first, then code until green; user studies the listed concepts outside the project). M2 step 5 done: `createSite`/`updateSite` (+ `api/sites.test.ts`), `SiteForm` component (controlled inputs, client-side validation: name required/trimmed, threshold > 0, submit error alert, disabled while submitting), `SiteNewPage` (`/sites/new`, navigates to the new site), `SiteEditPage` (`/sites/:id/edit`, prefilled, navigates back to detail), "New site" link on the list (also when empty), "Edit" link on the detail page. `npm run check` green (9 suites, 29 tests). Next: step 6 e2e (create a site, see it in the list) + e2e data-reset decision.
- 2026-11-15 — **M2 done.** Step 6 (feedback-loop mode): `e2e/tests/sites.spec.ts` (create a site and see it in the list, invalid form shows errors, edit renames a site). **e2e data-reset decision:** tests use unique site names and never assume an empty DB or clean up (no delete endpoint; CI starts fresh). Verified by running Playwright twice against the same database. All checks green: `./mvnw verify` (14 unit + 2 IT), `npm run check` (29 tests), `playwright test` (4 passed). Environment note: one `docker compose up --build` failed because Docker Desktop could not reach Docker Hub (network unreachable); a retry worked.
- 2026-11-15 — **M3 step 1 done.** Decided: no sensor auth; sensor fields = `name` (required) + `type` (optional text); unit left for M4. Added `SensorTest` (persist with site, optional type), `Sensor` entity (`@ManyToOne(fetch=LAZY)` to `Site`) and migration `V2__create_sensor.sql` (`sensor_seq` step 50, FK `site_id`, index). `./mvnw verify` green (16 unit + 2 IT). Next: step 2 POST /sites/{siteId}/sensors.

## Known issues / blocked
- None.
