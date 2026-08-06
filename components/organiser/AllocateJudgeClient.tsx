'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, X, Users, ChevronDown, AlertCircle } from 'lucide-react';

export type Nomination = {
  id: number;
  name: string;
  mobile: string | null;
  email: string | null;
  business: string | null;
  categories: string[];
  status: string;
  allocated: boolean;
};

const STATUS_STYLE: Record<string, string> = {
  finalist:     'bg-gold/15 text-gold border-gold/30',
  semifinalist: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  shortlisted:  'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'in progress':'bg-white/5 text-white/40 border-white/10',
};

const inputBase = 'rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40';

export function AllocateJudgeClient({
  judgeId,
  judgeName,
  nominations: initial,
  categories,
}: {
  judgeId: number;
  judgeName: string;
  nominations: Nomination[];
  categories: { label: string; value: string }[];
}) {
  const router = useRouter();
  const [noms, setNoms]           = useState(initial);
  const [category, setCategory]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected]   = useState<Set<number>>(new Set());
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const visible = useMemo(() => {
    let list = noms;
    if (category)     list = list.filter(n => n.categories.some(c => c === category));
    if (statusFilter) list = list.filter(n => n.status === statusFilter);
    return list;
  }, [noms, category, statusFilter]);

  const allVisibleIds  = visible.map(n => n.id);
  const allChecked     = allVisibleIds.length > 0 && allVisibleIds.every(id => selected.has(id));
  const someChecked    = allVisibleIds.some(id => selected.has(id));

  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev);
      if (allChecked) { allVisibleIds.forEach(id => next.delete(id)); }
      else            { allVisibleIds.forEach(id => next.add(id)); }
      return next;
    });
  }

  function toggle(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function allocate() {
    if (selected.size === 0) { setError('Select at least one applicant.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const ids = [...selected];
      const res  = await fetch('/api/organiser/judge-applicants/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judgeId, nominationIds: ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setNoms(prev => prev.map(n => ids.includes(n.id) ? { ...n, allocated: true } : n));
      setSelected(new Set());
      setSuccess(`${ids.length} applicant${ids.length !== 1 ? 's' : ''} allocated to ${judgeName}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  async function deallocate(nominationId: number) {
    try {
      await fetch('/api/organiser/judge-applicants/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judgeId, nominationIds: [nominationId] }),
      });
      setNoms(prev => prev.map(n => n.id === nominationId ? { ...n, allocated: false } : n));
    } catch {
      setError('Failed to remove allocation.');
    }
  }

  const allocatedCount   = noms.filter(n => n.allocated).length;
  const unallocatedCount = visible.filter(n => !n.allocated).length;

  return (
    <div className="mt-8">

      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Category filter */}
        <div className="flex-1 min-w-[220px]">
          <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-widest text-white/50">
            Award Category
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setSelected(new Set()); }}
              className={`${inputBase} w-full appearance-none pr-9`}
              style={{ colorScheme: 'dark' }}
            >
              <option value="">All categories ({noms.length})</option>
              {categories.map(c => {
                const count = noms.filter(n => n.categories.some(cat => cat === c.value)).length;
                return <option key={c.value} value={c.value}>{c.label} ({count})</option>;
              })}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          </div>
        </div>

        {/* Status filter */}
        <div className="min-w-[180px]">
          <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-widest text-white/50">
            Status
          </label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setSelected(new Set()); }}
              className={`${inputBase} w-full appearance-none pr-9`}
              style={{ colorScheme: 'dark' }}
            >
              <option value="">All statuses</option>
              {(['finalist', 'semifinalist', 'shortlisted', 'in progress'] as const).map(s => {
                const count = noms.filter(n => n.status === s).length;
                return <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)} ({count})</option>;
              })}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 pb-0.5 text-sm text-white/50">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-gold/60" />
            <strong className="text-white">{allocatedCount}</strong> allocated
          </span>
          <span className="text-white/20">|</span>
          <span><strong className="text-white">{unallocatedCount}</strong> unallocated{category ? ' in category' : ''}</span>
        </div>

        {/* Submit */}
        <button
          onClick={allocate}
          disabled={saving || selected.size === 0}
          className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-2.5 text-sm font-semibold text-ink shadow-gold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {saving ? 'Allocating…' : `Allocate${selected.size > 0 ? ` (${selected.size})` : ''}`}
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {success}
        </div>
      )}

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.03]">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded accent-gold"
                />
              </th>
              {['Full Name', 'Mobile', 'Email', 'Business', 'Category', 'Status', 'Allocated'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-white/40">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-white/35">
                  No nominations found{category ? ` in "${category}"` : ''}.
                </td>
              </tr>
            ) : visible.map(n => (
              <tr
                key={n.id}
                onClick={() => !n.allocated && toggle(n.id)}
                className={`transition-colors ${
                  n.allocated
                    ? 'bg-gold/[0.04]'
                    : selected.has(n.id)
                    ? 'bg-white/[0.06] cursor-pointer'
                    : 'hover:bg-white/[0.03] cursor-pointer'
                }`}
              >
                <td className="px-4 py-3">
                  {n.allocated ? (
                    <CheckCircle2 className="h-4 w-4 text-gold" />
                  ) : (
                    <input
                      type="checkbox"
                      checked={selected.has(n.id)}
                      onChange={() => toggle(n.id)}
                      onClick={e => e.stopPropagation()}
                      className="h-4 w-4 rounded accent-gold"
                    />
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-white">{n.name}</td>
                <td className="px-4 py-3 text-white/60">{n.mobile ?? '—'}</td>
                <td className="px-4 py-3 text-white/60">{n.email ?? '—'}</td>
                <td className="px-4 py-3 text-white/70">{n.business ?? '—'}</td>
                <td className="px-4 py-3">
                  {n.categories.length > 0 ? (
                    <span className="inline-block max-w-[160px] truncate text-xs text-white/60">
                      {n.categories[0]}{n.categories.length > 1 ? ` +${n.categories.length - 1}` : ''}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[0.6rem] font-semibold capitalize ${STATUS_STYLE[n.status] ?? STATUS_STYLE['in progress']}`}>
                    {n.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {n.allocated ? (
                    <button
                      onClick={e => { e.stopPropagation(); deallocate(n.id); }}
                      title="Remove allocation"
                      className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[0.6rem] font-semibold text-red-300 hover:bg-red-500/20"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  ) : (
                    <span className="text-xs text-white/25">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-white/30">
        Gold rows are already allocated to {judgeName}. Check boxes to select, then click Allocate.
      </p>
    </div>
  );
}
