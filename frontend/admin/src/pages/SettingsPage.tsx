import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSettings, updateSettings, type SiteSettings } from '../services/settings';

function BrandPreview({ name, tagline }: { name: string; tagline?: string }) {
  return (
    <div className="rounded-xl bg-plum-950 border border-plum-700 p-5 space-y-4">
      <p className="text-white/40 text-xs uppercase tracking-wider">Loqo önizləməsi</p>
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-plum-900/80 border border-plum-700/60">
        <svg className="w-4 h-4 text-mint-400/60 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M10 2 C11.5 6, 14 5.5, 14.5 8.5 C12.5 9, 12.5 11.5, 10 11 C7.5 11.5, 7.5 9, 5.5 8.5 C6 5.5, 8.5 6, 10 2Z" />
        </svg>
        <span className="font-serif text-xl text-mint-400">{name || 'Amoria'}</span>
      </div>
      {tagline ? (
        <p className="text-white/50 text-sm pl-1">{tagline}</p>
      ) : (
        <p className="text-white/30 text-xs pl-1">Alt yazı (istəyə bağlı) burada görünəcək</p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setForm(await getSettings());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ayarlar yüklənmədi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await updateSettings(form);
      setForm(updated);
      setMessage('Ayarlar uğurla yadda saxlanıldı');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yadda saxlama uğursuz oldu');
    } finally {
      setSaving(false);
    }
  };

  const updateSocial = (index: number, field: 'label' | 'url', value: string) => {
    if (!form) return;
    const socialLinks = [...form.socialLinks];
    socialLinks[index] = { ...socialLinks[index], [field]: value };
    setForm({ ...form, socialLinks });
  };

  if (loading) {
    return <p className="text-white/40">Yüklənir...</p>;
  }

  if (!form) {
    return <p className="text-red-400">{error || 'Ayarlar tapılmadı'}</p>;
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-serif text-3xl text-mint-400">Sayt ayarları</h1>
        <p className="text-white/40 text-sm mt-2">Navbar, footer və ümumi sayt məlumatları (serverdən idarə olunur)</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <section className="card-admin space-y-4 border border-mint-400/20 bg-mint-400/5">
          <h2 className="font-serif text-lg text-mint-400">Ana səhifə videosu</h2>
          <Link
            to="/hero-video"
            className="inline-flex items-center gap-2 bg-mint-400 text-plum-900 px-6 py-3 rounded-full text-sm font-semibold hover:bg-mint-300"
          >
            Ana səhifə video idarəetməsinə keç →
          </Link>
        </section>

        <section className="card-admin space-y-5 border border-mint-400/25 bg-mint-400/5">
        <div>
          <h2 className="font-serif text-lg text-mint-400">Loqo / Brend adı</h2>
          <p className="text-white/40 text-sm mt-1">
            Saytın navbar, footer və brauzer tabında görünən ad. İstədiyiniz zaman dəyişdirə bilərsiniz.
          </p>
        </div>

        <BrandPreview name={form.siteName} tagline={form.siteTagline} />

        <div>
          <label className="text-white/40 text-sm">Brend adı (loqo mətni)</label>
          <input
            value={form.siteName}
            onChange={(e) => setForm({ ...form, siteName: e.target.value })}
            placeholder="Məs: Amoria"
            className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-mint-400/40"
          />
        </div>
        <div>
          <label className="text-white/40 text-sm">Alt yazı (tagline)</label>
          <input
            value={form.siteTagline ?? ''}
            onChange={(e) => setForm({ ...form, siteTagline: e.target.value })}
            placeholder="Məs: Premium parfumeriya mağazası"
            className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-mint-400/40"
          />
        </div>
        </section>

        <section className="card-admin space-y-5">
          <h2 className="font-serif text-lg text-white/80">Ümumi məlumat</h2>
        <div>
          <label className="text-white/40 text-sm">Qısa təsvir (footer)</label>
          <textarea
            value={form.footerDescription ?? ''}
            onChange={(e) => setForm({ ...form, footerDescription: e.target.value })}
            rows={2}
            className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 text-sm outline-none resize-none"
          />
        </div>
        <div>
          <label className="text-white/40 text-sm">E-poçt</label>
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <label className="text-white/40 text-sm">Telefon</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <label className="text-white/40 text-sm">Ünvan</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-white/40 text-sm">Çatdırılma haqqı (₼)</label>
            <input
              type="number"
              value={form.shippingFee}
              onChange={(e) => setForm({ ...form, shippingFee: Number(e.target.value) })}
              className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-white/40 text-sm">Pulsuz çatdırılma həddi (₼)</label>
            <input
              type="number"
              value={form.freeShippingThreshold}
              onChange={(e) => setForm({ ...form, freeShippingThreshold: Number(e.target.value) })}
              className="w-full mt-1 bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 text-sm outline-none"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-plum-700/30">
          <h3 className="text-white/70 text-sm font-medium">Sosial şəbəkələr</h3>
          {form.socialLinks.map((link, i) => (
            <div key={link.id} className="grid md:grid-cols-2 gap-2">
              <input
                value={link.label}
                onChange={(e) => updateSocial(i, 'label', e.target.value)}
                placeholder="Ad (məs: İnstagram)"
                className="bg-plum-950 border border-plum-700 rounded-xl px-4 py-2.5 text-sm outline-none"
              />
              <input
                value={link.url}
                onChange={(e) => updateSocial(i, 'url', e.target.value)}
                placeholder="Link (https://...)"
                className="bg-plum-950 border border-plum-700 rounded-xl px-4 py-2.5 text-sm outline-none"
              />
            </div>
          ))}
        </div>

        {message && <p className="text-mint-400 text-sm">{message}</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-mint-400 text-plum-900 px-8 py-3 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          {saving ? 'Saxlanılır...' : 'Ayarları yadda saxla'}
        </button>
        </section>
      </form>
    </div>
  );
}
