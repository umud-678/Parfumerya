import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { UPLOADS_ROOT, ALLOWED_UPLOAD_FOLDERS } from '../config.js';

export function sanitizeFolder(folder) {
  const f = String(folder || 'misc').replace(/[^a-z0-9-]/gi, '');
  return ALLOWED_UPLOAD_FOLDERS.has(f) ? f : 'misc';
}

const uploadStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folder = sanitizeFolder(req.query.folder);
    const dest = path.join(UPLOADS_ROOT, folder);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
    cb(null, `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`);
  },
});

export const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const folder = sanitizeFolder(req.query.folder);
    if (folder === 'hero-video' || file.mimetype.startsWith('video/')) {
      const ok = /^video\/(mp4|webm|quicktime|x-msvideo)$/i.test(file.mimetype);
      cb(ok ? null : new Error('Yalnız MP4/WebM/MOV video qəbul olunur'), ok);
      return;
    }
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Fayl tipi dəstəklənmir'));
  },
});
