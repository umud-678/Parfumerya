import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Bell } from 'lucide-react';
import { getDashboardStats, getOrders, timeAgo } from '../services/orders';
import { formatOrderStatus } from '../utils/azLabels';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSales: 0,
    dailyRevenue: 0,
    totalOrders: 0,
    unreadNotifications: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Array<{
    orderNumber: string;
    shippingFullName: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, orders] = await Promise.all([getDashboardStats(), getOrders()]);
        setStats(s);
        setRecentOrders(orders.slice(0, 5));
      } catch {
        // API offline
      }
    };
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    { label: 'Ümumi satış', value: `₼ ${stats.totalSales.toFixed(2)}`, icon: DollarSign },
    { label: 'Günlük gəlir', value: `₼ ${stats.dailyRevenue.toFixed(2)}`, icon: DollarSign },
    { label: 'Sifariş sayı', value: String(stats.totalOrders), icon: ShoppingBag },
    { label: 'Yeni bildiriş', value: String(stats.unreadNotifications), icon: Bell },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl text-mint-400">İdarə paneli</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((s) => (
          <div key={s.label} className="card-admin flex items-center gap-4">
            <div className="p-3 rounded-xl bg-plum-800 text-mint-400">
              <s.icon size={22} />
            </div>
            <div>
              <p className="text-white/50 text-sm">{s.label}</p>
              <p className="text-xl font-semibold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card-admin">
        <h2 className="font-serif text-lg text-mint-400 mb-4">Son sifarişlər</h2>
        {recentOrders.length === 0 ? (
          <p className="text-white/40 text-sm">Hələ sifariş yoxdur.</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((o) => (
              <div key={o.orderNumber} className="flex justify-between py-2 border-b border-plum-700/20 last:border-0">
                <div>
                  <p className="font-medium text-sm text-mint-400">{o.orderNumber}</p>
                  <p className="text-white/40 text-xs">{o.shippingFullName} • {timeAgo(o.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">₼ {o.totalAmount.toFixed(2)}</p>
                  <p className="text-white/40 text-xs">{formatOrderStatus(o.status)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
