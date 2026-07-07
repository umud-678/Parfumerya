import { Router } from 'express';
import crypto from 'crypto';
import { readDb, writeDb } from '../db/index.js';
import { ok, fail } from '../utils/respond.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { slugify } from '../utils/slugify.js';

const router = Router();

router.get('/api/brands', (_req, res) => ok(res, readDb().brands));

router.post('/api/brands', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const name = String(req.body?.name ?? '').trim();
  if (!name) return fail(res, 400, 'Brend adı vacibdir');
  const slug = slugify(name);
  if (db.brands.some((b) => b.slug === slug)) {
    return fail(res, 400, 'Bu brend artıq mövcuddur');
  }
  const brand = { id: crypto.randomUUID(), name, slug };
  db.brands.push(brand);
  writeDb(db);
  ok(res, brand, 'Brend yaradıldı');
});

router.delete('/api/brands/:id', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const idx = db.brands.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return fail(res, 404, 'Brend tapılmadı');
  const inUse = db.products.some((p) => p.brandId === req.params.id);
  if (inUse) return fail(res, 400, 'Bu brend məhsullarda istifadə olunur');
  db.brands.splice(idx, 1);
  writeDb(db);
  ok(res, null, 'Brend silindi');
});

export default router;
