import { Router } from 'express';
import crypto from 'crypto';
import { readDb, writeDb } from '../db/index.js';
import { ok, fail } from '../utils/respond.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { slugify } from '../utils/slugify.js';

const router = Router();

router.get('/api/categories', (_req, res) => {
  const db = readDb();
  const data = db.categories.map((cat) => ({
    ...cat,
    productCount: db.products.filter(
      (p) => p.categoryId === cat.id || p.categorySlug === cat.slug
    ).length,
  }));
  ok(res, data);
});

router.get('/api/categories/:slug', (req, res) => {
  const db = readDb();
  const category = db.categories.find((c) => c.slug === req.params.slug);
  if (!category) return fail(res, 404, 'Kateqoriya tapılmadı');
  const productCount = db.products.filter(
    (p) => p.categoryId === category.id || p.categorySlug === category.slug
  ).length;
  ok(res, { ...category, productCount });
});

router.post('/api/categories', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const name = String(req.body.name ?? '').trim();
  if (!name) return fail(res, 400, 'Kateqoriya adı tələb olunur');
  const slug = req.body.slug?.trim() || slugify(name);
  if (db.categories.some((c) => c.slug === slug)) {
    return fail(res, 400, 'Bu slug artıq mövcuddur');
  }
  const cat = {
    id: crypto.randomUUID(),
    name,
    slug,
    description: req.body.description ?? '',
    imageUrl: req.body.imageUrl ?? '',
  };
  db.categories.push(cat);
  writeDb(db);
  ok(res, cat, 'Kateqoriya yaradıldı');
});

router.put('/api/categories/:id', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const cat = db.categories.find((c) => c.id === req.params.id);
  if (!cat) return fail(res, 404, 'Kateqoriya tapılmadı');

  const name = req.body.name !== undefined ? String(req.body.name).trim() : cat.name;
  const slug = req.body.slug !== undefined ? String(req.body.slug).trim() : cat.slug;
  if (slug !== cat.slug && db.categories.some((c) => c.slug === slug && c.id !== cat.id)) {
    return fail(res, 400, 'Bu slug artıq mövcuddur');
  }

  cat.name = name || cat.name;
  cat.slug = slug || cat.slug;
  if (req.body.description !== undefined) cat.description = req.body.description;
  if (req.body.imageUrl !== undefined) cat.imageUrl = req.body.imageUrl;

  db.products.forEach((p) => {
    if (p.categoryId === cat.id) {
      p.categorySlug = cat.slug;
      p.categoryName = cat.name;
    }
  });

  writeDb(db);
  ok(res, cat, 'Kateqoriya yeniləndi');
});

router.delete('/api/categories/:id', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const cat = db.categories.find((c) => c.id === req.params.id);
  if (!cat) return fail(res, 404, 'Kateqoriya tapılmadı');
  const productCount = db.products.filter(
    (p) => p.categoryId === cat.id || p.categorySlug === cat.slug
  ).length;
  if (productCount > 0) {
    return fail(res, 400, `Bu kateqoriyada ${productCount} məhsul var — əvvəl onları silin və ya köçürün`);
  }
  db.categories = db.categories.filter((c) => c.id !== req.params.id);
  writeDb(db);
  ok(res, null, 'Kateqoriya silindi');
});

export default router;
