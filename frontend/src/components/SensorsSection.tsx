import { useEffect, useState } from 'react';
import { createSensor, listSensors, type Sensor, type SensorInput } from '../api/sensors';
import SensorForm from './SensorForm';

/**
 * The "Sensors" part of the site detail page: lists the site's sensors and lets the user add one.
 * It owns its own loading, so the page around it does not need to know about sensors.
 */
export default function SensorsSection({ siteId }: { siteId: number }) {
  const [loading, setLoading] = useState(true);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [error, setError] = useState('');

  // Load on mount, and again if the page is reused for another site.
  useEffect(() => {
    listSensors(siteId)
      .then((data) => { setSensors(data); })
      .catch(() => { setError('Could not load sensors'); })
      .finally(() => { setLoading(false); });
  }, [siteId]);

  // Passed to the form. If createSensor rejects, the error goes back to the form (which shows
  // its own alert) because we do not catch it here.
  async function handleAdd(input: SensorInput) {
    const created = await createSensor(siteId, input);
    // Append the sensor the server returned instead of reloading the whole list.
    setSensors((current) => [...current, created]);
  }

  return (
    <section>
      <h3>Sensors</h3>
      {loading && <p>Loading sensors...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && sensors.length === 0 && <p>No sensors yet</p>}
      {sensors.length > 0 && (
        <ul>
          {sensors.map((sensor) => (
            <li key={sensor.id}>
              {sensor.name}
              {/* type is null when the sensor was created without one */}
              {sensor.type && <span> ({sensor.type})</span>}
            </li>
          ))}
        </ul>
      )}
      <SensorForm onSubmit={handleAdd} />
    </section>
  );
}
