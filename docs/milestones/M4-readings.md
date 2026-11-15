# M4 — Readings ingestion

**Status:** In progress

## Goal
Sensors post readings; the site page shows recent readings, filterable by time range.

## In scope
| Item | Mode |
|---|---|
| `Reading` entity + migration (index on sensor + timestamp) | S |
| `POST` reading endpoint with validation | S |
| Time-range query with `@QueryParam` | L (first query params) |
| Backend tests | S |
| Frontend `api/readings.ts` + readings table on site page with from/to filter | S |
| Date/time handling in the UI | L |
| Frontend tests | S |
| e2e: post a reading via API → visible in UI | S (first API call from Playwright = L) |

## API contract (draft)
- `POST /api/v1/sensors/{sensorId}/readings` `{ value, timestamp? }` → 201 / 400 / 404
- `GET /api/v1/sites/{siteId}/readings?from=&to=` → 200 / 400 (bad range) / 404

## Concepts you'll meet
`Instant` / ISO-8601 in JSON, Panache queries with parameters, DB indexes; formatting dates in React, Playwright `request` fixture.

## Decide here
- Reading unit (W, kW, kWh).
- Timestamp: client-supplied, server-set, or optional client value.
- Reject future / very old readings?

## Definition of done
All three CLAUDE.md checks green, output pasted, progress.md updated.

## Status log
- 2026-11-11 — Created.
- 2026-11-15 — Decided: unit = kW by convention (not stored); timestamp optional (default server time, UTC Instant); reject > 5 min in the future, accept old; value >= 0, NUMERIC(12,3).
- 2026-11-15 — Step 1 done: `Reading` entity + `V3` migration (index on sensor_id, recorded_at) + `ReadingTest`; verify green.
- 2026-11-15 — Step 2 done: POST /sensors/{sensorId}/readings (201 / 400 / 404), timestamp rules, 11 tests; verify green.
- 2026-11-15 — Step 3 done: GET /sites/{siteId}/readings?from=&to= (inclusive range, newest first, 400 / 404), `sensorName` added to the response; 12 tests; verify green. Backend complete. Known gap: no result limit yet.
- 2026-11-16 — Step 4 done: api/readings (listSiteReadings with optional range, createReading) + 5 tests; npm run check green (48 tests).
- 2026-11-16 — Step 5 done: readings table + UTC from/to filter on the site page, date helpers; 15 new tests; npm run check green (63 tests). Decided: UI times are UTC. Remaining: step 6 e2e.
