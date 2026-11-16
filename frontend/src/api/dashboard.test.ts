// Unit tests for the dashboard API client (Axios mocked: only URL and returned data are checked).
import client from './client';
import { getDashboardSummary } from './dashboard';

jest.mock('./client');

test('getDashboardSummary GETs /dashboard/summary and returns the list of site summaries', async () => {
  const summary = [
    { siteId: 1, siteName: 'A', latestReading: { value: 12.5, timestamp: '2024-05-01T10:00:00Z' }, openAlerts: 2 },
    { siteId: 2, siteName: 'B', latestReading: null, openAlerts: 0 },
  ];
  jest.mocked(client.get).mockResolvedValue({ data: summary });

  const result = await getDashboardSummary();

  expect(client.get).toHaveBeenCalledWith('/dashboard/summary');
  expect(result).toEqual(summary);
});
