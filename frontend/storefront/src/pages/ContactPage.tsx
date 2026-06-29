import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageShell } from '../components/ui/FloralDecor';
import { getSettings, type SiteSettings } from '../services/settings';

export default function ContactPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell title={t('contact.title')}>
      <div className="card-elegant p-10 max-w-lg mx-auto space-y-6">
        {loading ? (
          <p className="text-white/40 text-center">{t('common.loading')}</p>
        ) : !settings ? (
          <p className="text-white/40 text-center">{t('contact.empty')}</p>
        ) : (
          <>
            {settings.email ? (
              <div className="flex items-center gap-4">
                <span className="text-mint-400/50 text-xl">✿</span>
                <div>
                  <p className="text-white/40 text-sm">{t('contact.email')}</p>
                  <p>{settings.email}</p>
                </div>
              </div>
            ) : null}
            {settings.phone ? (
              <div className="flex items-center gap-4">
                <span className="text-mint-400/50 text-xl">✿</span>
                <div>
                  <p className="text-white/40 text-sm">{t('contact.phone')}</p>
                  <p>{settings.phone}</p>
                </div>
              </div>
            ) : (
              null
            )}
            {settings.address ? (
              <div className="flex items-center gap-4">
                <span className="text-mint-400/50 text-xl">✿</span>
                <div>
                  <p className="text-white/40 text-sm">{t('contact.address')}</p>
                  <p>{settings.address}</p>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </PageShell>
  );
}
