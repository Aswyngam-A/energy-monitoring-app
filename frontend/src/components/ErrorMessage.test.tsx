// Tests for the shared error message.
import { render, screen } from '@testing-library/react';
import ErrorMessage from './ErrorMessage';

test('shows the message as an alert (announced immediately by screen readers)', () => {
  render(<ErrorMessage message="Could not load sites" />);
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load sites');
});

test('renders nothing when there is no message, so callers need no condition', () => {
  const { container } = render(<ErrorMessage message="" />);
  expect(container).toBeEmptyDOMElement();
});
