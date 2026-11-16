import { NavLink, Outlet } from 'react-router';
import { useAlerts } from '../context/AlertsContext';

/** Page frame shared by every route: title, navigation, and the current page in <Outlet />. */
export default function Layout() {
  // The number of OPEN alerts (the ones still needing attention), counted by the server.
  const { openCount } = useAlerts();

  return (
    <div>
      <header>
        <h1>EnergyWatch</h1>
        <nav>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/sites">Sites</NavLink>
          <NavLink to="/alerts">
            Alerts
            {/* Badge only when there is something to look at; aria-label gives screen readers context. */}
            {openCount > 0 && <span aria-label={`${openCount} open alerts`}> {openCount}</span>}
          </NavLink>
        </nav>
      </header>
      <main>
        {/* The matching child route (HomePage, SitesListPage...) renders here. */}
        <Outlet />
      </main>
    </div>
  );
}
