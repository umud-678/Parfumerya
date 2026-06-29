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

export async function updateSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
  return apiFetch<SiteSettings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
