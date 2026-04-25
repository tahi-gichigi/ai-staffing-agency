"use client";

import { useState } from "react";

export function AcceptSuggestion({ id, assigneeName }: { id: string; assigneeName: string }) {
  const [accepted, setAccepted] = useState(false);
  void id;
  return (
    <button
      onClick={() => setAccepted(true)}
      disabled={accepted}
      className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12px] font-medium transition-[background-color,color,transform] duration-200 ${
        accepted
          ? "bg-accent-light text-accent cursor-default"
          : "bg-ink text-paper hover:bg-accent-dark active:scale-[0.96]"
      }`}
      aria-live="polite"
    >
      {accepted ? (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2.5 6.2L5 8.7L9.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Assigned to {assigneeName}
        </>
      ) : (
        <>
          Assign to {assigneeName}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2 6h7M5.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </>
      )}
    </button>
  );
}
