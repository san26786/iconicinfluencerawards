'use client';

import { useCallback, useEffect, useState, Fragment } from 'react';
import Link from 'next/link';
import {
  ChevronDown, Loader2, Search, Star,
  Trophy, Users, UserCheck, Medal, Crown, BarChart3,
  MoreVertical, Scale, User, ShieldCheck, FileText, CheckCircle, XCircle,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────────── */

type Category = {
  name: string;
  total: number;
  reviewing: number;
  shortlisted: number;
  semifinalist: number;
  finalist: number;
  winner: number;
};

type Applicant = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string | null;
  org_name: string | null;
  job_title: string | null;
  industry: string | null;
  status: string;
  created_at: string;
  avg_score: number | null;
  judge_count: string;
  confirm_votes: string;
  unconfirm_votes: string;
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

const STAGES = [
  { value: 'submitted',    label: 'Submitted',    color: 'text-white/50' },
  { value: 'reviewing',    label: 'Reserved',     color: 'text-blue-400' },
  { value: 'shortlisted',  label: 'Shortlisted',  color: 'text-purple-400' },
  { value: 'semifinalist', label: 'Semi-Finalist', color: 'text-amber-400' },
  { value: 'finalist',     label: 'Finalist',     color: 'text-orange-400' },
  { value: 'winner',       label: 'Winner',       color: 'text-gold' },
  { value: 'rejected',     label: 'Rejected',     color: 'text-red-400' },
];

function stageBadge(status: string) {
  const s = STAGES.find(x => x.value === status);
  const label = s?.label ?? status;
  const cls = {
    submitted:    'border-white/10 bg-white/5 text-white/50',
    reviewing:    'border-blue-500/30 bg-blue-500/10 text-blue-400',
    shortlisted:  'border-purple-500/30 bg-purple-500/10 text-purple-400',
    semifinalist: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    finalist:     'border-orange-500/30 bg-orange-500/10 text-orange-400',
    winner:       'border-gold/30 bg-gold/10 text-gold',
    rejected:     'border-red-500/30 bg-red-500/10 text-red-400',
  }[status] ?? 'border-white/10 bg-white/5 text-white/50';
  return <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>{label}</span>;
}

/* ── Action dropdown per row ────────────────────────────────────────────── */

// Inline action panel — expands within a row directly beneath the applicant.
function ActionPanel({ app, onStageChange, onClose }: { app: Applicant; onStageChange: (id: number, stage: string) => void; onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const setStage = async (stage: string) => {
    setLoading(true);
    await fetch('/api/organiser/judging-panel/stage', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id, stage }),
    });
    onStageChange(app.id, stage);
    setLoading(false);
    onClose();
  };

  const link = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5 hover:text-white whitespace-nowrap';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link href={`/organiser/award-night/applications/${app.id}`} className={link}>
        <Scale className="h-3.5 w-3.5 text-gold/60" /> Judge / Score
      </Link>
      <Link href={`/organiser/users/${app.id}`} className={link}>
        <User className="h-3.5 w-3.5 text-gold/60" /> View Awards Profile
      </Link>
      <Link href={`/organiser/nominations/${app.id}`} className={link}>
        <ShieldCheck className="h-3.5 w-3.5 text-gold/60" /> Check Eligibility
      </Link>
      <Link href={`/organiser/nominations/${app.id}`} className={link}>
        <FileText className="h-3.5 w-3.5 text-gold/60" /> View Application
      </Link>

      <span className="h-4 w-px bg-white/10" />
      <span className="pl-1 text-[10px] font-bold uppercase tracking-wide text-white/35">
        <CheckCircle className="mr-1 inline h-3 w-3 text-gold/60" />Mark as
      </span>
      {STAGES.filter(s => s.value !== app.status).map(s => (
        <button
          key={s.value}
          onClick={() => setStage(s.value)}
          disabled={loading}
          className={`inline-flex items-center rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-medium transition hover:bg-white/5 disabled:opacity-40 ${s.color}`}
        >
          {s.label}
        </button>
      ))}
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />}
    </div>
  );
}

/* ── Category sidebar item ───────────────────────────────────────────────── */

function CategoryItem({ cat, active, onClick }: { cat: Category; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl px-3 py-3 text-left transition-all ${
        active
          ? 'bg-gold/10 border border-gold/30'
          : 'border border-transparent hover:bg-white/[0.03] hover:border-white/10'
      }`}
    >
      <p className={`text-sm font-semibold leading-snug truncate ${active ? 'text-gold' : 'text-white/80'}`}>
        {cat.name}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        <Pill icon={Users}     value={cat.total}       label="Total"   active={active} />
        <Pill icon={UserCheck} value={cat.semifinalist} label="Semi"    active={active} />
        <Pill icon={Medal}     value={cat.finalist}     label="Finalist" active={active} />
        <Pill icon={Crown}     value={cat.winner}       label="Winner"  active={active} gold />
      </div>
    </button>
  );
}

function Pill({ icon: Icon, value, label, active, gold }: { icon: React.ElementType; value: number; label: string; active: boolean; gold?: boolean }) {
  if (value === 0 && !active) return null;
  return (
    <span className={`flex items-center gap-1 text-[10px] font-semibold ${gold && value > 0 ? 'text-gold' : active ? 'text-white/60' : 'text-white/35'}`}>
      <Icon className="h-2.5 w-2.5" />
      {value} {label}
    </span>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */

export function JudgingPanelClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Load categories once
  useEffect(() => {
    fetch('/api/organiser/judging-panel')
      .then(r => r.json())
      .then(d => { setCategories(d.categories ?? []); setLoadingCats(false); })
      .catch(() => setLoadingCats(false));
  }, []);

  // Load applicants when category/filter changes
  const loadApplicants = useCallback((cat: string, status: string, q: string) => {
    setLoadingApps(true);
    const params = new URLSearchParams();
    if (cat)    params.set('category', cat);
    if (status) params.set('status', status);
    if (q)      params.set('search', q);
    fetch(`/api/organiser/judging-panel/applicants?${params}`)
      .then(r => r.json())
      .then(d => { setApplicants(d.applicants ?? []); setLoadingApps(false); })
      .catch(() => setLoadingApps(false));
  }, []);

  const selectCategory = (name: string) => {
    setSelected(name);
    setSearch('');
    setStatusFilter('');
    loadApplicants(name, '', '');
  };

  const handleStageChange = (appId: number, stage: string) => {
    setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: stage } : a));
    // Refresh category counts
    fetch('/api/organiser/judging-panel')
      .then(r => r.json())
      .then(d => setCategories(d.categories ?? []));
  };

  // Totals across all categories
  const totals = categories.reduce((acc, c) => ({
    total: acc.total + c.total,
    semifinalist: acc.semifinalist + c.semifinalist,
    finalist: acc.finalist + c.finalist,
    winner: acc.winner + c.winner,
  }), { total: 0, semifinalist: 0, finalist: 0, winner: 0 });

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

      {/* ── Left sidebar ─────────────────────────────────────────────── */}
      <aside className="flex w-72 flex-shrink-0 flex-col border-r border-white/10 bg-white/[0.02] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-white/10 bg-ink/90 px-4 py-4 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gold">Judging Panel</p>
          <p className="mt-0.5 text-xs text-white/40">{categories.length} categories</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-2 px-3 py-3 border-b border-white/10">
          {[
            { label: 'Total',      value: totals.total,       icon: Users,     color: 'text-white/60' },
            { label: 'Semi',       value: totals.semifinalist, icon: UserCheck, color: 'text-amber-400' },
            { label: 'Finalists',  value: totals.finalist,    icon: Medal,     color: 'text-orange-400' },
            { label: 'Winners',    value: totals.winner,      icon: Crown,     color: 'text-gold' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-2">
                <Icon className={`h-3.5 w-3.5 ${s.color}`} />
                <p className={`mt-1 text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-white/35">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* "All Categories" option */}
        <div className="px-3 py-2">
          <button
            onClick={() => { setSelected(null); loadApplicants('', statusFilter, search); }}
            className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-all ${
              selected === null
                ? 'border-gold/30 bg-gold/10 text-gold'
                : 'border-transparent text-white/50 hover:border-white/10 hover:text-white/80'
            }`}
          >
            All Categories
          </button>
        </div>

        {/* Category list */}
        <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {loadingCats ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gold" /></div>
          ) : categories.length === 0 ? (
            <p className="py-8 text-center text-xs text-white/30">No categories found</p>
          ) : (
            categories.map(cat => (
              <CategoryItem key={cat.name} cat={cat} active={selected === cat.name} onClick={() => selectCategory(cat.name)} />
            ))
          )}
        </div>
      </aside>

      {/* ── Right panel ──────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
          <h2 className="mr-auto text-sm font-bold text-white truncate">
            {selected ?? 'All Categories'}
            <span className="ml-2 text-xs font-normal text-white/40">
              {loadingApps ? '…' : `${applicants.length} applicants`}
            </span>
          </h2>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                loadApplicants(selected ?? '', e.target.value, search);
              }}
              className="appearance-none rounded-lg border border-white/10 bg-white/[0.04] pl-3 pr-8 py-1.5 text-xs text-white/70 focus:border-gold/40 focus:outline-none [&_option]:bg-ink [&_option]:text-white"
            >
              <option value="">All Stages</option>
              {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search applicant…"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                loadApplicants(selected ?? '', statusFilter, e.target.value);
              }}
              className="rounded-lg border border-white/10 bg-white/[0.04] pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none w-48"
            />
          </div>
        </div>

        {/* Applicants table */}
        <div className="flex-1 overflow-auto">
          {!selected && applicants.length === 0 && !loadingApps ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
              <BarChart3 className="h-10 w-10 text-white/15" />
              <p className="text-sm text-white/35">Select a category from the left to view applicants</p>
            </div>
          ) : loadingApps ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
          ) : applicants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-sm text-white/35">No applicants found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-ink/95 backdrop-blur">
                <tr className="border-b border-white/10 text-left text-[10px] font-bold uppercase tracking-widest text-white/35">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Organisation</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-4 py-3 text-center">Judges</th>
                  <th className="px-4 py-3 text-center">
                    <span title="Confirm Votes"><CheckCircle className="inline h-3 w-3 text-green-500/60" /></span>
                    {' / '}
                    <span title="Unconfirm Votes"><XCircle className="inline h-3 w-3 text-red-400/60" /></span>
                  </th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {applicants.map((app, i) => {
                  const isExpanded = expandedId === app.id;
                  return (
                  <Fragment key={app.id}>
                  <tr className={`group transition-colors ${isExpanded ? 'bg-white/[0.03]' : 'hover:bg-white/[0.025]'}`}>
                    <td className="px-4 py-3 text-xs text-white/25">{i + 1}</td>

                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{app.first_name} {app.last_name}</p>
                      <p className="text-[11px] text-white/35 mt-0.5">{app.email}</p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-xs text-white/65">{app.org_name || '—'}</p>
                      <p className="text-[11px] text-white/30">{app.job_title}</p>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {app.avg_score !== null ? (
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-gold">
                          <Star className="h-3 w-3 fill-current" />
                          {app.avg_score}
                        </span>
                      ) : (
                        <span className="text-xs text-white/25">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center text-xs text-white/50">
                      {app.judge_count}
                    </td>

                    <td className="px-4 py-3 text-center text-xs">
                      <span className="text-green-400">{app.confirm_votes}</span>
                      <span className="text-white/25 mx-1">/</span>
                      <span className="text-red-400">{app.unconfirm_votes}</span>
                    </td>

                    <td className="px-4 py-3">{stageBadge(app.status)}</td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setExpandedId(id => id === app.id ? null : app.id)}
                        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          isExpanded ? 'border-gold/40 bg-gold/10 text-gold' : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-gold/30 hover:text-gold'
                        }`}
                      >
                        <MoreVertical className="h-3 w-3" /> Manage
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-white/[0.03]">
                      <td colSpan={8} className="px-4 py-3">
                        <ActionPanel app={app} onStageChange={handleStageChange} onClose={() => setExpandedId(null)} />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
