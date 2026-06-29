import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Tag, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateQuantity, removeFromCart } from '../store/cartSlice';
import { validateCoupon } from '../services/orders';
import { getSettings } from '../services/settings';
import { PageShell } from '../components/ui/FloralDecor';

export default function CartPage() {
  const { t } = useTranslation();
  const { items } = useAppSelector((s) => s.cart);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [shippingFee, setShippingFee] = useState(5);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(100);

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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
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

  if (items.length === 0) {
    return (
      <PageShell title={t('cart.title')}>
        <div className="text-center py-10">
          <p className="text-white/60 mb-4 text-lg">{t('cart.empty')}</p>
          <Link to="/shop" className="text-mint-400 hover:underline">{t('cart.startShopping')} →</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={t('cart.title')}>
      <div className="max-w-4xl mx-auto space-y-4 mb-10">
        {items.map((item) => (
          <div key={item.variantId} className="card-elegant p-6 flex gap-6 items-center flex-wrap">
            <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-contain rounded-xl bg-plum-900/30" />
            <div className="flex-1 min-w-[140px]">
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-white/50 text-sm">{item.volumeMl} ml</p>
              <p className="text-mint-400 font-semibold mt-1">{t('common.currency')} {item.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-3 bg-plum-900/50 rounded-full px-3 py-1">
              <button onClick={() => dispatch(updateQuantity({ variantId: item.variantId, quantity: item.quantity - 1 }))} className="p-1 hover:text-mint-400"><Minus size={16} /></button>
              <span>{item.quantity}</span>
              <button onClick={() => dispatch(updateQuantity({ variantId: item.variantId, quantity: item.quantity + 1 }))} className="p-1 hover:text-mint-400"><Plus size={16} /></button>
            </div>
            <button onClick={() => dispatch(removeFromCart(item.variantId))} className="text-white/40 hover:text-red-400 p-2"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>

      <div className="card-elegant p-8 space-y-4 max-w-md mx-auto">
        <div>
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
            <p className={`text-xs mt-2 ${couponApplied ? 'text-mint-400' : 'text-red-400'}`}>{couponMessage}</p>
          )}
        </div>

        <div className="space-y-2 text-sm border-t border-plum-700 pt-4">
          <div className="flex justify-between"><span>{t('checkout.products')}</span><span>{t('common.currency')} {subTotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>{t('checkout.shipping')}</span><span>{t('common.currency')} {shipping.toFixed(2)}</span></div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-mint-400">
              <span>{t('checkout.discount')}</span><span>-{t('common.currency')} {discountAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between text-lg border-t border-plum-700 pt-4">
          <span>{t('cart.total')}</span>
          <span className="text-mint-400 font-bold">{t('common.currency')} {total.toFixed(2)}</span>
        </div>
        <button
          onClick={() => navigate('/checkout', { state: { couponCode: couponApplied ? couponCode : '', discountAmount: couponApplied ? discountAmount : 0 } })}
          className="w-full btn-primary py-3"
        >
          {t('cart.checkout')}
        </button>
      </div>
    </PageShell>
  );
}
