interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-[2.5rem] bg-card/60 shimmer ${className}`} aria-hidden />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card p-3 sm:p-8 space-y-4">
      <Skeleton className="aspect-[3/4] w-full rounded-[2rem]" />
      <Skeleton className="h-4 w-2/3 mx-auto rounded-full" />
      <Skeleton className="h-6 w-1/4 mx-auto rounded-full" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-10">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <section className="relative h-[64vh] sm:h-[72vh] lg:h-[80vh] min-h-[360px] sm:min-h-[440px] lg:min-h-[480px] max-h-[900px] w-full overflow-hidden">
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 sm:gap-6 px-4 sm:px-6">
        <Skeleton className="h-10 sm:h-12 w-full max-w-lg rounded-2xl" />
        <Skeleton className="h-10 sm:h-12 w-full max-w-md rounded-2xl" />
        <Skeleton className="h-4 sm:h-5 w-full max-w-sm rounded-full" />
        <Skeleton className="mt-3 sm:mt-4 h-10 sm:h-11 w-36 sm:w-40 rounded-full" />
      </div>
    </section>
  );
}
