import { test, expect } from '@playwright/test';

// End-to-end tests for the sites feature: browser -> nginx -> Quarkus -> PostgreSQL.
//
// Data reset strategy (decided in M2): the tests never assume an empty database and never
// clean up. Every test creates sites with a unique name, so tests cannot collide with each
// other, with earlier runs, or with data left in the compose volume. (CI starts from a fresh
// database anyway.) If a delete endpoint is added later, tests can remove their own data.

/** A name that is unique per call, e.g. "e2e-site-1731700000000-4821". */
function uniqueName(): string {
  return `e2e-site-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

test('creating a site shows it in the list', async ({ page }) => {
  const name = uniqueName();

  // Open the list and go to the create form through the UI, like a user would.
  await page.goto('/sites');
  await page.getByRole('link', { name: 'New site' }).click();

  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Threshold').fill('150');
  await page.getByRole('button', { name: 'Create site' }).click();

  // After saving, the app opens the new site's detail page.
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await expect(page.getByText('Threshold: 150')).toBeVisible();

  // And the site is now part of the list.
  await page.getByRole('link', { name: 'Back to sites' }).click();
  await expect(page.getByRole('link', { name })).toBeVisible();
});

test('the form refuses invalid input and shows errors', async ({ page }) => {
  await page.goto('/sites/new');

  // Submit the empty form: nothing is sent, both errors appear and we stay on the form.
  await page.getByRole('button', { name: 'Create site' }).click();
  await expect(page.getByText('Name is required')).toBeVisible();
  await expect(page.getByText('Threshold must be greater than 0')).toBeVisible();
  await expect(page).toHaveURL(/\/sites\/new$/);
});

test('editing a site updates its name', async ({ page }) => {
  const original = uniqueName();
  const renamed = `${original}-renamed`;

  // Create a site to edit.
  await page.goto('/sites/new');
  await page.getByLabel('Name').fill(original);
  await page.getByLabel('Threshold').fill('10');
  await page.getByRole('button', { name: 'Create site' }).click();
  await expect(page.getByRole('heading', { name: original })).toBeVisible();

  // Edit it: the form comes prefilled with the current values.
  await page.getByRole('link', { name: 'Edit' }).click();
  await expect(page.getByLabel('Name')).toHaveValue(original);
  await page.getByLabel('Name').fill(renamed);
  await page.getByRole('button', { name: 'Save changes' }).click();

  // Back on the detail page with the new name.
  await expect(page.getByRole('heading', { name: renamed })).toBeVisible();
});
