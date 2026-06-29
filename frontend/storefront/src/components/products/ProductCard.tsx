import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { Heart, ShoppingCart } from 'lucide-react';
import type { Product } from '../../types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToCart } from '../../store/cartSlice';
import { useWishlistActions } from '../../hooks/useWishlistActions';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toggleFavorite } = useWishlistActions();
  const user = useAppSelector((s) => s.auth.user);
  const isWishlisted = useAppSelector((s) =>
    s.wishlist.items.some((p) => p.id === product.id)
  );

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-30px' });
  const [cartPulse, setCartPulse] = useState(false);

  const variant = product.variants?.[0];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: `/product/${product.slug}` } });
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
        quantity: 1,
        categorySlug: product.categorySlug,
      })
    );
    setCartPulse(true);
    window.setTimeout(() => setCartPulse(false), 600);
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: `/product/${product.slug}` } });
      return;
    }
    await toggleFavorite(product);
  };

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.08, 0.4), ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="product-card block p-8 pb-6 group">
        <Link to={`/product/${product.slug}`} className="block">
          <div className="aspect-[3/4] mb-8 flex items-center justify-center">
            <img
              src={product.primaryImageUrl}
              alt={product.name}
              className="max-h-full max-w-[85%] object-contain transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </div>
        </Link>

        <div className="space-y-3">
          <Link to={`/product/${product.slug}`}>
            <h3 className="text-center text-white/90 text-[15px] font-normal tracking-wide hover:text-accent transition-colors">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center justify-center gap-3">
            <p className="text-accent font-semibold text-xl">
              {t('common.currency')} {product.minPrice.toFixed(1)}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!variant}
                title={t('product.addToCart')}
                aria-label={t('product.addToCart')}
                className={`inline-flex items-center justify-center w-9 h-9 rounded-full border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  cartPulse
                    ? 'border-mint-400 bg-mint-400/20 text-mint-400 scale-110'
                    : 'border-white/15 text-white/60 hover:border-mint-400/50 hover:text-mint-400 hover:bg-mint-400/10'
                }`}
              >
                <ShoppingCart size={16} />
              </button>
              <button
                type="button"
                onClick={handleToggleFavorite}
                title={t('product.favorite')}
                aria-label={t('product.favorite')}
                className={`inline-flex items-center justify-center w-9 h-9 rounded-full border transition-all ${
                  isWishlisted
                    ? 'border-mint-400 bg-mint-400/15 text-mint-400'
                    : 'border-white/15 text-white/60 hover:border-mint-400/50 hover:text-mint-400 hover:bg-mint-400/10'
                }`}
              >
                <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
