import Link from "next/link";
import { ACTIVITY, BUCKETS, ITEMS, clientById } from "./_lib/data";
import { Breadcrumbs, FloatingActivity, ImpactPill, KindDot, LiveStatus } from "./_lib/ui";

export default function DashboardPage() {
  const counts: Record<string, number> = { review: 0, waiting: 0, junior: 0, done: 0 };
  for (const it of ITEMS) counts[it.bucket] += 1;

  const highImpact = ITEMS.filter((i) => i.bucket === "review" && i.impact === "high").length;
  const topReview = ITEMS.filter((i) => i.bucket === "review").slice(0, 3);

  return (
    <div className="pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-[1400px] mx-auto w-full">
      {/* Hero */}
      <div className="pb-5 mb-6 border-b border-divider">
        <Breadcrumbs items={[{ label: "Mission control", href: "/demo/a" }, { label: "Your day" }]} />
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted mb-1.5">
          Friday 24 April
        </p>
        <h1 className="font-serif text-3xl md:text-4xl leading-tight tracking-tight text-ink [text-wrap:balance]">
          Good morning, Tahi.
        </h1>
        <p className="text-sm text-muted mt-1.5">
          {counts.review} items need your call.{" "}
          {highImpact > 0 && (
            <>
              <span className="text-ink font-medium">{highImpact} high impact.</span>{" "}
            </>
          )}
          {counts.done} cleared since 9am.
        </p>
        <div className="mt-3 lg:hidden">
          <LiveStatus />
        </div>
      </div>

      {/* Bucket cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-10">
        {BUCKETS.map((b) => {
          const n = counts[b.key];
          const active = b.emphasis;
          return (
            <Link
              key={b.key}
              href={`/demo/a/queue/${b.key}`}
              className={`pressable text-left rounded-2xl border p-5 md:p-6 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-12px_rgba(13,115,119,0.25)] ${
                active
                  ? "bg-card-bg border-accent/40 shadow-[0_1px_0_rgba(13,115,119,0.08)]"
                  : "bg-card-bg border-divider/60 hover:border-divider"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
                  {b.label}
                </span>
                {active && n > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" aria-label="action needed" />
                )}
              </div>
              <p
                className={`font-serif leading-none tabular-nums ${
                  active ? "text-5xl text-accent" : "text-4xl text-ink"
                }`}
              >
                {n}
              </p>
              <p className="text-xs text-muted mt-2.5">{b.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* Split: top of queue + activity preview */}
      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-serif text-xl text-ink">Top of the queue</h2>
            <Link href="/demo/a/queue/review" className="text-xs font-medium text-accent accent-link">
              See all {counts.review} →
            </Link>
          </div>
          <div className="bg-card-bg rounded-2xl border border-divider/60 overflow-hidden">
            {topReview.map((it, idx) => {
              const c = clientById(it.clientId);
              return (
                <Link
                  key={it.id}
                  href={`/demo/a/item/${it.id}`}
                  className={`w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-paper-warm/40 transition-colors ${
                    idx !== topReview.length - 1 ? "border-b border-divider/60" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-muted">
                        {c.name}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-divider" />
                      <span className="text-[11px] text-muted">{it.period}</span>
                    </div>
                    <p className="text-sm text-ink font-medium">{it.issue}</p>
                    <p className="text-xs text-muted mt-0.5 truncate">{it.detail}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <ImpactPill i={it.impact} />
                    <span className="text-[11px] text-muted-light">{it.age}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-serif text-xl text-ink">Recent activity</h2>
            <span className="text-[11px] text-muted">last 2 hours</span>
          </div>
          <div className="bg-card-bg rounded-2xl border border-divider/60 p-4">
            <ul className="space-y-3">
              {ACTIVITY.slice(0, 6).map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <KindDot k={e.kind} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-ink leading-snug">
                      <span className="text-muted">{e.time}</span> · {e.check}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {e.client} - {e.outcome}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/demo/a/activity"
              className="block mt-3 pt-3 border-t border-divider/60 text-xs text-accent font-medium accent-link"
            >
              See full log →
            </Link>
          </div>
        </section>
      </div>

      <FloatingActivity />
    </div>
  );
}
