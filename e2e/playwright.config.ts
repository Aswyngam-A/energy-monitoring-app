import { defineConfig, devices } from '@playwright/test';

// Playwright runs against the full stack started by `docker compose up` (web on port 3000).
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
