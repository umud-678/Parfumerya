import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { checkApiHealth } from '../services/api';
import { API_URL } from '../config/env';

export default function ApiConnectionBanner() {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(false);
  const [checking, setChecking] = useState(false);

  const verify = async () => {
    setChecking(true);
    const ok = await checkApiHealth();
    setOffline(!ok);
    setChecking(false);
  };

  useEffect(() => {
    verify();
  }, []);

  if (!offline) return null;

  return (
    <div className="relative z-[60] border-b border-amber-400/25 bg-amber-950/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
        <div className="flex items-start gap-2 text-amber-100/90 min-w-0">
          <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-300" />
          <div>
            <p className="font-medium text-amber-200">{t('api.unavailableTitle')}</p>
            <p className="text-amber-100/70 text-xs mt-0.5 leading-relaxed">{t('api.unavailableHint')}</p>
            <p className="text-amber-100/45 text-[11px] mt-1 break-all">{API_URL}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={verify}
          disabled={checking}
          className="inline-flex items-center justify-center gap-2 shrink-0 rounded-full border border-amber-300/35 px-4 py-2 text-xs text-amber-100 hover:bg-amber-400/10 disabled:opacity-60 min-h-[36px] sm:ml-auto"
        >
          <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
          {checking ? t('api.retrying') : t('api.retry')}
        </button>
      </div>
    </div>
  );
}
