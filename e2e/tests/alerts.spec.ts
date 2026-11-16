import { test, expect, type APIRequestContext } from '@playwright/test';

// End-to-end tests for alerts: browser -> nginx -> Quarkus -> PostgreSQL.
//
// Same approach as readings.spec.ts: data is set up through the API (a sensor "sends" a reading
// over HTTP), then the browser checks what the user sees: a row on /alerts and the nav badge.
// Every test creates its own site with a unique name and never cleans up, so the alerts table
// may hold alerts from other tests/runs: assertions only look at the row of THIS test's site
// (the alerts page links to it using the site name), never at totals.

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
    name: 'Alert meter',
    type: 'power',
  });
  return { siteId: site.id, siteName, sensorId: sensor.id };
}

test('a reading above the site threshold raises an alert shown on the alerts page', async ({ page, request }) => {
  const { siteName, sensorId } = await createSiteWithSensor(request);
  await postJson(request, `/api/v1/sensors/${sensorId}/readings`, { value: 150.5 });

  await page.goto('/alerts');

  // The row is found through its link to the site; it shows value, threshold and status.
  const row = page.getByRole('row').filter({ has: page.getByRole('link', { name: siteName }) });
  await expect(row).toContainText('150.5');
  await expect(row).toContainText('100');
  await expect(row).toContainText('OPEN');
});

test('a reading equal to the threshold raises no alert', async ({ page, request }) => {
  const { siteName, sensorId } = await createSiteWithSensor(request);
  // Only strictly above the threshold counts as a breach.
  await postJson(request, `/api/v1/sensors/${sensorId}/readings`, { value: 100 });

  await page.goto('/alerts');

  // Wait until the page has loaded (heading) before asserting something is absent.
  await expect(page.getByRole('heading', { name: 'Alerts' })).toBeVisible();
  await expect(page.getByRole('link', { name: siteName, exact: true })).toHaveCount(0);
});

test('the nav badge shows the open alert count on every page', async ({ page, request }) => {
  const { sensorId } = await createSiteWithSensor(request);
  await postJson(request, `/api/v1/sensors/${sensorId}/readings`, { value: 250 });

  // Not the alerts page: the badge lives in the shared frame.
  await page.goto('/sites');

  // At least this test's alert exists; other tests may have added more, so only the shape is checked.
  await expect(page.getByLabel(/^\d+ open alerts$/)).toBeVisible();
});

test('the alert links to its site page', async ({ page, request }) => {
  const { siteId, siteName, sensorId } = await createSiteWithSensor(request);
  await postJson(request, `/api/v1/sensors/${sensorId}/readings`, { value: 300 });

  await page.goto('/alerts');
  await page.getByRole('link', { name: siteName, exact: true }).click();

  await expect(page).toHaveURL(`/sites/${siteId}`);
});

// Polish 3: the alerts page refreshes itself every 30 seconds. Playwright's fake clock lets the
// test "wait" 30 seconds instantly instead of really sleeping.
test('an alert raised while the alerts page is open appears after the next refresh', async ({ page, request }) => {
  const { siteName, sensorId } = await createSiteWithSensor(request);
  await page.clock.install();
  await page.goto('/alerts');
  await expect(page.getByRole('heading', { name: 'Alerts' })).toBeVisible();
  await expect(page.getByRole('link', { name: siteName, exact: true })).toHaveCount(0);

  // The alert is created behind the page's back, over the API.
  await postJson(request, `/api/v1/sensors/${sensorId}/readings`, { value: 400 });
  await page.clock.runFor(30_000);

  await expect(page.getByRole('link', { name: siteName, exact: true })).toBeVisible();
});
