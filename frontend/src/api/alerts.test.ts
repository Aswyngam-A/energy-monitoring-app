// Unit tests for the alerts API client. The Axios client is mocked, so no network is used:
// we only check which URL and query parameters it sends and what it returns.
import client from './client';
import { listAlerts } from './alerts';

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

test('listAlerts GETs /alerts without query parameters when no site is given', async () => {
  jest.mocked(client.get).mockResolvedValue({ data: [alert] });
  const result = await listAlerts();
  expect(client.get).toHaveBeenCalledWith('/alerts', { params: {} });
  expect(result).toEqual([alert]);
});

test('listAlerts sends siteId as a query parameter to keep one site', async () => {
  jest.mocked(client.get).mockResolvedValue({ data: [] });
  await listAlerts(7);
  expect(client.get).toHaveBeenCalledWith('/alerts', { params: { siteId: 7 } });
});
