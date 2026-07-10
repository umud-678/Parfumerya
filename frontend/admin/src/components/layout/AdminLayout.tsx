import { useEffect, useState } from 'react';
import { NavLink, Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, FolderTree, Tag, ShoppingBag, Users,
  MessageSquare, BarChart3, Percent, CreditCard, Bell,
  Settings, Shield, Warehouse, Heart, LogOut, Store, Film, Menu, X,
} from 'lucide-react';
import { getUnreadCount } from '../../services/orders';
import { getSettings } from '../../services/settings';

import { STOREFRONT_URL } from '../../config/env';

const menuItems = [
  { to: '/', icon: LayoutDashboard, label: 'İdarə paneli' },
  { to: '/products', icon: Package, label: 'Məhsullar' },
  { to: '/categories', icon: FolderTree, label: 'Kateqoriyalar' },
  { to: '/brands', icon: Tag, label: 'Brendlər' },
  { to: '/orders', icon: ShoppingBag, label: 'Sifarişlər' },
  { to: '/users', icon: Users, label: 'İstifadəçilər' },
  { to: '/reviews', icon: MessageSquare, label: 'Rəylər' },
  { to: '/reports', icon: BarChart3, label: 'Hesabatlar' },
  { to: '/coupons', icon: Percent, label: 'Kampaniyalar' },
  { to: '/payments', icon: CreditCard, label: 'Ödəniş' },
  { to: '/notifications', icon: Bell, label: 'Bildirişlər', badge: true },
  { to: '/hero-video', icon: Film, label: 'Ana səhifə videosu' },
  { to: '/stock', icon: Warehouse, label: 'Stok' },
  { to: '/wishlist', icon: Heart, label: 'Sevimlilər' },
  { to: '/settings', icon: Settings, label: 'Ayarlar' },
  { to: '/security', icon: Shield, label: 'Təhlükəsizlik' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('admin_token');
  const [unread, setUnread] = useState(0);
  const [siteName, setSiteName] = useState('Amoria');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    getSettings().then((s) => setSiteName(s.siteName || 'Amoria')).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const poll = () => getUnreadCount().then(setUnread).catch(() => setUnread(0));
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  if (!token) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen min-h-dvh">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Menunu bağla"
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-plum-700/30 bg-plum-900 transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-plum-700/30 p-4 sm:p-6">
          <div className="min-w-0">
            <h1 className="truncate font-serif text-lg sm:text-xl text-mint-400">{siteName}</h1>
            <p className="text-white/40 text-xs mt-1">Admin paneli</p>
          </div>
          <button
            type="button"
            aria-label="Menunu bağla"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-white/50 hover:bg-plum-800 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 sm:p-4">
          {menuItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {badge && unread > 0 && (
                <span className="bg-mint-400 text-plum-900 text-[10px] font-bold rounded-full px-1.5 min-w-[1.25rem] text-center shrink-0">
                  {unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <a
          href={STOREFRONT_URL}
          className="sidebar-link mx-3 sm:mx-4 mb-2 bg-mint-400/10 border border-mint-400/30 text-mint-400 hover:bg-mint-400/20"
        >
          <Store size={18} /> Sayta keç
        </a>
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-link m-3 sm:m-4 text-red-400/70 hover:text-red-400"
        >
          <LogOut size={18} /> Çıxış
        </button>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-plum-700/30 bg-plum-950/90 px-4 py-3 backdrop-blur sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              aria-label="Menunu aç"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-plum-700/50 p-2.5 text-white/70 hover:bg-plum-800 hover:text-mint-400 lg:hidden shrink-0"
            >
              <Menu size={20} />
            </button>
            <p className="truncate text-sm text-white/50">
              <span className="hidden sm:inline">{siteName} — </span>İdarəetmə Paneli
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {unread > 0 && (
              <NavLink
                to="/notifications"
                className="flex items-center gap-1.5 rounded-full border border-mint-400/25 px-2.5 py-1.5 text-mint-400 text-xs hover:bg-mint-400/10 sm:gap-2 sm:border-0 sm:px-0 sm:py-0 sm:text-sm sm:hover:bg-transparent sm:hover:underline"
              >
                <Bell size={16} />
                <span className="hidden sm:inline">{unread} yeni</span>
              </NavLink>
            )}
            <a
              href={STOREFRONT_URL}
              className="flex items-center gap-1.5 rounded-full bg-mint-400 px-3 py-2 text-xs font-semibold text-plum-900 transition-colors hover:bg-mint-300 sm:gap-2 sm:px-4 sm:text-sm"
            >
              <Store size={16} />
              <span className="hidden sm:inline">Sayta keç</span>
            </a>
          </div>
        </header>

        <div className="admin-content p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
