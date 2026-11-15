import { render, screen } from '@testing-library/react';
import SitesListPage from './SitesListPage';
import { MemoryRouter } from 'react-router';
import * as sitesApi from '../api/sites';

jest.mock('../api/sites');

test('shows the sites when listSites resolves', async () => {
  jest.mocked(sitesApi.listSites).mockResolvedValue([
      { id: 1, name: 'Site A', threshold: 10 },
      { id: 2, name: 'Site B', threshold: 20 },
  ]);
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
  jest.mocked(sitesApi.listSites).mockResolvedValue([]);
  render(
    <MemoryRouter>
      <SitesListPage />
    </MemoryRouter>
  );
  expect(await screen.findByText(/no sites/i)).toBeInTheDocument();
});
