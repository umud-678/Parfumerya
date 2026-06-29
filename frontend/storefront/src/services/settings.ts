import { apiFetch } from './api';

export interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
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
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'Amoria',
  siteTagline: 'Premium parfumeriya və kosmetika mağazası',
  email: 'info@parfumerya.az',
  phone: '+994 12 345 67 89',
  address: 'Bakı, Azərbaycan',
  footerDescription: '',
  socialLinks: [],
  shippingFee: 5,
  freeShippingThreshold: 100,
};

export async function getSettings(): Promise<SiteSettings> {
  try {
    return await apiFetch<SiteSettings>('/settings');
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export { DEFAULT_SETTINGS };
