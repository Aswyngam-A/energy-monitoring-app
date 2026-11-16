import { useNavigate } from 'react-router';
import { createSite, type SiteInput } from '../api/sites';
import SiteForm from '../components/SiteForm';

/** Page at /sites/new: an empty form that creates a site, then opens its detail page. */
export default function SiteNewPage() {
  const navigate = useNavigate();

  // Passed to the form. If createSite throws, the error propagates to the form,
  // which shows the alert and keeps the user on this page.
  async function handleSubmit(input: SiteInput) {
    const site = await createSite(input);
    // The backend returns the created site, including the id it generated.
    void navigate(`/sites/${site.id}`);
  }

  return (
    <section className="page">
      <h2>New site</h2>
      <SiteForm submitLabel="Create site" onSubmit={handleSubmit} />
    </section>
  );
}
