import { apiFetch } from './api';

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
  return apiFetch<WishlistStats>('/wishlist/stats');
}
