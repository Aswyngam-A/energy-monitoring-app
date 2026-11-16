// Unit tests for the sites API client. The Axios client is mocked, so no network is used:
// we only check which URL and body each function sends and what it returns.
import client from './client';
import { createSite, listSites, updateSite } from './sites';

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

test('listSites GETs one page of sites and returns the whole page', async () => {
  // Page shape { items, page, size, total } (M7).
  const page = { items: [{ id: 1, name: 'A', threshold: 10 }], page: 1, size: 20, total: 21 };
  jest.mocked(client.get).mockResolvedValue({ data: page });
  const result = await listSites(1);
  expect(client.get).toHaveBeenCalledWith('/sites', { params: { page: 1 } });
  expect(result).toEqual(page);
});

test('listSites asks for the first page by default', async () => {
  jest.mocked(client.get).mockResolvedValue({ data: { items: [], page: 0, size: 20, total: 0 } });
  await listSites();
  expect(client.get).toHaveBeenCalledWith('/sites', { params: { page: 0 } });
});
