// Unit tests for the readings API client. The Axios client is mocked, so no network is used:
// we only check which URL, query parameters and body each function sends and what it returns.
import client from './client';
import { createReading, listSiteReadings } from './readings';

jest.mock('./client');

const reading = {
  id: 1,
  value: 12.5,
  timestamp: '2024-05-01T10:15:30Z',
  sensorId: 3,
  sensorName: 'Main meter',
};

// The backend answers with a page { items, page, size, total } (M7). Until the pagination controls
// exist (M7 step 5) the client asks for the largest page (100) and returns its items.
const page = (items: object[]) => ({ items, page: 0, size: 100, total: items.length });

test('listSiteReadings GETs the largest page of the site and returns its items when no range is given', async () => {
  jest.mocked(client.get).mockResolvedValue({ data: page([reading]) });
  const result = await listSiteReadings(7);
  expect(client.get).toHaveBeenCalledWith('/sites/7/readings', { params: { size: 100 } });
  expect(result).toEqual([reading]);
});

test('listSiteReadings sends from and to as query parameters', async () => {
  jest.mocked(client.get).mockResolvedValue({ data: page([]) });
  await listSiteReadings(7, { from: '2024-05-01T10:00:00Z', to: '2024-05-01T12:00:00Z' });
  expect(client.get).toHaveBeenCalledWith('/sites/7/readings', {
    params: { from: '2024-05-01T10:00:00Z', to: '2024-05-01T12:00:00Z', size: 100 },
  });
});

test('listSiteReadings leaves out a bound that is missing or blank', async () => {
  jest.mocked(client.get).mockResolvedValue({ data: page([]) });
  await listSiteReadings(7, { from: '2024-05-01T10:00:00Z', to: '' });
  expect(client.get).toHaveBeenCalledWith('/sites/7/readings', {
    params: { from: '2024-05-01T10:00:00Z', size: 100 },
  });
});

test('createReading POSTs the input under the sensor and returns the created reading', async () => {
  jest.mocked(client.post).mockResolvedValue({ data: reading });
  const result = await createReading(3, { value: 12.5, timestamp: '2024-05-01T10:15:30Z' });
  expect(client.post).toHaveBeenCalledWith('/sensors/3/readings', {
    value: 12.5,
    timestamp: '2024-05-01T10:15:30Z',
  });
  expect(result).toEqual(reading);
});

test('createReading accepts input without a timestamp', async () => {
  jest.mocked(client.post).mockResolvedValue({ data: reading });
  await createReading(3, { value: 0 });
  expect(client.post).toHaveBeenCalledWith('/sensors/3/readings', { value: 0 });
});
