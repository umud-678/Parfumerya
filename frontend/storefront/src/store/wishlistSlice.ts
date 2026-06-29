import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '../types';

interface WishlistState {
  items: Product[];
}

const loadWishlist = (): Product[] => {
  try {
    const saved = localStorage.getItem('parfumerya_wishlist');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const initialState: WishlistState = { items: loadWishlist() };

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlist: (state, action: PayloadAction<Product>) => {
      const index = state.items.findIndex((p) => p.id === action.payload.id);
      if (index >= 0) {
        state.items.splice(index, 1);
      } else {
        state.items.push(action.payload);
      }
      localStorage.setItem('parfumerya_wishlist', JSON.stringify(state.items));
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
      localStorage.setItem('parfumerya_wishlist', JSON.stringify(state.items));
    },
    setWishlist: (state, action: PayloadAction<Product[]>) => {
      state.items = action.payload;
      localStorage.setItem('parfumerya_wishlist', JSON.stringify(state.items));
    },
  },
});

export const { toggleWishlist, removeFromWishlist, setWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
