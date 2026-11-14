import { NavLink, Outlet } from 'react-router';

export default function Layout() {
  return (
    <div>
      <header>
        <h1>EnergyWatch</h1>
        <nav>
          <NavLink to="/">Home</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
