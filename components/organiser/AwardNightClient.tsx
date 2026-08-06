'use client';

import { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import {
  Star, Trophy, Medal, Loader2, Search,
  ChevronDown, ChevronUp, ChevronsUpDown,
  Check, Mail, BarChart2, ChevronLeft, ChevronRight,
  Pencil, Eye, Trash2, MessageSquarePlus, MessageCircle,
  MailOpen, Calendar, Send, UserX, Building2, UserCheck,
} from 'lucide-react';

type EmailTemplate = { id: number; name: string };

type Nomination = {
  id: number;
  nomineeName: string;
  nomineeEmail: string | null;
  businessName: string | null;
  categories: string[];
  avgScore: number | null;
  isShortlisted: boolean;
  isSemifinalist: boolean;
  isFinalist: boolean;
  judgesScored: number;
};

type Flags = { isShortlisted: boolean; isSemifinalist: boolean; isFinalist: boolean };
type SortKey = 'nomineeName' | 'businessName' | 'avgScore' | 'judgesScored';
type SortDir = 'asc' | 'desc';

const PAGE_SIZES = [10, 25, 50];

const STATUS_FILTERS = [
  { key: 'all',          label: 'All' },
  { key: 'shortlisted',  label: 'Shortlisted' },
  { key: 'semifinalist', label: 'Semi-finalist' },
  { key: 'finalist',     label: 'Finalist' },
  { key: 'no_score',     label: 'No Score' },
];

const ACTIONS = [
  'Mark as Shortlisted',
  'Mark as Semi-finalist',
  'Mark as Finalist',
  'Remove Shortlist',
  'Remove Semi-finalist',
  'Remove Finalist',
];

function CustomDropdown({
  value, onChange, options, placeholder, minWidth = 'min-w-44',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  minWidth?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      const t = e.target as Node;
      if (ref.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onClickOut);
    return () => document.removeEventListener('mousedown', onClickOut);
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
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/70 hover:border-gold/30 hover:text-white transition-colors"
      >
        <span className={selected ? 'text-white' : 'text-white/40'}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && mounted && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] rounded-2xl border border-white/10 bg-[#1a1a2e] shadow-2xl overflow-hidden"
          style={{ top: pos.top, left: pos.left, minWidth: pos.width }}
        >
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className={`w-full rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
                !value ? 'bg-gold/15 text-gold' : 'text-white/40 hover:bg-white/5 hover:text-white'
              }`}
            >
              {placeholder}
            </button>
            {options.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
                  value === o.value ? 'bg-gold/15 text-gold' : 'text-white/65 hover:bg-white/5 hover:text-white'
                }`}
              >
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

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`flex flex-col items-center rounded-2xl px-4 py-3 min-w-[90px] ${color}`}>
      <span className="text-xl font-bold text-white">{value}</span>
      <span className="mt-0.5 text-center text-[0.6rem] font-semibold uppercase tracking-wide text-white/70 leading-tight">{label}</span>
    </div>
  );
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="h-3 w-3 text-white/20" />;
  return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-gold" /> : <ChevronDown className="h-3 w-3 text-gold" />;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-xs text-white/25">—</span>;
  const cls = score >= 8 ? 'text-green-300 bg-green-500/15' : score >= 5 ? 'text-gold bg-gold/10' : 'text-white/50 bg-white/5';
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>{score.toFixed(1)}</span>;
}

function StatusBadge({ nom }: { nom: Nomination }) {
  if (nom.isFinalist)     return <span className="rounded-full bg-gold/15 border border-gold/25 px-2.5 py-0.5 text-[0.65rem] font-semibold text-gold">Finalist</span>;
  if (nom.isSemifinalist) return <span className="rounded-full bg-purple-500/15 border border-purple-500/25 px-2.5 py-0.5 text-[0.65rem] font-semibold text-purple-300">Semi-finalist</span>;
  if (nom.isShortlisted)  return <span className="rounded-full bg-green-500/15 border border-green-500/25 px-2.5 py-0.5 text-[0.65rem] font-semibold text-green-300">Shortlisted</span>;
  return <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[0.65rem] font-semibold text-white/40">Nominated</span>;
}

// Inline action panel — rendered in an expanded row directly beneath the
// record whose Action button was clicked. All options appear in that row.
function ActionPanel({ nom, onUpdate, onDelete, onClose }: {
  nom: Nomination;
  onUpdate: (id: number, flags: Flags) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function toggleFlag(field: keyof Flags) {
    setBusy(true);
    const next: Flags = {
      isShortlisted:  nom.isShortlisted,
      isSemifinalist: nom.isSemifinalist,
      isFinalist:     nom.isFinalist,
    };
    next[field] = !next[field];
    try {
      await fetch(`/api/organiser/nominations/${nom.id}/flags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      onUpdate(nom.id, next);
    } catch { /* silent */ }
    setBusy(false);
  }

  async function handleDelete() {
    if (!confirm('Delete this nomination? This cannot be undone.')) return;
    setBusy(true);
    try {
      await fetch(`/api/organiser/nominations/${nom.id}`, { method: 'DELETE' });
      onDelete(nom.id);
    } catch { /* silent */ }
    setBusy(false);
  }

  function Item({
    icon: Icon, label, onClick, href, danger, active,
  }: {
    icon: React.ElementType; label: string; onClick?: () => void;
    href?: string; danger?: boolean; active?: boolean;
  }) {
    const cls = `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
      danger  ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' :
      active  ? 'bg-gold/15 text-gold' :
                'text-white/65 hover:bg-white/5 hover:text-white'
    }`;
    if (href) return (
      <a href={href} className={cls}>
        <Icon className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />{label}
      </a>
    );
    return (
      <button type="button" onClick={onClick} disabled={busy} className={`${cls} disabled:opacity-40`}>
        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${active ? '' : 'opacity-70'}`} />{label}
      </button>
    );
  }

  const VDivider = () => <span className="h-4 w-px bg-white/10 flex-shrink-0" />;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Navigation */}
      <Item icon={Pencil}  label="Edit" href={`/organiser/nominations/${nom.id}/edit`} />
      <Item icon={Eye}     label="View" href={`/organiser/nominations/${nom.id}`} />
      <Item icon={Trash2}  label="Delete" onClick={handleDelete} danger />

      <VDivider />

      {/* Status toggles */}
      <Item icon={nom.isShortlisted  ? Check : Star}   label={nom.isShortlisted  ? 'Remove Shortlist'     : 'Shortlist'}     onClick={() => toggleFlag('isShortlisted')}  active={nom.isShortlisted} />
      <Item icon={nom.isSemifinalist ? Check : Medal}  label={nom.isSemifinalist ? 'Remove Semi-finalist' : 'Semi-finalist'}  onClick={() => toggleFlag('isSemifinalist')} active={nom.isSemifinalist} />
      <Item icon={nom.isFinalist     ? Check : Trophy} label={nom.isFinalist     ? 'Remove Finalist'      : 'Finalist'}       onClick={() => toggleFlag('isFinalist')}     active={nom.isFinalist} />

      <VDivider />

      {/* Communication */}
      <Item icon={MessageSquarePlus} label="Add Comment"       onClick={onClose} />
      <Item icon={MessageCircle}     label="View All Comments" onClick={onClose} />
      <Item icon={MailOpen}          label="View Email Trail"  onClick={onClose} />
      <Item icon={Calendar}          label="Book Schedule"     onClick={onClose} />
      <Item icon={Send}              label="Send Custom Mail"  onClick={onClose} />

      <VDivider />

      {/* Account actions */}
      <Item icon={UserX}     label="Unlink User Account" onClick={onClose} />
      <Item icon={Building2} label="Unlink Business"     onClick={onClose} />
      <Item icon={UserCheck} label="Send Registration"   onClick={onClose} />

      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-gold flex-shrink-0" />}
    </div>
  );
}

export function AwardNightClient({ nominations: initial, emailTemplates = [] }: { nominations: Nomination[]; emailTemplates?: EmailTemplate[] }) {
  const [nominations, setNominations] = useState(initial);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch]               = useState('');
  const [sortKey, setSortKey]             = useState<SortKey>('nomineeName');
  const [sortDir, setSortDir]             = useState<SortDir>('asc');
  const [selected, setSelected]           = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction]       = useState('');
  const [emailTemplate, setEmailTemplate] = useState('');
  const [page, setPage]                   = useState(1);
  const [pageSize, setPageSize]           = useState(25);
  const [expandedId, setExpandedId]       = useState<number | null>(null);

  // All unique categories
  const allCategories = useMemo(() => {
    const set = new Set(nominations.flatMap(n => n.categories));
    return Array.from(set).sort();
  }, [nominations]);

  // Stats
  const stats = useMemo(() => ({
    total:        nominations.length,
    withEmail:    nominations.filter(n => n.nomineeEmail).length,
    noEmail:      nominations.filter(n => !n.nomineeEmail).length,
    shortlisted:  nominations.filter(n => n.isShortlisted).length,
    semifinal:    nominations.filter(n => n.isSemifinalist).length,
    finalist:     nominations.filter(n => n.isFinalist).length,
    withScore:    nominations.filter(n => n.avgScore != null).length,
    noScore:      nominations.filter(n => n.avgScore == null).length,
    avgScoreAll:  nominations.length ? (nominations.reduce((s, n) => s + (n.avgScore ?? 0), 0) / nominations.length).toFixed(1) : '—',
  }), [nominations]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  }

  function handleUpdate(id: number, flags: Flags) {
    setNominations(prev => prev.map(n => n.id === id ? { ...n, ...flags } : n));
  }

  function handleDelete(id: number) {
    setNominations(prev => prev.filter(n => n.id !== id));
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return nominations
      .filter(n => {
        if (statusFilter === 'shortlisted')  return n.isShortlisted;
        if (statusFilter === 'semifinalist') return n.isSemifinalist;
        if (statusFilter === 'finalist')     return n.isFinalist;
        if (statusFilter === 'no_score')     return n.avgScore == null;
        return true;
      })
      .filter(n => categoryFilter === 'all' || n.categories.includes(categoryFilter))
      .filter(n => !q || n.nomineeName.toLowerCase().includes(q)
        || n.nomineeEmail?.toLowerCase().includes(q)
        || n.businessName?.toLowerCase().includes(q))
      .sort((a, b) => {
        let av: string | number = '', bv: string | number = '';
        if (sortKey === 'nomineeName')   { av = a.nomineeName;    bv = b.nomineeName; }
        if (sortKey === 'businessName')  { av = a.businessName ?? ''; bv = b.businessName ?? ''; }
        if (sortKey === 'avgScore')      { av = a.avgScore ?? -1; bv = b.avgScore ?? -1; }
        if (sortKey === 'judgesScored')  { av = a.judgesScored;   bv = b.judgesScored; }
        if (typeof av === 'number') return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
        return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
  }, [nominations, statusFilter, categoryFilter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allOnPage  = paginated.length > 0 && paginated.every(n => selected.has(n.id));

  const Th = ({ label, col }: { label: string; col: SortKey }) => (
    <th className="cursor-pointer px-4 py-3 text-left text-[0.6rem] font-semibold uppercase tracking-widest text-white/35 hover:text-white/60 select-none whitespace-nowrap"
      onClick={() => toggleSort(col)}>
      <span className="inline-flex items-center gap-1">{label} <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} /></span>
    </th>
  );

  return (
    <div className="space-y-5">

      {/* Stats row */}
      <div className="flex flex-wrap gap-2">
        <StatCard label="Total Nominations"  value={stats.total}       color="bg-green-600/80" />
        <StatCard label="With Email"         value={stats.withEmail}   color="bg-purple-600/80" />
        <StatCard label="No Email"           value={stats.noEmail}     color="bg-red-700/80" />
        <StatCard label="Shortlisted"        value={stats.shortlisted} color="bg-emerald-600/80" />
        <StatCard label="Semi-finalists"     value={stats.semifinal}   color="bg-indigo-600/80" />
        <StatCard label="Finalists"          value={stats.finalist}    color="bg-amber-600/80" />
        <StatCard label="With Score"         value={stats.withScore}   color="bg-teal-600/80" />
        <StatCard label="No Score"           value={stats.noScore}     color="bg-rose-700/80" />
        <div className="inline-flex items-center gap-2 rounded-2xl bg-white/[0.06] px-4 py-3 min-w-[90px]">
          <BarChart2 className="h-4 w-4 text-gold" />
          <div>
            <p className="text-lg font-bold text-white">{stats.avgScoreAll}</p>
            <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-white/50">Avg Score</p>
          </div>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(f => {
          const count = f.key === 'all' ? nominations.length
            : f.key === 'shortlisted'  ? stats.shortlisted
            : f.key === 'semifinalist' ? stats.semifinal
            : f.key === 'finalist'     ? stats.finalist
            : stats.noScore;
          const active = statusFilter === f.key;
          return (
            <button key={f.key} onClick={() => { setStatusFilter(f.key); setPage(1); }}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                active ? 'bg-gold-gradient text-ink shadow-gold-sm' : 'glass text-white/55 hover:text-white'
              }`}>
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl glass p-4 flex flex-wrap gap-3 items-center">
        {/* Category filter */}
        <CustomDropdown
          value={categoryFilter === 'all' ? '' : categoryFilter}
          onChange={v => { setCategoryFilter(v || 'all'); setPage(1); }}
          options={allCategories.map(c => ({ value: c, label: c }))}
          placeholder="Select Category"
          minWidth="min-w-48"
        />

        <div className="h-6 w-px bg-white/10 hidden sm:block" />

        {/* Email template + send */}
        <CustomDropdown
          value={emailTemplate}
          onChange={setEmailTemplate}
          options={emailTemplates.map(t => ({ value: String(t.id), label: t.name }))}
          placeholder="Select an Email Template"
          minWidth="min-w-52"
        />
        <button disabled={selected.size === 0 || !emailTemplate}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/60 hover:text-white hover:border-gold/30 transition-colors disabled:opacity-40">
          <Mail className="h-4 w-4" /> Send Mail {selected.size > 0 && `(${selected.size})`}
        </button>

        <div className="h-6 w-px bg-white/10 hidden sm:block" />

        {/* Bulk action */}
        <div className="relative">
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} disabled={selected.size === 0}
            className="appearance-none rounded-xl border border-white/10 bg-ink/80 pl-4 pr-8 py-2.5 text-sm text-white/70 focus:border-gold/40 focus:outline-none min-w-44 disabled:opacity-40">
            <option value="">Select an Action</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        </div>
        <button disabled={!bulkAction || selected.size === 0}
          className="rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all">
          Submit
        </button>

        {/* Search */}
        <div className="relative ml-auto flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none"
            placeholder="Search name, email, business…"
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
                      if (allOnPage) setSelected(prev => { const s = new Set(prev); paginated.forEach(n => s.delete(n.id)); return s; });
                      else setSelected(prev => { const s = new Set(prev); paginated.forEach(n => s.add(n.id)); return s; });
                    }}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-gold cursor-pointer" />
                </th>
                <Th label="Name" col="nomineeName" />
                <th className="px-4 py-3.5 text-left text-[0.6rem] font-semibold uppercase tracking-widest text-white/35 whitespace-nowrap">Email</th>
                <Th label="Business" col="businessName" />
                <th className="px-4 py-3.5 text-left text-[0.6rem] font-semibold uppercase tracking-widest text-white/35 whitespace-nowrap">Categories</th>
                <Th label="Avg Score" col="avgScore" />
                <Th label="Judges" col="judgesScored" />
                <th className="px-4 py-3.5 text-left text-[0.6rem] font-semibold uppercase tracking-widest text-white/35 whitespace-nowrap">Status</th>
                <th className="px-4 py-3.5 text-left text-[0.6rem] font-semibold uppercase tracking-widest text-white/35 whitespace-nowrap">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.map(n => {
                const isExpanded = expandedId === n.id;
                const rowBorder = n.isFinalist ? 'border-l-2 border-gold' : n.isSemifinalist ? 'border-l-2 border-purple-400/50' : n.isShortlisted ? 'border-l-2 border-green-400/50' : '';
                return (
                <Fragment key={n.id}>
                <tr className={`transition-colors hover:bg-white/[0.025] ${selected.has(n.id) ? 'bg-gold/5' : ''} ${isExpanded ? 'bg-white/[0.03]' : ''} ${rowBorder}`}>
                  <td className="px-4 py-3.5">
                    <input type="checkbox" checked={selected.has(n.id)}
                      onChange={() => setSelected(prev => { const s = new Set(prev); s.has(n.id) ? s.delete(n.id) : s.add(n.id); return s; })}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 accent-gold cursor-pointer" />
                  </td>
                  <td className="px-4 py-3.5 font-medium text-white whitespace-nowrap">{n.nomineeName}</td>
                  <td className="px-4 py-3.5 text-white/50 text-xs">{n.nomineeEmail || '—'}</td>
                  <td className="px-4 py-3.5 text-white/70 text-xs whitespace-nowrap">{n.businessName || '—'}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {n.categories.length > 0
                        ? n.categories.slice(0, 2).map(c => (
                            <span key={c} className="rounded-full bg-white/5 px-2 py-0.5 text-[0.6rem] text-white/40 whitespace-nowrap">{c}</span>
                          ))
                        : <span className="text-xs text-white/25">—</span>}
                      {n.categories.length > 2 && <span className="text-[0.6rem] text-white/30">+{n.categories.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><ScoreBadge score={n.avgScore} /></td>
                  <td className="px-4 py-3.5 text-white/40 text-xs">{n.judgesScored > 0 ? n.judgesScored : '—'}</td>
                  <td className="px-4 py-3.5"><StatusBadge nom={n} /></td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => setExpandedId(id => id === n.id ? null : n.id)}
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
                    <td colSpan={9} className={`px-4 py-3 ${rowBorder}`}>
                      <ActionPanel nom={n} onUpdate={handleUpdate} onDelete={handleDelete} onClose={() => setExpandedId(null)} />
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
          <div className="py-16 text-center text-sm text-white/25">
            {nominations.length === 0 ? 'No nominations yet.' : 'No nominations match your filters.'}
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-white/8 px-5 py-3.5 flex-wrap gap-3">
            <div className="flex items-center gap-3 text-xs text-white/35">
              <span>Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
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
    </div>
  );
}
