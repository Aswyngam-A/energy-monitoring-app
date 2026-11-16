/**
 * The one "something is loading" message every page and section uses, so loading looks and sounds
 * the same everywhere. `label` says what is loading: <LoadingState label="alerts" /> reads
 * "Loading alerts..."; without it, "Loading...".
 *
 * role="status" makes it a polite live region: screen readers announce it without interrupting.
 * The grey bars are decorative placeholders (skeleton rows) that hint at the shape of what is
 * coming instead of a bare line of text; they carry no text, so the announced message is unchanged.
 */
export default function LoadingState({ label }: { label?: string }) {
  return (
    <div role="status" className="loading">
      <p className="loading-text">{label ? `Loading ${label}...` : 'Loading...'}</p>
      <span className="skeleton" aria-hidden="true" />
      <span className="skeleton" aria-hidden="true" />
      <span className="skeleton short" aria-hidden="true" />
    </div>
  );
}
