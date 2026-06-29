import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, ShoppingCart, Heart, Minus, Plus } from 'lucide-react';
import { getProductBySlug } from '../services/catalog';
import type { Product } from '../types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToCart } from '../store/cartSlice';
import { useWishlistActions } from '../hooks/useWishlistActions';
import { FloralDecor } from '../components/ui/FloralDecor';

export default function ProductDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { toggleFavorite } = useWishlistActions();
  const isWishlisted = useAppSelector((s) =>
    s.wishlist.items.some((p) => p.slug === slug)
  );

  const [product, setProduct] = useState<Product | undefined>();
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getProductBySlug(slug).then((p) => {
      setProduct(p);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="relative min-h-[40vh] flex items-center justify-center">
        <FloralDecor variant="page" />
        <p className="relative text-white/60">{t('product.loading')}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="relative min-h-[40vh] flex items-center justify-center">
        <FloralDecor variant="page" />
        <p className="relative text-white/60">{t('product.notFound')}</p>
      </div>
    );
  }

  const variant = product.variants?.[0];

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login', { state: { from: `/product/${slug}` } });
      return;
    }
    if (!variant) return;
    dispatch(
      addToCart({
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        imageUrl: product.primaryImageUrl,
        volumeMl: variant.volumeMl,
        price: variant.price,
        quantity,
        categorySlug: product.categorySlug,
      })
    );
    navigate('/cart');
  };

  return (
    <div className="relative">
      <FloralDecor variant="page" />
      <div className="relative max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-2 gap-12">
        <div className="card-elegant p-8 flex items-center justify-center relative overflow-hidden">
          <FloralDecor variant="corner" className="top-4 right-4" />
          <img
            src={product.primaryImageUrl}
            alt={product.name}
            className="max-h-[480px] object-contain relative z-10"
          />
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-mint-400 text-sm mb-2 tracking-wide uppercase">{product.brandName}</p>
            <h1 className="font-serif text-4xl mb-2">{product.name}</h1>
            {product.averageRating && (
              <div className="flex items-center gap-1 text-mint-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.round(product.averageRating!) ? 'fill-mint-400' : ''}
                  />
                ))}
                <span className="text-white/50 text-sm ml-2">{product.averageRating}</span>
              </div>
            )}
          </div>

          <p className="text-3xl font-semibold text-mint-400">
            {t('common.currency')} {product.minPrice.toFixed(2)}
          </p>

          {variant && (
            <div className="flex gap-3">
              <span className="rounded-full border border-mint-400/50 text-mint-400 px-4 py-2 text-sm bg-mint-400/5">
                {variant.volumeMl} ml
              </span>
            </div>
          )}

          <p className="text-white/60 leading-relaxed">
            {product.description || t('product.description')}
          </p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-plum-900/50 rounded-full px-4 py-2 border border-plum-700">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="hover:text-mint-400">
                <Minus size={16} />
              </button>
              <span className="w-8 text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="hover:text-mint-400">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-2 btn-primary px-8 py-3"
            >
              <ShoppingCart size={18} />
              {t('product.addToCart')}
            </button>
            <button
              onClick={() => {
                if (!user) navigate('/login', { state: { from: `/product/${slug}` } });
                else toggleFavorite(product);
              }}
              className={`flex items-center gap-2 border rounded-full px-8 py-3 transition-colors ${
                isWishlisted
                  ? 'border-mint-400 text-mint-400 bg-mint-400/10'
                  : 'border-white/20 hover:border-mint-400/50'
              }`}
            >
              <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              {t('product.favorite')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
