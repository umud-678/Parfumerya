import { PUBLIC_ORIGIN } from '../config.js';

function isAbsoluteUrl(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}

export function resolveUploadUrl(url) {
  if (!url) return '';
  if (isAbsoluteUrl(url)) return url;
  if (url.startsWith('/uploads/')) return `${PUBLIC_ORIGIN}${url}`;
  if (url.startsWith('uploads/')) return `${PUBLIC_ORIGIN}/${url}`;
  if (url.startsWith('/api/uploads/')) return `${PUBLIC_ORIGIN}${url.replace(/^\/api/, '')}`;
  return url;
}