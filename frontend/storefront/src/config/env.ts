const DEFAULT_API_URL = 'http://localhost:5005/api';
const DEFAULT_ADMIN_URL = 'http://localhost:3001';

export const API_URL = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');
export const ADMIN_URL = import.meta.env.VITE_ADMIN_URL ?? DEFAULT_ADMIN_URL;

export function isDeployMisconfigured(): boolean {
  if (!import.meta.env.PROD) return false;
  const api = import.meta.env.VITE_API_URL;
  return !api || api.includes('localhost');
}
