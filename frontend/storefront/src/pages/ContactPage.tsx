import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageShell } from '../components/ui/FloralDecor';
import { getSettings, type SiteSettings } from '../services/settings';

export default function ContactPage() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const lang = i18n.language?.split('-')[0] ?? 'az';

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings(null));
  }, []);

  const email = settings?.email ?? 'info@parfumerya.az';
  const phone = settings?.phone ?? '+994 12 345 67 89';
  const address =
    lang === 'az'
      ? settings?.address || t('contact.addressValue')
      : t('contact.addressValue');

  return (
    <PageShell title={t('contact.title')}>
      <div className="card-elegant p-10 max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <span className="text-mint-400/50 text-xl">✿</span>
          <div>
            <p className="text-white/40 text-sm">{t('contact.email')}</p>
            <p>{email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-mint-400/50 text-xl">✿</span>
          <div>
            <p className="text-white/40 text-sm">{t('contact.phone')}</p>
            <p>{phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-mint-400/50 text-xl">✿</span>
          <div>
            <p className="text-white/40 text-sm">{t('contact.address')}</p>
            <p>{address}</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
