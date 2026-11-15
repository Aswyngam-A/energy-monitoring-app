import { test, expect } from '@playwright/test';

  test('home page shows API status UP', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('UP')).toBeVisible();
  });
