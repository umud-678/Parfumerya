import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import ProductGrid from '../components/products/ProductGrid';
import { getCategoryBySlug, getProducts } from '../services/catalog';
import type { Category, Product } from '../types';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setProducts([]);

    Promise.all([
      getCategoryBySlug(slug),
      getProducts({ categorySlug: slug, sort: 'newest' }),
    ])
      .then(([cat, result]) => {
        setCategory(cat);
        setProducts(result.items);
      })
      .catch(() => {
        setCategory(null);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={slug}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        <div className="relative border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-12 md:py-14 text-center">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-accent/50 text-xs tracking-[0.3em] uppercase mb-3"
            >
              {t('category.collection')}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-serif text-4xl md:text-5xl text-accent"
            >
              {category?.name ?? slug?.replace(/-/g, ' ')}
            </motion.h1>
            {!loading && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white/40 mt-3 text-sm"
              >
                {t('category.productCount', { count: products.length })}
              </motion.p>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`grid-${slug}-${loading}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProductGrid
              products={products}
              loading={loading}
              emptyMessage={t('category.empty')}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
