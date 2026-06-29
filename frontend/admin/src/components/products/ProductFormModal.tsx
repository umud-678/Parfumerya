import { useEffect, useState } from 'react';
import { X, Upload, Plus } from 'lucide-react';
import {
  createCategory,
  createProduct,
  getBrands,
  getCategories,
  uploadImage,
  type Brand,
  type Category,
  type CreateProductInput,
} from '../../services/catalog';

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  name: '',
  description: '',
  categoryId: '',
  brandId: '',
  price: '',
  stock: '',
  sku: '',
  volumeMl: '50',
  isFeatured: false,
  isNew: true,
};

export default function ProductFormModal({ open, onClose, onSaved }: ProductFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    Promise.all([getCategories(), getBrands()]).then(([cats, brs]) => {
      setCategories(cats);
      setBrands(brs);
      setForm((f) => ({
        ...f,
        categoryId: f.categoryId || cats[0]?.id || '',
        brandId: f.brandId || brs[0]?.id || '',
      }));
    });
  }, [open]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  if (!open) return null;

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await createCategory({ name: newCategoryName.trim() });
      setCategories((prev) => [...prev, created]);
      setForm((f) => ({ ...f, categoryId: created.id }));
      setNewCategoryName('');
      setShowNewCategory(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kateqoriya əlavə olunmadı');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Məhsul adı vacibdir');
    if (!form.categoryId) return setError('Kateqoriya seçin');
    if (!form.brandId) return setError('Brend seçin');
    if (!imageFile && !imagePreview) return setError('Məhsul şəkli əlavə edin');

    setLoading(true);
    try {
      let imageUrl = imagePreview;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const input: CreateProductInput = {
        name: form.name,
        description: form.description,
        categoryId: form.categoryId,
        brandId: form.brandId,
        imageUrl,
        price: Number(form.price),
        stock: Number(form.stock),
        sku: form.sku,
        volumeMl: Number(form.volumeMl),
        isFeatured: form.isFeatured,
        isNew: form.isNew,
      };

      await createProduct(input);
      setForm(emptyForm);
      setImageFile(null);
      setImagePreview('');
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Məhsul əlavə olunmadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card-admin w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-2xl text-mint-400">Yeni məhsul</h2>
          <button onClick={onClose} className="p-2 hover:text-mint-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-white/50 text-sm">Məhsul adı *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-mint-400/50"
                placeholder="Məs: Gül Ətri"
              />
            </div>

            <div>
              <label className="text-white/50 text-sm">Kateqoriya *</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {!showNewCategory ? (
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="mt-2 text-xs text-mint-400 flex items-center gap-1"
                >
                  <Plus size={12} /> Yeni kateqoriya
                </button>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Kateqoriya adı"
                    className="flex-1 bg-plum-950 border border-plum-700 rounded-lg px-3 py-2 text-sm outline-none"
                  />
                  <button type="button" onClick={handleAddCategory} className="text-mint-400 text-sm px-2">
                    Əlavə et
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-white/50 text-sm">Brend *</label>
              <select
                value={form.brandId}
                onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-white/50 text-sm">Qiymət (₼) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="text-white/50 text-sm">Stok *</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="text-white/50 text-sm">Məhsul kodu *</label>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none"
                placeholder="ME-50"
              />
            </div>

            <div>
              <label className="text-white/50 text-sm">Həcm (ml) *</label>
              <input
                type="number"
                min="1"
                value={form.volumeMl}
                onChange={(e) => setForm({ ...form, volumeMl: e.target.value })}
                className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-white/50 text-sm">Təsvir</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-white/50 text-sm">Məhsul şəkli *</label>
              <label className="mt-2 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-plum-700 rounded-2xl p-6 cursor-pointer hover:border-mint-400/40 transition-colors">
                {imagePreview ? (
                  <img src={imagePreview} alt="Ön baxış" className="max-h-40 object-contain rounded-xl" />
                ) : (
                  <>
                    <Upload className="text-mint-400" size={28} />
                    <span className="text-white/50 text-sm">Şəkil yüklə (JPG, PNG formatları)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              />
              Seçilmiş məhsul
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(e) => setForm({ ...form, isNew: e.target.checked })}
              />
              Yeni məhsul
            </label>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-mint-400 text-plum-900 font-semibold py-3 rounded-full disabled:opacity-60"
            >
              {loading ? 'Saxlanılır...' : 'Məhsulu saxla'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-full border border-plum-700 text-white/60"
            >
              Ləğv et
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
