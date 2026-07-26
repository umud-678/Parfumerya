import { Router } from 'express';
import { ok, fail } from '../utils/respond.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { upload, sanitizeFolder } from '../middleware/upload.js';
import { resolveUploadUrl } from '../utils/media.js';
import { buildCloudinaryDeliveryUrl, isCloudinaryConfigured, safeUnlink, uploadToCloudinary } from '../lib/cloudinary.js';

const router = Router();

router.post('/api/files/upload', requireAuth, requireAdmin, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return fail(res, 400, err.message || 'Fayl yüklənmədi');
    if (!req.file) return fail(res, 400, 'Fayl seçilməyib');
    const folder = sanitizeFolder(req.query.folder);

    try {
      if (isCloudinaryConfigured()) {
        const resourceType = folder === 'hero-video' || req.file.mimetype.startsWith('video/') ? 'video' : 'image';
        const result = await uploadToCloudinary({
          filePath: req.file.path,
          folder,
          resourceType,
          filename: req.file.filename,
        });
        await safeUnlink(req.file.path);

        const deliveryUrl = buildCloudinaryDeliveryUrl(result, resourceType) || result?.secure_url || result?.url;
        return ok(res, deliveryUrl || resolveUploadUrl(`/uploads/${folder}/${req.file.filename}`), 'Fayl yükləndi');
      }

      const url = `/uploads/${folder}/${req.file.filename}`;
      return ok(res, resolveUploadUrl(url), 'Fayl yükləndi');
    } catch (uploadError) {
      await safeUnlink(req.file.path);
      return fail(res, 500, uploadError.message || 'Cloudinary yüklənməsi uğursuz oldu');
    }
  });
});

export default router;
