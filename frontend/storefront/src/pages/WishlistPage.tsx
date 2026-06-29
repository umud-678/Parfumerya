import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useWishlistActions } from '../hooks/useWishlistActions';
import { addToCart } from '../store/cartSlice';
import { PageShell } from '../components/ui/FloralDecor';

export default function WishlistPage() {
  const { t } = useTranslation();
  const items = useAppSelector((s) => s.wishlist.items);
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const { removeFavorite } = useWishlistActions();

  if (!user) {
    return (
      <PageShell title={t('wishlist.title')}>
        <div className="text-center py-10">
          <p className="text-white/60 mb-4">{t('wishlist.loginRequired')}</p>
          <Link to="/login" className="text-mint-400 hover:underline">{t('nav.login')} →</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={t('wishlist.title')}>
      {items.length === 0 ? (
        <p className="text-center text-white/60 py-10">{t('wishlist.empty')}</p>
      ) : (
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
          {items.map((product) => (
            <div key={product.id} className="card-elegant p-6 flex gap-4 relative overflow-hidden">
              <img src={product.primaryImageUrl} alt={product.name} className="w-24 h-24 object-contain rounded-xl bg-plum-900/30" />
              <div className="flex-1">
                <Link to={`/product/${product.slug}`} className="font-medium hover:text-mint-400 transition-colors">
                  {product.name}
                </Link>
                <p className="text-mint-400 font-semibold mt-1">
                  {t('common.currency')} {product.minPrice.toFixed(2)}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      const v = product.variants?.[0];
                      if (v) {
                        dispatch(
                          addToCart({
                            productId: product.id,
                            variantId: v.id,
                            name: product.name,
                            imageUrl: product.primaryImageUrl,
                            volumeMl: v.volumeMl,
                            price: v.price,
                            quantity: 1,
                            categorySlug: product.categorySlug,
                          })
                        );
                      }
                    }}
                    className="flex items-center gap-1 text-xs btn-primary px-3 py-1.5"
                  >
                    <ShoppingCart size={14} /> {t('wishlist.addToCart')}
                  </button>
                  <button
                    onClick={() => removeFavorite(product.id)}
                    className="text-xs text-white/40 hover:text-red-400 transition-colors"
                  >
                    {t('wishlist.remove')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
