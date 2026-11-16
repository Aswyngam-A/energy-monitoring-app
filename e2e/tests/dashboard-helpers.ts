import { expect, type Locator, type Page } from '@playwright/test';

/**
 * The dashboard shows 20 sites per page, ordered by name, and the shared test database keeps the
 * sites of earlier tests and runs (nothing cleans up), so a freshly created site may be on any
 * page. This opens the dashboard and clicks "Next page" until the card of the site is on screen,
 * then returns that card. (Not a spec file: Playwright only runs *.spec.ts.)
 */
export async function openDashboardAtSite(page: Page, siteName: string): Promise<Locator> {
  await page.goto('/dashboard');
  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: siteName }) });
  const next = page.getByRole('button', { name: 'Next page' });

  // The cards load after the first render: wait for the first page before looking for the site.
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('article').first()).toBeVisible();

  // Bounded loop: at most 200 pages (4000 sites) before giving up with a clear failure.
  for (let i = 0; i < 200; i++) {
    if (await card.count() > 0) break;
    await expect(next, `site "${siteName}" not found on any dashboard page`).toBeEnabled();
    // The "Page X of Y" text changes the moment the button is clicked, before the new cards have
    // arrived, so it is not a reliable signal. The first card is: every page starts with
    // different sites, so wait until it changes.
    const firstCard = page.getByRole('article').first();
    const before = await firstCard.textContent();
    await next.click();
    await expect(firstCard).not.toHaveText(before ?? '');
  }
  await expect(card).toBeVisible();
  return card;
}
