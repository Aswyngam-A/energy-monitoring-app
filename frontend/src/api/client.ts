// Shared Axios instance. The relative baseURL works everywhere: Vite's dev proxy and nginx
// (in Docker) both forward /api to the backend, so the browser never needs the backend's address.
import axios from 'axios';
export default axios.create({ baseURL: '/api/v1' });
