import { useEffect, useState } from 'react';
import { getHealth, type HealthResponse } from '../api/health';

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

  // Early returns: one page state at a time (loading, error, or the status below).
  if (loading) return <p>Loading...</p>;
  if (error) return <p role="alert">{error}</p>;
  return <p>API status: <strong>{health?.status}</strong></p>;
}
