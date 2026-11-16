import type { AlertStatus } from '../api/alerts';

/**
 * The status of an alert as a small square chip: a coloured dot plus the status in words. The
 * words matter: colour alone is not readable for everyone, so the dot only reinforces the text.
 * The colours come from data-status in App.css (open = amber, acknowledged = blue, resolved = green).
 */
export default function StatusChip({ status }: { status: AlertStatus }) {
  return (
    <span className="chip" data-status={status}>
      <span className="chip-dot" aria-hidden="true" />
      {status}
    </span>
  );
}
