import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../store/hooks';
import { store } from '../store/store';
import { setUser } from '../store/authSlice';
import { login } from '../services/auth';
import { syncWishlistAfterAuth } from '../services/wishlist';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { ADMIN_URL } from '../config/env';

function FlowerIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 2 C11.5 6, 14 5.5, 14.5 8.5 C12.5 9, 12.5 11.5, 10 11 C7.5 11.5, 7.5 9, 5.5 8.5 C6 5.5, 8.5 6, 10 2Z" />
    </svg>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  const { siteName } = useSiteSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      dispatch(setUser(user));
      await syncWishlistAfterAuth(dispatch, store.getState().wishlist.items);
      navigate(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const openAdminLogin = () => {
    window.open(`${ADMIN_URL}/login`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center px-6">
      <div className="card-elegant p-10 w-full max-w-md relative">
        <button
          type="button"
          onClick={openAdminLogin}
          aria-label={t('auth.adminPanel')}
          className="w-full flex flex-col items-center gap-2 mb-8 group cursor-pointer"
        >
          <FlowerIcon className="w-5 h-5 text-accent/50 group-hover:text-accent transition-colors" />
          <span className="font-serif text-3xl text-accent group-hover:text-white transition-colors">
            {siteName || t('common.brandName')}
          </span>
        </button>

        <h1 className="font-serif text-2xl text-center text-white/90 mb-6">{t('auth.login')}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-plum-900/80 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-mint-400/50"
          />
          <input
            type="password"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-plum-900/80 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-mint-400/50"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full btn-primary py-3 disabled:opacity-60">
            {loading ? t('auth.loggingIn') : t('auth.login')}
          </button>
        </form>

        <p className="text-center text-white/50 text-sm mt-6">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-mint-400 hover:underline">{t('auth.register')}</Link>
        </p>
      </div>
    </div>
  );
}
