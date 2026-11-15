import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listSites, type Site } from '../api/sites';

/** Page at /sites: lists every site (name and threshold) with a link to each one and to the create form. */
export default function SitesListPage() {
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);
  const [error, setError] = useState('');

  // Load the list once, when the page first appears.
  useEffect(() => {
    listSites()
      .then((data) => { setSites(data); })
      .catch(() => { setError('Error: could not load sites'); })
      .finally(() => { setLoading(false); });
  }, []);

  // Early returns: one page state at a time (loading, error, or the real content below).
  if (loading) return <p>Loading...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <section>
      <h2>Sites</h2>
      {/* Shown in every state with data, including when the list is empty. */}
      <Link to="/sites/new">New site</Link>
      {sites.length === 0 ? (
        <p>No sites yet</p>
      ) : (
        <ul>
          {sites.map((site) => (
            <li key={site.id}>
              <Link to={`/sites/${site.id}`}>{site.name}</Link>
              {' — '}{site.threshold}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
