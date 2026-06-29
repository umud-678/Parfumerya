import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSiteSettings } from './useSiteSettings';

const PAGE_TAGLINES: Record<string, string> = {
  az: 'Premium ətirlər',
  en: 'Premium Fragrances',
  ru: 'Премиальная парфюмерия',
};

export function useDocumentLanguage() {
  const { i18n } = useTranslation();
  const { siteName } = useSiteSettings();

  useEffect(() => {
    const sync = (lng: string) => {
      const code = lng.split('-')[0];
      document.documentElement.lang = code;
      const tagline = PAGE_TAGLINES[code] ?? PAGE_TAGLINES.az;
      document.title = `${siteName} — ${tagline}`;
    };

    sync(i18n.language);
    i18n.on('languageChanged', sync);
    return () => {
      i18n.off('languageChanged', sync);
    };
  }, [i18n, siteName]);
}
