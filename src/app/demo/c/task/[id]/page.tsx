import Link from "next/link";
import { notFound } from "next/navigation";
import { DRAFTS, TASKS, assigneeById, clientById } from "../../_lib/data";
import {
  AssigneeAvatar,
  BackLink,
  Breadcrumbs,
  ChannelBadge,
  PriorityPill,
  SlaTimer,
  StatusPill,
} from "../../_lib/ui";
import { TaskActions } from "./actions";

export function generateStaticParams() {
  return TASKS.map((t) => ({ id: t.id }));
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = TASKS.find((t) => t.id === id);
  if (!task) notFound();

  const client = clientById(task.clientId);
  const assignee = assigneeById(task.assigneeId);
  const draft = task.draftId ? DRAFTS.find((d) => d.id === task.draftId) : undefined;

  return (
    <div className="pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-[1000px] mx-auto w-full">
      <BackLink href="/demo/c" label="Work in motion" />
      <div className="pb-5 mb-6 mt-3 border-b border-divider">
        <Breadcrumbs
          items={[
            { label: "Mission control", href: "/demo/c" },
            { label: "Assign and track", href: "/demo/c/board" },
            { label: client.name },
          ]}
        />
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">{client.name}</span>
          <span className="w-1 h-1 rounded-full bg-divider" />
          <span className="text-[11px] text-muted">{client.trade}</span>
          <span className="w-1 h-1 rounded-full bg-divider" />
          <span className="text-[11px] text-muted">{task.source}</span>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-ink leading-tight tracking-tight [text-wrap:balance]">
          {task.title}
        </h1>
        <p className="text-sm text-muted mt-1.5 [text-wrap:pretty]">{task.detail}</p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <StatusPill s={task.status} size="md" />
          <PriorityPill p={task.priority} />
          <SlaTimer state={task.slaState} label={task.slaLabel} />
          <span className="text-[11px] text-muted-light">Due {task.dueLabel}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="min-w-0">
          {/* Evidence */}
          {task.evidence && task.evidence.length > 0 && (
            <section className="mb-6">
              <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-3">
                Evidence attached
              </h2>
              <div className="bg-card-bg rounded-2xl border border-divider/60 overflow-hidden">
                {task.evidence.map((e, i) => (
                  <div
                    key={i}
                    className={`px-5 py-3 flex items-start gap-3 ${
                      i !== task.evidence!.length - 1 ? "border-b border-divider/60" : ""
                    }`}
                  >
                    <span className="font-serif text-sm text-muted-light tabular-nums w-5 flex-shrink-0 mt-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm text-ink font-mono tabular-nums leading-relaxed [text-wrap:pretty]">{e}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Blocker */}
          {task.blockerNote && (
            <section className="mb-6">
              <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[color:var(--alert-ink)] mb-3">
                Blocker
              </h2>
              <div className="bg-[color:var(--alert-soft)] border border-[color:var(--alert-line)] rounded-2xl p-5">
                <p className="text-sm text-[color:var(--alert-ink)] leading-relaxed [text-wrap:pretty]">{task.blockerNote}</p>
              </div>
            </section>
          )}

          {/* Linked draft */}
          {draft && (
            <section className="mb-6">
              <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-3">
                Drafted client message
              </h2>
              <div className="bg-card-bg rounded-2xl border border-divider/60 overflow-hidden">
                <div className="px-5 py-3 border-b border-divider/60 bg-paper-warm/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <ChannelBadge ch={draft.channel} />
                    <span className="text-[11px] text-muted truncate">To {draft.recipient}</span>
                  </div>
                  <span className="text-[10px] text-muted-light tracking-wider uppercase">{draft.authoredBy}</span>
                </div>
                <div className="px-5 py-4">
                  {draft.subject && (
                    <p className="text-sm font-medium text-ink mb-2">{draft.subject}</p>
                  )}
                  <p className="text-sm text-ink leading-relaxed whitespace-pre-line line-clamp-6 [text-wrap:pretty]">
                    {draft.body}
                  </p>
                </div>
                <div className="px-5 py-2.5 border-t border-divider/60 flex items-center justify-between">
                  <span className="text-[11px] text-muted-light tracking-wider uppercase">Draft · not sent</span>
                  <Link href={`/demo/c/drafts/${draft.id}`} className="text-[11px] text-accent accent-link">
                    Open draft →
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Activity placeholder */}
          <section className="mb-6">
            <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-3">
              On this task
            </h2>
            <div className="bg-card-bg rounded-2xl border border-divider/60 p-5">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-[11px] text-muted font-mono tabular-nums w-12 flex-shrink-0 mt-0.5">11:42</span>
                  <p className="text-ink leading-relaxed">
                    <span className="text-muted">AI</span> drafted a message and attached it to this task.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[11px] text-muted font-mono tabular-nums w-12 flex-shrink-0 mt-0.5">11:22</span>
                  <p className="text-ink leading-relaxed">
                    <span className="text-muted">Colin M.</span> assigned the task to <span className="text-ink font-medium">{assignee.name}</span>.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[11px] text-muted font-mono tabular-nums w-12 flex-shrink-0 mt-0.5">09:02</span>
                  <p className="text-ink leading-relaxed">
                    <span className="text-muted">AI</span> created the task from {task.source.toLowerCase()}.
                  </p>
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Right rail: assignment */}
        <aside className="min-w-0">
          <div className="lg:sticky lg:top-20">
            <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-3">
              Assigned to
            </h2>
            <div className="bg-card-bg rounded-2xl border border-divider/60 p-4 mb-4">
              <div className="flex items-center gap-3">
                <AssigneeAvatar a={assignee} size={36} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{assignee.name}</p>
                  <p className="text-[11px] text-muted-light truncate">{assignee.role}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-divider/60">
                <p className="text-[11px] text-muted">
                  Currently has <span className="text-ink font-medium tabular-nums">{assignee.load}</span> open tasks.
                </p>
              </div>
            </div>

            <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-3">
              Update status
            </h2>
            <TaskActions taskId={task.id} currentStatus={task.status} />
          </div>
        </aside>
      </div>
    </div>
  );
}
