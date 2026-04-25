/* Shared skeleton shapes. Kept server-compatible (no hooks). */

export function SkeletonLine({ w = "100%", h = 12 }: { w?: string | number; h?: number }) {
  return <span className="skeleton block" style={{ width: w, height: h }} />;
}

export function RouteSkeleton({
  eyebrow = "Loading",
  title = "One moment",
}: {
  eyebrow?: string;
  title?: string;
}) {
  return (
    <div className="pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-[1400px] mx-auto w-full">
      <div className="route-progress" aria-hidden />
      <div className="pb-5 mb-6 border-b border-divider">
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-light mb-2">
          {eyebrow}
        </p>
        <p className="font-serif text-3xl md:text-4xl leading-tight tracking-tight text-muted-light">
          {title}
        </p>
        <div className="mt-3 space-y-2 max-w-md">
          <SkeletonLine w="60%" h={10} />
          <SkeletonLine w="40%" h={10} />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-10">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-divider/60 bg-card-bg p-5 md:p-6 space-y-3"
          >
            <SkeletonLine w="40%" h={8} />
            <SkeletonLine w="30%" h={32} />
            <SkeletonLine w="70%" h={8} />
          </div>
        ))}
      </div>
      <div className="bg-card-bg rounded-2xl border border-divider/60 p-5 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <span className="skeleton rounded-full" style={{ width: 8, height: 8 }} />
            <SkeletonLine w="25%" h={10} />
            <SkeletonLine w="40%" h={10} />
            <SkeletonLine w="15%" h={10} />
          </div>
        ))}
      </div>
    </div>
  );
}
