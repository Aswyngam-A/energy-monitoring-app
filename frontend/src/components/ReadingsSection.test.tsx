// Tests for ReadingsSection: the table, empty/error states and the from/to filter.
// The API module is mocked, so no network is used.
// The datetime-local inputs are filled with fireEvent.change: userEvent.type does not
// handle that input type well in jsdom.
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadingsSection from './ReadingsSection';
import * as readingsApi from '../api/readings';

jest.mock('../api/readings');

const readings = [
  { id: 2, value: 12.5, timestamp: '2024-05-01T11:00:00Z', sensorId: 3, sensorName: 'Main meter' },
  { id: 1, value: 3, timestamp: '2024-05-01T10:00:00Z', sensorId: 4, sensorName: 'Heater' },
];

beforeEach(() => {
  jest.mocked(readingsApi.listSiteReadings).mockResolvedValue(readings);
});

test('loads the site readings without a range at first', async () => {
  render(<ReadingsSection siteId={7} />);

  await screen.findAllByRole('row');
  expect(readingsApi.listSiteReadings).toHaveBeenCalledWith(7, {});
});

test('shows each reading as a row with time (UTC), sensor and value, in the order received', async () => {
  render(<ReadingsSection siteId={7} />);

  const rows = await screen.findAllByRole('row');
  // First row is the header; then one row per reading, newest first as the API returns them.
  expect(rows).toHaveLength(3);
  expect(within(rows[1]).getByText('2024-05-01 11:00:00')).toBeInTheDocument();
  expect(within(rows[1]).getByText('Main meter')).toBeInTheDocument();
  expect(within(rows[1]).getByText('12.5')).toBeInTheDocument();
  expect(within(rows[2]).getByText('Heater')).toBeInTheDocument();
});

test('shows a message when there are no readings', async () => {
  jest.mocked(readingsApi.listSiteReadings).mockResolvedValue([]);
  render(<ReadingsSection siteId={7} />);

  expect(await screen.findByText(/no readings found/i)).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

test('shows an alert when the readings cannot be loaded', async () => {
  jest.mocked(readingsApi.listSiteReadings).mockRejectedValue(new Error('500'));
  render(<ReadingsSection siteId={7} />);

  expect(await screen.findByRole('alert')).toHaveTextContent(/could not load readings/i);
});

test('applying the filter reloads with from and to as ISO instants (the inputs are UTC)', async () => {
  render(<ReadingsSection siteId={7} />);
  await screen.findAllByRole('row');

  fireEvent.change(screen.getByLabelText(/from/i), { target: { value: '2024-05-01T10:00' } });
  fireEvent.change(screen.getByLabelText(/to/i), { target: { value: '2024-05-01T12:00' } });
  await userEvent.click(screen.getByRole('button', { name: /apply filter/i }));

  expect(readingsApi.listSiteReadings).toHaveBeenLastCalledWith(7, {
    from: '2024-05-01T10:00:00.000Z',
    to: '2024-05-01T12:00:00.000Z',
  });
  // Wait for the reload to settle so no state update happens after the test ends.
  await screen.findAllByRole('row');
});

test('a range where from is after to shows an error and does not call the API again', async () => {
  render(<ReadingsSection siteId={7} />);
  await screen.findAllByRole('row');
  jest.mocked(readingsApi.listSiteReadings).mockClear();

  fireEvent.change(screen.getByLabelText(/from/i), { target: { value: '2024-05-01T12:00' } });
  fireEvent.change(screen.getByLabelText(/to/i), { target: { value: '2024-05-01T10:00' } });
  await userEvent.click(screen.getByRole('button', { name: /apply filter/i }));

  expect(screen.getByText('From must not be after To')).toBeInTheDocument();
  expect(readingsApi.listSiteReadings).not.toHaveBeenCalled();
});

test('clearing the filter empties the inputs and reloads without a range', async () => {
  render(<ReadingsSection siteId={7} />);
  await screen.findAllByRole('row');

  fireEvent.change(screen.getByLabelText(/from/i), { target: { value: '2024-05-01T10:00' } });
  await userEvent.click(screen.getByRole('button', { name: /apply filter/i }));
  await screen.findAllByRole('row');

  await userEvent.click(screen.getByRole('button', { name: /clear/i }));

  expect(screen.getByLabelText(/from/i)).toHaveValue('');
  expect(readingsApi.listSiteReadings).toHaveBeenLastCalledWith(7, {});
  await screen.findAllByRole('row');
});
