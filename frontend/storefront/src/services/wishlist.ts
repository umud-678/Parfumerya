import { apiFetch } from './api';
import { setWishlist } from '../store/wishlistSlice';
import type { AppDispatch } from '../store/store';
import type { Product } from '../types';

export interface WishlistToggleResult {
  favorited: boolean;
  message?: string;
}

export async function toggleWishlistApi(product: Product): Promise<WishlistToggleResult> {
  return apiFetch<WishlistToggleResult>('/wishlist/toggle', {
    method: 'POST',
    body: JSON.stringify({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: product.primaryImageUrl,
      categoryName: product.categoryName,
      minPrice: product.minPrice,
      brandName: product.brandName,
      categoryId: product.categoryId,
      categorySlug: product.categorySlug,
    }),
  });
}

export async function removeWishlistApi(productId: string): Promise<void> {
  await apiFetch(`/wishlist/${productId}`, { method: 'DELETE' });
}

export async function getMyWishlist(): Promise<Product[]> {
  return apiFetch<Product[]>('/wishlist/my');
}

export async function syncWishlistToServer(localItems: Product[]): Promise<Product[]> {
  return apiFetch<Product[]>('/wishlist/sync', {
    method: 'POST',
    body: JSON.stringify({ products: localItems }),
  });
}

export async function loadWishlistForUser(localItems: Product[]): Promise<Product[]> {
  try {
    const merged = await syncWishlistToServer(localItems);
    return merged;
  } catch {
    try {
      return await getMyWishlist();
    } catch {
      return localItems;
    }
  }
}

export async function syncWishlistAfterAuth(dispatch: AppDispatch, localItems: Product[]): Promise<void> {
  try {
    const merged = await loadWishlistForUser(localItems);
    dispatch(setWishlist(merged));
  } catch {
    /* keep local state */
  }
}
