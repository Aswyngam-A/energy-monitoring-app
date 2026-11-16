import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { listAlerts, type Alert } from '../api/alerts';

/**
 * Shared alerts state. The nav badge (in Layout) and the alerts page both need the same list,
 * so it is loaded once here, by a provider placed above both, instead of once per component.
 */
interface AlertsState {
  alerts: Alert[];
  loading: boolean;
  // Empty string = no error; otherwise a message ready to show.
  error: string;
}

// null = "no provider above this component"; useAlerts turns that into a clear error.
const AlertsContext = createContext<AlertsState | null>(null);

/** Loads every alert once, when it first appears, and shares the result with all descendants. */
export function AlertsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AlertsState>({ alerts: [], loading: true, error: '' });

  useEffect(() => {
    // Guard against updating state after unmount (e.g. a test finishing early).
    let cancelled = false;
    listAlerts()
      .then((alerts) => { if (!cancelled) setState({ alerts, loading: false, error: '' }); })
      .catch(() => {
        if (!cancelled) setState({ alerts: [], loading: false, error: 'Could not load alerts' });
      });
    return () => { cancelled = true; };
  }, []);

  return <AlertsContext.Provider value={state}>{children}</AlertsContext.Provider>;
}

/** Read the shared alerts state. Must be used under <AlertsProvider>. */
// eslint-disable-next-line react-refresh/only-export-components -- hook and provider belong together
export function useAlerts(): AlertsState {
  const state = useContext(AlertsContext);
  if (state === null) throw new Error('useAlerts must be used inside an AlertsProvider');
  return state;
}
