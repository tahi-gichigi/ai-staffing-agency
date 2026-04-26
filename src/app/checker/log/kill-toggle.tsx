"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function KillToggle({ initialKilled }: { initialKilled: boolean }) {
  const [killed, setKilled] = useState(initialKilled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function toggle() {
    const next = !killed;
    setError(null);
    try {
      const res = await fetch("/api/bookkeeper/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ killed: next }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Request failed (" + res.status + ")");
      }
      setKilled(next);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const label = killed ? "Resume agent" : "Disable agent";

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={
          "w-full rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 " +
          (killed
            ? "bg-accent text-white hover:bg-accent-dark"
            : "bg-ink text-paper hover:opacity-90")
        }
      >
        {pending ? "Saving…" : label}
      </button>
      {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
    </div>
  );
}
