# M7 — Dashboard + hardening

**Status:** Not started

## Goal
An overview page shows each site's latest reading, a chart, and open-alert counts; list endpoints are paginated; the UI handles loading and errors consistently.

## In scope
| Item | Mode |
|---|---|
| Summary endpoint (per site: latest reading, open alerts) | S (aggregate query = L) |
| Pagination on list endpoints (`page`, `size`) | L |
| Backend tests | S |
| Overview page + chart | S (chart library = L) |
| Shared loading / error components used everywhere | S |
| Frontend tests | S |
| e2e: full happy path site → sensor → reading → alert → acknowledge | S |

## API contract (draft)
- `GET /api/v1/dashboard/summary` → 200 `[ { siteId, siteName, latestReading, openAlerts } ]`
- List endpoints accept `?page=&size=` (response shape decided here)

## Concepts you'll meet
Aggregate/projection queries in Panache, pagination conventions; charting in React, reusable UI states.

## Decide here
- Chart library.
- Pagination response shape (array + headers, or `{ items, total }`).

## Definition of done
All three CLAUDE.md checks green, output pasted, progress.md updated.

## Status log
- 2026-11-11 — Created.
