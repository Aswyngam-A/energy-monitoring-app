import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import * as healthApi from './api/health';
import App from './App';

jest.mock('./api/health');

test('shows UP when getHealth resolves', async () => {
jest.mocked(healthApi.getHealth).mockResolvedValue({ status: 'UP' });
render(
  <MemoryRouter initialEntries={['/']}>
    <App />
  </MemoryRouter>
);
  expect(await screen.findByText('UP')).toBeInTheDocument();
});

test('shows a not-found message for unknown URLs', async () => {
render(
  <MemoryRouter initialEntries={['/nothing-here']}>
    <App />
  </MemoryRouter>
);
expect(await screen.findByText(/page not found/i)).toBeInTheDocument();
});
