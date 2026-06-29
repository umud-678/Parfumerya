import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Heart, TrendingUp, Users, Package } from 'lucide-react';
import { getWishlistStats, type WishlistStatItem, type WishlistStats } from '../services/wishlist';

import { STOREFRONT_URL } from '../config/env';

export default function WishlistAdminPage() {
  const [stats, setStats] = useState<WishlistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setStats(await getWishlistStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sevimlilər yüklənmədi');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const maxCount = stats?.items[0]?.favoriteCount ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-mint-400 flex items-center gap-2">
            <Heart size={28} />
            Sevimlilər
          </h1>
          <p className="text-white/45 text-sm mt-2">
            Müştərilərin favorit etdiyi məhsullar — real vaxtda yenilənir.
          </p>
        </div>
        <button
          onClick={load}
          className="text-sm text-mint-400 border border-mint-400/30 px-4 py-2 rounded-full hover:bg-mint-400/10"
        >
          Yenilə
        </button>
      </div>

      {error && (
        <div className="card-admin border border-red-500/30 text-red-300 text-sm p-4">{error}</div>
      )}

      {loading && !stats ? (
        <div className="card-admin p-10 text-center text-white/40">Yüklənir...</div>
      ) : stats ? (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="card-admin p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-mint-400/15 flex items-center justify-center text-mint-400">
                <Heart size={18} />
              </div>
              <div>
                <p className="text-2xl font-serif text-white">{stats.summary.totalFavorites}</p>
                <p className="text-white/40 text-xs">Ümumi favorit</p>
              </div>
            </div>
            <div className="card-admin p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-mint-400/15 flex items-center justify-center text-mint-400">
                <Package size={18} />
              </div>
              <div>
                <p className="text-2xl font-serif text-white">{stats.summary.uniqueProducts}</p>
                <p className="text-white/40 text-xs">Fərqli məhsul</p>
              </div>
            </div>
            <div className="card-admin p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-mint-400/15 flex items-center justify-center text-mint-400">
                <Users size={18} />
              </div>
              <div>
                <p className="text-2xl font-serif text-white">{stats.summary.uniqueUsers}</p>
                <p className="text-white/40 text-xs">Favorit istifadəçi</p>
              </div>
            </div>
          </div>

          <div className="card-admin">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-plum-700/30">
              <TrendingUp size={18} className="text-mint-400" />
              <h2 className="font-serif text-lg text-white/90">Ən çox favorit edilən məhsullar</h2>
            </div>

            {stats.items.length === 0 ? (
              <p className="text-white/40 text-sm py-6 text-center">
                Hələ favorit məlumatı yoxdur. Müştərilər daxil olub məhsulları favoritə əlavə edəndə burada görünəcək.
              </p>
            ) : (
              <div className="space-y-4">
                {stats.items.map((item, index) => (
                  <WishlistRow key={item.productId} item={item} rank={index + 1} maxCount={maxCount} />
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function WishlistRow({
  item,
  rank,
  maxCount,
}: {
  item: WishlistStatItem;
  rank: number;
  maxCount: number;
}) {
  const barWidth = Math.round((item.favoriteCount / maxCount) * 100);
  const productUrl = `${STOREFRONT_URL}/product/${item.productSlug}`;

  return (
    <div className="flex flex-wrap items-center gap-4 py-3 border-b border-plum-700/20 last:border-0">
      <span className="w-8 text-center text-white/30 text-sm font-mono">#{rank}</span>
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.productName}
          className="w-12 h-12 rounded-xl object-contain bg-plum-950"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-plum-950" />
      )}
      <div className="flex-1 min-w-[180px]">
        <p className="font-medium">{item.productName}</p>
        <p className="text-white/40 text-xs">
          {item.categoryName || 'Kateqoriya yoxdur'} · ₼ {item.minPrice.toFixed(2)}
        </p>
        <div className="mt-2 h-1.5 rounded-full bg-plum-800 overflow-hidden max-w-xs">
          <div
            className="h-full rounded-full bg-mint-400/70 transition-all duration-500"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
      <div className="text-right">
        <p className="text-mint-400 font-semibold">{item.favoriteCount}</p>
        <p className="text-white/35 text-xs">favorit</p>
      </div>
      {item.productSlug && (
        <a
          href={productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/30 hover:text-mint-400 p-2"
          title="Saytda bax"
        >
          <ExternalLink size={16} />
        </a>
      )}
    </div>
  );
}
