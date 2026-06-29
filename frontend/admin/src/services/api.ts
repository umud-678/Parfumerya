import { API_URL } from '../config/env';

export function getAuthToken(): string | null {
  return localStorage.getItem('admin_token');
}

export function isApiAvailable(): boolean {
  return !!getAuthToken();
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message ?? 'Server xətası');
  }
  return payload.data as T;
}
