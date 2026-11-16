import { useEffect, useRef } from 'react';

/** How often screens ask the server for fresh data: 30 seconds. */
export const POLL_INTERVAL_MS = 30_000;

/**
 * Calls `callback` every `intervalMs` while the component is mounted ("polling"): the simplest way
 * to keep a screen up to date, since the server cannot push changes to the browser.
 *
 * - Ticks are skipped while the browser tab is hidden (nobody is looking, so no requests are wasted).
 *   The next tick after the tab is visible again refreshes the data.
 * - The callback is kept in a ref and read at tick time, so the caller may pass a new function on
 *   every render (it usually closes over fresh state) without restarting the timer.
 * - The timer is cleared on unmount.
 */
export function usePolling(callback: () => void, intervalMs: number = POLL_INTERVAL_MS): void {
  const latest = useRef(callback);

  // Remember the newest callback after every render (not during render: refs are written in effects).
  useEffect(() => {
    latest.current = callback;
  });

  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) latest.current();
    }, intervalMs);
    return () => { clearInterval(id); };
  }, [intervalMs]);
}
