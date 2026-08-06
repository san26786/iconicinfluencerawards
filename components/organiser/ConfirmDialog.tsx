'use client';

// Small reusable confirmation modal for destructive actions, replacing the
// browser confirm(). Renders nothing when `open` is false.

import { Loader2 } from 'lucide-react';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={busy ? undefined : onCancel}
      />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-ink p-6 shadow-2xl">
        <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
        <div className="mt-2 text-sm leading-relaxed text-white/70">{message}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:border-white/40 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
