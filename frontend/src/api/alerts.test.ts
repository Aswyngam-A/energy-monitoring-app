// Unit tests for the alerts API client. The Axios client is mocked, so no network is used:
// we only check which URL and query parameters it sends and what it returns.
import client from './client';
import { listAlerts, updateAlertStatus } from './alerts';
import { pageOf } from '../testUtils';

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

test('listAlerts GETs /alerts without query parameters and returns the whole page', async () => {
  const page = pageOf([alert], { total: 41 });
  jest.mocked(client.get).mockResolvedValue({ data: page });
  const result = await listAlerts();
  expect(client.get).toHaveBeenCalledWith('/alerts', { params: {} });
  // The page object (items + paging metadata) is returned as is, for the pagination controls.
  expect(result).toEqual(page);
});

test('listAlerts sends only the query values that are given', async () => {
  jest.mocked(client.get).mockResolvedValue({ data: pageOf([]) });
  await listAlerts({ siteId: 7, status: 'OPEN', page: 2, size: 5 });
  expect(client.get).toHaveBeenCalledWith('/alerts', {
    params: { siteId: 7, status: 'OPEN', page: 2, size: 5 },
  });

  await listAlerts({ status: 'RESOLVED' });
  expect(client.get).toHaveBeenLastCalledWith('/alerts', { params: { status: 'RESOLVED' } });
});

test('updateAlertStatus PATCHes the status to /alerts/{id} and returns the updated alert', async () => {
  const updated = { ...alert, status: 'ACKNOWLEDGED' };
  jest.mocked(client.patch).mockResolvedValue({ data: updated });
  const result = await updateAlertStatus(1, 'ACKNOWLEDGED');
  expect(client.patch).toHaveBeenCalledWith('/alerts/1', { status: 'ACKNOWLEDGED' });
  expect(result).toEqual(updated);
});
