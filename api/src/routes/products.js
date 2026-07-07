import { Router } from 'express';
import crypto from 'crypto';
import { readDb, writeDb } from '../db/index.js';
import { ok, fail } from '../utils/respond.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { slugify } from '../utils/slugify.js';
import {
  filterProducts,
  enrichProduct,
  findProductBySku,
  getProductStock,
  setProductStock,
} from '../helpers/products.js';

const router = Router();

router.get('/api/products', (req, res) => {
  const db = readDb();
  const filtered = filterProducts(db.products, req.query, db.categories);
  const totalCount = filtered.length;
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
  const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit, 10)) : totalCount;
  const items = filtered.slice(offset, offset + limit).map((p) => enrichProduct(db, p));
  ok(res, { items, totalCount, offset, limit });
});

router.patch('/api/products/:id/stock', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) return fail(res, 404, 'Məhsul tapılmadı');

  const addRaw = req.body?.add;
  const subtractRaw = req.body?.subtract;
  const setRaw = req.body?.set;
  const hasAdd = addRaw != null && addRaw !== '';
  const hasSubtract = subtractRaw != null && subtractRaw !== '';
  const hasSet = setRaw != null && setRaw !== '';

  if (hasAdd) {
    const add = Number(addRaw);
    if (!Number.isFinite(add) || add <= 0) return fail(res, 400, 'add müsbət ədəd olmalıdır');
    setProductStock(product, getProductStock(product) + add);
  } else if (hasSubtract) {
    const subtract = Number(subtractRaw);
    if (!Number.isFinite(subtract) || subtract <= 0) return fail(res, 400, 'subtract müsbət ədəd olmalıdır');
    setProductStock(product, getProductStock(product) - subtract);
  } else if (hasSet) {
    const set = Number(setRaw);
    if (!Number.isFinite(set) || set < 0) return fail(res, 400, 'set 0 və ya daha böyük olmalıdır');
    setProductStock(product, set);
  } else {
    return fail(res, 400, 'add, subtract və ya set göndərin');
  }

  writeDb(db);
  ok(res, { id: product.id, stock: getProductStock(product) }, 'Stok yeniləndi');
});

router.get('/api/products/:slug', (req, res) => {
  const db = readDb();
  const product = db.products.find((p) => p.slug === req.params.slug);
  if (!product) return fail(res, 404, 'Məhsul tapılmadı');
  ok(res, enrichProduct(db, product));
});

router.post('/api/products', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const body = req.body ?? {};
  const sku = (body.sku || body.variants?.[0]?.sku || '').trim();
  const slug = body.slug?.trim() || (body.name ? slugify(body.name) : '');
  const incomingStock = Math.max(0, Number(body.stock ?? body.variants?.[0]?.stockQuantity ?? 0) || 0);

  let existing = findProductBySku(db, sku);
  if (!existing && slug) {
    existing = db.products.find((p) => p.slug === slug) ?? null;
  }

  if (existing && incomingStock > 0) {
    const nextStock = getProductStock(existing) + incomingStock;
    setProductStock(existing, nextStock);
    writeDb(db);
    return ok(res, existing.id, 'Stok mövcud məhsula əlavə edildi');
  }

  const product = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...body,
    slug: slug || slugify(body.name || 'mehsul'),
    stock: incomingStock,
  };
  if (product.variants?.length) {
    for (const v of product.variants) {
      v.stockQuantity = incomingStock;
    }
  } else if (sku) {
    product.variants = [{
      id: crypto.randomUUID(),
      sku,
      volumeMl: Number(body.volumeMl ?? 50),
      price: Number(body.price ?? body.minPrice ?? 0),
      stockQuantity: incomingStock,
    }];
  }
  db.products.unshift(product);
  writeDb(db);
  ok(res, product.id, 'Məhsul yaradıldı');
});

router.delete('/api/products/:id', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  db.products = db.products.filter((p) => p.id !== req.params.id);
  writeDb(db);
  ok(res, null);
});

export default router;
