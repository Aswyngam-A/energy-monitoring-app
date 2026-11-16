// Tests for /alerts: the table, the empty state, the error alert and the links to sites.
// The API is mocked; MemoryRouter is needed because the page renders <Link>s, and the page
// reads its data from the shared AlertsProvider.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import AlertsPage from './AlertsPage';
import { AlertsProvider } from '../context/AlertsContext';
import * as alertsApi from '../api/alerts';

jest.mock('../api/alerts');

// Start every test from a clean mock: call counts and queued results must not leak between tests.
beforeEach(() => {
  jest.resetAllMocks();
});

const alerts: alertsApi.Alert[] = [
  {
    id: 2, siteId: 7, sensorId: 3, readingId: 12,
    value: 150.5, threshold: 100, createdAt: '2024-05-01T11:00:00Z', status: 'OPEN',
  },
  {
    id: 1, siteId: 8, sensorId: 4, readingId: 11,
    value: 90, threshold: 80, createdAt: '2024-05-01T10:00:00Z', status: 'OPEN',
  },
];

function renderPage() {
  render(
    <MemoryRouter>
      <AlertsProvider>
        <AlertsPage />
      </AlertsProvider>
    </MemoryRouter>
  );
}

test('loads all alerts (no site filter)', async () => {
  jest.mocked(alertsApi.listAlerts).mockResolvedValue(alerts);
  renderPage();

  await screen.findAllByRole('row');
  expect(alertsApi.listAlerts).toHaveBeenCalledWith();
});

test('shows each alert as a row, in the order received (newest first)', async () => {
  jest.mocked(alertsApi.listAlerts).mockResolvedValue(alerts);
  renderPage();

  const rows = await screen.findAllByRole('row');
  // First row is the header; then one row per alert.
  expect(rows).toHaveLength(3);
  expect(within(rows[1]).getByText('2024-05-01 11:00:00')).toBeInTheDocument();
  expect(within(rows[1]).getByText('150.5')).toBeInTheDocument();
  expect(within(rows[1]).getByText('100')).toBeInTheDocument();
  expect(within(rows[1]).getByText('OPEN')).toBeInTheDocument();
  expect(within(rows[2]).getByText('2024-05-01 10:00:00')).toBeInTheDocument();
});

test('each alert links to the page of its site', async () => {
  jest.mocked(alertsApi.listAlerts).mockResolvedValue(alerts);
  renderPage();

  expect(await screen.findByRole('link', { name: 'Site 7' })).toHaveAttribute('href', '/sites/7');
  expect(screen.getByRole('link', { name: 'Site 8' })).toHaveAttribute('href', '/sites/8');
});

test('shows a message when there are no alerts', async () => {
  jest.mocked(alertsApi.listAlerts).mockResolvedValue([]);
  renderPage();

  expect(await screen.findByText(/no alerts/i)).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

test('shows an alert when the alerts cannot be loaded', async () => {
  jest.mocked(alertsApi.listAlerts).mockRejectedValue(new Error('500'));
  renderPage();

  expect(await screen.findByRole('alert')).toHaveTextContent(/could not load alerts/i);
});

// ---- lifecycle (M6): status filter and acknowledge / resolve buttons ----

const mixed: alertsApi.Alert[] = [
  { id: 3, siteId: 7, sensorId: 3, readingId: 13, value: 130, threshold: 100, createdAt: '2024-05-01T12:00:00Z', status: 'RESOLVED' },
  { id: 2, siteId: 7, sensorId: 3, readingId: 12, value: 120, threshold: 100, createdAt: '2024-05-01T11:00:00Z', status: 'ACKNOWLEDGED' },
  { id: 1, siteId: 8, sensorId: 4, readingId: 11, value: 110, threshold: 100, createdAt: '2024-05-01T10:00:00Z', status: 'OPEN' },
];

test('an open alert offers Acknowledge and Resolve, an acknowledged one only Resolve, a resolved one nothing', async () => {
  jest.mocked(alertsApi.listAlerts).mockResolvedValue(mixed);
  renderPage();
  await screen.findAllByRole('row');

  expect(screen.getByRole('button', { name: 'Acknowledge alert 1' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Resolve alert 1' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Acknowledge alert 2' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Resolve alert 2' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /alert 3/ })).not.toBeInTheDocument();
});

test('clicking Acknowledge sends the change and shows the reloaded status', async () => {
  jest.mocked(alertsApi.listAlerts)
    .mockResolvedValueOnce(mixed)
    .mockResolvedValueOnce(mixed.map((a) => (a.id === 1 ? { ...a, status: 'ACKNOWLEDGED' as const } : a)));
  jest.mocked(alertsApi.updateAlertStatus).mockResolvedValue({ ...mixed[2], status: 'ACKNOWLEDGED' });
  renderPage();

  await userEvent.click(await screen.findByRole('button', { name: 'Acknowledge alert 1' }));

  expect(alertsApi.updateAlertStatus).toHaveBeenCalledWith(1, 'ACKNOWLEDGED');
  // Alert 1 is now acknowledged: it no longer offers Acknowledge.
  expect(await screen.findByRole('button', { name: 'Resolve alert 1' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Acknowledge alert 1' })).not.toBeInTheDocument();
});

test('shows an alert when the change is refused and keeps the table', async () => {
  jest.mocked(alertsApi.listAlerts).mockResolvedValue(mixed);
  jest.mocked(alertsApi.updateAlertStatus).mockRejectedValue(new Error('400'));
  renderPage();

  await userEvent.click(await screen.findByRole('button', { name: 'Resolve alert 1' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/could not update alert/i);
  expect(screen.getAllByRole('row')).toHaveLength(4);
});

test('the status filter keeps only alerts of the chosen status', async () => {
  jest.mocked(alertsApi.listAlerts).mockResolvedValue(mixed);
  renderPage();
  await screen.findAllByRole('row');

  await userEvent.selectOptions(screen.getByLabelText('Status'), 'ACKNOWLEDGED');

  const rows = screen.getAllByRole('row');
  expect(rows).toHaveLength(2); // header + the acknowledged alert
  expect(within(rows[1]).getByText('120')).toBeInTheDocument();
  // The filter works on the data already loaded: no extra request.
  expect(alertsApi.listAlerts).toHaveBeenCalledTimes(1);
});

test('the filter says so when nothing has the chosen status', async () => {
  jest.mocked(alertsApi.listAlerts).mockResolvedValue([mixed[2]]); // only an OPEN alert
  renderPage();
  await screen.findAllByRole('row');

  await userEvent.selectOptions(screen.getByLabelText('Status'), 'RESOLVED');

  expect(screen.getByText(/no alerts/i)).toBeInTheDocument();
});
