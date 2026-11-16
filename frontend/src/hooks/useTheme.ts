import { useCallback, useState } from 'react';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'energywatch-theme';

/** localStorage can throw (private windows, blocked site data): treat that as "no stored choice". */
function readStored(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

/** What the theme is right now: the stored choice, else the operating system's preference. */
function resolve(): Theme {
  return readStored() ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

/**
 * Light/dark theme with a manual override. The choice is written to <html data-theme="..."> (which
 * the CSS tokens in index.css react to) and remembered in localStorage. With no stored choice the
 * attribute is left alone, so the CSS follows the OS setting by itself.
 *
 * index.html applies the stored choice before the first paint, so there is no flash of the wrong
 * theme; this hook only keeps the button label and later changes in sync.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const initial = resolve();
    // Re-apply a stored choice (harmless if index.html already did it; needed in tests).
    if (readStored()) document.documentElement.dataset.theme = initial;
    return initial;
  });

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* not remembered; still applied */ }
    setTheme(next);
  }, [theme]);

  return { theme, toggle };
}
