import { apiFetch } from './api';
import { resolveMediaUrl } from '../utils/media';

export interface WishlistStatItem {
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string;
  categoryName: string;
  minPrice: number;
  favoriteCount: number;
  lastFavoritedAt: string;
}

export interface WishlistStats {
  summary: {
    totalFavorites: number;
    uniqueProducts: number;
    uniqueUsers: number;
  };
  items: WishlistStatItem[];
}

export async function getWishlistStats(): Promise<WishlistStats> {
  const stats = await apiFetch<WishlistStats>('/wishlist/stats');
  return {
    ...stats,
    items: (stats.items ?? []).map((item) => ({
      ...item,
      imageUrl: resolveMediaUrl(item.imageUrl),
    })),
  };
}
