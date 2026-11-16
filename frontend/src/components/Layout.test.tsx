// Tests for the shared page frame: title, nav links and the alert-count badge.
// The alerts API is mocked; Layout reads the count from the shared AlertsProvider.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Layout from './Layout';
import { AlertsProvider } from '../context/AlertsContext';
import * as alertsApi from '../api/alerts';

jest.mock('../api/alerts');

const alert = (id: number, status: alertsApi.AlertStatus = 'OPEN'): alertsApi.Alert => ({
  id, siteId: 7, sensorId: 3, readingId: id, value: 150, threshold: 100,
  createdAt: '2024-05-01T11:00:00Z', status,
});

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
  jest.mocked(alertsApi.listAlerts).mockResolvedValue([]);
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

test('shows the number of alerts as a badge on the Alerts link', async () => {
  jest.mocked(alertsApi.listAlerts).mockResolvedValue([alert(2), alert(1)]);
  renderLayout();

  expect(await screen.findByLabelText('2 open alerts')).toHaveTextContent('2');
});

test('shows no badge when there are no alerts', async () => {
  renderLayout();
  await screen.findByRole('link', { name: /alerts/i });
  expect(screen.queryByLabelText(/open alerts/i)).not.toBeInTheDocument();
});
