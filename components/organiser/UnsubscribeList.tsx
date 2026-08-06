'use client';

import { useState } from 'react';
import { Ban, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/organiser/ConfirmDialog';

export type SuppressionRow = {
  id: number;
  email: string;
  reason: string;
  created_at: Date | string;
  job_id: number | null;
  job_name: string | null;
};

const fmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function UnsubscribeList({ initialRows }: { initialRows: SuppressionRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  const add = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    setBusy('add');
    setToast(null);
    try {
      const res = await fetch('/api/organiser/unsubscribes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ ok: false, msg: data.error || 'Could not add that email.' });
        return;
      }
      const next = data.suppression as SuppressionRow;
      setRows((current) => [next, ...current.filter((r) => r.email !== next.email)]);
      setEmail('');
      setToast({ ok: true, msg: `${next.email} is now blocked.` });
    } finally {
      setBusy(null);
    }
  };

  const remove = async (target: string) => {
    setBusy(target);
    setToast(null);
    try {
      const res = await fetch('/api/organiser/unsubscribes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target }),
      });
      if (!res.ok) {
        setToast({ ok: false, msg: 'Could not remove that email.' });
        return;
      }
      setRows((current) => current.filter((r) => r.email !== target));
      setToast({ ok: true, msg: `${target} can receive emails again.` });
    } finally {
      setBusy(null);
      setPendingRemove(null);
    }
  };

  return (
    <div className="mt-8 space-y-5">
      {toast && (
        <div
          className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
            toast.ok ? 'border-gold/30 bg-gold/[0.06] text-white/85' : 'border-red-500/30 bg-red-500/10 text-red-200'
          }`}
        >
          {toast.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" /> : <Ban className="mt-0.5 h-4 w-4 flex-shrink-0" />}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="rounded-3xl glass p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-white">Add an email</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add();
            }}
            placeholder="name@example.com"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-gold/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={add}
            disabled={busy === 'add' || !email.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-5 py-3 text-sm font-semibold text-ink shadow-gold disabled:opacity-60"
          >
            {busy === 'add' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Block email
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl glass">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[0.65rem] uppercase tracking-wider text-white/45">
                <th className="px-5 py-4 font-semibold">Email</th>
                <th className="px-5 py-4 font-semibold">Reason</th>
                <th className="px-5 py-4 font-semibold">Source job</th>
                <th className="px-5 py-4 font-semibold">Added</th>
                <th className="px-5 py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.email} className="border-b border-white/[0.06] last:border-0">
                  <td className="px-5 py-3 font-medium text-white/85">{r.email}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-xs font-semibold text-white/65">
                      {r.reason}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white/55">
                    {r.job_id ? `#${r.job_id}${r.job_name ? ` - ${r.job_name}` : ''}` : '-'}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-white/55">{fmt.format(new Date(r.created_at))}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setPendingRemove(r.email)}
                      disabled={busy === r.email}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-60"
                    >
                      {busy === r.email ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-white/50">
                    No emails are currently blocked.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmDialog
        open={pendingRemove !== null}
        title="Allow emails again?"
        message={<><strong className="text-white">{pendingRemove}</strong> will be removed from the unsubscribe list and can receive future emails.</>}
        confirmLabel="Remove block"
        busy={pendingRemove !== null && busy === pendingRemove}
        onConfirm={() => pendingRemove && remove(pendingRemove)}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}
