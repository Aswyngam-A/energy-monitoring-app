// Tests for the route table: the home route and the not-found fallback.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import * as healthApi from './api/health';
import * as alertsApi from './api/alerts';
import App from './App';

jest.mock('./api/health');
jest.mock('./api/alerts');

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
jest.mocked(alertsApi.listAlerts).mockResolvedValue([]);
render(
  <MemoryRouter initialEntries={['/alerts']}>
    <App />
  </MemoryRouter>
);
expect(await screen.findByRole('heading', { name: 'Alerts' })).toBeInTheDocument();
});
