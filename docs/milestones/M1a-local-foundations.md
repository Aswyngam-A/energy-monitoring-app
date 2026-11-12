# M1a — Local foundations

**Status:** Not started

## Goal
Backend and frontend can talk to each other locally: the backend has persistence wired and a health endpoint, the frontend calls it through Axios and shows the result on a routed page. No business feature yet.

## In scope
| Item | Mode |
|---|---|
| Confirm frontend tooling (`npm ls jest ts-jest`, `npm run check`) — done 2026-11-11, no change needed | — |
| Add Hibernate ORM Panache, PostgreSQL JDBC driver, Flyway dependencies to `backend/pom.xml` | L |
| Configure datasource in `application.properties` (dev/test profiles) | L |
| `GET /api/v1/health` returning a JSON record; remove `GreetingResource` + its tests | L |
| First `@QuarkusTest` + RestAssured test for health (written first, fails, then passes) | L |
| `ErrorResponse` record + exception mapper for consistent 400/404 bodies | L |
| Frontend: add Axios + React Router | L |
| Frontend: `src/api/client.ts` (Axios instance, base URL `/api/v1`) | L |
| Frontend: Layout + Home page showing API health, first RTL test with mocked API | L |

## Out of scope
Docker, compose, CI, e2e (→ M1b). Any entity.

## API contract (draft)
- `GET /api/v1/health` → `200 { "status": "UP" }`

## Concepts you'll meet
Quarkus extensions & profiles, CDI (`@ApplicationScoped`), JAX-RS resources, Java records as DTOs, Quarkus Dev Services, Flyway, RestAssured; Axios instances, React Router routes, mocking modules in Jest.

## Tests to write first
- Backend: `HealthResourceTest` — 200 and body `status = UP`.
- Frontend: `HomePage.test.tsx` — renders "UP" when API mock resolves, error message when it rejects.

## Decide here
- Test DB: Dev Services (needs Docker running) or other.
- Error body shape (proposal: `{ "status": 400, "error": "Bad Request", "details": ["..."] }`).
- Vite dev proxy for `/api` vs `VITE_API_URL`.

## Definition of done
- `cd backend && ./mvnw verify` green
- `cd frontend && npm run check` green
- (e2e starts in M1b)
- Output pasted, progress.md updated.

## Status log
- 2026-11-11 — Created.
- 2026-11-11 — Step 1 (persistence dependencies + config) done by user, reviewed, `./mvnw verify` green. Decision: tests use Dev Services.
- 2026-11-12 — Step 2 (health endpoint + first @QuarkusTest) done by user, reviewed, `./mvnw verify` green. Lessons: class name vs file name, static imports, package = folder, `quarkus.rest.path` vs RestAssured base path, `@TestHTTPEndpoint`. Found: `*IT` tests were skipped by `skipITs=true` in the pom → enabled (`skipITs=false`); IT now runs and passes.
