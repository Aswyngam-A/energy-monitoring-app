// Tests for the shared page frame.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Layout from './Layout';

test('renders app name', () => {
  render(
    <MemoryRouter>
      <Layout />
    </MemoryRouter>
  );
  expect(screen.getByText('EnergyWatch')).toBeInTheDocument();
});

test('has a navigation link to the alerts page', () => {
  render(
    <MemoryRouter>
      <Layout />
    </MemoryRouter>
  );
  expect(screen.getByRole('link', { name: /alerts/i })).toHaveAttribute('href', '/alerts');
});
