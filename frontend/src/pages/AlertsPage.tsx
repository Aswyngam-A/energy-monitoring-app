import { useState } from 'react';
import { Link } from 'react-router';
import { type AlertStatus } from '../api/alerts';
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
 * Page at /alerts: every alert, newest first (the order the API returns), with the time in UTC,
 * a link to the site, the sensor, the value that exceeded the threshold, and the status.
 * A status filter narrows the list, and each alert offers the actions its status allows.
 */
export default function AlertsPage() {
  // The list comes from the shared provider (the nav badge uses the same data).
  const { alerts, loading, error, changeStatus } = useAlerts();
  const [filter, setFilter] = useState<StatusFilter>('');
  const [actionError, setActionError] = useState('');

  // Early returns: one page state at a time (loading, error, or the real content below).
  if (loading) return <p>Loading alerts...</p>;
  if (error) return <p role="alert">{error}</p>;

  // Filtering happens here on the data already loaded: no extra request.
  const shown = filter === '' ? alerts : alerts.filter((alert) => alert.status === filter);

  async function handleChange(id: number, status: AlertStatus) {
    setActionError('');
    try {
      await changeStatus(id, status);
    } catch {
      // The table stays as it was; only a message is added.
      setActionError('Could not update alert');
    }
  }

  return (
    <section>
      <h2>Alerts</h2>
      <label>
        Status{' '}
        <select value={filter} onChange={(e) => { setFilter(e.target.value as StatusFilter); }}>
          {FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      {actionError && <p role="alert">{actionError}</p>}
      {shown.length === 0 ? (
        <p>No alerts</p>
      ) : (
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
            {shown.map((alert) => (
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
    </section>
  );
}
