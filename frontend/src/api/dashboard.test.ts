// Unit tests for the dashboard API client (Axios mocked: only URL, params and returned data are checked).
import client from './client';
import { getDashboardSummary, getOverview } from './dashboard';

jest.mock('./client');

// Replaces the pre-pagination test (plain array): since polish item 4 the endpoint answers with a
// page { items, page, size, total } like the other lists.
test('getDashboardSummary GETs one page of site summaries and returns the whole page', async () => {
  const page = {
    items: [
      { siteId: 1, siteName: 'A', threshold: 20, latestReading: { value: 12.5, timestamp: '2024-05-01T10:00:00Z' }, openAlerts: 2, trend: [10, 12.5] },
      { siteId: 2, siteName: 'B', threshold: 50, latestReading: null, openAlerts: 0, trend: [] },
    ],
    page: 1, size: 20, total: 22,
  };
  jest.mocked(client.get).mockResolvedValue({ data: page });

  const result = await getDashboardSummary(1);

  expect(client.get).toHaveBeenCalledWith('/dashboard/summary', { params: { page: 1 } });
  expect(result).toEqual(page);
});

test('getDashboardSummary asks for the first page by default', async () => {
  jest.mocked(client.get).mockResolvedValue({ data: { items: [], page: 0, size: 20, total: 0 } });

  await getDashboardSummary();

  expect(client.get).toHaveBeenCalledWith('/dashboard/summary', { params: { page: 0 } });
});

test('getOverview asks for the system-wide totals', async () => {
  const overview = { sites: 8, openAlerts: 2, totalKw: 410.5, lastReadingAt: '2024-05-01T12:00:00Z' };
  jest.mocked(client.get).mockResolvedValue({ data: overview });

  const result = await getOverview();

  expect(client.get).toHaveBeenCalledWith('/dashboard/overview');
  expect(result).toEqual(overview);
});
