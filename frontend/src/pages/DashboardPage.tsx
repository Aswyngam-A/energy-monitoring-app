import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { getDashboardSummary, type SiteSummary } from '../api/dashboard';
import type { Page } from '../api/page';
import { listSiteReadings, type Reading } from '../api/readings';
import ErrorMessage from '../components/ErrorMessage';
import LoadingState from '../components/LoadingState';
import Pagination from '../components/Pagination';
import ReadingsChart from '../components/ReadingsChart';
import { usePolling } from '../hooks/usePolling';
import { formatTimestamp } from '../utils/dates';

// The readings loaded for the chart, tagged with the site they belong to (see `chartState` below).
interface ChartResult {
  siteId: number;
  readings: Reading[] | null; // null = the request failed
}

/**
 * Page at /dashboard: one card per site (latest reading and number of open alerts), one page of
 * sites at a time, and a chart of the latest readings of one site, chosen with a select. The
 * select lists the sites of the page shown (the first one at first); when the user moves to a
 * page that does not contain the picked site, the chart goes back to that page's first site.
 */
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  // The page of sites asked for (0-based) and the last page received (null until the first load).
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<Page<SiteSummary> | null>(null);
  const [error, setError] = useState('');
  const summary = result?.items ?? [];

  // The site the user picked for the chart; null = "none picked yet", which means the first site.
  const [pickedSiteId, setPickedSiteId] = useState<number | null>(null);
  const [chartResult, setChartResult] = useState<ChartResult | null>(null);

  // Bumped every 30 seconds (live refresh): both effects below depend on it, so they load again.
  const [reloads, setReloads] = useState(0);
  usePolling(() => { setReloads((n) => n + 1); });

  // True once the summary has been loaded successfully at least once.
  const hasSummary = useRef(false);

  // The summary is loaded when the page first appears, when the user changes page, and again on
  // every refresh tick (always the page the user is on).
  useEffect(() => {
    // An answer for a page the user has already left must be ignored.
    let cancelled = false;
    getDashboardSummary(page)
      .then((data) => { if (!cancelled) { hasSummary.current = true; setResult(data); setError(''); } })
      // A failed refresh keeps the data already on screen; only a failed FIRST load is an error.
      .catch(() => { if (!cancelled && !hasSummary.current) setError('Could not load the dashboard'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, reloads]);

  // Derived, not stored: which site the chart shows right now. The picked site only counts while
  // it is on the page shown; otherwise the page's first site is used.
  const pickedIsShown = summary.some((site) => site.siteId === pickedSiteId);
  const chartSiteId = pickedIsShown ? pickedSiteId! : summary[0]?.siteId;

  // Load the chart's readings whenever the chart's site changes or a refresh tick happens
  // (page 0 = the newest readings).
  useEffect(() => {
    if (chartSiteId === undefined) return;
    // An answer for a site the user has already switched away from must be ignored.
    let cancelled = false;
    listSiteReadings(chartSiteId, {}, 0)
      .then((page) => { if (!cancelled) setChartResult({ siteId: chartSiteId, readings: page.items }); })
      .catch(() => {
        if (cancelled) return;
        // A failed refresh keeps the chart already shown for this site; otherwise show the error.
        setChartResult((prev) =>
          prev?.siteId === chartSiteId && prev.readings ? prev : { siteId: chartSiteId, readings: null });
      });
    return () => { cancelled = true; };
  }, [chartSiteId, reloads]);

  if (loading) return <LoadingState label="dashboard" />;
  if (error) return <ErrorMessage message={error} />;

  // The stored result only counts if it is for the site shown now; otherwise it is still loading.
  const current = chartResult?.siteId === chartSiteId ? chartResult : null;

  return (
    <section>
      <h2>Dashboard</h2>
      {summary.length === 0 ? (
        <p>No sites yet</p>
      ) : (
        <>
          {summary.map((site) => (
            <article key={site.siteId}>
              <h3><Link to={`/sites/${site.siteId}`}>{site.siteName}</Link></h3>
              {site.latestReading ? (
                <p>
                  <strong>{site.latestReading.value} kW</strong>{' '}
                  <small>{formatTimestamp(site.latestReading.timestamp)} UTC</small>
                </p>
              ) : (
                <p>No readings yet</p>
              )}
              <p>{site.openAlerts} open {site.openAlerts === 1 ? 'alert' : 'alerts'}</p>
            </article>
          ))}

          <Pagination page={page} size={result?.size ?? 1} total={result?.total ?? 0} onPageChange={setPage} />

          <h3>Latest readings</h3>
          <label>
            Chart site{' '}
            <select
              value={chartSiteId}
              onChange={(e) => { setPickedSiteId(Number(e.target.value)); }}
            >
              {summary.map((site) => (
                <option key={site.siteId} value={site.siteId}>{site.siteName}</option>
              ))}
            </select>
          </label>
          {current === null && <LoadingState label="readings" />}
          {current?.readings === null && <ErrorMessage message="Could not load readings" />}
          {current?.readings && <ReadingsChart readings={current.readings} />}
        </>
      )}
    </section>
  );
}
