import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import multer from 'multer';
import { requestRegistrationOtp, verifyRegistrationOtp, cleanupExpiredOtps } from './lib/registrationOtp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const UPLOADS_ROOT = path.join(__dirname, 'uploads');
const PORT = process.env.PORT || 5005;

const ALLOWED_UPLOAD_FOLDERS = new Set(['products', 'hero', 'hero-video', 'images', 'misc']);

function sanitizeFolder(folder) {
  const f = String(folder || 'misc').replace(/[^a-z0-9-]/gi, '');
  return ALLOWED_UPLOAD_FOLDERS.has(f) ? f : 'misc';
}

const uploadStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folder = sanitizeFolder(req.query.folder);
    const dest = path.join(UPLOADS_ROOT, folder);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
    cb(null, `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const folder = sanitizeFolder(req.query.folder);
    if (folder === 'hero-video' || file.mimetype.startsWith('video/')) {
      const ok = /^video\/(mp4|webm|quicktime|x-msvideo)$/i.test(file.mimetype);
      cb(ok ? null : new Error('Yalnız MP4/WebM/MOV video qəbul olunur'), ok);
      return;
    }
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Fayl tipi dəstəklənmir'));
  },
});

const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001'];
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : defaultOrigins;

const app = express();
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use('/uploads', express.static(UPLOADS_ROOT));

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function computeCouponDiscount(coupon, items, subTotalOverride) {
  const subTotal =
    subTotalOverride ??
    items.reduce((s, i) => s + (i.unitPrice ?? i.price ?? 0) * (i.quantity ?? 1), 0);
  const slug = coupon.applicableCategorySlug || '';
  const applicableTotal = slug
    ? items
        .filter((i) => i.categorySlug === slug)
        .reduce((s, i) => s + (i.unitPrice ?? i.price ?? 0) * (i.quantity ?? 1), 0)
    : subTotal;

  if (slug && applicableTotal <= 0) {
    return {
      valid: false,
      message: 'Bu promo kod yalnız müəyyən kateqoriyaya şamil olunur — səbətinizdə uyğun məhsul yoxdur',
    };
  }

  const percent = coupon.discountPercent ?? coupon.value ?? 0;
  let discountAmount = 0;
  if (coupon.discountType === 'fixed') {
    discountAmount = Math.min(Number(coupon.value) || 0, applicableTotal);
  } else {
    discountAmount = Math.round(applicableTotal * percent) / 100;
  }

  return {
    valid: true,
    discountAmount,
    applicableTotal,
    discountPercent: coupon.discountType === 'percentage' ? percent : null,
  };
}

function defaultDb() {
  return {
    users: [
      {
        id: 'admin-umud',
        email: 'umud9832@gmail.com',
        password: '12345678',
        fullName: 'Umud Admin',
        roles: ['Admin'],
        isBlocked: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    categories: [
      { id: 'cat-women', name: 'Qadın ətirləri', slug: 'qadin-etirleri' },
      { id: 'cat-men', name: 'Kişi ətirləri', slug: 'kisi-etirleri' },
      { id: 'cat-cosmetic', name: 'Kosmetika', slug: 'kosmetika' },
    ],
    brands: [
      { id: 'brand-dior', name: 'Dior', slug: 'dior' },
      { id: 'brand-chanel', name: 'Chanel', slug: 'chanel' },
      { id: 'brand-tomford', name: 'Tom Ford', slug: 'tom-ford' },
    ],
    products: [],
    coupons: [
      {
        id: 'coupon-summer20',
        code: 'SUMMER20',
        discountType: 'percentage',
        discountPercent: 20,
        value: 20,
        applicableCategorySlug: '',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.999Z',
        usageLimit: 1000,
        usedCount: 0,
        minOrderAmount: 0,
        isActive: true,
      },
      {
        id: 'coupon-women15',
        code: 'QADIN15',
        discountType: 'percentage',
        discountPercent: 15,
        value: 15,
        applicableCategorySlug: 'qadin-etirleri',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.999Z',
        usageLimit: 500,
        usedCount: 0,
        minOrderAmount: 0,
        isActive: true,
      },
    ],
    orders: [],
    notifications: [],
    customerNotifications: [],
    heroes: [
      {
        id: 'hero-main',
        title: 'Fall in love with Our Signature',
        titleHighlight: 'Perfumes',
        titleEnd: '',
        subtitle: 'Discover the perfect fragrance for you with our wide selection of perfumes.',
        imageUrl: 'https://images.unsplash.com/photo-1595425970375-c9700298a1e4?w=900&h=1100&fit=crop',
        videoUrl: '/videos/hero.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1595425970375-c9700298a1e4?w=1920&h=1080&fit=crop',
        secondaryImageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=500&fit=crop',
        ctaText: 'SHOP NOW!',
        ctaLink: '/shop',
        stat1Value: '90+',
        stat1Label: 'Perfumes',
        stat2Value: '15M+',
        stat2Label: 'Customers',
        isActive: true,
        sortOrder: 0,
      },
    ],
    settings: {
      siteName: 'Amoria',
      siteTagline: 'Premium parfumeriya və kosmetika mağazası',
      email: 'info@parfumerya.az',
      phone: '+994 12 345 67 89',
      address: 'Bakı, Azərbaycan',
      footerDescription: 'Geniş ətir kolleksiyamızla sizin üçün mükəmməl qoxunu kəşf edin.',
      socialLinks: [
        { id: 'social-ig', platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/parfumerya' },
        { id: 'social-fb', platform: 'facebook', label: 'Facebook', url: 'https://facebook.com/parfumerya' },
        { id: 'social-wa', platform: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/994123456789' },
      ],
      shippingFee: 5,
      freeShippingThreshold: 100,
      aboutTextAz: 'Parfumerya — Azərbaycanda premium ətir və kosmetika təcrübəsi. Dior, Chanel, Tom Ford və digər seçilmiş brendlərin orijinal məhsullarını təqdim edirik.',
      aboutTextEn: 'Parfumerya — premium fragrance and cosmetics in Azerbaijan. Original products from Dior, Chanel, Tom Ford and other selected brands.',
      aboutTextRu: 'Parfumerya — премиальная парфюмерия и косметика в Азербайджане. Оригинальная продукция Dior, Chanel, Tom Ford и других брендов.',
      paymentMethods: [
        { id: 'cod', code: 'cash_on_delivery', name: 'Çatdırılma zamanı nağd', active: true },
      ],
    },
    wishlistFavorites: [],
    reviews: [],
    registrationOtps: [],
  };
}

function getProductFavoriteCount(db, productId) {
  return (db.wishlistFavorites ?? []).filter((f) => f.productId === productId).length;
}

const FAVORITE_NOTIFY_MILESTONES = [1, 5, 10, 20, 50, 100];

function maybeNotifyFavoriteMilestone(db, productId, productName) {
  const count = getProductFavoriteCount(db, productId);
  if (!FAVORITE_NOTIFY_MILESTONES.includes(count)) return;

  const dedupeKey = `WishlistFavorite:${productId}:${count}`;
  const already = (db.notifications ?? []).some(
    (n) => n.type === 'WishlistFavorite' && n.referenceId === dedupeKey
  );
  if (already) return;

  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: crypto.randomUUID(),
    type: 'WishlistFavorite',
    title: 'Məhsul favoritlərdə',
    message: `"${productName}" məhsulunu artıq ${count} müştəri favoritə əlavə edib.`,
    referenceId: dedupeKey,
    productId,
    favoriteCount: count,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}

function aggregateWishlistStats(db) {
  const favorites = db.wishlistFavorites ?? [];
  const byProduct = new Map();

  for (const entry of favorites) {
    const key = entry.productId;
    if (!byProduct.has(key)) {
      byProduct.set(key, {
        productId: entry.productId,
        productName: entry.productName,
        productSlug: entry.productSlug,
        imageUrl: entry.imageUrl,
        categoryName: entry.categoryName ?? '',
        minPrice: entry.minPrice ?? 0,
        favoriteCount: 0,
        lastFavoritedAt: entry.addedAt,
      });
    }
    const stat = byProduct.get(key);
    stat.favoriteCount += 1;
    if (entry.addedAt > stat.lastFavoritedAt) {
      stat.lastFavoritedAt = entry.addedAt;
    }
  }

  const items = Array.from(byProduct.values()).sort((a, b) => b.favoriteCount - a.favoriteCount);
  const uniqueUsers = new Set(favorites.map((f) => f.userId)).size;

  return {
    summary: {
      totalFavorites: favorites.length,
      uniqueProducts: items.length,
      uniqueUsers,
    },
    items,
  };
}

function productSnapshot(db, body) {
  const fromDb = db.products.find((p) => p.id === body.productId);
  return {
    productId: body.productId,
    productName: fromDb?.name ?? body.productName ?? 'Məhsul',
    productSlug: fromDb?.slug ?? body.productSlug ?? '',
    imageUrl: fromDb?.primaryImageUrl ?? body.imageUrl ?? '',
    categoryName: fromDb?.categoryName ?? body.categoryName ?? '',
    minPrice: fromDb?.minPrice ?? body.minPrice ?? 0,
  };
}

function seedProducts() {
  const items = [
    { name: 'Rosewood Bliss', slug: 'rosewood-bliss', brandName: 'Dior', categoryId: 'cat-women', categorySlug: 'qadin-etirleri', categoryName: 'Qadın ətirləri', price: 50, isFeatured: true, primaryImageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=600&fit=crop', secondaryImageUrl: 'https://images.unsplash.com/photo-1595425970375-c9700298a1e4?w=500&h=600&fit=crop' },
    { name: 'Citrus Zest', slug: 'citrus-zest', brandName: 'Chanel', categoryId: 'cat-men', categorySlug: 'kisi-etirleri', categoryName: 'Kişi ətirləri', price: 90, isNew: true, primaryImageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500&h=600&fit=crop', secondaryImageUrl: 'https://images.unsplash.com/photo-1588405748880-12c705bad141?w=500&h=600&fit=crop' },
    { name: 'Woodland Walk', slug: 'woodland-walk', brandName: 'Tom Ford', categoryId: 'cat-men', categorySlug: 'kisi-etirleri', categoryName: 'Kişi ətirləri', price: 70, isFeatured: true, primaryImageUrl: 'https://images.unsplash.com/photo-1588405748880-12c705bad141?w=500&h=600&fit=crop', secondaryImageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500&h=600&fit=crop' },
    { name: 'Velvet Noir', slug: 'velvet-noir', brandName: 'Dior', categoryId: 'cat-women', categorySlug: 'qadin-etirleri', categoryName: 'Qadın ətirləri', price: 80, isNew: true, isFeatured: true, primaryImageUrl: 'https://images.unsplash.com/photo-1595425970375-c9700298a1e4?w=500&h=600&fit=crop', secondaryImageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&h=600&fit=crop' },
    { name: 'Ocean Breeze', slug: 'ocean-breeze', brandName: 'Chanel', categoryId: 'cat-cosmetic', categorySlug: 'kosmetika', categoryName: 'Kosmetika', price: 65, primaryImageUrl: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=500&h=600&fit=crop', secondaryImageUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&h=600&fit=crop' },
    { name: 'Golden Amber', slug: 'golden-amber', brandName: 'Tom Ford', categoryId: 'cat-women', categorySlug: 'qadin-etirleri', categoryName: 'Qadın ətirləri', price: 100, isFeatured: true, primaryImageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&h=600&fit=crop', secondaryImageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=600&fit=crop' },
    { name: 'Midnight Oud', slug: 'midnight-oud', brandName: 'Tom Ford', categoryId: 'cat-men', categorySlug: 'kisi-etirleri', categoryName: 'Kişi ətirləri', price: 120, isNew: true, primaryImageUrl: 'https://images.unsplash.com/photo-1592945403244-b31f0502c71c?w=500&h=600&fit=crop', secondaryImageUrl: 'https://images.unsplash.com/photo-1588405748880-12c705bad141?w=500&h=600&fit=crop' },
    { name: 'Silk Petals', slug: 'silk-petals', brandName: 'Dior', categoryId: 'cat-cosmetic', categorySlug: 'kosmetika', categoryName: 'Kosmetika', price: 55, isFeatured: true, primaryImageUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&h=600&fit=crop', secondaryImageUrl: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=500&h=600&fit=crop' },
  ];
  return items.map((p) => ({
    id: crypto.randomUUID(),
    ...p,
    minPrice: p.price,
    sku: `${p.slug.toUpperCase().slice(0, 4)}-50`,
    volumeMl: 50,
    stock: 20,
    createdAt: new Date().toISOString(),
    variants: [{ id: crypto.randomUUID(), sku: `${p.slug}-50`, volumeMl: 50, price: p.price, stockQuantity: 20 }],
  }));
}

function findProductByVariantId(db, variantId) {
  if (!variantId) return null;
  return (
    db.products.find((p) =>
      p.variants?.some((v) => v.id === variantId || v.sku === variantId)
    ) ?? null
  );
}

function getProductStock(product) {
  if (!product) return 0;
  if (product.stock != null) return Math.max(0, Number(product.stock) || 0);
  const v = product.variants?.[0];
  return Math.max(0, Number(v?.stockQuantity ?? 0) || 0);
}

function setProductStock(product, quantity) {
  const qty = Math.max(0, Math.floor(Number(quantity) || 0));
  product.stock = qty;
  if (product.variants?.length) {
    for (const v of product.variants) {
      v.stockQuantity = qty;
    }
  }
}

function findProductBySku(db, sku) {
  if (!sku) return null;
  const normalized = String(sku).trim().toUpperCase();
  return (
    db.products.find(
      (p) =>
        (p.sku || '').toUpperCase() === normalized ||
        p.variants?.some((v) => (v.sku || '').toUpperCase() === normalized)
    ) ?? null
  );
}

function resolveOrderItemProduct(db, item) {
  if (item.productId) {
    const p = db.products.find((x) => x.id === item.productId);
    if (p) return { productId: p.id, productSlug: p.slug, productName: p.name };
  }
  const variantId = item.productVariantId ?? item.variantId;
  const p = findProductByVariantId(db, variantId);
  if (p) return { productId: p.id, productSlug: p.slug, productName: p.name };
  return { productId: null, productSlug: null, productName: item.productName ?? '' };
}

function userDeliveredProductIds(db, userId) {
  const ids = new Set();
  for (const order of db.orders ?? []) {
    if (order.userId !== userId || order.status !== 'Delivered') continue;
    for (const item of order.items ?? []) {
      const { productId } = resolveOrderItemProduct(db, item);
      if (productId) ids.add(productId);
    }
  }
  return ids;
}

function productReviewStats(db, productId) {
  const reviews = (db.reviews ?? []).filter((r) => r.productId === productId);
  if (!reviews.length) {
    return { averageRating: null, reviewCount: 0 };
  }
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return {
    averageRating: Math.round((sum / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
  };
}

function enrichProduct(db, product) {
  const stats = productReviewStats(db, product.id);
  const { averageRating: _stored, reviewCount: _rc, ...rest } = product;
  return { ...rest, ...stats };
}

function recalcProductRating(db, productId) {
  const product = db.products.find((p) => p.id === productId);
  if (!product) return;
  const stats = productReviewStats(db, productId);
  if (stats.reviewCount === 0) {
    delete product.averageRating;
    delete product.reviewCount;
    return;
  }
  product.averageRating = stats.averageRating;
  product.reviewCount = stats.reviewCount;
}

function syncAllProductRatings(db) {
  let changed = false;
  for (const product of db.products ?? []) {
    const stats = productReviewStats(db, product.id);
    const nextRating = stats.averageRating;
    const nextCount = stats.reviewCount;
    if (product.averageRating !== nextRating || product.reviewCount !== nextCount) {
      if (nextRating == null) {
        delete product.averageRating;
        delete product.reviewCount;
      } else {
        product.averageRating = nextRating;
        product.reviewCount = nextCount;
      }
      changed = true;
    }
  }
  return changed;
}

function isAdminUser(user) {
  return user?.roles?.includes('Admin');
}

function normalizeSingleAdminRoles(db) {
  let changed = false;
  const users = db.users ?? [];
  const primaryAdmin =
    users.find((u) => u.id === 'admin-umud') ??
    users.find((u) => u.roles?.some((r) => r === 'Admin' || r === 'SuperAdmin'));

  for (const user of users) {
    const isPrimary = primaryAdmin && user.id === primaryAdmin.id;
    if (isPrimary) {
      if (!user.roles?.includes('Admin') || user.roles.includes('SuperAdmin') || user.roles.length !== 1) {
        user.roles = ['Admin'];
        changed = true;
      }
      continue;
    }
    if (user.roles?.some((r) => r === 'Admin' || r === 'SuperAdmin')) {
      user.roles = ['Customer'];
      changed = true;
      continue;
    }
    if (!user.roles?.length || user.roles.includes('SuperAdmin')) {
      user.roles = ['Customer'];
      changed = true;
    }
  }

  return changed;
}

function ensureSeedData(db) {
  let changed = false;
  if (!db.heroes?.length) {
    db.heroes = defaultDb().heroes;
    changed = true;
  } else if (db.heroes[0]?.title === 'Signature') {
    db.heroes[0] = { ...defaultDb().heroes[0], id: db.heroes[0].id };
    changed = true;
  }
  for (const hero of db.heroes ?? []) {
    if (!hero.videoUrl) {
      hero.videoUrl = '/videos/hero.mp4';
      changed = true;
    }
  }
  if (!db.products?.length) {
    db.products = seedProducts();
    changed = true;
  }
  if (!db.settings) {
    db.settings = defaultDb().settings;
    changed = true;
  } else {
    const defaults = defaultDb().settings;
    for (const key of Object.keys(defaults)) {
      if (db.settings[key] === undefined) {
        db.settings[key] = defaults[key];
        changed = true;
      }
    }
  }
  if (!db.wishlistFavorites) {
    db.wishlistFavorites = [];
    changed = true;
  }
  if (!db.customerNotifications) {
    db.customerNotifications = [];
    changed = true;
  }
  if (!db.reviews) {
    db.reviews = [];
    changed = true;
  }
  for (const order of db.orders ?? []) {
    if (!order.statusHistory?.length) {
      order.statusHistory = [{
        status: order.status || 'Pending',
        previousStatus: null,
        at: order.createdAt || new Date().toISOString(),
        note: 'Sifariş qəbul edildi',
      }];
      changed = true;
    }
    for (const item of order.items ?? []) {
      if (!item.productId) {
        const resolved = resolveOrderItemProduct(db, item);
        if (resolved.productId) {
          item.productId = resolved.productId;
          item.productSlug = resolved.productSlug;
          changed = true;
        }
      }
    }
  }
  for (const user of db.users ?? []) {
    if (user.isBlocked === undefined) {
      user.isBlocked = false;
      changed = true;
    }
  }
  for (const coupon of db.coupons ?? []) {
    if (coupon.discountPercent == null && coupon.discountType === 'percentage') {
      coupon.discountPercent = coupon.value;
      changed = true;
    }
    if (coupon.applicableCategorySlug === undefined) {
      coupon.applicableCategorySlug = '';
      changed = true;
    }
  }
  if (syncAllProductRatings(db)) {
    changed = true;
  }
  if (normalizeSingleAdminRoles(db)) {
    changed = true;
  }
  if (!db.registrationOtps) {
    db.registrationOtps = [];
    changed = true;
  }
  if (cleanupExpiredOtps(db)) {
    changed = true;
  }
  if (changed) writeDb(db);
  return db;
}

function filterProducts(products, query, categories) {
  let result = [...products];
  const {
    category, categorySlug, categoryId, featured, trending, search, sort,
  } = query;

  const slug = categorySlug || category;
  if (slug) {
    const cat = categories.find((c) => c.slug === slug);
    result = result.filter(
      (p) => p.categorySlug === slug || p.categoryId === cat?.id
    );
  }
  if (categoryId) {
    result = result.filter((p) => p.categoryId === categoryId);
  }
  if (featured === 'true') {
    result = result.filter((p) => p.isFeatured);
  }
  if (trending === 'true') {
    result = result.filter((p) => p.isFeatured || p.isNew);
  }
  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brandName?.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q)
    );
  }

  if (sort === 'price') result.sort((a, b) => (a.minPrice ?? a.price) - (b.minPrice ?? b.price));
  else if (sort === 'price-desc') result.sort((a, b) => (b.minPrice ?? b.price) - (a.minPrice ?? a.price));
  else if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
  else result.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));

  return result;
}

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    const db = defaultDb();
    writeDb(db);
    return ensureSeedData(db);
  }
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  return ensureSeedData(db);
}

function writeDb(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function ok(res, data, message) {
  return res.json({ success: true, data, message });
}

function fail(res, status, message, extra) {
  return res.status(status).json({ success: false, message, ...(extra ?? {}) });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = header.slice(7);
  const db = readDb();
  req.user = db.users.find((u) => u.token === token) ?? null;
  if (req.user?.isBlocked) {
    return fail(res, 403, 'Hesabınız bloklanıb');
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return fail(res, 401, 'Giriş tələb olunur');
  next();
}

function requireAdmin(req, res, next) {
  if (!isAdminUser(req.user)) {
    return fail(res, 403, 'Admin icazəsi tələb olunur');
  }
  next();
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone ?? '',
    roles: user.roles ?? [],
    isBlocked: !!user.isBlocked,
    createdAt: user.createdAt ?? null,
    updatedAt: user.updatedAt ?? null,
  };
}

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

function orderStatusLabelAz(status) {
  const map = {
    Pending: 'Gözləyir',
    Confirmed: 'Təsdiqləndi',
    Shipped: 'Göndərildi',
    Delivered: 'Çatdırıldı',
    Cancelled: 'Ləğv edildi',
  };
  return map[status] ?? status;
}

function buildCustomerOrderNotification(order, newStatus, previousStatus) {
  const isCancelled = newStatus === 'Cancelled';
  return {
    id: crypto.randomUUID(),
    userId: order.userId,
    type: 'OrderStatus',
    title: isCancelled ? 'Sifarişiniz ləğv edildi' : 'Sifariş statusu yeniləndi',
    message: isCancelled
      ? `${order.orderNumber} nömrəli sifarişiniz ləğv edildi. Suallarınız varsa dəstək xidmətimizlə əlaqə saxlayın.`
      : `${order.orderNumber} sifarişiniz: ${orderStatusLabelAz(previousStatus)} → ${orderStatusLabelAz(newStatus)}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: newStatus,
    previousStatus,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
}

app.use(authMiddleware);

app.get('/api/health', (_req, res) => {
  ok(res, {
    ok: true,
    version: 2,
    features: ['hero-manage', 'hero-video', 'hero-upload', 'file-upload', 'settings', 'coupons-crud', 'categories-crud', 'profile', 'users-manage', 'register-otp'],
  });
});

// ─── Auth ───────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};
  const db = readDb();
  const user = db.users.find((u) => u.email === email && u.password === password);
  if (!user) return fail(res, 401, 'Email və ya şifrə səhvdir');
  if (user.isBlocked) return fail(res, 403, 'Hesabınız bloklanıb. Admin ilə əlaqə saxlayın.');

  user.token = crypto.randomUUID();
  writeDb(db);

  ok(res, {
    accessToken: user.token,
    refreshToken: crypto.randomUUID(),
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: user.roles,
  }, 'Giriş uğurlu');
});

app.post('/api/auth/register/send-otp', async (req, res) => {
  const db = readDb();
  const siteName = db.settings?.siteName ?? 'Amoria';
  const result = await requestRegistrationOtp(db, req.body, siteName);
  if (!result.ok) {
    return fail(res, result.status ?? 400, result.message, result.retryAfterSec ? { retryAfterSec: result.retryAfterSec } : undefined);
  }
  writeDb(db);
  const { devOtp, ...data } = result;
  ok(res, data, result.message);
  if (devOtp && process.env.NODE_ENV !== 'production') {
    console.log(`[register-otp] dev kod ${req.body?.email}: ${devOtp}`);
  }
});

app.post('/api/auth/register/verify-otp', (req, res) => {
  const db = readDb();
  const result = verifyRegistrationOtp(db, req.body);
  if (!result.ok) {
    writeDb(db);
    return fail(res, result.status ?? 400, result.message);
  }
  writeDb(db);
  ok(res, result.auth, 'Qeydiyyat uğurla tamamlandı');
});

app.post('/api/auth/register/resend-otp', async (req, res) => {
  const db = readDb();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const pending = (db.registrationOtps ?? []).find((e) => e.email === email);
  if (!pending) {
    return fail(res, 400, 'Aktiv OTP sorğusu tapılmadı. Qeydiyyat formunu yenidən doldurun');
  }
  const result = await requestRegistrationOtp(
    db,
    {
      firstName: pending.firstName,
      lastName: pending.lastName,
      fullName: pending.fullName,
      email: pending.email,
      password: pending.password,
    },
    db.settings?.siteName ?? 'Amoria'
  );
  if (!result.ok) {
    return fail(res, result.status ?? 400, result.message, result.retryAfterSec ? { retryAfterSec: result.retryAfterSec } : undefined);
  }
  writeDb(db);
  ok(res, { email: result.email, expiresInSec: result.expiresInSec }, result.message);
});

app.post('/api/auth/register', (req, res) => {
  fail(res, 400, 'Qeydiyyat üçün OTP təsdiqi tələb olunur');
});

// ─── Settings ───────────────────────────────────────────────────────────────
app.get('/api/settings', (_req, res) => {
  const db = readDb();
  ok(res, db.settings ?? defaultDb().settings);
});

app.put('/api/settings', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  db.settings = { ...(db.settings ?? defaultDb().settings), ...req.body };
  writeDb(db);
  ok(res, db.settings, 'Ayarlar yeniləndi');
});

// ─── Users (Admin) ──────────────────────────────────────────────────────────
app.get('/api/users', requireAuth, requireAdmin, (_req, res) => {
  const db = readDb();
  const users = [...(db.users ?? [])]
    .map(sanitizeUser)
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  ok(res, users);
});

app.patch('/api/users/:id/block', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return fail(res, 404, 'İstifadəçi tapılmadı');
  if (user.id === req.user.id) return fail(res, 400, 'Öz hesabınızı blok edə bilməzsiniz');
  if (isAdminUser(user)) return fail(res, 400, 'Admin hesabı blok edilə bilməz');
  if (user.isBlocked) return ok(res, sanitizeUser(user), 'İstifadəçi artıq bloklanıb');

  user.isBlocked = true;
  user.token = null;
  user.updatedAt = new Date().toISOString();
  writeDb(db);
  ok(res, sanitizeUser(user), 'İstifadəçi bloklandı');
});

app.patch('/api/users/:id/unblock', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return fail(res, 404, 'İstifadəçi tapılmadı');
  if (!user.isBlocked) return ok(res, sanitizeUser(user), 'İstifadəçi artıq aktivdir');

  user.isBlocked = false;
  user.updatedAt = new Date().toISOString();
  writeDb(db);
  ok(res, sanitizeUser(user), 'İstifadəçi blokdan çıxarıldı');
});

app.delete('/api/users/:id', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const idx = db.users.findIndex((u) => u.id === req.params.id);
  if (idx < 0) return fail(res, 404, 'İstifadəçi tapılmadı');

  const user = db.users[idx];
  if (user.id === req.user.id) return fail(res, 400, 'Öz hesabınızı silə bilməzsiniz');
  if (isAdminUser(user)) return fail(res, 400, 'Admin hesabı silinə bilməz');

  db.wishlistFavorites = (db.wishlistFavorites ?? []).filter((f) => f.userId !== user.id);
  db.users.splice(idx, 1);
  writeDb(db);
  ok(res, { deleted: true, id: req.params.id }, 'İstifadəçi silindi');
});

// ─── User Profile ───────────────────────────────────────────────────────────
app.patch('/api/users/password', requireAuth, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return fail(res, 404, 'İstifadəçi tapılmadı');

  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    return fail(res, 400, 'Cari və yeni şifrə vacibdir');
  }
  if (String(newPassword).length < 8) {
    return fail(res, 400, 'Yeni şifrə ən azı 8 simvol olmalıdır');
  }
  if (user.password !== currentPassword) {
    return fail(res, 400, 'Cari şifrə səhvdir');
  }
  user.password = newPassword;
  user.updatedAt = new Date().toISOString();
  writeDb(db);
  ok(res, null, 'Şifrə yeniləndi');
});

app.get('/api/users/me', requireAuth, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return fail(res, 404, 'İstifadəçi tapılmadı');
  ok(res, {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone ?? '',
    roles: user.roles,
  });
});

app.put('/api/users/profile', requireAuth, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return fail(res, 404, 'İstifadəçi tapılmadı');

  const { fullName, email, phone } = req.body ?? {};
  if (email && email !== user.email) {
    if (db.users.some((u) => u.email === email && u.id !== user.id)) {
      return fail(res, 400, 'Bu email artıq istifadə olunur');
    }
    user.email = email;
  }
  if (fullName !== undefined) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  user.updatedAt = new Date().toISOString();
  writeDb(db);

  ok(res, {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone ?? '',
    roles: user.roles,
    accessToken: user.token,
  }, 'Profil yeniləndi');
});

// ─── Products ───────────────────────────────────────────────────────────────
app.get('/api/products', (req, res) => {
  const db = readDb();
  const filtered = filterProducts(db.products, req.query, db.categories);
  const totalCount = filtered.length;
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
  const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit, 10)) : totalCount;
  const items = filtered.slice(offset, offset + limit).map((p) => enrichProduct(db, p));
  ok(res, { items, totalCount, offset, limit });
});

app.patch('/api/products/:id/stock', requireAuth, requireAdmin, (req, res) => {
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

app.get('/api/products/:slug', (req, res) => {
  const db = readDb();
  const product = db.products.find((p) => p.slug === req.params.slug);
  if (!product) return fail(res, 404, 'Məhsul tapılmadı');
  ok(res, enrichProduct(db, product));
});

app.post('/api/products', requireAuth, requireAdmin, (req, res) => {
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

app.delete('/api/products/:id', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  db.products = db.products.filter((p) => p.id !== req.params.id);
  writeDb(db);
  ok(res, null);
});

// ─── Categories & Brands ────────────────────────────────────────────────────
app.get('/api/categories', (_req, res) => {
  const db = readDb();
  const data = db.categories.map((cat) => ({
    ...cat,
    productCount: db.products.filter(
      (p) => p.categoryId === cat.id || p.categorySlug === cat.slug
    ).length,
  }));
  ok(res, data);
});

app.get('/api/categories/:slug', (req, res) => {
  const db = readDb();
  const category = db.categories.find((c) => c.slug === req.params.slug);
  if (!category) return fail(res, 404, 'Kateqoriya tapılmadı');
  const productCount = db.products.filter(
    (p) => p.categoryId === category.id || p.categorySlug === category.slug
  ).length;
  ok(res, { ...category, productCount });
});
app.post('/api/categories', requireAuth, requireAdmin, (req, res) => {
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

app.put('/api/categories/:id', requireAuth, requireAdmin, (req, res) => {
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

app.delete('/api/categories/:id', requireAuth, requireAdmin, (req, res) => {
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

app.get('/api/brands', (_req, res) => ok(res, readDb().brands));

app.post('/api/brands', requireAuth, requireAdmin, (req, res) => {
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

app.delete('/api/brands/:id', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const idx = db.brands.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return fail(res, 404, 'Brend tapılmadı');
  const inUse = db.products.some((p) => p.brandId === req.params.id);
  if (inUse) return fail(res, 400, 'Bu brend məhsullarda istifadə olunur');
  db.brands.splice(idx, 1);
  writeDb(db);
  ok(res, null, 'Brend silindi');
});

// ─── Hero / Banners ───────────────────────────────────────────────────────────
app.get('/api/hero', (_req, res) => {
  const db = readDb();
  const heroes = (db.heroes ?? [])
    .filter((h) => h.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  ok(res, heroes);
});

app.get('/api/hero/active', (_req, res) => {
  const db = readDb();
  const hero = (db.heroes ?? [])
    .filter((h) => h.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0] ?? null;
  ok(res, hero);
});

app.get('/api/hero/manage', requireAuth, requireAdmin, (_req, res) => {
  const db = readDb();
  if (!db.heroes?.length) {
    db.heroes = defaultDb().heroes;
    writeDb(db);
  }
  const hero = (db.heroes ?? []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0] ?? null;
  if (!hero) return fail(res, 404, 'Ana səhifə materialı tapılmadı');
  ok(res, hero);
});

app.put('/api/hero/:id', requireAuth, requireAdmin, (req, res) => {
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
  ok(res, hero, 'Ana ekran banneri yeniləndi');
});

function deleteUploadedFile(url) {
  if (!url?.startsWith('/uploads/')) return;
  const relative = url.replace(/^\/uploads\//, '');
  const filePath = path.join(UPLOADS_ROOT, relative);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

app.delete('/api/hero/:id/video', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const hero = db.heroes?.find((h) => h.id === req.params.id);
  if (!hero) return fail(res, 404, 'Ana səhifə materialı tapılmadı');
  deleteUploadedFile(hero.videoUrl);
  hero.videoUrl = '/videos/hero.mp4';
  hero.updatedAt = new Date().toISOString();
  writeDb(db);
  ok(res, hero, 'Video silindi və standart videoya qayıdıldı');
});

app.delete('/api/hero/:id/poster', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const hero = db.heroes?.find((h) => h.id === req.params.id);
  if (!hero) return fail(res, 404, 'Ana səhifə materialı tapılmadı');
  deleteUploadedFile(hero.posterUrl);
  hero.posterUrl = '';
  hero.updatedAt = new Date().toISOString();
  writeDb(db);
  ok(res, hero, 'Poster silindi');
});

app.post('/api/files/upload', requireAuth, requireAdmin, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return fail(res, 400, err.message || 'Fayl yüklənmədi');
    if (!req.file) return fail(res, 400, 'Fayl seçilməyib');
    const folder = sanitizeFolder(req.query.folder);
    const url = `/uploads/${folder}/${req.file.filename}`;
    ok(res, url, 'Fayl yükləndi');
  });
});

// ─── Coupons ────────────────────────────────────────────────────────────────
app.get('/api/coupons', requireAuth, requireAdmin, (req, res) => ok(res, readDb().coupons));

app.post('/api/coupons', requireAuth, requireAdmin, (req, res) => {
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

app.delete('/api/coupons/:id', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const before = db.coupons.length;
  db.coupons = db.coupons.filter((c) => c.id !== req.params.id);
  if (db.coupons.length === before) return fail(res, 404, 'Promo kod tapılmadı');
  writeDb(db);
  ok(res, null, 'Promo kod silindi');
});

app.post('/api/coupons/validate', (req, res) => {
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

// ─── Orders ─────────────────────────────────────────────────────────────────
app.get('/api/orders', requireAuth, (req, res) => {
  const db = readDb();
  const isAdmin = isAdminUser(req.user);
  const orders = isAdmin
    ? db.orders
    : db.orders.filter((o) => o.userId === req.user.id);
  ok(res, orders);
});

app.get('/api/orders/my', requireAuth, (req, res) => {
  const db = readDb();
  ok(res, db.orders.filter((o) => o.userId === req.user.id));
});

app.post('/api/orders', requireAuth, (req, res) => {
  const db = readDb();
  const {
    items, shippingFullName, shippingPhone, shippingAddress,
    shippingCity, shippingRegion, couponCode, notes, deliveryType,
  } = req.body ?? {};

  if (!items?.length) return fail(res, 400, 'Səbət boşdur');
  if (!shippingFullName?.trim() || !shippingPhone?.trim() || !shippingAddress?.trim()) {
    return fail(res, 400, 'Çatdırılma məlumatları tam doldurulmalıdır');
  }

  const DELIVERY_FEES = { express: 5, standard: 2 };
  const resolvedDelivery = deliveryType === 'standard' ? 'standard' : 'express';
  const shippingFee = DELIVERY_FEES[resolvedDelivery];

  let subTotal = 0;
  const orderItems = items.map((item) => {
    const total = item.unitPrice * item.quantity;
    subTotal += total;
    const resolved = resolveOrderItemProduct(db, item);
    return {
      ...item,
      productId: item.productId ?? resolved.productId,
      productSlug: item.productSlug ?? resolved.productSlug,
      categorySlug: item.categorySlug ?? '',
      totalPrice: total,
    };
  });

  let discountAmount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = db.coupons.find((c) => c.code === couponCode.toUpperCase() && c.isActive);
    const now = new Date();
    if (coupon && new Date(coupon.startDate) <= now && new Date(coupon.endDate) >= now) {
      if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
        const calc = computeCouponDiscount(coupon, orderItems, subTotal);
        if (calc.valid) {
          discountAmount = calc.discountAmount;
          coupon.usedCount += 1;
          appliedCoupon = coupon.code;
        }
      }
    }
  }

  const totalAmount = Math.max(0, subTotal + shippingFee - discountAmount);

  for (const item of orderItems) {
    if (!item.productId) continue;
    const product = db.products.find((p) => p.id === item.productId);
    if (!product) continue;
    const available = getProductStock(product);
    if (available < item.quantity) {
      return fail(
        res,
        400,
        `${item.productName || product.name} üçün kifayət qədər stok yoxdur (qalan: ${available})`
      );
    }
  }

  const order = {
    id: crypto.randomUUID(),
    orderNumber: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: req.user.id,
    userEmail: req.user.email,
    status: 'Pending',
    paymentStatus: 'OnDelivery',
    paymentMethod: 'cash_on_delivery',
    subTotal,
    shippingFee,
    discountAmount,
    totalAmount,
    couponCode: appliedCoupon,
    shippingFullName: shippingFullName.trim(),
    shippingPhone: shippingPhone.trim(),
    shippingAddress: shippingAddress.trim(),
    shippingCity: shippingCity?.trim() || 'Bakı',
    shippingRegion: shippingRegion?.trim() || '',
    deliveryType: resolvedDelivery,
    notes,
    items: orderItems,
    createdAt: new Date().toISOString(),
    statusHistory: [{
      status: 'Pending',
      previousStatus: null,
      at: new Date().toISOString(),
      note: 'Sifariş qəbul edildi',
    }],
  };

  db.orders.unshift(order);

  for (const item of orderItems) {
    if (!item.productId) continue;
    const product = db.products.find((p) => p.id === item.productId);
    if (!product) continue;
    setProductStock(product, getProductStock(product) - item.quantity);
  }

  db.notifications.unshift({
    id: crypto.randomUUID(),
    type: 'NewOrder',
    title: 'Yeni sifariş',
    message: `#${order.orderNumber} — ${shippingFullName} — ${shippingAddress.trim()}, ${shippingCity?.trim() || 'Bakı'} — ${resolvedDelivery === 'express' ? 'Ekspress' : 'Sadə'} çatdırılma — ₼ ${totalAmount.toFixed(2)}${appliedCoupon ? ` (${appliedCoupon} -${discountAmount.toFixed(2)}₼)` : ''}`,
    referenceId: order.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  writeDb(db);
  ok(res, order, 'Sifariş yaradıldı');
});

app.patch('/api/orders/:id/status', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) return fail(res, 404, 'Sifariş tapılmadı');

  const newStatus = req.body?.status;
  if (!ORDER_STATUSES.includes(newStatus)) {
    return fail(res, 400, 'Etibarsız sifariş statusu');
  }

  const previousStatus = order.status;
  if (previousStatus === newStatus) {
    return ok(res, order, 'Status eyni qaldı');
  }

  const now = new Date().toISOString();
  order.status = newStatus;
  order.updatedAt = now;
  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({
    status: newStatus,
    previousStatus,
    at: now,
    note: newStatus === 'Cancelled' ? 'Sifariş ləğv edildi' : `Status: ${orderStatusLabelAz(newStatus)}`,
  });

  if (!db.customerNotifications) db.customerNotifications = [];
  db.customerNotifications.unshift(
    buildCustomerOrderNotification(order, newStatus, previousStatus)
  );

  writeDb(db);
  const msg = newStatus === 'Cancelled'
    ? 'Sifariş ləğv edildi — müştəriyə bildiriş göndərildi'
    : 'Status yeniləndi — müştəriyə bildiriş göndərildi';
  ok(res, order, msg);
});

// ─── Müştəri bildirişləri ───────────────────────────────────────────────────
app.get('/api/my-notifications', requireAuth, (req, res) => {
  const db = readDb();
  const items = (db.customerNotifications ?? [])
    .filter((n) => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  ok(res, items);
});

app.get('/api/my-notifications/unread-count', requireAuth, (req, res) => {
  const db = readDb();
  const count = (db.customerNotifications ?? []).filter(
    (n) => n.userId === req.user.id && !n.isRead
  ).length;
  ok(res, { count });
});

app.patch('/api/my-notifications/:id/read', requireAuth, (req, res) => {
  const db = readDb();
  const n = (db.customerNotifications ?? []).find(
    (x) => x.id === req.params.id && x.userId === req.user.id
  );
  if (!n) return fail(res, 404, 'Bildiriş tapılmadı');
  n.isRead = true;
  writeDb(db);
  ok(res, n);
});

app.patch('/api/my-notifications/read-all', requireAuth, (_req, res) => {
  const db = readDb();
  for (const n of db.customerNotifications ?? []) {
    if (n.userId === _req.user.id) n.isRead = true;
  }
  writeDb(db);
  ok(res, { ok: true });
});

// ─── Wishlist / Sevimlilər ────────────────────────────────────────────────────
app.get('/api/wishlist/stats', requireAuth, requireAdmin, (_req, res) => {
  const db = readDb();
  ok(res, aggregateWishlistStats(db));
});

app.get('/api/wishlist/my', requireAuth, (req, res) => {
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

app.post('/api/wishlist/toggle', requireAuth, (req, res) => {
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

app.delete('/api/wishlist/:productId', requireAuth, (req, res) => {
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

app.post('/api/wishlist/sync', requireAuth, (req, res) => {
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

// ─── Notifications ────────────────────────────────────────────────────────────
app.get('/api/notifications', requireAuth, requireAdmin, (req, res) => {
  ok(res, readDb().notifications);
});

app.get('/api/notifications/unread-count', requireAuth, requireAdmin, (req, res) => {
  const count = readDb().notifications.filter((n) => !n.isRead).length;
  ok(res, { count });
});

app.patch('/api/notifications/:id/read', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const n = db.notifications.find((x) => x.id === req.params.id);
  if (n) n.isRead = true;
  writeDb(db);
  ok(res, null);
});

app.patch('/api/notifications/read-all', requireAuth, requireAdmin, (_req, res) => {
  const db = readDb();
  db.notifications.forEach((n) => { n.isRead = true; });
  writeDb(db);
  ok(res, null);
});

// ─── Reviews ────────────────────────────────────────────────────────────────
app.get('/api/products/:slug/reviews', (req, res) => {
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

app.get('/api/products/:slug/review-eligibility', requireAuth, (req, res) => {
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

app.get('/api/reviews/my-eligible', requireAuth, (req, res) => {
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

app.post('/api/reviews', requireAuth, (req, res) => {
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

app.get('/api/reviews', requireAuth, requireAdmin, (_req, res) => {
  const db = readDb();
  const reviews = [...(db.reviews ?? [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  ok(res, reviews);
});

app.delete('/api/reviews/:id', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const idx = (db.reviews ?? []).findIndex((r) => r.id === req.params.id);
  if (idx === -1) return fail(res, 404, 'Rəy tapılmadı');

  const [removed] = db.reviews.splice(idx, 1);
  recalcProductRating(db, removed.productId);
  writeDb(db);
  ok(res, null, 'Rəy silindi');
});

// ─── Dashboard & Reports ────────────────────────────────────────────────────
function revenueOrders(orders) {
  return orders.filter((o) => o.status !== 'Cancelled');
}

app.get('/api/reports/summary', requireAuth, requireAdmin, (_req, res) => {
  const db = readDb();
  const orders = revenueOrders(db.orders ?? []);
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);

  const dailyChart = [];
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const revenue = orders
      .filter((o) => o.createdAt.startsWith(key))
      .reduce((s, o) => s + o.totalAmount, 0);
    dailyChart.push({ date: key, revenue: Math.round(revenue * 100) / 100 });
  }

  ok(res, {
    dailyRevenue: orders
      .filter((o) => o.createdAt.startsWith(today))
      .reduce((s, o) => s + o.totalAmount, 0),
    monthlyRevenue: orders
      .filter((o) => o.createdAt.startsWith(month))
      .reduce((s, o) => s + o.totalAmount, 0),
    totalSales: orders.reduce((s, o) => s + o.totalAmount, 0),
    dailyChart,
  });
});

app.get('/api/dashboard/stats', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const orders = revenueOrders(db.orders ?? []);

  ok(res, {
    totalSales: orders.reduce((s, o) => s + o.totalAmount, 0),
    dailyRevenue: orders.filter((o) => o.createdAt.startsWith(today)).reduce((s, o) => s + o.totalAmount, 0),
    monthlyRevenue: orders.filter((o) => o.createdAt.startsWith(month)).reduce((s, o) => s + o.totalAmount, 0),
    totalOrders: db.orders.length,
    pendingOrders: db.orders.filter((o) => o.status === 'Pending').length,
    unreadNotifications: db.notifications.filter((n) => !n.isRead).length,
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Parfumerya API → port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} artıq məşğuldur (köhnə API prosesi işləyir).`);
    console.error('Həll: frontend qovluğunda `npm run stop` işlədin, sonra yenidən `npm run dev`.\n');
    process.exit(1);
  }
  throw err;
});
