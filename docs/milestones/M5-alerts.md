# M5 — Alerts

**Status:** In progress

## Goal
A reading above its site's threshold raises an alert; alerts are visible on an alerts page and as a badge.

## In scope
| Item | Mode |
|---|---|
| `Alert` entity + migration | S |
| Threshold check during ingestion, in a service class | L (first service with business rule) |
| Unit test of the threshold rule (plain JUnit, no Quarkus) | L |
| `GET /alerts` with optional `siteId` filter | S |
| Integration tests: reading above → alert; below → none | S |
| Frontend `api/alerts.ts`, alerts page, nav badge with count | S |
| Frontend tests | S |
| e2e: reading above threshold → alert shown | S |

## API contract (draft)
- `GET /api/v1/alerts?siteId=` → 200
- Alert body: `{ id, siteId, sensorId, readingId, value, threshold, createdAt, status }`

## Concepts you'll meet
Service layer vs resource, transaction boundaries, plain unit tests vs `@QuarkusTest`; shared state across components (badge + page).

## Decide here
- Comparison `>` vs `>=`.
- Threshold per site only, or sensor override.

## Definition of done
All three CLAUDE.md checks green, output pasted, progress.md updated.

## Status log
- 2026-11-11 — Created.
- 2026-11-16 — Decided: strictly `>`; threshold per site only; one alert per breaching reading; alert snapshots value + threshold; status enum with only OPEN (text column); reading + alert in one transaction.
- 2026-11-16 — Step 1 done: `ThresholdRule` + 8 plain-JUnit tests; verify green.
- 2026-11-16 — Step 2 done: `Alert` entity, `AlertStatus` (OPEN), `V4` migration, `AlertTest`; verify green.
- 2026-11-16 — Step 3 done: `AlertService` + `ReadingService` (ingestion raises alerts, one transaction), resource slimmed to HTTP concerns, 6 integration tests; verify green.
- 2026-11-16 — Step 4 done: GET /alerts?siteId= (newest first, 400 / 404), `AlertResponse`, 7 tests; verify green. Backend complete. Note: a failed `@QueryParam Long` conversion gives 404, so the id is parsed by hand.
- 2026-11-16 — Step 5 done: api/alerts, alerts page, route and nav link, 10 new tests; npm run check green (72 tests). Remaining: step 6 badge, step 7 e2e.
