// Tests for the shared alerts state: one load, many readers.
// The API is mocked; a tiny probe component prints what useAlerts() returns.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { AlertsProvider, useAlerts } from './AlertsContext';
import * as alertsApi from '../api/alerts';

jest.mock('../api/alerts');

// Start every test from a clean mock: call counts and queued results must not leak between tests.
beforeEach(() => {
  jest.resetAllMocks();
});

const alert = (id: number, status: alertsApi.AlertStatus = 'OPEN'): alertsApi.Alert => ({
  id, siteId: 7, sensorId: 3, readingId: id, value: 150, threshold: 100,
  createdAt: '2024-05-01T11:00:00Z', status,
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

// Probe with a button that asks the provider to change alert 1's status.
function ChangeProbe() {
  const { alerts, changeStatus } = useAlerts();
  const [failed, setFailed] = useState(false);
  return (
    <div>
      <p>{`statuses: ${alerts.map((a) => a.status).join(',')}`}</p>
      {failed && <p>change failed</p>}
      <button onClick={() => { changeStatus(1, 'ACKNOWLEDGED').catch(() => { setFailed(true); }); }}>change</button>
    </div>
  );
}

test('changeStatus sends the change, then reloads the list so every reader sees it', async () => {
  jest.mocked(alertsApi.listAlerts)
    .mockResolvedValueOnce([alert(1)])
    .mockResolvedValueOnce([alert(1, 'ACKNOWLEDGED')]);
  jest.mocked(alertsApi.updateAlertStatus).mockResolvedValue(alert(1, 'ACKNOWLEDGED'));
  render(<AlertsProvider><ChangeProbe /></AlertsProvider>);
  await screen.findByText('statuses: OPEN');

  await userEvent.click(screen.getByRole('button', { name: 'change' }));

  expect(await screen.findByText('statuses: ACKNOWLEDGED')).toBeInTheDocument();
  expect(alertsApi.updateAlertStatus).toHaveBeenCalledWith(1, 'ACKNOWLEDGED');
  expect(alertsApi.listAlerts).toHaveBeenCalledTimes(2);
});

test('changeStatus rejects when the server refuses, and keeps the old list', async () => {
  jest.mocked(alertsApi.listAlerts).mockResolvedValue([alert(1)]);
  jest.mocked(alertsApi.updateAlertStatus).mockRejectedValue(new Error('400'));
  render(<AlertsProvider><ChangeProbe /></AlertsProvider>);
  await screen.findByText('statuses: OPEN');

  await userEvent.click(screen.getByRole('button', { name: 'change' }));

  expect(await screen.findByText('change failed')).toBeInTheDocument();
  expect(screen.getByText('statuses: OPEN')).toBeInTheDocument();
  expect(alertsApi.listAlerts).toHaveBeenCalledTimes(1);
});
