import client from './client';
import type { Page } from './page';

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

// What the list can be narrowed by. Everything is optional; only the values that are given are sent.
export interface AlertQuery {
  siteId?: number;
  status?: AlertStatus;
  // 0-based page number and items per page (the backend defaults to page 0, 20 items, max 100).
  page?: number;
  size?: number;
}

// GET /alerts -> one page of alerts, newest first: { items, page, size, total }.
export async function listAlerts(query: AlertQuery = {}): Promise<Page<Alert>> {
  // Only send what has a value; the backend treats a missing parameter as "no filter" / default.
  const params: AlertQuery = {};
  if (query.siteId !== undefined) params.siteId = query.siteId;
  if (query.status !== undefined) params.status = query.status;
  if (query.page !== undefined) params.page = query.page;
  if (query.size !== undefined) params.size = query.size;
  const response = await client.get<Page<Alert>>('/alerts', { params });
  return response.data;
}

// PATCH /alerts/{id} -> the updated alert. The backend answers 400 for a move that is not allowed
// (e.g. reopening a RESOLVED alert) and 404 for an unknown id; Axios throws for both.
export async function updateAlertStatus(id: number, status: AlertStatus): Promise<Alert> {
  const response = await client.patch<Alert>(`/alerts/${id}`, { status });
  return response.data;
}
