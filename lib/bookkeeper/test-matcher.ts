// Test harness for the bookkeeper matcher.
// Loads rows.csv + statement.csv from fixtures, runs every row through checkRow
// against the local PDFs, prints a results table, and computes precision +
// recall against the 9 seeded errors from seeded-errors.md.
//
// Run with: pnpm tsx lib/bookkeeper/test-matcher.ts

// Run: source .env.local && pnpm tsx lib/bookkeeper/test-matcher.ts
// ANTHROPIC_API_KEY must be set in the environment before running.
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseCsv } from "./csv";
import { checkRow } from "./matcher";
import { Row, StatementLine } from "./types";

const REPO_ROOT = path.resolve(__dirname, "../..");
const FIXTURES_PDF_DIR = path.join(REPO_ROOT, "bookkeeper-fixtures");
const FIXTURES_DATA_DIR = path.join(REPO_ROOT, "fixtures/bookkeeper");

// Ground truth: row indices (1-based) of the 9 seeded errors.
const SEEDED_ERROR_ROWS = [8, 11, 12, 25, 31, 32, 38, 42, 44];

async function loadRows(): Promise<Row[]> {
  const text = await fs.readFile(path.join(FIXTURES_DATA_DIR, "rows.csv"), "utf8");
  const rows = parseCsv(text);
  const [header, ...body] = rows;
  return body.map((r) => ({
    supplier: r[0],
    date: r[1],
    amount: parseFloat(r[2]),
    description: r[3] ?? "",
  }));
}

async function loadStatement(): Promise<StatementLine[]> {
  const text = await fs.readFile(path.join(FIXTURES_DATA_DIR, "statement.csv"), "utf8");
  const rows = parseCsv(text);
  const [header, ...body] = rows;
  return body.map((r) => ({
    date: r[0],
    description: r[1],
    amount: parseFloat(r[2]),
  }));
}

// Detect duplicates in the row list (for E7).
// Returns a map: rowIndex (1-based) -> array of OTHER 1-based indices that look identical.
function findDuplicates(rows: Row[]): Map<number, number[]> {
  const out = new Map<number, number[]>();
  for (let i = 0; i < rows.length; i++) {
    const a = rows[i];
    for (let j = 0; j < rows.length; j++) {
      if (i === j) continue;
      const b = rows[j];
      if (
        a.supplier.toLowerCase() === b.supplier.toLowerCase() &&
        Math.abs(a.amount - b.amount) < 0.01 &&
        // same month
        a.date.slice(0, 7) === b.date.slice(0, 7)
      ) {
        const list = out.get(i + 1) ?? [];
        list.push(j + 1);
        out.set(i + 1, list);
      }
    }
  }
  return out;
}

function pad(s: string, n: number): string {
  if (s.length >= n) return s.slice(0, n - 1) + "…";
  return s + " ".repeat(n - s.length);
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set. Put it in .env.local.");
    process.exit(1);
  }

  console.log("Loading fixtures...");
  const rows = await loadRows();
  const statement = await loadStatement();
  console.log(`  ${rows.length} rows, ${statement.length} statement lines`);

  const duplicates = findDuplicates(rows);

  const sources = { fixturesDir: FIXTURES_PDF_DIR, statement };

  const results: { idx: number; row: Row; verdict: string; note: string; sourceRef: string }[] = [];

  console.log("Running matcher...\n");

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const idx = i + 1;
    process.stdout.write(`row ${idx}/${rows.length} ${row.supplier}... `);
    const dupTwins = duplicates.get(idx);
    // Only treat as duplicate-candidate if there's a twin AT A LATER index
    // (so we mark the second occurrence, not the first).
    const laterTwins = (dupTwins ?? []).filter((t) => t < idx);
    const result = await checkRow(row, sources, {
      rowIndex: idx,
      rowsHaveDuplicates: laterTwins.length > 0 ? { matchingRowIndices: laterTwins } : undefined,
    });
    const sourceRefStr = result.sourceRef
      ? result.sourceRef.file +
        (result.sourceRef.line ? ` :: ${result.sourceRef.line}` : "")
      : "(none)";
    results.push({
      idx,
      row,
      verdict: result.verdict,
      note: result.note,
      sourceRef: sourceRefStr,
    });
    console.log(result.verdict);
  }

  console.log("\n=== RESULTS TABLE ===\n");
  console.log(
    pad("#", 4) +
      pad("Supplier", 26) +
      pad("Date", 12) +
      pad("Amount", 9) +
      pad("Verdict", 14) +
      "Note"
  );
  console.log("-".repeat(120));
  for (const r of results) {
    console.log(
      pad(String(r.idx), 4) +
        pad(r.row.supplier, 26) +
        pad(r.row.date, 12) +
        pad(`£${r.row.amount.toFixed(2)}`, 9) +
        pad(r.verdict, 14) +
        r.note
    );
  }

  console.log("\n=== SOURCE REFS ===\n");
  for (const r of results) {
    console.log(`${pad(String(r.idx), 4)} ${pad(r.row.supplier, 26)} -> ${r.sourceRef}`);
  }

  // Precision + recall on seeded errors.
  // Positive = "needs_review". Ground truth positives = SEEDED_ERROR_ROWS.
  const flagged = new Set(results.filter((r) => r.verdict === "needs_review").map((r) => r.idx));
  const groundTruth = new Set(SEEDED_ERROR_ROWS);

  const tp = [...flagged].filter((i) => groundTruth.has(i));
  const fp = [...flagged].filter((i) => !groundTruth.has(i));
  const fn = [...groundTruth].filter((i) => !flagged.has(i));

  const precision = tp.length / (tp.length + fp.length || 1);
  const recall = tp.length / (tp.length + fn.length || 1);

  console.log("\n=== SCORE ===");
  console.log(`Seeded errors (ground truth positives): ${[...groundTruth].sort((a, b) => a - b).join(", ")}`);
  console.log(`Flagged as needs_review: ${[...flagged].sort((a, b) => a - b).join(", ")}`);
  console.log(`True positives (correctly flagged): ${tp.sort((a, b) => a - b).join(", ")} (${tp.length}/${groundTruth.size})`);
  console.log(`False positives (clean rows wrongly flagged): ${fp.sort((a, b) => a - b).join(", ")} (${fp.length})`);
  console.log(`False negatives (seeded errors missed): ${fn.sort((a, b) => a - b).join(", ")} (${fn.length})`);
  console.log(`Precision: ${(precision * 100).toFixed(1)}%`);
  console.log(`Recall: ${(recall * 100).toFixed(1)}%`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
