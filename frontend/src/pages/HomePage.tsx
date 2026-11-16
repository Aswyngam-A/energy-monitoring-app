import { useEffect, useState } from 'react';
import { getHealth, type HealthResponse } from '../api/health';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

/** Page at /: shows whether the backend answers (its /health status). */
export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState('');

  // Ask the API once, when the page first appears.
  useEffect(() => {
    getHealth()
      .then((data) => { setHealth(data); })
      .catch(() => { setError('Error: could not reach the API'); })
      .finally(() => { setLoading(false); });
  }, []);

  // The page heading stays in every state, so the screen never looks empty.
  return (
    <section className="page">
      <h2>System status</h2>
      {loading && <LoadingState />}
      <ErrorMessage message={error} />
      {!loading && !error && (
        <p className="status-line"><span className="status-dot" aria-hidden="true" />API status: <strong>{health?.status}</strong></p>
      )}
      <p className="muted lead">
        Sensors report readings for each site. EnergyWatch raises an alert when a reading passes the
        site&apos;s threshold, and keeps it open until someone acknowledges and resolves it.
      </p>
    </section>
  );
}
