import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getReportsSummary, type ReportsSummary } from '../services/reports';

function formatMoney(value: number) {
  return `₼ ${value.toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setSummary(await getReportsSummary());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hesabat yüklənmədi');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const chartMax = useMemo(() => {
    if (!summary?.dailyChart.length) return 1;
    return Math.max(...summary.dailyChart.map((d) => d.revenue), 1);
  }, [summary]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-mint-400">Hesabatlar</h1>
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
      ) : !summary ? (
        <p className="text-white/40">Hesabat məlumatı yoxdur.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-admin">
            <h2 className="text-mint-400 mb-4">Günlük satış</h2>
            <p className="text-3xl font-bold">{formatMoney(summary.dailyRevenue)}</p>
          </div>
          <div className="card-admin">
            <h2 className="text-mint-400 mb-4">Aylıq satış</h2>
            <p className="text-3xl font-bold">{formatMoney(summary.monthlyRevenue)}</p>
          </div>
          <div className="card-admin">
            <h2 className="text-mint-400 mb-4">Ümumi gəlir</h2>
            <p className="text-3xl font-bold">{formatMoney(summary.totalSales)}</p>
          </div>
          <div className="card-admin md:col-span-2">
            <h2 className="text-mint-400 mb-4">Gəlir analizi (30 gün)</h2>
            {summary.dailyChart.every((d) => d.revenue === 0) ? (
              <p className="text-white/40 text-sm">Bu dövrdə satış yoxdur.</p>
            ) : (
              <div className="h-40 flex items-end gap-1">
                {summary.dailyChart.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ${formatMoney(d.revenue)}`}
                    className="flex-1 bg-mint-400/30 rounded-t hover:bg-mint-400/50 transition-colors min-w-[4px]"
                    style={{ height: `${Math.max(4, (d.revenue / chartMax) * 100)}%` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
