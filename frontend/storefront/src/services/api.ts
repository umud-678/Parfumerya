import { API_URL } from '../config/env';

const DEFAULT_TIMEOUT_MS = 30_000;

export async function checkApiHealth(timeoutMs = 12_000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(`${API_URL}/health`, { signal: controller.signal });
    window.clearTimeout(timer);
    if (!response.ok) return false;
    const payload = await response.json().catch(() => ({}));
    return payload.success !== false;
  } catch {
    return false;
  }
}

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

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal,
    });
  } catch (err) {
    window.clearTimeout(timer);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('API cavab vermədi — server yuxarı deyil və ya yavaşdır');
    }
    throw err;
  }
  window.clearTimeout(timer);
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
