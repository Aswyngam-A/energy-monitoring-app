# M1b — Running it together

**Status:** Done (2026-11-15)

## Goal
The whole stack runs with `docker compose up -d`, a Playwright smoke test passes against it, and CI runs all checks on every push.

## In scope
| Item | Mode |
|---|---|
| Backend Dockerfile — Quarkus already ships `src/main/docker/Dockerfile.jvm`; we'll walk through it and decide whether to reuse it | I (boilerplate, announced) |
| Frontend Dockerfile (build with Node, serve static files) | I |
| `docker-compose.yml`: postgres + api + frontend, env vars, ports, healthchecks, depends_on | I |
| `e2e/` folder: `package.json`, `playwright.config.ts` | I |
| First Playwright test: home page shows API status "UP" | L |
| `.github/workflows/ci.yml`: backend job, frontend job, (e2e job?) | I |
| Root `.gitignore` additions for e2e output | I |

## Out of scope
Any business feature.

## Concepts you'll meet
Multi-stage Docker builds, compose services/networks/volumes/healthchecks, container env config for Quarkus (`QUARKUS_DATASOURCE_*`), Playwright config (baseURL, projects), GitHub Actions (triggers, jobs, steps, caching, services).

## Tests to write first
- `e2e/tests/smoke.spec.ts` — open `/`, expect "UP".

## Decide here
- Ports exposed by compose.
- CORS vs reverse proxy (frontend container proxying `/api`).
- CI triggers (push / PR, which branches); whether CI runs e2e via compose.
- How e2e resets data between runs.

## Definition of done
- `cd backend && ./mvnw verify` green
- `cd frontend && npm run check` green
- `docker compose up -d && cd e2e && npx playwright test` green
- CI workflow file reviewed (green on first push once the remote is set)
- Output pasted, progress.md updated.

## Status log
- 2026-11-11 — Created.
- 2026-11-14 — Ready to start (M1a done). Notes: Quarkus has the `compose` feature enabled, so check how it interacts with a `docker-compose.yml` in dev mode. Also fix `npm run typecheck` (root tsconfig has `files: []`, so it checks nothing) and consider starting Docker Desktop at login.
- 2026-11-15 — Steps 1–4 done: backend/frontend Dockerfiles, nginx reverse proxy (decision: proxy, not CORS; web on :3000), docker-compose.yml, typecheck fixed, CI backend + frontend jobs green. Remaining: e2e folder + smoke test, e2e job in CI, data-reset decision.
- 2026-11-15 — **Done.** e2e folder + smoke test, e2e CI job green. All three checks green locally and in CI.
