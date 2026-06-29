import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';
import { useAppDispatch } from '../store/hooks';
import { store } from '../store/store';
import { setUser } from '../store/authSlice';
import { login } from '../services/auth';
import { syncWishlistAfterAuth } from '../services/wishlist';
import { FloralDecor } from '../components/ui/FloralDecor';

import { ADMIN_URL } from '../config/env';

export default function LoginPage() {
  const { t } = useTranslation();
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

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center px-6">
      <FloralDecor variant="page" />
      <div className="card-elegant p-10 w-full max-w-md relative">
        <div className="text-center mb-8">
          <span className="text-2xl text-mint-400/40">❀</span>
          <h1 className="font-serif text-3xl text-mint-400 mt-2">{t('auth.login')}</h1>
        </div>
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
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-plum-700/40" /></div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-plum-800/80 px-3 text-white/40">{t('auth.or')}</span>
          </div>
        </div>
        <a
          href={`${ADMIN_URL}/login`}
          className="flex items-center justify-center gap-2 w-full border border-mint-400/30 text-mint-400 font-medium py-3 rounded-full hover:bg-mint-400/10 transition-colors"
        >
          <Shield size={18} /> {t('auth.adminPanel')}
        </a>
      </div>
    </div>
  );
}
