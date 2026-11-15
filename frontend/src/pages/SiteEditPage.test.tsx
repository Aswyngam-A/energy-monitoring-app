// Tests for /sites/:id/edit: loading the site into the form, saving then redirecting,
// and the two failure cases (site cannot be loaded, save fails).
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import SiteEditPage from './SiteEditPage';
import * as sitesApi from '../api/sites';

jest.mock('../api/sites');

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/sites/7/edit']}>
      <Routes>
        <Route path="/sites/:id/edit" element={<SiteEditPage />} />
        <Route path="/sites/:id" element={<p>Detail page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

test('loads the site into the form, saves changes and goes back to the detail page', async () => {
  jest.mocked(sitesApi.getSite).mockResolvedValue({ id: 7, name: 'Old', threshold: 10 });
  jest.mocked(sitesApi.updateSite).mockResolvedValue({ id: 7, name: 'New', threshold: 10 });
  renderPage();
  const user = userEvent.setup();
  const name = await screen.findByLabelText(/name/i);
  expect(name).toHaveValue('Old');
  await user.clear(name);
  await user.type(name, 'New');
  await user.click(screen.getByRole('button', { name: /save changes/i }));
  expect(sitesApi.updateSite).toHaveBeenCalledWith(7, { name: 'New', threshold: 10 });
  expect(await screen.findByText('Detail page')).toBeInTheDocument();
});

test('shows a not-found alert when the site cannot be loaded', async () => {
  jest.mocked(sitesApi.getSite).mockRejectedValue(new Error('404'));
  renderPage();
  expect(await screen.findByRole('alert')).toHaveTextContent(/site not found/i);
});

test('shows an alert and stays on the form when saving fails', async () => {
  jest.mocked(sitesApi.getSite).mockResolvedValue({ id: 7, name: 'Old', threshold: 10 });
  jest.mocked(sitesApi.updateSite).mockRejectedValue(new Error('500'));
  renderPage();
  const user = userEvent.setup();
  await screen.findByLabelText(/name/i);
  await user.click(screen.getByRole('button', { name: /save changes/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/could not save/i);
  expect(screen.queryByText('Detail page')).not.toBeInTheDocument();
});
