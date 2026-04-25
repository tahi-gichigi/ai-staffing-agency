"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DraftActions({ body }: { body: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function copy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(body).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      });
    }
  }

  function approve() {
    setToast("Approved. Queued for the assignee to send.");
    setTimeout(() => router.push("/demo/c/drafts"), 1200);
  }

  return (
    <>
      <div className="sticky bottom-4 z-20">
        <div className="bg-card-bg border border-divider rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <p className="text-xs text-muted px-1">Approve sends it through the assigned channel. The AI never sends on its own.</p>
            <div className="flex gap-2">
              <button
                onClick={copy}
                className="h-10 px-4 rounded-full bg-paper-warm text-ink text-sm font-medium hover:bg-divider/60 transition-colors inline-flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2.5 6.2L5 8.7L9.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>Copy text</>
                )}
              </button>
              <button
                onClick={approve}
                className="h-10 px-5 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-dark cta-btn transition-colors active:scale-[0.96]"
              >
                Approve to send
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
