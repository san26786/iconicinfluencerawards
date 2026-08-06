"use client";

// "View" button for a campaign recipient → opens a modal showing the exact
// email that was rendered for them (their snapshotted variables applied to the
// job template). The HTML renders inside a sandboxed iframe so email markup
// can't touch the dashboard.

import { useState } from "react";
import { Eye, Loader2, X } from "lucide-react";

export function RecipientPreview({
  jobId,
  recipientId,
  email,
}: {
  jobId: number;
  recipientId: number;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<{ subject: string; html: string } | null>(
    null,
  );

  const view = async () => {
    setOpen(true);
    if (data) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/organiser/email-jobs/${jobId}/preview?r=${recipientId}`,
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not load this email.");
      setData({ subject: j.subject ?? "", html: j.html ?? "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={view}
        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-semibold text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
      >
        <Eye className="h-3.5 w-3.5" /> View
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-ink/95 shadow-glass"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {data?.subject || "Email preview"}
                </p>
                <p className="truncate text-xs text-white/45">to {email}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gold" />
                </div>
              ) : error ? (
                <p className="p-6 text-sm text-red-300">{error}</p>
              ) : (
                <iframe
                  title={`Email to ${email}`}
                  srcDoc={data?.html ?? ""}
                  sandbox=""
                  className="h-[70vh] w-full border-0 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
