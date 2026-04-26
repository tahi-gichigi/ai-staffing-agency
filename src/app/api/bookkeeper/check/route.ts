// HTTP entry point for the bookkeeper matcher. Apps Script calls this with
// the row + the matching receipt PDF (base64) + the bank statement, and gets
// back a single verdict object that goes straight into the sheet.

import { NextRequest } from "next/server";
import { checkRowDirect } from "../../../../../lib/bookkeeper/matcher";
import {
  ReceiptExtract,
  ReceiptExtractWithMeta,
  Row,
  StatementLine,
} from "../../../../../lib/bookkeeper/types";
import {
  assertNotKilled,
  KillSwitchError,
} from "../../../../../lib/bookkeeper/kill-switch";

// Vision PDF + Anthropic call needs Node, not Edge.
export const runtime = "nodejs";
// Vision call easily exceeds the default 10s on cold starts.
export const maxDuration = 60;

type ReqBody = {
  row: Row;
  receipt?: { base64: string; filename: string } | null;
  // When the caller used /extract-batch and already has an extracted receipt,
  // they can pass it here so we skip the vision call (cheap fast path).
  prematchedExtract?: { extract: ReceiptExtract; filename: string } | null;
  // OR: pass the full pre-pass list and let the server pick which extract
  // belongs to this row by content match. This is the production path.
  availableExtracts?: ReceiptExtractWithMeta[];
  statement: StatementLine[];
  rowsHaveDuplicates?: { matchingRowIndices: number[] };
};

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

  if (!body.row || typeof body.row.amount !== "number") {
    return badRequest("row.amount required (number)");
  }
  if (!Array.isArray(body.statement)) {
    return badRequest("statement[] required");
  }

  const receipt = body.receipt
    ? {
        buffer: Buffer.from(body.receipt.base64, "base64"),
        filename: body.receipt.filename,
      }
    : null;

  try {
    const result = await checkRowDirect({
      row: body.row,
      receipt,
      prematchedExtract: body.prematchedExtract ?? null,
      availableExtracts: body.availableExtracts,
      statement: body.statement,
      rowsHaveDuplicates: body.rowsHaveDuplicates,
    });
    return Response.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ ok: true, name: "bookkeeper-check" });
}
