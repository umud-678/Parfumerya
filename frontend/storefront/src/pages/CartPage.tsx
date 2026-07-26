import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateQuantity, removeFromCart } from '../store/cartSlice';
import { PageShell } from '../components/ui/FloralDecor';
import { resolveMediaUrl } from '../utils/media';

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
      <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 mb-6 sm:mb-10">
        {items.map((item) => (
          <div key={item.variantId} className="card-elegant p-4 sm:p-6">
            <div className="flex gap-3 sm:gap-6 items-start">
              <img src={resolveMediaUrl(item.imageUrl)} alt={item.name} className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl bg-plum-900/30 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm sm:text-base line-clamp-2">{item.name}</h3>
                <p className="text-white/50 text-xs sm:text-sm">{item.volumeMl} ml</p>
                <p className="text-mint-400 font-semibold mt-1 text-sm sm:text-base">{t('common.currency')} {item.price.toFixed(2)}</p>
              </div>
              <button onClick={() => dispatch(removeFromCart(item.variantId))} className="text-white/40 hover:text-red-400 p-2 touch-target shrink-0" aria-label={t('cart.remove')}>
                <Trash2 size={18} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-plum-700/60">
              <span className="text-white/50 text-xs sm:text-sm">{t('cart.quantity')}</span>
              <div className="flex items-center gap-3 bg-plum-900/50 rounded-full px-3 py-1">
                <button onClick={() => dispatch(updateQuantity({ variantId: item.variantId, quantity: item.quantity - 1 }))} className="p-1.5 hover:text-mint-400 touch-target" aria-label="-"><Minus size={16} /></button>
                <span className="min-w-[1.5rem] text-center">{item.quantity}</span>
                <button onClick={() => dispatch(updateQuantity({ variantId: item.variantId, quantity: item.quantity + 1 }))} className="p-1.5 hover:text-mint-400 touch-target" aria-label="+"><Plus size={16} /></button>
              </div>
              <span className="text-mint-400 font-semibold text-sm">{t('common.currency')} {(item.price * item.quantity).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card-elegant p-5 sm:p-8 space-y-4 max-w-md mx-auto mb-24 sm:mb-0">
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
          className="w-full btn-primary py-3 hidden sm:flex"
        >
          {t('cart.checkout')}
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden mobile-sticky-bar px-4 pt-3 safe-bottom">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-white/45 text-xs">{t('cart.subtotal')}</p>
            <p className="text-mint-400 font-bold text-lg">{t('common.currency')} {subTotal.toFixed(2)}</p>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="btn-primary px-6 py-3 shrink-0 min-h-[44px]"
          >
            {t('cart.checkout')}
          </button>
        </div>
      </div>
    </PageShell>
  );
}
