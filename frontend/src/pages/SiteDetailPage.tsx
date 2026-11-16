import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { getSite, type Site } from '../api/sites';
import ReadingsSection from '../components/ReadingsSection';
import SensorsSection from '../components/SensorsSection';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

/**
 * Page at /sites/:id: shows one site's name and threshold, with links to edit it or go back,
 * the site's sensors (listed and added by SensorsSection) and its readings (ReadingsSection).
 */
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

  if (loading) return <LoadingState />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <section className="page">
      <h2>{site?.name}</h2>
      <p className="meta mono">Threshold: {site?.threshold}</p>
      <div className="link-row">
        <Link to={`/sites/${id}/edit`} className="button-link">Edit</Link>
        <Link to="/sites">Back to sites</Link>
      </div>
      {/* The site loaded successfully here, so its id is safe to use for the sensors. */}
      {site && <SensorsSection siteId={site.id} />}
      {site && <ReadingsSection siteId={site.id} />}
    </section>
  );
}
