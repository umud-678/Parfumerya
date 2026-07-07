import fs from 'fs';
import path from 'path';
import { UPLOADS_ROOT } from '../config.js';
import { defaultDb } from '../db/defaults.js';

export function uploadFileExists(url) {
  if (!url?.startsWith('/uploads/')) return false;
  const relative = url.replace(/^\/uploads\//, '');
  return fs.existsSync(path.join(UPLOADS_ROOT, relative));
}

export function resolveHeroForDeploy(hero) {
  if (!hero) return hero;
  const fallback = defaultDb().heroes[0];
  const resolved = { ...hero };
  if (resolved.videoUrl?.startsWith('/uploads/') && !uploadFileExists(resolved.videoUrl)) {
    resolved.videoUrl = fallback.videoUrl?.startsWith('http') ? fallback.videoUrl : null;
  }
  if (resolved.imageUrl?.startsWith('/uploads/') && !uploadFileExists(resolved.imageUrl)) {
    resolved.imageUrl = fallback.imageUrl;
  }
  if (resolved.posterUrl?.startsWith('/uploads/') && !uploadFileExists(resolved.posterUrl)) {
    resolved.posterUrl = fallback.posterUrl;
  }
  return resolved;
}

export function deleteUploadedFile(url) {
  if (!url?.startsWith('/uploads/')) return;
  const relative = url.replace(/^\/uploads\//, '');
  const filePath = path.join(UPLOADS_ROOT, relative);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}
