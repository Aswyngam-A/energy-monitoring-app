# M7 — Dashboard + hardening

**Status:** In progress

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
- 2026-11-16 — Started. Decisions: (1) **chart library = Recharts** (mainstream React charting; in Jest it needs fixed width/height because jsdom has no layout). (2) **Pagination shape = `{ items, page, size, total }`** (not headers: the body is self-describing and easy to type); `page` is 0-based, default `size` 20, max 100, bad values -> 400; applied to the three unbounded lists: sites, site readings, alerts (a breaking change for the frontend clients, handled in step 5). (3) Summary per site: `{ siteId, siteName, latestReading: { value, timestamp } | null, openAlerts }`, where `openAlerts` counts status OPEN only (same as the nav badge); the chart on the overview shows the last readings of the selected site, fetched from the paginated readings endpoint. (4) Hardening carried over from M5/M6: catch-all 500 mapper with the standard error body, a partial unique index (V5) so the database enforces "one active alert per sensor" (closes the dedup race), shared `LoadingState`/`ErrorMessage` components, alerts page shows site/sensor names if cheap.
- Plan: 1 pagination foundation (`Page` record, parameter parsing) + alerts list; 2 sites and site readings paginated; 3 `GET /dashboard/summary`; 4 backend hardening (500 mapper, V5 partial unique index + race test); 5 frontend clients and pagination controls adapted to the new shape; 6 shared LoadingState/ErrorMessage used by every page; 7 overview page + Recharts chart; 8 e2e happy path (site -> sensor -> reading -> alert -> acknowledge) + M7 close-out.
- 2026-11-16 — Step 1 done: PageParams + PageResponse, alerts paginated, 15 new tests; frontend listAlerts temporarily asks for size 100. All checks green (116 unit + 2 IT, 87 frontend, 20 e2e).
- 2026-11-16 — Step 2 done: sites (newest first) and site readings paginated, 7 tests, frontend clients bridged with size=100; all checks green (123 unit + 2 IT, 88 frontend, 20 e2e).
- 2026-11-16 — Step 3 done: GET /dashboard/summary with aggregate queries, 6 tests; all checks green (129 unit + 2 IT, 88 frontend, 20 e2e).
- 2026-11-16 — Step 4 done: catch-all 500 mapper, dedup race fixed (row lock + V5 partial unique index), 5 new tests; all checks green (135 unit + 2 IT, 88 frontend, 20 e2e). Backend complete.
- 2026-11-16 — Step 5 done: clients return pages, Pagination component, paging on sites/readings/alerts, alerts status filter server-side, badge from the server total; all checks green (135 unit + 2 IT, 95 frontend, 20 e2e).
- 2026-11-16 — Step 6 done: LoadingState and ErrorMessage used by every page, section and form; all checks green (135 unit + 2 IT, 102 frontend, 20 e2e).
- 2026-11-16 — Step 7 done: /dashboard with site cards and Recharts line chart, dashboard e2e; all checks green (135 unit + 2 IT, 114 frontend, 22 e2e).
