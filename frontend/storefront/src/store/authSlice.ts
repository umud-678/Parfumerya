import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';

interface AuthState {
  user: User | null;
}

const loadUser = (): User | null => {
  try {
    const saved = localStorage.getItem('parfumerya_user');
    if (!saved) return null;
    const user = JSON.parse(saved) as User;
    if (!user?.accessToken) {
      localStorage.removeItem('parfumerya_user');
      localStorage.removeItem('parfumerya_token');
      return null;
    }
    localStorage.setItem('parfumerya_token', user.accessToken);
    return user;
  } catch {
    return null;
  }
};

const initialState: AuthState = { user: loadUser() };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem('parfumerya_user', JSON.stringify(action.payload));
        localStorage.setItem('parfumerya_token', action.payload.accessToken);
      } else {
        localStorage.removeItem('parfumerya_user');
        localStorage.removeItem('parfumerya_token');
      }
    },
    logout: (state) => {
      state.user = null;
      localStorage.removeItem('parfumerya_user');
      localStorage.removeItem('parfumerya_token');
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('parfumerya_user', JSON.stringify(state.user));
      if (state.user.accessToken) {
        localStorage.setItem('parfumerya_token', state.user.accessToken);
      }
    },
  },
});

export const { setUser, logout, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;
