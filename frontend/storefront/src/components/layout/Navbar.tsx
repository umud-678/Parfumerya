import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, ShoppingCart, ChevronDown, User } from 'lucide-react';
import { useUnreadNotificationCount } from '../CustomerNotificationToasts';
import { useAppSelector } from '../../store/hooks';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { FloralDecor } from '../ui/FloralDecor';
import { getCategories } from '../../services/catalog';
import type { Category } from '../../types';

function NavLinkItem({ to, label, end = false }: { to: string; label: string; end?: boolean }) {
  const location = useLocation();
  const active = end ? location.pathname === to : location.pathname === to;

  return (
    <Link to={to} className={`nav-link-item ${active ? 'nav-link-item-active' : ''}`}>
      {label}
      {active && (
        <motion.span
          layoutId="navbar-active"
          className="absolute -bottom-0.5 left-0 right-0 mx-auto h-[2px] w-full max-w-[2rem] rounded-full bg-accent"
          style={{ boxShadow: '0 0 12px rgba(167, 243, 208, 0.5)' }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );
}

function FlowerIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 2 C11.5 6, 14 5.5, 14.5 8.5 C12.5 9, 12.5 11.5, 10 11 C7.5 11.5, 7.5 9, 5.5 8.5 C6 5.5, 8.5 6, 10 2Z" />
    </svg>
  );
}

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const cartCount = useAppSelector((s) => s.cart.items.reduce((sum, i) => sum + i.quantity, 0));
  const user = useAppSelector((s) => s.auth.user);
  const unreadNotifications = useUnreadNotificationCount();
  const { siteName } = useSiteSettings();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const catMenuRef = useRef<HTMLDivElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setCatOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!catOpen) return;
    const closeOnOutside = (e: MouseEvent | TouchEvent) => {
      if (catMenuRef.current && !catMenuRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('touchstart', closeOnOutside);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('touchstart', closeOnOutside);
    };
  }, [catOpen]);

  const centerLinks = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/shop', label: t('nav.shop') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  const isCategoryActive = (slug: string) => location.pathname === `/category/${slug}`;
  const categoryActive = location.pathname.startsWith('/category/');

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`sticky top-0 z-50 navbar-shell ${scrolled ? 'navbar-shell-scrolled' : ''}`}
    >
      <FloralDecor variant="navbar" />

      <div className="relative max-w-7xl mx-auto px-6 py-3.5 lg:py-4">
        <div className="hidden lg:grid lg:grid-cols-[160px_1fr_auto] items-center gap-6">
          <Link to="/" className="group flex items-center gap-2 shrink-0">
            <motion.span
              whileHover={{ rotate: 12, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="text-accent/40 group-hover:text-accent/70 transition-colors"
            >
              <FlowerIcon className="w-4 h-4" />
            </motion.span>
            <span className="font-serif text-2xl text-white tracking-wide group-hover:text-accent transition-colors duration-300">
              {siteName}
            </span>
          </Link>

          <nav className="flex items-center justify-center gap-7 xl:gap-9">
            {centerLinks.slice(0, 2).map((link) => (
              <NavLinkItem key={link.to} to={link.to} label={link.label} end={link.end} />
            ))}

            <div
              ref={catMenuRef}
              className="relative"
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
            >
              <button
                type="button"
                aria-expanded={catOpen}
                aria-haspopup="true"
                onClick={() => setCatOpen((open) => !open)}
                className={`nav-link-item flex items-center gap-1 ${categoryActive ? 'nav-link-item-active' : ''}`}
              >
                {t('nav.categories')}
                <motion.span animate={{ rotate: catOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <ChevronDown size={14} />
                </motion.span>
              </button>

              <AnimatePresence>
                {catOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-[100]"
                  >
                    <div className="nav-dropdown relative">
                      {categories.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-white/40">{t('shop.noProducts')}</p>
                      ) : (
                      <>
                      <div className="absolute top-2 right-3 opacity-20 pointer-events-none">
                        <FlowerIcon className="w-5 h-5 text-accent" />
                      </div>
                      {categories.map((cat, i) => (
                        <motion.div
                          key={cat.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <Link
                            to={`/category/${cat.slug}`}
                            onClick={() => setCatOpen(false)}
                            className={`flex items-center justify-between px-4 py-2.5 text-sm transition-all duration-200 ${
                              isCategoryActive(cat.slug)
                                ? 'text-accent bg-accent/8'
                                : 'text-white/75 hover:text-accent hover:bg-white/5'
                            }`}
                          >
                            <span>{cat.name}</span>
                            {cat.productCount != null && (
                              <span className="text-[10px] text-white/30">{cat.productCount}</span>
                            )}
                          </Link>
                        </motion.div>
                      ))}
                      </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {centerLinks.slice(2).map((link) => (
              <NavLinkItem key={link.to} to={link.to} label={link.label} />
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2.5">
            <LanguageSwitcher />
            <motion.div
              animate={searchFocused ? { scale: 1.02 } : { scale: 1 }}
              className={`search-pill transition-all duration-300 ${searchFocused ? 'search-pill-focus' : ''}`}
            >
              <Search size={15} className="text-white/40 shrink-0" />
              <input
                type="search"
                placeholder={t('nav.search')}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/35 w-24 xl:w-28"
              />
            </motion.div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/cart')}
              className="cart-pill"
            >
              <ShoppingCart size={17} />
              <span className="hidden xl:inline">{t('nav.cart')}</span>
              <AnimatePresence mode="popLayout">
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="bg-accent text-plum-950 text-[10px] font-bold rounded-full px-1.5 min-w-[1.1rem]"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {user ? (
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/account')}
                className="relative flex items-center gap-1.5 rounded-full border border-accent/30 text-accent px-3 py-2 text-sm hover:bg-accent/10 transition-colors"
              >
                <User size={16} />
                <span className="max-w-[80px] truncate hidden xl:inline">{user.fullName.split(' ')[0]}</span>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[1rem] h-4 px-1 flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </motion.button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex text-sm text-white/75 hover:text-accent transition-colors px-2"
                >
                  {t('nav.login')}
                </Link>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1.5 bg-accent text-plum-950 text-sm font-semibold px-4 py-2 rounded-full hover:brightness-110 transition-all shadow-[0_0_20px_rgba(167,243,208,0.2)]"
                  >
                    {t('nav.register')}
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Mobile header */}
        <div className="flex lg:hidden items-center justify-between gap-3 relative">
          <Link to="/" className="flex items-center gap-1.5">
            <FlowerIcon className="w-3.5 h-3.5 text-accent/50" />
            <span className="font-serif text-xl text-white">{siteName}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {!user && (
              <Link
                to="/register"
                className="text-xs font-semibold bg-accent text-plum-950 px-3 py-1.5 rounded-full"
              >
                {t('nav.register')}
              </Link>
            )}
            {user ? (
              <button
                type="button"
                onClick={() => navigate('/account')}
                className="relative p-1.5 rounded-full border border-accent/30 text-accent"
                aria-label={t('nav.account')}
              >
                <User size={16} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            ) : (
              <Link to="/login" className="text-xs text-white/60 hover:text-accent px-2">
                {t('nav.login')}
              </Link>
            )}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/cart')}
              className="cart-pill py-1.5 px-3 text-xs"
            >
              <ShoppingCart size={16} />
              {cartCount > 0 && <span className="text-accent font-semibold">{cartCount}</span>}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile nav strip with floral hint */}
      <div className="lg:hidden mobile-nav-strip relative px-4 pb-3 pt-1">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-[0.07] pointer-events-none">
          <FlowerIcon className="w-8 h-8 text-accent" />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pl-6">
          {[
            { to: '/', label: t('nav.home') },
            { to: '/shop', label: t('nav.shop') },
            ...categories.map((c) => ({ to: `/category/${c.slug}`, label: c.name })),
          ].map((item) => {
            const active = location.pathname === item.to;
            return (
              <motion.div key={item.to + item.label} whileTap={{ scale: 0.96 }}>
                <Link
                  to={item.to}
                  className={`shrink-0 block px-3.5 py-1.5 rounded-full text-xs border transition-all duration-300 ${
                    active
                      ? 'border-accent/35 text-accent bg-accent/10 shadow-[0_0_16px_rgba(167,243,208,0.12)]'
                      : 'border-white/10 text-white/55 hover:border-accent/20 hover:text-accent/80'
                  }`}
                >
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.header>
  );
}
