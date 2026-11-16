import client from './client';
import type { Page } from './page';

// Typed wrappers around the backend's reading endpoints.
// Each function returns the response body; a non-2xx status makes Axios throw,
// and the calling component decides how to show the error.

// Matches the backend's ReadingResponse record.
// `timestamp` is an ISO-8601 UTC string such as "2024-05-01T10:15:30Z": JSON has no date type,
// so dates travel as strings and are turned into Date objects only where they are displayed.
// `value` is in kW (a convention of the API; the unit is not stored per reading).
export interface Reading {
  id: number;
  value: number;
  timestamp: string;
  sensorId: number;
  sensorName: string;
}

// Matches the backend's ReadingRequest record. The sensor comes from the URL.
// Without a timestamp the server uses its own current time.
export interface ReadingInput {
  value: number;
  timestamp?: string;
}

// Optional time range for listing, both ends inclusive and ISO-8601 UTC strings.
export interface ReadingRange {
  from?: string;
  to?: string;
}

// GET /sites/{siteId}/readings?from=&to= -> readings of every sensor of the site, newest first
// GET /sites/{siteId}/readings -> one page of readings, newest first: { items, page, size, total }.
// `range` narrows by time; `page` is 0-based.
export async function listSiteReadings(
  siteId: number,
  range: ReadingRange = {},
  page = 0,
): Promise<Page<Reading>> {
  // Only send the bounds that have a value: an empty "from=" would be a malformed date (400).
  const params: ReadingRange & { page: number } = { page };
  if (range.from) params.from = range.from;
  if (range.to) params.to = range.to;
  const response = await client.get<Page<Reading>>(`/sites/${siteId}/readings`, { params });
  return response.data;
}

// POST /sensors/{sensorId}/readings -> the created Reading
export async function createReading(sensorId: number, input: ReadingInput): Promise<Reading> {
  const response = await client.post<Reading>(`/sensors/${sensorId}/readings`, input);
  return response.data;
}
