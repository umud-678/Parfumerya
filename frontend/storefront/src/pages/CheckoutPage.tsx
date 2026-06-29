import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tag } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearCart } from '../store/cartSlice';
import { syncAuthToken, getToken } from '../services/api';
import { createOrder, validateCoupon, type Order } from '../services/orders';
import { getSettings } from '../services/settings';
import { PageShell } from '../components/ui/FloralDecor';

export default function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const cartState = (location.state as { couponCode?: string; discountAmount?: number } | null) ?? {};
  const { items } = useAppSelector((s) => s.cart);
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [orderResult, setOrderResult] = useState<Order | null>(null);
  const [couponCode, setCouponCode] = useState(cartState.couponCode ?? '');
  const [couponMessage, setCouponMessage] = useState('');
  const [discountAmount, setDiscountAmount] = useState(cartState.discountAmount ?? 0);
  const [couponApplied, setCouponApplied] = useState(!!cartState.couponCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shippingFee, setShippingFee] = useState(5);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(100);
  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    phone: user?.phone ?? '',
    address: '',
    city: t('checkout.defaultCity'),
    region: t('checkout.defaultRegion'),
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      city: t('checkout.defaultCity'),
      region: t('checkout.defaultRegion'),
    }));
  }, [t, i18n.language]);

  useEffect(() => {
    getSettings()
      .then((s) => {
        setShippingFee(s.shippingFee ?? 5);
        setFreeShippingThreshold(s.freeShippingThreshold ?? 100);
      })
      .catch(() => {});
  }, []);

  const subTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subTotal >= freeShippingThreshold ? 0 : shippingFee;
  const total = Math.max(0, subTotal + shipping - discountAmount);

  const fieldLabels: Record<keyof typeof form, string> = {
    fullName: t('checkout.fullName'),
    phone: t('checkout.phone'),
    address: t('checkout.address'),
    city: t('checkout.city'),
    region: t('checkout.region'),
  };

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    if (items.length === 0 && !confirmed) {
      navigate('/cart');
    }
  }, [user, items.length, confirmed, navigate]);

  if (!user || (items.length === 0 && !confirmed)) {
    return null;
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setError('');
    try {
      const result = await validateCoupon(couponCode, items);
      if (result.valid && result.discountAmount != null) {
        setDiscountAmount(result.discountAmount);
        setCouponApplied(true);
        setCouponMessage(result.message ?? t('checkout.couponApplied'));
      } else {
        setDiscountAmount(0);
        setCouponApplied(false);
        setCouponMessage(result.message ?? t('checkout.couponInvalid'));
      }
    } catch (err) {
      setCouponMessage(err instanceof Error ? err.message : t('checkout.couponInvalid'));
      setCouponApplied(false);
      setDiscountAmount(0);
    }
  };

  const handleConfirmOrder = async () => {
    syncAuthToken(user?.accessToken);
    if (!getToken()) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    setLoading(true);
    setError('');
    try {
      const order = await createOrder({
        items,
        shippingFullName: form.fullName,
        shippingPhone: form.phone,
        shippingAddress: form.address,
        shippingCity: form.city,
        shippingRegion: form.region,
        couponCode: couponApplied ? couponCode.trim().toUpperCase() : undefined,
      });
      dispatch(clearCart());
      setOrderResult(order);
      setConfirmed(true);
    } catch (err) {
      const authError = err as Error & { status?: number };
      const message = authError.message || t('checkout.orderFailed');
      if (authError.status === 401 || message.includes('Giriş tələb olunur') || /login required/i.test(message)) {
        navigate('/login', { state: { from: '/checkout' } });
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (confirmed && orderResult) {
    return (
      <PageShell title={t('checkout.confirmed')}>
        <div className="max-w-lg mx-auto text-center">
          <div className="card-elegant p-12">
            <div className="w-16 h-16 rounded-full bg-mint-400/20 text-mint-400 flex items-center justify-center mx-auto mb-6 text-2xl">
              ✓
            </div>
            <p className="text-white/60 mb-2">{t('checkout.confirmedMsg')}</p>
            <p className="text-mint-400/90 text-sm mb-4">{t('checkout.paymentOnDeliveryNote')}</p>
            <p className="text-white/60 mb-2">{t('checkout.orderNo')} {orderResult.orderNumber}</p>
            {orderResult.discountAmount > 0 && (
              <p className="text-mint-400 text-sm mb-2">
                {t('checkout.discount')}: -{t('common.currency')} {orderResult.discountAmount.toFixed(2)}
                {orderResult.couponCode && ` (${orderResult.couponCode})`}
              </p>
            )}
            <p className="text-white/60 mb-8">
              {t('checkout.total')}: {t('common.currency')} {orderResult.totalAmount.toFixed(2)}
            </p>
            <button
              onClick={() => navigate('/orders')}
              className="btn-primary px-8 py-3"
            >
              {t('checkout.myOrders')}
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={t('checkout.title')}>
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4 mb-10">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${step >= s ? 'bg-mint-400' : 'bg-plum-700'}`}
            />
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="card-elegant p-8">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-serif text-xl mb-4 text-mint-400/90">{t('checkout.stepAddress')}</h2>
                {(Object.keys(form) as (keyof typeof form)[]).map((field) => (
                  <input
                    key={field}
                    placeholder={fieldLabels[field]}
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className="w-full bg-plum-900/50 border border-plum-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-mint-400/50"
                  />
                ))}
                <button
                  onClick={() => setStep(2)}
                  className="w-full btn-primary py-3 mt-4"
                >
                  {t('checkout.continue')}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-serif text-xl mb-4 text-mint-400/90">{t('checkout.stepSummary')}</h2>
                {items.map((item) => (
                  <div key={item.variantId} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span className="text-mint-400">{t('common.currency')} {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}

                <div className="border-t border-plum-700 pt-4">
                  <label className="text-white/50 text-sm flex items-center gap-2 mb-2">
                    <Tag size={14} /> {t('checkout.promoCode')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponApplied(false);
                        setDiscountAmount(0);
                      }}
                      placeholder={t('checkout.promoPlaceholder')}
                      className="flex-1 bg-plum-900/50 border border-plum-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-mint-400/50"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2.5 rounded-xl border border-mint-400/40 text-mint-400 text-sm hover:bg-mint-400/10"
                    >
                      {t('checkout.applyPromo')}
                    </button>
                  </div>
                  {couponMessage && (
                    <p className={`text-xs mt-2 ${couponApplied ? 'text-mint-400' : 'text-red-400'}`}>
                      {couponMessage}
                    </p>
                  )}
                </div>

                <div className="border-t border-plum-700 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span>{t('checkout.products')}</span><span>{t('common.currency')} {subTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>{t('checkout.shipping')}</span><span>{t('common.currency')} {shipping.toFixed(2)}</span></div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-mint-400">
                      <span>{t('checkout.discount')}</span><span>-{t('common.currency')} {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-mint-400">
                    <span>{t('checkout.total')}</span><span>{t('common.currency')} {total.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-white/50 text-sm mt-4 p-3 rounded-xl bg-plum-900/40 border border-plum-700/80">
                  {t('checkout.paymentOnDeliveryNote')}
                </p>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  onClick={handleConfirmOrder}
                  disabled={loading}
                  className="w-full btn-primary py-3 mt-4 disabled:opacity-60"
                >
                  {loading ? t('checkout.creating') : t('checkout.confirmOrder')}
                </button>
              </div>
            )}
          </div>

          <div className="card-elegant p-8 h-fit">
            <h3 className="font-serif text-lg mb-4">{t('checkout.orderSummary')}</h3>
            <p className="text-3xl font-bold text-mint-400">{t('common.currency')} {total.toFixed(2)}</p>
            <p className="text-white/40 text-sm mt-2">{t('checkout.productsCount', { count: items.length })}</p>
            {couponApplied && (
              <p className="text-mint-400 text-xs mt-2">{t('checkout.promoLabel')}: {couponCode}</p>
            )}
            <p className="text-white/40 text-xs mt-4 pt-4 border-t border-plum-700">
              {t('checkout.paymentOnDeliveryNote')}
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
