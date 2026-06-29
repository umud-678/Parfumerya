import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle, RefreshCw, Search, Trash2, Users } from 'lucide-react';
import { formatUserRole, isAdminRole } from '../utils/azLabels';
import {
  blockUser,
  deleteUser,
  getUsers,
  unblockUser,
  type AdminUser,
} from '../services/users';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

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
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        formatUserRole(u.roles).toLowerCase().includes(q)
    );
  }, [users, search]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => !u.isBlocked).length,
      blocked: users.filter((u) => u.isBlocked).length,
      customers: users.filter((u) => formatUserRole(u.roles) === 'Müştəri').length,
    }),
    [users]
  );

  const handleBlockToggle = async (user: AdminUser) => {
    setActionId(user.id);
    setError('');
    try {
      if (user.isBlocked) {
        await unblockUser(user.id);
      } else {
        await blockUser(user.id);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Əməliyyat uğursuz oldu');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionId(deleteTarget.id);
    setError('');
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinmə uğursuz oldu');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-mint-400 flex items-center gap-2">
            <Users size={28} />
            İstifadəçilər
          </h1>
          <p className="text-white/45 text-sm mt-2">
            Müştəri və admin hesablarını idarə edin — bloklayın, blokdan çıxarın və ya silin.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-mint-400 border border-mint-400/30 px-4 py-2 rounded-full hover:bg-mint-400/10"
        >
          <RefreshCw size={14} />
          Yenilə
        </button>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <StatCard label="Ümumi" value={stats.total} />
        <StatCard label="Aktiv" value={stats.active} accent />
        <StatCard label="Bloklanmış" value={stats.blocked} />
        <StatCard label="Müştəri" value={stats.customers} />
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ad, e-poçt və ya rol axtar..."
          className="w-full bg-plum-900/80 border border-plum-700 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-mint-400/50"
        />
      </div>

      {error && (
        <div className="card-admin border border-red-500/30 text-red-300 text-sm p-4">{error}</div>
      )}

      <div className="card-admin overflow-x-auto">
        {loading ? (
          <p className="text-white/40 text-center py-10">Yüklənir...</p>
        ) : filtered.length === 0 ? (
          <p className="text-white/40 text-center py-10">
            {search ? 'Axtarışa uyğun istifadəçi tapılmadı.' : 'Hələ istifadəçi yoxdur.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 border-b border-plum-700/30">
                <th className="text-left py-3 px-2">Ad</th>
                <th className="text-left py-3 px-2">E-poçt</th>
                <th className="text-left py-3 px-2">Telefon</th>
                <th className="text-left py-3 px-2">Rol</th>
                <th className="text-left py-3 px-2">Vəziyyət</th>
                <th className="text-left py-3 px-2">Qeydiyyat</th>
                <th className="text-right py-3 px-2">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const role = formatUserRole(user.roles);
                const isAdmin = isAdminRole(user.roles);
                const busy = actionId === user.id;

                return (
                  <tr key={user.id} className="border-b border-plum-700/20 hover:bg-plum-800/20">
                    <td className="py-3 px-2 font-medium">{user.fullName}</td>
                    <td className="py-3 px-2 text-white/60">{user.email}</td>
                    <td className="py-3 px-2 text-white/50">{user.phone || '—'}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          isAdmin ? 'bg-mint-400/15 text-mint-400' : 'bg-plum-800 text-white/70'
                        }`}
                      >
                        {role}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {user.isBlocked ? (
                        <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                          <Ban size={12} /> Bloklanmış
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-mint-400 text-xs">
                          <CheckCircle size={12} /> Aktiv
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-white/40 text-xs">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('az-AZ')
                        : '—'}
                    </td>
                    <td className="py-3 px-2 text-right whitespace-nowrap">
                      <button
                        disabled={busy}
                        onClick={() => handleBlockToggle(user)}
                        className={`mr-3 text-xs disabled:opacity-50 ${
                          user.isBlocked
                            ? 'text-mint-400 hover:text-mint-300'
                            : 'text-amber-400 hover:text-amber-300'
                        }`}
                      >
                        {user.isBlocked ? 'Blokdan çıxart' : 'Blok et'}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => setDeleteTarget(user)}
                        className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-red-400 disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        Sil
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="card-admin max-w-md w-full p-6 space-y-4">
            <h2 className="font-serif text-xl text-white">İstifadəçini sil</h2>
            <p className="text-white/60 text-sm">
              <span className="text-white">{deleteTarget.fullName}</span> ({deleteTarget.email})
              hesabını tamamilə silmək istəyirsiniz? Bu əməliyyat geri qaytarıla bilməz.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-white/60 hover:text-white"
              >
                Ləğv et
              </button>
              <button
                onClick={handleDelete}
                disabled={actionId === deleteTarget.id}
                className="px-4 py-2 text-sm bg-red-500/20 text-red-300 border border-red-500/30 rounded-full hover:bg-red-500/30 disabled:opacity-50"
              >
                {actionId === deleteTarget.id ? 'Silinir...' : 'Bəli, sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="card-admin p-4">
      <p className={`text-2xl font-serif ${accent ? 'text-mint-400' : 'text-white'}`}>{value}</p>
      <p className="text-white/40 text-xs mt-1">{label}</p>
    </div>
  );
}
