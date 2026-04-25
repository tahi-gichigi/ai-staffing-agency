import Link from "next/link";
import { ACTIVITY, CLAIMS, clientById, fmtGBP } from "./_lib/data";
import { Breadcrumbs, ConfidencePill, KindDot, MaterialityPill, StatusBadge } from "./_lib/ui";

export default function LedgerHomePage() {
  const openClaims = CLAIMS.filter((c) => c.status === "open");
  const decidedClaims = CLAIMS.filter((c) => c.status !== "open");

  const grouped = new Map<string, typeof openClaims>();
  for (const cl of openClaims) {
    const client = clientById(cl.clientId);
    const key = `${client.name} · ${cl.period}`;
    const list = grouped.get(key) ?? [];
    list.push(cl);
    grouped.set(key, list);
  }

  return (
    <div className="pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-[1000px] mx-auto w-full">
      {/* Header */}
      <div className="pb-5 mb-6 border-b border-divider">
        <Breadcrumbs items={[{ label: "Mission control", href: "/demo/b" }, { label: "Ledger" }]} />
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted mb-1.5">
          Friday 25 April
        </p>
        <h1 className="font-serif text-3xl md:text-4xl leading-tight tracking-tight text-ink [text-wrap:balance]">
          What changed and why
        </h1>
        <p className="text-sm text-muted mt-1.5 [text-wrap:pretty]">
          {openClaims.length} open claims need a decision.{" "}
          {decidedClaims.length > 0 && (
            <span className="text-ink font-medium">{decidedClaims.length} already resolved.</span>
          )}
        </p>
      </div>

      {/* Open claims grouped by client + period */}
      <section className="mb-10">
        <h2 className="font-serif text-xl text-ink mb-4">Open claims</h2>
        <div className="space-y-3">
          {[...grouped.entries()].map(([groupKey, claims]) => (
            <div key={groupKey}>
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-2 mt-4 first:mt-0">
                {groupKey}
              </p>
              {claims.map((cl) => (
                <Link
                  key={cl.id}
                  href={`/demo/b/claim/${cl.id}`}
                  className="pressable block bg-card-bg rounded-2xl border border-divider/60 p-5 mb-3 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-12px_rgba(13,115,119,0.25)] transition-[transform,box-shadow] duration-200"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-sm font-medium text-ink">{cl.title}</h3>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <StatusBadge s={cl.status} />
                    </div>
                  </div>
                  <p className="text-xs text-muted mb-3 leading-relaxed [text-wrap:pretty]">{cl.summary}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <ConfidencePill c={cl.confidence} />
                    <MaterialityPill m={cl.materiality} />
                    {cl.amount !== undefined && (
                      <span className="inline-flex items-center bg-paper-warm px-2.5 py-0.5 rounded-full text-[11px] text-ink font-mono tabular-nums">
                        {fmtGBP(cl.amount)}
                      </span>
                    )}
                    <span className="text-[11px] text-muted-light ml-auto">{cl.provenance}</span>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Decided claims */}
      {decidedClaims.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif text-xl text-ink mb-4">Decided</h2>
          <div className="space-y-3">
            {decidedClaims.map((cl) => {
              const client = clientById(cl.clientId);
              return (
                <Link
                  key={cl.id}
                  href={`/demo/b/claim/${cl.id}`}
                  className="pressable block bg-card-bg rounded-2xl border border-divider/60 p-5 hover:bg-paper-warm/40 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-wider uppercase text-muted mb-1">
                        {client.name} · {cl.period}
                      </p>
                      <h3 className="text-sm font-medium text-ink">{cl.title}</h3>
                    </div>
                    <StatusBadge s={cl.status} />
                  </div>
                  {cl.decisionNote && (
                    <p className="text-xs text-muted mt-2 leading-relaxed border-l-2 border-accent/30 pl-3">
                      {cl.decisionNote}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-light mt-2">
                    {cl.decidedBy}, {cl.decidedAt}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent activity preview */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-xl text-ink">Recent activity</h2>
          <Link href="/demo/b/activity" className="text-xs font-medium text-accent accent-link">
            Full log →
          </Link>
        </div>
        <div className="bg-card-bg rounded-2xl border border-divider/60 p-4">
          <ul className="space-y-3">
            {ACTIVITY.slice(0, 5).map((e) => (
              <li key={e.id} className="flex items-start gap-3">
                <KindDot k={e.kind} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-ink leading-snug">
                    <span className="text-muted font-mono tabular-nums">{e.time}</span> · {e.action}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {e.client}: {e.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
