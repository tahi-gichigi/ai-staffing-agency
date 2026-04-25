/* Shared fixtures and types for Alternative A (Mission Control triage demo).
 * Fixture data only - operational, repetitive, believable. No backend. */

export type Confidence = "high" | "medium" | "low";
export type Impact = "low" | "medium" | "high";
export type Bucket = "review" | "waiting" | "junior" | "done";

export type Client = {
  id: string;
  name: string;
  trade: string;
};

export type Evidence = {
  label: string;
  value: string;
  source: string;
};

export type QueueItem = {
  id: string;
  clientId: string;
  period: string;
  issue: string;
  detail: string;
  confidence: Confidence;
  impact: Impact;
  recommended: "Approve" | "Ask client" | "Mark explained" | "Assign";
  bucket: Bucket;
  age: string;
  amount?: number;
  evidenceLeft: Evidence[];
  evidenceRight: Evidence[];
  rationale: string[];
  waitingFor?: string;
  assignedTo?: string;
  resolution?: string;
};

export type ActivityEvent = {
  id: string;
  time: string;
  client: string;
  check: string;
  outcome: string;
  kind: "ok" | "flag" | "info" | "ask";
};

export type BucketDef = {
  key: Bucket;
  label: string;
  sub: string;
  emphasis?: boolean;
};

export const BUCKETS: BucketDef[] = [
  { key: "review", label: "Needs review", sub: "decisions waiting on you", emphasis: true },
  { key: "waiting", label: "Waiting on client", sub: "sent, not yet replied" },
  { key: "junior", label: "Assigned to juniors", sub: "in progress on the team" },
  { key: "done", label: "Completed today", sub: "cleared since 09:00" },
];

export const CLIENTS: Client[] = [
  { id: "c1", name: "Harbour & Finch", trade: "Design studio" },
  { id: "c2", name: "Kestrel Build", trade: "Construction" },
  { id: "c3", name: "Nori Kitchen", trade: "Hospitality" },
  { id: "c4", name: "Plume Dental", trade: "Healthcare" },
  { id: "c5", name: "Argent Legal", trade: "Professional services" },
  { id: "c6", name: "Juniper Flora", trade: "Retail" },
  { id: "c7", name: "Signal Cycles", trade: "Retail" },
  { id: "c8", name: "Kiln Ceramics", trade: "Manufacturing" },
];

export function clientById(id: string): Client {
  return CLIENTS.find((c) => c.id === id) ?? CLIENTS[0];
}

export const ITEMS: QueueItem[] = [
  {
    id: "q1",
    clientId: "c1",
    period: "March 2026",
    issue: "Duplicate AWS charge",
    detail: "Two identical AMZN*2847XJ charges of £142.60 on 12 Mar and 18 Mar.",
    confidence: "high",
    impact: "low",
    recommended: "Ask client",
    bucket: "review",
    age: "4m ago",
    amount: 142.6,
    evidenceLeft: [
      { label: "Transaction A", value: "AMZN*2847XJ LUXEMBOURG · 12 Mar · -£142.60", source: "Bank feed" },
      { label: "Transaction B", value: "AMZN*2847XJ LUXEMBOURG · 18 Mar · -£142.60", source: "Bank feed" },
    ],
    evidenceRight: [
      { label: "Historic pattern", value: "AWS billed once per month for 11 consecutive months", source: "12-mo history" },
      { label: "Matched invoice", value: "INV-AWS-0312 · £142.60", source: "Invoice library" },
    ],
    rationale: [
      "AWS billed once per month in the last 12 months.",
      "Only one matching invoice on file - the second charge has no document.",
    ],
  },
  {
    id: "q2",
    clientId: "c2",
    period: "March 2026",
    issue: "Split payment across 3 invoices",
    detail: "Single transfer of £2,400 to Acme Builders covers ACM-204, ACM-208, ACM-211.",
    confidence: "high",
    impact: "medium",
    recommended: "Approve",
    bucket: "review",
    age: "7m ago",
    amount: 2400,
    evidenceLeft: [
      { label: "Transaction", value: "ACME BUILDERS LTD · 15 Mar · -£2,400.00", source: "Bank feed" },
    ],
    evidenceRight: [
      { label: "Invoice 1", value: "ACM-204 · Kitchen fit · £900.00", source: "Invoice library" },
      { label: "Invoice 2", value: "ACM-208 · Plumbing · £650.00", source: "Invoice library" },
      { label: "Invoice 3", value: "ACM-211 · Electrics · £850.00", source: "Invoice library" },
    ],
    rationale: [
      "Three open Acme invoices sum exactly to £2,400.",
      "Client paid the same way in January (£1,750 across 2 invoices).",
    ],
  },
  {
    id: "q3",
    clientId: "c3",
    period: "March 2026",
    issue: "Energia Lisboa 31% above average",
    detail: "£318.72 this month vs 12-month average £243.20. Possible rate change or meter catch-up.",
    confidence: "medium",
    impact: "low",
    recommended: "Ask client",
    bucket: "review",
    age: "18m ago",
    amount: 318.72,
    evidenceLeft: [
      { label: "This month", value: "DD ENERGIA LISBOA · 26 Mar · -£318.72", source: "Bank feed" },
    ],
    evidenceRight: [
      { label: "12-mo average", value: "£243.20", source: "Historic" },
      { label: "Last 3 months", value: "£241.10 · £248.60 · £239.80", source: "Historic" },
    ],
    rationale: [
      "Amount sits outside 2 standard deviations from the trailing mean.",
      "No announcement on file from Energia about tariff changes.",
    ],
  },
  {
    id: "q4",
    clientId: "c4",
    period: "March 2026",
    issue: "Missing receipt - Lisbon hotel",
    detail: "£684.00 card purchase at HTL LISBON on 22 Mar. No receipt on file.",
    confidence: "low",
    impact: "medium",
    recommended: "Ask client",
    bucket: "review",
    age: "22m ago",
    amount: 684,
    evidenceLeft: [
      { label: "Transaction", value: "CARD PURCHASE 4821 HTL LISBON · 22 Mar · -£684.00", source: "Bank feed" },
    ],
    evidenceRight: [
      { label: "Receipts folder", value: "No matching PDF between 20-24 Mar", source: "Drive" },
      { label: "Calendar", value: "Off-site with Plume team, Lisbon 21-23 Mar", source: "Google Cal" },
    ],
    rationale: [
      "Calendar confirms the trip is real - it's a receipt problem, not a charge problem.",
      "Client usually sends hotel receipts by WhatsApp within a week.",
    ],
  },
  {
    id: "q5",
    clientId: "c5",
    period: "Q1 2026",
    issue: "VAT reclaim on entertainment",
    detail: "£412 reclaimed across 6 restaurant invoices flagged as client entertainment.",
    confidence: "high",
    impact: "high",
    recommended: "Mark explained",
    bucket: "review",
    age: "31m ago",
    amount: 412,
    evidenceLeft: [
      { label: "Reclaim total", value: "£412.00 across 6 receipts", source: "VAT workings" },
      { label: "Category", value: "Client entertainment", source: "Coded by junior" },
    ],
    evidenceRight: [
      { label: "HMRC rule", value: "Input VAT on business entertainment is generally blocked", source: "VIT43100" },
      { label: "Exception", value: "Overseas customers may qualify - check attendee list", source: "VIT43200" },
    ],
    rationale: [
      "5 of 6 receipts have UK-only attendees per the meeting notes.",
      "One Dublin dinner may qualify - needs the attendee list confirmed.",
    ],
  },
  {
    id: "q6",
    clientId: "c6",
    period: "March 2026",
    issue: "New supplier - Bloomify Ltd",
    detail: "£1,240 paid to a supplier not seen in prior 12 months. No invoice on file.",
    confidence: "medium",
    impact: "medium",
    recommended: "Ask client",
    bucket: "review",
    age: "44m ago",
    amount: 1240,
    evidenceLeft: [
      { label: "Transaction", value: "BLOOMIFY LTD · 09 Mar · -£1,240.00", source: "Bank feed" },
    ],
    evidenceRight: [
      { label: "Supplier history", value: "First appearance - no prior payments", source: "Ledger" },
      { label: "Companies House", value: "Bloomify Ltd - active, floristry wholesale", source: "CH API" },
    ],
    rationale: [
      "Matches the trade (wholesale flowers) - plausible.",
      "New supplier over £1,000 is our threshold for confirmation.",
    ],
  },
  {
    id: "q7",
    clientId: "c7",
    period: "March 2026",
    issue: "Stripe payout short by £37.20",
    detail: "Expected £3,237.20 based on sales, received £3,200.00. Difference not obviously fees.",
    confidence: "medium",
    impact: "low",
    recommended: "Assign",
    bucket: "review",
    age: "1h ago",
    amount: 37.2,
    evidenceLeft: [
      { label: "Sales ledger", value: "14 Mar gross: £3,325.00", source: "Shopify" },
      { label: "Stripe fees", value: "£87.80 expected", source: "Stripe" },
    ],
    evidenceRight: [
      { label: "Payout received", value: "£3,200.00 on 14 Mar", source: "Bank feed" },
      { label: "Gap", value: "£37.20 unaccounted", source: "Calculated" },
    ],
    rationale: [
      "Looks like a refund or chargeback, not a fee change.",
      "Good task for a junior - walk the Stripe dashboard for the missing entry.",
    ],
  },
  {
    id: "q8",
    clientId: "c8",
    period: "March 2026",
    issue: "Director loan repayment classification",
    detail: "£5,000 credit from the director's personal account. Needs posting direction.",
    confidence: "high",
    impact: "high",
    recommended: "Mark explained",
    bucket: "review",
    age: "1h ago",
    amount: 5000,
    evidenceLeft: [
      { label: "Transaction", value: "T HARDWICK · 04 Mar · +£5,000.00", source: "Bank feed" },
      { label: "Memo", value: "\"DLA topup\"", source: "Bank narrative" },
    ],
    evidenceRight: [
      { label: "DLA balance", value: "-£8,420 (director owes company)", source: "Last accounts" },
      { label: "Prior pattern", value: "Quarterly top-ups of similar size", source: "12-mo history" },
    ],
    rationale: [
      "Memo + DLA balance + pattern all point to a loan repayment.",
      "Posting is standard; flagging because amount > £2,500 threshold.",
    ],
  },
  {
    id: "q9",
    clientId: "c1",
    period: "March 2026",
    issue: "Mileage claim - vehicle details",
    detail: "Claim for 412 miles at advisory rate. Need reg plate to confirm vehicle class.",
    confidence: "medium",
    impact: "low",
    recommended: "Ask client",
    bucket: "waiting",
    age: "2d ago",
    amount: 185.4,
    waitingFor: "Reply from client (WhatsApp, sent Tue 9:14)",
    evidenceLeft: [{ label: "Claim", value: "412 miles · £185.40", source: "Expense form" }],
    evidenceRight: [{ label: "Missing", value: "Vehicle reg + engine size", source: "-" }],
    rationale: ["Rate differs between cars and vans - we need the class."],
  },
  {
    id: "q10",
    clientId: "c3",
    period: "Feb 2026",
    issue: "Stock count variance",
    detail: "Year-end stock down £2,140 vs opening. Waiting on stocktake sheet.",
    confidence: "medium",
    impact: "medium",
    recommended: "Ask client",
    bucket: "waiting",
    age: "4d ago",
    amount: 2140,
    waitingFor: "Stocktake PDF from client (email, sent Mon)",
    evidenceLeft: [{ label: "Variance", value: "-£2,140 vs prior year-end", source: "Ledger" }],
    evidenceRight: [{ label: "Supporting doc", value: "Not yet received", source: "-" }],
    rationale: ["Can't close accounts without the physical count sheet."],
  },
  {
    id: "q11",
    clientId: "c5",
    period: "March 2026",
    issue: "Missing supplier invoice - Linklater",
    detail: "£890 paid without a corresponding invoice. Chase sent Friday.",
    confidence: "high",
    impact: "low",
    recommended: "Ask client",
    bucket: "waiting",
    age: "3d ago",
    amount: 890,
    waitingFor: "Invoice PDF from supplier",
    evidenceLeft: [{ label: "Payment", value: "LINKLATER & CO · 11 Mar · -£890.00", source: "Bank" }],
    evidenceRight: [{ label: "Invoice", value: "Not on file", source: "Drive" }],
    rationale: ["Supplier is reliable - usually sends invoice within 5 days."],
  },
  {
    id: "q12",
    clientId: "c2",
    period: "March 2026",
    issue: "CIS deduction reconciliation",
    detail: "12 subcontractor payments to cross-check against CIS300 return.",
    confidence: "high",
    impact: "medium",
    recommended: "Assign",
    bucket: "junior",
    age: "yesterday",
    assignedTo: "Priya S.",
    evidenceLeft: [{ label: "Payments", value: "12 subcontractors", source: "Bank" }],
    evidenceRight: [{ label: "CIS300", value: "Draft return built", source: "Payroll system" }],
    rationale: ["Routine reconciliation - Priya has done this for Kestrel 3 months running."],
  },
  {
    id: "q13",
    clientId: "c4",
    period: "Q1 2026",
    issue: "Petty cash summary",
    detail: "47 small receipts to code and post before month end.",
    confidence: "high",
    impact: "low",
    recommended: "Assign",
    bucket: "junior",
    age: "yesterday",
    assignedTo: "Daniel O.",
    evidenceLeft: [{ label: "Receipts", value: "47 items, £612.40 total", source: "Envelope scan" }],
    evidenceRight: [{ label: "Template", value: "Prior quarter coding available", source: "Ledger" }],
    rationale: ["Repetitive work - junior can learn the client's categories."],
  },
  {
    id: "q14",
    clientId: "c7",
    period: "March 2026",
    issue: "Shopify sales tax breakdown",
    detail: "Separate EU vs UK sales for the month - needed for IOSS return.",
    confidence: "high",
    impact: "medium",
    recommended: "Assign",
    bucket: "junior",
    age: "2h ago",
    assignedTo: "Priya S.",
    evidenceLeft: [{ label: "Orders", value: "318 orders in March", source: "Shopify" }],
    evidenceRight: [{ label: "Report needed", value: "EU / UK / ROW split", source: "-" }],
    rationale: ["Shopify report exists - Priya just needs to pull and reconcile totals."],
  },
  {
    id: "q15",
    clientId: "c6",
    period: "March 2026",
    issue: "Bank rec - current account",
    detail: "All 84 transactions matched. No gaps.",
    confidence: "high",
    impact: "low",
    recommended: "Approve",
    bucket: "done",
    age: "9:04",
    evidenceLeft: [{ label: "Statement", value: "84 txns, £47,120 out, £52,600 in", source: "Bank" }],
    evidenceRight: [{ label: "Matched", value: "84 of 84", source: "-" }],
    rationale: ["Clean run. No exceptions."],
    resolution: "Approved at 9:04 by you.",
  },
  {
    id: "q16",
    clientId: "c8",
    period: "Feb 2026",
    issue: "VAT return filed",
    detail: "£4,212.80 payable. Submitted to HMRC at 8:47.",
    confidence: "high",
    impact: "high",
    recommended: "Approve",
    bucket: "done",
    age: "8:47",
    amount: 4212.8,
    evidenceLeft: [{ label: "Return", value: "Box 1-9 populated", source: "VAT workings" }],
    evidenceRight: [{ label: "HMRC", value: "Acknowledged · receipt H4K-8821", source: "Gateway" }],
    rationale: ["Figures tied to ledger. You signed off yesterday."],
    resolution: "Submitted. HMRC receipt H4K-8821.",
  },
  {
    id: "q17",
    clientId: "c1",
    period: "March 2026",
    issue: "Payroll journal posted",
    detail: "12 staff, £28,450 gross. Journal posted to Xero.",
    confidence: "high",
    impact: "medium",
    recommended: "Approve",
    bucket: "done",
    age: "10:12",
    evidenceLeft: [{ label: "Run", value: "12 employees, £28,450 gross", source: "BrightPay" }],
    evidenceRight: [{ label: "Posted", value: "Journal 4412 in Xero", source: "Xero" }],
    rationale: ["Matches last month's pattern within 2%. No new starters."],
    resolution: "Approved. Journal 4412.",
  },
  {
    id: "q18",
    clientId: "c3",
    period: "March 2026",
    issue: "Supplier statement reconciled",
    detail: "Brakes Ltd statement balance matches ledger to the penny.",
    confidence: "high",
    impact: "low",
    recommended: "Approve",
    bucket: "done",
    age: "10:28",
    evidenceLeft: [{ label: "Statement", value: "£3,112.40", source: "Brakes" }],
    evidenceRight: [{ label: "Ledger", value: "£3,112.40", source: "-" }],
    rationale: ["Clean match."],
    resolution: "Marked reconciled.",
  },
];

export const ACTIVITY: ActivityEvent[] = [
  { id: "a1", time: "11:42", client: "Harbour & Finch", check: "Duplicate detection", outcome: "Flagged 1 item (AWS charges)", kind: "flag" },
  { id: "a2", time: "11:40", client: "Juniper Flora", check: "New supplier screen", outcome: "Flagged Bloomify Ltd - no prior history", kind: "flag" },
  { id: "a3", time: "11:38", client: "Nori Kitchen", check: "Anomaly scan (utilities)", outcome: "Energia Lisboa 31% above trailing mean", kind: "flag" },
  { id: "a4", time: "11:35", client: "Kestrel Build", check: "Bank feed sync", outcome: "127 transactions pulled since last sync", kind: "ok" },
  { id: "a5", time: "11:30", client: "Kestrel Build", check: "Split payment match", outcome: "Matched Acme £2,400 → 3 invoices", kind: "ok" },
  { id: "a6", time: "11:22", client: "Signal Cycles", check: "Stripe reconciliation", outcome: "£37.20 gap - assigned to Priya", kind: "ask" },
  { id: "a7", time: "11:18", client: "Plume Dental", check: "Receipt match", outcome: "£684 hotel charge - no receipt found", kind: "flag" },
  { id: "a8", time: "11:10", client: "Argent Legal", check: "VAT rule check", outcome: "Entertainment reclaim needs attendee review", kind: "flag" },
  { id: "a9", time: "11:02", client: "Kiln Ceramics", check: "DLA classification", outcome: "£5,000 credit likely loan repayment", kind: "info" },
  { id: "a10", time: "10:58", client: "Nori Kitchen", check: "Invoice OCR", outcome: "6 invoices parsed from inbox", kind: "ok" },
  { id: "a11", time: "10:51", client: "Harbour & Finch", check: "Payroll journal", outcome: "Posted to Xero (journal 4412)", kind: "ok" },
  { id: "a12", time: "10:42", client: "Plume Dental", check: "Calendar cross-ref", outcome: "Confirmed Lisbon trip 21-23 Mar", kind: "info" },
  { id: "a13", time: "10:35", client: "Argent Legal", check: "HMRC rule lookup", outcome: "Fetched VIT43100 & VIT43200", kind: "info" },
  { id: "a14", time: "10:28", client: "Nori Kitchen", check: "Supplier statement match", outcome: "Brakes Ltd reconciled - £3,112.40", kind: "ok" },
  { id: "a15", time: "10:20", client: "Juniper Flora", check: "Bank rec", outcome: "84 of 84 transactions matched", kind: "ok" },
  { id: "a16", time: "10:12", client: "Harbour & Finch", check: "Payroll variance check", outcome: "Within 2% of prior month", kind: "ok" },
  { id: "a17", time: "09:58", client: "Kestrel Build", check: "CIS subcontractor pull", outcome: "12 payments ready for Priya", kind: "info" },
  { id: "a18", time: "09:47", client: "Kiln Ceramics", check: "VAT return file", outcome: "Submitted - HMRC receipt H4K-8821", kind: "ok" },
  { id: "a19", time: "09:30", client: "All clients", check: "Overnight sync", outcome: "Pulled 312 transactions across 8 clients", kind: "ok" },
  { id: "a20", time: "09:04", client: "Juniper Flora", check: "Bank rec", outcome: "Clean - 0 exceptions", kind: "ok" },
];

export const LIVE_STATUS_CYCLE = [
  "Scanning Signal Cycles · Stripe payouts",
  "Reading 6 invoices from Nori Kitchen inbox",
  "Matching bank feed for Plume Dental",
  "Running anomaly check on Q1 utilities",
  "Cross-referencing Argent Legal VAT claims",
  "Drafting chase messages for 3 open gaps",
];

export function fmtGBP(n: number) {
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
