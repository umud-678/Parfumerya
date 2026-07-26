import crypto from 'crypto';
import { resolveUploadUrl } from '../utils/media.js';

export function getProductFavoriteCount(db, productId) {
  return (db.wishlistFavorites ?? []).filter((f) => f.productId === productId).length;
}

const FAVORITE_NOTIFY_MILESTONES = [1, 5, 10, 20, 50, 100];

export function maybeNotifyFavoriteMilestone(db, productId, productName) {
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

export function aggregateWishlistStats(db) {
  const favorites = db.wishlistFavorites ?? [];
  const byProduct = new Map();

  for (const entry of favorites) {
    const key = entry.productId;
    if (!byProduct.has(key)) {
      byProduct.set(key, {
        productId: entry.productId,
        productName: entry.productName,
        productSlug: entry.productSlug,
        imageUrl: resolveUploadUrl(entry.imageUrl),
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

export function productSnapshot(db, body) {
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
