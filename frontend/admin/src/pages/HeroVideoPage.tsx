import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink, Film, Trash2, Upload, RotateCcw, Save, AlertCircle,
} from 'lucide-react';
import {
  DEFAULT_VIDEO,
  deleteHeroVideo,
  getHeroApiStatus,
  getHeroForAdmin,
  resolveAdminMediaUrl,
  saveHeroVideo,
  uploadHeroVideo,
  type HeroApiStatus,
  type HeroSlide,
} from '../services/hero';

import { STOREFRONT_URL } from '../config/env';

export default function HeroVideoPage() {
  const [hero, setHero] = useState<HeroSlide | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingVideo, setDeletingVideo] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState<HeroApiStatus | null>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const loadHero = useCallback(async () => {
    setLoading(true);
    setError('');
    const status = await getHeroApiStatus();
    setApiStatus(status);
    try {
      const data = await getHeroForAdmin();
      setHero(data);
      setVideoUrl(data.videoUrl ?? DEFAULT_VIDEO);
      if (!status.ready) {
        setError(status.message);
      }
    } catch (err) {
      setHero(null);
      setError(err instanceof Error ? err.message : 'Video məlumatları yüklənmədi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHero();
  }, [loadHero]);

  const previewVideo = resolveAdminMediaUrl(videoUrl);
  const isCustomUpload = videoUrl.startsWith('/uploads/');
  const isDefaultVideo = !videoUrl || videoUrl === DEFAULT_VIDEO;
  const apiReady = apiStatus?.ready ?? false;

  const persist = async (nextVideo: string, successMsg: string) => {
    if (!hero) return;
    setSaving(true);
    setError('');
    try {
      const updated = await saveHeroVideo(hero.id, { videoUrl: nextVideo });
      setHero(updated);
      setVideoUrl(updated.videoUrl ?? DEFAULT_VIDEO);
      setMessage(successMsg);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yadda saxlama uğursuz oldu');
    } finally {
      setSaving(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !hero) return;
    setUploadingVideo(true);
    setMessage('');
    setError('');
    try {
      const url = await uploadHeroVideo(file);
      await persist(url, 'Yeni video yükləndi və avtomatik yadda saxlanıldı!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video yüklənmədi');
    } finally {
      setUploadingVideo(false);
      if (videoRef.current) videoRef.current.value = '';
    }
  };

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hero || !videoUrl.trim()) return;
    await persist(videoUrl.trim(), 'Video linki yadda saxlanıldı!');
  };

  const handleDeleteVideo = async () => {
    if (!hero) return;
    if (!window.confirm('Cari videonu silmək istəyirsiniz? Standart video (/videos/hero.mp4) bərpa olunacaq.')) {
      return;
    }
    setDeletingVideo(true);
    setMessage('');
    setError('');
    try {
      const updated = await deleteHeroVideo(hero.id);
      setHero(updated);
      setVideoUrl(updated.videoUrl ?? DEFAULT_VIDEO);
      setMessage('Video silindi. Standart ana səhifə videosu aktivdir.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video silinmədi');
    } finally {
      setDeletingVideo(false);
    }
  };

  const handleResetDefault = async () => {
    if (!hero) return;
    await persist(DEFAULT_VIDEO, 'Standart video bərpa olundu.');
  };

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-mint-400/70 text-xs uppercase tracking-widest mb-2">
            <Film size={14} />
            Ana səhifə
          </div>
          <h1 className="font-serif text-3xl text-mint-400">Ana səhifə video idarəetməsi</h1>
          <p className="text-white/45 text-sm mt-2 max-w-2xl">
            Ana səhifədə avtomatik oynayan videonu buradan idarə edin — yükləyin, silin və ya URL ilə dəyişdirin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={STOREFRONT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-mint-400 border border-mint-400/30 px-4 py-2 rounded-full hover:bg-mint-400/10"
          >
            Sayta bax <ExternalLink size={14} />
          </a>
          <Link
            to="/settings"
            className="flex items-center gap-2 text-sm text-white/50 border border-white/10 px-4 py-2 rounded-full hover:bg-white/5"
          >
            Ümumi ayarlar
          </Link>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`rounded-2xl px-5 py-4 text-sm flex items-start gap-3 ${
            error
              ? 'bg-red-500/10 border border-red-500/30 text-red-300'
              : 'bg-mint-400/10 border border-mint-400/30 text-mint-300'
          }`}
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p>{error || message}</p>
            {error && !apiReady && (
              <p className="mt-2 text-white/50 text-xs">
                Terminalda: <code className="text-mint-400">cd Parfumerya && npm run stop && npm run dev</code>
              </p>
            )}
          </div>
        </div>
      )}

      {!apiReady && !loading && (
        <div className="card-admin border border-amber-500/30 bg-amber-500/10 p-5 text-amber-200 text-sm">
          <p className="font-semibold mb-1">Server yenilənməlidir</p>
          <p className="text-amber-200/80">
            Video yükləmə və silmə yalnız yeni server versiyası ilə işləyir. Terminalda serveri yenidən başladın.
          </p>
        </div>
      )}

      {loading ? (
        <div className="card-admin p-10 text-center text-white/40">Yüklənir...</div>
      ) : !hero ? (
        <div className="card-admin p-10 text-center space-y-3">
          <p className="text-red-400">Ana səhifə video məlumatı yüklənmədi.</p>
          <button
            type="button"
            onClick={loadHero}
            className="bg-mint-400 text-plum-900 px-6 py-2.5 rounded-full text-sm font-semibold"
          >
            Yenidən yoxla
          </button>
        </div>
      ) : (
        <form onSubmit={handleSaveUrl} className="space-y-6">
          <section className="card-admin space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-xl text-white/90">Cari video</h2>
              <span
                className={`text-xs px-3 py-1 rounded-full border ${
                  isCustomUpload
                    ? 'border-mint-400/40 text-mint-400 bg-mint-400/10'
                    : 'border-white/15 text-white/45'
                }`}
              >
                {isCustomUpload ? 'Yüklənmiş video' : isDefaultVideo ? 'Standart video' : 'Xarici link'}
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden border border-plum-700 bg-black aspect-video max-h-[420px]">
              {previewVideo ? (
                <video
                  key={`${previewVideo}-${hero.updatedAt}`}
                  src={previewVideo}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <div className="flex h-full min-h-[240px] items-center justify-center text-white/30">
                  Video yoxdur
                </div>
              )}
            </div>

            {hero.updatedAt && (
              <p className="text-white/30 text-xs">
                Son yenilənmə: {new Date(hero.updatedAt).toLocaleString('az-AZ')}
              </p>
            )}

            <input
              ref={videoRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              className="hidden"
              onChange={handleVideoUpload}
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                disabled={!apiReady || uploadingVideo || saving}
                onClick={() => videoRef.current?.click()}
                className="flex items-center justify-center gap-2 bg-mint-400 text-plum-900 py-3.5 rounded-xl font-semibold text-sm hover:bg-mint-300 disabled:opacity-50"
              >
                <Upload size={16} />
                {uploadingVideo ? 'Yüklənir...' : 'Yeni video əlavə et'}
              </button>

              <button
                type="button"
                disabled={!apiReady || deletingVideo || isDefaultVideo}
                onClick={handleDeleteVideo}
                className="flex items-center justify-center gap-2 border border-red-500/40 text-red-400 py-3.5 rounded-xl text-sm hover:bg-red-500/10 disabled:opacity-40"
              >
                <Trash2 size={16} />
                {deletingVideo ? 'Silinir...' : 'Videonu sil'}
              </button>

              <button
                type="button"
                disabled={!apiReady || saving || isDefaultVideo}
                onClick={handleResetDefault}
                className="flex items-center justify-center gap-2 border border-white/15 text-white/60 py-3.5 rounded-xl text-sm hover:bg-white/5 disabled:opacity-40"
              >
                <RotateCcw size={16} />
                Standarta qaytar
              </button>

              <button
                type="submit"
                disabled={!apiReady || saving || !videoUrl.trim()}
                className="flex items-center justify-center gap-2 border border-mint-400/40 text-mint-400 py-3.5 rounded-xl text-sm hover:bg-mint-400/10 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Saxlanılır...' : 'Linki yadda saxla'}
              </button>
            </div>

            <p className="text-white/30 text-xs">
              MP4 və ya WebM, maksimum 150 MB. Tövsiyə: 1920×1080 yüksək keyfiyyət. Yükləmə avtomatik yadda saxlanır.
            </p>

            <div>
              <label className="text-white/40 text-sm block mb-2">Video linki</label>
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="/videos/hero.mp4 və ya https://..."
                className="w-full bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-mint-400/50 font-mono"
              />
            </div>
          </section>
        </form>
      )}
    </div>
  );
}
