// Deterministic comparison helpers. No LLM use here.

export const AMOUNT_TOLERANCE = 0.05;
// Used only for finding bank statement matches (clearing delays, etc).
export const STATEMENT_DATE_WINDOW_DAYS = 3;
// Strict window for receipt-vs-entry date verification. 0 = exact match required.
// A 1-day user error should be flagged, so we don't allow any tolerance here.
export const DATE_WINDOW_DAYS = 0;

export function amountsAgree(a: number, b: number): boolean {
  return Math.abs(a - b) <= AMOUNT_TOLERANCE + 1e-9;
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round(Math.abs(da - db) / (1000 * 60 * 60 * 24));
}

export function datesAgree(a: string, b: string): boolean {
  return daysBetween(a, b) <= DATE_WINDOW_DAYS;
}

// Loose supplier comparison. Bank descriptors are noisy (e.g. "GOOGLE *GSUITE_MOOCH"),
// so we tokenise and check for any meaningful overlap rather than equality.
const STOP_TOKENS = new Set([
  "the", "and", "ltd", "limited", "inc", "uk", "london", "plc", "co", "company",
  "manchester", "shoreditch", "farringdon", "moorgate", "liverpool", "st",
  "monthly", "subscription", "pay", "as", "you", "go", "trip", "retail",
  "stationery", "coffee",
]);

export function tokenise(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && t.length > 1 && !STOP_TOKENS.has(t));
}

export function suppliersAgree(userSupplier: string, candidate: string): boolean {
  const a = new Set(tokenise(userSupplier));
  const b = new Set(tokenise(candidate));
  if (a.size === 0 || b.size === 0) return false;
  for (const t of a) if (b.has(t)) return true;
  // Substring fallback covers things like "ico" vs "info commissioner".
  const ua = userSupplier.toLowerCase().replace(/\s+/g, "");
  const cb = candidate.toLowerCase().replace(/\s+/g, "");
  return ua.length >= 3 && cb.includes(ua);
}

export function fmtGbp(n: number): string {
  return `£${n.toFixed(2)}`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
}
