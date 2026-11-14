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
