import { useTranslation } from 'react-i18next';
import type { Product } from '../../types';
import ProductCard from './ProductCard';
import { ProductGridSkeleton } from '../ui/Skeleton';

interface ProductGridProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  loading?: boolean;
  emptyMessage?: string;
}

export default function ProductGrid({
  products,
  title,
  loading = false,
  emptyMessage,
}: ProductGridProps) {
  const { t } = useTranslation();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16 pb-16 sm:pb-20">
      {title && (
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-accent text-center mb-10 sm:mb-14 md:mb-16">
          {title}
        </h2>
      )}

      {loading ? (
        <ProductGridSkeleton count={6} />
      ) : products.length === 0 ? (
        <p className="text-center text-white/40 py-10 sm:py-12 px-2">{emptyMessage ?? t('shop.noProducts')}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-10">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
