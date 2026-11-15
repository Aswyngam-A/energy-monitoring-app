// Unit tests for the sensors API client. The Axios client is mocked, so no network is used:
// we only check which URL and body each function sends and what it returns.
import client from './client';
import { createSensor, getSensor, listSensors } from './sensors';

jest.mock('./client');

test('listSensors GETs the sensors nested under the site and returns them', async () => {
  const sensors = [{ id: 1, name: 'Main meter', type: 'power', siteId: 7 }];
  jest.mocked(client.get).mockResolvedValue({ data: sensors });
  const result = await listSensors(7);
  expect(client.get).toHaveBeenCalledWith('/sites/7/sensors');
  expect(result).toEqual(sensors);
});

test('getSensor GETs /sensors/{id} (not nested) and returns the sensor', async () => {
  const sensor = { id: 3, name: 'Main meter', type: null, siteId: 7 };
  jest.mocked(client.get).mockResolvedValue({ data: sensor });
  const result = await getSensor(3);
  expect(client.get).toHaveBeenCalledWith('/sensors/3');
  expect(result).toEqual(sensor);
});

test('createSensor POSTs the input under the site and returns the created sensor', async () => {
  jest.mocked(client.post).mockResolvedValue({
    data: { id: 9, name: 'Main meter', type: 'power', siteId: 7 },
  });
  const result = await createSensor(7, { name: 'Main meter', type: 'power' });
  expect(client.post).toHaveBeenCalledWith('/sites/7/sensors', { name: 'Main meter', type: 'power' });
  expect(result).toEqual({ id: 9, name: 'Main meter', type: 'power', siteId: 7 });
});

test('createSensor accepts input without a type', async () => {
  jest.mocked(client.post).mockResolvedValue({
    data: { id: 10, name: 'Untyped', type: null, siteId: 7 },
  });
  await createSensor(7, { name: 'Untyped' });
  expect(client.post).toHaveBeenCalledWith('/sites/7/sensors', { name: 'Untyped' });
});
