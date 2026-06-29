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

export async function sendRegisterOtp(
  firstName: string,
  lastName: string,
  email: string,
  password: string
): Promise<{ email: string; expiresInSec: number }> {
  return apiFetch<{ email: string; expiresInSec: number }>('/auth/register/send-otp', {
    method: 'POST',
    body: JSON.stringify({ firstName, lastName, email, password }),
  });
}

export async function resendRegisterOtp(email: string): Promise<{ email: string; expiresInSec: number }> {
  return apiFetch<{ email: string; expiresInSec: number }>('/auth/register/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/** OTP axınından sonra avtomatik daxil olur */
export async function verifyRegisterOtp(email: string, otp: string): Promise<User> {
  const auth = await apiFetch<AuthResponse>('/auth/register/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
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
