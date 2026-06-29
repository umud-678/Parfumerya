import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { createBrand, deleteBrand, getBrands, type Brand } from '../services/catalog';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBrands(await getBrands());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Brendlər yüklənmədi');
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await createBrand(name);
      setName('');
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Brend əlavə edilmədi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brand: Brand) => {
    if (!window.confirm(`"${brand.name}" brendini silmək istəyirsiniz?`)) return;
    setError('');
    try {
      await deleteBrand(brand.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinmə uğursuz oldu');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h1 className="font-serif text-3xl text-mint-400">Brend idarəsi</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-mint-400 text-plum-900 px-5 py-2.5 rounded-full text-sm font-semibold"
        >
          <Plus size={16} /> Brend əlavə et
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="card-admin space-y-4 max-w-md">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-lg text-white/90">Yeni brend</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <input
            placeholder="Brend adı"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none"
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-mint-400 text-plum-900 px-6 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Saxlanılır...' : 'Yarat'}
          </button>
        </form>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-white/40 col-span-full">Yüklənir...</p>
        ) : brands.length === 0 ? (
          <p className="text-white/40 col-span-full">Brend yoxdur.</p>
        ) : (
          brands.map((b) => (
            <div key={b.id} className="card-admin text-center">
              <p className="font-serif text-lg">{b.name}</p>
              <p className="text-white/30 text-xs mt-1">/{b.slug}</p>
              <div className="flex justify-center gap-3 mt-4 text-sm">
                <button
                  onClick={() => handleDelete(b)}
                  className="inline-flex items-center gap-1 text-white/40 hover:text-red-400"
                >
                  <Trash2 size={14} /> Sil
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
