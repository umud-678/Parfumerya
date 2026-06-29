import { useId } from 'react';
import { useSiteSettings } from '../../hooks/useSiteSettings';

export type FloralTheme = 'gold' | 'crimson' | 'amber' | 'rose';

const THEME_PALETTE: Record<
  FloralTheme,
  {
    stroke: [string, string, string];
    fill: [string, string];
    orb: [string, string];
    core: string;
    pearl: string;
    accent: string;
  }
> = {
  gold: {
    stroke: ['#FFFFFF', '#F5E6C8', '#C9A227'],
    fill: ['#FFFFFF', '#E4C04A'],
    orb: ['#FFF8F0', '#D4AF37'],
    core: '#F5E6C8',
    pearl: '#FFFFFF',
    accent: '#E4C04A',
  },
  crimson: {
    stroke: ['#FFE8E8', '#F08080', '#8B2020'],
    fill: ['#FFD6D6', '#C0392B'],
    orb: ['#FFE0E0', '#8B2020'],
    core: '#FFB4B4',
    pearl: '#FFF0F0',
    accent: '#E85656',
  },
  amber: {
    stroke: ['#FFF9E6', '#FFD54F', '#C9A227'],
    fill: ['#FFF3C4', '#E4A020'],
    orb: ['#FFF8E1', '#D4A017'],
    core: '#FFE082',
    pearl: '#FFFDE7',
    accent: '#FFC107',
  },
  rose: {
    stroke: ['#FFF0F0', '#F5C4C4', '#D4AF37'],
    fill: ['#FFE8E8', '#E4C04A'],
    orb: ['#FFF5F5', '#C9A227'],
    core: '#F5D0D0',
    pearl: '#FFF8F8',
    accent: '#E4A0A0',
  },
};

function FiligreeDefs({ id, theme }: { id: string; theme: FloralTheme }) {
  const p = THEME_PALETTE[theme];
  return (
    <defs>
      <linearGradient id={`${id}-stroke`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={p.stroke[0]} stopOpacity="0.95" />
        <stop offset="45%" stopColor={p.stroke[1]} />
        <stop offset="100%" stopColor={p.stroke[2]} stopOpacity="0.65" />
      </linearGradient>
      <linearGradient id={`${id}-fill`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={p.fill[0]} stopOpacity="0.35" />
        <stop offset="100%" stopColor={p.fill[1]} stopOpacity="0.12" />
      </linearGradient>
      <radialGradient id={`${id}-orb`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={p.orb[0]} stopOpacity="0.5" />
        <stop offset="100%" stopColor={p.orb[1]} stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

function TopFlourish({
  className = '',
  gradId,
  theme,
}: {
  className?: string;
  gradId: string;
  theme: FloralTheme;
}) {
  const p = THEME_PALETTE[theme];
  const s = `url(#${gradId}-stroke)`;
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden>
      <defs>
        <FiligreeDefs id={gradId} theme={theme} />
      </defs>
      <circle cx="50" cy="50" r="38" fill={`url(#${gradId}-orb)`} opacity="0.5" />
      <path
        d="M50 12 C62 28, 78 24, 72 42 C68 52, 58 48, 50 38 C42 48, 32 52, 28 42 C22 24, 38 28, 50 12Z"
        stroke={s}
        strokeWidth="0.9"
        fill={`url(#${gradId}-fill)`}
      />
      <path
        d="M50 38 C58 44, 64 56, 50 62 C36 56, 42 44, 50 38Z"
        stroke={s}
        strokeWidth="0.7"
        opacity="0.75"
      />
      <path
        d="M50 62 C46 72, 50 82, 54 72"
        stroke={s}
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M18 50 Q8 38 14 28 M82 50 Q92 38 86 28"
        stroke={s}
        strokeWidth="0.5"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="50" cy="44" r="3" fill={p.pearl} opacity="0.85" />
      <circle cx="50" cy="44" r="1.2" fill={p.accent} opacity="0.9" />
    </svg>
  );
}

function LineBloom({
  className = '',
  gradId,
  theme,
  size = 'md',
}: {
  className?: string;
  gradId: string;
  theme: FloralTheme;
  size?: 'sm' | 'md';
}) {
  const p = THEME_PALETTE[theme];
  const s = `url(#${gradId}-stroke)`;
  const sw = size === 'sm' ? 0.65 : 0.85;
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden>
      <defs>
        <FiligreeDefs id={gradId} theme={theme} />
      </defs>
      <ellipse cx="40" cy="40" rx="28" ry="28" fill={`url(#${gradId}-orb)`} opacity="0.35" />
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="40"
          cy="22"
          rx="10"
          ry="18"
          fill={`url(#${gradId}-fill)`}
          stroke={s}
          strokeWidth={sw}
          transform={`rotate(${deg} 40 40)`}
          opacity={0.55 + (deg % 144 === 0 ? 0.2 : 0)}
        />
      ))}
      <circle cx="40" cy="40" r="6" fill={p.pearl} fillOpacity="0.5" stroke={s} strokeWidth="0.6" />
      <circle cx="40" cy="40" r="2.5" fill={p.core} opacity="0.95" />
    </svg>
  );
}

function ScrollAccent({
  className = '',
  gradId,
  theme,
}: {
  className?: string;
  gradId: string;
  theme: FloralTheme;
}) {
  const p = THEME_PALETTE[theme];
  const s = `url(#${gradId}-stroke)`;
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <FiligreeDefs id={gradId} theme={theme} />
      </defs>
      <path
        d="M24 4 C32 12, 36 20, 24 26 C12 20, 16 12, 24 4Z"
        stroke={s}
        strokeWidth="0.7"
        fill={`url(#${gradId}-fill)`}
      />
      <path
        d="M24 26 C34 28, 40 36, 24 44 C8 36, 14 28, 24 26Z"
        stroke={s}
        strokeWidth="0.6"
        opacity="0.7"
      />
      <path d="M24 8 Q24 24 24 40" stroke={p.core} strokeWidth="0.4" strokeOpacity="0.5" />
    </svg>
  );
}

function DriftingPetal({
  className = '',
  delay = 0,
  duration = 14,
}: {
  className?: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <span
      className={`floral-petal ${className}`}
      style={{ animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
      aria-hidden
    />
  );
}

function VerticalFiligree({
  className = '',
  gradId,
  theme,
}: {
  className?: string;
  gradId: string;
  theme: FloralTheme;
}) {
  const p = THEME_PALETTE[theme];
  const s = `url(#${gradId}-stroke)`;
  return (
    <svg className={className} viewBox="0 0 60 900" fill="none" preserveAspectRatio="none" aria-hidden>
      <defs>
        <FiligreeDefs id={gradId} theme={theme} />
      </defs>
      <path
        d="M30 0 C28 120, 34 240, 30 360 C26 480, 32 600, 30 720 C28 820, 32 900, 30 900"
        stroke={s}
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.4"
        vectorEffect="non-scaling-stroke"
      />
      {[120, 280, 440, 600, 760].map((y, i) => (
        <g key={y} opacity={0.35 - i * 0.03}>
          <circle cx="30" cy={y} r="2.5" fill={p.pearl} opacity="0.6" />
          <path
            d={`M30 ${y} Q${18 + i * 2} ${y + 20} ${22 + i} ${y + 36}`}
            stroke={s}
            strokeWidth="0.5"
            fill="none"
            opacity="0.5"
          />
          <path
            d={`M30 ${y} Q${42 - i * 2} ${y + 24} ${38 - i} ${y + 40}`}
            stroke={s}
            strokeWidth="0.5"
            fill="none"
            opacity="0.45"
          />
        </g>
      ))}
    </svg>
  );
}

function ElegantSidePanel({ side, theme }: { side: 'left' | 'right'; theme: FloralTheme }) {
  const baseId = useId().replace(/:/g, '');
  const id = `${baseId}-${side}`;
  const p = THEME_PALETTE[theme];

  return (
    <div
      className={`absolute inset-y-0 ${side === 'left' ? 'left-0' : 'right-0 scale-x-[-1]'} hidden w-28 md:block lg:w-40 xl:w-48`}
    >
      <div className="floral-side-beam absolute inset-y-[8%] left-3 w-16 lg:w-20" />

      <VerticalFiligree
        gradId={`${id}-vine`}
        theme={theme}
        className="absolute left-4 top-0 h-full w-8 opacity-80"
      />

      <TopFlourish
        gradId={`${id}-top`}
        theme={theme}
        className="floral-shimmer absolute left-3 top-[8%] h-20 w-20 lg:h-24 lg:w-24"
      />

      <ScrollAccent
        gradId={`${id}-scroll`}
        theme={theme}
        className="floral-shimmer absolute left-8 top-[22%] h-11 w-11 opacity-70"
      />

      <LineBloom
        gradId={`${id}-mid`}
        theme={theme}
        size="md"
        className="absolute left-1 top-[36%] h-[4.5rem] w-[4.5rem] opacity-75 animate-float-slow"
      />

      <LineBloom
        gradId={`${id}-low`}
        theme={theme}
        size="sm"
        className="absolute left-7 top-[56%] h-14 w-14 opacity-65 animate-gold-shimmer"
      />

      <TopFlourish
        gradId={`${id}-bot`}
        theme={theme}
        className="absolute left-2 top-[76%] h-16 w-16 opacity-55 animate-float"
      />

      <DriftingPetal className="left-10 top-[18%]" delay={0} duration={16} />
      <DriftingPetal className="left-5 top-[48%] floral-petal-sm" delay={4} duration={18} />
      <DriftingPetal className="left-12 top-[68%]" delay={8} duration={15} />
      <DriftingPetal className="left-6 top-[88%] floral-petal-sm" delay={2} duration={20} />

      <div
        className="absolute inset-y-[10%] left-7 w-px bg-gradient-to-b from-transparent to-transparent"
        style={{
          backgroundImage: `linear-gradient(to bottom, transparent, ${p.stroke[1]}33, transparent)`,
        }}
      />
    </div>
  );
}

export function GoldenFloralSides({ theme = 'gold' }: { theme?: FloralTheme }) {
  return (
    <div
      className={`floral-theme-${theme} pointer-events-none absolute inset-0 z-0 overflow-hidden`}
      aria-hidden
    >
      <ElegantSidePanel side="left" theme={theme} />
      <ElegantSidePanel side="right" theme={theme} />
    </div>
  );
}

export function ContentWithFloral({
  children,
  className = '',
  theme = 'gold',
}: {
  children: React.ReactNode;
  className?: string;
  theme?: FloralTheme;
}) {
  return (
    <div className={`relative ${className}`}>
      <GoldenFloralSides theme={theme} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function HomeBotanicalSides() {
  return <GoldenFloralSides theme="amber" />;
}

export function SectionDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-8 opacity-45" aria-hidden>
      <div className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent to-gold-400/40" />
      <svg className="w-5 h-5 text-gold-300/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M12 4 C14 9, 17 8, 17 11 C15 12, 15 15, 12 14 C9 15, 9 12, 7 11 C7 8, 10 9, 12 4Z" fill="currentColor" fillOpacity="0.5" />
      </svg>
      <div className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-transparent to-gold-400/40" />
    </div>
  );
}

export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { siteName } = useSiteSettings();

  return (
    <div className="relative min-h-[60vh]">
      <div className="relative max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-gold-300/70" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2 C11.5 6, 14 5.5, 14.5 8.5 C12.5 9, 12.5 11.5, 10 11 C7.5 11.5, 7.5 9, 5.5 8.5 C6 5.5, 8.5 6, 10 2Z" />
            </svg>
            <span className="text-gold-300/60 text-xs tracking-[0.35em] uppercase">{siteName}</span>
            <svg className="w-4 h-4 text-gold-300/70 scale-x-[-1]" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2 C11.5 6, 14 5.5, 14.5 8.5 C12.5 9, 12.5 11.5, 10 11 C7.5 11.5, 7.5 9, 5.5 8.5 C6 5.5, 8.5 6, 10 2Z" />
            </svg>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl bg-gradient-to-r from-white via-gold-200 to-gold-400 bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && <p className="text-white/50 mt-3 max-w-lg mx-auto">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function floralThemeForPath(pathname: string): FloralTheme {
  if (pathname.startsWith('/product')) return 'rose';
  if (pathname.startsWith('/shop') || pathname.startsWith('/category')) return 'amber';
  if (pathname.startsWith('/account') || pathname.startsWith('/orders')) return 'crimson';
  if (pathname.startsWith('/about') || pathname.startsWith('/contact')) return 'gold';
  if (pathname.startsWith('/cart') || pathname.startsWith('/checkout')) return 'crimson';
  if (pathname.startsWith('/wishlist')) return 'amber';
  return 'gold';
}
