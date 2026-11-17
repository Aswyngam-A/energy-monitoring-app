import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listAlerts, type Alert } from '../api/alerts';
import { getOverview, type Overview } from '../api/dashboard';
import { getHealth, type HealthResponse } from '../api/health';
import ErrorMessage from '../components/ErrorMessage';
import LoadingState from '../components/LoadingState';
import { usePolling } from '../hooks/usePolling';
import { CONTACT_URL, REPO_URL } from '../siteInfo';
import { formatTimestamp } from '../utils/dates';

/** One live number: the figure big, its label under it. */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat">
      <strong className="mono">{value}</strong>
      <span>{label}</span>
    </div>
  );
}

/**
 * Page at /: the front door of the app. Top half for someone who wants to know what it does (a
 * headline, live numbers from the real data, how it works, the newest open alert); bottom half for
 * someone who wants to know how it is built (stack, engineering practices, links). Nothing here is
 * invented: the numbers come from the API and refresh every 30 seconds like the other pages.
 */
export default function HomePage() {
  // API health: asked once, shown as a small status line at the end.
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState('');
  useEffect(() => {
    getHealth()
      .then((data) => { setHealth(data); })
      .catch(() => { setHealthError('Error: could not reach the API'); });
  }, []);

  // The live numbers and the newest open alert, reloaded on every refresh tick.
  const [overview, setOverview] = useState<Overview | null>(null);
  const [latestAlert, setLatestAlert] = useState<Alert | null>(null);
  const [numbersError, setNumbersError] = useState('');
  const [reloads, setReloads] = useState(0);
  usePolling(() => { setReloads((n) => n + 1); });

  useEffect(() => {
    let cancelled = false;
    // Both requests together; a failure of either counts as "could not load".
    Promise.all([getOverview(), listAlerts({ status: 'OPEN', size: 1 })])
      .then(([totals, openAlerts]) => {
        if (cancelled) return;
        setOverview(totals);
        setLatestAlert(openAlerts.items[0] ?? null);
        setNumbersError('');
      })
      // A failed refresh keeps the numbers already shown; only a failed first load is an error.
      .catch(() => { if (!cancelled) setNumbersError('Could not load the live numbers'); });
    return () => { cancelled = true; };
  }, [reloads]);

  return (
    <div className="page home">
      <section className="hero">
        <h2>Know which site is drawing too much power, before the bill tells you.</h2>
        <p className="lead">
          Sensors report how much electricity each site uses. EnergyWatch compares every reading with
          the site&apos;s limit, raises an alert the moment one goes over, and tracks it until someone
          has dealt with it.
        </p>
        <div className="link-row">
          <Link to="/dashboard" className="button-link primary">Open the live demo</Link>
          <Link to="/alerts" className="button-link">See the alerts</Link>
        </div>
      </section>

      <section aria-label="Live numbers" className="stats">
        {overview ? (
          <>
            <Stat value={String(overview.sites)} label="Sites monitored" />
            <Stat value={String(overview.openAlerts)} label="Open alerts" />
            <Stat value={`${overview.totalKw.toFixed(1)} kW`} label="Load right now" />
            <Stat value={overview.lastReadingAt ? `${formatTimestamp(overview.lastReadingAt)} UTC` : 'No readings yet'}
              label="Last reading" />
          </>
        ) : numbersError ? null : <LoadingState label="live numbers" />}
        <ErrorMessage message={numbersError} />
      </section>

      {/* Honest labelling: the numbers above come from a simulator, not from real meters. */}
      <p className="note">
        <strong>Demo data.</strong> The sites, sensors and readings are made up (a medicines manufacturer)
        and a simulator sends new readings every 30 seconds. Nothing here is real consumption.
      </p>

      <section className="block">
        <h3>How it works</h3>
        <ol aria-label="How it works" className="steps">
          <li><strong>Sensors report.</strong> Each site has meters that send readings in kW.</li>
          <li><strong>A limit is crossed.</strong> A reading above the site&apos;s threshold raises an alert on its own.</li>
          <li><strong>Someone handles it.</strong> The alert is acknowledged, then resolved, and nothing is lost on the way.</li>
        </ol>
      </section>

      <section className="block incident">
        <h3>Latest open alert</h3>
        {overview === null && !numbersError ? null : latestAlert ? (
          <>
            <p><strong>{latestAlert.sensorName}</strong> at {latestAlert.siteName}</p>
            <p className="muted">{latestAlert.value} kW against a limit of {latestAlert.threshold} kW</p>
            <Link to="/alerts">Review it</Link>
          </>
        ) : (
          <p className="muted">All quiet. No open alerts right now.</p>
        )}
      </section>

      <section className="block">
        <h3>How it is built</h3>
        <div className="columns">
          <div>
            <h4>Stack</h4>
            <ul className="plain">
              <li>Java 21, Quarkus, Hibernate Panache, PostgreSQL</li>
              <li>React, TypeScript, Vite, React Router</li>
              <li>Docker Compose, GitHub Actions</li>
            </ul>
          </div>
          <div>
            <h4>Engineering practices</h4>
            <ul className="plain">
              <li>Tests first, at three levels: JUnit and RestAssured, Jest and Testing Library, Playwright end to end</li>
              <li>Every push is built and tested by CI</li>
              <li>Paginated API with validation and no N+1 queries</li>
              <li>Accessible markup, light and dark themes</li>
            </ul>
          </div>
        </div>
        <div className="link-row">
          <a href={REPO_URL}>Source code on GitHub</a>
          <a href={`${REPO_URL}/blob/main/progress.md`}>Project log</a>
          <a href={CONTACT_URL}>Contact</a>
        </div>
      </section>

      <p className="status-line">
        <span className="status-dot" data-ok={health !== null} aria-hidden="true" />
        API status: {health ? <strong>{health.status}</strong> : healthError ? 'unreachable' : '...'}
      </p>
      <ErrorMessage message={healthError} />
    </div>
  );
}
