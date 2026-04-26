import { kv } from "@vercel/kv";

const STATE_KEY = "bookkeeper:state";

type BookkeeperState = {
  last_run_at: string | null;
  last_run_rows: number;
  killed: boolean;
};

export async function assertNotKilled(): Promise<void> {
  const state = await kv.get<BookkeeperState>(STATE_KEY);
  if (state?.killed) {
    throw new KillSwitchError();
  }
}

export class KillSwitchError extends Error {
  constructor() {
    super("Bookkeeper agent is disabled.");
    this.name = "KillSwitchError";
  }
}
