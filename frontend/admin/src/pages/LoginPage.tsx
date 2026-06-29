import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import { loginAdmin } from '../services/auth';

import { STOREFRONT_URL } from '../config/env';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('umud9832@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      <div className="card-admin w-full max-w-md">
        <h1 className="font-serif text-2xl text-mint-400 text-center mb-2">Admin girişi</h1>
        <p className="text-white/40 text-sm text-center mb-8">
          Baş admin hesabı ilə daxil olun
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
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
        <a
          href={STOREFRONT_URL}
          className="mt-6 w-full flex items-center justify-center gap-2 border border-mint-400/30 text-mint-400 py-3 rounded-full hover:bg-mint-400/10 transition-colors text-sm"
        >
          <Store size={16} />
          Sayta keç
        </a>
      </div>
    </div>
  );
}
