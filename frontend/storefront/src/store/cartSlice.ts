import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CartItem } from '../types';

interface CartState {
  items: CartItem[];
}

const loadCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem('parfumerya_cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const initialState: CartState = { items: loadCart() };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find(
        (i) => i.variantId === action.payload.variantId
      );
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      localStorage.setItem('parfumerya_cart', JSON.stringify(state.items));
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ variantId: string; quantity: number }>
    ) => {
      const item = state.items.find((i) => i.variantId === action.payload.variantId);
      if (item) {
        item.quantity = Math.max(1, action.payload.quantity);
      }
      localStorage.setItem('parfumerya_cart', JSON.stringify(state.items));
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.variantId !== action.payload);
      localStorage.setItem('parfumerya_cart', JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem('parfumerya_cart');
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
