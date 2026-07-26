import { Router } from 'express';
import { readDb, writeDb } from '../db/index.js';
import { defaultDb } from '../db/defaults.js';
import { ok, fail } from '../utils/respond.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { resolveHeroForDeploy, deleteUploadedFile } from '../helpers/heroes.js';

const router = Router();

router.get('/api/hero', (_req, res) => {
  const db = readDb();
  const heroes = (db.heroes ?? [])
    .filter((h) => h.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((hero) => resolveHeroForDeploy(hero));
  ok(res, heroes);
});

router.get('/api/hero/active', (_req, res) => {
  const db = readDb();
  const hero = (db.heroes ?? [])
    .filter((h) => h.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0] ?? null;
  ok(res, resolveHeroForDeploy(hero));
});

router.get('/api/hero/manage', requireAuth, requireAdmin, (_req, res) => {
  const db = readDb();
  if (!db.heroes?.length) {
    db.heroes = defaultDb().heroes;
    writeDb(db);
  }
  const hero = (db.heroes ?? []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0] ?? null;
  if (!hero) return fail(res, 404, 'Ana səhifə materialı tapılmadı');
  ok(res, resolveHeroForDeploy(hero));
});

router.put('/api/hero/:id', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const hero = db.heroes?.find((h) => h.id === req.params.id);
  if (!hero) return fail(res, 404, 'Ana səhifə materialı tapılmadı');

  const fields = [
    'title', 'titleHighlight', 'titleEnd', 'subtitle', 'imageUrl', 'secondaryImageUrl',
    'videoUrl', 'posterUrl', 'ctaText', 'ctaLink', 'stat1Value', 'stat1Label', 'stat2Value',
    'stat2Label', 'isActive',
  ];
  for (const key of fields) {
    if (req.body[key] !== undefined) hero[key] = req.body[key];
  }
  hero.updatedAt = new Date().toISOString();
  writeDb(db);
  ok(res, resolveHeroForDeploy(hero), 'Ana ekran banneri yeniləndi');
});

router.delete('/api/hero/:id/video', requireAuth, requireAdmin, async (req, res) => {
  const db = readDb();
  const hero = db.heroes?.find((h) => h.id === req.params.id);
  if (!hero) return fail(res, 404, 'Ana səhifə materialı tapılmadı');
  await deleteUploadedFile(hero.videoUrl);
  hero.videoUrl = '/videos/hero.mp4';
  hero.updatedAt = new Date().toISOString();
  writeDb(db);
  ok(res, resolveHeroForDeploy(hero), 'Video silindi və standart videoya qayıdıldı');
});

router.delete('/api/hero/:id/poster', requireAuth, requireAdmin, async (req, res) => {
  const db = readDb();
  const hero = db.heroes?.find((h) => h.id === req.params.id);
  if (!hero) return fail(res, 404, 'Ana səhifə materialı tapılmadı');
  await deleteUploadedFile(hero.posterUrl);
  hero.posterUrl = '';
  hero.updatedAt = new Date().toISOString();
  writeDb(db);
  ok(res, resolveHeroForDeploy(hero), 'Poster silindi');
});

export default router;
