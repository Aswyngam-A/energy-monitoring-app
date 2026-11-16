/**
 * The one way to show an error, used by every page, section and form. role="alert" makes screen
 * readers announce the message as soon as it appears. An empty message renders nothing, so callers
 * can pass their error state directly instead of writing `{error && ...}` each time.
 */
export default function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return <p role="alert" className="error-message">{message}</p>;
}
