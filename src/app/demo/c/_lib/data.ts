/* Alt C fixture data: delegation first, team coordinator.
 * Lots of assignments, owners, SLA timers, follow-ups. */

export type Priority = "high" | "medium" | "low";
export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "in_review"
  | "blocked"
  | "done";

export type Assignee = {
  id: string;
  name: string;
  initials: string;
  role: string;
  load: number; // open task count, not derived (so demo can show realistic spread)
};

export type Client = {
  id: string;
  name: string;
  trade: string;
};

export type Task = {
  id: string;
  clientId: string;
  title: string;
  detail: string;
  assigneeId: string;
  status: TaskStatus;
  priority: Priority;
  dueLabel: string; // "Today, 16:00" / "Tomorrow" / "Mon 28 Apr"
  slaState: "due_today" | "overdue" | "waiting" | "on_track";
  slaLabel: string; // "Overdue 2 days" / "Waiting on client 3 days" / "Due in 4h"
  source: string; // "AI suggested" | "From reconciliation" | "Manual"
  evidence?: string[];
  blockerNote?: string;
  draftId?: string; // if a client draft is associated
};

export type Suggestion = {
  id: string;
  clientId: string;
  title: string;
  rationale: string;
  estimatedMinutes: number;
  suggestedAssigneeId: string;
  priority: Priority;
};

export type Draft = {
  id: string;
  clientId: string;
  channel: "Email" | "WhatsApp" | "Slack";
  recipient: string;
  subject?: string;
  body: string;
  authoredBy: string; // "AI draft" / assignee name
  createdAt: string;
  taskId?: string;
};

export type ActivityEvent = {
  id: string;
  time: string;
  client?: string;
  actor: string; // assignee name or "AI"
  action: string;
  detail: string;
  kind: "assignment" | "status" | "draft" | "blocked" | "completed" | "suggestion";
};

export const ASSIGNEES: Assignee[] = [
  { id: "u-colin", name: "Colin M.", initials: "CM", role: "Senior bookkeeper", load: 3 },
  { id: "u-priya", name: "Priya S.", initials: "PS", role: "Junior bookkeeper", load: 5 },
  { id: "u-jake", name: "Jake R.", initials: "JR", role: "Junior bookkeeper", load: 4 },
  { id: "u-lena", name: "Lena O.", initials: "LO", role: "VAT specialist", load: 2 },
  { id: "u-ai", name: "AI assistant", initials: "AI", role: "Automation", load: 2 },
];

export function assigneeById(id: string): Assignee {
  return ASSIGNEES.find((a) => a.id === id) ?? ASSIGNEES[0];
}

export const CLIENTS: Client[] = [
  { id: "c1", name: "Harbour & Finch", trade: "Design studio" },
  { id: "c2", name: "Kestrel Build", trade: "Construction" },
  { id: "c3", name: "Nori Kitchen", trade: "Hospitality" },
  { id: "c4", name: "Argent Legal", trade: "Professional services" },
  { id: "c5", name: "Kiln Ceramics", trade: "Manufacturing" },
  { id: "c6", name: "Pollen & Pine", trade: "Florist" },
];

export function clientById(id: string): Client {
  return CLIENTS.find((c) => c.id === id) ?? CLIENTS[0];
}

export const TASKS: Task[] = [
  {
    id: "t1",
    clientId: "c1",
    title: "Ask Harbour & Finch for missing March invoice",
    detail:
      "AWS charge of £142.60 on 18 Mar has no matching invoice. Second charge in one month, breaks 11-month pattern.",
    assigneeId: "u-priya",
    status: "in_progress",
    priority: "medium",
    dueLabel: "Today, 16:00",
    slaState: "due_today",
    slaLabel: "Due in 4h",
    source: "From reconciliation",
    evidence: ["Bank txn 18 Mar -£142.60", "No matching invoice", "Pattern: 11/12 prior months single billing"],
    draftId: "d1",
  },
  {
    id: "t2",
    clientId: "c4",
    title: "Reverse £343.60 entertainment VAT",
    detail:
      "5 of 6 Q1 dinners had UK-only attendees. HMRC VIT43100 blocks input VAT. Adjust VAT workings before filing.",
    assigneeId: "u-lena",
    status: "in_review",
    priority: "high",
    dueLabel: "Tomorrow",
    slaState: "on_track",
    slaLabel: "Due in 1d",
    source: "From reconciliation",
    evidence: ["Q1 VAT workings", "HMRC VIT43100", "5 UK-only dinners"],
  },
  {
    id: "t3",
    clientId: "c4",
    title: "Confirm attendees on Dublin dinner (£68.40 VAT)",
    detail:
      "Dinner on 14 Feb Dublin had 2 Irish attendees. May qualify under VIT43200. Need attendee list to confirm.",
    assigneeId: "u-priya",
    status: "blocked",
    priority: "medium",
    dueLabel: "Mon 28 Apr",
    slaState: "waiting",
    slaLabel: "Waiting on client 2d",
    source: "From reconciliation",
    blockerNote: "Waiting on Argent Legal to send the calendar invite for 14 Feb dinner.",
    draftId: "d2",
  },
  {
    id: "t4",
    clientId: "c3",
    title: "Ask Nori Kitchen about energy bill spike",
    detail:
      "Energia Lisboa charged £318.72 vs 12-month mean £243.20. Sits 2.66 std dev above. No tariff letter on file.",
    assigneeId: "u-jake",
    status: "not_started",
    priority: "low",
    dueLabel: "Mon 28 Apr",
    slaState: "on_track",
    slaLabel: "Due in 3d",
    source: "AI suggested",
    evidence: ["DD 26 Mar -£318.72", "12-mo mean £243.20", "No tariff notice"],
    draftId: "d3",
  },
  {
    id: "t5",
    clientId: "c2",
    title: "Get invoice for £1,240 Bloomify Ltd payment",
    detail:
      "New supplier, no invoice on file. Companies House confirms active florist wholesaler. Trade plausible.",
    assigneeId: "u-jake",
    status: "in_progress",
    priority: "medium",
    dueLabel: "Today",
    slaState: "due_today",
    slaLabel: "Due today",
    source: "From reconciliation",
    evidence: ["BLOOMIFY LTD 09 Mar -£1,240", "No prior history", "CH SIC 46220"],
    draftId: "d4",
  },
  {
    id: "t6",
    clientId: "c5",
    title: "Post DLA repayment to Kiln Ceramics ledger",
    detail:
      "T Hardwick £5,000 DLA top-up confirmed. Reduces director loan balance to -£3,420. Standard posting.",
    assigneeId: "u-priya",
    status: "done",
    priority: "low",
    dueLabel: "Yesterday",
    slaState: "on_track",
    slaLabel: "Closed 25 Apr 09:14",
    source: "From reconciliation",
    evidence: ["DLA confirmed", "Pattern match: 3 prior quarter-end top-ups"],
  },
  {
    id: "t7",
    clientId: "c6",
    title: "Reconcile Pollen & Pine March supplier statements",
    detail:
      "5 supplier statements landed overnight. Match against AP ledger and flag discrepancies over £50.",
    assigneeId: "u-priya",
    status: "not_started",
    priority: "medium",
    dueLabel: "Tue 29 Apr",
    slaState: "on_track",
    slaLabel: "Due in 4d",
    source: "AI suggested",
  },
  {
    id: "t8",
    clientId: "c1",
    title: "Chase Harbour & Finch for missing receipts (3)",
    detail:
      "Card purchases without receipts: £684 hotel Lisbon, £8.40 TfL, £49.20 ride share. Draft a single chase covering all three.",
    assigneeId: "u-priya",
    status: "blocked",
    priority: "high",
    dueLabel: "Overdue 2d",
    slaState: "overdue",
    slaLabel: "Overdue 2d",
    source: "AI suggested",
    blockerNote: "Client out of office until Mon 28 Apr per OOO autoreply.",
    draftId: "d5",
  },
  {
    id: "t9",
    clientId: "c2",
    title: "Review VAT classification on 3 line items",
    detail:
      "3 transactions on Kestrel Build's Q1 return coded as standard rate. Subcontractor labour usually reverse charge under CIS.",
    assigneeId: "u-lena",
    status: "in_progress",
    priority: "high",
    dueLabel: "Today, 17:00",
    slaState: "due_today",
    slaLabel: "Due in 5h",
    source: "AI suggested",
    evidence: ["3 line items, total £8,420", "CIS reverse charge rule"],
  },
  {
    id: "t10",
    clientId: "c3",
    title: "Send March management accounts pack to Nori",
    detail:
      "P&L, balance sheet, cash flow drafted. Awaiting Colin's sign-off before sending.",
    assigneeId: "u-colin",
    status: "in_review",
    priority: "medium",
    dueLabel: "Today, 18:00",
    slaState: "due_today",
    slaLabel: "Due in 6h",
    source: "Manual",
  },
  {
    id: "t11",
    clientId: "c5",
    title: "File Kiln Ceramics confirmation statement",
    detail:
      "Companies House confirmation statement due 02 May. Form CS01, no changes from prior year.",
    assigneeId: "u-jake",
    status: "not_started",
    priority: "high",
    dueLabel: "Fri 02 May",
    slaState: "on_track",
    slaLabel: "Due in 7d",
    source: "AI suggested",
  },
  {
    id: "t12",
    clientId: "c6",
    title: "Onboard Pollen & Pine to Dext",
    detail:
      "New client. Set up Dext receipt capture, invite signatories, configure auto-publish to Xero.",
    assigneeId: "u-colin",
    status: "in_progress",
    priority: "medium",
    dueLabel: "Wed 30 Apr",
    slaState: "on_track",
    slaLabel: "Due in 5d",
    source: "Manual",
  },
];

export function taskById(id: string): Task | undefined {
  return TASKS.find((t) => t.id === id);
}

export const SUGGESTIONS: Suggestion[] = [
  {
    id: "s1",
    clientId: "c1",
    title: "Reconcile Harbour & Finch April Stripe payouts",
    rationale: "Stripe sent 4 payouts last week. Standard recurring task. Priya did March in 22 minutes.",
    estimatedMinutes: 25,
    suggestedAssigneeId: "u-priya",
    priority: "medium",
  },
  {
    id: "s2",
    clientId: "c4",
    title: "Draft April VAT return for Argent Legal",
    rationale: "Books closed for April. VAT return due 07 May. Lena handles all VAT.",
    estimatedMinutes: 90,
    suggestedAssigneeId: "u-lena",
    priority: "high",
  },
  {
    id: "s3",
    clientId: "c5",
    title: "Reconcile Kiln Ceramics supplier statement",
    rationale: "Aluminium Direct sent April statement. AP ledger shows 6 unmatched invoices over £200.",
    estimatedMinutes: 30,
    suggestedAssigneeId: "u-jake",
    priority: "medium",
  },
  {
    id: "s4",
    clientId: "c2",
    title: "Chase Kestrel Build for 2 missing CIS deduction certificates",
    rationale: "Subcontractor invoices in March without matching CIS300 entries. Required before VAT filing.",
    estimatedMinutes: 15,
    suggestedAssigneeId: "u-priya",
    priority: "high",
  },
  {
    id: "s5",
    clientId: "c3",
    title: "Set up recurring journal for Nori Kitchen rent",
    rationale: "Monthly rent of £4,200 manually posted 5 months running. Recurring journal saves ~10 min/month.",
    estimatedMinutes: 10,
    suggestedAssigneeId: "u-colin",
    priority: "low",
  },
  {
    id: "s6",
    clientId: "c6",
    title: "Confirm opening balances with Pollen & Pine accountant",
    rationale: "New client onboarding. Need TB at 31 Mar from prior accountant before April books open.",
    estimatedMinutes: 20,
    suggestedAssigneeId: "u-colin",
    priority: "high",
  },
];

export const DRAFTS: Draft[] = [
  {
    id: "d1",
    clientId: "c1",
    channel: "Email",
    recipient: "accounts@harbourfinch.com",
    subject: "Quick one - missing AWS invoice for March",
    body:
      "Hi team,\n\nReconciling March now. There are two AWS charges of £142.60 (12 Mar and 18 Mar) but only one invoice on file. Could you forward the second one when you get a sec?\n\nA forwarded email or screenshot of the AWS billing page is fine.\n\nThanks,\nPriya",
    authoredBy: "AI draft",
    createdAt: "Today, 11:42",
    taskId: "t1",
  },
  {
    id: "d2",
    clientId: "c4",
    channel: "Email",
    recipient: "ops@argentlegal.com",
    subject: "Attendee list for 14 Feb Dublin dinner",
    body:
      "Hi,\n\nWorking through Q1 VAT for you. There's a £342 dinner in Dublin on 14 Feb that may qualify for input VAT recovery if attendees include overseas customers.\n\nCould you send the attendee list (or the calendar invite for that evening)? Names and companies is enough.\n\nThanks,\nPriya",
    authoredBy: "AI draft",
    createdAt: "Today, 11:35",
    taskId: "t3",
  },
  {
    id: "d3",
    clientId: "c3",
    channel: "WhatsApp",
    recipient: "Marcus (Nori Kitchen)",
    body:
      "Hi Marcus, just looking at your March books. Energia Lisboa came in at £318.72 against your usual £240ish. No tariff letter on file. Anything change at the restaurant - new equipment, longer hours, rate review? Just want to make sure I post it right.",
    authoredBy: "AI draft",
    createdAt: "Today, 11:28",
    taskId: "t4",
  },
  {
    id: "d4",
    clientId: "c2",
    channel: "Email",
    recipient: "tom@kestrelbuild.co.uk",
    subject: "Invoice for Bloomify Ltd payment - £1,240",
    body:
      "Hi Tom,\n\nFirst payment to Bloomify Ltd showed up on 9 March (£1,240). Could you forward the invoice or PO so I can post it correctly?\n\nThey're a wholesale florist on Companies House, so I'm guessing landscaping - just want to confirm before coding.\n\nCheers,\nJake",
    authoredBy: "AI draft",
    createdAt: "Today, 11:20",
    taskId: "t5",
  },
  {
    id: "d5",
    clientId: "c1",
    channel: "WhatsApp",
    recipient: "Tahi (Harbour & Finch)",
    body:
      "Hi Tahi, three card charges from March without receipts:\n\n• £684 hotel Lisbon, 22 Mar\n• £49.20 ride share, 23 Mar\n• £8.40 TfL, 20 Mar\n\nIf you can send photos when you're back from leave that's perfect. No rush, will hold March close until then.",
    authoredBy: "AI draft",
    createdAt: "Wed 23 Apr, 14:10",
    taskId: "t8",
  },
  {
    id: "d6",
    clientId: "c5",
    channel: "Email",
    recipient: "thardwick@kilnceramics.com",
    subject: "DLA repayment confirmed - balance update",
    body:
      "Hi Tom,\n\nQuick FYI: posted your £5,000 DLA top-up from 4 March. Your director loan balance is now -£3,420 (you owe the company that amount).\n\nNothing for you to do, just keeping you in the loop.\n\nColin",
    authoredBy: "Colin M.",
    createdAt: "Today, 09:14",
    taskId: "t6",
  },
];

export function draftById(id: string): Draft | undefined {
  return DRAFTS.find((d) => d.id === id);
}

export const ACTIVITY: ActivityEvent[] = [
  { id: "a1", time: "11:48", client: "Argent Legal", actor: "Lena O.", action: "Moved to in review", detail: "Entertainment VAT reversal ready for Colin's sign-off", kind: "status" },
  { id: "a2", time: "11:42", client: "Harbour & Finch", actor: "AI", action: "Drafted client message", detail: "Email to accounts@harbourfinch.com about missing AWS invoice", kind: "draft" },
  { id: "a3", time: "11:35", client: "Argent Legal", actor: "AI", action: "Drafted client message", detail: "Email asking for 14 Feb dinner attendee list", kind: "draft" },
  { id: "a4", time: "11:30", client: "Harbour & Finch", actor: "Priya S.", action: "Marked blocked", detail: "Client OOO until Mon 28 Apr", kind: "blocked" },
  { id: "a5", time: "11:22", client: "Kestrel Build", actor: "Colin M.", action: "Assigned task", detail: "VAT classification review → Lena O.", kind: "assignment" },
  { id: "a6", time: "11:15", client: "Pollen & Pine", actor: "AI", action: "Suggested task", detail: "Reconcile April supplier statements (5 docs)", kind: "suggestion" },
  { id: "a7", time: "10:58", client: "Kestrel Build", actor: "Jake R.", action: "Started task", detail: "Chasing Bloomify Ltd invoice", kind: "status" },
  { id: "a8", time: "09:14", client: "Kiln Ceramics", actor: "Colin M.", action: "Closed task", detail: "DLA repayment posted, balance now -£3,420", kind: "completed" },
  { id: "a9", time: "09:02", client: undefined, actor: "AI", action: "Suggested 6 tasks", detail: "Overnight scan across 6 clients", kind: "suggestion" },
  { id: "a10", time: "09:00", client: undefined, actor: "AI", action: "Daily standup ready", detail: "12 open tasks, 4 due today, 2 overdue, 2 blocked on client", kind: "completed" },
];

export const LIVE_STATUS_CYCLE = [
  "Watching SLA timers across 12 open tasks",
  "Drafting follow-up to Argent Legal",
  "Cross-checking Kestrel Build CIS deductions",
  "Suggesting next task for Priya S.",
  "Monitoring 2 blocked tasks for client reply",
];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  in_review: "In review",
  blocked: "Blocked",
  done: "Done",
};

export const STATUS_ORDER: TaskStatus[] = [
  "not_started",
  "in_progress",
  "in_review",
  "blocked",
  "done",
];

export function fmtGBP(n: number) {
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
