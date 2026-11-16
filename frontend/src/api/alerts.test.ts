// Unit tests for the alerts API client. The Axios client is mocked, so no network is used:
// we only check which URL and query parameters it sends and what it returns.
import client from './client';
import { listAlerts, updateAlertStatus } from './alerts';

jest.mock('./client');

const alert = {
  id: 1,
  siteId: 7,
  sensorId: 3,
  readingId: 12,
  value: 150.5,
  threshold: 100,
  createdAt: '2024-05-01T10:15:30Z',
  status: 'OPEN',
};

// The backend now answers with a page: { items, page, size, total } (M7). Until the pagination
// controls exist (M7 step 5) the client asks for the largest page (100) and returns its items.
const page = (items: object[]) => ({ items, page: 0, size: 100, total: items.length });

test('listAlerts GETs /alerts asking for the largest page and returns its items', async () => {
  jest.mocked(client.get).mockResolvedValue({ data: page([alert]) });
  const result = await listAlerts();
  expect(client.get).toHaveBeenCalledWith('/alerts', { params: { size: 100 } });
  expect(result).toEqual([alert]);
});

test('listAlerts sends siteId as a query parameter to keep one site', async () => {
  jest.mocked(client.get).mockResolvedValue({ data: page([]) });
  await listAlerts(7);
  expect(client.get).toHaveBeenCalledWith('/alerts', { params: { siteId: 7, size: 100 } });
});

test('updateAlertStatus PATCHes the status to /alerts/{id} and returns the updated alert', async () => {
  const updated = { ...alert, status: 'ACKNOWLEDGED' };
  jest.mocked(client.patch).mockResolvedValue({ data: updated });
  const result = await updateAlertStatus(1, 'ACKNOWLEDGED');
  expect(client.patch).toHaveBeenCalledWith('/alerts/1', { status: 'ACKNOWLEDGED' });
  expect(result).toEqual(updated);
});
