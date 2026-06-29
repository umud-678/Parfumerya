import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Store } from 'lucide-react';
import { loginAdmin } from '../services/auth';
import { getSettings } from '../services/settings';

import { STOREFRONT_URL } from '../config/env';

function FlowerIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 2 C11.5 6, 14 5.5, 14.5 8.5 C12.5 9, 12.5 11.5, 10 11 C7.5 11.5, 7.5 9, 5.5 8.5 C6 5.5, 8.5 6, 10 2Z" />
    </svg>
  );
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(true);
  const [siteName, setSiteName] = useState('Amoria');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    getSettings().then((s) => setSiteName(s.siteName || 'Amoria')).catch(() => {});
  }, []);

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    if (token && userStr) {
      try {
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_user', userStr);
        navigate('/', { replace: true });
      } catch {
        setFormOpen(true);
      }
    }
  }, [searchParams, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const auth = await loginAdmin(email.trim(), password);
      localStorage.setItem('admin_token', auth.accessToken);
      localStorage.setItem('admin_user', JSON.stringify(auth));
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş uğursuz oldu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-plum-950 px-6">
      <div className="card-admin w-full max-w-md p-8">
        <button
          type="button"
          onClick={() => setFormOpen((open) => !open)}
          aria-expanded={formOpen}
          className="w-full flex flex-col items-center gap-2 mb-2 group cursor-pointer"
        >
          <FlowerIcon className="w-5 h-5 text-mint-400/50 group-hover:text-mint-400 transition-colors" />
          <span className="font-serif text-3xl text-mint-400 group-hover:text-white transition-colors">
            {siteName}
          </span>
          {!formOpen && (
            <span className="text-white/40 text-sm mt-1">Daxil ol</span>
          )}
        </button>

        <div
          className={`grid transition-all duration-300 ease-out ${
            formOpen ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0 mt-0'
          }`}
        >
          <div className="overflow-hidden">
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="text-center text-white/90 font-serif text-lg mb-2">Daxil ol</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-mint-400/50"
                placeholder="E-poçt"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-mint-400/50"
                placeholder="Şifrə"
              />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-mint-400 text-plum-900 font-semibold py-3 rounded-full disabled:opacity-60"
              >
                {loading ? 'Giriş edilir...' : 'Daxil ol'}
              </button>
            </form>
          </div>
        </div>

        <a
          href={STOREFRONT_URL}
          className="mt-8 w-full flex items-center justify-center gap-2 border border-mint-400/30 text-mint-400 py-3 rounded-full hover:bg-mint-400/10 transition-colors text-sm"
        >
          <Store size={16} />
          Sayta keç
        </a>
      </div>
    </div>
  );
}
