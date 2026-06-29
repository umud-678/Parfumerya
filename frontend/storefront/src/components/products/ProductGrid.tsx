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
    <section className="max-w-7xl mx-auto px-6 py-12 md:py-16 pb-20">
      {title && (
        <h2 className="font-serif text-3xl md:text-4xl text-accent text-center mb-14 md:mb-16">
          {title}
        </h2>
      )}

      {loading ? (
        <ProductGridSkeleton count={6} />
      ) : products.length === 0 ? (
        <p className="text-center text-white/40 py-12">{emptyMessage ?? t('shop.noProducts')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
