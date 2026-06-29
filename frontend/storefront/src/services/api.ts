import { API_URL } from '../config/env';

function readStoredUser(): { accessToken?: string } | null {
  try {
    const saved = localStorage.getItem('parfumerya_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  const direct = localStorage.getItem('parfumerya_token');
  if (direct) return direct;

  const user = readStoredUser();
  if (user?.accessToken) {
    localStorage.setItem('parfumerya_token', user.accessToken);
    return user.accessToken;
  }
  return null;
}

export function syncAuthToken(accessToken?: string | null) {
  if (accessToken) setToken(accessToken);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('parfumerya_token', token);
  else localStorage.removeItem('parfumerya_token');
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    const message = payload.message ?? 'Xəta baş verdi';
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return payload.data as T;
}

export { API_URL };
