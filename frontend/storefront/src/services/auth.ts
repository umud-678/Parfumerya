import { apiFetch, getToken, setToken } from './api';
import type { User } from '../types';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  roles: string[];
}

export interface ProfileUpdateInput {
  fullName: string;
  email: string;
  phone?: string;
}

export async function login(email: string, password: string): Promise<User> {
  const auth = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(auth.accessToken);
  return {
    userId: auth.userId,
    email: auth.email,
    fullName: auth.fullName,
    phone: auth.phone ?? '',
    roles: auth.roles,
    accessToken: auth.accessToken,
  };
}

export async function register(fullName: string, email: string, password: string): Promise<User> {
  const auth = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password }),
  });
  setToken(auth.accessToken);
  return {
    userId: auth.userId,
    email: auth.email,
    fullName: auth.fullName,
    phone: auth.phone ?? '',
    roles: auth.roles,
    accessToken: auth.accessToken,
  };
}

export async function getMyProfile(): Promise<Omit<User, 'accessToken'>> {
  return apiFetch<Omit<User, 'accessToken'>>('/users/me');
}

export async function updateProfile(input: ProfileUpdateInput): Promise<User> {
  const updated = await apiFetch<User & { accessToken?: string; roles?: string[] }>('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  const token = updated.accessToken ?? getToken() ?? '';
  if (token) setToken(token);
  return {
    userId: updated.userId,
    email: updated.email,
    fullName: updated.fullName,
    phone: updated.phone ?? '',
    roles: updated.roles ?? [],
    accessToken: token,
  };
}

export function logout() {
  setToken(null);
}
