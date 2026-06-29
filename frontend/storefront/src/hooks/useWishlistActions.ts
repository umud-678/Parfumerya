import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleWishlist, removeFromWishlist } from '../store/wishlistSlice';
import { toggleWishlistApi, removeWishlistApi } from '../services/wishlist';
import type { Product } from '../types';

export function useWishlistActions() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const toggleFavorite = useCallback(
    async (product: Product) => {
      if (!user) return false;
      dispatch(toggleWishlist(product));
      try {
        await toggleWishlistApi(product);
      } catch {
        dispatch(toggleWishlist(product));
      }
      return true;
    },
    [dispatch, user]
  );

  const removeFavorite = useCallback(
    async (productId: string) => {
      dispatch(removeFromWishlist(productId));
      if (!user) return;
      try {
        await removeWishlistApi(productId);
      } catch {
        /* local state already updated */
      }
    },
    [dispatch, user]
  );

  return { toggleFavorite, removeFavorite };
}
