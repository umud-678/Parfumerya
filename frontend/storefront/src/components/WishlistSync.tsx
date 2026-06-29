import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { store } from '../store/store';
import { setWishlist } from '../store/wishlistSlice';
import { loadWishlistForUser } from '../services/wishlist';

export default function WishlistSync() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const syncedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      syncedForUser.current = null;
      return;
    }
    if (syncedForUser.current === user.userId) return;
    syncedForUser.current = user.userId;

    const localItems = store.getState().wishlist.items;
    loadWishlistForUser(localItems)
      .then((merged) => dispatch(setWishlist(merged)))
      .catch(() => {});
  }, [user?.userId, dispatch]);

  return null;
}
