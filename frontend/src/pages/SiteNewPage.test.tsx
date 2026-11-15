// Tests for /sites/new. The API is mocked; a placeholder route stands in for the detail page
// so we can verify the redirect after a successful create.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import SiteNewPage from './SiteNewPage';
import * as sitesApi from '../api/sites';

jest.mock('../api/sites');

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/sites/new']}>
      <Routes>
        <Route path="/sites/new" element={<SiteNewPage />} />
        <Route path="/sites/:id" element={<p>Detail page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

test('creates the site and goes to its detail page', async () => {
  jest.mocked(sitesApi.createSite).mockResolvedValue({ id: 9, name: 'Site A', threshold: 10 });
  renderPage();
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/name/i), 'Site A');
  await user.type(screen.getByLabelText(/threshold/i), '10');
  await user.click(screen.getByRole('button', { name: /create site/i }));
  expect(sitesApi.createSite).toHaveBeenCalledWith({ name: 'Site A', threshold: 10 });
  expect(await screen.findByText('Detail page')).toBeInTheDocument();
});

test('stays on the form and shows an alert when the API fails', async () => {
  jest.mocked(sitesApi.createSite).mockRejectedValue(new Error('500'));
  renderPage();
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/name/i), 'Site A');
  await user.type(screen.getByLabelText(/threshold/i), '10');
  await user.click(screen.getByRole('button', { name: /create site/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/could not save/i);
  expect(screen.queryByText('Detail page')).not.toBeInTheDocument();
});
