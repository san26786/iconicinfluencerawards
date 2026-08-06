'use client';

import { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, ChevronDown, ChevronUp, ChevronsUpDown,
  ChevronLeft, ChevronRight, Loader2, Check,
  Plus, X, UserCheck, BarChart2, LayoutList,
  Mail, Trash2,
} from 'lucide-react';
export type JudgeAllocation = {
  id: number;
  category_id: string;
  category_name: string;
  judge_id: number;
  judge_name: string;
  business: string | null;
  judge_email: string;
  scored_count: number;
  unscored_count: number;
};

type Category      = { id: string; name: string };
type Judge         = { id: number; name: string; email: string; company: string | null };
type EmailTemplate = { id: number; name: string };
type SortKey       = 'category_name' | 'judge_name' | 'business' | 'scored_count' | 'unscored_count';
type SortDir       = 'asc' | 'desc';

const PAGE_SIZES = [10, 25, 50];
const ACTIONS    = ['Remove from Category'];

/* ─── Custom Dropdown ────────────────────────────────────────────────────── */
function CustomDropdown({
  value, onChange, options, placeholder, minWidth = 'min-w-44',
}: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string; minWidth?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function h(e: MouseEvent) {
      const t = e.target as Node;
      if (ref.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  function toggle() {
    if (open) { setOpen(false); return; }
    const rect = btnRef.current!.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    setOpen(true);
  }

  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} className={`relative ${minWidth}`}>
      <button ref={btnRef} type="button" onClick={toggle}
        className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm transition-colors hover:border-gold/30">
        <span className={selected ? 'text-white' : 'text-white/40'}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && mounted && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] rounded-2xl border border-white/10 bg-[#1a1a2e] shadow-2xl overflow-hidden"
          style={{ top: pos.top, left: pos.left, minWidth: pos.width }}
        >
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
              className={`w-full rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${!value ? 'bg-gold/15 text-gold' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
              {placeholder}
            </button>
            {options.map(o => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${value === o.value ? 'bg-gold/15 text-gold' : 'text-white/65 hover:bg-white/5 hover:text-white'}`}>
                {value === o.value && <Check className="h-3 w-3 flex-shrink-0" />}
                {o.label}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

/* ─── Action Panel (inline, expands within the row) ──────────────────────── */
function ActionPanel({ row, onRemove, onClose }: {
  row: JudgeAllocation; onRemove: (id: number) => void; onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`Delete ${row.judge_name} from "${row.category_name}"?`)) return;
    setBusy(true);
    await fetch('/api/organiser/judge-categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judgeId: row.judge_id, categoryId: row.category_id }),
    });
    onRemove(row.id);
    setBusy(false);
  }

  const cls = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button onClick={remove} disabled={busy}
        className={`${cls} text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40`}>
        <Trash2 className="h-3.5 w-3.5 opacity-70" /> Delete
      </button>
      <button onClick={onClose}
        className={`${cls} text-white/65 hover:bg-white/5 hover:text-white`}>
        <Plus className="h-3.5 w-3.5 opacity-70" /> Allocate Applicant
      </button>
      <button onClick={onClose}
        className={`${cls} text-white/65 hover:bg-white/5 hover:text-white`}>
        <BarChart2 className="h-3.5 w-3.5 opacity-70" /> View Judging Score
      </button>
      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />}
    </div>
  );
}

/* ─── Allocate Modal ─────────────────────────────────────────────────────── */
function AllocateModal({
  allCategories, approvedJudges, existing,
  onClose, onAllocated,
}: {
  allCategories: Category[]; approvedJudges: Judge[];
  existing: JudgeAllocation[];
  onClose: () => void;
  onAllocated: (row: JudgeAllocation) => void;
}) {
  const [categoryId, setCategoryId] = useState('');
  const [judgeId, setJudgeId]       = useState('');
  const [busy, setBusy]             = useState(false);
  const [error, setError]           = useState('');

  const alreadyInCategory = new Set(
    existing.filter(r => r.category_id === categoryId).map(r => r.judge_id),
  );
  const availableJudges = approvedJudges.filter(j => !alreadyInCategory.has(j.id));

  async function submit() {
    if (!categoryId || !judgeId) { setError('Please select both a category and a judge.'); return; }
    setBusy(true);
    setError('');
    const res = await fetch('/api/organiser/judge-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judgeId: Number(judgeId), categoryId }),
    });
    if (!res.ok) { setError('Failed to allocate. They may already be assigned.'); setBusy(false); return; }
    const cat   = allCategories.find(c => c.id === categoryId)!;
    const judge = approvedJudges.find(j => j.id === Number(judgeId))!;
    onAllocated({
      id: Date.now(),
      category_id:    categoryId,
      category_name:  cat.name,
      judge_id:       judge.id,
      judge_name:     judge.name,
      business:       judge.company,
      judge_email:    judge.email,
      scored_count:   0,
      unscored_count: 0,
    });
    onClose();
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#16161e] shadow-2xl p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">Allocate a Judge</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-white/50">Category</label>
            <CustomDropdown
              value={categoryId} onChange={v => { setCategoryId(v); setJudgeId(''); }}
              options={allCategories.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select a category" minWidth="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-white/50">Judge</label>
            <CustomDropdown
              value={judgeId} onChange={setJudgeId}
              options={availableJudges.map(j => ({ value: String(j.id), label: `${j.name} (${j.email})` }))}
              placeholder={categoryId ? 'Select a judge' : 'Select a category first'}
              minWidth="w-full"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={submit} disabled={busy || !categoryId || !judgeId}
            className="flex-1 rounded-full bg-gold-gradient py-2.5 text-sm font-semibold text-ink disabled:opacity-40 flex items-center justify-center gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Allocate
          </button>
          <button onClick={onClose}
            className="flex-1 rounded-full border border-white/10 py-2.5 text-sm font-semibold text-white/60 hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sort Icon ──────────────────────────────────────────────────────────── */
function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="h-3 w-3 text-white/20" />;
  return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-gold" /> : <ChevronDown className="h-3 w-3 text-gold" />;
}

/* ─── Main Client Component ──────────────────────────────────────────────── */
export function CategoryJudgesClient({
  allocations: initial, allCategories, approvedJudges, emailTemplates,
}: {
  allocations: JudgeAllocation[];
  allCategories: Category[];
  approvedJudges: Judge[];
  emailTemplates: EmailTemplate[];
}) {
  const [allocations, setAllocations] = useState(initial);
  const [showModal, setShowModal]     = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [judgeFilter, setJudgeFilter]       = useState('');
  const [emailTemplate, setEmailTemplate]   = useState('');
  const [bulkAction, setBulkAction]         = useState('');
  const [search, setSearch]                 = useState('');
  const [selected, setSelected]             = useState<Set<number>>(new Set());
  const [sortKey, setSortKey]               = useState<SortKey>('category_name');
  const [sortDir, setSortDir]               = useState<SortDir>('asc');
  const [page, setPage]                     = useState(1);
  const [pageSize, setPageSize]             = useState(10);
  const [expandedId, setExpandedId]         = useState<number | null>(null);

  const stats = useMemo(() => ({
    categories: new Set(allocations.map(r => r.category_id)).size,
    judges:     new Set(allocations.map(r => r.judge_id)).size,
  }), [allocations]);

  const uniqueCategories = useMemo(() =>
    Array.from(new Set(allocations.map(r => r.category_id)))
      .map(id => ({ value: id, label: allocations.find(r => r.category_id === id)!.category_name }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [allocations]);

  const uniqueJudges = useMemo(() =>
    Array.from(new Set(allocations.map(r => r.judge_id)))
      .map(id => { const r = allocations.find(a => a.judge_id === id)!; return { value: String(id), label: r.judge_name }; })
      .sort((a, b) => a.label.localeCompare(b.label)),
    [allocations]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allocations
      .filter(r => !categoryFilter || r.category_id === categoryFilter)
      .filter(r => !judgeFilter    || r.judge_id === Number(judgeFilter))
      .filter(r => !q || r.category_name.toLowerCase().includes(q)
        || r.judge_name.toLowerCase().includes(q)
        || (r.business ?? '').toLowerCase().includes(q)
        || r.judge_email.toLowerCase().includes(q))
      .sort((a, b) => {
        let av: string | number = '', bv: string | number = '';
        if (sortKey === 'category_name')   { av = a.category_name;    bv = b.category_name; }
        if (sortKey === 'judge_name')      { av = a.judge_name;        bv = b.judge_name; }
        if (sortKey === 'business')        { av = a.business ?? '';    bv = b.business ?? ''; }
        if (sortKey === 'scored_count')    { av = a.scored_count;      bv = b.scored_count; }
        if (sortKey === 'unscored_count')  { av = a.unscored_count;    bv = b.unscored_count; }
        if (typeof av === 'number') return sortDir === 'asc' ? av - (bv as number) : (bv as number) - av;
        return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
  }, [allocations, categoryFilter, judgeFilter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allOnPage  = paginated.length > 0 && paginated.every(r => selected.has(r.id));

  function handleRemove(id: number) {
    setAllocations(prev => prev.filter(r => r.id !== id));
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
  }

  function handleAllocated(row: JudgeAllocation) {
    setAllocations(prev => [...prev, row]);
  }

  const Th = ({ label, col }: { label: string; col: SortKey }) => (
    <th className="cursor-pointer px-4 py-3.5 text-left text-[0.6rem] font-semibold uppercase tracking-widest text-white/35 hover:text-white/60 select-none whitespace-nowrap"
      onClick={() => toggleSort(col)}>
      <span className="inline-flex items-center gap-1">{label} <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} /></span>
    </th>
  );

  return (
    <div className="space-y-5">

      {/* Stats + action buttons */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-3">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-orange-500/80 px-6 py-3 min-w-[90px]">
            <LayoutList className="h-4 w-4 text-white/70 mb-1" />
            <span className="text-xl font-bold text-white">{stats.categories}</span>
            <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-white/70">Categories</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-yellow-700/80 px-6 py-3 min-w-[90px]">
            <UserCheck className="h-4 w-4 text-white/70 mb-1" />
            <span className="text-xl font-bold text-white">{stats.judges}</span>
            <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-white/70">Judges</span>
          </div>
        </div>

        <div className="flex gap-2 ml-auto">
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink hover:-translate-y-0.5 transition-all">
            <Plus className="h-4 w-4" /> Allocate a Judge
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-white/60 hover:text-white hover:border-gold/30 transition-colors">
            <BarChart2 className="h-4 w-4" /> View Judges Score
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 items-center">
        <CustomDropdown
          value={categoryFilter} onChange={v => { setCategoryFilter(v); setPage(1); }}
          options={uniqueCategories} placeholder="Select Category" minWidth="min-w-52"
        />
        <CustomDropdown
          value={judgeFilter} onChange={v => { setJudgeFilter(v); setPage(1); }}
          options={uniqueJudges} placeholder="Select Judge" minWidth="min-w-48"
        />

        <div className="flex items-center gap-2 ml-auto text-xs text-white/40">
          <span>{filtered.length} found</span>
          {filtered.length > 0 && (
            <span>· Page {page} of {totalPages}</span>
          )}
        </div>
      </div>

      {/* Email + bulk toolbar */}
      <div className="rounded-2xl glass p-4 flex flex-wrap gap-3 items-center">
        <CustomDropdown
          value={emailTemplate} onChange={setEmailTemplate}
          options={emailTemplates.map(t => ({ value: String(t.id), label: t.name }))}
          placeholder="Select an Email Template" minWidth="min-w-52"
        />
        <button disabled={selected.size === 0 || !emailTemplate}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/60 hover:text-white hover:border-gold/30 transition-colors disabled:opacity-40">
          <Mail className="h-4 w-4" /> Send Mail {selected.size > 0 && `(${selected.size})`}
        </button>

        <div className="h-6 w-px bg-white/10 hidden sm:block" />

        <CustomDropdown
          value={bulkAction} onChange={setBulkAction}
          options={ACTIONS.map(a => ({ value: a, label: a }))}
          placeholder="Select an Action" minWidth="min-w-44"
        />
        <button disabled={!bulkAction || selected.size === 0}
          className="rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-40 hover:-translate-y-0.5 transition-all">
          Submit
        </button>

        <div className="relative ml-auto flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none"
            placeholder="Search name, category, business…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-3.5 w-10">
                  <input type="checkbox" checked={allOnPage}
                    onChange={() => {
                      if (allOnPage) setSelected(prev => { const s = new Set(prev); paginated.forEach(r => s.delete(r.id)); return s; });
                      else setSelected(prev => { const s = new Set(prev); paginated.forEach(r => s.add(r.id)); return s; });
                    }}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-gold cursor-pointer" />
                </th>
                <Th label="Category Title"       col="category_name" />
                <Th label="Full Name"            col="judge_name" />
                <Th label="Business"             col="business" />
                <Th label="Scored Candidates"    col="scored_count" />
                <Th label="Unscored Candidates"  col="unscored_count" />
                <th className="px-4 py-3.5 text-left text-[0.6rem] font-semibold uppercase tracking-widest text-white/35 whitespace-nowrap">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.map(r => {
                const isExpanded = expandedId === r.id;
                return (
                <Fragment key={r.id}>
                <tr className={`transition-colors hover:bg-white/[0.025] ${selected.has(r.id) ? 'bg-gold/5' : ''} ${isExpanded ? 'bg-white/[0.03]' : ''}`}>
                  <td className="px-4 py-3.5">
                    <input type="checkbox" checked={selected.has(r.id)}
                      onChange={() => setSelected(prev => { const s = new Set(prev); s.has(r.id) ? s.delete(r.id) : s.add(r.id); return s; })}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 accent-gold cursor-pointer" />
                  </td>
                  <td className="px-4 py-3.5 font-medium text-white whitespace-nowrap">{r.category_name}</td>
                  <td className="px-4 py-3.5 text-white/80 whitespace-nowrap">{r.judge_name}</td>
                  <td className="px-4 py-3.5 text-white/50 text-xs whitespace-nowrap">{r.business || '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className={`font-semibold text-sm ${r.scored_count > 0 ? 'text-emerald-400' : 'text-white/25'}`}>
                      {r.scored_count}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`font-semibold text-sm ${r.unscored_count > 0 ? 'text-amber-400' : 'text-white/25'}`}>
                      {r.unscored_count}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => setExpandedId(id => id === r.id ? null : r.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isExpanded ? 'border-gold/40 text-gold bg-gold/10' : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-gold/30 hover:text-gold'
                      }`}
                    >
                      Action
                      <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-white/[0.03]">
                    <td colSpan={7} className="px-4 py-3">
                      <ActionPanel row={r} onRemove={handleRemove} onClose={() => setExpandedId(null)} />
                    </td>
                  </tr>
                )}
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-white/30">
              {allocations.length === 0
                ? 'No judges allocated yet. Click "Allocate a Judge" to get started.'
                : 'No allocations match your filters.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-white/8 px-5 py-3.5 flex-wrap gap-3">
            <div className="flex items-center gap-3 text-xs text-white/35">
              <span>
                Results {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <span>Rows</span>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="rounded-lg border border-white/10 bg-ink/80 px-2 py-1 text-xs text-white/60 focus:outline-none">
                  {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-lg border border-white/10 p-1.5 text-white/40 hover:text-white disabled:opacity-25">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pg = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`min-w-[2rem] rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                      pg === page ? 'border-gold bg-gold/15 text-gold' : 'border-white/10 text-white/40 hover:text-white'
                    }`}>{pg}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="rounded-lg border border-white/10 p-1.5 text-white/40 hover:text-white disabled:opacity-25">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Allocate Modal */}
      {showModal && (
        <AllocateModal
          allCategories={allCategories}
          approvedJudges={approvedJudges}
          existing={allocations}
          onClose={() => setShowModal(false)}
          onAllocated={handleAllocated}
        />
      )}
    </div>
  );
}
