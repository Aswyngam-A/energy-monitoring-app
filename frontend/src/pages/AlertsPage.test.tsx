// Tests for /alerts: the table, the status filter, the paging controls, the Acknowledge / Resolve
// buttons and the error states. The API is mocked; MemoryRouter is needed because the page renders
// <Link>s, and AlertsProvider because the page tells it to refresh the nav badge after a change.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import AlertsPage from './AlertsPage';
import { AlertsProvider } from '../context/AlertsContext';
import * as alertsApi from '../api/alerts';
import { pageOf } from '../testUtils';

jest.mock('../api/alerts');

// Start every test from a clean mock: call counts and queued results must not leak between tests.
beforeEach(() => {
  jest.resetAllMocks();
});

const alert = (id: number, status: alertsApi.AlertStatus, extra: Partial<alertsApi.Alert> = {}): alertsApi.Alert => ({
  id, siteId: 7, sensorId: 3, readingId: id, value: 100 + id, threshold: 100,
  createdAt: `2024-05-01T1${id}:00:00Z`, status, ...extra,
});

/**
 * Answers the two kinds of request the page and the provider make: the badge asks for the smallest
 * page of OPEN alerts (size 1), the page asks for the list. `list` is what the page receives.
 */
function mockApi(list: () => alertsApi.Alert[] | Promise<never>, total?: number) {
  jest.mocked(alertsApi.listAlerts).mockImplementation(async (query = {}) => {
    if (query.size === 1) return pageOf<alertsApi.Alert>([], { size: 1, total: 0 });
    const items = await list();
    return pageOf(items, { page: query.page ?? 0, total: total ?? items.length });
  });
}

/** The calls made by the page itself (the provider's badge request has size 1). */
function pageCalls() {
  return jest.mocked(alertsApi.listAlerts).mock.calls.filter(([query]) => query?.size !== 1);
}

function renderPage() {
  render(
    <MemoryRouter>
      <AlertsProvider>
        <AlertsPage />
      </AlertsProvider>
    </MemoryRouter>
  );
}

test('loads the first page of all alerts (no filter)', async () => {
  mockApi(() => [alert(1, 'OPEN')]);
  renderPage();

  await screen.findAllByRole('row');
  expect(pageCalls()[0][0]).toEqual({ page: 0 });
});

test('shows each alert as a row, in the order received (newest first)', async () => {
  mockApi(() => [alert(2, 'OPEN', { value: 150.5 }), alert(1, 'RESOLVED', { value: 90, threshold: 80 })]);
  renderPage();

  const rows = await screen.findAllByRole('row');
  // First row is the header; then one row per alert.
  expect(rows).toHaveLength(3);
  expect(within(rows[1]).getByText('2024-05-01 12:00:00')).toBeInTheDocument();
  expect(within(rows[1]).getByText('150.5')).toBeInTheDocument();
  expect(within(rows[1]).getByText('OPEN')).toBeInTheDocument();
  expect(within(rows[2]).getByText('RESOLVED')).toBeInTheDocument();
});

test('each alert links to the page of its site', async () => {
  mockApi(() => [alert(2, 'OPEN', { siteId: 7 }), alert(1, 'OPEN', { siteId: 8 })]);
  renderPage();

  expect(await screen.findByRole('link', { name: 'Site 7' })).toHaveAttribute('href', '/sites/7');
  expect(screen.getByRole('link', { name: 'Site 8' })).toHaveAttribute('href', '/sites/8');
});

test('shows a message when there are no alerts', async () => {
  mockApi(() => []);
  renderPage();

  expect(await screen.findByText(/no alerts/i)).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

test('shows an alert when the alerts cannot be loaded', async () => {
  mockApi(() => Promise.reject(new Error('500')));
  renderPage();

  expect(await screen.findByRole('alert')).toHaveTextContent(/could not load alerts/i);
});

// ---- paging ----

test('shows the paging controls and asks the server for the next page', async () => {
  mockApi(() => [alert(1, 'OPEN')], 45); // 45 alerts in total, 20 per page -> 3 pages
  renderPage();
  expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

  expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
  expect(pageCalls().at(-1)?.[0]).toEqual({ page: 1 });
});

// ---- status filter ----

test('the status filter is sent to the server and goes back to the first page', async () => {
  mockApi(() => [alert(1, 'OPEN')], 45);
  renderPage();
  await screen.findByText('Page 1 of 3');
  await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
  await screen.findByText('Page 2 of 3');

  await userEvent.selectOptions(screen.getByLabelText('Status'), 'ACKNOWLEDGED');

  // The old page number made no sense for the new result set, so the page starts again at 0.
  await screen.findByText('Page 1 of 3');
  expect(pageCalls().at(-1)?.[0]).toEqual({ status: 'ACKNOWLEDGED', page: 0 });
});

test('choosing All removes the status from the request again', async () => {
  mockApi(() => [alert(1, 'OPEN')]);
  renderPage();
  await screen.findAllByRole('row');
  await userEvent.selectOptions(screen.getByLabelText('Status'), 'RESOLVED');
  await screen.findAllByRole('row');

  await userEvent.selectOptions(screen.getByLabelText('Status'), '');

  await screen.findAllByRole('row');
  expect(pageCalls().at(-1)?.[0]).toEqual({ page: 0 });
});

// ---- lifecycle: Acknowledge / Resolve ----

test('an open alert offers Acknowledge and Resolve, an acknowledged one only Resolve, a resolved one nothing', async () => {
  mockApi(() => [alert(3, 'RESOLVED'), alert(2, 'ACKNOWLEDGED'), alert(1, 'OPEN')]);
  renderPage();
  await screen.findAllByRole('row');

  expect(screen.getByRole('button', { name: 'Acknowledge alert 1' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Resolve alert 1' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Acknowledge alert 2' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Resolve alert 2' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /alert 3/ })).not.toBeInTheDocument();
});

test('clicking Acknowledge sends the change, reloads the page and refreshes the badge count', async () => {
  let current: alertsApi.Alert[] = [alert(1, 'OPEN')];
  mockApi(() => current);
  jest.mocked(alertsApi.updateAlertStatus).mockImplementation(async () => {
    current = [alert(1, 'ACKNOWLEDGED')]; // what the server will answer from now on
    return current[0];
  });
  renderPage();
  const badgeRequestsBefore = () => jest.mocked(alertsApi.listAlerts).mock.calls.filter(([q]) => q?.size === 1).length;

  await userEvent.click(await screen.findByRole('button', { name: 'Acknowledge alert 1' }));

  expect(alertsApi.updateAlertStatus).toHaveBeenCalledWith(1, 'ACKNOWLEDGED');
  // The reloaded row no longer offers Acknowledge.
  expect(await screen.findByRole('button', { name: 'Resolve alert 1' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Acknowledge alert 1' })).not.toBeInTheDocument();
  // The nav badge was asked again (first load + one refresh).
  expect(badgeRequestsBefore()).toBe(2);
});

test('shows an alert when the change is refused and keeps the table', async () => {
  mockApi(() => [alert(1, 'OPEN')]);
  jest.mocked(alertsApi.updateAlertStatus).mockRejectedValue(new Error('400'));
  renderPage();

  await userEvent.click(await screen.findByRole('button', { name: 'Resolve alert 1' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/could not update alert/i);
  expect(screen.getAllByRole('row')).toHaveLength(2);
});

test('shows a loading status while the alerts are being fetched', async () => {
  jest.mocked(alertsApi.listAlerts).mockReturnValue(new Promise(() => {}));
  renderPage();

  expect(screen.getByRole('status')).toHaveTextContent('Loading alerts...');
});
