import { test, expect } from '@playwright/test';

// The whole product in one journey (the M7 "happy path"): a user creates a site and registers a
// sensor in the browser, a reading above the threshold arrives, and the user sees the alert on
// every screen that should show it and acknowledges it.
//
// Most behaviour is covered in detail by the other specs; this one proves the pieces work TOGETHER
// across pages: site form -> sensor form -> reading -> alert -> site page -> dashboard -> alerts
// page -> acknowledge -> dashboard again.
//
// Sensors send readings over HTTP and the UI has no form for that, so that one step goes through
// the API (Playwright's `request` fixture). As in the other specs, the site has a unique name and
// every assertion looks only at this test's own site, never at totals.

test('create site, register sensor, receive an over-threshold reading, see the alert, acknowledge it', async ({ page, request }) => {
  const siteName = `e2e-journey-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  // 1. Create the site through the UI. Its id is in the URL of the page the app opens.
  await page.goto('/sites/new');
  await page.getByLabel('Name').fill(siteName);
  await page.getByLabel('Threshold').fill('100');
  await page.getByRole('button', { name: 'Create site' }).click();
  await expect(page.getByRole('heading', { name: siteName })).toBeVisible();
  const siteId = Number(new URL(page.url()).pathname.split('/').pop());

  // 2. Register a sensor through the UI.
  await page.getByLabel('Name', { exact: true }).fill('Journey meter');
  await page.getByRole('button', { name: 'Add sensor' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Journey meter' })).toBeVisible();

  // 3. The sensor sends a reading above the threshold (100): 130.5 kW.
  const sensors = await (await request.get(`/api/v1/sites/${siteId}/sensors`)).json();
  const reading = await request.post(`/api/v1/sensors/${sensors[0].id}/readings`, { data: { value: 130.5 } });
  expect(reading.status()).toBe(201);

  // 4. The reading shows on the site page.
  await page.reload();
  await expect(page.getByRole('row').filter({ hasText: 'Journey meter' })).toContainText('130.5');

  // 5. The dashboard shows the latest reading and one open alert for the site.
  await page.goto('/dashboard');
  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: siteName }) });
  await expect(card).toContainText('130.5 kW');
  await expect(card).toContainText('1 open alert');

  // 6. The alerts page lists the alert as OPEN; the nav badge shows open alerts.
  await page.getByRole('link', { name: /^Alerts/ }).click();
  const row = page.getByRole('row').filter({ has: page.getByRole('link', { name: siteName, exact: true }) });
  await expect(row).toContainText('130.5');
  await expect(row).toContainText('OPEN');
  await expect(page.getByLabel(/^\d+ open alerts$/)).toBeVisible();

  // 7. Acknowledge it.
  await row.getByRole('button', { name: /^Acknowledge/ }).click();
  await expect(row).toContainText('ACKNOWLEDGED');

  // 8. Back on the dashboard the site has no open alert any more (acknowledged ones do not count).
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(card).toContainText('0 open alerts');
});
