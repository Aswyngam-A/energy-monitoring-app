// Unit tests for the sites API client. The Axios client is mocked, so no network is used:
// we only check which URL and body each function sends and what it returns.
import client from './client';
import { createSite, updateSite } from './sites';

jest.mock('./client');

test('createSite POSTs the input to /sites and returns the created site', async () => {
  jest.mocked(client.post).mockResolvedValue({ data: { id: 5, name: 'A', threshold: 10 } });
  const site = await createSite({ name: 'A', threshold: 10 });
  expect(client.post).toHaveBeenCalledWith('/sites', { name: 'A', threshold: 10 });
  expect(site).toEqual({ id: 5, name: 'A', threshold: 10 });
});

test('updateSite PUTs the input to /sites/{id} and returns the updated site', async () => {
  jest.mocked(client.put).mockResolvedValue({ data: { id: 5, name: 'B', threshold: 20 } });
  const site = await updateSite(5, { name: 'B', threshold: 20 });
  expect(client.put).toHaveBeenCalledWith('/sites/5', { name: 'B', threshold: 20 });
  expect(site).toEqual({ id: 5, name: 'B', threshold: 20 });
});
