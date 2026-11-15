import { test, expect, type APIRequestContext } from '@playwright/test';

// End-to-end tests for readings: browser -> nginx -> Quarkus -> PostgreSQL.
//
// Sensors send readings over HTTP and the UI has no form for that, so these tests set their
// data up by calling the API directly with Playwright's `request` fixture (an HTTP client that
// uses the same baseURL as the browser, so "/api/v1/..." goes through nginx like the UI does).
// Then they open the site page in the browser and check what the user sees.
//
// Data strategy as in sites.spec.ts: every test creates its own site with a unique name, never
// assumes an empty database, and never cleans up. Readings belong to a fresh site, so earlier
// runs cannot affect what a test sees.

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

/** Creates a site with one sensor through the API. Returns both ids and the site's name. */
async function createSiteWithSensor(request: APIRequestContext, sensorName: string) {
  const siteName = uniqueName('e2e-site');
  const site = await postJson<{ id: number }>(request, '/api/v1/sites', { name: siteName, threshold: 100 });
  const sensor = await postJson<{ id: number }>(request, `/api/v1/sites/${site.id}/sensors`, {
    name: sensorName,
    type: 'power',
  });
  return { siteId: site.id, sensorId: sensor.id, siteName };
}

test('a reading posted through the API shows in the site readings table', async ({ page, request }) => {
  const { siteId, sensorId } = await createSiteWithSensor(request, 'Main meter');
  await postJson(request, `/api/v1/sensors/${sensorId}/readings`, {
    value: 12.5,
    timestamp: '2024-05-01T10:15:30Z',
  });

  await page.goto(`/sites/${siteId}`);

  // One body row with the time in UTC, the sensor's name and the value.
  const row = page.getByRole('row').filter({ hasText: 'Main meter' });
  await expect(row).toContainText('2024-05-01 10:15:30');
  await expect(row).toContainText('12.5');
});

test('a reading sent without a timestamp gets the server time and is listed', async ({ page, request }) => {
  const { siteId, sensorId } = await createSiteWithSensor(request, 'Clockless meter');
  await postJson(request, `/api/v1/sensors/${sensorId}/readings`, { value: 7.25 });

  await page.goto(`/sites/${siteId}`);

  // We cannot know the exact time, but the row must exist with the value, and the year must be
  // a plausible one (the server filled in "now").
  const row = page.getByRole('row').filter({ hasText: 'Clockless meter' });
  await expect(row).toContainText('7.25');
  await expect(row).toContainText(String(new Date().getUTCFullYear()));
});

test('a site without readings says so', async ({ page, request }) => {
  const { siteId } = await createSiteWithSensor(request, 'Quiet meter');

  await page.goto(`/sites/${siteId}`);

  await expect(page.getByText('No readings found')).toBeVisible();
});

test('the from/to filter narrows the table, and Clear brings everything back', async ({ page, request }) => {
  const { siteId, sensorId } = await createSiteWithSensor(request, 'Filter meter');
  // Three readings one hour apart, with distinct values so each row is easy to identify.
  for (const [value, timestamp] of [
    [1, '2024-05-01T10:00:00Z'],
    [2, '2024-05-01T11:00:00Z'],
    [3, '2024-05-01T12:00:00Z'],
  ] as const) {
    await postJson(request, `/api/v1/sensors/${sensorId}/readings`, { value, timestamp });
  }

  await page.goto(`/sites/${siteId}`);
  await expect(page.getByRole('row').filter({ hasText: 'Filter meter' })).toHaveCount(3);

  // Keep only the middle reading: 10:30 -> 11:30 (UTC).
  await page.getByLabel('From (UTC)').fill('2024-05-01T10:30');
  await page.getByLabel('To (UTC)').fill('2024-05-01T11:30');
  await page.getByRole('button', { name: 'Apply filter' }).click();

  const rows = page.getByRole('row').filter({ hasText: 'Filter meter' });
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText('2024-05-01 11:00:00');

  // Clear empties the inputs and shows all three again.
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page.getByLabel('From (UTC)')).toHaveValue('');
  await expect(rows).toHaveCount(3);
});

test('a range where From is after To is refused with a message', async ({ page, request }) => {
  const { siteId } = await createSiteWithSensor(request, 'Range meter');

  await page.goto(`/sites/${siteId}`);
  await page.getByLabel('From (UTC)').fill('2024-05-01T12:00');
  await page.getByLabel('To (UTC)').fill('2024-05-01T10:00');
  await page.getByRole('button', { name: 'Apply filter' }).click();

  await expect(page.getByText('From must not be after To')).toBeVisible();
});
