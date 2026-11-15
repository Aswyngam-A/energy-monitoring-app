import client from './client';

/** Body of GET /health. */
export interface HealthResponse {
  status: string;
}
/** Asks the backend whether it is up. Axios throws if the request fails. */
export async function getHealth(): Promise<HealthResponse> {
  const response = await client.get<HealthResponse>('/health');
  return response.data;
}
