import fs from 'fs';
import path from 'path';
import { UPLOADS_ROOT } from '../config.js';
import { defaultDb } from '../db/defaults.js';
import { resolveUploadUrl } from '../utils/media.js';
import { deleteCloudinaryAsset } from '../lib/cloudinary.js';

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
  resolved.imageUrl = resolveUploadUrl(resolved.imageUrl);
  resolved.posterUrl = resolveUploadUrl(resolved.posterUrl);
  if (resolved.videoUrl?.startsWith('/uploads/')) {
    resolved.videoUrl = resolveUploadUrl(resolved.videoUrl);
  }
  return resolved;
}

export async function deleteUploadedFile(url) {
  if (!url) return;
  if (url.includes('cloudinary.com/')) {
    const resourceType = url.includes('/video/upload/') ? 'video' : 'image';
    await deleteCloudinaryAsset(url, resourceType);
    return;
  }

  if (!url.startsWith('/uploads/')) return;
  const relative = url.replace(/^\/uploads\//, '');
  const filePath = path.join(UPLOADS_ROOT, relative);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}
