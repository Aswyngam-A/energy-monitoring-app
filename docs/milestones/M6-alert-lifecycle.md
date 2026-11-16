# M6 — Alert lifecycle

**Status:** Done

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
- 2026-11-16 — Started. Decisions: (1) dedup = one active alert per sensor: a breaching reading creates no new alert while that sensor has an alert that is OPEN or ACKNOWLEDGED; once it is RESOLVED the next breach raises a new one (the reading is still stored). (2) No reopening: RESOLVED is final. Transitions: OPEN->ACKNOWLEDGED, OPEN->RESOLVED, ACKNOWLEDGED->RESOLVED; anything else (incl. same status) -> 400.
- Plan: 1 `AlertStatus` + pure `AlertTransitions` rule + unit tests; 2 `PATCH /alerts/{id}` (200/400/404); 3 dedup in `AlertService`; 4 `GET /alerts?status=`; 5 frontend API client (`updateAlertStatus`, status param) + alerts page buttons and filter (refetch after change, badge counts only OPEN so the shared state needs a refresh); 6 e2e + close-out.
- 2026-11-16 — Step 1 done: enum values, `AlertTransitions` + 8 unit tests; verify green (84 unit + 2 IT).
- 2026-11-16 — Step 2 done: PATCH /alerts/{id} (200/400/404), 9 tests; verify green (93 unit + 2 IT).
- 2026-11-16 — Step 3 done: dedup per sensor in AlertService, 4 new ingestion tests replacing the pre-M6 one; all checks green (96 unit + 2 IT, 77 frontend, 16 e2e).
- 2026-11-16 — Step 4 done: GET /alerts?status= (combines with siteId), 5 tests; all checks green (101 unit + 2 IT, 77 frontend, 16 e2e). Backend complete.
- 2026-11-16 — Step 5 done: updateAlertStatus, changeStatus with refetch in the provider, status filter (client-side) and Acknowledge/Resolve buttons; 12 new tests; all checks green (101 unit + 2 IT, 87 frontend, 16 e2e).
- 2026-11-16 — Step 6 done: e2e `alert-lifecycle.spec.ts` (4 tests); all checks green (101 unit + 2 IT, 87 frontend, 20 e2e). **M6 done.**
