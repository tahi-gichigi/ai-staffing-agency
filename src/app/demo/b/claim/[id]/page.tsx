import { notFound } from "next/navigation";
import { CLAIMS, clientById, fmtGBP } from "../../_lib/data";
import type { Source, TransformStep } from "../../_lib/data";
import { BackLink, Breadcrumbs, ConfidencePill, MaterialityPill, StatusBadge } from "../../_lib/ui";
import { DecisionBar } from "./actions";

export function generateStaticParams() {
  return CLAIMS.map((cl) => ({ id: cl.id }));
}

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = CLAIMS.find((c) => c.id === id);
  if (!claim) notFound();

  const client = clientById(claim.clientId);

  return (
    <div className="pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-[1000px] mx-auto w-full">
      <BackLink href="/demo/b" label="Ledger" />

      {/* Header */}
      <div className="pb-5 mb-6 mt-3 border-b border-divider">
        <Breadcrumbs
          items={[
            { label: "Mission control", href: "/demo/b" },
            { label: "Ledger", href: "/demo/b" },
            { label: client.name },
          ]}
        />
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">{client.name}</span>
          <span className="w-1 h-1 rounded-full bg-divider" />
          <span className="text-[11px] text-muted">{client.trade}</span>
          <span className="w-1 h-1 rounded-full bg-divider" />
          <span className="text-[11px] text-muted">{claim.period}</span>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-ink leading-tight tracking-tight [text-wrap:balance]">
          {claim.title}
        </h1>
        <p className="text-sm text-muted mt-1.5 [text-wrap:pretty]">{claim.summary}</p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <ConfidencePill c={claim.confidence} />
          <MaterialityPill m={claim.materiality} />
          <StatusBadge s={claim.status} />
          {claim.amount !== undefined && (
            <span className="inline-flex items-center bg-paper-warm px-2.5 py-1 rounded-full text-[11px] text-ink font-mono tabular-nums">
              {fmtGBP(claim.amount)}
            </span>
          )}
          <span className="text-[11px] text-muted-light">{claim.provenance}</span>
        </div>
      </div>

      {/* Sources */}
      <SourcesPanel sources={claim.sources} />

      {/* Transformations */}
      <TransformationsPanel steps={claim.transformations} />

      {/* Match logic */}
      <section className="mb-6">
        <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-3">Match logic</h2>
        <div className="bg-card-bg rounded-2xl border border-divider/60 p-5">
          <ol className="space-y-2">
            {claim.matchLogic.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-ink leading-relaxed">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-paper-warm text-muted text-[10px] font-semibold flex items-center justify-center mt-0.5 tabular-nums">
                  {i + 1}
                </span>
                <span className="[text-wrap:pretty]">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Conclusion chain */}
      <section className="mb-6">
        <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-accent mb-3">Conclusion chain</h2>
        <div className="bg-accent-light/60 border border-accent/20 rounded-2xl p-5">
          <div className="relative">
            <span className="absolute left-[7px] top-3 bottom-3 w-px bg-accent/30" aria-hidden />
            <ul className="space-y-3">
              {claim.conclusionChain.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-ink leading-relaxed relative">
                  <span className="flex-shrink-0 w-[14px] h-[14px] rounded-full bg-accent-light border-2 border-accent/50 mt-1 z-10" />
                  <span className="[text-wrap:pretty]">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Decision record */}
      {claim.status !== "open" && claim.decisionNote && (
        <section className="mb-6">
          <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-3">Decision record</h2>
          <div className="bg-accent-light border border-accent/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge s={claim.status} />
              <span className="text-[11px] text-muted">{claim.decidedBy}, {claim.decidedAt}</span>
            </div>
            <p className="text-sm text-ink leading-relaxed border-l-2 border-accent/40 pl-3">
              {claim.decisionNote}
            </p>
          </div>
        </section>
      )}

      {/* Action bar for open claims */}
      {claim.status === "open" && <DecisionBar claimId={claim.id} />}
    </div>
  );
}

function SourcesPanel({ sources }: { sources: Source[] }) {
  return (
    <section className="mb-6">
      <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-3">Sources</h2>
      <div className="bg-card-bg rounded-2xl border border-divider/60 overflow-hidden">
        {sources.map((s, i) => (
          <div
            key={i}
            className={`px-5 py-3.5 ${i !== sources.length - 1 ? "border-b border-divider/60" : ""}`}
          >
            <div className="flex items-baseline justify-between gap-3 mb-0.5">
              <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-light">{s.label}</p>
              <span className="text-[10px] text-muted-light tracking-wider uppercase">{s.origin}</span>
            </div>
            <p className="text-sm text-ink font-mono tabular-nums break-words">{s.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TransformationsPanel({ steps }: { steps: TransformStep[] }) {
  return (
    <section className="mb-6">
      <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-3">Transformations</h2>
      <div className="bg-card-bg rounded-2xl border border-divider/60 overflow-hidden">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`px-5 py-3.5 ${i !== steps.length - 1 ? "border-b border-divider/60" : ""}`}
          >
            <p className="text-sm text-ink font-medium mb-0.5">{s.action}</p>
            <p className="text-xs text-muted leading-relaxed">{s.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
