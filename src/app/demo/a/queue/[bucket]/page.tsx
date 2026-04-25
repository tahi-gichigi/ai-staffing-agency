import Link from "next/link";
import { notFound } from "next/navigation";
import { BUCKETS, ITEMS, clientById } from "../../_lib/data";
import type { Bucket } from "../../_lib/data";
import { BackLink, Breadcrumbs, ConfidencePill, FloatingActivity, ImpactPill } from "../../_lib/ui";

export function generateStaticParams() {
  return BUCKETS.map((b) => ({ bucket: b.key }));
}

const VALID: Bucket[] = ["review", "waiting", "junior", "done"];

export default async function QueuePage({
  params,
}: {
  params: Promise<{ bucket: string }>;
}) {
  const { bucket: raw } = await params;
  if (!VALID.includes(raw as Bucket)) notFound();
  const bucket = raw as Bucket;

  const items = ITEMS.filter((i) => i.bucket === bucket);
  const title = BUCKETS.find((b) => b.key === bucket)?.label ?? "Queue";

  return (
    <div className="pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-[1400px] mx-auto w-full">
      <div className="mb-5">
        <BackLink href="/demo/a" label="Mission control" />
        <div className="mt-3">
          <Breadcrumbs
            items={[
              { label: "Mission control", href: "/demo/a" },
              { label: "Queue", href: "/demo/a/queue/review" },
              { label: title },
            ]}
          />
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-ink leading-tight [text-wrap:balance]">
          {title}
          <span className="ml-3 text-base text-muted font-sans tabular-nums">{items.length}</span>
        </h1>
      </div>

      {/* Bucket tabs — pill-style active state (colour + weight + background, not just underline). */}
      <div
        role="tablist"
        aria-label="Queue buckets"
        className="flex items-center gap-1.5 mb-5 flex-wrap"
      >
        {BUCKETS.map((b) => {
          const active = b.key === bucket;
          const n = ITEMS.filter((i) => i.bucket === b.key).length;
          return (
            <Link
              key={b.key}
              href={`/demo/a/queue/${b.key}`}
              role="tab"
              aria-selected={active}
              className={`pressable inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm whitespace-nowrap border transition-[color,background-color,border-color,box-shadow] duration-200 ${
                active
                  ? "bg-accent text-paper border-accent font-semibold shadow-[0_4px_14px_-6px_rgba(13,115,119,0.5)]"
                  : "bg-card-bg text-muted border-divider/60 hover:text-ink hover:border-divider hover:bg-paper-warm/40 font-medium"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  active ? "bg-paper" : "bg-divider"
                }`}
                aria-hidden
              />
              {b.label}
              <span
                className={`tabular-nums text-[11px] font-mono ${
                  active ? "text-paper/80" : "text-muted-light"
                }`}
              >
                {n}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-card-bg rounded-2xl border border-divider/60 overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.5fr_0.9fr_2fr_0.8fr_0.8fr_1.1fr] gap-4 px-5 py-3 border-b border-divider text-[11px] font-medium uppercase tracking-wider text-muted">
          <span>Client</span>
          <span>Period</span>
          <span>Issue</span>
          <span>Confidence</span>
          <span>Impact</span>
          <span>Recommended</span>
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted">Nothing here. Nice work.</div>
        ) : (
          items.map((it, idx) => {
            const c = clientById(it.clientId);
            return (
              <Link
                key={it.id}
                href={`/demo/a/item/${it.id}`}
                className={`block w-full text-left hover:bg-paper-warm/40 transition-colors ${
                  idx !== items.length - 1 ? "border-b border-divider/60" : ""
                }`}
              >
                <div className="hidden md:grid grid-cols-[1.5fr_0.9fr_2fr_0.8fr_0.8fr_1.1fr] gap-4 px-5 py-4 items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{c.name}</p>
                    <p className="text-xs text-muted truncate">{c.trade}</p>
                  </div>
                  <div className="text-xs text-muted">{it.period}</div>
                  <div className="min-w-0">
                    <p className="text-sm text-ink font-medium">{it.issue}</p>
                    <p className="text-xs text-muted truncate">{it.detail}</p>
                  </div>
                  <div>
                    <ConfidencePill c={it.confidence} />
                  </div>
                  <div>
                    <ImpactPill i={it.impact} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-ink">{it.recommended}</span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-muted-light flex-shrink-0">
                      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                <div className="md:hidden px-4 py-4">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-wider uppercase text-muted">
                        {c.name} · {it.period}
                      </p>
                      <p className="text-sm font-medium text-ink mt-0.5">{it.issue}</p>
                    </div>
                    <ImpactPill i={it.impact} />
                  </div>
                  <p className="text-xs text-muted mb-2">{it.detail}</p>
                  <div className="flex items-center justify-between">
                    <ConfidencePill c={it.confidence} />
                    <span className="text-[11px] text-muted">{it.recommended} →</span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <FloatingActivity />
    </div>
  );
}
