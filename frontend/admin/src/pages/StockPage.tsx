import { useCallback, useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import {
  addProductStock,
  getProducts,
  setProductStock,
  subtractProductStock,
  type AdminProduct,
} from '../services/catalog';

const LOW_STOCK_THRESHOLD = 5;

function parseQty(raw: string, fallback = 1): number | null {
  const trimmed = raw.trim();
  const qty = trimmed === '' ? fallback : parseInt(trimmed, 10);
  if (!Number.isFinite(qty) || qty <= 0) return null;
  return qty;
}

export default function StockPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addQty, setAddQty] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setProducts(await getProducts());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Məhsullar yüklənmədi');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateLocalStock = (productId: string, stock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock } : p))
    );
  };

  const runStockAction = async (
    product: AdminProduct,
    action: 'add' | 'subtract' | 'set',
    qty: number
  ) => {
    setSavingId(product.id);
    setMessage('');
    setError('');
    try {
      let newStock: number;
      if (action === 'add') {
        newStock = await addProductStock(product.id, qty);
      } else if (action === 'subtract') {
        newStock = await subtractProductStock(product.id, qty);
      } else {
        newStock = await setProductStock(product.id, qty);
      }
      updateLocalStock(product.id, newStock);
      setAddQty((prev) => ({ ...prev, [product.id]: '' }));
      const labels = {
        add: `+${qty} ədəd əlavə edildi`,
        subtract: `−${qty} ədəd azaldıldı`,
        set: `stok ${newStock} olaraq təyin edildi`,
      };
      setMessage(`${product.name} — ${labels[action]}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stok yenilənmədi');
    } finally {
      setSavingId(null);
    }
  };

  const handleAddStock = (product: AdminProduct) => {
    const qty = parseQty(addQty[product.id] ?? '', 1);
    if (qty == null) {
      setError('Müsbət ədəd daxil edin');
      return;
    }
    void runStockAction(product, 'add', qty);
  };

  const handleSubtractStock = (product: AdminProduct) => {
    const qty = parseQty(addQty[product.id] ?? '', 1);
    if (qty == null) {
      setError('Müsbət ədəd daxil edin');
      return;
    }
    void runStockAction(product, 'subtract', qty);
  };

  const handleSetStock = (product: AdminProduct) => {
    const raw = addQty[product.id] ?? '';
    const qty = raw.trim() === '' ? null : parseInt(raw, 10);
    if (qty == null || !Number.isFinite(qty) || qty < 0) {
      setError('0 və ya daha böyük ədəd daxil edin');
      return;
    }
    void runStockAction(product, 'set', qty);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-mint-400">Stok idarəsi</h1>
        <p className="text-white/40 text-sm mt-1">
          Sifariş təsdiqlənəndə stok avtomatik azalır. Boş buraxsanız, əlavə/azaltma 1 ədəd olur.
        </p>
      </div>

      {message && <p className="text-mint-400 text-sm">{message}</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="card-admin overflow-x-auto">
        {loading ? (
          <p className="text-white/40 text-center py-10">Yüklənir...</p>
        ) : products.length === 0 ? (
          <p className="text-white/40 text-center py-10">Məhsul yoxdur.</p>
        ) : (
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-white/40 border-b border-plum-700/30">
                <th className="text-left py-3 px-2">Məhsul</th>
                <th className="text-left py-3 px-2">Məhsul kodu</th>
                <th className="text-left py-3 px-2">Cari stok</th>
                <th className="text-left py-3 px-2">Xəbərdarlıq</th>
                <th className="text-left py-3 px-2">Stok əməliyyatı</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const low = p.stock <= LOW_STOCK_THRESHOLD;
                const busy = savingId === p.id;
                return (
                  <tr key={p.id} className="border-b border-plum-700/20 hover:bg-plum-800/30 align-middle">
                    <td className="py-3 px-2">{p.name}</td>
                    <td className="py-3 px-2 text-white/40">{p.sku || '—'}</td>
                    <td className={`py-3 px-2 font-medium ${low ? 'text-red-400' : 'text-mint-400'}`}>
                      {p.stock}
                    </td>
                    <td className="py-3 px-2 text-xs">
                      {low ? '⚠️ Az stok' : '—'}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          type="number"
                          min="0"
                          value={addQty[p.id] ?? ''}
                          onChange={(e) =>
                            setAddQty((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                          placeholder="1"
                          className="w-20 bg-plum-950 border border-plum-700 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-mint-400/40"
                        />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleAddStock(p)}
                          title="Anbara əlavə et"
                          aria-label="Anbara əlavə et"
                          className="inline-flex items-center justify-center w-8 h-8 text-mint-400 bg-mint-400/15 border border-mint-400/30 rounded-lg hover:bg-mint-400/25 disabled:opacity-50"
                        >
                          {busy ? <span className="text-xs">…</span> : <Plus size={16} />}
                        </button>
                        <button
                          type="button"
                          disabled={busy || p.stock <= 0}
                          onClick={() => handleSubtractStock(p)}
                          title="Stokdan azalt"
                          aria-label="Stokdan azalt"
                          className="inline-flex items-center justify-center w-8 h-8 text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-lg hover:bg-amber-400/20 disabled:opacity-50"
                        >
                          <Minus size={16} />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleSetStock(p)}
                          title="Stoku dəqiq təyin et"
                          className="text-xs bg-plum-800 text-white/70 border border-plum-600 px-3 py-1.5 rounded-lg hover:bg-plum-700 disabled:opacity-50"
                        >
                          Təyin et
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
