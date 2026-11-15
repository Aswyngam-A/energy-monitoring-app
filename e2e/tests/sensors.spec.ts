import { test, expect, type Page } from '@playwright/test';

// End-to-end tests for sensors: browser -> nginx -> Quarkus -> PostgreSQL.
// Same data strategy as sites.spec.ts: every test creates its own site and sensors with
// unique names, never assumes an empty database, and never cleans up.

/** A name that is unique per call, e.g. "e2e-sensor-1731700000000-4821". */
function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/** Creates a site through the UI and leaves the browser on its detail page. Returns the site name. */
async function createSite(page: Page): Promise<string> {
  const name = uniqueName('e2e-site');
  await page.goto('/sites/new');
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Threshold').fill('100');
  await page.getByRole('button', { name: 'Create site' }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
  return name;
}

test('registering a sensor on a site lists it, and it survives a reload', async ({ page }) => {
  await createSite(page);
  const sensorName = uniqueName('e2e-sensor');

  // A new site starts with no sensors.
  await expect(page.getByText('No sensors yet')).toBeVisible();

  // exact: true because the site page has no other "Name" field, but this keeps it unambiguous.
  await page.getByLabel('Name', { exact: true }).fill(sensorName);
  await page.getByLabel('Type (optional)').fill('power');
  await page.getByRole('button', { name: 'Add sensor' }).click();

  // The sensor appears in the list with its type, and the empty message is gone.
  const item = page.getByRole('listitem').filter({ hasText: sensorName });
  await expect(item).toContainText('(power)');
  await expect(page.getByText('No sensors yet')).toHaveCount(0);

  // The form was cleared, ready for another sensor.
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('');

  // A reload proves it was really saved (not just added to the page's state).
  await page.reload();
  await expect(page.getByRole('listitem').filter({ hasText: sensorName })).toBeVisible();
});

test('the sensor form refuses an empty name', async ({ page }) => {
  await createSite(page);

  await page.getByRole('button', { name: 'Add sensor' }).click();

  await expect(page.getByText('Name is required')).toBeVisible();
  await expect(page.getByText('No sensors yet')).toBeVisible();
});

test('a sensor only appears on the site it was added to', async ({ page }) => {
  const siteA = await createSite(page);
  const sensorName = uniqueName('e2e-sensor');
  await page.getByLabel('Name', { exact: true }).fill(sensorName);
  await page.getByRole('button', { name: 'Add sensor' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: sensorName })).toBeVisible();

  // A second site must not show site A's sensor.
  await createSite(page);
  await expect(page.getByText('No sensors yet')).toBeVisible();
  await expect(page.getByText(sensorName)).toHaveCount(0);

  // Going back to site A through the list still shows it.
  await page.goto('/sites');
  await page.getByRole('link', { name: siteA }).click();
  await expect(page.getByRole('listitem').filter({ hasText: sensorName })).toBeVisible();
});
