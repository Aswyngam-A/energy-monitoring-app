// The few icons the interface uses, drawn inline (no icon library). One style on purpose:
// 16px grid, 1.5px stroke, square caps and joins to match the 2px corner radius. They are
// decorative (aria-hidden): the text next to them carries the meaning.
import type { ReactNode } from 'react';

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      {children}
    </svg>
  );
}

export const HomeIcon = () => <Icon><path d="M2 7.5 8 2.5l6 5M3.5 6.5V14h9V6.5" /></Icon>;
export const DashboardIcon = () => <Icon><path d="M2 2h5v6H2zM9 2h5v3H9zM9 7h5v7H9zM2 10h5v4H2z" /></Icon>;
export const SitesIcon = () => <Icon><path d="M2 14V6l4-2v10M6 14V3l8 3v8M2 14h12M9 8h2M9 11h2" /></Icon>;
export const AlertsIcon = () => <Icon><path d="M8 2 14.5 13.5h-13zM8 6.5v3.5M8 11.5v.5" /></Icon>;
export const MenuIcon = () => <Icon><path d="M2 4h12M2 8h12M2 12h12" /></Icon>;
export const SunIcon = () => <Icon><path d="M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5 13 13M13 3l-1.5 1.5M4.5 11.5 3 13" /></Icon>;
export const MoonIcon = () => <Icon><path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" /></Icon>;
export const ChevronLeftIcon = () => <Icon><path d="M10 3 5 8l5 5" /></Icon>;
export const ChevronRightIcon = () => <Icon><path d="m6 3 5 5-5 5" /></Icon>;
