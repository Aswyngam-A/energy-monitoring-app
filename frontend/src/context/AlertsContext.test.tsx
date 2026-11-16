// Tests for the shared open-alert count: loaded once, shared by every reader, refreshable.
// The API is mocked; a tiny probe component prints what useAlerts() returns.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertsProvider, useAlerts } from './AlertsContext';
import * as alertsApi from '../api/alerts';
import { pageOf } from '../testUtils';

jest.mock('../api/alerts');

// Start every test from a clean mock: call counts and queued results must not leak between tests.
beforeEach(() => {
  jest.resetAllMocks();
});

// The count is the `total` of a page of OPEN alerts; the items themselves are not needed.
const openTotal = (total: number) => pageOf<alertsApi.Alert>([], { size: 1, total });

// Prints the count (or the error) so the tests can assert on plain text.
function Probe({ name }: { name: string }) {
  const { openCount, error } = useAlerts();
  return <p>{`${name}: ${error || openCount}`}</p>;
}

test('asks the server for the number of OPEN alerts, once, and shares it with every reader', async () => {
  jest.mocked(alertsApi.listAlerts).mockResolvedValue(openTotal(7));
  render(
    <AlertsProvider>
      <Probe name="a" />
      <Probe name="b" />
    </AlertsProvider>
  );

  expect(await screen.findByText('a: 7')).toBeInTheDocument();
  expect(screen.getByText('b: 7')).toBeInTheDocument();
  // Only the total matters, so the smallest page is requested. Two readers, a single request.
  expect(alertsApi.listAlerts).toHaveBeenCalledTimes(1);
  expect(alertsApi.listAlerts).toHaveBeenCalledWith({ status: 'OPEN', size: 1 });
});

test('exposes an error message when loading fails', async () => {
  jest.mocked(alertsApi.listAlerts).mockRejectedValue(new Error('500'));
  render(<AlertsProvider><Probe name="a" /></AlertsProvider>);

  expect(await screen.findByText('a: Could not load alerts')).toBeInTheDocument();
});

test('refresh asks again, so a change made elsewhere shows up in every reader', async () => {
  jest.mocked(alertsApi.listAlerts)
    .mockResolvedValueOnce(openTotal(2))
    .mockResolvedValueOnce(openTotal(1));
  function RefreshProbe() {
    const { openCount, refresh } = useAlerts();
    return (
      <div>
        <p>{`open: ${openCount}`}</p>
        <button onClick={() => { void refresh(); }}>refresh</button>
      </div>
    );
  }
  render(<AlertsProvider><RefreshProbe /></AlertsProvider>);
  await screen.findByText('open: 2');

  await userEvent.click(screen.getByRole('button', { name: 'refresh' }));

  expect(await screen.findByText('open: 1')).toBeInTheDocument();
  expect(alertsApi.listAlerts).toHaveBeenCalledTimes(2);
});

test('useAlerts outside a provider is a programming error', () => {
  // React logs the thrown error; silence it so the test output stays readable.
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => render(<Probe name="a" />)).toThrow(/AlertsProvider/);
  spy.mockRestore();
});
