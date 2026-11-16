// Helpers shared by the tests (not part of the app).
import type { Page } from './api/page';

/** Builds the page object the backend returns for a list: { items, page, size, total }. */
export function pageOf<T>(items: T[], overrides: Partial<Omit<Page<T>, 'items'>> = {}): Page<T> {
  return { items, page: 0, size: 20, total: items.length, ...overrides };
}
