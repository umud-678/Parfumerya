import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { formatUserRole, isAdminRole } from '../utils/azLabels';
import { getUsers, type AdminUser } from '../services/users';
import { changePassword } from '../services/auth';

export default function SecurityPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setUsers(await getUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İstifadəçilər yüklənmədi');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const roleSummary = useMemo(() => {
    const groups = new Map<string, number>();
    for (const user of users) {
      const role = formatUserRole(user.roles);
      groups.set(role, (groups.get(role) ?? 0) + 1);
    }
    return [...groups.entries()].sort((a, b) => b[1] - a[1]);
  }, [users]);

  const adminUsers = useMemo(
    () => users.filter((u) => isAdminRole(u.roles)),
    [users]
  );

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await changePassword(currentPassword, newPassword);
      setMessage('Şifrə uğurla yeniləndi');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifrə yenilənmədi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-mint-400">Təhlükəsizlik</h1>
      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={handlePasswordChange} className="card-admin space-y-6">
          <div>
            <h2 className="text-mint-400 text-sm mb-3">Şifrə dəyişmə</h2>
            <div className="relative mb-3">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Cari şifrə"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 pr-11 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-mint-400"
                aria-label={showCurrentPassword ? 'Şifrəni gizlət' : 'Şifrəni göstər'}
                aria-pressed={showCurrentPassword}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative mb-3">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Yeni şifrə (min. 8 simvol)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 pr-11 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-mint-400"
                aria-label={showNewPassword ? 'Şifrəni gizlət' : 'Şifrəni göstər'}
                aria-pressed={showNewPassword}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-mint-400 text-plum-900 px-6 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Yenilənir...' : 'Yenilə'}
            </button>
          </div>
          {message && <p className="text-mint-400 text-sm">{message}</p>}
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </form>

        <div className="card-admin space-y-6">
          <div>
            <h2 className="text-mint-400 text-sm mb-3">Rol icazələri (canlı)</h2>
            {loading ? (
              <p className="text-white/40 text-sm">Yüklənir...</p>
            ) : roleSummary.length === 0 ? (
              <p className="text-white/40 text-sm">İstifadəçi yoxdur.</p>
            ) : (
              <ul className="space-y-2">
                {roleSummary.map(([role, count]) => (
                  <li key={role} className="text-white/60 text-sm flex justify-between">
                    <span>{role}</span>
                    <span className="text-mint-400">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="text-mint-400 text-sm mb-3">Admin hesabı</h2>
            {loading ? (
              <p className="text-white/40 text-sm">Yüklənir...</p>
            ) : adminUsers.length === 0 ? (
              <p className="text-white/40 text-sm">Admin hesabı təyin edilməyib.</p>
            ) : (
              <ul className="space-y-2">
                {adminUsers.slice(0, 1).map((u) => (
                  <li key={u.id} className="text-white/60 text-sm">
                    {u.fullName} — {u.email}
                    {u.isBlocked ? (
                      <span className="text-red-400 ml-2">(bloklanmış)</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
