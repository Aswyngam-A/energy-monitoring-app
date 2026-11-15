import { test, expect } from '@playwright/test';

  // Smoke test: browser -> nginx -> API. UP means the whole chain works.
  test('home page shows API status UP', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('UP')).toBeVisible();
  });
