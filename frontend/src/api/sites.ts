import client from './client';

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

//GET /sites -> Site[]
export async function listSites(): Promise<Site[]> {
  const response = await client.get<Site[]>('/sites');
  return response.data;
}

//GET /sites/{id} -> Site.
export async function getSite(id: number): Promise<Site> {
  const response = await client.get<Site>(`/sites/${id}`);
  return response.data;
}

// TODO 3 (used in step 5, can wait): POST /sites with `input` -> the created Site.
export async function createSite(input: SiteInput): Promise<Site> {
  throw new Error(`TODO ${JSON.stringify(input)}`);
}

// TODO 4 (used in step 5, can wait): PUT /sites/{id} with `input` -> the updated Site.
export async function updateSite(id: number, input: SiteInput): Promise<Site> {
  throw new Error(`TODO ${id} ${JSON.stringify(input)}`);
}
