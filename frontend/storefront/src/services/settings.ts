import { apiFetch } from './api';

export interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface SiteSettings {
  siteName: string;
  siteTagline?: string;
  email: string;
  phone: string;
  address: string;
  footerDescription?: string;
  socialLinks: SocialLink[];
  shippingFee: number;
  freeShippingThreshold: number;
  aboutTextAz?: string;
  aboutTextEn?: string;
  aboutTextRu?: string;
  paymentMethods?: PaymentMethod[];
}

export async function getSettings(): Promise<SiteSettings> {
  return apiFetch<SiteSettings>('/settings');
}

export function getAboutText(settings: SiteSettings | null, lang: string): string {
  if (!settings) return '';
  const code = lang.split('-')[0];
  if (code === 'en') return settings.aboutTextEn ?? settings.aboutTextAz ?? '';
  if (code === 'ru') return settings.aboutTextRu ?? settings.aboutTextAz ?? '';
  return settings.aboutTextAz ?? '';
}
