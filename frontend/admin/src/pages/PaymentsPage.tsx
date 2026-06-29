import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getSettings, updateSettings, type PaymentMethod, type SiteSettings } from '../services/settings';
import { formatPaymentMethod } from '../utils/azLabels';

export default function PaymentsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      setSettings(await getSettings());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödəniş metodları yüklənmədi');
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleMethod = async (method: PaymentMethod) => {
    if (!settings?.paymentMethods) return;
    setSavingId(method.id);
    setError('');
    try {
      const paymentMethods = settings.paymentMethods.map((m) =>
        m.id === method.id ? { ...m, active: !m.active } : m
      );
      const updated = await updateSettings({ ...settings, paymentMethods });
      setSettings(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yeniləmə uğursuz oldu');
    } finally {
      setSavingId(null);
    }
  };

  const methods = settings?.paymentMethods ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-mint-400">Ödəniş sistemləri</h1>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-mint-400 border border-mint-400/30 px-4 py-2 rounded-full hover:bg-mint-400/10"
        >
          <RefreshCw size={14} />
          Yenilə
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {loading ? (
        <p className="text-white/40">Yüklənir...</p>
      ) : methods.length === 0 ? (
        <p className="text-white/40">Ödəniş metodu təyin edilməyib. Ayarlardan əlavə edin.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {methods.map((m) => (
            <div key={m.id} className="card-admin">
              <p className="font-medium">{m.name}</p>
              <p className="text-white/40 text-sm">{formatPaymentMethod(m.code)}</p>
              <button
                type="button"
                disabled={savingId === m.id}
                onClick={() => toggleMethod(m)}
                className={`inline-block mt-3 text-xs px-2 py-1 rounded disabled:opacity-50 ${
                  m.active
                    ? 'text-mint-400 bg-mint-400/10'
                    : 'text-white/40 bg-plum-800'
                }`}
              >
                {savingId === m.id ? '...' : m.active ? 'Aktiv' : 'Deaktiv'}
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-white/40 text-sm">Kart məlumatları birbaşa bank sistemə yönləndirilir. Verilənlər bazasında saxlanılmır.</p>
    </div>
  );
}
