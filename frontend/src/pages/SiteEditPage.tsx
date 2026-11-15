import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getSite, updateSite, type Site, type SiteInput } from '../api/sites';
import SiteForm from '../components/SiteForm';

/**
 * Page at /sites/:id/edit: loads the site, shows it in a prefilled form,
 * saves the changes and goes back to the detail page.
 */
export default function SiteEditPage() {
  const { id } = useParams(); // route parameters are always strings
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<Site | null>(null);
  const [error, setError] = useState('');

  // Load the site once on mount, and again if the id in the URL changes.
  useEffect(() => {
    getSite(Number(id))
      .then((data) => { setSite(data); })
      .catch(() => { setError('Site not found'); })
      .finally(() => { setLoading(false); });
  }, [id]);

  // If updateSite throws, the form shows the alert and we stay on this page.
  async function handleSubmit(input: SiteInput) {
    await updateSite(Number(id), input);
    void navigate(`/sites/${id}`);
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <section>
      <h2>Edit site</h2>
      <SiteForm
        // Only the editable fields are passed (not the id).
        initialValues={site ? { name: site.name, threshold: site.threshold } : undefined}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
    </section>
  );
}
