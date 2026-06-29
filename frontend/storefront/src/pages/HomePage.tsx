import { useEffect, useState } from 'react';
import Hero from '../components/home/Hero';
import ProductGrid from '../components/products/ProductGrid';
import { HomeBotanicalSides } from '../components/ui/FloralDecor';
import { getProducts } from '../services/catalog';
import { useTranslation } from 'react-i18next';
import type { Product } from '../types';

export default function HomePage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts({ trending: true, limit: 6 })
      .then((r) => setProducts(r.items))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative">
      <HomeBotanicalSides />
      <div className="relative z-10">
        <Hero />
        <ProductGrid
          products={products}
          title={t('home.productsTitle')}
          loading={loading}
        />
      </div>
    </div>
  );
}
