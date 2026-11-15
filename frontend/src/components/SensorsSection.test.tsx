// Tests for SensorsSection: loading the list, empty/error states, and adding a sensor.
// The API module is mocked, so no network is used.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SensorsSection from './SensorsSection';
import * as sensorsApi from '../api/sensors';

jest.mock('../api/sensors');

test('lists the sensors of the site, with their type when they have one', async () => {
  jest.mocked(sensorsApi.listSensors).mockResolvedValue([
    { id: 1, name: 'Main meter', type: 'power', siteId: 7 },
    { id: 2, name: 'Untyped', type: null, siteId: 7 },
  ]);
  render(<SensorsSection siteId={7} />);

  const items = await screen.findAllByRole('listitem');
  expect(items).toHaveLength(2);
  expect(items[0]).toHaveTextContent('Main meter');
  expect(items[0]).toHaveTextContent('power');
  expect(items[1]).toHaveTextContent('Untyped');
  expect(sensorsApi.listSensors).toHaveBeenCalledWith(7);
});

test('shows a message when the site has no sensors', async () => {
  jest.mocked(sensorsApi.listSensors).mockResolvedValue([]);
  render(<SensorsSection siteId={7} />);

  expect(await screen.findByText(/no sensors yet/i)).toBeInTheDocument();
});

test('shows an alert when the list cannot be loaded', async () => {
  jest.mocked(sensorsApi.listSensors).mockRejectedValue(new Error('500'));
  render(<SensorsSection siteId={7} />);

  expect(await screen.findByRole('alert')).toHaveTextContent(/could not load sensors/i);
});

test('adding a sensor calls createSensor for this site and shows it in the list', async () => {
  jest.mocked(sensorsApi.listSensors).mockResolvedValue([]);
  jest.mocked(sensorsApi.createSensor).mockResolvedValue({
    id: 5,
    name: 'New meter',
    type: 'power',
    siteId: 7,
  });
  render(<SensorsSection siteId={7} />);
  await screen.findByText(/no sensors yet/i);

  await userEvent.type(screen.getByLabelText(/name/i), 'New meter');
  await userEvent.type(screen.getByLabelText(/type/i), 'power');
  await userEvent.click(screen.getByRole('button', { name: /add sensor/i }));

  expect(sensorsApi.createSensor).toHaveBeenCalledWith(7, { name: 'New meter', type: 'power' });
  const item = await screen.findByRole('listitem');
  expect(item).toHaveTextContent('New meter');
  expect(screen.queryByText(/no sensors yet/i)).not.toBeInTheDocument();
});
