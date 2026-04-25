/* Alt B fixture data: auditor's ledger.
 * Fewer items, heavier detail, audit-file feel. */

export type Confidence = "high" | "medium" | "low";
export type Materiality = "high" | "medium" | "low";
export type Status = "open" | "approved" | "rejected";

export type Client = {
  id: string;
  name: string;
  trade: string;
};

export type Source = {
  label: string;
  value: string;
  origin: string;
};

export type TransformStep = {
  action: string;
  detail: string;
};

export type Claim = {
  id: string;
  clientId: string;
  period: string;
  title: string;
  summary: string;
  confidence: Confidence;
  materiality: Materiality;
  provenance: string;
  status: Status;
  amount?: number;
  sources: Source[];
  transformations: TransformStep[];
  matchLogic: string[];
  conclusionChain: string[];
  decisionNote?: string;
  decidedBy?: string;
  decidedAt?: string;
};

export type ActivityEvent = {
  id: string;
  time: string;
  client: string;
  action: string;
  detail: string;
  kind: "conclusion" | "check" | "flag" | "decision";
};

export const CLIENTS: Client[] = [
  { id: "c1", name: "Harbour & Finch", trade: "Design studio" },
  { id: "c2", name: "Kestrel Build", trade: "Construction" },
  { id: "c3", name: "Nori Kitchen", trade: "Hospitality" },
  { id: "c4", name: "Argent Legal", trade: "Professional services" },
  { id: "c5", name: "Kiln Ceramics", trade: "Manufacturing" },
];

export function clientById(id: string): Client {
  return CLIENTS.find((c) => c.id === id) ?? CLIENTS[0];
}

export const CLAIMS: Claim[] = [
  {
    id: "cl1",
    clientId: "c1",
    period: "March 2026",
    title: "Duplicate invoice likely",
    summary:
      "Two identical AWS charges of £142.60 six days apart. Only one invoice on file. Pattern breaks 11-month billing cadence.",
    confidence: "high",
    materiality: "low",
    provenance: "Bank feed anomaly detection",
    status: "open",
    amount: 142.6,
    sources: [
      { label: "Transaction A", value: "AMZN*2847XJ LUXEMBOURG, 12 Mar, -£142.60", origin: "Bank feed" },
      { label: "Transaction B", value: "AMZN*2847XJ LUXEMBOURG, 18 Mar, -£142.60", origin: "Bank feed" },
      { label: "Invoice", value: "INV-AWS-0312, £142.60", origin: "Invoice library" },
      { label: "Billing history", value: "11 consecutive monthly charges, single per month", origin: "12-month ledger" },
    ],
    transformations: [
      { action: "Extracted vendor code", detail: "AMZN*2847XJ resolved to Amazon Web Services via 11 prior matches" },
      { action: "Matched invoice", detail: "INV-AWS-0312 matches Transaction A by amount and date proximity" },
      { action: "Flagged duplicate", detail: "Transaction B has no matching invoice and breaks monthly pattern" },
    ],
    matchLogic: [
      "Vendor code AMZN*2847XJ appeared 11 times in prior 12 months, always once per calendar month.",
      "Transaction A (12 Mar) matches INV-AWS-0312 by exact amount (£142.60).",
      "Transaction B (18 Mar) has no corresponding invoice on file.",
      "Two charges in one month is a first for this supplier.",
    ],
    conclusionChain: [
      "Input: 2 bank transactions with identical vendor codes and amounts.",
      "Check: invoice library has only 1 matching document.",
      "Pattern: 11/12 prior months show single billing.",
      "Conclusion: second charge is likely duplicate. Recommend confirmation before posting.",
    ],
  },
  {
    id: "cl2",
    clientId: "c4",
    period: "Q1 2026",
    title: "VAT treatment inconsistent",
    summary:
      "£412 input VAT reclaimed on 6 restaurant invoices coded as client entertainment. HMRC blocks most entertainment VAT. One Dublin dinner may qualify under overseas customer rules.",
    confidence: "high",
    materiality: "high",
    provenance: "VAT rule cross-reference",
    status: "open",
    amount: 412,
    sources: [
      { label: "VAT workings", value: "£412.00 reclaimed across 6 receipts", origin: "VAT return draft" },
      { label: "Category", value: "Client entertainment", origin: "Junior coding" },
      { label: "HMRC guidance", value: "VIT43100: input VAT on business entertainment generally blocked", origin: "HMRC" },
      { label: "Exception rule", value: "VIT43200: overseas customers may qualify", origin: "HMRC" },
      { label: "Meeting notes", value: "5 of 6 dinners had UK-only attendees", origin: "Calendar + expenses" },
    ],
    transformations: [
      { action: "Identified category", detail: "6 receipts coded to client entertainment by junior" },
      { action: "Fetched HMRC rules", detail: "VIT43100 (general block) and VIT43200 (overseas exception)" },
      { action: "Cross-referenced attendees", detail: "Calendar entries matched to expense claims for attendee lists" },
    ],
    matchLogic: [
      "6 restaurant invoices totalling £412 VAT were reclaimed in Q1.",
      "All 6 are coded as client entertainment.",
      "HMRC VIT43100 blocks input VAT on business entertainment in most cases.",
      "VIT43200 allows an exception for entertaining overseas customers.",
      "5 of 6 dinners have UK-only attendees per meeting notes. These fail the exception.",
      "1 Dublin dinner (14 Feb) has 2 Irish attendees. May qualify.",
    ],
    conclusionChain: [
      "Input: 6 entertainment receipts with £412 VAT reclaimed.",
      "Rule: HMRC blocks entertainment VAT unless overseas customer exception applies.",
      "Evidence: 5 dinners are UK-only (blocked). 1 Dublin dinner has overseas attendees.",
      "Conclusion: £343.60 should be reversed. £68.40 (Dublin) needs attendee list confirmed before deciding.",
    ],
  },
  {
    id: "cl3",
    clientId: "c3",
    period: "March 2026",
    title: "Energy bill 31% higher",
    summary:
      "Energia Lisboa charged £318.72 this month against a 12-month average of £243.20. No tariff announcement on file. Sits outside 2 standard deviations.",
    confidence: "medium",
    materiality: "low",
    provenance: "Anomaly scan (utilities)",
    status: "open",
    amount: 318.72,
    sources: [
      { label: "This month", value: "DD ENERGIA LISBOA, 26 Mar, -£318.72", origin: "Bank feed" },
      { label: "12-month average", value: "£243.20", origin: "Historical ledger" },
      { label: "Last 3 months", value: "£241.10, £248.60, £239.80", origin: "Historical ledger" },
      { label: "Tariff notices", value: "None on file", origin: "Document store" },
    ],
    transformations: [
      { action: "Calculated trailing mean", detail: "12-month average = £243.20, std dev = £28.40" },
      { action: "Applied anomaly threshold", detail: "Current charge sits at +2.66 standard deviations" },
      { action: "Searched for explanation", detail: "No tariff change letter or rate announcement found" },
    ],
    matchLogic: [
      "March charge (£318.72) exceeds 12-month mean (£243.20) by £75.52.",
      "This is 2.66 standard deviations above the trailing average.",
      "Last 3 months were consistent: £241.10, £248.60, £239.80.",
      "No tariff change documentation found in the client's file.",
    ],
    conclusionChain: [
      "Input: single utility direct debit significantly above baseline.",
      "Check: no rate-change announcement on file.",
      "Pattern: 12 prior months were stable within a narrow band.",
      "Conclusion: likely a meter reading catch-up or rate change. Ask the client to confirm before coding.",
    ],
  },
  {
    id: "cl4",
    clientId: "c2",
    period: "March 2026",
    title: "Unmatched payment",
    summary:
      "£1,240 paid to Bloomify Ltd, a supplier not seen in prior 12 months. No invoice on file. Companies House confirms active floristry wholesale company.",
    confidence: "medium",
    materiality: "medium",
    provenance: "New supplier screen",
    status: "open",
    amount: 1240,
    sources: [
      { label: "Transaction", value: "BLOOMIFY LTD, 09 Mar, -£1,240.00", origin: "Bank feed" },
      { label: "Supplier history", value: "No prior payments in 12-month ledger", origin: "Ledger" },
      { label: "Companies House", value: "Bloomify Ltd, active, SIC 46220 (wholesale flowers)", origin: "CH API" },
    ],
    transformations: [
      { action: "Searched supplier ledger", detail: "No prior record of Bloomify Ltd" },
      { action: "Queried Companies House", detail: "Confirmed active company, floristry wholesale" },
      { action: "Applied new-supplier threshold", detail: "Payments over £1,000 to new suppliers require confirmation" },
    ],
    matchLogic: [
      "£1,240 payment to a supplier with no prior history.",
      "Companies House confirms Bloomify Ltd is an active floristry wholesaler.",
      "Trade plausible for client (construction firm with landscaping arm).",
      "Amount exceeds £1,000 new-supplier confirmation threshold.",
    ],
    conclusionChain: [
      "Input: payment to unknown supplier above threshold.",
      "Check: company exists and trade is plausible.",
      "Missing: no invoice on file to confirm the purchase.",
      "Conclusion: likely legitimate but needs invoice and client confirmation before posting.",
    ],
  },
  {
    id: "cl5",
    clientId: "c5",
    period: "March 2026",
    title: "Director loan classification",
    summary:
      "£5,000 credit from director's personal account with memo 'DLA topup'. DLA balance is -£8,420. Matches quarterly pattern.",
    confidence: "high",
    materiality: "high",
    provenance: "DLA pattern match",
    status: "approved",
    amount: 5000,
    sources: [
      { label: "Transaction", value: "T HARDWICK, 04 Mar, +£5,000.00", origin: "Bank feed" },
      { label: "Memo", value: "\"DLA topup\"", origin: "Bank narrative" },
      { label: "DLA balance", value: "-£8,420 (director owes company)", origin: "Last annual accounts" },
      { label: "Prior pattern", value: "Quarterly top-ups of similar size", origin: "12-month history" },
    ],
    transformations: [
      { action: "Identified director", detail: "T Hardwick is sole director per Companies House" },
      { action: "Checked DLA balance", detail: "Running balance shows director owes £8,420" },
      { action: "Matched pattern", detail: "3 similar credits in prior 12 months, all Q-end" },
    ],
    matchLogic: [
      "Credit from sole director with explicit 'DLA topup' memo.",
      "Director currently owes company £8,420 per DLA account.",
      "Prior 12 months show 3 similar quarter-end top-ups.",
      "Amount > £2,500 threshold triggers review.",
    ],
    conclusionChain: [
      "Input: £5,000 credit from director with DLA memo.",
      "Check: DLA balance confirms money is owed. Pattern matches prior behaviour.",
      "Classification: director loan repayment, reducing DLA balance to -£3,420.",
      "Conclusion: standard posting. Flagged only because amount exceeds threshold.",
    ],
    decisionNote: "Confirmed as DLA repayment. Posted to director loan account. Balance now -£3,420.",
    decidedBy: "Colin M.",
    decidedAt: "25 Apr 2026, 09:14",
  },
];

export const ACTIVITY: ActivityEvent[] = [
  { id: "b1", time: "11:42", client: "Harbour & Finch", action: "Concluded", detail: "Duplicate invoice likely on AWS charges", kind: "conclusion" },
  { id: "b2", time: "11:35", client: "Argent Legal", action: "Concluded", detail: "VAT treatment inconsistent on entertainment claims", kind: "conclusion" },
  { id: "b3", time: "11:28", client: "Nori Kitchen", action: "Flagged", detail: "Energy bill 31% above 12-month mean", kind: "flag" },
  { id: "b4", time: "11:20", client: "Kestrel Build", action: "Flagged", detail: "Unmatched £1,240 payment to new supplier", kind: "flag" },
  { id: "b5", time: "11:12", client: "Kiln Ceramics", action: "Checked", detail: "DLA pattern confirmed for £5,000 credit", kind: "check" },
  { id: "b6", time: "09:14", client: "Kiln Ceramics", action: "Decision recorded", detail: "Colin approved DLA repayment classification", kind: "decision" },
  { id: "b7", time: "09:00", client: "All clients", action: "Checked", detail: "Overnight sync: 312 transactions across 5 clients", kind: "check" },
];

export const LIVE_STATUS_CYCLE = [
  "Tracing conclusion chain for Harbour & Finch",
  "Cross-referencing HMRC rules for Argent Legal",
  "Comparing Nori Kitchen utilities to baseline",
  "Verifying Bloomify Ltd on Companies House",
  "Auditing DLA posting for Kiln Ceramics",
];

export function fmtGBP(n: number) {
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
