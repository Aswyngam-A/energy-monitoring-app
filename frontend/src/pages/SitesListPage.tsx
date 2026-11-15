import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listSites, type Site } from '../api/sites';

export default function SitesListPage() {
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    listSites()
      .then((data) => { setSites(data); })
      .catch(() => { setError('Error: could not load sites'); })
      .finally(() => { setLoading(false); });
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p role="alert">{error}</p>;
  if (sites.length === 0) return <p>No sites yet</p>;

  return (
    <section>
      <h2>Sites</h2>
        <ul>
          {sites.map((site) => (
          <li key={site.id}>
          <Link to={`/sites/${site.id}`}>{site.name}</Link>
          {' — '}{site.threshold}
          </li>
        ))}
        </ul>
    </section>
  );
}
