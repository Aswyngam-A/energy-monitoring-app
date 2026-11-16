// Runs once before all tests: waits until the API answers through the web proxy.
// `docker compose up -d` returns as soon as the containers are started, but Quarkus needs a few
// more seconds (database migrations, startup); without this wait the first tests of a run fail
// with connection errors that have nothing to do with the code.
export default async function globalSetup() {
  const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
  const deadline = Date.now() + 90_000;
  let lastError = 'no answer yet';

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseURL}/api/v1/health`);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (e) {
      lastError = String(e);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`The stack at ${baseURL} did not become healthy within 90 s (${lastError})`);
}
