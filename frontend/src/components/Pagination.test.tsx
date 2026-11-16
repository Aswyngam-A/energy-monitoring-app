// Tests for the Previous / "Page X of Y" / Next controls shared by every paginated list.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from './Pagination';

test('shows the current page and the number of pages (page numbers are 1-based for people)', () => {
  render(<Pagination page={0} size={20} total={50} onPageChange={() => {}} />);

  // 50 items, 20 per page -> 3 pages.
  expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
});

test('renders nothing when everything fits on one page', () => {
  const { container } = render(<Pagination page={0} size={20} total={20} onPageChange={() => {}} />);

  expect(container).toBeEmptyDOMElement();
});

test('Previous is disabled on the first page and Next on the last', () => {
  const { rerender } = render(<Pagination page={0} size={20} total={50} onPageChange={() => {}} />);
  expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();

  rerender(<Pagination page={2} size={20} total={50} onPageChange={() => {}} />);
  expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
});

test('Next and Previous ask for the neighbouring page (0-based)', async () => {
  const onPageChange = jest.fn();
  render(<Pagination page={1} size={20} total={50} onPageChange={onPageChange} />);

  await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
  expect(onPageChange).toHaveBeenLastCalledWith(2);

  await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));
  expect(onPageChange).toHaveBeenLastCalledWith(0);
});
