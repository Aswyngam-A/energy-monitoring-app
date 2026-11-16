import client from './client';
import type { Page } from './page';

// Typed wrapper around the backend's /api/v1/dashboard endpoints.

// The most recent measurement of a site (value in kW, ISO-8601 UTC time).
export interface LatestReading {
  value: number;
  timestamp: string;
}

// One line of the dashboard; matches the backend's SiteSummary record.
// `latestReading` is null while the site has no readings; `openAlerts` counts OPEN alerts only.
// `threshold` is the site's limit in kW. `trend` is the site's peak value at each of its latest
// (at most 24) measurement times, oldest first, empty without readings: it feeds the tile's sparkline.
export interface SiteSummary {
  siteId: number;
  siteName: string;
  threshold: number;
  latestReading: LatestReading | null;
  openAlerts: number;
  trend: number[];
}

// GET /dashboard/summary?page= -> one page of site summaries, ordered by name:
// { items, page, size, total } like the other lists (0-based page, the server's default size).
export async function getDashboardSummary(page = 0): Promise<Page<SiteSummary>> {
  const response = await client.get<Page<SiteSummary>>('/dashboard/summary', { params: { page } });
  return response.data;
}
