import Link from "next/link";
import { notFound } from "next/navigation";
import { DRAFTS, clientById, taskById } from "../../_lib/data";
import { BackLink, Breadcrumbs, ChannelBadge } from "../../_lib/ui";
import { DraftActions } from "./actions";

export function generateStaticParams() {
  return DRAFTS.map((d) => ({ id: d.id }));
}

export default async function DraftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const draft = DRAFTS.find((d) => d.id === id);
  if (!draft) notFound();

  const client = clientById(draft.clientId);
  const task = draft.taskId ? taskById(draft.taskId) : undefined;

  return (
    <div className="pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-[860px] mx-auto w-full">
      <BackLink href="/demo/c/drafts" label="Drafts" />
      <div className="pb-5 mb-6 mt-3 border-b border-divider">
        <Breadcrumbs
          items={[
            { label: "Mission control", href: "/demo/c" },
            { label: "Drafts", href: "/demo/c/drafts" },
            { label: client.name },
          ]}
        />
        <div className="flex items-center gap-2 mb-2">
          <ChannelBadge ch={draft.channel} />
          <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">{client.name}</span>
          <span className="w-1 h-1 rounded-full bg-divider" />
          <span className="text-[11px] text-muted">{draft.createdAt}</span>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-ink leading-tight tracking-tight [text-wrap:balance]">
          {draft.subject ?? `Message to ${draft.recipient}`}
        </h1>
        <p className="text-sm text-muted mt-1.5">
          Authored by <span className="text-ink font-medium">{draft.authoredBy}</span>. Will not send without approval.
        </p>
      </div>

      {/* Letterhead-style draft preview */}
      <article className="bg-card-bg rounded-2xl border border-divider/60 overflow-hidden mb-6">
        <header className="px-6 py-4 border-b border-divider/60 bg-paper-warm/40">
          <dl className="grid grid-cols-[80px_1fr] gap-x-4 gap-y-1 text-[12px]">
            <dt className="text-muted-light tracking-wider uppercase text-[10px] mt-0.5">Channel</dt>
            <dd className="text-ink">{draft.channel}</dd>
            <dt className="text-muted-light tracking-wider uppercase text-[10px] mt-0.5">To</dt>
            <dd className="text-ink font-mono tabular-nums">{draft.recipient}</dd>
            {draft.subject && (
              <>
                <dt className="text-muted-light tracking-wider uppercase text-[10px] mt-0.5">Subject</dt>
                <dd className="text-ink">{draft.subject}</dd>
              </>
            )}
          </dl>
        </header>
        <div className="px-6 py-6">
          <p className="text-[15px] text-ink leading-relaxed whitespace-pre-line [text-wrap:pretty]">
            {draft.body}
          </p>
        </div>
        <footer className="px-6 py-3 border-t border-divider/60 bg-paper-warm/30 flex items-center justify-between">
          <span className="text-[11px] text-muted-light tracking-wider uppercase">Draft · not sent</span>
          {task && (
            <Link href={`/demo/c/task/${task.id}`} className="text-[11px] text-accent accent-link">
              Linked task →
            </Link>
          )}
        </footer>
      </article>

      <DraftActions body={draft.body} />
    </div>
  );
}
