# M6 — Alert lifecycle

**Status:** Not started

## Goal
Alerts can be acknowledged and resolved, filtered by status, and repeated breaches don't flood the list.

## In scope
| Item | Mode |
|---|---|
| Status enum (OPEN / ACKNOWLEDGED / RESOLVED) + migration | S (enum mapping = L) |
| `PATCH /alerts/{id}` with allowed transitions; 400 on illegal transition | S |
| Dedup rule in the ingestion service | S |
| `GET /alerts?status=` filter | S |
| Backend tests (transitions, dedup) | S |
| Ack/resolve buttons, status filter on alerts page | S |
| Frontend tests | S |
| e2e: acknowledge an alert | S |

## API contract (draft)
- `PATCH /api/v1/alerts/{id}` `{ status }` → 200 / 400 / 404
- `GET /api/v1/alerts?status=&siteId=` → 200

## Concepts you'll meet
State machines in code, `@Enumerated`, partial updates; optimistic UI updates vs refetch.

## Decide here
- Dedup: one alert per breaching reading, or one open alert per sensor until resolved.
- Can a resolved alert be reopened?

## Definition of done
All three CLAUDE.md checks green, output pasted, progress.md updated.

## Status log
- 2026-11-11 — Created.
