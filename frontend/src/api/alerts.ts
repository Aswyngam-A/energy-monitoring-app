import client from './client';

// Typed wrapper around the backend's /api/v1/alerts endpoint.
// A non-2xx status makes Axios throw; the calling component decides how to show the error.

// Where an alert is in its life (the backend sends the enum's name as text).
// Allowed moves: OPEN -> ACKNOWLEDGED, OPEN -> RESOLVED, ACKNOWLEDGED -> RESOLVED; RESOLVED is final.
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

// Matches the backend's AlertResponse record.
// `value` and `threshold` are the numbers that were compared when the alert was raised (kW);
// `createdAt` is an ISO-8601 UTC string, shown with formatTimestamp.
export interface Alert {
  id: number;
  siteId: number;
  sensorId: number;
  readingId: number;
  value: number;
  threshold: number;
  createdAt: string;
  status: AlertStatus;
}

// The backend returns lists as a page: { items, page, size, total } (decided in M7).
interface AlertPage {
  items: Alert[];
  page: number;
  size: number;
  total: number;
}

// GET /alerts or GET /alerts?siteId= -> alerts newest first. Without a siteId every site is included.
// TEMPORARY (until M7 step 5 adds pagination controls): asks for the largest page the backend
// allows (100) and returns only its items, so the page and the nav badge keep working.
export async function listAlerts(siteId?: number): Promise<Alert[]> {
  // Only send siteId when there is one; the backend treats a missing parameter as "no filter".
  const params: { siteId?: number; size: number } = { size: 100 };
  if (siteId !== undefined) params.siteId = siteId;
  const response = await client.get<AlertPage>('/alerts', { params });
  return response.data.items;
}

// PATCH /alerts/{id} -> the updated alert. The backend answers 400 for a move that is not allowed
// (e.g. reopening a RESOLVED alert) and 404 for an unknown id; Axios throws for both.
export async function updateAlertStatus(id: number, status: AlertStatus): Promise<Alert> {
  const response = await client.patch<Alert>(`/alerts/${id}`, { status });
  return response.data;
}
