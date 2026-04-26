import { kv } from "@vercel/kv";
import KillToggle from "./kill-toggle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return sec + "s ago";
  const min = Math.round(sec / 60);
  if (min < 60) return min + "m ago";
  const hr = Math.round(min / 60);
  if (hr < 24) return hr + "h ago";
  const d = Math.round(hr / 24);
  return d + "d ago";
}

function absoluteTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

export default async function CheckerLogPage() {
  let state: BookkeeperState = DEFAULT_STATE;
  try {
    const fromKv = await kv.get<BookkeeperState>(STATE_KEY);
    if (fromKv) state = fromKv;
  } catch {
    // Fall through to defaults if KV is unreachable. Page should still render.
  }

  return (
    <main className="min-h-screen bg-paper text-ink flex items-start justify-center px-6 py-16">
      <div className="w-full max-w-md bg-card-bg border border-divider rounded-lg shadow-sm p-8 space-y-6">
        <div>
          <h1 className="font-serif text-3xl text-ink">Bookkeeper agent</h1>
          <p className="text-sm text-muted mt-1">Trust + status</p>
        </div>

        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-muted">Last run</dt>
            <dd className="text-ink mt-1">
              {state.last_run_at ? (
                <>
                  <span className="font-medium">{relativeTime(state.last_run_at)}</span>
                  <span className="text-muted-light ml-2">{absoluteTime(state.last_run_at)}</span>
                </>
              ) : (
                <span className="text-muted-light">Never run</span>
              )}
            </dd>
          </div>

          <div>
            <dt className="text-muted">Rows checked last run</dt>
            <dd className="text-ink mt-1 font-medium">{state.last_run_rows}</dd>
          </div>

          <div>
            <dt className="text-muted">Status</dt>
            <dd className="mt-1">
              {state.killed ? (
                <span className="inline-flex items-center gap-2 text-red-700 font-medium">
                  <span className="h-2 w-2 rounded-full bg-red-600" />
                  Disabled
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-accent font-medium">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  Active
                </span>
              )}
            </dd>
          </div>
        </dl>

        <div className="pt-4 border-t border-divider">
          <KillToggle initialKilled={state.killed} />
          <p className="text-xs text-muted-light mt-3">
            Toggling stops or resumes all bookkeeper checks. The Sheet shows an error verdict on rows attempted while disabled.
          </p>
        </div>
      </div>
    </main>
  );
}
