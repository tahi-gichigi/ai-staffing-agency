import Link from "next/link";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  TASKS,
  assigneeById,
  clientById,
} from "../_lib/data";
import type { TaskStatus } from "../_lib/data";
import {
  AssigneeAvatar,
  BackLink,
  Breadcrumbs,
  PriorityPill,
  SlaTimer,
} from "../_lib/ui";

export default function BoardPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  // searchParams not awaited - keep simple; render all
  void searchParams;

  const byStatus = new Map<TaskStatus, typeof TASKS>();
  for (const s of STATUS_ORDER) byStatus.set(s, []);
  for (const t of TASKS) byStatus.get(t.status)!.push(t);

  return (
    <div className="pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-[1400px] mx-auto w-full">
      <BackLink href="/demo/c" label="Work in motion" />
      <div className="pb-5 mb-6 mt-3 border-b border-divider">
        <Breadcrumbs
          items={[
            { label: "Mission control", href: "/demo/c" },
            { label: "Assign and track" },
          ]}
        />
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted mb-1.5">
          Assign and track
        </p>
        <h1 className="font-serif text-2xl md:text-3xl text-ink leading-tight tracking-tight [text-wrap:balance]">
          Move work through the team
        </h1>
        <p className="text-sm text-muted mt-1.5 [text-wrap:pretty]">
          Every task, every owner, every status. Click any card to update or add a note.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {STATUS_ORDER.map((status) => {
          const items = byStatus.get(status) ?? [];
          return (
            <div key={status} className="min-w-0 flex flex-col">
              <div className="flex items-baseline justify-between mb-3 px-1">
                <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
                  {STATUS_LABEL[status]}
                </h2>
                <span className="text-xs font-mono tabular-nums text-muted-light">{items.length}</span>
              </div>
              <div className="space-y-2.5 flex-1">
                {items.map((t) => {
                  const a = assigneeById(t.assigneeId);
                  const client = clientById(t.clientId);
                  const muted = t.status === "done";
                  return (
                    <Link
                      key={t.id}
                      href={`/demo/c/task/${t.id}`}
                      className={`pressable block rounded-xl border p-3.5 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 ${
                        muted
                          ? "bg-card-bg/60 border-divider/40 opacity-70"
                          : "bg-card-bg border-divider/60 hover:border-accent/30 hover:shadow-[0_6px_18px_-12px_rgba(13,115,119,0.22)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-light truncate">
                          {client.name}
                        </p>
                        <SlaTimer state={t.slaState} label={t.slaLabel} />
                      </div>
                      <p className={`text-sm leading-snug mb-2 [text-wrap:pretty] ${muted ? "text-muted line-through-friendly" : "text-ink"}`}>
                        {t.title}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <PriorityPill p={t.priority} />
                        <AssigneeAvatar a={a} size={22} />
                      </div>
                    </Link>
                  );
                })}
                {items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-divider/60 p-4 text-center">
                    <p className="text-[11px] text-muted-light">Nothing here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
