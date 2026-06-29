import { apiFetch, getAuthToken } from './api';
import { uploadImage } from './catalog';
import { API_URL, STOREFRONT_URL } from '../config/env';
const DEFAULT_VIDEO = '/videos/hero.mp4';

export interface HeroSlide {
  id: string;
  title: string;
  titleHighlight: string;
  titleEnd?: string;
  subtitle: string;
  imageUrl: string;
  videoUrl?: string;
  posterUrl?: string;
  secondaryImageUrl?: string;
  ctaText: string;
  ctaLink: string;
  stat1Value?: string;
  stat1Label?: string;
  stat2Value?: string;
  stat2Label?: string;
  isActive?: boolean;
  updatedAt?: string;
}

export type UpdateHeroInput = Partial<
  Pick<
    HeroSlide,
    | 'title'
    | 'titleHighlight'
    | 'titleEnd'
    | 'subtitle'
    | 'imageUrl'
    | 'videoUrl'
    | 'posterUrl'
    | 'secondaryImageUrl'
    | 'ctaText'
    | 'ctaLink'
    | 'stat1Value'
    | 'stat1Label'
    | 'stat2Value'
    | 'stat2Label'
  >
>;

export interface HeroApiStatus {
  ready: boolean;
  message: string;
  version?: number;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<{ ok: boolean; data?: T; message?: string }> {
  try {
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      return { ok: false, message: payload.message ?? `Server cavabı: ${response.status}` };
    }
    return { ok: true, data: payload.data as T, message: payload.message };
  } catch {
    return { ok: false, message: 'Serverə qoşulmaq mümkün olmadı' };
  }
}

export async function getHeroApiStatus(): Promise<HeroApiStatus> {
  const health = await fetchJson<{ ok: boolean; version?: number; features?: string[] }>(`${API_URL}/health`);
  if (!health.ok) {
    return {
      ready: false,
      message: 'Server işləmir. Terminalda layihə qovluğunda: npm run stop && npm run dev',
    };
  }

  const features = health.data?.features ?? [];
  const hasManage = features.includes('hero-manage');
  const hasUpload = features.includes('file-upload');

  if (!hasManage || !hasUpload) {
    return {
      ready: false,
      version: health.data?.version,
      message: 'Server köhnə versiyadır. Video idarəetməsi üçün serveri yenidən başladın: npm run stop && npm run dev',
    };
  }

  return { ready: true, message: 'Server hazırdır', version: health.data?.version };
}

export async function getHeroForAdmin(): Promise<HeroSlide> {
  const token = getAuthToken();
  if (!token) throw new Error('Admin kimi daxil olun');

  const manage = await fetchJson<HeroSlide>(`${API_URL}/hero/manage`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (manage.ok && manage.data) return manage.data;

  if (manage.message?.includes('401') || manage.message === 'Giriş tələb olunur') {
    throw new Error('Sessiya bitib. Yenidən admin kimi daxil olun.');
  }

  const active = await fetchJson<HeroSlide>(`${API_URL}/hero/active`);
  if (active.ok && active.data) return active.data;

  throw new Error(
    manage.message?.includes('404')
      ? 'Ana səhifə video xidməti tapılmadı. npm run stop && npm run dev ilə serveri yenidən başladın.'
      : manage.message ?? 'Ana səhifə video məlumatı yüklənmədi'
  );
}

export async function updateHero(id: string, data: UpdateHeroInput): Promise<HeroSlide> {
  return apiFetch<HeroSlide>(`/hero/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async function uploadFile(file: File, folder: string): Promise<string> {
  const token = getAuthToken();
  if (!token) throw new Error('Admin kimi daxil olun');
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(`${API_URL}/files/upload?folder=${folder}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) {
    if (response.status === 404) {
      throw new Error('Video yükləmə xidməti tapılmadı. npm run stop && npm run dev işlədin.');
    }
    throw new Error(payload.message ?? 'Fayl yüklənmədi');
  }
  return payload.data as string;
}

export async function uploadHeroVideo(file: File): Promise<string> {
  return uploadFile(file, 'hero-video');
}

export async function uploadHeroPoster(file: File): Promise<string> {
  try {
    if (getAuthToken()) return uploadFile(file, 'hero');
  } catch {
    // fallback
  }
  return uploadImage(file);
}

export async function uploadHeroImage(file: File): Promise<string> {
  return uploadHeroPoster(file);
}

export async function deleteHeroVideo(id: string): Promise<HeroSlide> {
  return apiFetch<HeroSlide>(`/hero/${id}/video`, { method: 'DELETE' });
}

export async function deleteHeroPoster(id: string): Promise<HeroSlide> {
  return apiFetch<HeroSlide>(`/hero/${id}/poster`, { method: 'DELETE' });
}

export async function saveHeroVideo(
  id: string,
  data: Pick<UpdateHeroInput, 'videoUrl'>
): Promise<HeroSlide> {
  return updateHero(id, data);
}

export { DEFAULT_VIDEO };

export function resolveAdminMediaUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads')) {
    const origin = API_URL.replace(/\/api\/?$/, '');
    return `${origin}${url}`;
  }
  if (url.startsWith('/videos')) return `${STOREFRONT_URL}${url}`;
  return url;
}
