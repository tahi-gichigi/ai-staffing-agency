import { NextRequest } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";

const STATE_KEY = "bookkeeper:state";

type BookkeeperState = {
  last_run_at: string | null;
  last_run_rows: number;
  killed: boolean;
};

const DEFAULT_STATE: BookkeeperState = {
  last_run_at: null,
  last_run_rows: 0,
  killed: false,
};

async function getState(): Promise<BookkeeperState> {
  const state = await kv.get<BookkeeperState>(STATE_KEY);
  return state ?? DEFAULT_STATE;
}

export async function GET() {
  const state = await getState();
  return Response.json(state);
}

export async function POST(req: NextRequest) {
  let body: { killed: boolean };
  try {
    body = (await req.json()) as { killed: boolean };
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }

  if (typeof body.killed !== "boolean") {
    return Response.json(
      { error: "killed (boolean) required" },
      { status: 400 }
    );
  }

  const state = await getState();
  state.killed = body.killed;
  await kv.set(STATE_KEY, state);
  return Response.json(state);
}

export async function PUT(req: NextRequest) {
  const expected = process.env.BOOKKEEPER_API_TOKEN;
  if (!expected) {
    return Response.json(
      { error: "BOOKKEEPER_API_TOKEN not set on server" },
      { status: 500 }
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const got = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (got !== expected) {
    return Response.json({ error: "invalid bearer token" }, { status: 401 });
  }

  let body: { lastRunAt: string; lastRunRows: number };
  try {
    body = (await req.json()) as { lastRunAt: string; lastRunRows: number };
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }

  if (!body.lastRunAt || typeof body.lastRunRows !== "number") {
    return Response.json(
      { error: "lastRunAt (string) and lastRunRows (number) required" },
      { status: 400 }
    );
  }

  const state = await getState();
  state.last_run_at = body.lastRunAt;
  state.last_run_rows = body.lastRunRows;
  await kv.set(STATE_KEY, state);
  return Response.json(state);
}
