import { test, expect } from '@playwright/test';

// The home page is the landing page: live numbers from the real API and a way into the app.
test('home shows the live numbers and the live-demo button opens the dashboard', async ({ page, request }) => {
  // One site, so the "Sites monitored" figure is at least 1 whatever else exists.
  const name = `e2e-home-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
  expect((await request.post('/api/v1/sites', { data: { name, threshold: 100 } })).status()).toBe(201);

  await page.goto('/');

  const numbers = page.getByRole('region', { name: 'Live numbers' });
  await expect(numbers.getByText('Sites monitored')).toBeVisible();
  await expect(numbers.getByText('Load right now')).toBeVisible();
  await expect(page.getByRole('list', { name: 'How it works' })).toBeVisible();

  await page.getByRole('link', { name: 'Open the live demo' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
