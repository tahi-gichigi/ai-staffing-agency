// Pre-pass for content-based row matching. The Apps Script side sends the
// PDFs in a Drive folder once per run; we extract structured fields from each
// and return the array. Apps Script then does the row-to-extract matching
// client-side and calls /check with the matched extract attached.
//
// Caching: extractReceiptFromBuffer is keyed by SHA-256 of the PDF bytes, so
// running this endpoint twice on the same folder costs nothing extra.

import { NextRequest } from "next/server";
import { extractReceiptFromBuffer } from "../../../../../lib/bookkeeper/vision";
import { ReceiptExtractWithMeta } from "../../../../../lib/bookkeeper/types";
import {
  assertNotKilled,
  KillSwitchError,
} from "../../../../../lib/bookkeeper/kill-switch";

export const runtime = "nodejs";
// 18 PDFs × ~5s cold = 90s, but we run them in parallel so ~10s real time.
// Cap at the platform max so re-runs from a cold cache don't fail.
export const maxDuration = 60;

type ReqPdf = { fileId: string; filename: string; base64: string };
type ReqBody = { pdfs: ReqPdf[] };

type Extracted = ReceiptExtractWithMeta & { error?: string };

function unauthorized(reason: string) {
  return Response.json({ error: reason }, { status: 401 });
}

function badRequest(reason: string) {
  return Response.json({ error: reason }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const expected = process.env.BOOKKEEPER_API_TOKEN;
  if (!expected) {
    return Response.json(
      { error: "BOOKKEEPER_API_TOKEN not set on server" },
      { status: 500 }
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const got = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (got !== expected) return unauthorized("invalid bearer token");

  try {
    await assertNotKilled();
  } catch (e) {
    if (e instanceof KillSwitchError) {
      return Response.json({ error: e.message }, { status: 503 });
    }
    throw e;
  }

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return badRequest("body must be JSON");
  }

  if (!Array.isArray(body.pdfs)) {
    return badRequest("pdfs[] required");
  }

  // Run extractions in parallel. Cache hits return instantly; only fresh PDFs
  // hit the vision API. Errors on individual PDFs don't fail the whole batch -
  // the row matcher will just skip them.
  const extracts: Extracted[] = await Promise.all(
    body.pdfs.map(async (pdf): Promise<Extracted> => {
      const base: Pick<Extracted, "fileId" | "filename"> = {
        fileId: pdf.fileId,
        filename: pdf.filename,
      };
      try {
        const buffer = Buffer.from(pdf.base64, "base64");
        const extract = await extractReceiptFromBuffer(buffer);
        return { ...base, ...extract };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return {
          ...base,
          supplier: null,
          date: null,
          totalAmount: null,
          illegible: true,
          error: msg,
        };
      }
    })
  );

  return Response.json({ extracts });
}

export async function GET() {
  return Response.json({ ok: true, name: "bookkeeper-extract-batch" });
}
