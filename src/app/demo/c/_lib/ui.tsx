"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ActivityEvent, Assignee, Priority, TaskStatus } from "./data";
import { LIVE_STATUS_CYCLE, STATUS_LABEL } from "./data";

/* ------------------------------------------------------------------ */
/* Pills, badges, dots                                                 */
/* ------------------------------------------------------------------ */

export function StatusPill({ s, size = "sm" }: { s: TaskStatus; size?: "sm" | "md" }) {
  const map: Record<TaskStatus, string> = {
    not_started: "bg-paper-warm text-muted border-divider",
    in_progress: "bg-accent-light text-accent border-accent/30",
    in_review: "bg-paper-warm text-ink border-divider",
    blocked: "bg-[color:var(--alert-soft)] text-[color:var(--alert-ink)] border-[color:var(--alert-line)]",
    done: "bg-card-bg text-muted-light border-divider line-through-friendly",
  };
  const dot: Record<TaskStatus, string> = {
    not_started: "bg-muted-light",
    in_progress: "bg-accent",
    in_review: "bg-ink",
    blocked: "bg-[color:var(--alert-ink)]",
    done: "bg-muted-light",
  };
  const padding = size === "md" ? "px-2.5 py-1" : "px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase rounded-full border ${padding} ${map[s]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot[s]}`} aria-hidden />
      {STATUS_LABEL[s]}
    </span>
  );
}

export function PriorityPill({ p }: { p: Priority }) {
  const cls =
    p === "high"
      ? "text-[color:var(--alert-ink)] border-[color:var(--alert-line)] bg-[color:var(--alert-soft)]"
      : p === "medium"
      ? "text-ink border-divider bg-card-bg"
      : "text-muted border-divider bg-card-bg";
  return (
    <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${cls}`}>
      <span className="font-medium text-muted-light mr-1">Priority</span>
      {p}
    </span>
  );
}

export function SlaTimer({
  state,
  label,
}: {
  state: "due_today" | "overdue" | "waiting" | "on_track";
  label: string;
}) {
  const palette: Record<typeof state, string> = {
    overdue: "text-[color:var(--alert-ink)] bg-[color:var(--alert-soft)] border-[color:var(--alert-line)]",
    due_today: "text-accent bg-accent-light border-accent/30",
    waiting: "text-muted bg-paper-warm border-divider",
    on_track: "text-muted-light bg-card-bg border-divider",
  };
  const icon = state === "overdue" ? "!" : state === "due_today" ? "•" : state === "waiting" ? "…" : "·";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border font-mono tabular-nums ${palette[state]}`}
    >
      <span aria-hidden className="text-[11px] leading-none">{icon}</span>
      {label}
    </span>
  );
}

export function AssigneeAvatar({
  a,
  size = 24,
  ring = false,
}: {
  a: Assignee;
  size?: number;
  ring?: boolean;
}) {
  const isAI = a.id === "u-ai";
  return (
    <span
      title={`${a.name} · ${a.role}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={`inline-flex items-center justify-center rounded-full font-semibold tracking-wider uppercase select-none flex-shrink-0 ${
        isAI
          ? "bg-ink text-paper"
          : "bg-paper-warm text-ink"
      } ${ring ? "ring-2 ring-card-bg" : ""}`}
    >
      {a.initials}
    </span>
  );
}

export function AssigneeChip({ a }: { a: Assignee }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
      <AssigneeAvatar a={a} size={20} />
      <span className="text-ink font-medium">{a.name}</span>
    </span>
  );
}

export function KindDot({ k }: { k: ActivityEvent["kind"] }) {
  const color =
    k === "completed"
      ? "bg-accent"
      : k === "assignment"
      ? "bg-ink"
      : k === "draft"
      ? "bg-accent/60"
      : k === "blocked"
      ? "bg-[color:var(--alert-ink)]"
      : k === "suggestion"
      ? "bg-muted-light"
      : "bg-divider";
  return <span className={`w-2 h-2 rounded-full ${color} inline-block flex-shrink-0 mt-1.5`} />;
}

export function ChannelBadge({ ch }: { ch: "Email" | "WhatsApp" | "Slack" }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase text-accent bg-accent-light px-2 py-0.5 rounded-full">
      {ch}
    </span>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] uppercase text-accent bg-accent-light px-2.5 py-1 rounded-full whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
      Demo · fixtures only
    </span>
  );
}

export function LiveStatus() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % LIVE_STATUS_CYCLE.length), 3200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2.5 text-xs text-muted">
      <span className="relative flex w-2 h-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
      </span>
      <span className="truncate">{LIVE_STATUS_CYCLE[i]}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Top nav + breadcrumbs                                               */
/* ------------------------------------------------------------------ */

const SECTIONS: { key: string; label: string; href: string; match: (p: string) => boolean }[] = [
  {
    key: "home",
    label: "Work in motion",
    href: "/demo/c",
    match: (p) => p === "/demo/c" || p.startsWith("/demo/c/task"),
  },
  {
    key: "board",
    label: "Assign and track",
    href: "/demo/c/board",
    match: (p) => p.startsWith("/demo/c/board"),
  },
  {
    key: "suggestions",
    label: "Suggested",
    href: "/demo/c/suggestions",
    match: (p) => p.startsWith("/demo/c/suggestions"),
  },
  {
    key: "drafts",
    label: "Drafts",
    href: "/demo/c/drafts",
    match: (p) => p.startsWith("/demo/c/drafts"),
  },
  {
    key: "activity",
    label: "Activity",
    href: "/demo/c/activity",
    match: (p) => p.startsWith("/demo/c/activity"),
  },
];

export function TopNav() {
  const pathname = usePathname() || "/demo/c";
  return (
    <nav
      style={{ viewTransitionName: "nav-anchor" }}
      className="fixed top-0 left-0 right-0 z-50 nav-scrolled backdrop-blur-md border-b border-divider"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/demo/c"
            className="font-serif text-base sm:text-lg tracking-tight text-ink truncate"
            aria-label="AI Staffing Agency home"
          >
            AI Staffing Agency
          </Link>
          <span className="hidden md:inline-block h-5 w-px bg-divider" aria-hidden />
          <span className="hidden md:inline text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-light">
            Alt C
          </span>
          <span className="hidden md:inline-block h-5 w-px bg-divider" aria-hidden />
          <ul className="hidden md:flex items-center gap-1" role="list">
            {SECTIONS.map((s) => {
              const active = s.match(pathname);
              return (
                <li key={s.key}>
                  <Link
                    href={s.href}
                    className="nav-item"
                    data-active={active ? "true" : "false"}
                    aria-current={active ? "page" : undefined}
                  >
                    {s.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden lg:flex">
            <LiveStatus />
          </span>
          <DemoBadge />
        </div>
      </div>
    </nav>
  );
}

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="crumb-trail mb-2">
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="crumb-sep" aria-hidden>›</span>}
            {last || !c.href ? (
              <span
                className={
                  last
                    ? "crumb-current text-[11px] font-semibold tracking-[0.14em] uppercase"
                    : "text-[11px] tracking-[0.12em] uppercase"
                }
                aria-current={last ? "page" : undefined}
              >
                {c.label}
              </span>
            ) : (
              <Link href={c.href} className="crumb-link text-[11px] tracking-[0.12em] uppercase">
                {c.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="back-link" aria-label={`Back to ${label}`}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M8.75 3L4.75 7l4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{label}</span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

export function Footer() {
  return (
    <footer className="border-t border-divider py-6 px-6 md:px-8">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
        <span className="font-serif text-sm text-ink">AI Staffing Agency</span>
        <span className="flex items-center gap-3">
          <DemoBadge />
          <Link href="/" className="accent-link text-accent">
            Back to home
          </Link>
        </span>
      </div>
    </footer>
  );
}
