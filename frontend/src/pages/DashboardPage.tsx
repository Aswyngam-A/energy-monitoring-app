import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getDashboardSummary, type SiteSummary } from '../api/dashboard';
import { listSiteReadings, type Reading } from '../api/readings';
import ErrorMessage from '../components/ErrorMessage';
import LoadingState from '../components/LoadingState';
import ReadingsChart from '../components/ReadingsChart';
import { formatTimestamp } from '../utils/dates';

// The readings loaded for the chart, tagged with the site they belong to (see `chartState` below).
interface ChartResult {
  siteId: number;
  readings: Reading[] | null; // null = the request failed
}

/**
 * Page at /dashboard: one card per site (latest reading and number of open alerts) and a chart of
 * the latest readings of one site, chosen with a select (the first site at first).
 */
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SiteSummary[]>([]);
  const [error, setError] = useState('');

  // The site the user picked for the chart; null = "none picked yet", which means the first site.
  const [pickedSiteId, setPickedSiteId] = useState<number | null>(null);
  const [chartResult, setChartResult] = useState<ChartResult | null>(null);

  // The summary is loaded once, when the page first appears.
  useEffect(() => {
    getDashboardSummary()
      .then((data) => { setSummary(data); })
      .catch(() => { setError('Could not load the dashboard'); })
      .finally(() => { setLoading(false); });
  }, []);

  // Derived, not stored: which site the chart shows right now.
  const chartSiteId = pickedSiteId ?? summary[0]?.siteId;

  // Load the chart's readings whenever the chart's site changes (page 0 = the newest readings).
  useEffect(() => {
    if (chartSiteId === undefined) return;
    // An answer for a site the user has already switched away from must be ignored.
    let cancelled = false;
    listSiteReadings(chartSiteId, {}, 0)
      .then((page) => { if (!cancelled) setChartResult({ siteId: chartSiteId, readings: page.items }); })
      .catch(() => { if (!cancelled) setChartResult({ siteId: chartSiteId, readings: null }); });
    return () => { cancelled = true; };
  }, [chartSiteId]);

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
