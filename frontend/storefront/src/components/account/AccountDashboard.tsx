import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User, ShoppingCart, Heart, Package, LogOut, ChevronRight, Trash2, Bell,
} from 'lucide-react';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type CustomerNotification,
} from '../../services/customerNotifications';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout, updateUserProfile } from '../../store/authSlice';
import { removeFromCart, updateQuantity } from '../../store/cartSlice';
import { useWishlistActions } from '../../hooks/useWishlistActions';
import { getMyOrders, type Order } from '../../services/orders';
import { getMyProfile, updateProfile } from '../../services/auth';
import OrderStatusTimeline from './OrderStatusTimeline';

type Tab = 'overview' | 'orders' | 'cart' | 'wishlist' | 'profile';

const dateLocales: Record<string, string> = {
  az: 'az-AZ',
  en: 'en-US',
  ru: 'ru-RU',
};

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  Confirmed: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Shipped: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  Delivered: 'bg-accent/15 text-accent border-accent/30',
  Cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
};

export default function AccountDashboard() {
  const { t, i18n } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const cartItems = useAppSelector((s) => s.cart.items);
  const wishlistItems = useAppSelector((s) => s.wishlist.items);
  const dispatch = useAppDispatch();
  const { removeFavorite } = useWishlistActions();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as Tab) || 'overview';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '', phone: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);

  const userId = user?.userId;

  useEffect(() => {
    if (!user) navigate('/login', { state: { from: '/account' } });
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone ?? '',
    });
  }, [userId, user?.fullName, user?.email, user?.phone]);

  useEffect(() => {
    if (!userId) return;
    getMyProfile()
      .then((p) => {
        setProfileForm({ fullName: p.fullName, email: p.email, phone: p.phone ?? '' });
        dispatch(updateUserProfile({ fullName: p.fullName, email: p.email, phone: p.phone ?? '' }));
      })
      .catch(() => {});
  }, [userId, dispatch]);

  const loadOrders = useCallback(() => {
    if (!userId) return;
    getMyOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setLoadingOrders(true);
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [userId, loadOrders]);

  const loadNotifications = useCallback(() => {
    if (!userId) return;
    getMyNotifications()
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 12000);
    return () => clearInterval(interval);
  }, [userId, loadNotifications]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    setProfileMessage('');
    setProfileError('');
    try {
      const updated = await updateProfile(profileForm);
      dispatch(updateUserProfile({
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
        accessToken: updated.accessToken || user.accessToken,
      }));
      setProfileMessage(t('account.profileSaved'));
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : t('account.profileError'));
    } finally {
      setProfileSaving(false);
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.isRead).length;
  const locale = dateLocales[i18n.language] ?? 'az-AZ';
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => ['Pending', 'Confirmed', 'Shipped'].includes(o.status)).length;
    const delivered = orders.filter((o) => o.status === 'Delivered').length;
    const totalSpent = orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((s, o) => s + o.totalAmount, 0);
    return { total: orders.length, pending, delivered, totalSpent };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'active') {
      return orders.filter((o) => ['Pending', 'Confirmed', 'Shipped'].includes(o.status));
    }
    if (orderFilter === 'delivered') return orders.filter((o) => o.status === 'Delivered');
    if (orderFilter === 'cancelled') return orders.filter((o) => o.status === 'Cancelled');
    return orders;
  }, [orders, orderFilter]);

  const setTab = (next: Tab) => setSearchParams({ tab: next });

  if (!user) return null;

  const tabs: { id: Tab; label: string; icon: typeof User; badge?: number }[] = [
    { id: 'overview', label: t('account.tabs.overview'), icon: User },
    { id: 'orders', label: t('account.tabs.orders'), icon: Package, badge: (stats.pending + unreadNotifications) || undefined },
    { id: 'cart', label: t('account.tabs.cart'), icon: ShoppingCart, badge: cartItems.length || undefined },
    { id: 'wishlist', label: t('account.tabs.wishlist'), icon: Heart, badge: wishlistItems.length || undefined },
    { id: 'profile', label: t('account.tabs.profile'), icon: User },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-14">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-accent/15 text-accent flex items-center justify-center ring-2 ring-accent/20">
            <User size={26} />
          </div>
          <div>
            <p className="text-white/45 text-sm">{t('account.welcome')}</p>
            <h1 className="font-serif text-2xl md:text-3xl text-white">{user.fullName}</h1>
          </div>
        </div>
        <button
          onClick={() => {
            dispatch(logout());
            navigate('/');
          }}
          className="flex items-center gap-2 text-white/40 hover:text-red-400 text-sm transition-colors"
        >
          <LogOut size={16} /> {t('account.logout')}
        </button>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        {/* Sidebar tabs */}
        <nav className="flex lg:flex-col gap-2 overflow-x-auto scrollbar-hide pb-2 lg:pb-0">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm whitespace-nowrap transition-all duration-300 ${
                tab === id
                  ? 'bg-accent/15 text-accent border border-accent/25'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1 text-left">{label}</span>
              {badge != null && badge > 0 && (
                <span className="bg-accent text-plum-950 text-[10px] font-bold rounded-full px-1.5 min-w-[1.1rem]">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="min-w-0">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: t('account.stats.orders'), value: stats.total },
                  { label: t('account.stats.pending'), value: stats.pending },
                  { label: t('account.stats.delivered'), value: stats.delivered },
                  { label: t('account.stats.spent'), value: `${t('common.currency')} ${stats.totalSpent.toFixed(2)}` },
                ].map((s) => (
                  <div key={s.label} className="product-card p-5 text-center">
                    <p className="text-2xl font-serif text-accent">{s.value}</p>
                    <p className="text-white/45 text-xs mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {notifications.length > 0 && (
                <div className="product-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif text-lg text-accent flex items-center gap-2">
                      <Bell size={18} />
                      {t('notifications.title')}
                      {unreadNotifications > 0 && (
                        <span className="text-[10px] bg-red-500 text-white rounded-full px-2 py-0.5">
                          {unreadNotifications}
                        </span>
                      )}
                    </h2>
                    {unreadNotifications > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllNotificationsRead().then(loadNotifications)}
                        className="text-xs text-accent/70 hover:text-accent"
                      >
                        {t('notifications.markAllRead')}
                      </button>
                    )}
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {notifications.slice(0, 8).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          if (!n.isRead) markNotificationRead(n.id).then(loadNotifications);
                          setTab('orders');
                        }}
                        className={`w-full text-left rounded-xl p-3 border transition-colors ${
                          n.isRead
                            ? 'border-white/5 bg-white/[0.02]'
                            : n.status === 'Cancelled'
                              ? 'border-red-500/30 bg-red-500/5'
                              : 'border-accent/20 bg-accent/5'
                        }`}
                      >
                        <div className="flex justify-between gap-2">
                          <p className="font-medium text-sm">{n.title}</p>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />}
                        </div>
                        <p className="text-white/50 text-xs mt-1">{n.message}</p>
                        <p className="text-white/30 text-[10px] mt-1">
                          {new Date(n.createdAt).toLocaleString(locale)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => setTab('cart')}
                  className="product-card p-6 text-left hover:border-accent/20 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <ShoppingCart className="text-accent" size={22} />
                    <ChevronRight size={18} className="text-white/30 group-hover:text-accent" />
                  </div>
                  <p className="font-medium mt-3">{t('account.tabs.cart')}</p>
                  <p className="text-white/45 text-sm mt-1">
                    {cartItems.length > 0
                      ? t('account.cartSummary', { count: cartItems.length, total: cartTotal.toFixed(2) })
                      : t('cart.empty')}
                  </p>
                </button>
                <button
                  onClick={() => setTab('wishlist')}
                  className="product-card p-6 text-left hover:border-accent/20 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <Heart className="text-accent" size={22} />
                    <ChevronRight size={18} className="text-white/30 group-hover:text-accent" />
                  </div>
                  <p className="font-medium mt-3">{t('account.tabs.wishlist')}</p>
                  <p className="text-white/45 text-sm mt-1">
                    {wishlistItems.length > 0
                      ? t('account.wishlistSummary', { count: wishlistItems.length })
                      : t('wishlist.empty')}
                  </p>
                </button>
              </div>

              {orders.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif text-xl text-accent">{t('account.recentOrders')}</h2>
                    <button onClick={() => setTab('orders')} className="text-accent/70 text-sm hover:text-accent">
                      {t('account.viewAll')} →
                    </button>
                  </div>
                  <div className="space-y-4">
                    {orders.slice(0, 2).map((order) => (
                      <OrderCard key={order.id} order={order} locale={locale} compact />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'orders' && (
            <div className="space-y-5">
              <h2 className="font-serif text-2xl text-accent">{t('account.tabs.orders')}</h2>
              <div className="flex flex-wrap gap-2">
                {(['all', 'active', 'delivered', 'cancelled'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setOrderFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-xs border transition-all ${
                      orderFilter === f
                        ? 'border-accent/40 text-accent bg-accent/10'
                        : 'border-white/10 text-white/50 hover:border-accent/20'
                    }`}
                  >
                    {t(`account.filters.${f}`)}
                  </button>
                ))}
              </div>
              {loadingOrders ? (
                <p className="text-white/40">{t('orders.loading')}</p>
              ) : filteredOrders.length === 0 ? (
                <div className="product-card p-10 text-center text-white/45">
                  {t('orders.empty')}
                  <Link to="/shop" className="block text-accent mt-3 hover:underline">{t('cart.startShopping')}</Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredOrders.map((order) => (
                    <OrderCard key={order.id} order={order} locale={locale} />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'cart' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl text-accent">{t('account.tabs.cart')}</h2>
                {cartItems.length > 0 && (
                  <Link to="/checkout" className="btn-primary px-5 py-2 text-sm">{t('cart.checkout')}</Link>
                )}
              </div>
              {cartItems.length === 0 ? (
                <div className="product-card p-10 text-center text-white/45">
                  {t('cart.empty')}
                  <Link to="/shop" className="block text-accent mt-3">{t('cart.startShopping')} →</Link>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.variantId} className="product-card p-4 flex gap-4 items-center">
                        <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-contain rounded-xl bg-plum-950/50" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-white/40 text-xs">{item.volumeMl} ml</p>
                          <p className="text-accent font-semibold text-sm mt-1">
                            {t('common.currency')} {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-plum-950/50 rounded-full px-2 py-1 text-sm">
                          <button onClick={() => dispatch(updateQuantity({ variantId: item.variantId, quantity: item.quantity - 1 }))} className="px-2 hover:text-accent">−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => dispatch(updateQuantity({ variantId: item.variantId, quantity: item.quantity + 1 }))} className="px-2 hover:text-accent">+</button>
                        </div>
                        <button onClick={() => dispatch(removeFromCart(item.variantId))} className="text-white/30 hover:text-red-400 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="product-card p-5 flex justify-between items-center">
                    <span className="text-white/60">{t('cart.total')}</span>
                    <span className="text-accent font-bold text-xl">{t('common.currency')} {cartTotal.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'wishlist' && (
            <div className="space-y-5">
              <h2 className="font-serif text-2xl text-accent">{t('account.tabs.wishlist')}</h2>
              {wishlistItems.length === 0 ? (
                <div className="product-card p-10 text-center text-white/45">{t('wishlist.empty')}</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {wishlistItems.map((product) => (
                    <div key={product.id} className="product-card p-4 flex gap-3">
                      <img src={product.primaryImageUrl} alt={product.name} className="w-20 h-20 object-contain rounded-xl bg-plum-950/40" />
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${product.slug}`} className="font-medium hover:text-accent line-clamp-2">{product.name}</Link>
                        <p className="text-accent font-semibold mt-1">{t('common.currency')} {product.minPrice.toFixed(2)}</p>
                        <button
                          onClick={() => removeFavorite(product.id)}
                          className="text-xs text-white/35 hover:text-red-400 mt-2"
                        >
                          {t('wishlist.remove')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'profile' && (
            <div className="space-y-5">
              <h2 className="font-serif text-2xl text-accent">{t('account.tabs.profile')}</h2>
              <form onSubmit={handleProfileSave} className="product-card p-8 space-y-5">
                <div>
                  <label className="text-white/40 text-sm">{t('account.name')}</label>
                  <input
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    required
                    className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-accent/50"
                  />
                </div>
                <div>
                  <label className="text-white/40 text-sm">{t('account.email')}</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    required
                    className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-accent/50"
                  />
                </div>
                <div>
                  <label className="text-white/40 text-sm">{t('account.phone')}</label>
                  <input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder={t('account.phonePlaceholder')}
                    className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-accent/50"
                  />
                </div>
                {profileMessage && <p className="text-accent text-sm">{profileMessage}</p>}
                {profileError && <p className="text-red-400 text-sm">{profileError}</p>}
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
                >
                  {profileSaving ? t('account.saving') : t('account.saveProfile')}
                </button>
                <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-serif text-accent">{stats.total}</p>
                    <p className="text-white/40 text-xs">{t('account.stats.orders')}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-serif text-accent">{t('common.currency')} {stats.totalSpent.toFixed(0)}</p>
                    <p className="text-white/40 text-xs">{t('account.stats.spent')}</p>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  locale,
  compact = false,
}: {
  order: Order;
  locale: string;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const statusClass = statusColors[order.status] ?? 'bg-plum-800 text-white/60 border-white/10';

  return (
    <div className="product-card p-6">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
        <div>
          <p className="font-medium text-accent">{order.orderNumber}</p>
          <p className="text-white/40 text-sm">
            {new Date(order.createdAt).toLocaleDateString(locale, {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border ${statusClass}`}>
          {t(`orders.status.${order.status}`)}
        </span>
      </div>

      {!compact && order.shippingAddress && (
        <p className="text-white/40 text-xs mb-3">
          {t('account.shippingAddress')}: {order.shippingAddress}, {order.shippingCity}
          {order.deliveryType && (
            <span className="block text-mint-400/70 mt-0.5">
              {order.deliveryType === 'express' ? t('checkout.deliveryExpress') : t('checkout.deliveryStandard')}
            </span>
          )}
        </p>
      )}

      <div className="space-y-1">
        {(compact ? order.items.slice(0, 2) : order.items).map((item, i) => (
          <div key={i} className="flex justify-between text-sm text-white/70">
            <span>{item.productName} × {item.quantity}</span>
            <span>{t('common.currency')} {item.totalPrice.toFixed(2)}</span>
          </div>
        ))}
        {compact && order.items.length > 2 && (
          <p className="text-white/30 text-xs">+{order.items.length - 2} {t('account.moreItems')}</p>
        )}
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
        {order.discountAmount > 0 && (
          <span className="text-accent/70 text-xs">
            −{t('common.currency')} {order.discountAmount.toFixed(2)}
            {order.couponCode && ` (${order.couponCode})`}
          </span>
        )}
        <span className="font-bold text-accent ml-auto">{t('common.currency')} {order.totalAmount.toFixed(2)}</span>
      </div>

      {!compact && (
        <OrderStatusTimeline
          status={order.status}
          statusHistory={order.statusHistory}
          locale={locale}
        />
      )}

      {!compact && order.status === 'Delivered' && (
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2">
          {order.items
            .filter((item) => item.productSlug)
            .map((item, i) => (
              <Link
                key={`${item.productSlug}-${i}`}
                to={`/product/${item.productSlug}?review=1`}
                className="text-xs px-3 py-1.5 rounded-full border border-gold-400/30 text-gold-300 hover:bg-gold-400/10 transition-colors"
              >
                ★ {t('reviews.writeFor', { name: item.productName })}
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
