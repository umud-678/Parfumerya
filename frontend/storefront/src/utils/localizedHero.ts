import type { TFunction } from 'i18next';
import type { HeroSlide } from '../types';

export function getLocalizedHeroContent(
  hero: HeroSlide | null,
  t: TFunction,
  _lang: string
) {
  return {
    title: hero?.title || t('hero.title'),
    titleHighlight: hero?.titleHighlight || t('hero.titleHighlight'),
    titleEnd: hero?.titleEnd ?? t('hero.titleEnd'),
    subtitle: hero?.subtitle || t('hero.subtitle'),
    stat1Value: hero?.stat1Value,
    stat2Value: hero?.stat2Value,
    stat1Label: hero?.stat1Label || (hero?.stat1Value ? t('hero.perfumes') : undefined),
    stat2Label: hero?.stat2Label || (hero?.stat2Value ? t('hero.customers') : undefined),
    ctaText: hero?.ctaText || t('hero.shopNow'),
    ctaLink: hero?.ctaLink?.startsWith('/') ? hero.ctaLink : '/shop',
  };
}
