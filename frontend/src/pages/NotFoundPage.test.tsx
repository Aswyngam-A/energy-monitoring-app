// Tests for the fallback page: it says the page is missing and offers a way back.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import NotFoundPage from './NotFoundPage';

test('says the page was not found and links back to the dashboard', () => {
  render(<MemoryRouter><NotFoundPage /></MemoryRouter>);

  expect(screen.getByText('Page not found')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to the dashboard' })).toHaveAttribute('href', '/dashboard');
});
