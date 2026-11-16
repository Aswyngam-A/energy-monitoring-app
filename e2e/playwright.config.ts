import { defineConfig, devices } from '@playwright/test';

// Playwright runs against the full stack started by `docker compose up` (web on port 3000), or
// against the throw-away e2e stack (`npm run test:fresh`, web on port 3100) through E2E_BASE_URL.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  // Waits for the API to be up before the first test.
  globalSetup: './global-setup.ts',
  use: {
    baseURL,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
