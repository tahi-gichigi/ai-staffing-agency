"use client";

import { useEffect, useRef, useState } from "react";

/* ==================================================================
 * Reconciliation demo - product UI with fixtures.
 * Three views: workspace -> reconciling -> results.
 * The "Demo · fixtures only" badge does all the framing work.
 * ================================================================== */

/* ------------------------------ Fixtures ---------------------------- */

type Txn = {
  id: string;
  date: string;
  description: string;
  amount: number;
  note?: string;
};

type Invoice = {
  id: string;
  vendor: string;
  amount: number;
  date: string;
  ref: string;
};

const STATEMENT: Txn[] = [
  { id: "t1", date: "12 Mar", description: "AMZN*2847XJ  LUXEMBOURG", amount: -142.6, note: "Cryptic vendor code" },
  { id: "t2", date: "14 Mar", description: "STRIPE PAYOUT ref 88271", amount: 3200.0 },
  { id: "t3", date: "15 Mar", description: "ACME BUILDERS LTD", amount: -2400.0, note: "One payment, three invoices" },
  { id: "t4", date: "18 Mar", description: "AMZN*2847XJ  LUXEMBOURG", amount: -142.6, note: "Duplicate?" },
  { id: "t5", date: "20 Mar", description: "TFL TRAVEL CHARGE", amount: -8.4 },
  { id: "t6", date: "22 Mar", description: "CARD PURCHASE 4821 HTL LISBON", amount: -684.0, note: "No receipt on file" },
  { id: "t7", date: "24 Mar", description: "BRIGHT SPARK ELEC", amount: -980.0 },
  { id: "t8", date: "26 Mar", description: "DD ENERGIA LISBOA", amount: -318.72, note: "31% higher than usual" },
];

const INVOICES: Invoice[] = [
  { id: "i1", vendor: "Amazon Web Services", amount: 142.6, date: "10 Mar", ref: "INV-AWS-0312" },
  { id: "i2", vendor: "Acme Builders - Kitchen fit", amount: 900.0, date: "02 Mar", ref: "ACM-204" },
  { id: "i3", vendor: "Acme Builders - Plumbing", amount: 650.0, date: "05 Mar", ref: "ACM-208" },
  { id: "i4", vendor: "Acme Builders - Electrics", amount: 850.0, date: "08 Mar", ref: "ACM-211" },
  { id: "i5", vendor: "Bright Spark Electrical", amount: 980.0, date: "21 Mar", ref: "BSE-0042" },
];

type ProcStep = { label: string; result: string };

const PROCESSING_STEPS: ProcStep[] = [
  { label: "Parsing bank statement", result: "8 transactions parsed" },
  { label: "Reading invoice library", result: "5 invoices indexed" },
  { label: "Matching transactions to invoices", result: "3 matches found" },
  { label: "Resolving vendor name mismatches", result: "1 vendor code resolved" },
  { label: "Checking for duplicates and split payments", result: "1 split, 1 duplicate flagged" },
  { label: "Spotting anomalies against 12 months of history", result: "1 anomaly flagged" },
  { label: "Drafting chase messages for gaps", result: "2 chases drafted" },
];

/* ------------------------------ UI bits ----------------------------- */

function DemoBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold tracking-[0.14em] sm:tracking-[0.18em] uppercase text-accent bg-accent-light px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block flex-shrink-0" />
      <span className={compact ? "hidden sm:inline" : ""}>Demo · fixtures only</span>
      <span className={compact ? "sm:hidden" : "hidden"}>Demo</span>
    </span>
  );
}

function DemoNav({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Workspace", "Reconciling", "Results"];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-scrolled backdrop-blur-md border-b border-divider">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 lg:px-20 h-16 flex items-center justify-between gap-3">
        <a href="/" className="font-serif text-base sm:text-lg md:text-xl tracking-tight text-ink truncate">
          AI Staffing Agency
        </a>
        <div className="hidden md:flex items-center gap-3 text-xs text-muted">
          {labels.map((l, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <span
                key={l}
                className={`flex items-center gap-1.5 ${active ? "text-ink font-medium" : done ? "text-accent" : ""}`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                    active ? "bg-accent text-white" : done ? "bg-accent-light text-accent" : "bg-paper-warm text-muted"
                  }`}
                >
                  {n}
                </span>
                {l}
              </span>
            );
          })}
        </div>
        <DemoBadge compact />
      </div>
    </nav>
  );
}

/* -------------------------- Workspace (input) ----------------------- */

function WorkspaceScreen({ onRun }: { onRun: () => void }) {
  const inCount = STATEMENT.filter((t) => t.amount > 0).length;
  const outCount = STATEMENT.length - inCount;

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 md:px-12 lg:px-20 max-w-6xl mx-auto w-full">
      {/* Workspace header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 mb-8 border-b border-divider">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted mb-2">Reconciliation</p>
          <h1 className="font-serif text-3xl md:text-4xl leading-tight tracking-tight text-ink">
            March 2026
          </h1>
          <p className="text-sm text-muted mt-1.5">Business current account · GBP</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5 bg-paper-warm px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-light inline-block" />
            Not started
          </span>
          <span className="inline-flex items-center gap-1.5 bg-paper-warm px-2.5 py-1 rounded-full">
            {STATEMENT.length} transactions
          </span>
          <span className="inline-flex items-center gap-1.5 bg-paper-warm px-2.5 py-1 rounded-full">
            {INVOICES.length} invoices
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Bank statement */}
        <div className="lg:col-span-3 bg-card-bg rounded-2xl border border-divider/60 p-4 sm:p-6 md:p-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-lg text-ink">Bank statement</h2>
              <p className="text-xs text-muted mt-0.5">
                {outCount} outgoing · {inCount} incoming
              </p>
            </div>
            <span className="text-[11px] font-medium text-muted bg-paper-warm px-2.5 py-1 rounded-full">
              {STATEMENT.length} transactions
            </span>
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm border-collapse min-w-[340px]">
              <thead>
                <tr className="border-b border-divider text-muted">
                  <th className="text-left py-2 px-2 font-medium text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left py-2 px-2 font-medium text-xs uppercase tracking-wider">Description</th>
                  <th className="text-right py-2 px-2 font-medium text-xs uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
                {STATEMENT.map((t) => (
                  <tr key={t.id} className="border-b border-divider/60 last:border-0">
                    <td className="py-3 px-2 text-muted whitespace-nowrap">{t.date}</td>
                    <td className="py-3 px-2">
                      <span className="font-mono text-[13px] text-ink tabular-nums">{t.description}</span>
                      {t.note && (
                        <span className="block text-[11px] text-muted-light mt-0.5 italic">{t.note}</span>
                      )}
                    </td>
                    <td
                      className={`py-3 px-2 text-right font-mono tabular-nums whitespace-nowrap ${
                        t.amount < 0 ? "text-ink" : "text-accent"
                      }`}
                    >
                      {t.amount < 0 ? "-" : "+"}£
                      {Math.abs(t.amount).toLocaleString("en-GB", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice library */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-ink">Invoice library</h2>
            <span className="text-[11px] font-medium text-muted bg-paper-warm px-2.5 py-1 rounded-full">
              {INVOICES.length} documents
            </span>
          </div>
          <div className="space-y-3">
            {INVOICES.map((inv) => (
              <div key={inv.id} className="bg-card-bg rounded-xl border border-divider/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-light font-mono mb-1 tabular-nums">{inv.ref}</p>
                    <p className="font-medium text-sm text-ink truncate">{inv.vendor}</p>
                    <p className="text-xs text-muted mt-0.5">{inv.date}</p>
                  </div>
                  <p className="font-mono text-sm text-ink whitespace-nowrap tabular-nums">
                    £{inv.amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="mt-10 pt-6 border-t border-divider flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-muted">Last run: never</p>
        <button
          onClick={onRun}
          className="cta-btn inline-flex items-center justify-center h-12 px-8 rounded-full bg-accent text-white font-medium hover:bg-accent-dark transition-colors text-base w-full sm:w-auto"
        >
          Run reconciliation
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-2">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ------------------------ Reconciling screen ------------------------ */

type StepState = "pending" | "running" | "done";

function Spinner() {
  return (
    <svg className="animate-spin text-accent" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TickIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent">
      <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity="0.12" />
      <path d="M4.8 8.2L7 10.4l4.2-4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PendingDot() {
  return <span className="w-4 h-4 rounded-full border border-divider inline-block" />;
}

function ReconcilingScreen({ onDone }: { onDone: () => void }) {
  const [states, setStates] = useState<StepState[]>(() => PROCESSING_STEPS.map(() => "pending"));
  const [current, setCurrent] = useState(0);
  const [complete, setComplete] = useState(false);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Each step: run for ~1100ms, then settle. Total ~8s. Readable, not rushed.
    const RUN_MS = 1100;
    const SETTLE_MS = 250;

    let i = 0;
    const advance = () => {
      if (i >= PROCESSING_STEPS.length) {
        setComplete(true);
        return;
      }
      setCurrent(i);
      setStates((s) => {
        const next = [...s];
        next[i] = "running";
        return next;
      });
      const t1 = setTimeout(() => {
        setStates((s) => {
          const next = [...s];
          next[i] = "done";
          return next;
        });
        const t2 = setTimeout(() => {
          i += 1;
          advance();
        }, SETTLE_MS);
        timeouts.current.push(t2);
      }, RUN_MS);
      timeouts.current.push(t1);
    };
    advance();

    return () => {
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, []);

  const doneCount = states.filter((s) => s === "done").length;
  const progress = Math.round((doneCount / PROCESSING_STEPS.length) * 100);

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 md:px-12 lg:px-20 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="pb-6 mb-8 border-b border-divider">
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted mb-2">
          {complete ? "Reconciliation complete" : "Reconciling"}
        </p>
        <h1 className="font-serif text-3xl md:text-4xl leading-tight tracking-tight text-ink">
          March 2026
        </h1>
        <p className="text-sm text-muted mt-1.5">
          {complete ? "All steps finished. Review the results when you're ready." : "Matching transactions against invoices and flagging gaps."}
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-1.5 bg-paper-warm rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-mono tabular-nums text-muted w-10 text-right">{progress}%</span>
      </div>

      {/* Steps list - slots pre-allocated to prevent layout shift */}
      <div className="bg-card-bg rounded-2xl border border-divider/60 p-5 md:p-7 space-y-4">
        {PROCESSING_STEPS.map((s, i) => {
          const state = states[i];
          const isCurrent = i === current && state === "running";
          return (
            <div key={i} className="flex items-start gap-3 min-h-[28px]">
              <span className="flex-shrink-0 w-4 h-4 mt-0.5 flex items-center justify-center">
                {state === "done" ? <TickIcon /> : state === "running" ? <Spinner /> : <PendingDot />}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-relaxed transition-colors duration-300 ${
                    state === "pending" ? "text-muted-light" : isCurrent ? "text-ink" : "text-ink"
                  }`}
                >
                  {s.label}
                </p>
                {/* Result slot always reserved to prevent shift */}
                <p
                  className={`text-xs text-muted mt-1 transition-opacity duration-300 ${
                    state === "done" ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden={state !== "done"}
                >
                  {s.result}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue */}
      <div className="mt-8 flex justify-end min-h-[48px]">
        <button
          onClick={onDone}
          disabled={!complete}
          className={`inline-flex items-center justify-center h-12 px-8 rounded-full font-medium text-base transition-all ${
            complete
              ? "bg-accent text-white hover:bg-accent-dark cta-btn"
              : "bg-paper-warm text-muted-light cursor-not-allowed"
          }`}
        >
          View results
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-2">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* --------------------------- Results screen ------------------------- */

type Match = {
  txnId: string;
  txnDesc: string;
  txnAmount: number;
  matchTo: string;
  confidence: "high" | "medium" | "low";
  note: string;
};

const MATCHES: Match[] = [
  {
    txnId: "t1",
    txnDesc: "AMZN*2847XJ  LUXEMBOURG",
    txnAmount: -142.6,
    matchTo: "Amazon Web Services · INV-AWS-0312",
    confidence: "high",
    note: "Vendor code AMZN*2847XJ resolved to AWS based on prior 11 matches.",
  },
  {
    txnId: "t3",
    txnDesc: "ACME BUILDERS LTD",
    txnAmount: -2400.0,
    matchTo: "ACM-204 + ACM-208 + ACM-211 (split)",
    confidence: "high",
    note: "Single transfer covers three Acme invoices (£900 + £650 + £850 = £2,400).",
  },
  {
    txnId: "t7",
    txnDesc: "BRIGHT SPARK ELEC",
    txnAmount: -980.0,
    matchTo: "Bright Spark Electrical · BSE-0042",
    confidence: "high",
    note: "Exact amount and vendor match.",
  },
];

type Gap = {
  id: string;
  txnDesc: string;
  amount: number;
  issue: string;
  chaseChannel: "WhatsApp" | "Email";
  chaseTo: string;
  chaseMessage: string;
};

const GAPS: Gap[] = [
  {
    id: "g1",
    txnDesc: "CARD PURCHASE 4821 HTL LISBON · 22 Mar",
    amount: -684.0,
    issue: "No receipt on file. Looks like a hotel charge.",
    chaseChannel: "WhatsApp",
    chaseTo: "Tahi (client)",
    chaseMessage:
      "Hi Tahi, quick one for the March books. There's a £684 card charge at a Lisbon hotel on 22 Mar. Can you send over the receipt when you get a sec? A photo is fine. Thanks.",
  },
  {
    id: "g2",
    txnDesc: "TFL TRAVEL CHARGE · 20 Mar",
    amount: -8.4,
    issue: "Small expense, no receipt. Likely business travel.",
    chaseChannel: "Email",
    chaseTo: "accounts@client.com",
    chaseMessage:
      "Hi, reconciling March now. There's an £8.40 TfL charge on 20 Mar with no matching expense entry. Was this a business trip? If yes, a one-line note on purpose is enough. Thanks.",
  },
];

type Flag = {
  id: string;
  kind: "Duplicate" | "Anomaly";
  title: string;
  detail: string;
};

const FLAGS: Flag[] = [
  {
    id: "f1",
    kind: "Duplicate",
    title: "Possible duplicate AWS charge",
    detail:
      "Two identical AMZN*2847XJ charges of £142.60 on 12 Mar and 18 Mar. AWS usually bills once per month. Worth confirming before posting both.",
  },
  {
    id: "f2",
    kind: "Anomaly",
    title: "Energia Lisboa 31% higher than usual",
    detail:
      "£318.72 this month vs 12-month average of £243.20. Possibly a rate change or a meter reading catch-up.",
  },
];

function ConfidencePill({ c }: { c: Match["confidence"] }) {
  const map = {
    high: "bg-accent-light text-accent",
    medium: "bg-paper-warm text-ink",
    low: "bg-paper-warm text-muted",
  };
  return (
    <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${map[c]}`}>
      {c} confidence
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          });
        }
      }}
      className="text-xs font-medium text-accent hover:text-accent-dark transition-colors inline-flex items-center gap-1.5"
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.2L5 8.7L9.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2 9V2.5a.5.5 0 0 1 .5-.5H8" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Copy message
        </>
      )}
    </button>
  );
}

type ExpandableSectionProps = {
  title: string;
  count: number;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

function Section({ title, count, subtitle, defaultOpen = true, children }: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mb-8 bg-card-bg rounded-2xl border border-divider/60 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 md:px-6 py-5 text-left hover:bg-paper-warm/40 transition-colors"
      >
        <div className="flex items-baseline gap-3 min-w-0">
          <h2 className="font-serif text-xl md:text-2xl text-ink truncate">{title}</h2>
          <span className="text-sm font-mono tabular-nums text-muted">{count}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {subtitle && <span className="hidden sm:inline text-xs text-muted">{subtitle}</span>}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
      {open && <div className="px-5 md:px-6 pb-6 pt-1 border-t border-divider/60">{children}</div>}
    </section>
  );
}

function ResultsScreen({ onRestart }: { onRestart: () => void }) {
  const summary = [
    { n: MATCHES.length, l: "Matched" },
    { n: GAPS.length, l: "Chases drafted" },
    { n: FLAGS.length, l: "Needs review" },
  ];

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 md:px-12 lg:px-20 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 mb-8 border-b border-divider">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted mb-2">Results</p>
          <h1 className="font-serif text-3xl md:text-4xl leading-tight tracking-tight text-ink">
            March 2026
          </h1>
          <p className="text-sm text-muted mt-1.5">Business current account · completed just now</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 bg-accent-light text-accent font-semibold px-2.5 py-1 rounded-full">
            <TickIcon />
            Reconciled
          </span>
        </div>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        {summary.map((s) => (
          <div key={s.l} className="bg-card-bg rounded-xl border border-divider/60 px-4 py-4">
            <p className="font-serif text-3xl text-accent leading-none mb-1 tabular-nums">{s.n}</p>
            <p className="text-xs text-muted uppercase tracking-wider">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Matched */}
      <Section title="Matched" count={MATCHES.length} subtitle="reconciled automatically">
        <div className="space-y-3 pt-4">
          {MATCHES.map((m) => (
            <div key={m.txnId} className="bg-paper-warm/40 rounded-xl border border-divider/60 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-mono text-[13px] text-ink tabular-nums">
                    {m.txnDesc}{" "}
                    <span className="text-muted">
                      -£{Math.abs(m.txnAmount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                    </span>
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    matched to <span className="text-ink">{m.matchTo}</span>
                  </p>
                </div>
                <ConfidencePill c={m.confidence} />
              </div>
              <p className="text-sm text-muted leading-relaxed">{m.note}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Chases drafted */}
      <Section title="Chases drafted" count={GAPS.length} subtitle="ready to send">
        <div className="space-y-4 pt-4">
          {GAPS.map((g) => (
            <div key={g.id} className="bg-paper-warm/40 rounded-xl border border-divider/60 p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{g.txnDesc}</p>
                  <p className="text-sm text-muted mt-0.5">{g.issue}</p>
                </div>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-accent bg-accent-light px-2.5 py-1 rounded-full w-fit">
                  {g.chaseChannel}
                </span>
              </div>
              <div className="bg-card-bg rounded-lg p-4 border border-divider/60">
                <p className="text-[11px] uppercase tracking-wider text-muted mb-2">To: {g.chaseTo}</p>
                <p className="text-sm text-ink leading-relaxed whitespace-pre-line">{g.chaseMessage}</p>
                <div className="mt-3 pt-3 border-t border-divider/70 flex items-center justify-between">
                  <span className="text-[11px] text-muted-light">Draft · not sent</span>
                  <CopyButton text={g.chaseMessage} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Needs review */}
      <Section title="Needs review" count={FLAGS.length} subtitle="duplicates and anomalies">
        <div className="space-y-3 pt-4">
          {FLAGS.map((f) => (
            <div key={f.id} className="bg-paper-warm/40 rounded-xl border border-divider/60 p-5 border-l-4 border-l-accent">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-accent">{f.kind}</span>
                <span className="w-1 h-1 rounded-full bg-divider inline-block" />
                <span className="font-medium text-ink">{f.title}</span>
              </div>
              <p className="text-sm text-muted leading-relaxed">{f.detail}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Footer actions */}
      <div className="mt-10 pt-6 border-t border-divider flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-muted">Export to your ledger or start a new reconciliation.</p>
        <button
          onClick={onRestart}
          className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-divider text-ink font-medium hover:border-ink transition-colors text-sm"
        >
          Start over
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- Page shell --------------------------- */

export default function DemoPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  }, [step]);

  return (
    <div className="bg-paper font-sans text-ink min-h-screen selection:bg-accent/10 selection:text-accent-dark">
      <DemoNav step={step} />
      {step === 1 && <WorkspaceScreen onRun={() => setStep(2)} />}
      {step === 2 && <ReconcilingScreen onDone={() => setStep(3)} />}
      {step === 3 && <ResultsScreen onRestart={() => setStep(1)} />}

      <footer className="border-t border-divider py-8 px-6 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <span className="font-serif text-sm text-ink">AI Staffing Agency</span>
          <span className="flex items-center gap-3">
            <DemoBadge />
            <a href="/" className="accent-link text-accent">
              Back to home
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
