import { useState, type FormEvent } from 'react';
import type { SensorInput } from '../api/sensors';
import ErrorMessage from './ErrorMessage';

interface SensorFormProps {
  /**
   * Called with the validated input. The form does not know which site the sensor belongs to:
   * the parent decides. If the returned promise rejects, the form shows an alert.
   */
  onSubmit: (input: SensorInput) => Promise<void>;
}

/**
 * Small form to add a sensor: a required name and an optional type.
 * Validates the name on the client (same rule as the backend: not blank); the backend validates again.
 * After a successful submit the fields are cleared so several sensors can be added in a row.
 */
export default function SensorForm({ onSubmit }: SensorFormProps) {
  // Input values are plain strings while the user types.
  const [name, setName] = useState('');
  const [type, setType] = useState('');

  // An empty string means "no error".
  const [nameError, setNameError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // True while the request is in flight; used to disable the button (no double submit).
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Stop the browser from reloading the page, which is what a plain form submit does.
    event.preventDefault();
    setSubmitError('');

    const trimmedName = name.trim();
    const trimmedType = type.trim();
    const nameMessage = trimmedName === '' ? 'Name is required' : '';
    setNameError(nameMessage);
    if (nameMessage) return; // invalid: show the error, do not call the API

    setSubmitting(true);
    try {
      // A blank type is left out of the body entirely (the backend treats it as "no type").
      await onSubmit(trimmedType === '' ? { name: trimmedName } : { name: trimmedName, type: trimmedType });
      // Only reached on success: a failed submit keeps what the user typed.
      setName('');
      setType('');
    } catch {
      // Any failure (network, 400, 404, 500...) gets one generic message for now.
      setSubmitError('Could not add the sensor');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // noValidate turns off the browser's own validation bubbles, so our messages are the only ones.
    <form onSubmit={handleSubmit} noValidate className="form">
      <div className="field">
        {/* htmlFor/id link each label to its input (accessibility, and getByLabelText in tests). */}
        <label htmlFor="sensor-name">Name</label>
        <input
          id="sensor-name"
          value={name}
          onChange={(e) => { setName(e.target.value); }}
          aria-invalid={nameError !== ''}
        />
        {nameError && <p className="field-error">{nameError}</p>}
      </div>
      <div className="field">
        <label htmlFor="sensor-type">Type (optional)</label>
        <input
          id="sensor-type"
          value={type}
          onChange={(e) => { setType(e.target.value); }}
        />
      </div>
      {/* ErrorMessage renders nothing while submitError is empty. */}
      <ErrorMessage message={submitError} />
      <button type="submit" disabled={submitting}>Add sensor</button>
    </form>
  );
}
