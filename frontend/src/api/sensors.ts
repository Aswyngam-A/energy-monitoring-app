import client from './client';

// Typed wrappers around the backend's sensor endpoints.
// Each function returns the response body; a non-2xx status makes Axios throw,
// and the calling component decides how to show the error.

// Matches the backend's SensorResponse record.
// `type` is null (not missing) when the sensor was created without one.
export interface Sensor {
  id: number;
  name: string;
  type: string | null;
  siteId: number;
}

// Matches the backend's SensorRequest record. The site is not part of the body:
// it comes from the URL, so a sensor can only be created under the site we post to.
export interface SensorInput {
  name: string;
  type?: string;
}

// GET /sites/{siteId}/sensors -> the sensors of one site (empty array if none)
export async function listSensors(siteId: number): Promise<Sensor[]> {
  const response = await client.get<Sensor[]>(`/sites/${siteId}/sensors`);
  return response.data;
}

// GET /sensors/{id} -> one sensor. Not nested: a sensor's own URL does not include its site.
export async function getSensor(id: number): Promise<Sensor> {
  const response = await client.get<Sensor>(`/sensors/${id}`);
  return response.data;
}

// POST /sites/{siteId}/sensors -> the created Sensor
export async function createSensor(siteId: number, input: SensorInput): Promise<Sensor> {
  const response = await client.post<Sensor>(`/sites/${siteId}/sensors`, input);
  return response.data;
}
