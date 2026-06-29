import { Check, Circle, Package, Truck, Home, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { OrderStatusHistoryEntry } from '../../services/orders';

function formatHistoryNote(entry: OrderStatusHistoryEntry, t: TFunction): string {
  if (entry.note === 'Sifariş qəbul edildi') return t('orders.statusNotes.orderReceived');
  if (entry.note === 'Sifariş ləğv edildi') return t('orders.statusNotes.orderCancelled');
  if (entry.note?.startsWith('Status:')) {
    return t('orders.statusChange', {
      status: t(`orders.status.${entry.status}`, { defaultValue: entry.status }),
    });
  }
  return entry.note || t(`orders.status.${entry.status}`, { defaultValue: entry.status });
}

const STEPS = ['Pending', 'Confirmed', 'Shipped', 'Delivered'] as const;

const stepIcons = [Package, Check, Truck, Home];

interface Props {
  status: string;
  statusHistory?: OrderStatusHistoryEntry[];
  locale?: string;
}

export default function OrderStatusTimeline({ status, statusHistory, locale = 'az-AZ' }: Props) {
  const { t } = useTranslation();

  if (status === 'Cancelled') {
    return (
      <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
        <div className="flex items-center gap-2 text-red-400/90 text-sm">
          <XCircle size={16} />
          <span>{t('account.orderCancelled')}</span>
        </div>
        {statusHistory && statusHistory.length > 0 && (
          <StatusHistoryList history={statusHistory} locale={locale} />
        )}
      </div>
    );
  }

  const currentIdx = STEPS.indexOf(status as (typeof STEPS)[number]);
  const activeIdx = currentIdx >= 0 ? currentIdx : 0;

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <p className="text-white/35 text-[10px] uppercase tracking-widest mb-3">{t('account.orderTracking')}</p>
      <div className="flex items-start justify-between gap-1">
        {STEPS.map((step, i) => {
          const done = i <= activeIdx;
          const current = i === activeIdx;
          const Icon = stepIcons[i];
          return (
            <div key={step} className="flex-1 flex flex-col items-center text-center relative">
              {i < STEPS.length - 1 && (
                <div
                  className={`absolute top-3 left-[55%] w-[90%] h-px ${
                    i < activeIdx ? 'bg-accent/50' : 'bg-white/10'
                  }`}
                />
              )}
              <div
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${
                  done
                    ? current
                      ? 'bg-accent/20 text-accent ring-2 ring-accent/40'
                      : 'bg-accent/15 text-accent'
                    : 'bg-plum-800 text-white/25'
                }`}
              >
                {done && !current ? (
                  <Check size={12} />
                ) : current ? (
                  <Icon size={12} />
                ) : (
                  <Circle size={8} />
                )}
              </div>
              <span
                className={`text-[9px] mt-1.5 leading-tight ${
                  done ? 'text-accent/80' : 'text-white/30'
                }`}
              >
                {t(`orders.status.${step}`)}
              </span>
            </div>
          );
        })}
      </div>
      {statusHistory && statusHistory.length > 1 && (
        <StatusHistoryList history={statusHistory} locale={locale} />
      )}
    </div>
  );
}

function StatusHistoryList({
  history,
  locale,
}: {
  history: OrderStatusHistoryEntry[];
  locale: string;
}) {
  const { t } = useTranslation();
  const sorted = [...history].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );

  return (
    <div className="mt-4 pt-3 border-t border-white/5">
      <p className="text-white/35 text-[10px] uppercase tracking-widest mb-2">
        {t('account.statusHistory')}
      </p>
      <ul className="space-y-2">
        {sorted.map((entry, i) => (
          <li key={`${entry.at}-${i}`} className="flex gap-2 text-xs">
            <span className="text-white/30 shrink-0 w-[72px]">
              {new Date(entry.at).toLocaleDateString(locale, {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span className="text-white/60">
              {formatHistoryNote(entry, t)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
