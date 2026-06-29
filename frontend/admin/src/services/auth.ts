import { API_URL } from '../config/env';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
}

export async function loginAdmin(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? 'Giriş uğursuz oldu');
  }

  const auth = payload.data as AuthResponse;
  const isAdmin = auth.roles.includes('Admin');

  if (!isAdmin) {
    throw new Error('Bu hesabın admin panelinə giriş icazəsi yoxdur');
  }

  return auth;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const token = localStorage.getItem('admin_token');
  const response = await fetch(`${API_URL}/users/password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? 'Şifrə yenilənmədi');
  }
}
