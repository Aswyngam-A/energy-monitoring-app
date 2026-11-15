// Tests for the home page: the API is mocked, so we check how the page reacts to a success and to a failure.
import { render, screen } from '@testing-library/react';
import HomePage from './HomePage';
import * as healthApi from '../api/health';

jest.mock('../api/health');

test('shows UP when getHealth resolves', async () => {
  jest.mocked(healthApi.getHealth).mockResolvedValue({ status: 'UP' });
  render(<HomePage />);
  expect(await screen.findByText('UP')).toBeInTheDocument();
});

test('shows error when getHealth rejects', async () => {
  jest.mocked(healthApi.getHealth).mockRejectedValue(new Error('fail'));
  render(<HomePage />);
  expect(await screen.findByRole('alert')).toBeInTheDocument();
});
