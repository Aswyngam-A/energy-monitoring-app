// Tests for the shared "something is loading" message.
import { render, screen } from '@testing-library/react';
import LoadingState from './LoadingState';

test('says Loading... by default', () => {
  render(<LoadingState />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});

test('names what is loading when a label is given', () => {
  render(<LoadingState label="readings" />);
  expect(screen.getByText('Loading readings...')).toBeInTheDocument();
});

test('is announced politely to screen readers (role status, not alert)', () => {
  render(<LoadingState label="alerts" />);
  // role="status" is a polite live region: it does not interrupt the user like an alert does.
  expect(screen.getByRole('status')).toHaveTextContent('Loading alerts...');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
