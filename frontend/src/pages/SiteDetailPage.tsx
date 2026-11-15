import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { getSite, type Site } from '../api/sites';

export default function SiteDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<Site | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getSite(Number(id))
      .then((data) => { setSite(data); })
      .catch(() => { setError('Site not found'); })
      .finally(() => { setLoading(false); });
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <section>
      <h2>{site?.name}</h2>
      <p>Threshold: {site?.threshold}</p>
      <Link to="/sites">Back to sites</Link>
    </section>
  );
}
