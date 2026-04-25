"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Bucket } from "../../_lib/data";

export function ActionBar({ returnBucket }: { returnBucket: Bucket }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  function act(label: string) {
    setToast(label);
    setTimeout(() => {
      router.push(`/demo/a/queue/${returnBucket}`);
    }, 900);
  }

  return (
    <>
      <div className="sticky bottom-4 z-20">
        <div className="bg-card-bg border border-divider rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-3 md:p-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <p className="text-xs text-muted px-1">Pick an action. You can undo for 10 seconds.</p>
          <div className="grid grid-cols-2 sm:flex gap-2">
            <ActionBtn kind="primary" onClick={() => act("Approved")}>
              Approve
            </ActionBtn>
            <ActionBtn onClick={() => act("Marked explained")}>Mark explained</ActionBtn>
            <ActionBtn onClick={() => act("Chase sent to client")}>Ask client</ActionBtn>
            <ActionBtn onClick={() => act("Assigned to Priya S.")}>Assign to junior</ActionBtn>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-paper text-sm px-4 py-2.5 rounded-full shadow-lg">
          {toast} · returning to queue
        </div>
      )}
    </>
  );
}

function ActionBtn({
  children,
  onClick,
  kind = "secondary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  kind?: "primary" | "secondary";
}) {
  const base = "h-10 px-4 rounded-full text-sm font-medium transition-colors whitespace-nowrap";
  const cls =
    kind === "primary"
      ? "bg-accent text-white hover:bg-accent-dark cta-btn"
      : "bg-paper-warm text-ink hover:bg-divider/60";
  return (
    <button onClick={onClick} className={`${base} ${cls}`}>
      {children}
    </button>
  );
}
