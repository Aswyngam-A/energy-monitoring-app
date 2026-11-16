// Tests for the shared page frame: title, nav links and the alert-count badge.
// The alerts API is mocked; Layout reads the count from the shared AlertsProvider.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Layout from './Layout';
import { AlertsProvider } from '../context/AlertsContext';
import * as alertsApi from '../api/alerts';
import { pageOf } from '../testUtils';

jest.mock('../api/alerts');

// The badge shows the `total` of a page of OPEN alerts (the items are not needed).
const openAlerts = (total: number) => pageOf<alertsApi.Alert>([], { size: 1, total });

function renderLayout() {
  render(
    <MemoryRouter>
      <AlertsProvider>
        <Layout />
      </AlertsProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.mocked(alertsApi.listAlerts).mockResolvedValue(openAlerts(0));
});

test('renders app name', async () => {
  renderLayout();
  expect(screen.getByText('EnergyWatch')).toBeInTheDocument();
  // Let the provider's load finish inside the test (avoids "not wrapped in act" warnings).
  await screen.findByRole('link', { name: /alerts/i });
});

test('has a navigation link to the alerts page', async () => {
  renderLayout();
  expect(await screen.findByRole('link', { name: /alerts/i })).toHaveAttribute('href', '/alerts');
});

test('has a navigation link to the dashboard', async () => {
  renderLayout();
  expect(await screen.findByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
});

test('shows the number of OPEN alerts as a badge on the Alerts link', async () => {
  jest.mocked(alertsApi.listAlerts).mockResolvedValue(openAlerts(2));
  renderLayout();

  expect(await screen.findByLabelText('2 open alerts')).toHaveTextContent('2');
  // The server does the counting: only OPEN alerts, asking for the smallest page.
  expect(alertsApi.listAlerts).toHaveBeenCalledWith({ status: 'OPEN', size: 1 });
});

test('the badge shows the real total even when it is larger than one page', async () => {
  jest.mocked(alertsApi.listAlerts).mockResolvedValue(openAlerts(137));
  renderLayout();

  expect(await screen.findByLabelText('137 open alerts')).toBeInTheDocument();
});

test('shows no badge when there are no open alerts', async () => {
  renderLayout();
  await screen.findByRole('link', { name: /alerts/i });
  expect(screen.queryByLabelText(/open alerts/i)).not.toBeInTheDocument();
});
