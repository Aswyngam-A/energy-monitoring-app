import client from './client';

// Typed wrappers around the backend's /api/v1/sites endpoints.
// Each function returns the response body; a non-2xx status makes Axios throw,
// and the calling page decides how to show the error.

// Matches the backend's SiteResponse record.
export interface Site {
  id: number;
  name: string;
  threshold: number;
}

// Matches the backend's SiteRequest record (no id: the server generates it).
export interface SiteInput {
  name: string;
  threshold: number;
}

//GET /sites -> a page { items, page, size, total }.
// TEMPORARY (until M7 step 5 adds pagination controls): ask for the largest page allowed (100)
// and return only its items.
export async function listSites(): Promise<Site[]> {
  const response = await client.get<{ items: Site[] }>('/sites', { params: { size: 100 } });
  return response.data.items;
}

//GET /sites/{id} -> Site.
export async function getSite(id: number): Promise<Site> {
  const response = await client.get<Site>(`/sites/${id}`);
  return response.data;
}

//POST /sites -> the created Site
export async function createSite(input: SiteInput): Promise<Site> {
  const response = await client.post<Site>('/sites', input);
  return response.data;
}

//PUT /sites/{id} -> the updated Site
export async function updateSite(id: number, input: SiteInput): Promise<Site> {
  const response = await client.put<Site>(`/sites/${id}`, input);
  return response.data;
}
