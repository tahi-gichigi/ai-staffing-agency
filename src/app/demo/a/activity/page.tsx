import { ACTIVITY } from "../_lib/data";
import { BackLink, Breadcrumbs } from "../_lib/ui";

export default function ActivityPage() {
  return (
    <div className="pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-[1000px] mx-auto w-full">
      <BackLink href="/demo/a" label="Mission control" />
      <div className="pb-5 mb-6 mt-3 border-b border-divider">
        <Breadcrumbs
          items={[
            { label: "Mission control", href: "/demo/a" },
            { label: "Activity log" },
          ]}
        />
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted mb-1.5">
          Activity log
        </p>
        <h1 className="font-serif text-2xl md:text-3xl text-ink leading-tight [text-wrap:balance]">Checks run today</h1>
        <p className="text-sm text-muted mt-1.5">
          Every automated check, in order. {ACTIVITY.length} events since 09:00.
        </p>
      </div>

      <div className="relative">
        <span className="absolute left-[11px] top-1 bottom-1 w-px bg-divider/80" aria-hidden />
        <ul className="space-y-4">
          {ACTIVITY.map((e) => (
            <li key={e.id} className="flex items-start gap-4">
              <span className="relative z-10 flex-shrink-0 mt-1">
                <span className="block w-[22px] h-[22px] rounded-full bg-card-bg border border-divider flex items-center justify-center">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      e.kind === "flag"
                        ? "bg-accent"
                        : e.kind === "ask"
                        ? "bg-accent/60"
                        : e.kind === "info"
                        ? "bg-muted-light"
                        : "bg-divider"
                    }`}
                  />
                </span>
              </span>
              <div className="flex-1 bg-card-bg rounded-xl border border-divider/60 px-4 py-3">
                <div className="flex items-center justify-between gap-3 mb-0.5">
                  <p className="text-sm text-ink font-medium">{e.check}</p>
                  <span className="text-xs font-mono tabular-nums text-muted">{e.time}</span>
                </div>
                <p className="text-xs text-muted">
                  <span className="text-ink">{e.client}</span> - {e.outcome}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
