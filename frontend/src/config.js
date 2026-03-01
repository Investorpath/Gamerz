const rawBackendUrl = import.meta.env.VITE_BACKEND_URL;

// Improved fallback logic: 
// If we have a VITE_BACKEND_URL, use it.
// If we are on localhost/127.0.0.1, fallback to port 3001.
// Otherwise (on Render/Production), don't fallback to localhost which would fail.
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const defaultLocal = `http://${window.location.hostname}:3001`;

export const BACKEND_URL = rawBackendUrl || (isLocal ? defaultLocal : '');

if (!BACKEND_URL && !import.meta.env.DEV) {
    console.warn("BACKEND_URL is missing! Requests will likely fail. Please set VITE_BACKEND_URL.");
}
