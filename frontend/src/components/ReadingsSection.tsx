import { useEffect, useState, type FormEvent } from 'react';
import { listSiteReadings, type Reading, type ReadingRange } from '../api/readings';
import { formatTimestamp, utcInputToIso } from '../utils/dates';

/**
 * The "Readings" part of the site detail page: a table of the readings of all the site's sensors
 * (newest first, as the API returns them) with an optional from/to filter.
 * All times are UTC: both what is shown and what is typed in the filter.
 */
export default function ReadingsSection({ siteId }: { siteId: number }) {
  const [loading, setLoading] = useState(true);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [error, setError] = useState('');

  // What the user has typed in the two inputs (datetime-local strings, "" = empty).
  // These change on every keystroke but do not reload anything by themselves.
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [filterError, setFilterError] = useState('');

  // The filter that was actually applied. Changing it (a new object) re-runs the load effect.
  const [range, setRange] = useState<ReadingRange>({});

  // Load on mount, and again whenever the site or the applied range changes.
  useEffect(() => {
    // If the site or range changes (or the component unmounts) before a request answers, the old
    // answer must not overwrite the newer one: the cleanup below flips this flag.
    let cancelled = false;
    listSiteReadings(siteId, range)
      .then((data) => { if (!cancelled) setReadings(data); })
      .catch(() => { if (!cancelled) setError('Could not load readings'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [siteId, range]);

  /** Applies the typed range after checking it, then lets the effect reload. */
  function handleApply(event: FormEvent<HTMLFormElement>) {
    // Stop the browser from reloading the page, which is what a plain form submit does.
    event.preventDefault();
    setFilterError('');

    const from = utcInputToIso(fromInput);
    const to = utcInputToIso(toInput);
    if (from === null || to === null) {
      setFilterError('Enter valid dates');
      return;
    }
    if (from !== '' && to !== '' && from > to) {
      // ISO strings of the same format sort like the instants they stand for, so a plain
      // string comparison is enough here. The backend checks this too (400).
      setFilterError('From must not be after To');
      return;
    }

    startLoading();
    // Only include the bounds that have a value.
    setRange({ ...(from ? { from } : {}), ...(to ? { to } : {}) });
  }

  /** Empties the filter and reloads everything. */
  function handleClear() {
    setFromInput('');
    setToInput('');
    setFilterError('');
    startLoading();
    setRange({});
  }

  /** Shows the loading text again while a new filter loads, and drops the previous error. */
  function startLoading() {
    setError('');
    setLoading(true);
  }

  return (
    <section>
      <h3>Readings</h3>
      {/* noValidate: our own messages are the only ones shown. */}
      <form onSubmit={handleApply} noValidate>
        <label htmlFor="readings-from">From (UTC)</label>
        <input
          id="readings-from"
          type="datetime-local"
          value={fromInput}
          onChange={(e) => { setFromInput(e.target.value); }}
        />
        <label htmlFor="readings-to">To (UTC)</label>
        <input
          id="readings-to"
          type="datetime-local"
          value={toInput}
          onChange={(e) => { setToInput(e.target.value); }}
        />
        <button type="submit">Apply filter</button>
        <button type="button" onClick={handleClear}>Clear</button>
        {filterError && <p>{filterError}</p>}
      </form>

      {loading && <p>Loading readings...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && readings.length === 0 && <p>No readings found</p>}
      {!loading && readings.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Time (UTC)</th>
              <th>Sensor</th>
              <th>Value (kW)</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((reading) => (
              <tr key={reading.id}>
                <td>{formatTimestamp(reading.timestamp)}</td>
                <td>{reading.sensorName}</td>
                <td>{reading.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
