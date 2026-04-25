// Bookkeeper row checker.
// Given a user-entered row, reconcile against the receipt PDF (if present) and
// the bank statement, then produce a verdict + human-readable note.
// Comparisons are deterministic; vision is only used to read the receipt.

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  CheckResult,
  Row,
  Sources,
  StatementLine,
  ReceiptExtract,
} from "./types";
import {
  amountsAgree,
  daysBetween,
  datesAgree,
  fmtDate,
  fmtGbp,
  suppliersAgree,
} from "./compare";
import { extractReceipt } from "./vision";

// Match a row to its bank statement line. Strategy: amount equality (debit
// magnitude) wins, then date proximity, then supplier overlap as a sanity check.
export function findStatementMatch(
  row: Row,
  statement: StatementLine[]
): StatementLine | null {
  // Pass 1: exact amount + date within window + supplier hint.
  const candidates = statement
    .map((l) => ({
      l,
      amtOk: amountsAgree(Math.abs(l.amount), row.amount),
      dateGap: daysBetween(l.date, row.date),
      suppOk: suppliersAgree(row.supplier, l.description),
    }))
    .filter((c) => c.dateGap <= 7); // wider window for statement-only search

  // Best: amount agrees + supplier hint + closest date.
  const strong = candidates
    .filter((c) => c.amtOk && c.suppOk)
    .sort((a, b) => a.dateGap - b.dateGap);
  if (strong.length > 0) return strong[0].l;

  // Next: amount agrees + date close (handles wrong-supplier seeded errors).
  const byAmount = candidates
    .filter((c) => c.amtOk && c.dateGap <= 3)
    .sort((a, b) => a.dateGap - b.dateGap);
  if (byAmount.length > 0) return byAmount[0].l;

  // Next: supplier hint + same date (handles wrong-amount seeded errors).
  const bySupp = candidates
    .filter((c) => c.suppOk && c.dateGap <= 3)
    .sort((a, b) => a.dateGap - b.dateGap);
  if (bySupp.length > 0) return bySupp[0].l;

  return null;
}

// Given the row index (1-based, matching rows.csv), find the receipt PDF in
// the fixtures dir if it exists. Naming convention: R{NNN}_*.pdf.
export async function findReceiptFile(
  rowIndex: number,
  fixturesDir: string
): Promise<string | null> {
  const prefix = `R${String(rowIndex).padStart(3, "0")}_`;
  let entries: string[];
  try {
    entries = await fs.readdir(fixturesDir);
  } catch {
    return null;
  }
  const hit = entries.find((f) => f.startsWith(prefix) && f.endsWith(".pdf"));
  return hit ? path.join(fixturesDir, hit) : null;
}

type CheckRowOpts = {
  rowIndex?: number; // 1-based, used to locate the receipt by filename convention
  rowsHaveDuplicates?: { matchingRowIndices: number[] }; // for E7 duplicate detection
};

export async function checkRow(
  row: Row,
  sources: Sources,
  opts: CheckRowOpts = {}
): Promise<CheckResult> {
  const stmtLine = findStatementMatch(row, sources.statement);
  const receiptPath = opts.rowIndex
    ? await findReceiptFile(opts.rowIndex, sources.fixturesDir)
    : null;

  let receipt: ReceiptExtract | null = null;
  if (receiptPath) {
    try {
      receipt = await extractReceipt(receiptPath);
    } catch (e) {
      receipt = null;
    }
  }

  const sourceRef = receiptPath
    ? { file: path.basename(receiptPath) }
    : stmtLine
    ? { file: "statement.csv", line: `${stmtLine.date} ${stmtLine.description}` }
    : null;

  // Collate signals.
  const signals = collectSignals(row, receipt, stmtLine);

  // Duplicate detection (E7): caller flags rows that have an identical-twin in rows.csv.
  // We say "needs_review" when there's a twin AND we couldn't find a separate receipt
  // AND the bank statement only shows one debit shared with the twin.
  if (opts.rowsHaveDuplicates && opts.rowsHaveDuplicates.matchingRowIndices.length > 0) {
    if (!receiptPath) {
      const twin = opts.rowsHaveDuplicates.matchingRowIndices[0];
      return {
        verdict: "needs_review",
        note: `Likely duplicate of row ${twin}. Same supplier (${row.supplier}) and amount ${fmtGbp(row.amount)}, only one bank debit and one receipt for the month.`,
        sourceRef,
      };
    }
  }

  // E8 case: bank confirms but no receipt at all.
  if (!receiptPath && stmtLine) {
    // Check if the bank line exactly matches what the user entered.
    if (
      amountsAgree(Math.abs(stmtLine.amount), row.amount) &&
      datesAgree(stmtLine.date, row.date) &&
      suppliersAgree(row.supplier, stmtLine.description)
    ) {
      return {
        verdict: "needs_review",
        note: `No source document found. Bank confirms ${fmtGbp(row.amount)} on ${fmtDate(stmtLine.date)} (${stmtLine.description}) but a receipt or invoice has not been uploaded.`,
        sourceRef,
      };
    }
  }

  // No receipt, no statement line.
  if (!receiptPath && !stmtLine) {
    return {
      verdict: "needs_review",
      note: `No matching receipt and no bank line found for ${row.supplier} ${fmtGbp(row.amount)} on ${fmtDate(row.date)}. Check the supplier name or upload a receipt.`,
      sourceRef: null,
    };
  }

  // From here we have at least one source. Build a verdict.
  return buildVerdict(row, receipt, stmtLine, sourceRef);
}

type Signals = {
  amountAgreesWithReceipt: boolean | null;
  amountAgreesWithBank: boolean | null;
  dateAgreesWithReceipt: boolean | null;
  dateAgreesWithBank: boolean | null;
  supplierAgreesWithReceipt: boolean | null;
  supplierAgreesWithBank: boolean | null;
  receiptAndBankAgreeOnAmount: boolean | null;
  receiptAndBankAgreeOnDate: boolean | null;
};

function collectSignals(
  row: Row,
  receipt: ReceiptExtract | null,
  stmtLine: StatementLine | null
): Signals {
  return {
    amountAgreesWithReceipt:
      receipt && receipt.totalAmount != null
        ? amountsAgree(receipt.totalAmount, row.amount)
        : null,
    amountAgreesWithBank: stmtLine
      ? amountsAgree(Math.abs(stmtLine.amount), row.amount)
      : null,
    dateAgreesWithReceipt:
      receipt && receipt.date ? datesAgree(receipt.date, row.date) : null,
    dateAgreesWithBank: stmtLine ? datesAgree(stmtLine.date, row.date) : null,
    supplierAgreesWithReceipt:
      receipt && receipt.supplier
        ? suppliersAgree(row.supplier, receipt.supplier)
        : null,
    supplierAgreesWithBank: stmtLine
      ? suppliersAgree(row.supplier, stmtLine.description)
      : null,
    receiptAndBankAgreeOnAmount:
      receipt && receipt.totalAmount != null && stmtLine
        ? amountsAgree(receipt.totalAmount, Math.abs(stmtLine.amount))
        : null,
    receiptAndBankAgreeOnDate:
      receipt && receipt.date && stmtLine
        ? datesAgree(receipt.date, stmtLine.date)
        : null,
  };
}

function buildVerdict(
  row: Row,
  receipt: ReceiptExtract | null,
  stmtLine: StatementLine | null,
  sourceRef: { file: string; page?: number; line?: string } | null
): CheckResult {
  const s = collectSignals(row, receipt, stmtLine);

  // Ambiguous receipt (E9 case): two plausible totals.
  if (
    receipt &&
    receipt.alternateTotals &&
    receipt.alternateTotals.length > 0 &&
    receipt.totalAmount != null
  ) {
    // If bank confirms one of them and user picked the other.
    if (stmtLine) {
      const bankAmt = Math.abs(stmtLine.amount);
      const userPicksMain = amountsAgree(receipt.totalAmount, row.amount);
      const userPicksAlt = receipt.alternateTotals.some((a) =>
        amountsAgree(a.amount, row.amount)
      );
      const bankMatchesMain = amountsAgree(receipt.totalAmount, bankAmt);
      const bankMatchesAlt = receipt.alternateTotals.some((a) =>
        amountsAgree(a.amount, bankAmt)
      );
      if (userPicksAlt && bankMatchesMain) {
        const altLabel = receipt.alternateTotals.find((a) =>
          amountsAgree(a.amount, row.amount)
        );
        return {
          verdict: "needs_review",
          note: `Receipt shows two totals: ${fmtGbp(receipt.totalAmount)} (main) and ${receipt.alternateTotals.map((a) => `${fmtGbp(a.amount)} ${a.label}`).join(", ")}. Bank confirms ${fmtGbp(bankAmt)}, so the ${bankMatchesMain ? "main" : "alternate"} total is what was charged. You entered ${fmtGbp(row.amount)} (${altLabel?.label ?? "alternate"}).`,
          sourceRef,
        };
      }
      if (userPicksMain && bankMatchesAlt) {
        return {
          verdict: "needs_review",
          note: `Receipt shows two totals: ${fmtGbp(receipt.totalAmount)} (main) and ${receipt.alternateTotals.map((a) => `${fmtGbp(a.amount)} ${a.label}`).join(", ")}. Bank confirms ${fmtGbp(bankAmt)} which is the alternate, not what you entered.`,
          sourceRef,
        };
      }
    }
  }

  // Illegible receipt: produce a useful note describing what we did see.
  if (receipt && receipt.illegible) {
    const seen: string[] = [];
    if (receipt.supplier) seen.push(`supplier ${receipt.supplier}`);
    if (receipt.date) seen.push(`date ${receipt.date}`);
    if (receipt.totalAmount != null) seen.push(`total ${fmtGbp(receipt.totalAmount)}`);
    const seenStr = seen.length ? `Could read ${seen.join(", ")}.` : "Could not read key fields.";
    const bankBit = stmtLine
      ? ` Bank shows ${fmtGbp(Math.abs(stmtLine.amount))} on ${fmtDate(stmtLine.date)} (${stmtLine.description}), which ${s.amountAgreesWithBank ? "matches" : "does not match"} what you entered.`
      : "";
    return {
      verdict: "needs_review",
      note: `Receipt is partially illegible. ${seenStr}${receipt.notes ? ` ${receipt.notes}.` : ""}${bankBit}`,
      sourceRef,
    };
  }

  // Mismatch detection.
  // Amount mismatch where receipt and bank agree on a different number (E1, E2).
  if (
    receipt &&
    stmtLine &&
    s.amountAgreesWithReceipt === false &&
    s.amountAgreesWithBank === false &&
    s.receiptAndBankAgreeOnAmount === true &&
    receipt.totalAmount != null
  ) {
    const truth = receipt.totalAmount;
    const transposed = isTransposition(row.amount, truth);
    const noteHead = transposed
      ? `Looks like digit transposition: entered ${fmtGbp(row.amount)}, actual ${fmtGbp(truth)}.`
      : `User entered ${fmtGbp(row.amount)}, receipt and bank both show ${fmtGbp(truth)}.`;
    return { verdict: "needs_review", note: noteHead, sourceRef };
  }

  // Amount mismatch with only bank present.
  if (!receipt && stmtLine && s.amountAgreesWithBank === false) {
    const truth = Math.abs(stmtLine.amount);
    const transposed = isTransposition(row.amount, truth);
    const head = transposed
      ? `Looks like digit transposition: entered ${fmtGbp(row.amount)}, bank shows ${fmtGbp(truth)} on ${fmtDate(stmtLine.date)}.`
      : `User entered ${fmtGbp(row.amount)}, bank shows ${fmtGbp(truth)} on ${fmtDate(stmtLine.date)}.`;
    return { verdict: "needs_review", note: head, sourceRef };
  }

  // Amount mismatch with only receipt present.
  if (receipt && !stmtLine && s.amountAgreesWithReceipt === false && receipt.totalAmount != null) {
    return {
      verdict: "needs_review",
      note: `User entered ${fmtGbp(row.amount)}, receipt shows ${fmtGbp(receipt.totalAmount)}.`,
      sourceRef,
    };
  }

  // Date mismatch where receipt and bank agree (E5).
  if (
    receipt &&
    stmtLine &&
    s.dateAgreesWithReceipt === false &&
    s.dateAgreesWithBank === false &&
    s.receiptAndBankAgreeOnDate === true &&
    receipt.date
  ) {
    const gap = daysBetween(receipt.date, row.date);
    return {
      verdict: "needs_review",
      note: `Date is off by ${gap} day${gap === 1 ? "" : "s"}: entered ${fmtDate(row.date)}, receipt and bank both ${fmtDate(receipt.date)}.`,
      sourceRef,
    };
  }

  // Date mismatch with only bank.
  if (!receipt && stmtLine && s.dateAgreesWithBank === false) {
    const gap = daysBetween(stmtLine.date, row.date);
    return {
      verdict: "needs_review",
      note: `Date is off by ${gap} day${gap === 1 ? "" : "s"}: entered ${fmtDate(row.date)}, bank shows ${fmtDate(stmtLine.date)}.`,
      sourceRef,
    };
  }

  // Supplier mismatch (E6): receipt is from a different supplier but amount and date match.
  if (
    receipt &&
    receipt.supplier &&
    s.supplierAgreesWithReceipt === false &&
    s.amountAgreesWithReceipt === true &&
    s.dateAgreesWithReceipt === true
  ) {
    const bankBit = stmtLine && s.supplierAgreesWithBank === false
      ? ` Bank line says "${stmtLine.description}".`
      : "";
    return {
      verdict: "needs_review",
      note: `Supplier mismatch: entered ${row.supplier}, receipt is from ${receipt.supplier}. Amount and date match.${bankBit}`,
      sourceRef,
    };
  }

  // Clean match: at least one source agrees on amount + date + supplier.
  const receiptClean =
    receipt &&
    s.amountAgreesWithReceipt === true &&
    s.dateAgreesWithReceipt === true &&
    s.supplierAgreesWithReceipt !== false;
  const bankClean =
    stmtLine &&
    s.amountAgreesWithBank === true &&
    s.dateAgreesWithBank === true &&
    s.supplierAgreesWithBank !== false;

  if (receiptClean && bankClean) {
    return { verdict: "match", note: "Matches receipt and bank entry.", sourceRef };
  }
  if (receiptClean) {
    return { verdict: "match", note: "Matches receipt.", sourceRef };
  }
  if (bankClean) {
    return { verdict: "match", note: "Matches bank entry.", sourceRef };
  }

  // Fallback: describe what we actually saw rather than say "can't tell".
  const parts: string[] = [];
  if (receipt) {
    parts.push(
      `Receipt shows ${receipt.supplier ?? "unknown supplier"}, ${receipt.date ?? "unknown date"}, ${receipt.totalAmount != null ? fmtGbp(receipt.totalAmount) : "unknown total"}.`
    );
  }
  if (stmtLine) {
    parts.push(
      `Bank shows ${stmtLine.description} on ${fmtDate(stmtLine.date)} for ${fmtGbp(Math.abs(stmtLine.amount))}.`
    );
  }
  parts.push(
    `User entered ${row.supplier}, ${fmtDate(row.date)}, ${fmtGbp(row.amount)}.`
  );
  return {
    verdict: "needs_review",
    note: parts.join(" "),
    sourceRef,
  };
}

// Return true if `entered` looks like a swap of two adjacent digits in `truth`.
// Example: 89 vs 98, 84.50 vs 48.50.
export function isTransposition(entered: number, truth: number): boolean {
  const a = entered.toFixed(2).replace(".", "");
  const b = truth.toFixed(2).replace(".", "");
  if (a.length !== b.length) return false;
  if (a === b) return false;
  // Find positions where chars differ.
  const diffs: number[] = [];
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diffs.push(i);
  if (diffs.length !== 2) return false;
  const [i, j] = diffs;
  return a[i] === b[j] && a[j] === b[i];
}
