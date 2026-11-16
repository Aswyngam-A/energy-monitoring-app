import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listSites, type Site } from '../api/sites';
import type { Page } from '../api/page';
import Pagination from '../components/Pagination';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

/**
 * Page at /sites: one page of sites (name and threshold, newest first) with a link to each one and
 * to the create form, and Previous / Next controls when there is more than one page.
 */
export default function SitesListPage() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Page<Site> | null>(null);
  const [page, setPage] = useState(0); // 0-based, as in the API
  const [error, setError] = useState('');

  // Load on mount, and again whenever the user moves to another page.
  useEffect(() => {
    // Ignore an answer that arrives after the user already moved on (or left the page).
    let cancelled = false;
    listSites(page)
      .then((data) => { if (!cancelled) setResult(data); })
      .catch(() => { if (!cancelled) setError('Error: could not load sites'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  // Early returns: one page state at a time (loading, error, or the real content below).
  if (loading) return <LoadingState />;
  if (error) return <ErrorMessage message={error} />;

  const sites = result?.items ?? [];

  return (
    <section className="page">
      <div className="section-head">
        <h2>Sites</h2>
        {/* Shown in every state with data, including when the list is empty. */}
        <Link to="/sites/new" className="button-link primary">New site</Link>
      </div>
      {sites.length === 0 ? (
        <p className="empty">No sites yet</p>
      ) : (
        <ul className="rows">
          {sites.map((site) => (
            <li key={site.id}>
              <Link to={`/sites/${site.id}`}>{site.name}</Link>
              <span className="row-meta"><small>Threshold</small> <span className="mono">{site.threshold}</span></span>
            </li>
          ))}
        </ul>
      )}
      {result && <Pagination page={page} size={result.size} total={result.total} onPageChange={setPage} />}
    </section>
  );
}
