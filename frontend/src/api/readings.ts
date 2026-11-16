import client from './client';

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
// The backend returns a page { items, page, size, total }. TEMPORARY (until M7 step 5 adds pagination
// controls): ask for the largest page allowed (100) and return only its items.
export async function listSiteReadings(siteId: number, range: ReadingRange = {}): Promise<Reading[]> {
  // Only send the bounds that have a value: an empty "from=" would be a malformed date (400).
  const params: ReadingRange & { size: number } = { size: 100 };
  if (range.from) params.from = range.from;
  if (range.to) params.to = range.to;
  const response = await client.get<{ items: Reading[] }>(`/sites/${siteId}/readings`, { params });
  return response.data.items;
}

// POST /sensors/{sensorId}/readings -> the created Reading
export async function createReading(sensorId: number, input: ReadingInput): Promise<Reading> {
  const response = await client.post<Reading>(`/sensors/${sensorId}/readings`, input);
  return response.data;
}
