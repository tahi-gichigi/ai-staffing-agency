import { ACTIVITY } from "../_lib/data";
import { BackLink, Breadcrumbs } from "../_lib/ui";

export default function ActivityPage() {
  return (
    <div className="pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-[1000px] mx-auto w-full">
      <BackLink href="/demo/c" label="Work in motion" />
      <div className="pb-5 mb-6 mt-3 border-b border-divider">
        <Breadcrumbs
          items={[
            { label: "Mission control", href: "/demo/c" },
            { label: "Activity log" },
          ]}
        />
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted mb-1.5">
          Activity log
        </p>
        <h1 className="font-serif text-2xl md:text-3xl text-ink leading-tight [text-wrap:balance]">
          Who did what, and when
        </h1>
        <p className="text-sm text-muted mt-1.5">
          Every assignment, status change, draft, and close. {ACTIVITY.length} events since 09:00.
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
                      e.kind === "completed"
                        ? "bg-accent"
                        : e.kind === "assignment"
                        ? "bg-ink"
                        : e.kind === "draft"
                        ? "bg-accent/60"
                        : e.kind === "blocked"
                        ? "bg-[color:var(--alert-ink)]"
                        : e.kind === "suggestion"
                        ? "bg-muted-light"
                        : "bg-divider"
                    }`}
                  />
                </span>
              </span>
              <div className="flex-1 bg-card-bg rounded-xl border border-divider/60 px-4 py-3">
                <div className="flex items-center justify-between gap-3 mb-0.5">
                  <p className="text-sm text-ink font-medium">
                    <span className="text-ink">{e.actor}</span>{" "}
                    <span className="text-muted font-normal">{e.action.toLowerCase()}</span>
                  </p>
                  <span className="text-xs font-mono tabular-nums text-muted">{e.time}</span>
                </div>
                <p className="text-xs text-muted [text-wrap:pretty]">
                  {e.client && <span className="text-ink">{e.client}: </span>}
                  {e.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
