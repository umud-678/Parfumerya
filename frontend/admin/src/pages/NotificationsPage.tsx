import { useCallback, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import {
  getNotifications,
  markAllRead,
  markAsRead,
  timeAgo,
  type Notification,
} from '../services/orders';

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setItems(await getNotifications());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const handleRead = async (id: string) => {
    await markAsRead(id);
    load();
  };

  const handleReadAll = async () => {
    await markAllRead();
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl text-mint-400 flex items-center gap-2">
          <Bell size={28} /> Bildirişlər
        </h1>
        {items.some((n) => !n.isRead) && (
          <button
            onClick={handleReadAll}
            className="text-sm text-mint-400 border border-mint-400/30 px-4 py-2 rounded-full hover:bg-mint-400/10"
          >
            Hamısını oxundu et
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-white/40">Yüklənir...</p>
      ) : items.length === 0 ? (
        <div className="card-admin text-center text-white/40 py-10">
          Hələ bildiriş yoxdur. Müştəri sifariş verdikdə və ya məhsulu favoritə əlavə etdikdə burada görünəcək.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleRead(n.id)}
              className={`card-admin cursor-pointer transition-colors ${
                !n.isRead ? 'border-mint-400/30 bg-mint-400/5' : ''
              }`}
            >
              <div className="flex justify-between">
                <p className="font-medium text-sm flex items-center gap-2">
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-mint-400" />}
                  {n.title}
                </p>
                <p className="text-white/40 text-xs">{timeAgo(n.createdAt)}</p>
              </div>
              <p className="text-white/60 text-sm mt-1">{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
