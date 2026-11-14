import { useEffect, useState } from 'react';
import { getHealth, type HealthResponse } from '../api/health';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getHealth()
      .then((data) => { setHealth(data); })
      .catch(() => { setError('Error: could not reach the API'); })
      .finally(() => { setLoading(false); });
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p role="alert">{error}</p>;
  return <p>API status: <strong>{health?.status}</strong></p>;
}
