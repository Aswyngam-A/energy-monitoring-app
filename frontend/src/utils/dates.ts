// Date helpers for the readings UI.
//
// Decision: every time shown or typed in the UI is UTC, and the screen says so ("(UTC)").
// The API stores and returns UTC instants, so there is no hidden timezone conversion that could
// shift a reading by hours, and the results do not depend on the timezone of the machine (which
// also keeps the tests deterministic). Showing the viewer's local time would be a later, optional
// improvement.

/**
 * Turns an ISO-8601 instant from the API ("2024-05-01T10:15:30Z") into "2024-05-01 10:15:30" (UTC).
 * Returns the original text unchanged if it is not a valid date, so a bad value is visible
 * instead of crashing the page.
 */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  // toISOString() is always UTC: "2024-05-01T10:15:30.000Z" -> swap the "T", drop ".000Z".
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Converts the value of an <input type="datetime-local"> ("2024-05-01T10:00", no timezone)
 * into an ISO instant, reading it as UTC. Returns '' for an empty input (meaning "no bound")
 * and null when the value is not a real date.
 */
export function utcInputToIso(value: string): string | null {
  if (value === '') return '';
  // Appending "Z" tells the parser the text is UTC. Without it, JavaScript would read it as
  // local time, and the result would change with the machine's timezone.
  const date = new Date(`${value}Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
