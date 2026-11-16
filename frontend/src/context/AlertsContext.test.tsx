// Tests for the shared alerts state: one load, many readers.
// The API is mocked; a tiny probe component prints what useAlerts() returns.
import { render, screen } from '@testing-library/react';
import { AlertsProvider, useAlerts } from './AlertsContext';
import * as alertsApi from '../api/alerts';

jest.mock('../api/alerts');

const alert = (id: number): alertsApi.Alert => ({
  id, siteId: 7, sensorId: 3, readingId: id, value: 150, threshold: 100,
  createdAt: '2024-05-01T11:00:00Z', status: 'OPEN',
});

// Prints loading / error / the number of alerts so the tests can assert on plain text.
function Probe({ name }: { name: string }) {
  const { alerts, loading, error } = useAlerts();
  return <p>{`${name}: ${loading ? 'loading' : error || alerts.length}`}</p>;
}

test('loads the alerts once and shares them with every reader', async () => {
  jest.mocked(alertsApi.listAlerts).mockResolvedValue([alert(2), alert(1)]);
  render(
    <AlertsProvider>
      <Probe name="a" />
      <Probe name="b" />
    </AlertsProvider>
  );

  expect(await screen.findByText('a: 2')).toBeInTheDocument();
  expect(screen.getByText('b: 2')).toBeInTheDocument();
  // Two readers, still a single request.
  expect(alertsApi.listAlerts).toHaveBeenCalledTimes(1);
});

test('exposes an error message when loading fails', async () => {
  jest.mocked(alertsApi.listAlerts).mockRejectedValue(new Error('500'));
  render(<AlertsProvider><Probe name="a" /></AlertsProvider>);

  expect(await screen.findByText('a: Could not load alerts')).toBeInTheDocument();
});

test('useAlerts outside a provider is a programming error', () => {
  // React logs the thrown error; silence it so the test output stays readable.
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => render(<Probe name="a" />)).toThrow(/AlertsProvider/);
  spy.mockRestore();
});
