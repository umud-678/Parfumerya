import { Router } from 'express';
import crypto from 'crypto';
import { readDb, writeDb } from '../db/index.js';
import { ok, fail } from '../utils/respond.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { computeCouponDiscount } from '../helpers/coupons.js';

const router = Router();

router.get('/api/coupons', requireAuth, requireAdmin, (req, res) => ok(res, readDb().coupons));

router.post('/api/coupons', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const {
    code,
    discountType,
    value,
    discountPercent,
    applicableCategorySlug,
    startDate,
    endDate,
    usageLimit,
    minOrderAmount,
    isActive,
  } = req.body;
  if (!code) return fail(res, 400, 'Promo kod tələb olunur');
  if (db.coupons.some((c) => c.code.toUpperCase() === code.toUpperCase())) {
    return fail(res, 400, 'Bu promo kod artıq mövcuddur');
  }
  const percent = Number(discountPercent ?? value ?? 0);
  const coupon = {
    id: crypto.randomUUID(),
    code: code.toUpperCase(),
    discountType: discountType ?? 'percentage',
    discountPercent: percent,
    value: discountType === 'fixed' ? Number(value ?? 0) : percent,
    applicableCategorySlug: applicableCategorySlug ?? '',
    startDate,
    endDate,
    usageLimit: usageLimit ?? null,
    usedCount: 0,
    minOrderAmount: minOrderAmount ?? 0,
    isActive: isActive !== false,
  };
  db.coupons.push(coupon);
  writeDb(db);
  ok(res, coupon);
});

router.delete('/api/coupons/:id', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const before = db.coupons.length;
  db.coupons = db.coupons.filter((c) => c.id !== req.params.id);
  if (db.coupons.length === before) return fail(res, 404, 'Promo kod tapılmadı');
  writeDb(db);
  ok(res, null, 'Promo kod silindi');
});

router.post('/api/coupons/validate', (req, res) => {
  const { code, subTotal, items } = req.body ?? {};
  const db = readDb();
  const coupon = db.coupons.find((c) => c.code === code?.toUpperCase() && c.isActive);
  const now = new Date();
  const cartItems = Array.isArray(items) ? items : [];

  if (!coupon) return ok(res, { valid: false, message: 'Promo kod tapılmadı' });
  if (new Date(coupon.startDate) > now || new Date(coupon.endDate) < now) {
    return ok(res, { valid: false, message: 'Promo kodun müddəti bitib' });
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return ok(res, { valid: false, message: 'Promo kod limiti dolub' });
  }

  const orderSubTotal =
    subTotal ??
    cartItems.reduce((s, i) => s + (i.unitPrice ?? i.price ?? 0) * (i.quantity ?? 1), 0);

  if (orderSubTotal < (coupon.minOrderAmount ?? 0)) {
    return ok(res, { valid: false, message: `Minimum sifariş: ₼ ${coupon.minOrderAmount}` });
  }

  const calc = computeCouponDiscount(coupon, cartItems, orderSubTotal);
  if (!calc.valid) return ok(res, calc);

  ok(res, {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountPercent: calc.discountPercent,
    applicableCategorySlug: coupon.applicableCategorySlug || null,
    discountAmount: calc.discountAmount,
    applicableSubTotal: calc.applicableTotal,
    message:
      coupon.discountType === 'percentage'
        ? `${calc.discountPercent}% endirim tətbiq edildi${coupon.applicableCategorySlug ? ' (seçilmiş kateqoriya)' : ''}`
        : `₼ ${coupon.value} endirim tətbiq edildi`,
  });
});

export default router;
