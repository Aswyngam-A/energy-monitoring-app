# M4 — Readings ingestion

**Status:** Not started

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
