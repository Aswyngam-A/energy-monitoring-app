// Tests for the alert status chip: it must always say the status in words (never colour alone)
// and expose the status to the stylesheet through data-status.
import { render, screen } from '@testing-library/react';
import StatusChip from './StatusChip';

test.each(['OPEN', 'ACKNOWLEDGED', 'RESOLVED'] as const)('shows %s as text and as data-status', (status) => {
  render(<StatusChip status={status} />);

  expect(screen.getByText(status)).toHaveAttribute('data-status', status);
});
