import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductGrid from '../components/products/ProductGrid';
import { PageShell } from '../components/ui/FloralDecor';
import { getProducts } from '../services/catalog';
import type { Product } from '../types';

const DEBOUNCE_MS = 250;

export default function ShopPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'price-desc'>('name');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const categoryFilter = searchParams.get('category');

  useEffect(() => {
    setSearchInput(urlSearch);
    setDebouncedSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    getProducts({
      categorySlug: categoryFilter ?? undefined,
      search: debouncedSearch || undefined,
      sort: sortBy,
    })
      .then((r) => setProducts(r.items))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categoryFilter, debouncedSearch, sortBy]);

  return (
    <PageShell title={t('shop.title')}>
      <div className="flex flex-wrap gap-4 mb-10 max-w-3xl mx-auto">
        <input
          type="search"
          placeholder={t('shop.search')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="bg-plum-800/80 border border-plum-700 rounded-full px-5 py-3 text-sm outline-none focus:border-emerald-400/40 flex-1 min-w-[200px] transition-colors duration-300"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'price-desc')}
          className="bg-plum-800/80 border border-plum-700 rounded-full px-5 py-3 text-sm outline-none focus:border-emerald-400/40"
        >
          <option value="name">{t('shop.sortName')}</option>
          <option value="price">{t('shop.sortPrice')}</option>
          <option value="price-desc">{t('shop.sortPriceDesc')}</option>
        </select>
      </div>

      <ProductGrid products={products} loading={loading} />
    </PageShell>
  );
}
