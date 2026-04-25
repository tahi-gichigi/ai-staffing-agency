import { SUGGESTIONS, assigneeById, clientById } from "../_lib/data";
import { AssigneeAvatar, BackLink, Breadcrumbs, PriorityPill } from "../_lib/ui";
import { AcceptSuggestion } from "./actions";

export default function SuggestionsPage() {
  const totalMinutes = SUGGESTIONS.reduce((s, x) => s + x.estimatedMinutes, 0);

  return (
    <div className="pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-[1000px] mx-auto w-full">
      <BackLink href="/demo/c" label="Work in motion" />
      <div className="pb-5 mb-6 mt-3 border-b border-divider">
        <Breadcrumbs
          items={[
            { label: "Mission control", href: "/demo/c" },
            { label: "AI suggested" },
          ]}
        />
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted mb-1.5">
          AI suggested
        </p>
        <h1 className="font-serif text-2xl md:text-3xl text-ink leading-tight tracking-tight [text-wrap:balance]">
          Tasks the AI thinks should run today
        </h1>
        <p className="text-sm text-muted mt-1.5 [text-wrap:pretty]">
          {SUGGESTIONS.length} suggestions, ~{Math.round(totalMinutes / 60)}h total. Each one names an owner and the reason it&rsquo;s worth doing.
        </p>
      </div>

      <ol className="space-y-3">
        {SUGGESTIONS.map((s, i) => {
          const a = assigneeById(s.suggestedAssigneeId);
          const client = clientById(s.clientId);
          return (
            <li
              key={s.id}
              className="bg-card-bg rounded-2xl border border-divider/60 p-5 hover:border-accent/30 transition-colors duration-200"
            >
              <div className="flex items-start gap-4">
                <span className="font-serif text-2xl tabular-nums text-muted-light leading-none mt-0.5 w-7 text-right flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-0.5">
                        {client.name} · {client.trade}
                      </p>
                      <h3 className="text-base font-medium text-ink [text-wrap:balance]">{s.title}</h3>
                    </div>
                    <span className="text-[10px] font-mono tabular-nums text-muted bg-paper-warm px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                      ~{s.estimatedMinutes}m
                    </span>
                  </div>
                  <p className="text-sm text-muted leading-relaxed mt-1.5 [text-wrap:pretty] border-l-2 border-divider pl-3">
                    {s.rationale}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <PriorityPill p={s.priority} />
                    <span className="inline-flex items-center gap-1.5 bg-paper-warm rounded-full pl-1 pr-2.5 py-0.5">
                      <AssigneeAvatar a={a} size={20} />
                      <span className="text-[11px] text-ink">Suggested for {a.name}</span>
                    </span>
                    <span className="ml-auto">
                      <AcceptSuggestion id={s.id} assigneeName={a.name} />
                    </span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
