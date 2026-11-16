// Tests for the sites list: success, error, empty list, and the "New site" link.
// The API is mocked; MemoryRouter is needed because the page renders <Link>s.
import { render, screen } from '@testing-library/react';
import SitesListPage from './SitesListPage';
import { MemoryRouter } from 'react-router';
import * as sitesApi from '../api/sites';
import userEvent from '@testing-library/user-event';
import { pageOf } from '../testUtils';

jest.mock('../api/sites');

test('shows the sites when listSites resolves', async () => {
  jest.mocked(sitesApi.listSites).mockResolvedValue(pageOf([
      { id: 1, name: 'Site A', threshold: 10 },
      { id: 2, name: 'Site B', threshold: 20 },
  ]));
  render(
    <MemoryRouter>
      <SitesListPage />
    </MemoryRouter>
  );
  expect(await screen.findByText('Site A')).toBeInTheDocument();
  expect(await screen.findByText('Site B')).toBeInTheDocument();
});

test('shows the alert when listSites rejects', async () => {
  jest.mocked(sitesApi.listSites).mockRejectedValue(new Error('fail'));
  render(
    <MemoryRouter>
      <SitesListPage />
    </MemoryRouter>
  );
  expect(await screen.findByRole('alert')).toBeInTheDocument();
});

test('shows the empty message when listSites resolves []', async () => {
  jest.mocked(sitesApi.listSites).mockResolvedValue(pageOf<sitesApi.Site>([]));
  render(
    <MemoryRouter>
      <SitesListPage />
    </MemoryRouter>
  );
  expect(await screen.findByText(/no sites/i)).toBeInTheDocument();
});

test('offers a link to create a site, also when the list is empty', async () => {
  jest.mocked(sitesApi.listSites).mockResolvedValue(pageOf<sitesApi.Site>([]));
  render(
    <MemoryRouter>
      <SitesListPage />
    </MemoryRouter>
  );
  expect(await screen.findByRole('link', { name: /new site/i })).toHaveAttribute('href', '/sites/new');
});

test('offers a link to create a site next to the list', async () => {
  jest.mocked(sitesApi.listSites).mockResolvedValue(pageOf([{ id: 1, name: 'Site A', threshold: 10 }]));
  render(
    <MemoryRouter>
      <SitesListPage />
    </MemoryRouter>
  );
  expect(await screen.findByRole('link', { name: /new site/i })).toHaveAttribute('href', '/sites/new');
});

test('shows the paging controls and asks the server for the next page', async () => {
  // 45 sites in total, 20 per page -> 3 pages.
  jest.mocked(sitesApi.listSites).mockResolvedValue(pageOf([{ id: 1, name: 'Site A', threshold: 10 }], { total: 45 }));
  render(
    <MemoryRouter>
      <SitesListPage />
    </MemoryRouter>
  );
  expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();
  expect(sitesApi.listSites).toHaveBeenLastCalledWith(0);

  await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

  expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
  expect(sitesApi.listSites).toHaveBeenLastCalledWith(1);
});
