import Link from "next/link";
import { DRAFTS, clientById, taskById } from "../_lib/data";
import { BackLink, Breadcrumbs, ChannelBadge } from "../_lib/ui";

export default function DraftsPage() {
  return (
    <div className="pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-[1000px] mx-auto w-full">
      <BackLink href="/demo/c" label="Work in motion" />
      <div className="pb-5 mb-6 mt-3 border-b border-divider">
        <Breadcrumbs
          items={[
            { label: "Mission control", href: "/demo/c" },
            { label: "Client request drafts" },
          ]}
        />
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted mb-1.5">
          Client request drafts
        </p>
        <h1 className="font-serif text-2xl md:text-3xl text-ink leading-tight tracking-tight [text-wrap:balance]">
          Drafted, never sent
        </h1>
        <p className="text-sm text-muted mt-1.5 [text-wrap:pretty]">
          {DRAFTS.length} messages ready to review. Nothing leaves until a human approves.
        </p>
      </div>

      <ul className="space-y-3">
        {DRAFTS.map((d) => {
          const client = clientById(d.clientId);
          const task = d.taskId ? taskById(d.taskId) : undefined;
          return (
            <li key={d.id}>
              <Link
                href={`/demo/c/drafts/${d.id}`}
                className="pressable block bg-card-bg rounded-2xl border border-divider/60 p-5 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-12px_rgba(13,115,119,0.22)] hover:border-accent/30 transition-[transform,box-shadow,border-color] duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-0.5">
                      {client.name}
                    </p>
                    <h3 className="text-sm font-medium text-ink [text-wrap:balance]">
                      {d.subject ?? `Message to ${d.recipient}`}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ChannelBadge ch={d.channel} />
                  </div>
                </div>
                <p className="text-xs text-muted mb-3 leading-relaxed line-clamp-2 [text-wrap:pretty]">
                  {d.body.split("\n").join(" ").trim()}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px]">
                  <span className="text-muted-light">To: <span className="text-ink">{d.recipient}</span></span>
                  <span className="text-muted-light">By: <span className="text-ink">{d.authoredBy}</span></span>
                  <span className="text-muted-light">{d.createdAt}</span>
                  {task && (
                    <span className="ml-auto text-accent accent-link">
                      Task → {task.title.length > 40 ? task.title.slice(0, 40) + "…" : task.title}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
