# EnergyWatch frontend

The React + TypeScript + Vite app of EnergyWatch. The project overview, screenshots, quick start and
architecture are in the [root README](../README.md).

## Working on the frontend

```bash
npm install
npm run dev      # Vite dev server; /api is proxied to the backend on http://localhost:8080
npm run check    # lint + type check + Jest (run this before every commit)
npm run build    # type check and production build into dist/
```

For the full stack (database, API and this app behind nginx on http://localhost:3000), run
`docker compose up -d --build` from the repository root.

## Where things live

```
src/pages/        one component per route (Home, Dashboard, Sites, Alerts...)
src/components/   shared pieces (Layout, Pagination, StatusChip, Sparkline, ReadingsChart...)
src/api/          typed wrappers around the backend endpoints (one module per resource)
src/hooks/        usePolling (30 s refresh), useTheme (light/dark)
src/context/      AlertsContext: the open-alert count shared by the nav and the Alerts page
src/index.css     design tokens (colours, spacing, fonts) for both themes
src/App.css       component styles, using only those tokens
src/siteInfo.ts   links shown on the Home page (source code, contact)
```

Tests sit next to the code they cover (`*.test.ts(x)`); the browser tests are in `../e2e`.
