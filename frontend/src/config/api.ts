// API base URL configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Debug: Log the API URL being used
console.log('🔧 API_BASE_URL:', API_BASE_URL);
console.log('🔧 VITE_API_URL env var:', import.meta.env.VITE_API_URL);
