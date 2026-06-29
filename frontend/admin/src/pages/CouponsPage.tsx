import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { getCategories, type AdminCategory } from '../services/categories';
import { createCoupon, deleteCoupon, getCoupons, type Coupon } from '../services/orders';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discountPercent: '20',
    applicableCategorySlug: '',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [couponList, categoryList] = await Promise.all([getCoupons(), getCategories()]);
      setCoupons(couponList);
      setCategories(categoryList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Məlumat yüklənmədi');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createCoupon({
        code: form.code,
        discountType: 'percentage',
        value: Number(form.discountPercent),
        discountPercent: Number(form.discountPercent),
        applicableCategorySlug: form.applicableCategorySlug,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });
      setShowForm(false);
      setForm({
        code: '',
        discountPercent: '20',
        applicableCategorySlug: '',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Endirim kodu yaradılmadı');
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!window.confirm(`"${coupon.code}" endirim kodunu silmək istəyirsiniz?`)) return;
    try {
      await deleteCoupon(coupon.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinmədi');
    }
  };

  const categoryLabel = (slug?: string) => {
    if (!slug) return 'Bütün məhsullar';
    return categories.find((c) => c.slug === slug)?.name ?? slug;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl text-mint-400">Endirim və kampaniyalar</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-mint-400 text-plum-900 px-4 py-2 rounded-full text-sm font-semibold"
        >
          Endirim kodu yarat
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="card-admin grid md:grid-cols-2 gap-4">
          <input
            placeholder="Kod (məs: YENI20)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            required
            className="bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none"
          />
          <input
            type="number"
            placeholder="Endirim faizi (%)"
            value={form.discountPercent}
            onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
            required
            min="1"
            max="100"
            className="bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none"
          />
          <select
            value={form.applicableCategorySlug}
            onChange={(e) => setForm({ ...form, applicableCategorySlug: e.target.value })}
            className="bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none md:col-span-2"
          >
            <option value="">Bütün məhsullar (ümumi endirim)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                Yalnız: {cat.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none"
          />
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none"
          />
          <button type="submit" className="md:col-span-2 bg-mint-400 text-plum-900 py-3 rounded-full font-semibold">
            Yarat
          </button>
        </form>
      )}

      <div className="card-admin">
        {loading ? (
          <p className="text-white/40">Yüklənir...</p>
        ) : (
          <div className="space-y-3">
            {coupons.map((c) => (
              <div key={c.id} className="flex justify-between items-start gap-4 py-3 border-b border-plum-700/20 last:border-0">
                <div>
                  <p className="font-mono text-mint-400">{c.code}</p>
                  <p className="text-white/40 text-xs mt-1">
                    {c.discountPercent ?? c.value}% endirim · {categoryLabel(c.applicableCategorySlug)}
                  </p>
                  <p className="text-white/30 text-xs">
                    {new Date(c.startDate).toLocaleDateString('az-AZ')} — {new Date(c.endDate).toLocaleDateString('az-AZ')}
                    {' • '}
                    İstifadə: {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${c.isActive ? 'text-mint-400' : 'text-red-400'}`}>
                    {c.isActive ? 'Aktiv' : 'Deaktiv'}
                  </span>
                  <button
                    onClick={() => handleDelete(c)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
