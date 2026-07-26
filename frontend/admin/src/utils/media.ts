import { API_ORIGIN } from '../config/env';

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/uploads/')) return `${API_ORIGIN}${url.replace(/^\/api/, '')}`;
  if (url.startsWith('/uploads/')) return `${API_ORIGIN}${url}`;
  if (url.startsWith('uploads/')) return `${API_ORIGIN}/${url}`;
  return url;
}
