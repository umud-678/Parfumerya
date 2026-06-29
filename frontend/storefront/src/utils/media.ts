import { API_ORIGIN } from '../config/env';

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads')) return `${API_ORIGIN}${url}`;
  return url;
}

export function withCacheBust(url: string, version?: string | null): string {
  if (!version || !url) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${encodeURIComponent(version)}`;
}
