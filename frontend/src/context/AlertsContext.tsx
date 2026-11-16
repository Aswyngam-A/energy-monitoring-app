import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { listAlerts, updateAlertStatus, type Alert, type AlertStatus } from '../api/alerts';

/**
 * Shared alerts state. The nav badge (in Layout) and the alerts page both need the same list,
 * so it is loaded here, by a provider placed above both, instead of once per component.
 * Changing an alert's status also goes through here, so both readers update together.
 */
interface AlertsState {
  alerts: Alert[];
  loading: boolean;
  // Empty string = no error; otherwise a message ready to show.
  error: string;
  /**
   * Asks the server to move an alert to a new status, then reloads the list (a refetch rather than
   * patching local state: simple, and the screen always shows what the server really has).
   * The promise rejects if the server refuses, so the caller can show a message.
   */
  changeStatus: (id: number, status: AlertStatus) => Promise<void>;
}

// null = "no provider above this component"; useAlerts turns that into a clear error.
const AlertsContext = createContext<AlertsState | null>(null);

/** Loads every alert when it first appears and shares the result with all descendants. */
export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Guard against updating state after unmount (e.g. a test finishing early).
    let cancelled = false;
    listAlerts()
      .then((data) => { if (!cancelled) setAlerts(data); })
      .catch(() => { if (!cancelled) setError('Could not load alerts'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // useCallback keeps the same function between renders, so consumers do not re-render needlessly.
  const changeStatus = useCallback(async (id: number, status: AlertStatus) => {
    // Throws on 400/404: the caller handles it, and the list stays as it was.
    await updateAlertStatus(id, status);
    // Not touching `loading` here: the page must not flip back to "Loading alerts..." on every click.
    setAlerts(await listAlerts());
  }, []);

  return (
    <AlertsContext.Provider value={{ alerts, loading, error, changeStatus }}>
      {children}
    </AlertsContext.Provider>
  );
}

/** Read the shared alerts state. Must be used under <AlertsProvider>. */
// eslint-disable-next-line react-refresh/only-export-components -- hook and provider belong together
export function useAlerts(): AlertsState {
  const state = useContext(AlertsContext);
  if (state === null) throw new Error('useAlerts must be used inside an AlertsProvider');
  return state;
}
