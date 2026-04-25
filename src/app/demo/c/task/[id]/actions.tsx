"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STATUS_LABEL, STATUS_ORDER } from "../../_lib/data";
import type { TaskStatus } from "../../_lib/data";

export function TaskActions({
  taskId,
  currentStatus,
}: {
  taskId: string;
  currentStatus: TaskStatus;
}) {
  void taskId;
  const router = useRouter();
  const [status, setStatus] = useState<TaskStatus>(currentStatus);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  function save() {
    setToast(`Saved. Status: ${STATUS_LABEL[status]}.`);
    setTimeout(() => router.push("/demo/c/board"), 1100);
  }

  return (
    <div className="bg-card-bg rounded-2xl border border-divider/60 p-4">
      <div role="radiogroup" aria-label="Task status" className="space-y-1.5 mb-4">
        {STATUS_ORDER.map((s) => {
          const active = s === status;
          return (
            <button
              key={s}
              role="radio"
              aria-checked={active}
              onClick={() => setStatus(s)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[13px] transition-[background-color,color] duration-150 ${
                active
                  ? "bg-accent-light text-accent font-semibold"
                  : "text-muted hover:bg-paper-warm/60 hover:text-ink"
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${
                  active ? "bg-accent" : "border border-divider bg-card-bg"
                }`}
              >
                {active && <span className="w-1 h-1 rounded-full bg-white" aria-hidden />}
              </span>
              {STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>

      <label className="block text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-2">
        Add a note
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional context for the team."
        rows={3}
        className="w-full bg-paper-warm border border-divider/60 rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-muted-light resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 mb-3"
      />

      <button
        onClick={save}
        className="w-full h-10 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent-dark transition-colors active:scale-[0.96]"
      >
        Save update
      </button>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-paper text-sm px-4 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
