import { Router } from 'express';
import { ok, fail } from '../utils/respond.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { upload, sanitizeFolder } from '../middleware/upload.js';

const router = Router();

router.post('/api/files/upload', requireAuth, requireAdmin, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return fail(res, 400, err.message || 'Fayl yüklənmədi');
    if (!req.file) return fail(res, 400, 'Fayl seçilməyib');
    const folder = sanitizeFolder(req.query.folder);
    const url = `/uploads/${folder}/${req.file.filename}`;
    ok(res, url, 'Fayl yükləndi');
  });
});

export default router;
