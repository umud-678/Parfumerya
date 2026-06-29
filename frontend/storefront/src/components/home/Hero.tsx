import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getActiveHero } from '../../services/catalog';
import type { HeroSlide } from '../../types';
import { resolveMediaUrl, withCacheBust } from '../../utils/media';
import { getLocalizedHeroContent } from '../../utils/localizedHero';
import { HeroSkeleton } from '../ui/Skeleton';

export default function Hero() {
  const { t, i18n } = useTranslation();
  const [hero, setHero] = useState<HeroSlide | null>(null);
  const [loading, setLoading] = useState(true);

  const content = useMemo(
    () => getLocalizedHeroContent(hero, t, i18n.language),
    [hero, t, i18n.language]
  );

  useEffect(() => {
    getActiveHero()
      .then(setHero)
      .catch(() => setHero(null))
      .finally(() => setLoading(false));
  }, []);

  const videoSrc = useMemo(() => {
    if (!hero?.videoUrl) return null;
    const raw = resolveMediaUrl(hero.videoUrl);
    return withCacheBust(raw, hero.updatedAt);
  }, [hero?.videoUrl, hero?.updatedAt]);

  if (loading) return <HeroSkeleton />;

  if (!hero) {
    return (
      <section className="relative w-full h-[40vh] min-h-[240px] flex items-center justify-center bg-plum-950/80">
        <p className="text-white/40 text-sm">{t('hero.empty')}</p>
      </section>
    );
  }

  return (
    <section className="relative w-full h-[80vh] min-h-[480px] max-h-[900px] overflow-hidden">
      {videoSrc ? (
        <video
          key={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="hero-video absolute inset-0 w-full h-full"
          src={videoSrc}
          aria-label={content.titleHighlight}
        >
          <track kind="captions" />
        </video>
      ) : hero.posterUrl || hero.imageUrl ? (
        <img
          src={resolveMediaUrl(hero.posterUrl || hero.imageUrl)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}

      <div className="absolute inset-0 bg-black/40" aria-hidden />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl space-y-6"
        >
          <h1 className="font-serif text-[2.25rem] leading-[1.12] text-white sm:text-5xl md:text-6xl lg:text-[3.75rem] drop-shadow-lg">
            {content.title}{' '}
            <span className="text-accent italic">{content.titleHighlight}</span>
            {content.titleEnd ? ` ${content.titleEnd}` : ''}
          </h1>

          <p className="mx-auto max-w-xl text-[15px] font-light leading-relaxed text-white/85 sm:text-base drop-shadow-md">
            {content.subtitle}
          </p>

          {(content.stat1Value || content.stat2Value) && (
            <div className="flex flex-wrap items-center justify-center gap-10 pt-2">
              {content.stat1Value && (
                <div className="text-center">
                  <p className="font-serif text-2xl text-white md:text-3xl">{content.stat1Value}</p>
                  <p className="mt-0.5 text-sm text-white/60">{content.stat1Label}</p>
                </div>
              )}
              {content.stat1Value && content.stat2Value && (
                <div className="hidden h-10 w-px bg-white/20 sm:block" aria-hidden />
              )}
              {content.stat2Value && (
                <div className="text-center">
                  <p className="font-serif text-2xl text-white md:text-3xl">{content.stat2Value}</p>
                  <p className="mt-0.5 text-sm text-white/60">{content.stat2Label}</p>
                </div>
              )}
            </div>
          )}

          <div className="pt-4">
            <Link
              to={content.ctaLink}
              className="btn-primary inline-flex min-w-[160px] items-center justify-center px-8 py-3.5 text-sm font-medium tracking-wide shadow-lg"
            >
              {content.ctaText}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
