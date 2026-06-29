import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateQuantity, removeFromCart } from '../store/cartSlice';
import { PageShell } from '../components/ui/FloralDecor';

export default function CartPage() {
  const { t } = useTranslation();
  const { items } = useAppSelector((s) => s.cart);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const subTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

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
        <div className="text-xs text-white/50 space-y-2 p-3 rounded-xl bg-plum-900/40 border border-plum-700/80">
          <p className="text-mint-400/80 font-medium text-sm">{t('checkout.deliveryInfoTitle')}</p>
          <p>⚡ {t('checkout.deliveryExpress')} — {t('common.currency')} 5</p>
          <p>🚇 {t('checkout.deliveryStandard')} — {t('common.currency')} 2</p>
        </div>

        <div className="space-y-2 text-sm border-t border-plum-700 pt-4">
          <div className="flex justify-between"><span>{t('checkout.products')}</span><span>{t('common.currency')} {subTotal.toFixed(2)}</span></div>
          <p className="text-white/40 text-xs pt-1">{t('cart.shippingAtCheckout')}</p>
        </div>

        <div className="flex justify-between text-lg border-t border-plum-700 pt-4">
          <span>{t('cart.subtotal')}</span>
          <span className="text-mint-400 font-bold">{t('common.currency')} {subTotal.toFixed(2)}</span>
        </div>

        <button
          onClick={() => navigate('/checkout')}
          className="w-full btn-primary py-3"
        >
          {t('cart.checkout')}
        </button>
      </div>
    </PageShell>
  );
}
