import { useSiteSettings } from '../../hooks/useSiteSettings';

type FloralVariant = 'hero' | 'page' | 'corner' | 'navbar';

interface FloralDecorProps {
  variant?: FloralVariant;
  className?: string;
}

function EmeraldVine({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M60 0 C58 80, 72 120, 60 200 C48 280, 68 340, 60 420 C52 500, 70 560, 60 640 C50 720, 62 760, 60 800"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M60 120 C35 105, 20 130, 38 148 C28 165, 45 178, 60 165"
        fill="currentColor"
        opacity="0.35"
      />
      <path
        d="M60 165 C85 150, 100 175, 82 192 C92 210, 75 222, 60 210"
        fill="currentColor"
        opacity="0.3"
      />
      <path
        d="M60 280 C32 262, 14 292, 34 312 C22 332, 42 348, 60 332"
        fill="currentColor"
        opacity="0.28"
      />
      <path
        d="M60 332 C88 318, 106 348, 86 366 C98 386, 78 400, 60 386"
        fill="currentColor"
        opacity="0.25"
      />
      <path
        d="M60 480 C38 468, 24 492, 40 508 C30 524, 48 536, 60 524"
        fill="currentColor"
        opacity="0.22"
      />
      <path
        d="M60 524 C82 512, 96 536, 80 552 C90 568, 72 580, 60 568"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M60 660 C42 648, 28 672, 44 686 C34 700, 50 712, 60 700"
        fill="currentColor"
        opacity="0.18"
      />
      <ellipse cx="28" cy="420" rx="10" ry="16" fill="currentColor" opacity="0.12" transform="rotate(-25 28 420)" />
      <ellipse cx="92" cy="580" rx="9" ry="14" fill="currentColor" opacity="0.1" transform="rotate(20 92 580)" />
    </svg>
  );
}

function EmeraldPetalCluster({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor" aria-hidden>
      <path d="M50 8 C58 28, 78 24, 74 44 C58 48, 52 68, 50 52 C48 68, 42 48, 26 44 C22 24, 42 28, 50 8Z" opacity="0.35" />
      <path d="M50 52 C62 42, 78 52, 70 64 C58 68, 50 82, 42 64 C34 52, 38 42, 50 52Z" opacity="0.22" />
      <circle cx="50" cy="48" r="4" opacity="0.4" />
    </svg>
  );
}

export function HomeBotanicalSides() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-y-0 left-0 hidden w-28 md:block lg:w-36">
        <EmeraldVine className="absolute -left-4 top-0 h-full w-24 text-emerald-400/25 animate-float-slow" />
        <EmeraldPetalCluster className="absolute left-6 top-[18%] h-16 w-16 text-accent/20 animate-float" />
        <EmeraldPetalCluster className="absolute left-2 top-[62%] h-12 w-12 text-emerald-400/15 animate-float-slow" />
        <svg
          className="absolute left-8 top-[42%] h-20 w-20 text-emerald-400/12"
          viewBox="0 0 80 80"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="M40 8 Q55 25 40 40 Q25 25 40 8" />
          <path d="M40 40 Q58 48 40 62 Q22 48 40 40" />
          <path d="M40 62 Q52 72 40 74 Q28 72 40 62" />
        </svg>
      </div>

      <div className="absolute inset-y-0 right-0 hidden w-28 md:block lg:w-36">
        <EmeraldVine className="absolute -right-4 top-0 h-full w-24 scale-x-[-1] text-emerald-400/25 animate-float-slow" />
        <EmeraldPetalCluster className="absolute right-6 top-[24%] h-14 w-14 text-accent/18 animate-float" />
        <EmeraldPetalCluster className="absolute right-3 top-[70%] h-10 w-10 text-emerald-400/14 animate-float-slow" />
        <svg
          className="absolute right-6 top-[48%] h-16 w-16 scale-x-[-1] text-emerald-400/10"
          viewBox="0 0 64 64"
          fill="currentColor"
        >
          <path d="M32 6 C36 18, 46 16, 48 26 C40 28, 42 38, 32 36 C22 38, 24 28, 16 26 C18 16, 28 18, 32 6Z" opacity="0.5" />
        </svg>
      </div>

      <div className="absolute inset-x-0 top-[45%] h-px bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent md:hidden" />
    </div>
  );
}

export function FloralDecor({ variant = 'page', className = '' }: FloralDecorProps) {
  if (variant === 'hero') {
    return (
      <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
        <EmeraldPetalCluster className="absolute -top-6 left-[8%] h-20 w-20 text-emerald-400/20 animate-float-slow" />
        <EmeraldPetalCluster className="absolute top-[12%] right-[10%] h-16 w-16 text-accent/15 animate-float" />
        <svg
          className="absolute bottom-[18%] left-[14%] h-14 w-14 text-emerald-400/12 animate-float"
          viewBox="0 0 56 56"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M28 4 C32 16, 42 14, 44 24 C36 26, 38 36, 28 34 C18 36, 20 26, 12 24 C14 14, 24 16, 28 4Z" />
          <path d="M28 34 L28 52" strokeLinecap="round" />
        </svg>
        <svg
          className="absolute bottom-[22%] right-[12%] h-12 w-12 text-accent/10 animate-float-slow"
          viewBox="0 0 48 48"
          fill="currentColor"
        >
          <path d="M24 6 C27 14, 35 12, 36 20 C30 21, 31 29, 24 27 C17 29, 18 21, 12 20 C13 12, 21 14, 24 6Z" />
        </svg>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(167,243,208,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(143,212,184,0.06),transparent_50%)]" />
      </div>
    );
  }

  if (variant === 'navbar') {
    return (
      <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
        <svg className="absolute -left-4 top-1/2 -translate-y-1/2 w-14 h-14 opacity-[0.12] text-accent animate-float-slow" viewBox="0 0 64 64" fill="currentColor">
          <path d="M32 4 C38 16, 48 12, 52 24 C44 26, 46 38, 32 34 C18 38, 20 26, 12 24 C16 12, 26 16, 32 4Z" />
        </svg>
        <svg className="absolute right-[20%] -top-2 w-9 h-9 opacity-[0.08] text-rose-soft animate-float" viewBox="0 0 56 56" fill="currentColor">
          <path d="M28 6 C32 18, 42 16, 44 26 C36 28, 38 38, 28 36 C18 38, 20 28, 12 26 C14 16, 24 18, 28 6Z" />
        </svg>
        <svg className="absolute right-6 bottom-0 w-7 h-7 opacity-[0.1] text-accent animate-float-slow" viewBox="0 0 48 48" fill="currentColor">
          <path d="M24 4 C27 14, 35 12, 36 20 C30 21, 31 29, 24 27 C17 29, 18 21, 12 20 C13 12, 21 14, 24 4Z" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_0%,rgba(167,243,208,0.07),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_100%,rgba(201,122,154,0.05),transparent_45%)]" />
      </div>
    );
  }

  if (variant === 'corner') {
    return (
      <div className={`pointer-events-none absolute ${className}`} aria-hidden>
        <svg className="w-16 h-16 opacity-20 text-mint-400" viewBox="0 0 64 64" fill="currentColor">
          <path d="M32 4 C38 16, 48 12, 52 24 C44 26, 46 38, 32 34 C18 38, 20 26, 12 24 C16 12, 26 16, 32 4Z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-mint-400/20 to-transparent" />
      <svg className="absolute -top-6 right-8 w-20 h-20 opacity-15 text-mint-400/60" viewBox="0 0 80 80" fill="currentColor">
        <path d="M40 8 C48 24, 60 20, 64 32 C52 36, 54 48, 40 44 C26 48, 28 36, 16 32 C20 20, 32 24, 40 8Z" />
      </svg>
      <svg className="absolute bottom-4 left-6 w-14 h-14 opacity-10 text-pink-200/50" viewBox="0 0 56 56" fill="currentColor">
        <path d="M28 6 C32 18, 42 16, 44 26 C36 28, 38 38, 28 36 C18 38, 20 28, 12 26 C14 16, 24 18, 28 6Z" />
      </svg>
    </div>
  );
}

export function SectionDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-8 opacity-40" aria-hidden>
      <div className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent to-mint-400/40" />
      <svg className="w-6 h-6 text-mint-400/60" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 C14 8, 18 7, 18 11 C15 12, 15 16, 12 15 C9 16, 9 12, 6 11 C6 7, 10 8, 12 2Z" />
      </svg>
      <div className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-transparent to-mint-400/40" />
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
      <FloralDecor variant="page" />
      <div className="relative max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-mint-400/70" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2 C11.5 6, 14 5.5, 14.5 8.5 C12.5 9, 12.5 11.5, 10 11 C7.5 11.5, 7.5 9, 5.5 8.5 C6 5.5, 8.5 6, 10 2Z" />
            </svg>
            <span className="text-mint-400/60 text-xs tracking-[0.3em] uppercase">
              {siteName}
            </span>
            <svg className="w-5 h-5 text-mint-400/70 scale-x-[-1]" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2 C11.5 6, 14 5.5, 14.5 8.5 C12.5 9, 12.5 11.5, 10 11 C7.5 11.5, 7.5 9, 5.5 8.5 C6 5.5, 8.5 6, 10 2Z" />
            </svg>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-mint-400">{title}</h1>
          {subtitle && <p className="text-white/50 mt-3 max-w-lg mx-auto">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
