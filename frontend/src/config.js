// Configuration for API Endpoints

// Use VITE_API_URL if it's set in the environment (e.g., during build on Vercel)
// Otherwise fall back to localhost for local development
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
