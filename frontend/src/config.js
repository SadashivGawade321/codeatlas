// Configuration for API Endpoints

// When VITE_API_URL is empty or not set, use same-origin (Netlify proxy handles forwarding)
// For local development, fall back to localhost
export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
