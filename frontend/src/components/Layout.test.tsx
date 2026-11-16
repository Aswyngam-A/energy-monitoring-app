// Tests for the shared page frame: title, nav links and the alert-count badge.
// The alerts API is mocked; Layout reads the count from the shared AlertsProvider.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// ---- UI design pass: theme toggle, mobile menu, "last updated" ----

describe('theme toggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  test('switches to dark, remembers the choice and can switch back', async () => {
    renderLayout();
    await screen.findByRole('link', { name: /alerts/i });

    // No stored choice: the OS decides (jsdom reports "light"), so the button offers dark.
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem('energywatch-theme')).toBe('dark');

    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(localStorage.getItem('energywatch-theme')).toBe('light');
  });

  test('starts from the stored choice', async () => {
    localStorage.setItem('energywatch-theme', 'dark');
    renderLayout();

    expect(await screen.findByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});

test('the menu button opens and closes the navigation on small screens', async () => {
  renderLayout();
  await screen.findByRole('link', { name: /alerts/i });
  const button = screen.getByRole('button', { name: 'Menu' });
  expect(button).toHaveAttribute('aria-expanded', 'false');

  await userEvent.click(button);
  expect(button).toHaveAttribute('aria-expanded', 'true');

  // Choosing a destination closes the menu again.
  await userEvent.click(screen.getByRole('link', { name: 'Sites' }));
  expect(button).toHaveAttribute('aria-expanded', 'false');
});

test('shows when the alert count was last updated', async () => {
  renderLayout();

  // The time itself depends on the clock; the label and a HH:MM:SS shape are what matter.
  expect(await screen.findByText(/^Updated \d{2}:\d{2}:\d{2}$/)).toBeInTheDocument();
});
