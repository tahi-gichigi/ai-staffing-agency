// Claude vision wrapper for receipts and invoices, with on-disk caching by
// SHA-256 of the source PDF bytes. Re-running the matcher must not produce a
// vision call per row when receipts repeat across runs.

import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ReceiptExtract } from "./types";

// Spec calls for claude-sonnet-4-6. Cache is keyed by source-doc SHA-256 only,
// so a model swap will not invalidate prior extractions, but new docs go through 4-6.
const MODEL = "claude-sonnet-4-6";

const CACHE_DIR = path.resolve(
  process.cwd(),
  "lib/bookkeeper/.cache/vision"
);

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY not set");
    client = new Anthropic({ apiKey: key });
  }
  return client;
}

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

export async function hashFile(filePath: string): Promise<string> {
  const buf = await fs.readFile(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

export function hashBuffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

// In-memory cache as a fallback for serverless environments where the disk
// cache directory may be read-only or wiped between invocations.
const memCache = new Map<string, ReceiptExtract>();

const SYSTEM_PROMPT = `You are an OCR + extraction pass for a bookkeeping checker.
You will receive a single receipt or invoice PDF. Extract structured fields.
Return ONLY a JSON object with this shape:
{
  "supplier": string|null,
  "date": "YYYY-MM-DD"|null,
  "totalAmount": number|null,
  "alternateTotals": [{"label": string, "amount": number}]|null,
  "notes": string|null,
  "illegible": boolean
}
Rules:
- supplier: the trading name on the receipt, plain text, no marketing taglines.
- date: the transaction date. If the receipt shows the date in DD/MM/YYYY format, output ISO YYYY-MM-DD. UK dates are day-first.
- totalAmount: the amount the customer actually paid as a positive number in GBP, no currency symbol. If the receipt shows multiple totals (e.g. food subtotal vs total with service), pick the highest "amount paid" or "total" value. List the others under alternateTotals.
- alternateTotals: only include if more than one plausible total appears. Otherwise null.
- notes: short free-text observations only when something is unusual (rotated, partially cropped, faded, glare, missing total).
- illegible: true ONLY if you can't extract supplier, date and total with reasonable confidence. If you can read the date and supplier but not the total, illegible is false and you describe what's missing in notes.
Output JUST the JSON, no prose, no markdown fences.`;

async function extractFreshFromBuffer(buf: Buffer): Promise<ReceiptExtract> {
  const b64 = buf.toString("base64");
  const c = getClient();
  const resp = await c.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: b64,
            },
          },
          {
            type: "text",
            text: "Extract fields from this receipt or invoice.",
          },
        ],
      },
    ],
  });
  const textBlock = resp.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("vision response had no text block");
  }
  let raw = textBlock.text.trim();
  // Strip accidental markdown fences if the model adds them.
  raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
  let parsed: ReceiptExtract;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`vision returned non-JSON: ${raw.slice(0, 200)}`);
  }
  return parsed;
}

async function readDiskCache(hash: string): Promise<ReceiptExtract | null> {
  try {
    const text = await fs.readFile(path.join(CACHE_DIR, `${hash}.json`), "utf8");
    return JSON.parse(text) as ReceiptExtract;
  } catch {
    return null;
  }
}

async function writeDiskCache(hash: string, val: ReceiptExtract): Promise<void> {
  try {
    await ensureCacheDir();
    await fs.writeFile(path.join(CACHE_DIR, `${hash}.json`), JSON.stringify(val, null, 2));
  } catch {
    // Read-only fs (e.g. Vercel runtime); silently fall back to mem cache only.
  }
}

export async function extractReceipt(filePath: string): Promise<ReceiptExtract> {
  const buf = await fs.readFile(filePath);
  return extractReceiptFromBuffer(buf);
}

export async function extractReceiptFromBuffer(buf: Buffer): Promise<ReceiptExtract> {
  const hash = hashBuffer(buf);
  const memHit = memCache.get(hash);
  if (memHit) return memHit;
  const diskHit = await readDiskCache(hash);
  if (diskHit) {
    memCache.set(hash, diskHit);
    return diskHit;
  }
  const fresh = await extractFreshFromBuffer(buf);
  memCache.set(hash, fresh);
  await writeDiskCache(hash, fresh);
  return fresh;
}
