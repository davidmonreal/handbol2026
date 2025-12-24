// API base URL configuration
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Prefer explicit env when provided; otherwise fall back to local API in dev.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:3000' : 'http://localhost:3000');

// Debug: Log the API URL being used
console.log('🔧 API_BASE_URL:', API_BASE_URL);
console.log('🔧 VITE_API_URL env var:', import.meta.env.VITE_API_URL);
