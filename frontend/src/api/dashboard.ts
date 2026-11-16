import client from './client';

// Typed wrapper around the backend's /api/v1/dashboard endpoints.

// The most recent measurement of a site (value in kW, ISO-8601 UTC time).
export interface LatestReading {
  value: number;
  timestamp: string;
}

// One line of the dashboard; matches the backend's SiteSummary record.
// `latestReading` is null while the site has no readings; `openAlerts` counts OPEN alerts only.
export interface SiteSummary {
  siteId: number;
  siteName: string;
  latestReading: LatestReading | null;
  openAlerts: number;
}

// GET /dashboard/summary -> one entry per site, ordered by name (not paginated).
export async function getDashboardSummary(): Promise<SiteSummary[]> {
  const response = await client.get<SiteSummary[]>('/dashboard/summary');
  return response.data;
}
