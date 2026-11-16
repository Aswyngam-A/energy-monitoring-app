import { useState, type FormEvent } from 'react';
import type { SiteInput } from '../api/sites';
import ErrorMessage from './ErrorMessage';

interface SiteFormProps {
  /** Values to prefill the fields with (edit mode). Leave undefined for an empty form (create mode). */
  initialValues?: SiteInput;
  /** Text of the submit button, e.g. "Create site" or "Save changes". */
  submitLabel: string;
  /**
   * Called with the validated input. The form does not know whether it is creating or
   * updating: the parent page decides. If the returned promise rejects, the form shows an alert.
   */
  onSubmit: (input: SiteInput) => Promise<void>;
}

/**
 * Reusable form for creating and editing a site.
 * It validates on the client (same rules as the backend: name not blank, threshold > 0)
 * so the user gets instant feedback; the backend still validates again.
 */
export default function SiteForm({ initialValues, submitLabel, onSubmit }: SiteFormProps) {
  // Input values are kept as strings while the user types. The threshold is only
  // converted to a number when the form is submitted.
  const [name, setName] = useState(initialValues?.name ?? '');
  const [threshold, setThreshold] = useState(initialValues ? String(initialValues.threshold) : '');

  // One message per field, plus one for a failed request. An empty string means "no error".
  const [nameError, setNameError] = useState('');
  const [thresholdError, setThresholdError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // True while the request is in flight; used to disable the button (no double submit).
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Stop the browser from reloading the page, which is what a plain form submit does.
    event.preventDefault();
    setSubmitError('');

    // --- Client-side validation ---
    const trimmedName = name.trim();
    const thresholdValue = Number(threshold);
    const nameMessage = trimmedName === '' ? 'Name is required' : '';
    // Number('') is 0 and Number('abc') is NaN. Writing the check as !(x > 0) rejects
    // zero, negatives AND NaN, because every comparison with NaN is false.
    const thresholdMessage =
      threshold.trim() === '' || !(thresholdValue > 0) ? 'Threshold must be greater than 0' : '';
    setNameError(nameMessage);
    setThresholdError(thresholdMessage);
    if (nameMessage || thresholdMessage) return; // invalid: show errors, do not call the API

    // --- Submit ---
    setSubmitting(true);
    try {
      await onSubmit({ name: trimmedName, threshold: thresholdValue });
    } catch {
      // Any failure (network, 400, 500...) gets one generic message for now.
      setSubmitError('Could not save the site');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // noValidate turns off the browser's own validation bubbles, so our messages are the only ones.
    <form onSubmit={handleSubmit} noValidate>
      <div>
        {/* htmlFor/id link the label to the input: needed for accessibility and for tests (getByLabelText). */}
        <label htmlFor="site-name">Name</label>
        <input
          id="site-name"
          value={name}
          onChange={(e) => { setName(e.target.value); }}
          aria-invalid={nameError !== ''}
        />
        {nameError && <p>{nameError}</p>}
      </div>
      <div>
        <label htmlFor="site-threshold">Threshold</label>
        {/* step="any" allows decimals such as 12.5 */}
        <input
          id="site-threshold"
          type="number"
          step="any"
          value={threshold}
          onChange={(e) => { setThreshold(e.target.value); }}
          aria-invalid={thresholdError !== ''}
        />
        {thresholdError && <p>{thresholdError}</p>}
      </div>
      {/* ErrorMessage renders nothing while submitError is empty. */}
      <ErrorMessage message={submitError} />
      <button type="submit" disabled={submitting}>{submitLabel}</button>
    </form>
  );
}
