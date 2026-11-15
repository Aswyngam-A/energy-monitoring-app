// Tests for SensorForm: validation, the exact input passed to onSubmit, failure alert, reset after success.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SensorForm from './SensorForm';

test('shows an error and does not submit when the name is empty', async () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  render(<SensorForm onSubmit={onSubmit} />);

  await userEvent.click(screen.getByRole('button', { name: /add sensor/i }));

  expect(screen.getByText('Name is required')).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test('submits the trimmed name and the type', async () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  render(<SensorForm onSubmit={onSubmit} />);

  await userEvent.type(screen.getByLabelText(/name/i), '  Main meter ');
  await userEvent.type(screen.getByLabelText(/type/i), 'power');
  await userEvent.click(screen.getByRole('button', { name: /add sensor/i }));

  expect(onSubmit).toHaveBeenCalledWith({ name: 'Main meter', type: 'power' });
});

test('leaves the type out when it is blank', async () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  render(<SensorForm onSubmit={onSubmit} />);

  await userEvent.type(screen.getByLabelText(/name/i), 'Untyped');
  await userEvent.click(screen.getByRole('button', { name: /add sensor/i }));

  // toHaveBeenCalledWith({ name }) would also pass for { name, type: undefined } only if
  // equality ignores undefined; check the exact keys instead.
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(Object.keys(onSubmit.mock.calls[0][0] as object)).toEqual(['name']);
});

test('shows an alert when onSubmit rejects, and keeps what was typed', async () => {
  const onSubmit = jest.fn().mockRejectedValue(new Error('500'));
  render(<SensorForm onSubmit={onSubmit} />);

  await userEvent.type(screen.getByLabelText(/name/i), 'Main meter');
  await userEvent.click(screen.getByRole('button', { name: /add sensor/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/could not add the sensor/i);
  expect(screen.getByLabelText(/name/i)).toHaveValue('Main meter');
});

test('clears the fields after a successful submit so another sensor can be added', async () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  render(<SensorForm onSubmit={onSubmit} />);

  await userEvent.type(screen.getByLabelText(/name/i), 'Main meter');
  await userEvent.type(screen.getByLabelText(/type/i), 'power');
  await userEvent.click(screen.getByRole('button', { name: /add sensor/i }));

  expect(screen.getByLabelText(/name/i)).toHaveValue('');
  expect(screen.getByLabelText(/type/i)).toHaveValue('');
});
