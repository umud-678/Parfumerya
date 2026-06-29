const DEFAULT_API_URL = 'http://localhost:5005/api';
const DEFAULT_STOREFRONT_URL = 'http://localhost:3000';

export const API_URL = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');
export const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? DEFAULT_STOREFRONT_URL;

export function isDeployMisconfigured(): boolean {
  if (!import.meta.env.PROD) return false;
  const api = import.meta.env.VITE_API_URL;
  return !api || api.includes('localhost');
}
