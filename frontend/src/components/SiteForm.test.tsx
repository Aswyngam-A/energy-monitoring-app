// Tests for the create/edit form: client-side validation (nothing is submitted when invalid),
// the exact payload on success, prefilled values, and the alert when onSubmit fails.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SiteForm from './SiteForm';

function setup(onSubmit = jest.fn().mockResolvedValue(undefined), initialValues?: { name: string; threshold: number }) {
  render(<SiteForm submitLabel="Save" onSubmit={onSubmit} initialValues={initialValues} />);
  return { onSubmit, user: userEvent.setup() };
}

test('shows an error and does not submit when the name is empty', async () => {
  const { onSubmit, user } = setup();
  await user.type(screen.getByLabelText(/threshold/i), '10');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test('shows an error and does not submit when the name is only spaces', async () => {
  const { onSubmit, user } = setup();
  await user.type(screen.getByLabelText(/name/i), '   ');
  await user.type(screen.getByLabelText(/threshold/i), '10');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test.each(['', '0', '-5'])('shows an error and does not submit when the threshold is "%s"', async (value) => {
  const { onSubmit, user } = setup();
  await user.type(screen.getByLabelText(/name/i), 'Site A');
  if (value) await user.type(screen.getByLabelText(/threshold/i), value);
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByText(/threshold must be greater than 0/i)).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test('calls onSubmit with the trimmed name and a numeric threshold when valid', async () => {
  const { onSubmit, user } = setup();
  await user.type(screen.getByLabelText(/name/i), '  Site A ');
  await user.type(screen.getByLabelText(/threshold/i), '12.5');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(onSubmit).toHaveBeenCalledWith({ name: 'Site A', threshold: 12.5 });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('is prefilled with the initial values', () => {
  setup(undefined, { name: 'Old', threshold: 30 });
  expect(screen.getByLabelText(/name/i)).toHaveValue('Old');
  expect(screen.getByLabelText(/threshold/i)).toHaveValue(30);
});

test('shows an alert when onSubmit rejects', async () => {
  const { user } = setup(jest.fn().mockRejectedValue(new Error('boom')));
  await user.type(screen.getByLabelText(/name/i), 'Site A');
  await user.type(screen.getByLabelText(/threshold/i), '10');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/could not save/i);
});
