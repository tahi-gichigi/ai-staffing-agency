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
    <div className="pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-[1000px] mx-auto w-full">
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
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-divider/60 bg-card-bg p-6 space-y-3"
          >
            <SkeletonLine w="30%" h={8} />
            <SkeletonLine w="70%" h={14} />
            <SkeletonLine w="90%" h={10} />
            <div className="flex gap-2 pt-1">
              <SkeletonLine w="80px" h={20} />
              <SkeletonLine w="80px" h={20} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
