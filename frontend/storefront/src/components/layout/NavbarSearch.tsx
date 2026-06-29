import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import { getProducts } from '../../services/catalog';
import type { Product } from '../../types';

const DEBOUNCE_MS = 220;
const RESULT_LIMIT = 8;

export default function NavbarSearch({
  className = '',
  inputClassName = '',
  wide = false,
}: {
  className?: string;
  inputClassName?: string;
  wide?: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debounced) {
      setResults([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getProducts({ search: debounced, limit: RESULT_LIMIT })
      .then((r) => {
        if (cancelled) return;
        setResults(r.items);
        setTotalCount(r.totalCount);
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
          setTotalCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    if (!focused) return;
    const closeOnOutside = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('touchstart', closeOnOutside);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('touchstart', closeOnOutside);
    };
  }, [focused]);

  const open = focused && debounced.length > 0;
  const showDropdown = open && (loading || results.length > 0 || debounced.length > 0);

  const goToShop = (term: string) => {
    setFocused(false);
    setQuery('');
    setDebounced('');
    navigate(`/shop?search=${encodeURIComponent(term)}`);
  };

  const pickProduct = (slug: string) => {
    setFocused(false);
    setQuery('');
    setDebounced('');
    navigate(`/product/${slug}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    goToShop(term);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <motion.div
          animate={focused ? { scale: wide ? 1 : 1.02 } : { scale: 1 }}
          className={`search-pill w-full transition-all duration-300 ${focused ? 'search-pill-focus' : ''}`}
        >
          <Search size={15} className="text-white/40 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('nav.search')}
            onFocus={() => setFocused(true)}
            autoComplete="off"
            enterKeyHint="search"
            className={`bg-transparent border-none outline-none text-sm text-white placeholder:text-white/35 flex-1 min-w-0 ${inputClassName}`}
          />
          {loading && debounced && (
            <Loader2 size={14} className="text-accent/70 animate-spin shrink-0" />
          )}
        </motion.div>
      </form>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.99 }}
            transition={{ duration: 0.18 }}
            className={`absolute top-full pt-2 z-[120] ${wide ? 'left-0 right-0' : 'right-0 left-auto w-[min(100vw-2rem,320px)]'}`}
          >
            <div className="nav-dropdown py-2 max-h-[min(70vh,420px)] overflow-y-auto">
              {loading && results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-white/45">{t('nav.searchLoading')}</p>
              ) : results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-white/45">{t('nav.searchNoResults')}</p>
              ) : (
                <>
                  {results.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickProduct(p.slug)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                    >
                      <img
                        src={p.primaryImageUrl}
                        alt=""
                        className="w-10 h-10 rounded-lg object-contain bg-plum-900/50 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white/90 truncate">{p.name}</p>
                        <p className="text-[11px] text-white/40 truncate">{p.brandName}</p>
                      </div>
                      <span className="text-xs text-accent shrink-0">
                        {t('common.currency')} {p.minPrice.toFixed(2)}
                      </span>
                    </button>
                  ))}
                  {totalCount > results.length && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goToShop(debounced)}
                      className="w-full px-4 py-2.5 text-xs text-accent border-t border-white/5 hover:bg-accent/5 transition-colors text-center"
                    >
                      {t('nav.searchAllResults', { count: totalCount })}
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
