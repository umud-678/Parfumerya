import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type AdminCategory,
} from '../services/categories';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCategories(await getCategories());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kateqoriyalar yüklənmədi');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '' });
    setShowForm(true);
  };

  const openEdit = (cat: AdminCategory) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description ?? '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateCategory(editing.id, form);
      } else {
        await createCategory(form);
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Əməliyyat uğursuz oldu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: AdminCategory) => {
    if (!window.confirm(`"${cat.name}" kateqoriyasını silmək istəyirsiniz?`)) return;
    setError('');
    try {
      await deleteCategory(cat.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinmədi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h1 className="font-serif text-3xl text-mint-400">Kateqoriya idarəsi</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-mint-400 text-plum-900 px-5 py-2.5 rounded-full text-sm font-semibold"
        >
          <Plus size={16} /> Kateqoriya əlavə et
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="card-admin space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-lg text-white/90">
              {editing ? 'Kateqoriyanı redaktə et' : 'Yeni kateqoriya'}
            </h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <input
            placeholder="Kateqoriya adı"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none"
          />
          <input
            placeholder="Link hissəsi (boş buraxsanız avtomatik yaranır)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="w-full bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none"
          />
          <textarea
            placeholder="Təsvir"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none resize-none"
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-mint-400 text-plum-900 px-6 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Saxlanılır...' : editing ? 'Yenilə' : 'Yarat'}
          </button>
        </form>
      )}

      <div className="card-admin space-y-3">
        {loading ? (
          <p className="text-white/40">Yüklənir...</p>
        ) : categories.length === 0 ? (
          <p className="text-white/40">Kateqoriya yoxdur.</p>
        ) : (
          categories.map((c) => (
            <div key={c.id} className="flex justify-between items-center py-3 border-b border-plum-700/20 last:border-0 gap-4">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-white/40 text-xs">
                  /{c.slug} · {c.productCount ?? 0} məhsul
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(c)} className="p-2 text-mint-400 hover:bg-mint-400/10 rounded-lg">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(c)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
