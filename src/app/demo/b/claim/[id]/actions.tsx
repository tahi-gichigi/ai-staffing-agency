"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DecisionBar({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  function decide(action: "Approved" | "Rejected") {
    void claimId;
    setToast(`${action}. Decision recorded.`);
    setTimeout(() => {
      router.push("/demo/b");
    }, 1200);
  }

  return (
    <>
      <div className="sticky bottom-4 z-20">
        <div className="bg-card-bg border border-divider rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-3">Record your decision</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Decision note (e.g. 'Confirmed with client, posting as coded.')"
            rows={2}
            className="w-full bg-paper-warm border border-divider/60 rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted-light resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 mb-3"
          />
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <p className="text-xs text-muted px-1">This becomes the audit trail.</p>
            <div className="flex gap-2">
              <button
                onClick={() => decide("Approved")}
                className="h-10 px-5 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-dark cta-btn transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => decide("Rejected")}
                className="h-10 px-5 rounded-full bg-paper-warm text-ink text-sm font-medium hover:bg-divider/60 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-paper text-sm px-4 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
