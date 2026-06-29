import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageShell } from '../components/ui/FloralDecor';
import { getAboutText, getSettings, type SiteSettings } from '../services/settings';

export default function AboutPage() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

  const text = getAboutText(settings, i18n.language);

  return (
    <PageShell title={t('about.title')}>
      <div className="card-elegant p-10 max-w-2xl mx-auto text-center">
        <span className="text-4xl text-mint-400/30 block mb-6">❀</span>
        {loading ? (
          <p className="text-white/40">{t('common.loading')}</p>
        ) : text ? (
          <p className="text-white/70 leading-relaxed text-lg">{text}</p>
        ) : (
          <p className="text-white/40">{t('about.empty')}</p>
        )}
      </div>
    </PageShell>
  );
}
