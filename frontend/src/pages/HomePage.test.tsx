// Tests for the home page: a landing page with a short pitch, live numbers from the real data, a
// "how it works" strip, the latest open alert, and (for recruiters) the stack and the project links.
// The three APIs it uses are mocked. MemoryRouter is needed because the page renders <Link>s.
// Replaces the earlier "System status" heading tests: decided that Home becomes a landing page; the
// API status check itself (UP / error) is still tested below.
import { act, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import HomePage from './HomePage';
import * as healthApi from '../api/health';
import * as dashboardApi from '../api/dashboard';
import * as alertsApi from '../api/alerts';
import { pageOf } from '../testUtils';

jest.mock('../api/health');
jest.mock('../api/dashboard');
jest.mock('../api/alerts');

const overview: dashboardApi.Overview = { sites: 8, openAlerts: 2, totalKw: 410.5, lastReadingAt: '2024-05-01T12:00:00Z' };

const openAlert: alertsApi.Alert = {
  id: 1, siteId: 7, siteName: 'Utilities Plant', sensorId: 3, sensorName: 'Clean steam boiler', readingId: 9,
  value: 191, threshold: 180, createdAt: '2024-05-01T11:00:00Z', status: 'OPEN',
};

// Every test starts from a healthy system; a test overrides only what it is about.
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(healthApi.getHealth).mockResolvedValue({ status: 'UP' });
  jest.mocked(dashboardApi.getOverview).mockResolvedValue(overview);
  jest.mocked(alertsApi.listAlerts).mockResolvedValue(pageOf([openAlert]));
});

function renderHome() {
  render(<MemoryRouter><HomePage /></MemoryRouter>);
}

test('shows UP when getHealth resolves', async () => {
  renderHome();

  expect(await screen.findByText('UP')).toBeInTheDocument();
});

test('shows an alert when getHealth rejects', async () => {
  jest.mocked(healthApi.getHealth).mockRejectedValue(new Error('fail'));
  renderHome();

  expect(await screen.findByRole('alert')).toHaveTextContent('Error: could not reach the API');
});

test('has a headline that says what the app is for, and calls to action', async () => {
  renderHome();

  expect(await screen.findByRole('heading', { level: 2, name: /before the bill tells you/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open the live demo' })).toHaveAttribute('href', '/dashboard');
  expect(screen.getByRole('link', { name: 'See the alerts' })).toHaveAttribute('href', '/alerts');
});

test('shows the live numbers: sites, open alerts, load right now, last reading', async () => {
  renderHome();

  const stats = await screen.findByRole('region', { name: 'Live numbers' });
  expect(within(stats).getByText('Sites monitored').previousElementSibling).toHaveTextContent('8');
  expect(within(stats).getByText('Open alerts').previousElementSibling).toHaveTextContent('2');
  expect(within(stats).getByText('Load right now').previousElementSibling).toHaveTextContent('410.5 kW');
  expect(within(stats).getByText('Last reading').previousElementSibling).toHaveTextContent('2024-05-01 12:00:00 UTC');
});

test('says "No readings yet" when the system has no readings', async () => {
  jest.mocked(dashboardApi.getOverview).mockResolvedValue({ ...overview, lastReadingAt: null, totalKw: 0 });
  renderHome();

  expect(await screen.findByText('No readings yet')).toBeInTheDocument();
});

test('shows an alert when the live numbers cannot be loaded', async () => {
  jest.mocked(dashboardApi.getOverview).mockRejectedValue(new Error('500'));
  renderHome();

  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the live numbers');
});

test('highlights the newest open alert and links to the alerts page', async () => {
  renderHome();

  const card = (await screen.findByText(/Clean steam boiler/)).closest('section')!;
  expect(within(card).getByText(/Utilities Plant/)).toBeInTheDocument();
  expect(within(card).getByText(/191 kW/)).toBeInTheDocument();
  expect(within(card).getByText(/180 kW/)).toBeInTheDocument();
  expect(within(card).getByRole('link', { name: 'Review it' })).toHaveAttribute('href', '/alerts');
  // Only the newest OPEN alert is asked for.
  expect(alertsApi.listAlerts).toHaveBeenCalledWith({ status: 'OPEN', size: 1 });
});

test('says all is quiet when there are no open alerts', async () => {
  jest.mocked(alertsApi.listAlerts).mockResolvedValue(pageOf<alertsApi.Alert>([]));
  renderHome();

  expect(await screen.findByText(/all quiet/i)).toBeInTheDocument();
});

test('explains how it works in three steps', async () => {
  renderHome();

  const steps = await screen.findByRole('list', { name: 'How it works' });
  expect(within(steps).getAllByRole('listitem')).toHaveLength(3);
});

test('lists the stack and the engineering practices, and links to the code and the contact', async () => {
  renderHome();

  await screen.findByText('UP');
  expect(screen.getByText(/Quarkus/)).toBeInTheDocument();
  expect(screen.getByText(/Playwright/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /source code/i })).toHaveAttribute('href', expect.stringContaining('github.com'));
  expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute('href', expect.stringMatching(/^(mailto:|https:)/));
});

test('the live numbers refresh every 30 seconds', async () => {
  jest.useFakeTimers();
  try {
    renderHome();
    expect(await screen.findByText('Sites monitored')).toBeInTheDocument();
    expect(dashboardApi.getOverview).toHaveBeenCalledTimes(1);

    await act(async () => { jest.advanceTimersByTime(30_000); });

    expect(dashboardApi.getOverview).toHaveBeenCalledTimes(2);
  } finally {
    jest.useRealTimers();
  }
});
