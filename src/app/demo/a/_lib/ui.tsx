"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ActivityEvent, Confidence, Impact } from "./data";
import { LIVE_STATUS_CYCLE } from "./data";

export function ConfidencePill({ c }: { c: Confidence }) {
  const map: Record<Confidence, string> = {
    high: "bg-accent-light text-accent",
    medium: "bg-paper-warm text-ink",
    low: "bg-paper-warm text-muted",
  };
  return (
    <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${map[c]}`}>
      <span className="font-medium text-muted-light mr-1">Confidence</span>
      {c}
    </span>
  );
}

export function ImpactPill({ i }: { i: Impact }) {
  const cls =
    i === "high"
      ? "text-accent border-accent/40 bg-accent-light/40"
      : i === "medium"
      ? "text-ink border-divider bg-card-bg"
      : "text-muted border-divider bg-card-bg";
  return (
    <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${cls}`}>
      <span className="font-medium text-muted-light mr-1">Impact</span>
      {i}
    </span>
  );
}

export function KindDot({ k }: { k: ActivityEvent["kind"] }) {
  const color =
    k === "flag"
      ? "bg-accent"
      : k === "ask"
      ? "bg-accent/60"
      : k === "info"
      ? "bg-muted-light"
      : "bg-divider";
  return <span className={`w-2 h-2 rounded-full ${color} inline-block flex-shrink-0 mt-1.5`} />;
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

/* Primary section tabs inside the top nav.
   Active state: colour + weight + pill bg + leading dot (see globals.css .nav-item). */
const SECTIONS: { key: string; label: string; href: string; match: (p: string) => boolean }[] = [
  { key: "day", label: "Your day", href: "/demo/a", match: (p) => p === "/demo/a" },
  {
    key: "queue",
    label: "Queue",
    href: "/demo/a/queue/review",
    match: (p) => p.startsWith("/demo/a/queue") || p.startsWith("/demo/a/item"),
  },
  {
    key: "activity",
    label: "Activity",
    href: "/demo/a/activity",
    match: (p) => p.startsWith("/demo/a/activity"),
  },
];

export function TopNav() {
  const pathname = usePathname() || "/demo/a";
  return (
    <nav
      style={{ viewTransitionName: "nav-anchor" }}
      className="fixed top-0 left-0 right-0 z-50 nav-scrolled backdrop-blur-md border-b border-divider"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/demo/a"
            className="font-serif text-base sm:text-lg tracking-tight text-ink truncate"
            aria-label="AI Staffing Agency home"
          >
            AI Staffing Agency
          </Link>
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

/* Breadcrumb trail. Last crumb has no href -> rendered as the current page.
   All non-current crumbs are real links so users can jump back up. */
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
                className={last ? "crumb-current text-[11px] font-semibold tracking-[0.14em] uppercase" : "text-[11px] tracking-[0.12em] uppercase"}
                aria-current={last ? "page" : undefined}
              >
                {c.label}
              </span>
            ) : (
              <Link
                href={c.href}
                className="crumb-link text-[11px] tracking-[0.12em] uppercase"
              >
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

export function FloatingActivity({ show = true }: { show?: boolean }) {
  const pathname = usePathname() || "";
  if (!show) return null;
  if (pathname.startsWith("/demo/a/activity")) return null;
  return (
    <Link
      href="/demo/a/activity"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 bg-ink text-paper text-xs font-medium px-4 py-2.5 rounded-full shadow-lg hover:bg-ink/90 transition-colors"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
      Activity log
    </Link>
  );
}

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
