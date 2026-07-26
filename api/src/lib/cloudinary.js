import fs from 'fs/promises';
import { v2 as cloudinary } from 'cloudinary';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const CLOUD_API_KEY = process.env.CLOUDINARY_API_KEY?.trim();
const CLOUD_API_SECRET = process.env.CLOUDINARY_API_SECRET?.trim();

let configured = false;

function ensureConfig() {
  if (configured || !isCloudinaryConfigured()) return;
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_API_KEY,
    api_secret: CLOUD_API_SECRET,
    secure: true,
  });
  configured = true;
}

export function isCloudinaryConfigured() {
  return Boolean(CLOUD_NAME && CLOUD_API_KEY && CLOUD_API_SECRET);
}

function buildFolder(folder, resourceType) {
  return resourceType === 'video' ? `parfumerya/${folder}/video` : `parfumerya/${folder}`;
}

export async function uploadToCloudinary({ filePath, folder, resourceType, filename }) {
  ensureConfig();
  if (!isCloudinaryConfigured()) return null;

  return cloudinary.uploader.upload(filePath, {
    folder: buildFolder(folder, resourceType),
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    filename_override: filename,
  });
}

export function buildCloudinaryDeliveryUrl(result, resourceType) {
  if (!result?.public_id) return '';
  return cloudinary.url(result.public_id, {
    secure: true,
    resource_type: resourceType,
    transformation: resourceType === 'image' ? [{ fetch_format: 'auto', quality: 'auto' }] : undefined,
  });
}

export function extractCloudinaryPublicId(url) {
  if (!url || !url.includes('cloudinary.com/')) return null;

  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex < 0) return null;

    const afterUpload = pathParts.slice(uploadIndex + 1);
    if (!afterUpload.length) return null;

    let startIndex = 0;
    while (startIndex < afterUpload.length && !/^v\d+$/.test(afterUpload[startIndex])) {
      startIndex += 1;
    }

    const publicIdParts = startIndex < afterUpload.length ? afterUpload.slice(startIndex + 1) : afterUpload;
    if (!publicIdParts.length) return null;

    const last = publicIdParts[publicIdParts.length - 1].replace(/\.[^.]+$/, '');
    return [...publicIdParts.slice(0, -1), last].join('/');
  } catch {
    return null;
  }
}

export async function deleteCloudinaryAsset(url, resourceType = 'image') {
  ensureConfig();
  if (!isCloudinaryConfigured()) return false;

  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return false;

  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
  return true;
}

export async function safeUnlink(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore cleanup errors
  }
}