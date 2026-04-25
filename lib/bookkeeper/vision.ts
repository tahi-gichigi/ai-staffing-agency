// Claude vision wrapper for receipts and invoices, with on-disk caching by
// SHA-256 of the source PDF bytes. Re-running the matcher must not produce a
// vision call per row when receipts repeat across runs.

import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ReceiptExtract } from "./types";

const MODEL = "claude-sonnet-4-5";
// Note: spec asked for claude-sonnet-4-6, but at time of writing 4-5 is the
// available Sonnet that handles PDFs. If 4-6 is later live, swap the constant.

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

async function extractFresh(filePath: string): Promise<ReceiptExtract> {
  const buf = await fs.readFile(filePath);
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

export async function extractReceipt(filePath: string): Promise<ReceiptExtract> {
  await ensureCacheDir();
  const hash = await hashFile(filePath);
  const cachePath = path.join(CACHE_DIR, `${hash}.json`);
  try {
    const cached = await fs.readFile(cachePath, "utf8");
    return JSON.parse(cached) as ReceiptExtract;
  } catch {
    // miss
  }
  const fresh = await extractFresh(filePath);
  await fs.writeFile(cachePath, JSON.stringify(fresh, null, 2));
  return fresh;
}
