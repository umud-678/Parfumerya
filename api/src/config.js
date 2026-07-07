import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// api/ qovluğunun kökü (src-dən bir üst)
export const API_ROOT = path.join(__dirname, '..');

export const DB_PATH = path.join(API_ROOT, 'data', 'db.json');
export const UPLOADS_ROOT = path.join(API_ROOT, 'uploads');
export const PORT = process.env.PORT || 5005;

export const ALLOWED_UPLOAD_FOLDERS = new Set(['products', 'hero', 'hero-video', 'images', 'misc']);
