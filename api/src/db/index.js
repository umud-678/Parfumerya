import fs from 'fs';
import path from 'path';
import { DB_PATH, UPLOADS_ROOT, ALLOWED_UPLOAD_FOLDERS, PORT } from '../config.js';
import { defaultDb, seedProducts } from './defaults.js';
import { cleanupExpiredOtps } from '../lib/registrationOtp.js';
import { cleanupExpiredPasswordResetOtps } from '../lib/passwordResetOtp.js';
import { syncAllProductRatings } from '../helpers/products.js';
import { resolveOrderItemProduct } from '../helpers/orders.js';
import { normalizeSingleAdminRoles } from '../helpers/users.js';
import {
  mongoEnabled,
  connectMongo,
  loadStateFromMongo,
  getState,
  setState,
  primeSnapshots,
  persistNow,
  persistState,
} from './mongoStore.js';

export function ensureSeedData(db) {
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
  if (!db.meta) {
    db.meta = {};
    changed = true;
  }
  // Demo məhsullar yalnız ilk quraşdırmada bir dəfə yaradılır —
  // admin bütün məhsulları silsə, geri qayıtmır
  if (!db.products?.length) {
    if (!db.meta.demoProductsSeeded) {
      db.products = seedProducts();
      db.meta.demoProductsSeeded = true;
      changed = true;
    }
  } else if (!db.meta.demoProductsSeeded) {
    db.meta.demoProductsSeeded = true;
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
  // Zəmanət: bazada həmişə ən azı bir admin hesabı olsun
  // (Admin girişi: umud9832@gmail.com / 12345678)
  if (!db.users) db.users = [];
  if (!db.users.some((u) => u.roles?.includes('Admin'))) {
    const seedAdmin = defaultDb().users[0];
    const existing = db.users.find((u) => u.email === seedAdmin.email);
    if (existing) {
      existing.roles = ['Admin'];
      existing.isBlocked = false;
    } else {
      db.users.unshift(seedAdmin);
    }
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
  if (!db.passwordResetOtps) {
    db.passwordResetOtps = [];
    changed = true;
  }
  if (cleanupExpiredPasswordResetOtps(db)) {
    changed = true;
  }
  if (changed) writeDb(db);
  return db;
}

export function readDb() {
  if (mongoEnabled()) {
    // Fayl rejimindəki semantikanı saxlayırıq: hər oxunuş ayrı kopya qaytarır,
    // dəyişikliklər yalnız writeDb ilə yekunlaşır
    const snap = structuredClone(getState());
    ensureSeedData(snap);
    return getState() === snap ? structuredClone(snap) : snap;
  }
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.warn(`[db] ${DB_PATH} tapılmadı — defaultDb yaradılır`);
      const db = defaultDb();
      writeDb(db);
      return ensureSeedData(db);
    }
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    return ensureSeedData(db);
  } catch (err) {
    console.error('[db] oxuma xətası, defaultDb bərpa edilir:', err);
    const db = defaultDb();
    try {
      writeDb(db);
    } catch (writeErr) {
      console.error('[db] yazma xətası:', writeErr);
    }
    return ensureSeedData(db);
  }
}

export function writeDb(db) {
  if (mongoEnabled()) {
    persistState(db);
    return;
  }
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function bootRuntime() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
  for (const folder of ALLOWED_UPLOAD_FOLDERS) {
    fs.mkdirSync(path.join(UPLOADS_ROOT, folder), { recursive: true });
  }

  const dbExists = fs.existsSync(DB_PATH);
  console.log('[boot] Parfumerya API başladılır');
  console.log(`[boot] NODE_ENV=${process.env.NODE_ENV ?? 'development'} PORT=${PORT}`);
  console.log(`[boot] cwd=${process.cwd()}`);
  console.log(`[boot] storage=${mongoEnabled() ? 'mongodb' : `file (${DB_PATH} exists=${dbExists})`}`);
  console.log(`[boot] uploads=${UPLOADS_ROOT}`);
}

function buildInitialSeed() {
  if (fs.existsSync(DB_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch (err) {
      console.warn('[boot] mövcud db.json oxuna bilmədi, defaultDb istifadə olunur:', err.message);
    }
  }
  return defaultDb();
}

export async function initStorage() {
  if (!mongoEnabled()) {
    readDb();
    console.log('[boot] db OK (fayl rejimi — MONGODB_URI təyin edilməyib)');
    return;
  }

  const dbName = await connectMongo();
  const loaded = await loadStateFromMongo();

  if (loaded) {
    // Mongo-da olmayan açarlar üçün boş default-lar əlavə edirik
    setState({ ...defaultDb(), ...loaded });
    primeSnapshots(loaded);
    console.log(`[boot] MongoDB qoşuldu → "${dbName}" (mövcud məlumat yükləndi)`);
  } else {
    const seed = buildInitialSeed();
    await persistNow(seed);
    console.log(`[boot] MongoDB qoşuldu → "${dbName}" (ilk dəfə — db.json/default məlumat köçürüldü)`);
  }

  // Normalizasiya + seed yoxlamaları (dəyişiklik olsa Mongo-ya yazılacaq)
  readDb();
  console.log('[boot] db OK (mongodb)');
}
