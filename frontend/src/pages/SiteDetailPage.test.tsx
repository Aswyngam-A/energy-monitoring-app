// Tests for /sites/:id: success, not-found alert, and the navigation links.
// renderAt() mounts the page inside a route with :id so useParams() works.
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import SiteDetailPage from './SiteDetailPage';
import * as sitesApi from '../api/sites';

jest.mock('../api/sites');
// The sensors and readings sections have their own tests and their own API calls; replace
// them with stubs here so these tests stay about the site itself.
jest.mock('../components/SensorsSection', () => ({
  __esModule: true,
  default: ({ siteId }: { siteId: number }) => <div>sensors for site {siteId}</div>,
}));
jest.mock('../components/ReadingsSection', () => ({
  __esModule: true,
  default: ({ siteId }: { siteId: number }) => <div>readings for site {siteId}</div>,
}));

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/sites/:id" element={<SiteDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

test('shows the site name and threshold when getSite resolves', async () => {
  jest.mocked(sitesApi.getSite).mockResolvedValue({ id: 7, name: 'Site A', threshold: 42 });
  renderAt('/sites/7');
  expect(await screen.findByText('Site A')).toBeInTheDocument();
  expect(screen.getByText(/42/)).toBeInTheDocument();
  expect(sitesApi.getSite).toHaveBeenCalledWith(7);
});

test('shows a not-found alert when getSite rejects', async () => {
  jest.mocked(sitesApi.getSite).mockRejectedValue(new Error('404'));
  renderAt('/sites/999');
  expect(await screen.findByRole('alert')).toHaveTextContent(/site not found/i);
});

test('has a link back to the sites list', async () => {
  jest.mocked(sitesApi.getSite).mockResolvedValue({ id: 1, name: 'Site A', threshold: 10 });
  renderAt('/sites/1');
  expect(await screen.findByRole('link', { name: /back to sites/i })).toHaveAttribute('href', '/sites');
});

test('has an edit link to the edit page', async () => {
  jest.mocked(sitesApi.getSite).mockResolvedValue({ id: 7, name: 'Site A', threshold: 10 });
  renderAt('/sites/7');
  expect(await screen.findByRole('link', { name: /edit/i })).toHaveAttribute('href', '/sites/7/edit');
});

test('shows the sensors section for this site', async () => {
  jest.mocked(sitesApi.getSite).mockResolvedValue({ id: 7, name: 'Site A', threshold: 10 });
  renderAt('/sites/7');
  expect(await screen.findByText('sensors for site 7')).toBeInTheDocument();
});

test('shows the readings section for this site', async () => {
  jest.mocked(sitesApi.getSite).mockResolvedValue({ id: 7, name: 'Site A', threshold: 10 });
  renderAt('/sites/7');
  expect(await screen.findByText('readings for site 7')).toBeInTheDocument();
});
