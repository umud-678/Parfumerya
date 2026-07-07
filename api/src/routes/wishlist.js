import { Router } from 'express';
import crypto from 'crypto';
import { readDb, writeDb } from '../db/index.js';
import { ok, fail } from '../utils/respond.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  aggregateWishlistStats,
  maybeNotifyFavoriteMilestone,
  productSnapshot,
} from '../helpers/wishlist.js';

const router = Router();

router.get('/api/wishlist/stats', requireAuth, requireAdmin, (_req, res) => {
  const db = readDb();
  ok(res, aggregateWishlistStats(db));
});

router.get('/api/wishlist/my', requireAuth, (req, res) => {
  const db = readDb();
  const entries = (db.wishlistFavorites ?? []).filter((f) => f.userId === req.user.id);
  const products = entries.map((e) => ({
    id: e.productId,
    name: e.productName,
    slug: e.productSlug,
    primaryImageUrl: e.imageUrl,
    categoryName: e.categoryName,
    minPrice: e.minPrice,
    brandName: e.brandName ?? '',
    categoryId: e.categoryId ?? '',
    categorySlug: e.categorySlug ?? '',
  }));
  ok(res, products);
});

router.post('/api/wishlist/toggle', requireAuth, (req, res) => {
  const db = readDb();
  const { productId } = req.body ?? {};
  if (!productId) return fail(res, 400, 'productId tələb olunur');

  const existingIdx = (db.wishlistFavorites ?? []).findIndex(
    (f) => f.userId === req.user.id && f.productId === productId
  );

  if (existingIdx >= 0) {
    db.wishlistFavorites.splice(existingIdx, 1);
    writeDb(db);
    return ok(res, { favorited: false, message: 'Favoritlərdən silindi' });
  }

  const snap = productSnapshot(db, req.body);
  db.wishlistFavorites.push({
    id: crypto.randomUUID(),
    userId: req.user.id,
    ...snap,
    brandName: db.products.find((p) => p.id === productId)?.brandName ?? req.body.brandName ?? '',
    categoryId: db.products.find((p) => p.id === productId)?.categoryId ?? '',
    categorySlug: db.products.find((p) => p.id === productId)?.categorySlug ?? '',
    addedAt: new Date().toISOString(),
  });
  maybeNotifyFavoriteMilestone(db, productId, snap.productName);
  writeDb(db);
  ok(res, { favorited: true, message: 'Favoritlərə əlavə edildi' });
});

router.delete('/api/wishlist/:productId', requireAuth, (req, res) => {
  const db = readDb();
  const before = db.wishlistFavorites?.length ?? 0;
  db.wishlistFavorites = (db.wishlistFavorites ?? []).filter(
    (f) => !(f.userId === req.user.id && f.productId === req.params.productId)
  );
  if (db.wishlistFavorites.length === before) {
    return fail(res, 404, 'Favorit tapılmadı');
  }
  writeDb(db);
  ok(res, { removed: true });
});

router.post('/api/wishlist/sync', requireAuth, (req, res) => {
  const db = readDb();
  const products = Array.isArray(req.body?.products) ? req.body.products : [];
  const existing = new Set(
    (db.wishlistFavorites ?? [])
      .filter((f) => f.userId === req.user.id)
      .map((f) => f.productId)
  );

  for (const item of products) {
    if (!item?.id || existing.has(item.id)) continue;
    const snap = productSnapshot(db, {
      productId: item.id,
      productName: item.name,
      productSlug: item.slug,
      imageUrl: item.primaryImageUrl,
      categoryName: item.categoryName,
      minPrice: item.minPrice,
    });
    db.wishlistFavorites.push({
      id: crypto.randomUUID(),
      userId: req.user.id,
      ...snap,
      brandName: item.brandName ?? '',
      categoryId: item.categoryId ?? '',
      categorySlug: item.categorySlug ?? '',
      addedAt: new Date().toISOString(),
    });
    maybeNotifyFavoriteMilestone(db, item.id, snap.productName);
    existing.add(item.id);
  }
  writeDb(db);

  const merged = (db.wishlistFavorites ?? [])
    .filter((f) => f.userId === req.user.id)
    .map((e) => ({
      id: e.productId,
      name: e.productName,
      slug: e.productSlug,
      primaryImageUrl: e.imageUrl,
      categoryName: e.categoryName,
      minPrice: e.minPrice,
      brandName: e.brandName ?? '',
      categoryId: e.categoryId ?? '',
      categorySlug: e.categorySlug ?? '',
    }));
  ok(res, merged);
});

export default router;
