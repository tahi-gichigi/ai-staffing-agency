"use client";

import { useEffect, useRef, useState } from "react";

/* ==================================================================
 * AI Bookkeeper demo - 90-second click-through
 * Three screens: input -> processing -> output
 * Hardcoded fixtures. No backend, no LLM calls.
 * ================================================================== */

/* ------------------------------ Fixtures ---------------------------- */

type Txn = {
  id: string;
  date: string;
  description: string; // messy bank statement text
  amount: number; // positive = money in, negative = money out
  note?: string; // subtle cue about why it's messy
};

type Invoice = {
  id: string;
  vendor: string;
  amount: number;
  date: string;
  ref: string;
};

const STATEMENT: Txn[] = [
  {
    id: "t1",
    date: "12 Mar",
    description: "AMZN*2847XJ  LUXEMBOURG",
    amount: -142.6,
    note: "Cryptic vendor code",
  },
  {
    id: "t2",
    date: "14 Mar",
    description: "STRIPE PAYOUT ref 88271",
    amount: 3200.0,
  },
  {
    id: "t3",
    date: "15 Mar",
    description: "ACME BUILDERS LTD",
    amount: -2400.0,
    note: "One payment, three invoices",
  },
  {
    id: "t4",
    date: "18 Mar",
    description: "AMZN*2847XJ  LUXEMBOURG",
    amount: -142.6,
    note: "Duplicate?",
  },
  {
    id: "t5",
    date: "20 Mar",
    description: "TFL TRAVEL CHARGE",
    amount: -8.4,
  },
  {
    id: "t6",
    date: "22 Mar",
    description: "CARD PURCHASE 4821 HTL LISBON",
    amount: -684.0,
    note: "No receipt on file",
  },
  {
    id: "t7",
    date: "24 Mar",
    description: "BRIGHT SPARK ELEC",
    amount: -980.0,
  },
  {
    id: "t8",
    date: "26 Mar",
    description: "DD ENERGIA LISBOA",
    amount: -318.72,
    note: "31% higher than usual",
  },
];

const INVOICES: Invoice[] = [
  {
    id: "i1",
    vendor: "Amazon Web Services",
    amount: 142.6,
    date: "10 Mar",
    ref: "INV-AWS-0312",
  },
  {
    id: "i2",
    vendor: "Acme Builders - Kitchen fit",
    amount: 900.0,
    date: "02 Mar",
    ref: "ACM-204",
  },
  {
    id: "i3",
    vendor: "Acme Builders - Plumbing",
    amount: 650.0,
    date: "05 Mar",
    ref: "ACM-208",
  },
  {
    id: "i4",
    vendor: "Acme Builders - Electrics",
    amount: 850.0,
    date: "08 Mar",
    ref: "ACM-211",
  },
  {
    id: "i5",
    vendor: "Bright Spark Electrical",
    amount: 980.0,
    date: "21 Mar",
    ref: "BSE-0042",
  },
];

const PROCESSING_STEPS = [
  "Parsing bank statement (8 transactions)...",
  "Reading invoice library (5 documents)...",
  "Matching transactions against invoices...",
  "Resolving vendor name mismatches...",
  "Checking for duplicates and split payments...",
  "Spotting anomalies against 12 months of history...",
  "Drafting chase messages for gaps...",
  "Done. Preparing report.",
];

/* ------------------------------ UI bits ----------------------------- */

function DemoBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold tracking-[0.14em] sm:tracking-[0.18em] uppercase text-accent bg-accent-light px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block flex-shrink-0" />
      <span className={compact ? "hidden sm:inline" : ""}>Demo - fixtures only</span>
      <span className={compact ? "sm:hidden" : "hidden"}>Demo</span>
    </span>
  );
}

function DemoNav({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Input", "Processing", "Output"];
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
                className={`flex items-center gap-1.5 ${
                  active ? "text-ink font-medium" : done ? "text-accent" : ""
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                    active
                      ? "bg-accent text-white"
                      : done
                      ? "bg-accent-light text-accent"
                      : "bg-paper-warm text-muted"
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

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-5">
      <span className="w-6 h-px bg-accent inline-block" />
      {children}
    </span>
  );
}

/* --------------------------- Input screen --------------------------- */

function InputScreen({ onRun }: { onRun: () => void }) {
  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 md:px-12 lg:px-20 max-w-6xl mx-auto w-full">
      <Label>Screen 1 - Input</Label>
      <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight mb-5">
        Here&rsquo;s the mess.{" "}
        <span className="text-muted-light">
          A bank statement and an invoice pile.
        </span>
      </h1>
      <p className="text-lg text-muted max-w-2xl leading-relaxed mb-12">
        This is what lands on your junior&rsquo;s desk every month. Cryptic
        vendor codes, missing receipts, one payment covering multiple
        invoices. Hit the button - your AI Bookkeeper takes it from here.
      </p>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Bank statement */}
        <div className="lg:col-span-3 bg-card-bg rounded-2xl border border-divider/60 p-4 sm:p-6 md:p-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-lg">Bank statement</h2>
              <p className="text-xs text-muted mt-0.5">
                March 2026 - business current account
              </p>
            </div>
            <span className="text-[11px] font-medium text-muted bg-paper-warm px-2.5 py-1 rounded-full">
              8 transactions
            </span>
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm border-collapse min-w-[340px]">
              <thead>
                <tr className="border-b border-divider text-muted">
                  <th className="text-left py-2 px-2 font-medium text-xs uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-xs uppercase tracking-wider">
                    Description
                  </th>
                  <th className="text-right py-2 px-2 font-medium text-xs uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {STATEMENT.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-divider/60 last:border-0"
                  >
                    <td className="py-3 px-2 text-muted whitespace-nowrap">
                      {t.date}
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-mono text-[13px] text-ink">
                        {t.description}
                      </span>
                      {t.note && (
                        <span className="block text-[11px] text-muted-light mt-0.5 italic">
                          {t.note}
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-3 px-2 text-right font-mono whitespace-nowrap ${
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

        {/* Invoice pile */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-lg">Invoice pile</h2>
            <span className="text-[11px] font-medium text-muted bg-paper-warm px-2.5 py-1 rounded-full">
              5 documents
            </span>
          </div>
          {INVOICES.map((inv, i) => (
            <div
              key={inv.id}
              className="bg-card-bg rounded-xl border border-divider/60 p-4 relative"
              style={{
                transform: `rotate(${i % 2 === 0 ? "-0.4deg" : "0.4deg"})`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-light font-mono mb-1">
                    {inv.ref}
                  </p>
                  <p className="font-medium text-sm text-ink truncate">
                    {inv.vendor}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{inv.date}</p>
                </div>
                <p className="font-mono text-sm text-ink whitespace-nowrap">
                  £
                  {inv.amount.toLocaleString("en-GB", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Run CTA */}
      <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button
          onClick={onRun}
          className="cta-btn inline-flex items-center justify-center h-13 px-9 rounded-full bg-accent text-white font-medium hover:bg-accent-dark transition-colors text-base"
        >
          Run reconciliation
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="ml-2"
          >
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <p className="text-sm text-muted-light">
          Typical run: under 30 seconds on a full month of data.
        </p>
      </div>
    </div>
  );
}

/* ------------------------ Processing screen ------------------------- */

function ProcessingScreen({ onDone }: { onDone: () => void }) {
  const [logIndex, setLogIndex] = useState(0);
  const doneCalled = useRef(false);

  useEffect(() => {
    // Total run ~2.8s: 8 steps at ~350ms each
    const stepMs = 350;
    const interval = setInterval(() => {
      setLogIndex((i) => {
        if (i + 1 >= PROCESSING_STEPS.length) {
          clearInterval(interval);
          if (!doneCalled.current) {
            doneCalled.current = true;
            setTimeout(onDone, 500);
          }
          return i + 1;
        }
        return i + 1;
      });
    }, stepMs);
    return () => clearInterval(interval);
  }, [onDone]);

  const progress = Math.min(
    100,
    Math.round((logIndex / PROCESSING_STEPS.length) * 100)
  );

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 md:px-12 lg:px-20 max-w-3xl mx-auto w-full min-h-[80vh] flex flex-col justify-center">
      <Label>Screen 2 - Processing</Label>
      <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight mb-5">
        Working through it.
      </h1>
      <p className="text-lg text-muted max-w-xl leading-relaxed mb-10">
        Your AI Bookkeeper is matching transactions, spotting gaps, and
        drafting chase messages. In real life this runs in the background -
        we&rsquo;re slowing it down so you can watch.
      </p>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-paper-warm rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Running log */}
      <div className="bg-card-bg rounded-2xl border border-divider/60 p-6 md:p-8 font-mono text-sm space-y-2.5">
        {PROCESSING_STEPS.slice(0, logIndex + 1).map((step, i) => {
          const isCurrent = i === logIndex && i < PROCESSING_STEPS.length - 1;
          return (
            <div
              key={i}
              className="flex items-start gap-3 animate-fade-up"
              style={{ animationDuration: "0.3s" }}
            >
              <span
                className={`flex-shrink-0 mt-1 w-3 h-3 rounded-full ${
                  isCurrent
                    ? "bg-accent animate-pulse"
                    : "bg-accent-light border border-accent"
                } flex items-center justify-center`}
              >
                {!isCurrent && (
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                    className="text-accent"
                  >
                    <path
                      d="M1.5 4.2L3.2 5.8L6.5 2.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span
                className={
                  isCurrent ? "text-ink" : "text-muted"
                }
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------- Output screen --------------------------- */

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
    matchTo: "Amazon Web Services - INV-AWS-0312",
    confidence: "high",
    note: "Vendor code AMZN*2847XJ resolved to AWS based on prior 11 matches.",
  },
  {
    txnId: "t3",
    txnDesc: "ACME BUILDERS LTD - £2,400.00",
    txnAmount: -2400.0,
    matchTo: "ACM-204 + ACM-208 + ACM-211 (split payment)",
    confidence: "high",
    note: "Single transfer covers three Acme invoices (£900 + £650 + £850 = £2,400).",
  },
  {
    txnId: "t7",
    txnDesc: "BRIGHT SPARK ELEC",
    txnAmount: -980.0,
    matchTo: "Bright Spark Electrical - BSE-0042",
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
    txnDesc: "CARD PURCHASE 4821 HTL LISBON - 22 Mar",
    amount: -684.0,
    issue: "No receipt on file. Looks like a hotel charge.",
    chaseChannel: "WhatsApp",
    chaseTo: "Tahi (client)",
    chaseMessage:
      "Hi Tahi - quick one for the March books. There's a £684 card charge at a Lisbon hotel on 22 Mar. Can you send over the receipt when you get a sec? A photo is fine. Thanks!",
  },
  {
    id: "g2",
    txnDesc: "TFL TRAVEL CHARGE - 20 Mar",
    amount: -8.4,
    issue: "Small expense, no receipt. Likely business travel.",
    chaseChannel: "Email",
    chaseTo: "accounts@client.com",
    chaseMessage:
      "Hi - reconciling March now. There's an £8.40 TfL charge on 20 Mar with no matching expense entry. Was this a business trip? If yes, a one-line note on purpose is enough. Thanks.",
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
      "£318.72 this month vs. 12-month average of £243.20. Not a red flag, but flagging because your junior wouldn&rsquo;t catch it. Possibly a rate change or a meter reading catch-up.",
  },
];

function ConfidencePill({ c }: { c: Match["confidence"] }) {
  const map = {
    high: "bg-accent-light text-accent",
    medium: "bg-paper-warm text-ink",
    low: "bg-paper-warm text-muted",
  };
  return (
    <span
      className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${map[c]}`}
    >
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
            <path
              d="M2.5 6.2L5 8.7L9.5 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect
              x="3"
              y="3"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M2 9V2.5a.5.5 0 0 1 .5-.5H8"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
          Copy message
        </>
      )}
    </button>
  );
}

function OutputScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 md:px-12 lg:px-20 max-w-6xl mx-auto w-full">
      <Label>Screen 3 - Output</Label>
      <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight mb-5">
        Here&rsquo;s what landed on your desk.{" "}
        <em className="text-accent">Not your junior&rsquo;s.</em>
      </h1>
      <p className="text-lg text-muted max-w-2xl leading-relaxed mb-10">
        Matched, flagged, and chased. The parts you actually need to review
        are clearly separated from the parts already handled.
      </p>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-14">
        {[
          { n: "3", l: "Matched" },
          { n: "2", l: "Chases drafted" },
          { n: "1", l: "Duplicate" },
          { n: "1", l: "Anomaly" },
        ].map((s) => (
          <div
            key={s.l}
            className="bg-card-bg rounded-xl border border-divider/60 px-4 py-4"
          >
            <p className="font-serif text-3xl text-accent leading-none mb-1">
              {s.n}
            </p>
            <p className="text-xs text-muted uppercase tracking-wider">
              {s.l}
            </p>
          </div>
        ))}
      </div>

      {/* Matched */}
      <section className="mb-14">
        <h2 className="font-serif text-2xl md:text-3xl mb-2">Matched</h2>
        <p className="text-sm text-muted mb-6">
          Transactions reconciled automatically. Review only if you want to.
        </p>
        <div className="space-y-3">
          {MATCHES.map((m) => (
            <div
              key={m.txnId}
              className="bg-card-bg rounded-xl border border-divider/60 p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-mono text-[13px] text-ink truncate">
                    {m.txnDesc}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    matched to <span className="text-ink">{m.matchTo}</span>
                  </p>
                </div>
                <ConfidencePill c={m.confidence} />
              </div>
              <p className="text-sm text-muted leading-relaxed italic">
                {m.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Gaps with drafted chases */}
      <section className="mb-14">
        <h2 className="font-serif text-2xl md:text-3xl mb-2">
          Gaps - chase drafted
        </h2>
        <p className="text-sm text-muted mb-6">
          Missing receipts. Messages written in your voice, ready to send.
        </p>
        <div className="space-y-4">
          {GAPS.map((g) => (
            <div
              key={g.id}
              className="bg-card-bg rounded-xl border border-divider/60 p-5 md:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{g.txnDesc}</p>
                  <p className="text-sm text-muted mt-0.5">{g.issue}</p>
                </div>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-accent bg-accent-light px-2.5 py-1 rounded-full w-fit">
                  {g.chaseChannel}
                </span>
              </div>
              <div className="bg-paper-warm/60 rounded-lg p-4 border border-divider/60">
                <p className="text-[11px] uppercase tracking-wider text-muted mb-2">
                  To: {g.chaseTo}
                </p>
                <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
                  {g.chaseMessage}
                </p>
                <div className="mt-3 pt-3 border-t border-divider/70 flex items-center justify-between">
                  <span className="text-[11px] text-muted-light">
                    Draft - not sent
                  </span>
                  <CopyButton text={g.chaseMessage} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Flags */}
      <section className="mb-14">
        <h2 className="font-serif text-2xl md:text-3xl mb-2">
          Flags for your review
        </h2>
        <p className="text-sm text-muted mb-6">
          Duplicates and anomalies worth a second look. The kind of thing a
          junior would miss on a Friday afternoon.
        </p>
        <div className="space-y-3">
          {FLAGS.map((f) => (
            <div
              key={f.id}
              className="bg-card-bg rounded-xl border border-divider/60 p-5 border-l-4 border-l-accent"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-accent">
                  {f.kind}
                </span>
                <span className="w-1 h-1 rounded-full bg-divider inline-block" />
                <span className="font-medium text-ink">{f.title}</span>
              </div>
              <p
                className="text-sm text-muted leading-relaxed"
                dangerouslySetInnerHTML={{ __html: f.detail }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <div className="border-t border-divider pt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-serif text-xl text-ink mb-1">
            That took about 90 seconds.
          </p>
          <p className="text-sm text-muted">
            Your junior takes most of a day on the same pile.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRestart}
            className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-divider text-ink font-medium hover:border-ink transition-colors text-sm"
          >
            Run it again
          </button>
          <a
            href="/#contact"
            className="cta-btn inline-flex items-center justify-center h-11 px-6 rounded-full bg-accent text-white font-medium hover:bg-accent-dark transition-colors text-sm"
          >
            Start a conversation
          </a>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Page shell --------------------------- */

export default function DemoPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  return (
    <div className="bg-paper font-sans text-ink min-h-screen selection:bg-accent/10 selection:text-accent-dark">
      <DemoNav step={step} />
      {step === 1 && <InputScreen onRun={() => setStep(2)} />}
      {step === 2 && <ProcessingScreen onDone={() => setStep(3)} />}
      {step === 3 && <OutputScreen onRestart={() => setStep(1)} />}

      <footer className="border-t border-divider py-8 px-6 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <span className="font-serif text-sm text-ink">
            AI Staffing Agency
          </span>
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
