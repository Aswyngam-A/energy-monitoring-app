import { Link } from 'react-router';
import { useAlerts } from '../context/AlertsContext';
import { formatTimestamp } from '../utils/dates';

/**
 * Page at /alerts: every alert, newest first (the order the API returns), with the time in UTC,
 * a link to the site, the sensor, the value that exceeded the threshold, and the status.
 */
export default function AlertsPage() {
  // The list comes from the shared provider (the nav badge uses the same data).
  const { alerts, loading, error } = useAlerts();

  // Early returns: one page state at a time (loading, error, or the real content below).
  if (loading) return <p>Loading alerts...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <section>
      <h2>Alerts</h2>
      {alerts.length === 0 ? (
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
