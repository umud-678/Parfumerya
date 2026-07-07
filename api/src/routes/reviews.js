import { Router } from 'express';
import crypto from 'crypto';
import { readDb, writeDb } from '../db/index.js';
import { ok, fail } from '../utils/respond.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { productReviewStats, recalcProductRating } from '../helpers/products.js';
import { userDeliveredProductIds } from '../helpers/orders.js';

const router = Router();

router.get('/api/products/:slug/reviews', (req, res) => {
  const db = readDb();
  const product = db.products.find((p) => p.slug === req.params.slug);
  if (!product) return fail(res, 404, 'Məhsul tapılmadı');

  const reviews = (db.reviews ?? [])
    .filter((r) => r.productId === product.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const stats = productReviewStats(db, product.id);

  ok(res, {
    reviews,
    averageRating: stats.averageRating,
    count: stats.reviewCount,
  });
});

router.get('/api/products/:slug/review-eligibility', requireAuth, (req, res) => {
  const db = readDb();
  const product = db.products.find((p) => p.slug === req.params.slug);
  if (!product) return fail(res, 404, 'Məhsul tapılmadı');

  const delivered = userDeliveredProductIds(db, req.user.id);
  const alreadyReviewed = (db.reviews ?? []).some(
    (r) => r.userId === req.user.id && r.productId === product.id
  );

  ok(res, {
    canReview: delivered.has(product.id) && !alreadyReviewed,
    alreadyReviewed,
    hasDelivered: delivered.has(product.id),
  });
});

router.get('/api/reviews/my-eligible', requireAuth, (req, res) => {
  const db = readDb();
  const delivered = userDeliveredProductIds(db, req.user.id);
  const reviewed = new Set(
    (db.reviews ?? []).filter((r) => r.userId === req.user.id).map((r) => r.productId)
  );

  const items = [];
  for (const productId of delivered) {
    if (reviewed.has(productId)) continue;
    const p = db.products.find((x) => x.id === productId);
    if (p) {
      items.push({ productId: p.id, productName: p.name, productSlug: p.slug });
    }
  }
  ok(res, items);
});

router.post('/api/reviews', requireAuth, (req, res) => {
  const db = readDb();
  const { productId, rating, comment } = req.body ?? {};
  const stars = Number(rating);

  if (!productId || !Number.isInteger(stars) || stars < 1 || stars > 5) {
    return fail(res, 400, 'Qiymətləndirmə 1–5 ulduz olmalıdır');
  }
  if (!comment?.trim()) return fail(res, 400, 'Rəy mətni vacibdir');

  const product = db.products.find((p) => p.id === productId);
  if (!product) return fail(res, 404, 'Məhsul tapılmadı');

  if (!db.reviews) db.reviews = [];
  if (db.reviews.some((r) => r.userId === req.user.id && r.productId === productId)) {
    return fail(res, 400, 'Bu məhsula artıq rəy yazmısınız');
  }

  const delivered = userDeliveredProductIds(db, req.user.id);
  if (!delivered.has(productId)) {
    return fail(res, 403, 'Yalnız təhvil aldığınız məhsullara rəy yaza bilərsiniz');
  }

  const review = {
    id: crypto.randomUUID(),
    productId,
    productName: product.name,
    productSlug: product.slug,
    userId: req.user.id,
    userName: req.user.fullName || req.user.email,
    rating: stars,
    comment: comment.trim(),
    createdAt: new Date().toISOString(),
  };

  db.reviews.unshift(review);
  recalcProductRating(db, productId);
  writeDb(db);
  ok(res, review, 'Rəy əlavə edildi');
});

router.get('/api/reviews', requireAuth, requireAdmin, (_req, res) => {
  const db = readDb();
  const reviews = [...(db.reviews ?? [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  ok(res, reviews);
});

router.delete('/api/reviews/:id', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const idx = (db.reviews ?? []).findIndex((r) => r.id === req.params.id);
  if (idx === -1) return fail(res, 404, 'Rəy tapılmadı');

  const [removed] = db.reviews.splice(idx, 1);
  recalcProductRating(db, removed.productId);
  writeDb(db);
  ok(res, null, 'Rəy silindi');
});

export default router;
