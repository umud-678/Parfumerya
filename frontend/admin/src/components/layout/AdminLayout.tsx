import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, FolderTree, Tag, ShoppingBag, Users,
  MessageSquare, BarChart3, Percent, Truck, CreditCard, Bell,
  Settings, Shield, Warehouse, Heart, Mail, LogOut, Store, Film,
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
  { to: '/shipping', icon: Truck, label: 'Çatdırılma' },
  { to: '/payments', icon: CreditCard, label: 'Ödəniş' },
  { to: '/notifications', icon: Bell, label: 'Bildirişlər', badge: true },
  { to: '/hero-video', icon: Film, label: 'Ana səhifə videosu' },
  { to: '/stock', icon: Warehouse, label: 'Stok' },
  { to: '/wishlist', icon: Heart, label: 'Sevimlilər' },
  { to: '/email', icon: Mail, label: 'E-poçt / SMS' },
  { to: '/settings', icon: Settings, label: 'Ayarlar' },
  { to: '/security', icon: Shield, label: 'Təhlükəsizlik' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');
  const [unread, setUnread] = useState(0);
  const [siteName, setSiteName] = useState('Amoria');

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

  if (!token) {
    navigate('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-plum-900 border-r border-plum-700/30 flex flex-col shrink-0">
        <div className="p-6 border-b border-plum-700/30">
          <h1 className="font-serif text-xl text-mint-400">{siteName}</h1>
          <p className="text-white/40 text-xs mt-1">Admin paneli</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {badge && unread > 0 && (
                <span className="bg-mint-400 text-plum-900 text-[10px] font-bold rounded-full px-1.5 min-w-[1.25rem] text-center">
                  {unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <a
          href={STOREFRONT_URL}
          className="sidebar-link mx-4 mb-2 bg-mint-400/10 border border-mint-400/30 text-mint-400 hover:bg-mint-400/20"
        >
          <Store size={18} /> Sayta keç
        </a>
        <button
          onClick={() => {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            navigate('/login');
          }}
          className="sidebar-link m-4 text-red-400/70 hover:text-red-400"
        >
          <LogOut size={18} /> Çıxış
        </button>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-plum-950/90 backdrop-blur border-b border-plum-700/30 px-8 py-4 flex justify-between items-center gap-4">
          <p className="text-white/50 text-sm">{siteName} — İdarəetmə Paneli</p>
          <div className="flex items-center gap-4">
            {unread > 0 && (
              <NavLink to="/notifications" className="text-mint-400 text-sm flex items-center gap-2 hover:underline">
                <Bell size={16} /> {unread} yeni bildiriş
              </NavLink>
            )}
            <a
              href={STOREFRONT_URL}
              className="flex items-center gap-2 text-sm bg-mint-400 text-plum-900 font-semibold px-4 py-2 rounded-full hover:bg-mint-300 transition-colors"
            >
              <Store size={16} />
              Sayta keç
            </a>
          </div>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
