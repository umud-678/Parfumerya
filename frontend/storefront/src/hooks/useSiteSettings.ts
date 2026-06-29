import { useEffect, useState } from 'react';
import { getSettings, type SiteSettings } from '../services/settings';

let cachedSettings: SiteSettings | null = null;
let fetchPromise: Promise<SiteSettings> | null = null;

function loadSettings(): Promise<SiteSettings> {
  if (cachedSettings) return Promise.resolve(cachedSettings);
  if (!fetchPromise) {
    fetchPromise = getSettings().then((settings) => {
      cachedSettings = settings;
      return settings;
    });
  }
  return fetchPromise;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(cachedSettings);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  return {
    settings,
    loading,
    siteName: settings?.siteName ?? '',
    siteTagline: settings?.siteTagline ?? '',
  };
}

export function invalidateSiteSettingsCache() {
  cachedSettings = null;
  fetchPromise = null;
}
