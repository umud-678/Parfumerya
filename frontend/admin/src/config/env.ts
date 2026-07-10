const DEFAULT_API_URL = 'http://localhost:5005/api';
const PRODUCTION_API_URL = 'https://parfumerya-3.onrender.com/api';
const DEFAULT_STOREFRONT_URL = 'http://localhost:3000';

function resolveApiUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) return fromEnv;
  return import.meta.env.PROD ? PRODUCTION_API_URL : DEFAULT_API_URL;
}

export const API_URL = resolveApiUrl();
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');
export const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? DEFAULT_STOREFRONT_URL;

export function isDeployMisconfigured(): boolean {
  if (!import.meta.env.PROD) return false;
  const api = import.meta.env.VITE_API_URL?.trim();
  if (api && !api.includes('localhost') && api.startsWith('https://')) return false;
  return API_URL.includes('localhost');
}
