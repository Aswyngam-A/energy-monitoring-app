import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { getSite, type Site } from '../api/sites';

/** Page at /sites/:id: shows one site's name and threshold, with links to edit it or go back. */
export default function SiteDetailPage() {
  const { id } = useParams(); // route parameters are always strings
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<Site | null>(null);
  const [error, setError] = useState('');

  // Load the site on mount, and again if the id in the URL changes
  // (e.g. navigating from one site to another).
  useEffect(() => {
    getSite(Number(id))
      .then((data) => { setSite(data); })
      // Any failure shows the same message; a 404 is the typical case.
      .catch(() => { setError('Site not found'); })
      .finally(() => { setLoading(false); });
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <section>
      <h2>{site?.name}</h2>
      <p>Threshold: {site?.threshold}</p>
      <Link to={`/sites/${id}/edit`}>Edit</Link>{' '}
      <Link to="/sites">Back to sites</Link>
    </section>
  );
}
