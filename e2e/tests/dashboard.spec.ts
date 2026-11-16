import { test, expect, type APIRequestContext } from '@playwright/test';
import { openDashboardAtSite } from './dashboard-helpers';

// End-to-end test for the dashboard: browser -> nginx -> Quarkus -> PostgreSQL.
// Data is set up through the API (a site, a sensor and a reading that breaches the threshold),
// then the browser checks the site's card and the chart. As in the other specs, the site has a
// unique name and the assertions look only at this test's own card, never at totals. The
// dashboard is paginated, so the helper pages forward until this test's card appears.

/** A name that is unique per call, e.g. "e2e-site-1731700000000-4821". */
function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/** POSTs a JSON body and returns the parsed response, failing the test with details on a non-2xx status. */
async function postJson<T>(request: APIRequestContext, url: string, data: object): Promise<T> {
  const response = await request.post(url, { data });
  expect(response.ok(), `POST ${url} -> ${response.status()} ${await response.text()}`).toBeTruthy();
  return (await response.json()) as T;
}

test('the dashboard shows the site card with its latest reading and open alert, and a chart', async ({ page, request }) => {
  const siteName = uniqueName('e2e-site');
  const site = await postJson<{ id: number }>(request, '/api/v1/sites', { name: siteName, threshold: 100 });
  const sensor = await postJson<{ id: number }>(request, `/api/v1/sites/${site.id}/sensors`, { name: 'Dash meter' });
  await postJson(request, `/api/v1/sensors/${sensor.id}/readings`, { value: 80, timestamp: '2024-05-01T10:00:00Z' });
  await postJson(request, `/api/v1/sensors/${sensor.id}/readings`, { value: 150.5, timestamp: '2024-05-01T11:00:00Z' });

  // The card of this site: found through its heading (the site name is unique).
  const card = await openDashboardAtSite(page, siteName);
  await expect(card).toContainText('150.5 kW'); // the newest reading, not the older 80
  await expect(card).toContainText('2024-05-01 11:00:00 UTC');
  await expect(card).toContainText('1 open alert'); // 150.5 > 100 raised exactly one alert

  // Choose this site for the chart (the select lists the sites of this page) and wait for the drawing.
  await page.getByLabel('Chart site').selectOption({ label: siteName });
  await expect(page.getByRole('img', { name: 'Readings chart' })).toBeVisible();
  await expect(page.locator('svg.recharts-surface')).toBeVisible();
});

test('a site without readings shows "No readings yet" on its card', async ({ page, request }) => {
  const siteName = uniqueName('e2e-site');
  await postJson(request, '/api/v1/sites', { name: siteName, threshold: 100 });

  const card = await openDashboardAtSite(page, siteName);
  await expect(card).toContainText('No readings yet');
  await expect(card).toContainText('0 open alerts');
});

// Polish 4: the summary is paginated. 21 new sites guarantee more than one page (20 per page),
// whatever else is in the database.
test('the dashboard is paginated: Next page and Previous page move between pages of cards', async ({ page, request }) => {
  for (let i = 0; i < 21; i++) {
    await postJson(request, '/api/v1/sites', { name: uniqueName('e2e-page-site'), threshold: 100 });
  }

  await page.goto('/dashboard');
  await expect(page.getByText(/^Page 1 of \d+$/)).toBeVisible();
  // Exactly one page of cards (20) is shown.
  await expect(page.getByRole('article')).toHaveCount(20);

  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText(/^Page 2 of \d+$/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous page' })).toBeEnabled();

  await page.getByRole('button', { name: 'Previous page' }).click();
  await expect(page.getByText(/^Page 1 of \d+$/)).toBeVisible();
});
