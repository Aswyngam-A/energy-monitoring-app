// Tests for /dashboard: one card per site (latest reading, open alerts), a chart of the selected
// site's recent readings, and the loading / error / empty states. The API modules are mocked and
// the chart is stubbed (it has its own tests), so these tests are about the page's behaviour.
// The summary arrives as a page ({ items, page, size, total }) since polish item 4.
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
  jest.mocked(dashboardApi.getDashboardSummary).mockResolvedValue(pageOf([]));
  renderPage();

  expect(await screen.findByText(/no sites yet/i)).toBeInTheDocument();
});

test('shows one card per site with its latest reading and its open alerts', async () => {
  jest.mocked(dashboardApi.getDashboardSummary).mockResolvedValue(pageOf(summary));
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
  jest.mocked(dashboardApi.getDashboardSummary).mockResolvedValue(pageOf(summary));
  jest.mocked(readingsApi.listSiteReadings).mockResolvedValue(pageOf(readings));
  renderPage();

  expect(await screen.findByText('chart with 2 readings')).toBeInTheDocument();
  expect(readingsApi.listSiteReadings).toHaveBeenCalledWith(1, {}, 0);
});

test('choosing another site charts that site instead', async () => {
  jest.mocked(dashboardApi.getDashboardSummary).mockResolvedValue(pageOf(summary));
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
  jest.mocked(dashboardApi.getDashboardSummary).mockResolvedValue(pageOf(summary));
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
      .mockResolvedValueOnce(pageOf(summary))
      .mockResolvedValueOnce(pageOf([{ ...summary[0], openAlerts: 5 }, summary[1]]));
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
      .mockResolvedValueOnce(pageOf(summary))
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

// ---- Polish 4: paginated summary ----

/** A summary page for the paging tests: `names` are the sites on that page. */
function summaryPage(names: string[], page: number, total: number) {
  return pageOf(
    names.map((name, i) => ({ siteId: page * 100 + i + 1, siteName: name, latestReading: null, openAlerts: 0 })),
    { page, size: names.length, total },
  );
}

test('asks for the first page of the summary and shows paging controls when there are several pages', async () => {
  jest.mocked(dashboardApi.getDashboardSummary).mockResolvedValue(summaryPage(['Alpha', 'Bravo'], 0, 5));
  jest.mocked(readingsApi.listSiteReadings).mockResolvedValue(pageOf(readings));
  renderPage();

  expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();
  expect(dashboardApi.getDashboardSummary).toHaveBeenCalledWith(0);
});

test('shows no paging controls when everything fits on one page', async () => {
  jest.mocked(dashboardApi.getDashboardSummary).mockResolvedValue(pageOf(summary));
  jest.mocked(readingsApi.listSiteReadings).mockResolvedValue(pageOf(readings));
  renderPage();

  await screen.findByRole('heading', { name: 'Alpha' });
  expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
});

test('Next page loads the next page of cards', async () => {
  jest.mocked(dashboardApi.getDashboardSummary)
    .mockResolvedValueOnce(summaryPage(['Alpha', 'Bravo'], 0, 4))
    .mockResolvedValueOnce(summaryPage(['Charlie', 'Delta'], 1, 4));
  jest.mocked(readingsApi.listSiteReadings).mockResolvedValue(pageOf(readings));
  renderPage();
  await screen.findByRole('heading', { name: 'Alpha' });

  await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

  expect(await screen.findByRole('heading', { name: 'Charlie' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Alpha' })).not.toBeInTheDocument();
  expect(dashboardApi.getDashboardSummary).toHaveBeenLastCalledWith(1);
});

test('the chart select lists the sites of the current page, and the chart follows the page', async () => {
  jest.mocked(dashboardApi.getDashboardSummary)
    .mockResolvedValueOnce(summaryPage(['Alpha', 'Bravo'], 0, 4))
    .mockResolvedValueOnce(summaryPage(['Charlie', 'Delta'], 1, 4));
  jest.mocked(readingsApi.listSiteReadings).mockResolvedValue(pageOf(readings));
  renderPage();
  await screen.findByRole('heading', { name: 'Alpha' });
  // The user picks the second site (id 2), then moves to a page that does not contain it.
  await userEvent.selectOptions(screen.getByLabelText('Chart site'), '2');
  await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
  await screen.findByRole('heading', { name: 'Charlie' });

  const select = screen.getByLabelText('Chart site');
  expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['Charlie', 'Delta']);
  // Site 2 is not on this page any more: the chart falls back to the page's first site (id 101).
  expect(readingsApi.listSiteReadings).toHaveBeenLastCalledWith(101, {}, 0);
});

test('a refresh tick reloads the page the user is on, not the first one', async () => {
  jest.useFakeTimers();
  try {
    jest.mocked(dashboardApi.getDashboardSummary).mockImplementation(async (page = 0) =>
      page === 0 ? summaryPage(['Alpha', 'Bravo'], 0, 4) : summaryPage(['Charlie', 'Delta'], 1, 4));
    jest.mocked(readingsApi.listSiteReadings).mockResolvedValue(pageOf(readings));
    renderPage();
    // userEvent waits with timers; with a fake clock it must be told how to move that clock.
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await screen.findByRole('heading', { name: 'Alpha' });
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findByRole('heading', { name: 'Charlie' });

    await act(async () => { jest.advanceTimersByTime(30_000); });

    expect(dashboardApi.getDashboardSummary).toHaveBeenLastCalledWith(1);
    expect(screen.getByRole('heading', { name: 'Charlie' })).toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});

// ---- UI design pass: highlight what changed ----

test('a tile whose numbers changed in a refresh is marked as changed; unchanged tiles are not', async () => {
  jest.useFakeTimers();
  try {
    jest.mocked(dashboardApi.getDashboardSummary)
      .mockResolvedValueOnce(pageOf(summary))
      .mockResolvedValueOnce(pageOf([{ ...summary[0], openAlerts: 5 }, summary[1]]));
    jest.mocked(readingsApi.listSiteReadings).mockResolvedValue(pageOf(readings));
    renderPage();
    await screen.findByText('2 open alerts');
    // The first load is not a "change": nothing is marked.
    expect(document.querySelectorAll('[data-changed="true"]')).toHaveLength(0);

    await act(async () => { jest.advanceTimersByTime(30_000); });

    const alpha = screen.getByRole('heading', { name: 'Alpha' }).closest('article')!;
    const bravo = screen.getByRole('heading', { name: 'Bravo' }).closest('article')!;
    expect(alpha).toHaveAttribute('data-changed', 'true');
    expect(bravo).not.toHaveAttribute('data-changed', 'true');
  } finally {
    jest.useRealTimers();
  }
});

test('a tile with open alerts is marked as in alarm', async () => {
  jest.mocked(dashboardApi.getDashboardSummary).mockResolvedValue(pageOf(summary));
  jest.mocked(readingsApi.listSiteReadings).mockResolvedValue(pageOf(readings));
  renderPage();

  const alpha = (await screen.findByRole('heading', { name: 'Alpha' })).closest('article')!;
  expect(alpha).toHaveAttribute('data-alarm', 'true');
  expect(screen.getByRole('heading', { name: 'Bravo' }).closest('article')).toHaveAttribute('data-alarm', 'false');
});
