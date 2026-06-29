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
    <div className="product-card p-8 space-y-4">
      <Skeleton className="aspect-[3/4] w-full rounded-[2rem]" />
      <Skeleton className="h-4 w-2/3 mx-auto rounded-full" />
      <Skeleton className="h-6 w-1/4 mx-auto rounded-full" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <section className="relative h-[80vh] min-h-[480px] max-h-[900px] w-full overflow-hidden">
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 px-6">
        <Skeleton className="h-12 w-full max-w-lg rounded-2xl" />
        <Skeleton className="h-12 w-full max-w-md rounded-2xl" />
        <Skeleton className="h-5 w-full max-w-sm rounded-full" />
        <Skeleton className="mt-4 h-11 w-40 rounded-full" />
      </div>
    </section>
  );
}
