import { useCallback, useEffect, useState } from 'react';
import { deleteReview, getReviews, type AdminReview } from '../services/reviews';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getReviews()
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu rəyi silmək istədiyinizə əminsiniz?')) return;
    setDeletingId(id);
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert('Rəy silinmədi');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-mint-400">Müştəri rəyləri</h1>
        <p className="text-white/45 text-sm mt-1">
          Yalnız silmək mümkündür — rəy mətni və ulduz dəyişdirilə bilməz.
        </p>
      </div>

      {loading ? (
        <p className="text-white/40">Yüklənir...</p>
      ) : reviews.length === 0 ? (
        <p className="text-white/40">Hələ rəy yoxdur.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="card-admin">
              <div className="flex flex-wrap justify-between gap-2 mb-2">
                <div>
                  <p className="font-medium">{r.productName}</p>
                  <p className="text-white/40 text-xs mt-0.5">{r.productSlug}</p>
                </div>
                <span className="text-gold-400 text-sm tracking-wider">
                  {'★'.repeat(r.rating)}
                  <span className="text-white/25">{'★'.repeat(5 - r.rating)}</span>
                </span>
              </div>
              <p className="text-white/65 text-sm mb-3 leading-relaxed">{r.comment}</p>
              <div className="flex flex-wrap justify-between items-center gap-2">
                <p className="text-white/40 text-xs">
                  {r.userName} · {new Date(r.createdAt).toLocaleString('az-AZ')}
                </p>
                <button
                  type="button"
                  onClick={() => handleDelete(r.id)}
                  disabled={deletingId === r.id}
                  className="text-xs text-red-400/80 hover:text-red-400 disabled:opacity-50"
                >
                  {deletingId === r.id ? 'Silinir...' : 'Sil'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
