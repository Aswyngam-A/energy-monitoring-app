// Tests for the route table: the home route and the not-found fallback.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import * as healthApi from './api/health';
import * as alertsApi from './api/alerts';
import * as dashboardApi from './api/dashboard';
import App from './App';
import { pageOf } from './testUtils';

jest.mock('./api/health');
jest.mock('./api/alerts');
jest.mock('./api/dashboard');

// App now loads alerts for the nav badge on every route, so every test needs the API stubbed.
beforeEach(() => {
  jest.mocked(alertsApi.listAlerts).mockResolvedValue(pageOf<alertsApi.Alert>([]));
});

test('shows UP when getHealth resolves', async () => {
jest.mocked(healthApi.getHealth).mockResolvedValue({ status: 'UP' });
render(
  <MemoryRouter initialEntries={['/']}>
    <App />
  </MemoryRouter>
);
  expect(await screen.findByText('UP')).toBeInTheDocument();
});

test('shows a not-found message for unknown URLs', async () => {
render(
  <MemoryRouter initialEntries={['/nothing-here']}>
    <App />
  </MemoryRouter>
);
expect(await screen.findByText(/page not found/i)).toBeInTheDocument();
});

test('the /alerts route shows the alerts page', async () => {
render(
  <MemoryRouter initialEntries={['/alerts']}>
    <App />
  </MemoryRouter>
);
expect(await screen.findByRole('heading', { name: 'Alerts' })).toBeInTheDocument();
});

test('the /dashboard route shows the dashboard page', async () => {
  jest.mocked(dashboardApi.getDashboardSummary).mockResolvedValue([]);
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <App />
    </MemoryRouter>
  );
  expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
});
