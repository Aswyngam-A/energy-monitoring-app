# M2 — Sites

**Status:** In progress (step 4 of 6 done)

## Goal
A user can create, list, view and edit sites (name + alert threshold) from the dashboard.

## In scope
| Item | Mode |
|---|---|
| `Site` entity (Panache) + first Flyway migration | L |
| Request/response records + Bean Validation (`@NotBlank`, `@Positive`) | L |
| `SiteResource`: create / list / get / update, 201 / 400 / 404 | L |
| Backend tests for each status code | L (first one), S (rest) |
| Frontend `api/sites.ts` | S |
| Sites list page, site detail page (routes with params) | S |
| Create/edit site form with client-side validation | L (first form) |
| Frontend tests for list + form | S |
| e2e: create a site → appears in list | S |

## Out of scope
Sensors, readings, delete (unless we decide otherwise).

## API contract (draft)
- `POST /api/v1/sites` `{ name, threshold }` → 201 + `Location` header + body
- `GET /api/v1/sites` → 200 `[ ... ]`
- `GET /api/v1/sites/{id}` → 200 / 404
- `PUT /api/v1/sites/{id}` → 200 / 400 / 404

## Concepts you'll meet
Panache entities vs repositories, Flyway migration naming, `@Transactional`, Bean Validation, mapping entity ↔ record, `Response.created(...)`; controlled forms in React, `useParams`, `useNavigate`.

## Tests to write first
- `POST` valid → 201; missing name → 400; negative threshold → 400; `GET` unknown id → 404.
- Form shows validation errors and calls API on valid submit.

## Decide here
- Threshold type (decimal?) and whether it has a unit label (unit itself decided in M4).
- Delete sites: yes/no.

## Definition of done
All three CLAUDE.md checks green, output pasted, progress.md updated.

## Status log
- 2026-11-11 — Created.
- 2026-11-15 — Step 1 done: `Site` entity + `V1` migration + `SiteTest`; verify green. Decided: threshold `NUMERIC(12,2)`, no unit yet, no delete.
- 2026-11-15 — Step 2 done: POST /sites with validation + 4 tests (+ malformed JSON); verify green.
- 2026-11-15 — Step 3 done: GET list/get/PUT + validation exception mapper (ErrorResponse shape for 400); 11 resource tests; verify green. Backend complete.
- 2026-11-15 — Step 4 done: api/sites (list/get), list + detail pages with tests, routes and nav; `npm run check` green (11 tests). `createSite`/`updateSite` are stubs until step 5.
