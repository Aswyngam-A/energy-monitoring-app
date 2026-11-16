import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listAlerts, updateAlertStatus, type Alert, type AlertStatus } from '../api/alerts';
import type { Page } from '../api/page';
import Pagination from '../components/Pagination';
import StatusChip from '../components/StatusChip';
import { useAlerts } from '../context/AlertsContext';
import { usePolling } from '../hooks/usePolling';
import { formatTimestamp } from '../utils/dates';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

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
 * site (labelled with its name), the sensor name, the value that exceeded the threshold, and the
 * status. The status filter and
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

  // Live refresh: every 30 seconds the current page and filter are loaded again. `loading` is not
  // set again, so the table stays on screen and only its content changes.
  usePolling(() => { setReloads((n) => n + 1); });

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
    <section className="page">
      <h2>Alerts</h2>
      {/* The filter stays visible in every state, so a failed load can be retried by changing it. */}
      <label className="field-inline">
        Status{' '}
        <select value={filter} onChange={(e) => { handleFilterChange(e.target.value as StatusFilter); }}>
          {FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <ErrorMessage message={actionError} />
      {loading && <LoadingState label="alerts" />}
      <ErrorMessage message={error} />
      {!loading && !error && alerts.length === 0 && <p className="empty">All quiet. No alerts here.</p>}
      {!loading && !error && alerts.length > 0 && (
        <div className="table-wrap"><table className="ledger">
          <thead>
            <tr>
              <th>Time (UTC)</th>
              <th>Site</th>
              <th>Sensor</th>
              <th className="num">Value (kW)</th>
              <th className="num">Threshold (kW)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id}>
                <td className="mono">{formatTimestamp(alert.createdAt)}</td>
                {/* The alert carries the names, so they are shown; the id is only used for the link. */}
                <td><Link to={`/sites/${alert.siteId}`}>{alert.siteName}</Link></td>
                <td>{alert.sensorName}</td>
                <td className="num mono over">{alert.value}</td>
                <td className="num mono">{alert.threshold}</td>
                <td><StatusChip status={alert.status} /></td>
                <td className="actions">
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
        </table></div>
      )}
      {result && !error && (
        <Pagination page={page} size={result.size} total={result.total} onPageChange={setPage} />
      )}
    </section>
  );
}
