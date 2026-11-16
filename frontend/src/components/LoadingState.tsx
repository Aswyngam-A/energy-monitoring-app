/**
 * The one "something is loading" message every page and section uses, so loading looks and sounds
 * the same everywhere. `label` says what is loading: <LoadingState label="alerts" /> reads
 * "Loading alerts..."; without it, "Loading...".
 *
 * role="status" makes it a polite live region: screen readers announce it without interrupting.
 */
export default function LoadingState({ label }: { label?: string }) {
  return <p role="status">{label ? `Loading ${label}...` : 'Loading...'}</p>;
}
