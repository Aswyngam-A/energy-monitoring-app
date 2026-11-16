import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listAlerts, updateAlertStatus, type Alert, type AlertStatus } from '../api/alerts';
import type { Page } from '../api/page';
import Pagination from '../components/Pagination';
import { useAlerts } from '../context/AlertsContext';
import { formatTimestamp } from '../utils/dates';

// '' = "All". Labels are what the user reads; values are what the API calls the statuses.
type StatusFilter = AlertStatus | '';
const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'RESOLVED', label: 'Resolved' },
];

/**
 * Page at /alerts: alerts newest first, one page at a time, with the time in UTC, a link to the
 * site, the sensor, the value that exceeded the threshold, and the status. The status filter and
 * the page number are sent to the server (the list is paginated, so filtering the loaded page in
 * the browser would give wrong results), and each alert offers the actions its status allows.
 */
export default function AlertsPage() {
  // Shared with the nav badge: after a status change the badge count must be asked again.
  const { refresh: refreshOpenCount } = useAlerts();

  const [filter, setFilter] = useState<StatusFilter>('');
  const [page, setPage] = useState(0);
  // Bumped after a status change to make the effect below load the current page again.
  const [reloads, setReloads] = useState(0);

  const [result, setResult] = useState<Page<Alert> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  // Load whenever the filter, the page or the reload counter changes.
  useEffect(() => {
    // An answer that arrives after the user already asked for something else must be ignored.
    let cancelled = false;
    listAlerts({ status: filter || undefined, page })
      .then((data) => { if (!cancelled) { setResult(data); setError(''); } })
      .catch(() => { if (!cancelled) setError('Could not load alerts'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filter, page, reloads]);

  function handleFilterChange(next: StatusFilter) {
    setFilter(next);
    // A page number from the old result set makes no sense for the new one.
    setPage(0);
  }

  async function handleChange(id: number, status: AlertStatus) {
    setActionError('');
    try {
      await updateAlertStatus(id, status);
    } catch {
      // The table stays as it was; only a message is added.
      setActionError('Could not update alert');
      return;
    }
    // Reload this page (the alert may now belong to another status) and the nav badge count.
    setReloads((n) => n + 1);
    await refreshOpenCount();
  }

  const alerts = result?.items ?? [];

  return (
    <section>
      <h2>Alerts</h2>
      {/* The filter stays visible in every state, so a failed load can be retried by changing it. */}
      <label>
        Status{' '}
        <select value={filter} onChange={(e) => { handleFilterChange(e.target.value as StatusFilter); }}>
          {FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      {actionError && <p role="alert">{actionError}</p>}
      {loading && <p>Loading alerts...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && alerts.length === 0 && <p>No alerts</p>}
      {!loading && !error && alerts.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Time (UTC)</th>
              <th>Site</th>
              <th>Sensor</th>
              <th>Value (kW)</th>
              <th>Threshold (kW)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id}>
                <td>{formatTimestamp(alert.createdAt)}</td>
                {/* The alert only carries the site's id, so the link text is "Site <id>". */}
                <td><Link to={`/sites/${alert.siteId}`}>Site {alert.siteId}</Link></td>
                <td>{alert.sensorId}</td>
                <td>{alert.value}</td>
                <td>{alert.threshold}</td>
                <td>{alert.status}</td>
                <td>
                  {/* Only the moves the backend allows are offered; RESOLVED is final, so no buttons. */}
                  {alert.status === 'OPEN' && (
                    <button onClick={() => { void handleChange(alert.id, 'ACKNOWLEDGED'); }}
                            aria-label={`Acknowledge alert ${alert.id}`}>Acknowledge</button>
                  )}
                  {alert.status !== 'RESOLVED' && (
                    <button onClick={() => { void handleChange(alert.id, 'RESOLVED'); }}
                            aria-label={`Resolve alert ${alert.id}`}>Resolve</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {result && !error && (
        <Pagination page={page} size={result.size} total={result.total} onPageChange={setPage} />
      )}
    </section>
  );
}
