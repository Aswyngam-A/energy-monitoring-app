import { Link } from 'react-router';

/** Fallback page for any URL that matches no route. */
export default function NotFoundPage() {
  return (
    <section className="page">
      <h2>Nothing at this address</h2>
      <p>Page not found</p>
      <Link to="/dashboard">Back to the dashboard</Link>
    </section>
  );
}
