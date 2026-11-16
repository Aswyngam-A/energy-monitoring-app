import { useEffect, useState, type FormEvent } from 'react';
import { listSiteReadings, type Reading, type ReadingRange } from '../api/readings';
import type { Page } from '../api/page';
import Pagination from './Pagination';
import { formatTimestamp, utcInputToIso } from '../utils/dates';
import LoadingState from './LoadingState';
import ErrorMessage from './ErrorMessage';

/**
 * The "Readings" part of the site detail page: a table of the readings of all the site's sensors
 * (newest first, as the API returns them), one page at a time, with an optional from/to filter.
 * All times are UTC: both what is shown and what is typed in the filter.
 */
export default function ReadingsSection({ siteId }: { siteId: number }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Page<Reading> | null>(null);
  const [page, setPage] = useState(0); // 0-based, as in the API
  const [error, setError] = useState('');

  // What the user has typed in the two inputs (datetime-local strings, "" = empty).
  // These change on every keystroke but do not reload anything by themselves.
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [filterError, setFilterError] = useState('');

  // The filter that was actually applied. Changing it (a new object) re-runs the load effect.
  const [range, setRange] = useState<ReadingRange>({});

  // Load on mount, and again whenever the site, the applied range or the page changes.
  useEffect(() => {
    // If the site or range changes (or the component unmounts) before a request answers, the old
    // answer must not overwrite the newer one: the cleanup below flips this flag.
    let cancelled = false;
    listSiteReadings(siteId, range, page)
      .then((data) => { if (!cancelled) setResult(data); })
      .catch(() => { if (!cancelled) setError('Could not load readings'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [siteId, range, page]);

  const readings = result?.items ?? [];

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
    // A page number from the old result set makes no sense for the new one.
    setPage(0);
    // Only include the bounds that have a value.
    setRange({ ...(from ? { from } : {}), ...(to ? { to } : {}) });
  }

  /** Empties the filter and reloads everything. */
  function handleClear() {
    setFromInput('');
    setToInput('');
    setFilterError('');
    startLoading();
    setPage(0);
    setRange({});
  }

  /** Moves to another page of the same result set. */
  function handlePageChange(next: number) {
    startLoading();
    setPage(next);
  }

  /** Shows the loading text again while a new filter loads, and drops the previous error. */
  function startLoading() {
    setError('');
    setLoading(true);
  }

  return (
    <section className="block">
      <h3>Readings</h3>
      {/* noValidate: our own messages are the only ones shown. */}
      <form onSubmit={handleApply} noValidate className="filter-form">
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
        {filterError && <p className="field-error">{filterError}</p>}
      </form>

      {loading && <LoadingState label="readings" />}
      <ErrorMessage message={error} />
      {!loading && !error && readings.length === 0 && <p className="empty">No readings found</p>}
      {!loading && readings.length > 0 && (
        <div className="table-wrap"><table className="ledger">
          <thead>
            <tr>
              <th>Time (UTC)</th>
              <th>Sensor</th>
              <th className="num">Value (kW)</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((reading) => (
              <tr key={reading.id}>
                <td className="mono">{formatTimestamp(reading.timestamp)}</td>
                <td>{reading.sensorName}</td>
                <td className="num mono">{reading.value}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      {!loading && !error && result && (
        <Pagination page={page} size={result.size} total={result.total} onPageChange={handlePageChange} />
      )}
    </section>
  );
}
