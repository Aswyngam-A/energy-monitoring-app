import { test, expect } from '@playwright/test';

  // Smoke test: browser -> nginx -> API. UP means the whole chain works.
  test('home page shows API status UP', async ({ page }) => {
    await page.goto('/');
    // exact: Playwright's default text match is a case-insensitive substring, which would also
    // match the rail's "Updated 12:00:00" line and fail with a strict-mode violation.
    await expect(page.getByText('UP', { exact: true })).toBeVisible();
  });
