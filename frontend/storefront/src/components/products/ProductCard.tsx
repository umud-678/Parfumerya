import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { t } = useTranslation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-30px' });

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.08, 0.4), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={`/product/${product.slug}`} className="product-card block p-8 pb-10 group">
        <div className="aspect-[3/4] mb-8 flex items-center justify-center">
          <img
            src={product.primaryImageUrl}
            alt={product.name}
            className="max-h-full max-w-[85%] object-contain transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>
        <h3 className="text-center text-white/90 text-[15px] font-normal mb-3 tracking-wide">
          {product.name}
        </h3>
        <p className="text-center text-accent font-semibold text-xl">
          {t('common.currency')} {product.minPrice.toFixed(1)}
        </p>
      </Link>
    </motion.article>
  );
}
