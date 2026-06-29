import { useEffect, useState } from 'react';
import { getSettings, DEFAULT_SETTINGS, type SiteSettings } from '../services/settings';

let cachedSettings: SiteSettings | null = null;
let fetchPromise: Promise<SiteSettings> | null = null;

function loadSettings(): Promise<SiteSettings> {
  if (cachedSettings) return Promise.resolve(cachedSettings);
  if (!fetchPromise) {
    fetchPromise = getSettings()
      .then((settings) => {
        cachedSettings = settings;
        return settings;
      })
      .catch(() => DEFAULT_SETTINGS);
  }
  return fetchPromise;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(cachedSettings ?? DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  return {
    settings,
    siteName: settings.siteName || DEFAULT_SETTINGS.siteName,
    siteTagline: settings.siteTagline ?? DEFAULT_SETTINGS.siteTagline ?? '',
  };
}

export function invalidateSiteSettingsCache() {
  cachedSettings = null;
  fetchPromise = null;
}
