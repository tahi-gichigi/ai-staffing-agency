// Shared types for the bookkeeper matcher.

export type Row = {
  supplier: string;
  date: string; // ISO yyyy-mm-dd
  amount: number; // positive GBP
  description?: string;
};

export type StatementLine = {
  date: string;
  description: string;
  amount: number; // negative for debits
};

export type ReceiptExtract = {
  // What the vision pass thinks the document says.
  supplier: string | null;
  date: string | null; // ISO if confident
  totalAmount: number | null; // headline total used to reconcile
  alternateTotals?: { label: string; amount: number }[]; // e.g. food vs with-service
  notes?: string; // freeform observations (illegible bits, etc.)
  illegible?: boolean;
};

// ReceiptExtract enriched with the source file metadata it came from. Used by
// the content-based row matcher to decide which receipt belongs to which row.
export type ReceiptExtractWithMeta = ReceiptExtract & {
  fileId: string;
  filename: string;
};

export type SourceRef = {
  file: string;
  page?: number;
  line?: string;
} | null;

export type Verdict = "match" | "needs_review";

export type CheckResult = {
  verdict: Verdict;
  note: string;
  sourceRef: SourceRef;
};

export type Sources = {
  fixturesDir: string;
  statement: StatementLine[];
};
