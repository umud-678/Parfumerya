import { useCallback, useEffect, useState } from 'react';
import { getOrders, updateOrderStatus, type Order } from '../services/orders';

import { ORDER_STATUS_OPTIONS } from '../utils/azLabels';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  const load = useCallback(async () => {
    try {
      setOrders(await getOrders());
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  const handleStatusChange = async (id: string, status: string) => {
    setStatusMessage('');
    try {
      await updateOrderStatus(id, status);
      setStatusMessage(
        status === 'Cancelled'
          ? 'Sifariş ləğv edildi — müştəriyə bildiriş göndərildi'
          : 'Status yeniləndi — müştəriyə bildiriş göndərildi'
      );
      load();
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Status yenilənmədi');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-mint-400">Sifarişlər</h1>
      {statusMessage && (
        <p className={`text-sm ${statusMessage.includes('uğursuz') || statusMessage.includes('yenilənmədi') ? 'text-red-400' : 'text-mint-400'}`}>
          {statusMessage}
        </p>
      )}
      <div className="card-admin overflow-x-auto">
        {loading ? (
          <p className="text-white/40 text-center py-10">Yüklənir...</p>
        ) : orders.length === 0 ? (
          <p className="text-white/40 text-center py-10">Hələ sifariş yoxdur.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 border-b border-plum-700/30">
                <th className="text-left py-3 px-2">Sifariş №</th>
                <th className="text-left py-3 px-2">Müştəri</th>
                <th className="text-left py-3 px-2">Telefon</th>
                <th className="text-left py-3 px-2">Məbləğ</th>
                <th className="text-left py-3 px-2">Endirim kodu</th>
                <th className="text-left py-3 px-2">Vəziyyət</th>
                <th className="text-left py-3 px-2">Tarix</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-plum-700/20 hover:bg-plum-800/30">
                  <td className="py-3 px-2 text-mint-400">{o.orderNumber}</td>
                  <td className="py-3 px-2">{o.shippingFullName}</td>
                  <td className="py-3 px-2 text-white/60">{o.shippingPhone}</td>
                  <td className="py-3 px-2">
                    ₼ {o.totalAmount.toFixed(2)}
                    {o.discountAmount > 0 && (
                      <span className="block text-xs text-mint-400">
                        -₼ {o.discountAmount.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-white/40">{o.couponCode ?? '—'}</td>
                  <td className="py-3 px-2">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className="bg-plum-800 border border-plum-700 rounded-lg px-2 py-1 text-xs"
                    >
                      {ORDER_STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-2 text-white/40">
                    {new Date(o.createdAt).toLocaleDateString('az-AZ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
