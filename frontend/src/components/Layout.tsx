import { useState, type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router';
import { useAlerts } from '../context/AlertsContext';
import { useTheme } from '../hooks/useTheme';
import { AlertsIcon, DashboardIcon, HomeIcon, MenuIcon, MoonIcon, SitesIcon, SunIcon } from './icons';

/** HH:MM:SS in UTC, like every other time in the UI. */
const clock = (date: Date) => date.toISOString().slice(11, 19);

/** One navigation entry: icon + label (+ optional badge). `end` = only active on the exact path. */
function NavItem({ to, icon, end, onClick, children }: {
  to: string; icon: ReactNode; end?: boolean; onClick: () => void; children: ReactNode;
}) {
  return (
    <NavLink to={to} end={end} onClick={onClick} className="nav-link">
      {icon}
      {children}
    </NavLink>
  );
}

/**
 * Page frame shared by every route. Wide screens: a fixed left rail (wordmark, navigation, theme
 * toggle, "updated" line) and the page beside it. Narrow screens: the rail becomes a top bar and
 * the navigation folds behind the Menu button. The current page renders in <Outlet />.
 */
export default function Layout() {
  // The number of OPEN alerts (the ones still needing attention), counted by the server.
  const { openCount, lastUpdated } = useAlerts();
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => { setMenuOpen(false); };

  return (
    <div className="shell">
      <header className="rail">
        <div className="rail-top">
          <h1 className="wordmark"><span className="mark" aria-hidden="true" />EnergyWatch</h1>
          <button className="icon-button menu-button" aria-expanded={menuOpen} aria-controls="main-nav"
            onClick={() => { setMenuOpen((open) => !open); }}>
            <MenuIcon /><span className="visually-hidden">Menu</span>
          </button>
        </div>
        <nav id="main-nav" className="nav" data-open={menuOpen}>
          <NavItem to="/" end icon={<HomeIcon />} onClick={closeMenu}>Home</NavItem>
          <NavItem to="/dashboard" icon={<DashboardIcon />} onClick={closeMenu}>Dashboard</NavItem>
          <NavItem to="/sites" icon={<SitesIcon />} onClick={closeMenu}>Sites</NavItem>
          <NavItem to="/alerts" icon={<AlertsIcon />} onClick={closeMenu}>
            Alerts
            {/* Badge only when there is something to look at; aria-label gives screen readers context. */}
            {openCount > 0 && <span className="nav-badge" aria-label={`${openCount} open alerts`}>{openCount}</span>}
          </NavItem>
        </nav>
        <div className="rail-foot" data-open={menuOpen}>
          {lastUpdated && <small className="mono">Updated {clock(lastUpdated)}</small>}
          <button className="text-button" onClick={toggle}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            <span className="visually-hidden">Switch to {theme === 'dark' ? 'light' : 'dark'} theme</span>
            <span aria-hidden="true">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </header>
      <main className="content">
        {/* The matching child route (HomePage, SitesListPage...) renders here. */}
        <Outlet />
      </main>
    </div>
  );
}
