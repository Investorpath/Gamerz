const rawBackendUrl = import.meta.env.VITE_BACKEND_URL;
// If we are in production and the URL is missing, we want it to be obvious
export const BACKEND_URL = rawBackendUrl || 'http://localhost:3001';

if (!rawBackendUrl && import.meta.env.PROD) {
    console.warn("VITE_BACKEND_URL is missing in production environment!");
}
