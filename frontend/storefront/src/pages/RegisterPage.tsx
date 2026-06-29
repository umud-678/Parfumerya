import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../store/hooks';
import { store } from '../store/store';
import { setUser } from '../store/authSlice';
import { register } from '../services/auth';
import { syncWishlistAfterAuth } from '../services/wishlist';
import { FloralDecor } from '../components/ui/FloralDecor';

export default function RegisterPage() {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(fullName, email, password);
      dispatch(setUser(user));
      await syncWishlistAfterAuth(dispatch, store.getState().wishlist.items);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center px-6">
      <FloralDecor variant="page" />
      <div className="card-elegant p-10 w-full max-w-md relative">
        <div className="text-center mb-8">
          <span className="text-2xl text-mint-400/40">✿</span>
          <h1 className="font-serif text-3xl text-mint-400 mt-2">{t('auth.register')}</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder={t('auth.fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full bg-plum-900/80 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-mint-400/50" />
          <input type="email" placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-plum-900/80 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-mint-400/50" />
          <input type="password" placeholder={t('auth.passwordHint')} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full bg-plum-900/80 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-mint-400/50" />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full btn-primary py-3 disabled:opacity-60">
            {loading ? t('auth.registering') : t('auth.register')}
          </button>
        </form>
        <p className="text-center text-white/50 text-sm mt-6">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-mint-400 hover:underline">{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  );
}
