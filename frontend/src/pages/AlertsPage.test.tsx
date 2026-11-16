// Tests for /alerts: the table, the empty state, the error alert and the links to sites.
// The API is mocked; MemoryRouter is needed because the page renders <Link>s, and the page
// reads its data from the shared AlertsProvider.
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import AlertsPage from './AlertsPage';
import { AlertsProvider } from '../context/AlertsContext';
import * as alertsApi from '../api/alerts';

jest.mock('../api/alerts');

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
