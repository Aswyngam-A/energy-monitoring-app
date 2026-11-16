// Tests for /dashboard: one card per site (latest reading, open alerts), a chart of the selected
// site's recent readings, and the loading / error / empty states. The API modules are mocked and
// the chart is stubbed (it has its own tests), so these tests are about the page's behaviour.
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import DashboardPage from './DashboardPage';
import * as dashboardApi from '../api/dashboard';
import * as readingsApi from '../api/readings';
import { pageOf } from '../testUtils';

jest.mock('../api/dashboard');
jest.mock('../api/readings');
// Stub: shows how many readings it received, which is all this page is responsible for.
jest.mock('../components/ReadingsChart', () => ({
  __esModule: true,
  default: ({ readings }: { readings: unknown[] }) => <div>chart with {readings.length} readings</div>,
}));

beforeEach(() => {
  jest.resetAllMocks();
});

const summary: dashboardApi.SiteSummary[] = [
  { siteId: 1, siteName: 'Alpha', latestReading: { value: 12.5, timestamp: '2024-05-01T10:15:30Z' }, openAlerts: 2 },
  { siteId: 2, siteName: 'Bravo', latestReading: null, openAlerts: 0 },
];

const readings: readingsApi.Reading[] = [
  { id: 2, value: 20, timestamp: '2024-05-01T11:00:00Z', sensorId: 3, sensorName: 'Main meter' },
  { id: 1, value: 10, timestamp: '2024-05-01T10:00:00Z', sensorId: 3, sensorName: 'Main meter' },
];

function renderPage() {
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

test('shows a loading status first', () => {
  jest.mocked(dashboardApi.getDashboardSummary).mockReturnValue(new Promise(() => {}));
  renderPage();

  expect(screen.getByRole('status')).toHaveTextContent('Loading dashboard...');
});

test('shows an alert when the summary cannot be loaded', async () => {
  jest.mocked(dashboardApi.getDashboardSummary).mockRejectedValue(new Error('500'));
  renderPage();

  expect(await screen.findByRole('alert')).toHaveTextContent(/could not load the dashboard/i);
});

test('shows a message when there are no sites', async () => {
  jest.mocked(dashboardApi.getDashboardSummary).mockResolvedValue([]);
  renderPage();

  expect(await screen.findByText(/no sites yet/i)).toBeInTheDocument();
});

test('shows one card per site with its latest reading and its open alerts', async () => {
  jest.mocked(dashboardApi.getDashboardSummary).mockResolvedValue(summary);
  jest.mocked(readingsApi.listSiteReadings).mockResolvedValue(pageOf(readings));
  renderPage();

  const alpha = (await screen.findByRole('heading', { name: 'Alpha' })).closest('article')!;
  expect(within(alpha).getByText('12.5 kW')).toBeInTheDocument();
  expect(within(alpha).getByText('2024-05-01 10:15:30 UTC')).toBeInTheDocument();
  expect(within(alpha).getByText('2 open alerts')).toBeInTheDocument();
  expect(within(alpha).getByRole('link', { name: 'Alpha' })).toHaveAttribute('href', '/sites/1');

  const bravo = screen.getByRole('heading', { name: 'Bravo' }).closest('article')!;
  expect(within(bravo).getByText('No readings yet')).toBeInTheDocument();
  expect(within(bravo).getByText('0 open alerts')).toBeInTheDocument();
});

test('charts the readings of the first site at first', async () => {
  jest.mocked(dashboardApi.getDashboardSummary).mockResolvedValue(summary);
  jest.mocked(readingsApi.listSiteReadings).mockResolvedValue(pageOf(readings));
  renderPage();

  expect(await screen.findByText('chart with 2 readings')).toBeInTheDocument();
  expect(readingsApi.listSiteReadings).toHaveBeenCalledWith(1, {}, 0);
});

test('choosing another site charts that site instead', async () => {
  jest.mocked(dashboardApi.getDashboardSummary).mockResolvedValue(summary);
  jest.mocked(readingsApi.listSiteReadings)
    .mockResolvedValueOnce(pageOf(readings))
    .mockResolvedValueOnce(pageOf([readings[0]]));
  renderPage();
  await screen.findByText('chart with 2 readings');

  await userEvent.selectOptions(screen.getByLabelText('Chart site'), '2');

  expect(await screen.findByText('chart with 1 readings')).toBeInTheDocument();
  expect(readingsApi.listSiteReadings).toHaveBeenLastCalledWith(2, {}, 0);
});

test('says so when the chart readings cannot be loaded, without hiding the cards', async () => {
  jest.mocked(dashboardApi.getDashboardSummary).mockResolvedValue(summary);
  jest.mocked(readingsApi.listSiteReadings).mockRejectedValue(new Error('500'));
  renderPage();

  expect(await screen.findByRole('alert')).toHaveTextContent(/could not load readings/i);
  expect(screen.getByRole('heading', { name: 'Alpha' })).toBeInTheDocument();
});

// ---- Polish 3: live refresh ----

test('refreshes the cards and the chart every 30 seconds without a loading flash', async () => {
  jest.useFakeTimers();
  try {
    jest.mocked(dashboardApi.getDashboardSummary)
      .mockResolvedValueOnce(summary)
      .mockResolvedValueOnce([{ ...summary[0], openAlerts: 5 }, summary[1]]);
    jest.mocked(readingsApi.listSiteReadings).mockResolvedValue(pageOf(readings));
    renderPage();
    expect(await screen.findByText('2 open alerts')).toBeInTheDocument();

    await act(async () => { jest.advanceTimersByTime(30_000); });

    expect(await screen.findByText('5 open alerts')).toBeInTheDocument();
    expect(dashboardApi.getDashboardSummary).toHaveBeenCalledTimes(2);
    // The chart's readings are asked for again too.
    expect(readingsApi.listSiteReadings).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});

test('a failed refresh keeps showing the data already on screen', async () => {
  jest.useFakeTimers();
  try {
    jest.mocked(dashboardApi.getDashboardSummary)
      .mockResolvedValueOnce(summary)
      .mockRejectedValueOnce(new Error('500'));
    jest.mocked(readingsApi.listSiteReadings).mockResolvedValue(pageOf(readings));
    renderPage();
    expect(await screen.findByText('2 open alerts')).toBeInTheDocument();

    await act(async () => { jest.advanceTimersByTime(30_000); });

    expect(dashboardApi.getDashboardSummary).toHaveBeenCalledTimes(2);
    expect(screen.getByText('2 open alerts')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});
