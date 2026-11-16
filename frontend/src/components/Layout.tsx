import { NavLink, Outlet } from 'react-router';

/** Page frame shared by every route: title, navigation, and the current page in <Outlet />. */
export default function Layout() {
  return (
    <div>
      <header>
        <h1>EnergyWatch</h1>
        <nav>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/sites">Sites</NavLink>
          <NavLink to="/alerts">Alerts</NavLink>
        </nav>
      </header>
      <main>
        {/* The matching child route (HomePage, SitesListPage...) renders here. */}
        <Outlet />
      </main>
    </div>
  );
}
