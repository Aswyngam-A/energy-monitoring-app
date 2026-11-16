import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// End-to-end tests for the alert lifecycle (M6): acknowledge, resolve, filter, dedup.
//
// Same approach as alerts.spec.ts: data is set up through the API, then the browser checks and
// clicks. Every test has its own site (unique name) and finds its rows through the link
// labelled with the site name, never through totals, because the database is shared with other tests and earlier runs.

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

/** Creates a site (threshold 100 kW) with one sensor through the API. */
async function createSiteWithSensor(request: APIRequestContext) {
  const siteName = uniqueName('e2e-site');
  const site = await postJson<{ id: number }>(request, '/api/v1/sites', {
    name: siteName,
    threshold: 100,
  });
  const sensor = await postJson<{ id: number }>(request, `/api/v1/sites/${site.id}/sensors`, {
    name: 'Lifecycle meter',
    type: 'power',
  });
  return { siteId: site.id, siteName, sensorId: sensor.id };
}

/** The alert rows of one site on the alerts page (found through the link to the site). */
function rowsOfSite(page: Page, siteName: string) {
  return page.getByRole('row').filter({ has: page.getByRole('link', { name: siteName, exact: true }) });
}

test('acknowledging an alert changes its status and keeps only Resolve', async ({ page, request }) => {
  const { siteName, sensorId } = await createSiteWithSensor(request);
  await postJson(request, `/api/v1/sensors/${sensorId}/readings`, { value: 150 });

  await page.goto('/alerts');
  const row = rowsOfSite(page, siteName);
  await expect(row).toContainText('OPEN');
  await row.getByRole('button', { name: /^Acknowledge/ }).click();

  await expect(row).toContainText('ACKNOWLEDGED');
  await expect(row.getByRole('button', { name: /^Acknowledge/ })).toHaveCount(0);
  await expect(row.getByRole('button', { name: /^Resolve/ })).toBeVisible();

  // The change was saved by the server, not just drawn: it survives a reload.
  await page.reload();
  await expect(rowsOfSite(page, siteName)).toContainText('ACKNOWLEDGED');
});

test('resolving an alert removes its buttons and the status filter finds it', async ({ page, request }) => {
  const { siteName, sensorId } = await createSiteWithSensor(request);
  await postJson(request, `/api/v1/sensors/${sensorId}/readings`, { value: 150 });

  await page.goto('/alerts');
  const row = rowsOfSite(page, siteName);
  await row.getByRole('button', { name: /^Resolve/ }).click();

  await expect(row).toContainText('RESOLVED');
  // RESOLVED is final: no buttons at all.
  await expect(row.getByRole('button')).toHaveCount(0);

  // Filter: shown under Resolved, hidden under Open.
  await page.getByLabel('Status').selectOption('RESOLVED');
  await expect(rowsOfSite(page, siteName)).toHaveCount(1);
  await page.getByLabel('Status').selectOption('OPEN');
  await expect(rowsOfSite(page, siteName)).toHaveCount(0);
});

test('a sensor that keeps breaching gets one alert, and a new one after the first is resolved', async ({ page, request }) => {
  const { siteName, sensorId } = await createSiteWithSensor(request);
  await postJson(request, `/api/v1/sensors/${sensorId}/readings`, { value: 120 });
  await postJson(request, `/api/v1/sensors/${sensorId}/readings`, { value: 130 });

  await page.goto('/alerts');
  // Two readings above the threshold, still a single alert.
  await expect(rowsOfSite(page, siteName)).toHaveCount(1);

  await rowsOfSite(page, siteName).getByRole('button', { name: /^Resolve/ }).click();
  await expect(rowsOfSite(page, siteName)).toContainText('RESOLVED');

  // The next breach after resolving raises a new alert: reload to fetch it.
  await postJson(request, `/api/v1/sensors/${sensorId}/readings`, { value: 140 });
  await page.reload();
  await expect(rowsOfSite(page, siteName)).toHaveCount(2);
});

test('the API refuses to reopen a resolved alert', async ({ request }) => {
  const { siteId, siteName, sensorId } = await createSiteWithSensor(request);
  await postJson(request, `/api/v1/sensors/${sensorId}/readings`, { value: 150 });
  // The list is a page ({ items, page, size, total }); this site has a single alert.
  const alerts = await (await request.get(`/api/v1/alerts?siteId=${siteId}`)).json();
  const alertId = alerts.items[0].id;

  const resolved = await request.patch(`/api/v1/alerts/${alertId}`, { data: { status: 'RESOLVED' } });
  expect(resolved.status()).toBe(200);

  const reopened = await request.patch(`/api/v1/alerts/${alertId}`, { data: { status: 'OPEN' } });
  expect(reopened.status()).toBe(400);
});
