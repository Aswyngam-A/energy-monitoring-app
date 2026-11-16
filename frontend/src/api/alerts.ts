import client from './client';

// Typed wrapper around the backend's /api/v1/alerts endpoint.
// A non-2xx status makes Axios throw; the calling component decides how to show the error.

// Where an alert is in its life. Only OPEN exists for now; later milestones add more values
// (the backend sends the name as text), so this union will grow.
export type AlertStatus = 'OPEN';

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

// GET /alerts or GET /alerts?siteId= -> alerts newest first. Without a siteId every site is included.
export async function listAlerts(siteId?: number): Promise<Alert[]> {
  // Only send siteId when there is one; the backend treats a missing parameter as "no filter".
  const params: { siteId?: number } = {};
  if (siteId !== undefined) params.siteId = siteId;
  const response = await client.get<Alert[]>('/alerts', { params });
  return response.data;
}
