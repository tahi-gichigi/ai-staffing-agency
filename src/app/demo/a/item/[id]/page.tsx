import { notFound } from "next/navigation";
import { ITEMS, clientById, fmtGBP } from "../../_lib/data";
import type { Evidence } from "../../_lib/data";
import { BUCKETS } from "../../_lib/data";
import { BackLink, Breadcrumbs, ConfidencePill, FloatingActivity, ImpactPill } from "../../_lib/ui";
import { ActionBar } from "./actions";

export function generateStaticParams() {
  return ITEMS.map((it) => ({ id: it.id }));
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = ITEMS.find((i) => i.id === id);
  if (!item) notFound();

  const c = clientById(item.clientId);
  const bucketLabel = BUCKETS.find((b) => b.key === item.bucket)?.label ?? "Queue";

  return (
    <div className="pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-[1200px] mx-auto w-full">
      <BackLink href={`/demo/a/queue/${item.bucket}`} label={bucketLabel} />

      {/* Header */}
      <div className="pb-5 mb-6 mt-3 border-b border-divider">
        <Breadcrumbs
          items={[
            { label: "Mission control", href: "/demo/a" },
            { label: "Queue", href: "/demo/a/queue/review" },
            { label: bucketLabel, href: `/demo/a/queue/${item.bucket}` },
            { label: c.name },
          ]}
        />
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">{c.name}</span>
          <span className="w-1 h-1 rounded-full bg-divider" />
          <span className="text-[11px] text-muted">{c.trade}</span>
          <span className="w-1 h-1 rounded-full bg-divider" />
          <span className="text-[11px] text-muted">{item.period}</span>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-ink leading-tight tracking-tight [text-wrap:balance]">
          {item.issue}
        </h1>
        <p className="text-sm text-muted mt-1.5">{item.detail}</p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <ConfidencePill c={item.confidence} />
          <ImpactPill i={item.impact} />
          {item.amount !== undefined && (
            <span className="inline-flex items-center gap-1.5 bg-paper-warm px-2.5 py-1 rounded-full text-[11px] text-ink font-mono tabular-nums">
              {fmtGBP(item.amount)}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 bg-paper-warm px-2.5 py-1 rounded-full text-[11px] text-muted">
            Flagged {item.age}
          </span>
        </div>
      </div>

      {/* Evidence side by side */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <EvidencePanel title="On the transaction" entries={item.evidenceLeft} />
        <EvidencePanel title="What I checked against" entries={item.evidenceRight} />
      </div>

      {/* Rationale */}
      <div className="bg-accent-light/60 border border-accent/20 rounded-2xl p-5 md:p-6 mb-6">
        <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-accent mb-2">Rationale</p>
        <ul className="space-y-1.5">
          {item.rationale.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-ink leading-relaxed">
              <span className="mt-1 w-1 h-1 rounded-full bg-accent flex-shrink-0" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted mt-3">
          Recommended action: <span className="text-ink font-medium">{item.recommended}</span>
        </p>
      </div>

      {item.waitingFor && (
        <div className="bg-card-bg border border-divider/60 rounded-xl px-4 py-3 mb-6 text-sm text-muted">
          <span className="text-ink font-medium">Waiting on:</span> {item.waitingFor}
        </div>
      )}
      {item.assignedTo && (
        <div className="bg-card-bg border border-divider/60 rounded-xl px-4 py-3 mb-6 text-sm text-muted">
          <span className="text-ink font-medium">Assigned to:</span> {item.assignedTo}
        </div>
      )}
      {item.resolution && (
        <div className="bg-accent-light border border-accent/30 rounded-xl px-4 py-3 mb-6 text-sm text-accent-dark">
          {item.resolution}
        </div>
      )}

      {item.bucket !== "done" && <ActionBar returnBucket={item.bucket} />}

      <FloatingActivity />
    </div>
  );
}

function EvidencePanel({ title, entries }: { title: string; entries: Evidence[] }) {
  return (
    <div className="bg-card-bg rounded-2xl border border-divider/60 p-5">
      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-3">{title}</p>
      <ul className="space-y-3">
        {entries.map((e, i) => (
          <li key={i} className="pb-3 border-b border-divider/60 last:border-0 last:pb-0">
            <p className="text-[11px] text-muted-light uppercase tracking-wider">{e.label}</p>
            <p className="text-sm text-ink mt-0.5 font-mono tabular-nums break-words">{e.value}</p>
            <p className="text-[11px] text-muted mt-0.5">{e.source}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
