# M3 — Sensors

**Status:** In progress

## Goal
Sensors can be registered to a site and are listed on the site page.

## In scope
| Item | Mode |
|---|---|
| `Sensor` entity with `@ManyToOne Site` + migration | L (first relationship), S (migration) |
| Nested endpoints under a site | S |
| Backend tests (201, 400, 404 for unknown site) | S |
| Frontend `api/sensors.ts` + sensors section and add-sensor form on site detail page | S |
| Frontend tests | S |
| e2e: register a sensor on a site | S |

## API contract (draft)
- `POST /api/v1/sites/{siteId}/sensors` `{ name, type? }` → 201 / 400 / 404
- `GET /api/v1/sites/{siteId}/sensors` → 200 / 404
- `GET /api/v1/sensors/{id}` → 200 / 404

## Concepts you'll meet
JPA relationships and foreign keys, lazy loading pitfalls when mapping to DTOs, nested REST resources; composing components on a page.

## Decide here
- Sensor authentication (proposal: none for this practice app).
- Sensor fields beyond name.

## Definition of done
All three CLAUDE.md checks green, output pasted, progress.md updated.

## Status log
- 2026-11-11 — Created.
- 2026-11-15 — Decided: no sensor auth; fields `name` (required) + `type` (optional); unit in M4.
- 2026-11-15 — Step 1 done: `Sensor` entity (`@ManyToOne` LAZY to `Site`) + `V2` migration + `SensorTest`; verify green.
- 2026-11-15 — Step 2 done: POST /sites/{siteId}/sensors (201 / 400 / 404) + 5 tests; verify green. Location points at /sensors/{id}, which step 3 implements.
- 2026-11-15 — Step 3 done: GET list (per site) and GET /sensors/{id}; 10 resource tests; verify green. Backend complete.
- 2026-11-15 — Step 4 done: api/sensors (list, get, create) + 4 tests; npm run check green (33 tests).
- 2026-11-15 — Step 5 done: SensorForm + SensorsSection on the site detail page, 10 new tests; npm run check green (43 tests). Remaining: step 6 e2e.
