# EnergyWatch

Energy-monitoring practice app: sensors send readings, the API stores them and raises alerts above a per-site threshold, a React dashboard shows readings and alerts.

## Stack
- backend : Java 21, Quarkus, REST, Hibernate ORM Panache, PostgreSQL
- frontend : React, TypeScript, Vite, Axios, React Router
- Tests: JUnit 5, @QuarkusTest + RestAssured, Jest + React Testing Library, Playwright
- docker-compose.yml runs api + frontend + postgres
- CI: .github/workflows/ci.yml

## How to verify your work (run these yourself, every time)
- Backend: `cd backend && ./mvnw verify`
- Frontend: `cd frontend && npm run check`   (lint + typecheck + Jest)
- End-to-end: `docker compose up -d && cd e2e && npx playwright test`

## Working rules
- For every feature: write the failing test first, then the code until it passes.
- You are done only when ALL checks above are green. Paste the final output.
- If the same check still fails after 3 attempts, stop and explain what you tried.
- Keep changes small and focused on the current task. No unrelated refactors.
- Never commit or push without my approval.
- Never weaken or delete a test to make it pass. Fix the code, or ask me.
- Update progress.md and the current milestone file at the end of each task.

## API conventions
- Base path /api/v1, JSON, proper status codes (201 on create, 400 on invalid input, 404 if missing)
- Records for request/response DTOs; never expose entities directly
