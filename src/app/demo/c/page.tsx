import Link from "next/link";
import {
  ACTIVITY,
  ASSIGNEES,
  SUGGESTIONS,
  TASKS,
  assigneeById,
  clientById,
} from "./_lib/data";
import {
  AssigneeAvatar,
  AssigneeChip,
  Breadcrumbs,
  KindDot,
  LiveStatus,
  PriorityPill,
  SlaTimer,
  StatusPill,
} from "./_lib/ui";

export default function WorkInMotionPage() {
  const open = TASKS.filter((t) => t.status !== "done");
  const done = TASKS.filter((t) => t.status === "done");

  const dueToday = open.filter((t) => t.slaState === "due_today");
  const overdue = open.filter((t) => t.slaState === "overdue");
  const blocked = open.filter((t) => t.status === "blocked");
  const needsClient = open.filter((t) => !!t.draftId);

  // Workload by assignee (humans only)
  const humans = ASSIGNEES.filter((a) => a.id !== "u-ai");
  const loadByAssignee = humans.map((a) => ({
    a,
    open: open.filter((t) => t.assigneeId === a.id).length,
  }));
  const maxLoad = Math.max(1, ...loadByAssignee.map((x) => x.open));

  return (
    <div className="pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="pb-5 mb-6 border-b border-divider">
        <Breadcrumbs items={[{ label: "Mission control", href: "/demo/c" }, { label: "Work in motion" }]} />
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted mb-1.5">
          Friday 25 April · 12:04
        </p>
        <h1 className="font-serif text-3xl md:text-4xl leading-tight tracking-tight text-ink [text-wrap:balance]">
          Who&rsquo;s got what
        </h1>
        <p className="text-sm text-muted mt-1.5 [text-wrap:pretty]">
          {open.length} open. <span className="text-ink font-medium">{dueToday.length} due today</span>,{" "}
          {overdue.length > 0 && (
            <span className="text-[color:var(--alert-ink)] font-medium">{overdue.length} overdue, </span>
          )}
          {blocked.length} blocked, {needsClient.length} waiting on a client. {done.length} closed since 09:00.
        </p>
        <div className="mt-3 lg:hidden">
          <LiveStatus />
        </div>
      </div>

      {/* SLA strip */}
      <section className="mb-8" aria-label="SLA summary">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SlaTile
            label="Overdue"
            count={overdue.length}
            tone="alert"
            href="/demo/c/board?filter=overdue"
            sub={overdue[0]?.title}
          />
          <SlaTile
            label="Due today"
            count={dueToday.length}
            tone="accent"
            href="/demo/c/board?filter=due_today"
            sub={dueToday[0]?.title}
          />
          <SlaTile
            label="Waiting on client"
            count={needsClient.length}
            tone="muted"
            href="/demo/c/drafts"
            sub={`${needsClient.filter((t) => t.slaState === "waiting").length} chase drafts ready`}
          />
          <SlaTile
            label="Blocked"
            count={blocked.length}
            tone="muted"
            href="/demo/c/board?filter=blocked"
            sub={blocked[0]?.blockerNote}
          />
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 mb-10">
        {/* Left column: priority lane */}
        <div className="min-w-0">
          {/* Needs your call */}
          <section className="mb-8">
            <SectionHeader
              eyebrow="Priority lane"
              title="Needs your call today"
              right={<Link href="/demo/c/board" className="text-xs font-medium text-accent accent-link">Open the board →</Link>}
            />
            <div className="space-y-3">
              {[...overdue, ...dueToday].slice(0, 5).map((t) => {
                const a = assigneeById(t.assigneeId);
                const client = clientById(t.clientId);
                return (
                  <Link
                    key={t.id}
                    href={`/demo/c/task/${t.id}`}
                    className="pressable block bg-card-bg rounded-2xl border border-divider/60 p-5 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-12px_rgba(13,115,119,0.25)] transition-[transform,box-shadow] duration-200"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-1">
                          {client.name} · {client.trade}
                        </p>
                        <h3 className="text-sm font-medium text-ink [text-wrap:balance]">{t.title}</h3>
                      </div>
                      <SlaTimer state={t.slaState} label={t.slaLabel} />
                    </div>
                    <p className="text-xs text-muted mb-3 leading-relaxed [text-wrap:pretty]">{t.detail}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill s={t.status} />
                      <PriorityPill p={t.priority} />
                      <span className="ml-auto inline-flex items-center gap-1.5">
                        <AssigneeAvatar a={a} size={20} />
                        <span className="text-[11px] text-ink font-medium">{a.name}</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Blocked */}
          {blocked.length > 0 && (
            <section className="mb-8">
              <SectionHeader
                eyebrow="Blocked"
                title="Closing the loop"
                right={
                  <span className="text-xs text-muted">{blocked.length} need a nudge</span>
                }
              />
              <div className="bg-card-bg rounded-2xl border border-divider/60 overflow-hidden">
                {blocked.map((t, i) => {
                  const a = assigneeById(t.assigneeId);
                  const client = clientById(t.clientId);
                  return (
                    <Link
                      key={t.id}
                      href={`/demo/c/task/${t.id}`}
                      className={`block px-5 py-4 hover:bg-paper-warm/40 transition-colors duration-150 ${
                        i !== blocked.length - 1 ? "border-b border-divider/60" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[color:var(--alert-ink)] flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3 mb-0.5">
                            <p className="text-sm font-medium text-ink truncate">{t.title}</p>
                            <SlaTimer state={t.slaState} label={t.slaLabel} />
                          </div>
                          <p className="text-[11px] text-muted-light tracking-wider uppercase mb-1">
                            {client.name}
                          </p>
                          {t.blockerNote && (
                            <p className="text-xs text-muted leading-relaxed border-l-2 border-[color:var(--alert-line)] pl-3 mt-1">
                              {t.blockerNote}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <AssigneeChip a={a} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* AI suggestions teaser */}
          <section className="mb-2">
            <SectionHeader
              eyebrow="AI suggested"
              title="Pick up next"
              right={
                <Link href="/demo/c/suggestions" className="text-xs font-medium text-accent accent-link">
                  See all {SUGGESTIONS.length} →
                </Link>
              }
            />
            <div className="space-y-2">
              {SUGGESTIONS.slice(0, 3).map((s) => {
                const a = assigneeById(s.suggestedAssigneeId);
                const client = clientById(s.clientId);
                return (
                  <Link
                    key={s.id}
                    href="/demo/c/suggestions"
                    className="block bg-paper-warm/40 rounded-xl border border-dashed border-divider px-4 py-3 hover:border-accent/40 hover:bg-accent-light/30 transition-colors duration-150"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-0.5">
                          {client.name}
                        </p>
                        <p className="text-sm text-ink font-medium [text-wrap:balance]">{s.title}</p>
                        <p className="text-xs text-muted mt-0.5 [text-wrap:pretty]">{s.rationale}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-mono tabular-nums text-muted bg-card-bg px-2 py-0.5 rounded-full border border-divider">
                          ~{s.estimatedMinutes}m
                        </span>
                        <span className="text-[10px] text-muted-light">→ {a.name}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right column: people */}
        <aside className="min-w-0">
          <SectionHeader eyebrow="The team" title="Workload" />
          <div className="bg-card-bg rounded-2xl border border-divider/60 p-4 mb-6">
            <ul className="space-y-3">
              {loadByAssignee
                .sort((x, y) => y.open - x.open)
                .map(({ a, open }) => (
                  <li key={a.id}>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <AssigneeAvatar a={a} size={26} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink font-medium truncate">{a.name}</p>
                        <p className="text-[11px] text-muted-light truncate">{a.role}</p>
                      </div>
                      <span className="text-xs font-mono tabular-nums text-muted">{open}</span>
                    </div>
                    <div className="h-1.5 bg-paper-warm rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-[width] duration-500"
                        style={{ width: `${Math.round((open / maxLoad) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
            </ul>
          </div>

          {/* Recent activity */}
          <SectionHeader
            eyebrow="Last hour"
            title="Activity"
            right={
              <Link href="/demo/c/activity" className="text-xs font-medium text-accent accent-link">
                Full log →
              </Link>
            }
          />
          <div className="bg-card-bg rounded-2xl border border-divider/60 p-4">
            <ul className="space-y-3">
              {ACTIVITY.slice(0, 6).map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <KindDot k={e.kind} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-ink leading-snug">
                      <span className="text-muted font-mono tabular-nums">{e.time}</span>{" "}
                      <span className="text-muted">·</span>{" "}
                      <span className="text-ink">{e.actor}</span> {e.action.toLowerCase()}
                    </p>
                    <p className="text-xs text-muted truncate [text-wrap:pretty]">
                      {e.client ? <span className="text-muted">{e.client}: </span> : null}
                      {e.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Local sub-components ---------- */

function SectionHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-light mb-0.5">
          {eyebrow}
        </p>
        <h2 className="font-serif text-xl text-ink leading-tight">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function SlaTile({
  label,
  count,
  sub,
  tone,
  href,
}: {
  label: string;
  count: number;
  sub?: string;
  tone: "alert" | "accent" | "muted";
  href: string;
}) {
  const palette =
    tone === "alert"
      ? "bg-[color:var(--alert-soft)] border-[color:var(--alert-line)] text-[color:var(--alert-ink)]"
      : tone === "accent"
      ? "bg-accent-light border-accent/30 text-accent"
      : "bg-card-bg border-divider/60 text-ink";
  return (
    <Link
      href={href}
      className={`pressable block rounded-2xl border p-4 hover:-translate-y-0.5 transition-[transform,box-shadow] duration-200 hover:shadow-[0_6px_18px_-12px_rgba(0,0,0,0.18)] ${palette}`}
    >
      <p className="text-[10px] font-semibold tracking-[0.16em] uppercase opacity-80 mb-1">{label}</p>
      <p className="font-serif text-3xl leading-none tabular-nums">{count}</p>
      {sub && <p className="text-[11px] mt-2 opacity-80 line-clamp-2 [text-wrap:pretty]">{sub}</p>}
    </Link>
  );
}
