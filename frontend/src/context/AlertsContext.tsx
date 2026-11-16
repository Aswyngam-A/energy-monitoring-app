import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { listAlerts } from '../api/alerts';
import { usePolling } from '../hooks/usePolling';

/**
 * Shared "how many alerts are OPEN" state. The nav badge (in Layout) needs it on every page and the
 * alerts page changes it, so it lives in a provider above both instead of in either component.
 *
 * Only the number is kept here, not the alerts themselves: the list is paginated and filtered, so
 * the alerts page loads its own page. The number comes from the server's `total` for the OPEN
 * filter, which is correct however many alerts exist.
 */
interface AlertsState {
  openCount: number;
  loading: boolean;
  // Empty string = no error; otherwise a message ready to show.
  error: string;
  /** Asks the server again (call it after something changed an alert's status). */
  refresh: () => Promise<void>;
}

// null = "no provider above this component"; useAlerts turns that into a clear error.
const AlertsContext = createContext<AlertsState | null>(null);

/**
 * Loads the count when it first appears, refreshes it every 30 seconds (so the badge follows alerts
 * raised by other sensors or users), and shares it (and a way to refresh it) with all descendants.
 */
export function AlertsProvider({ children }: { children: ReactNode }) {
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Applies a result to the state (used by the first load and by refresh).
  const apply = useCallback((count: number | null) => {
    if (count === null) {
      setError('Could not load alerts');
    } else {
      setOpenCount(count);
      setError('');
    }
    setLoading(false);
  }, []);

  // The smallest page is enough: only its `total` is used. null = the request failed.
  const fetchOpenCount = (): Promise<number | null> =>
    listAlerts({ status: 'OPEN', size: 1 }).then((page) => page.total, () => null);

  // First load. State is only set inside the callback (not synchronously in the effect body), and
  // the flag stops an answer that arrives after unmount from touching the state.
  useEffect(() => {
    let cancelled = false;
    void fetchOpenCount().then((count) => { if (!cancelled) apply(count); });
    return () => { cancelled = true; };
  }, [apply]);

  // Asks the server again; the alerts page calls it after changing an alert's status.
  // useCallback keeps the same function between renders, so consumers do not re-render needlessly.
  const refresh = useCallback(async () => {
    apply(await fetchOpenCount());
  }, [apply]);

  // Background refresh. A failed poll is ignored (the last known count stays on screen): a passing
  // network hiccup should not turn the badge into an error message.
  usePolling(() => {
    void fetchOpenCount().then((count) => { if (count !== null) apply(count); });
  });

  return (
    <AlertsContext.Provider value={{ openCount, loading, error, refresh }}>
      {children}
    </AlertsContext.Provider>
  );
}

/** Read the shared alert count. Must be used under <AlertsProvider>. */
// eslint-disable-next-line react-refresh/only-export-components -- hook and provider belong together
export function useAlerts(): AlertsState {
  const state = useContext(AlertsContext);
  if (state === null) throw new Error('useAlerts must be used inside an AlertsProvider');
  return state;
}
