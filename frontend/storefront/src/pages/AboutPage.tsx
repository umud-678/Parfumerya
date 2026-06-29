import { useTranslation } from 'react-i18next';
import { PageShell } from '../components/ui/FloralDecor';

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <PageShell title={t('about.title')}>
      <div className="card-elegant p-10 max-w-2xl mx-auto text-center">
        <span className="text-4xl text-mint-400/30 block mb-6">❀</span>
        <p className="text-white/70 leading-relaxed text-lg">{t('about.text')}</p>
      </div>
    </PageShell>
  );
}
