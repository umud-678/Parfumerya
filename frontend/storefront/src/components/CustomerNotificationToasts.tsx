import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, X, Package } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  type CustomerNotification,
} from '../services/customerNotifications';

export default function CustomerNotificationToasts() {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const [visible, setVisible] = useState<CustomerNotification[]>([]);
  const shownIds = useRef<Set<string>>(new Set());

  const userId = user?.userId;

  const poll = useCallback(async () => {
    if (!userId) return;
    try {
      const items = await getMyNotifications();
      const unread = items.filter((n) => !n.isRead);
      const fresh = unread.filter((n) => !shownIds.current.has(n.id));
      if (fresh.length > 0) {
        fresh.forEach((n) => shownIds.current.add(n.id));
        setVisible((prev) => {
          const merged = [...fresh, ...prev].slice(0, 3);
          return merged;
        });
      }
    } catch {
      /* ignore */
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setVisible([]);
      shownIds.current.clear();
      return;
    }
    poll();
    const interval = setInterval(poll, 12000);
    return () => clearInterval(interval);
  }, [userId, poll]);

  const dismiss = async (n: CustomerNotification) => {
    setVisible((prev) => prev.filter((x) => x.id !== n.id));
    try {
      await markNotificationRead(n.id);
    } catch {
      /* ignore */
    }
  };

  const openOrders = async (n: CustomerNotification) => {
    await dismiss(n);
    navigate('/account?tab=orders');
  };

  if (!userId || visible.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[60] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {visible.map((n) => {
        const isCancelled = n.status === 'Cancelled';
        return (
          <div
            key={n.id}
            className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl backdrop-blur-md ${
              isCancelled
                ? 'bg-red-950/90 border-red-500/40'
                : 'bg-plum-900/95 border-accent/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                  isCancelled ? 'bg-red-500/20 text-red-300' : 'bg-accent/15 text-accent'
                }`}
              >
                {isCancelled ? <Package size={16} /> : <Bell size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-white">{n.title}</p>
                <p className="text-white/65 text-xs mt-1 leading-relaxed">{n.message}</p>
                <button
                  type="button"
                  onClick={() => openOrders(n)}
                  className="text-accent text-xs mt-2 hover:underline"
                >
                  {t('notifications.viewOrder')} →
                </button>
              </div>
              <button
                type="button"
                onClick={() => dismiss(n)}
                className="text-white/40 hover:text-white shrink-0"
                aria-label={t('notifications.dismiss')}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function useUnreadNotificationCount() {
  const userId = useAppSelector((s) => s.auth.user?.userId);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }
    const load = () => {
      getUnreadNotificationCount().then(setCount).catch(() => setCount(0));
    };
    load();
    const interval = setInterval(load, 12000);
    return () => clearInterval(interval);
  }, [userId]);

  return count;
}
