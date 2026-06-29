import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import ProductFormModal from '../components/products/ProductFormModal';
import { deleteProduct, getProducts, type AdminProduct } from '../services/catalog';

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await getProducts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" məhsulunu silmək istəyirsiniz?`)) return;
    await deleteProduct(id);
    loadProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl text-mint-400">Məhsul idarəsi</h1>
          <p className="text-white/40 text-sm mt-1">Məhsul, şəkil və kateqoriya əlavə edin</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-mint-400 text-plum-900 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-mint-300 transition-colors"
        >
          <Plus size={16} /> Məhsul əlavə et
        </button>
      </div>

      <div className="card-admin overflow-x-auto">
        {loading ? (
          <p className="text-white/40 text-center py-10">Yüklənir...</p>
        ) : products.length === 0 ? (
          <p className="text-white/40 text-center py-10">
            Hələ məhsul yoxdur. &quot;Məhsul əlavə et&quot; düyməsinə basın.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 border-b border-plum-700/30">
                <th className="text-left py-3 px-2">Şəkil</th>
                <th className="text-left py-3 px-2">Ad</th>
                <th className="text-left py-3 px-2">Brend</th>
                <th className="text-left py-3 px-2">Kateqoriya</th>
                <th className="text-left py-3 px-2">Qiymət</th>
                <th className="text-left py-3 px-2">Stok</th>
                <th className="text-left py-3 px-2">Məhsul kodu</th>
                <th className="text-right py-3 px-2">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-plum-700/20 hover:bg-plum-800/30">
                  <td className="py-3 px-2">
                    {p.primaryImageUrl ? (
                      <img
                        src={p.primaryImageUrl}
                        alt={p.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-plum-800 rounded-lg" />
                    )}
                  </td>
                  <td className="py-3 px-2">{p.name}</td>
                  <td className="py-3 px-2 text-white/60">{p.brandName}</td>
                  <td className="py-3 px-2 text-white/60">{p.categoryName}</td>
                  <td className="py-3 px-2 text-mint-400">₼ {p.price.toFixed(2)}</td>
                  <td className={`py-3 px-2 ${p.stock <= 5 ? 'text-red-400' : ''}`}>{p.stock}</td>
                  <td className="py-3 px-2 text-white/40">{p.sku}</td>
                  <td className="py-3 px-2 text-right">
                    <button className="p-1.5 hover:text-mint-400 opacity-40 cursor-not-allowed" title="Tezliklə">
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-1.5 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadProducts}
      />
    </div>
  );
}
