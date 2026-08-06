'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, ChevronDown, ChevronUp, ChevronsUpDown,
  BarChart2, PieChart, Mail, Check,
  ChevronLeft, ChevronRight, Loader2,
  Download, Eye, FileText, Award, RefreshCw, LogIn,
  MessageSquare, Calendar, Star, XCircle,
  BookOpen, Trophy, Users, Bookmark, BookmarkX,
  Flag, FlagOff,
} from 'lucide-react';
import { ApplicationModal, type ModalType, type AppRecord } from './ApplicationActionModals';

export type Application = {
  id: number;
  ref_number: string;
  status: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  mobile: string | null;
  job_title: string | null;
  org_name: string | null;
  industry: string | null;
  event_title: string | null;
  created_at: string;
  has_account?: boolean;
};

const STATUS_OPTIONS = ['submitted', 'reviewing', 'shortlisted', 'semifinalist', 'finalist', 'winner', 'runner_up', 'rejected'];

const STATUS_STYLE: Record<string, string> = {
  submitted:    'bg-blue-500/15 text-blue-300 border-blue-500/25',
  reviewing:    'bg-amber-500/15 text-amber-300 border-amber-500/25',
  shortlisted:  'bg-purple-500/15 text-purple-300 border-purple-500/25',
  semifinalist: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  finalist:     'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  winner:       'bg-gold/15 text-gold border-gold/25',
  runner_up:    'bg-slate-400/15 text-slate-300 border-slate-400/25',
  rejected:     'bg-red-500/15 text-red-300 border-red-500/25',
};

const PAGE_SIZES = [10, 25, 50, 100];

type SortKey = 'first_name' | 'last_name' | 'email' | 'org_name' | 'industry' | 'status' | 'created_at';
type SortDir = 'asc' | 'desc';

/* ─── Custom Dropdown ───────────────────────────────────────────────────── */
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

const STATUS_LABEL: Record<string, string> = {
  submitted:    'Submitted',
  reviewing:    'Reviewing',
  shortlisted:  'Shortlisted',
  semifinalist: 'Semi-Finalist',
  finalist:     'Finalist',
  winner:       'Winner',
  runner_up:    'Runner-up',
  rejected:     'Rejected',
};

/* ─── Status Badge ──────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold ${STATUS_STYLE[status] ?? 'bg-white/10 text-white/50 border-white/10'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

/* ─── Sort Icon ─────────────────────────────────────────────────────────── */
function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="h-3 w-3 text-white/20" />;
  return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-gold" /> : <ChevronDown className="h-3 w-3 text-gold" />;
}

/* ─── Action Menu ───────────────────────────────────────────────────────── */
function ActionMenu({
  app, onStatusChange, updating, onOpenModal,
}: {
  app: Application;
  onStatusChange: (id: number, status: string) => Promise<void>;
  updating: boolean;
  onOpenModal: (type: ModalType, app: AppRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, right: Math.max(4, window.innerWidth - r.right) });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onScroll() { setOpen(false); }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const Item = ({ icon: Icon, label, onClick, danger }: { icon: React.ElementType; label: string; onClick?: () => void; danger?: boolean }) => (
    <button onClick={() => { onClick?.(); setOpen(false); }}
      className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
        danger ? 'text-red-400 hover:bg-red-500/10' : 'text-white/60 hover:bg-white/5 hover:text-white'
      }`}>
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      {label}
    </button>
  );

  const Divider = () => <div className="my-1 h-px bg-white/8" />;

  return (
    <div className="relative">
      <button ref={btnRef} onClick={toggle} disabled={updating}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/60 hover:border-gold/30 hover:text-gold transition-colors disabled:opacity-40">
        {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Action'}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div
          style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999 }}
          className="w-56 rounded-2xl border border-white/10 bg-[#1a1a2e] shadow-2xl"
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="max-h-[70vh] overflow-y-auto p-1.5">

            {/* Documents */}
            <Item icon={Download}   label="Download Certificate"    onClick={() => onOpenModal('certificate', app)} />
            <Item icon={Eye}        label="Preview Application"     onClick={() => onOpenModal('preview',     app)} />
            <Item icon={FileText}   label="Download Application"    onClick={() => onOpenModal('preview',     app)} />
            <Item icon={Award}      label="View Certificate"        onClick={() => onOpenModal('certificate', app)} />
            <Item icon={RefreshCw}  label="Regenerate Certificate"  onClick={() => onOpenModal('certificate', app)} />

            <Divider />

            {/* Account */}
            <Item icon={LogIn}      label="Login" />

            <Divider />

            {/* Communication */}
            <Item icon={MessageSquare} label="View All Comments" onClick={() => onOpenModal('comments',    app)} />
            <Item icon={Mail}          label="View Email Trail"  onClick={() => onOpenModal('email-trail', app)} />
            <Item icon={Calendar}      label="Book Schedule"     onClick={() => onOpenModal('schedule',    app)} />
            <Item icon={BookOpen}      label="Add Comment"       onClick={() => onOpenModal('add-comment', app)} />

            <Divider />

            {/* Scoring */}
            <Item icon={Star}       label="View Average Score"   onClick={() => onOpenModal('score', app)} />

            <Divider />

            {/* Shortlist */}
            <Item icon={Bookmark}   label="Mark Shortlist"      onClick={() => onStatusChange(app.id, 'shortlisted')} />
            <Item icon={BookmarkX}  label="Unmark Shortlist"    onClick={() => onStatusChange(app.id, 'submitted')} />

            {/* Semi Finalist */}
            <Item icon={Flag}       label="Mark Semi Finalist"  onClick={() => onStatusChange(app.id, 'semifinalist')} />
            <Item icon={FlagOff}    label="Unmark Semi Finalist" onClick={() => onStatusChange(app.id, 'shortlisted')} />

            {/* Finalist */}
            <Item icon={Award}      label="Mark Finalist"       onClick={() => onStatusChange(app.id, 'finalist')} />
            <Item icon={XCircle}    label="Unmark Finalist"     onClick={() => onStatusChange(app.id, 'semifinalist')} />

            {/* Winner / Runner-up */}
            <Item icon={Trophy}     label="Mark Winner"         onClick={() => onStatusChange(app.id, 'winner')} />
            <Item icon={XCircle}    label="Unmark Winner"       onClick={() => onStatusChange(app.id, 'finalist')} />
            <Item icon={Award}      label="Mark Runner-up"      onClick={() => onStatusChange(app.id, 'runner_up')} />
            <Item icon={XCircle}    label="Unmark Runner-up"    onClick={() => onStatusChange(app.id, 'finalist')} />

            <Divider />

            {/* Other */}
            <Item icon={XCircle}    label="Mark Not Eligible"   onClick={() => onStatusChange(app.id, 'rejected')} danger />
            <Item icon={Users}      label="Update Joining Status" />

          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Category Stats Modal ─────────────────────────────────────────────── */
type CatStat = {
  category_name: string;
  nominations_count: number;
  applications_count: number;
  judges_count: number;
  shortlist_count: number;
};

const CAT_BARS = [
  { key: 'nominations_count'  as const, label: 'Nomination',  color: '#6b7280' },
  { key: 'applications_count' as const, label: 'Application', color: '#22c55e' },
  { key: 'judges_count'       as const, label: 'Judge',       color: '#ef4444' },
];

function CategoryStatsModal({ applications: apps, onClose }: { applications: Application[]; onClose: () => void }) {
  const [cats, setCats]     = useState<CatStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/organiser/award-categories')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.categories)) {
          const shortlistByIndustry: Record<string, number> = {};
          apps.filter(a => a.status === 'shortlisted').forEach(a => {
            if (a.industry) shortlistByIndustry[a.industry] = (shortlistByIndustry[a.industry] ?? 0) + 1;
          });
          setCats(d.categories.map((c: CatStat) => ({
            ...c,
            shortlist_count: shortlistByIndustry[c.category_name] ?? 0,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => ({
    nominations:  cats.reduce((s, c) => s + c.nominations_count, 0),
    applications: cats.reduce((s, c) => s + c.applications_count, 0),
    judges:       cats.reduce((s, c) => s + c.judges_count, 0),
    shortlist:    cats.reduce((s, c) => s + c.shortlist_count, 0),
  }), [cats]);

  const maxVal = useMemo(() => {
    const vals = cats.flatMap(c => [c.nominations_count, c.applications_count, c.judges_count]);
    return Math.max(...vals, 1);
  }, [cats]);

  const BAR_W = 10, GAP = 3, GROUP = CAT_BARS.length * (BAR_W + GAP), CAT_GAP = 30;
  const CHART_H = 160, PADDING_L = 32, PADDING_B = 80;
  const chartW = Math.max(cats.length * (GROUP + CAT_GAP) + PADDING_L, 400);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0f0f1a] shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <h2 className="font-display text-lg font-semibold uppercase tracking-luxe text-gold">View Category Stats</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:text-white transition-colors">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Summary row */}
        <div className="flex flex-wrap gap-x-10 gap-y-2 border-b border-white/8 px-6 py-4">
          {([
            { label: 'Nomination',  val: totals.nominations,  color: 'text-gray-300' },
            { label: 'Application', val: totals.applications, color: 'text-emerald-400' },
            { label: 'Judges',      val: totals.judges,       color: 'text-red-400' },
            { label: 'Shortlist',   val: totals.shortlist,    color: 'text-amber-400' },
          ] as const).map(s => (
            <div key={s.label} className="text-sm font-semibold text-white/70">
              {s.label}: <span className={`${s.color} text-base`}>{s.val}</span>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="overflow-x-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
          ) : cats.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/30">
              No category data available. Sync categories from the nominations panel first.
            </p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-4">
                {CAT_BARS.map(b => (
                  <div key={b.key} className="flex items-center gap-1.5 text-xs text-white/50">
                    <span className="h-3 w-4 rounded-sm flex-shrink-0" style={{ background: b.color }} />
                    {b.label}
                  </div>
                ))}
              </div>
              <svg width={chartW} height={CHART_H + PADDING_B} style={{ display: 'block', overflow: 'visible' }}>
                {[0, 0.25, 0.5, 0.75, 1].map(frac => {
                  const y = CHART_H - frac * CHART_H;
                  return (
                    <g key={frac}>
                      <line x1={PADDING_L} x2={chartW} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                      <text x={PADDING_L - 4} y={y + 4} textAnchor="end" fontSize={8} fill="rgba(255,255,255,0.3)">
                        {Math.round(frac * maxVal)}
                      </text>
                    </g>
                  );
                })}
                {cats.map((cat, ci) => {
                  const gx = PADDING_L + ci * (GROUP + CAT_GAP);
                  const cx = gx + GROUP / 2;
                  return (
                    <g key={cat.category_name}>
                      {CAT_BARS.map((b, bi) => {
                        const count = cat[b.key];
                        const bh = (count / maxVal) * CHART_H;
                        const bx = gx + bi * (BAR_W + GAP);
                        return (
                          <g key={b.key}>
                            <rect x={bx} y={CHART_H - Math.max(bh, 0)} width={BAR_W} height={Math.max(bh, 0)} fill={b.color} rx={2} />
                            {count > 0 && (
                              <text x={bx + BAR_W / 2} y={CHART_H - bh - 2} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.6)">{count}</text>
                            )}
                          </g>
                        );
                      })}
                      <text
                        x={cx} y={CHART_H + 8} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.45)"
                        transform={`rotate(-40 ${cx} ${CHART_H + 8})`}
                      >
                        {cat.category_name.length > 22 ? cat.category_name.slice(0, 20) + '…' : cat.category_name}
                      </text>
                    </g>
                  );
                })}
                <line x1={PADDING_L} x2={chartW} y1={CHART_H} y2={CHART_H} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              </svg>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-white/8 px-6 py-4">
          <button onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-2 text-sm font-semibold text-white/60 hover:text-white transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Stats Modal ───────────────────────────────────────────────────────── */
const STAT_BARS = [
  { key: 'reviewing',    label: 'InProgress',   color: '#6b7280' },
  { key: 'submitted',   label: 'Completed',    color: '#22c55e' },
  { key: 'shortlisted', label: 'Shortlisted',  color: '#ef4444' },
  { key: 'semifinalist',label: 'Semifinalist', color: '#3b82f6' },
  { key: 'finalist',    label: 'Finalist',     color: '#f59e0b' },
  { key: 'winner',      label: 'Winner',       color: '#ec4899' },
] as const;

function StatsModal({ applications, onClose }: { applications: Application[]; onClose: () => void }) {
  const total       = applications.length;
  const inprogress  = applications.filter(a => a.status === 'reviewing').length;
  const shortlisted = applications.filter(a => a.status === 'shortlisted').length;
  const semi        = applications.filter(a => a.status === 'semifinalist').length;
  const finalist    = applications.filter(a => a.status === 'finalist').length;
  const winner      = applications.filter(a => a.status === 'winner').length;

  const cats = useMemo(() => {
    const names = [...new Set(applications.map(a => a.industry).filter(Boolean) as string[])].sort();
    return names.map(name => {
      const rows = applications.filter(a => a.industry === name);
      const counts: Record<string, number> = {};
      STAT_BARS.forEach(b => { counts[b.key] = rows.filter(a => a.status === b.key).length; });
      return { name, counts };
    });
  }, [applications]);

  const maxVal = useMemo(() => {
    const vals = cats.flatMap(c => Object.values(c.counts));
    return Math.max(...vals, 1);
  }, [cats]);

  // SVG chart dimensions
  const BAR_W = 8;
  const GAP   = 2;
  const GROUP = STAT_BARS.length * (BAR_W + GAP);
  const CAT_GAP = 28;
  const CHART_H = 160;
  const PADDING_L = 28;
  const PADDING_B = 80;
  const chartW = cats.length * (GROUP + CAT_GAP) + PADDING_L;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-[#0f0f1a] shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <h2 className="font-display text-lg font-semibold uppercase tracking-luxe text-gold">View Application Stats</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:text-white transition-colors">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Summary row */}
        <div className="flex flex-wrap gap-x-8 gap-y-2 border-b border-white/8 px-6 py-4">
          {[
            { label: 'Inprogress',   val: inprogress,  color: 'text-gray-400' },
            { label: 'Applicants',   val: total,        color: 'text-emerald-400' },
            { label: 'ShortList',    val: shortlisted,  color: 'text-red-400' },
            { label: 'Semifinalist', val: semi,         color: 'text-blue-400' },
            { label: 'Finalist',     val: finalist,     color: 'text-amber-400' },
            { label: 'Winner',       val: winner,       color: 'text-pink-400' },
          ].map(s => (
            <div key={s.label} className="text-sm font-semibold text-white/70">
              {s.label} : <span className={`${s.color} text-base`}>{s.val}</span>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="overflow-x-auto px-6 py-5">
          {cats.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/30">No category data available.</p>
          ) : (
            <>
              {/* Legend */}
              <div className="mb-4 flex flex-wrap gap-4">
                {STAT_BARS.map(b => (
                  <div key={b.key} className="flex items-center gap-1.5 text-xs text-white/50">
                    <span className="h-3 w-4 rounded-sm flex-shrink-0" style={{ background: b.color }} />
                    {b.label}
                  </div>
                ))}
              </div>
              <svg width={chartW} height={CHART_H + PADDING_B} style={{ display: 'block', overflow: 'visible' }}>
                {/* Y-axis gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map(frac => {
                  const y = CHART_H - frac * CHART_H;
                  const val = Math.round(frac * maxVal);
                  return (
                    <g key={frac}>
                      <line x1={PADDING_L} x2={chartW} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                      <text x={PADDING_L - 4} y={y + 4} textAnchor="end" fontSize={8} fill="rgba(255,255,255,0.3)">{val}</text>
                    </g>
                  );
                })}
                {/* Bars per category */}
                {cats.map((cat, ci) => {
                  const gx = PADDING_L + ci * (GROUP + CAT_GAP);
                  const cx = gx + GROUP / 2;
                  return (
                    <g key={cat.name}>
                      {STAT_BARS.map((b, bi) => {
                        const count = cat.counts[b.key] ?? 0;
                        const bh = (count / maxVal) * CHART_H;
                        const bx = gx + bi * (BAR_W + GAP);
                        return (
                          <g key={b.key}>
                            <rect
                              x={bx} y={CHART_H - bh} width={BAR_W} height={bh}
                              fill={b.color} rx={2}
                            />
                            {count > 0 && (
                              <text x={bx + BAR_W / 2} y={CHART_H - bh - 2} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.6)">{count}</text>
                            )}
                          </g>
                        );
                      })}
                      {/* Category label */}
                      <text
                        x={cx} y={CHART_H + 8}
                        textAnchor="end"
                        fontSize={9} fill="rgba(255,255,255,0.45)"
                        transform={`rotate(-40 ${cx} ${CHART_H + 8})`}
                      >
                        {cat.name.length > 22 ? cat.name.slice(0, 20) + '…' : cat.name}
                      </text>
                    </g>
                  );
                })}
                {/* X axis line */}
                <line x1={PADDING_L} x2={chartW} y1={CHART_H} y2={CHART_H} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              </svg>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-white/8 px-6 py-4">
          <button onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-2 text-sm font-semibold text-white/60 hover:text-white transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────── */
export function ApplicationsListClient({
  applications: initial,
  defaultStatus = '',
}: {
  applications: Application[];
  defaultStatus?: string;
}) {
  const [applications, setApplications] = useState(initial);
  const [search, setSearch]             = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter]     = useState(defaultStatus);
  const [showStats, setShowStats]           = useState(false);
  const [showCatStats, setShowCatStats]     = useState(false);
  const [modal, setModal] = useState<{ type: ModalType; app: AppRecord } | null>(null);
  const [emailTemplate, setEmailTemplate]   = useState('');
  const [emailTemplates, setEmailTemplates] = useState<{ value: string; label: string }[]>([]);
  const [bulkAction, setBulkAction]         = useState('');
  const [sortKey, setSortKey]           = useState<SortKey>('created_at');
  const [sortDir, setSortDir]           = useState<SortDir>('desc');
  const [selected, setSelected]         = useState<Set<number>>(new Set());
  const [updating, setUpdating]         = useState<number | null>(null);
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(10);

  useEffect(() => {
    fetch('/api/organiser/email-templates')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.templates)) {
          setEmailTemplates(d.templates.map((t: { id: number; name: string }) => ({
            value: String(t.id),
            label: t.name,
          })));
        }
      })
      .catch(() => {});
  }, []);

  const categories = useMemo(() => {
    const set = new Set(applications.map(a => a.industry).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [applications]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    applications.forEach(a => { c[a.status] = (c[a.status] ?? 0) + 1; });
    return c;
  }, [applications]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  }

  async function changeStatus(id: number, status: string) {
    setUpdating(id);
    try {
      const res = await fetch('/api/organiser/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      } else {
        const d = await res.json().catch(() => ({}));
        alert(`Status update failed: ${d.error ?? res.statusText}`);
      }
    } catch (e) {
      alert(`Network error: ${String(e)}`);
    } finally {
      setUpdating(null);
    }
  }

  async function applyBulkAction() {
    if (!bulkAction || selected.size === 0) return;
    const ids = Array.from(selected);
    await Promise.all(ids.map(id => fetch('/api/organiser/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: bulkAction }),
    })));
    setApplications(prev => prev.map(a => selected.has(a.id) ? { ...a, status: bulkAction } : a));
    setSelected(new Set());
    setBulkAction('');
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return applications
      .filter(a => !categoryFilter || a.industry === categoryFilter)
      .filter(a => !statusFilter   || a.status   === statusFilter)
      .filter(a => !q || [a.first_name, a.last_name, a.email, a.org_name, a.mobile, a.industry, a.ref_number]
        .some(v => v?.toLowerCase().includes(q)))
      .sort((a, b) => {
        const av = (a[sortKey] ?? '') as string;
        const bv = (b[sortKey] ?? '') as string;
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
  }, [applications, categoryFilter, statusFilter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allOnPage  = paginated.length > 0 && paginated.every(a => selected.has(a.id));

  const Th = ({ label, col }: { label: string; col: SortKey }) => (
    <th className="cursor-pointer px-4 py-3.5 text-left text-[0.6rem] font-semibold uppercase tracking-widest text-white/35 hover:text-white/60 select-none whitespace-nowrap"
      onClick={() => toggleSort(col)}>
      <span className="inline-flex items-center gap-1">{label} <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} /></span>
    </th>
  );
  const Th2 = ({ label }: { label: string }) => (
    <th className="px-4 py-3.5 text-left text-[0.6rem] font-semibold uppercase tracking-widest text-white/35 whitespace-nowrap">{label}</th>
  );

  return (
    <div className="space-y-5">

      {/* Top action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-white/35">
          {applications.length} total applicant{applications.length !== 1 ? 's' : ''} with registered accounts
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowStats(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/70 hover:border-gold/30 hover:text-white transition-colors">
            <BarChart2 className="h-4 w-4 text-gold" /> View Application Stats
          </button>
          <button onClick={() => setShowCatStats(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/70 hover:border-gold/30 hover:text-white transition-colors">
            <PieChart className="h-4 w-4 text-gold" /> View Category Stats
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3">
        <CustomDropdown
          value={categoryFilter} onChange={v => { setCategoryFilter(v); setPage(1); }}
          options={categories.map(c => ({ value: c, label: c }))}
          placeholder="Select Category" minWidth="min-w-52"
        />
        <CustomDropdown
          value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }}
          options={STATUS_OPTIONS.map(s => ({ value: s, label: `${STATUS_LABEL[s] ?? s} (${counts[s] ?? 0})` }))}
          placeholder="Select a Status" minWidth="min-w-52"
        />
      </div>

      {/* Email + bulk toolbar */}
      <div className="rounded-2xl glass p-4 flex flex-wrap gap-3 items-center">
        <CustomDropdown
          value={emailTemplate} onChange={setEmailTemplate}
          options={emailTemplates} placeholder={emailTemplates.length ? 'Select Template' : 'No templates yet'} minWidth="min-w-48"
        />
        <button disabled={selected.size === 0 || !emailTemplate}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/60 hover:text-white hover:border-gold/30 transition-colors disabled:opacity-40">
          <Mail className="h-4 w-4" /> Send Mail {selected.size > 0 && `(${selected.size})`}
        </button>

        <div className="h-6 w-px bg-white/10 hidden sm:block" />

        <CustomDropdown
          value={bulkAction} onChange={setBulkAction}
          options={STATUS_OPTIONS.map(s => ({ value: s, label: `Mark as ${STATUS_LABEL[s] ?? s}` }))}
          placeholder="Select an Action" minWidth="min-w-44"
        />
        <button onClick={applyBulkAction} disabled={!bulkAction || selected.size === 0}
          className="rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-40 hover:-translate-y-0.5 transition-all">
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

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-white/35 px-1">
        <span>{filtered.length} found{filtered.length > 0 ? `, Page ${page} of ${totalPages}` : ''}</span>
        <span>Results {Math.min((page - 1) * pageSize + 1, filtered.length || 1)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
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
                      if (allOnPage) setSelected(prev => { const s = new Set(prev); paginated.forEach(a => s.delete(a.id)); return s; });
                      else setSelected(prev => { const s = new Set(prev); paginated.forEach(a => s.add(a.id)); return s; });
                    }}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-gold cursor-pointer" />
                </th>
                <Th2 label="Title" />
                <Th label="First Name"  col="first_name" />
                <Th label="Last Name"   col="last_name" />
                <Th2 label="Full Name" />
                <Th2 label="Mobile" />
                <Th label="Email"       col="email" />
                <Th label="Business"    col="org_name" />
                <Th2 label="Position" />
                <Th label="Category"    col="industry" />
                <Th2 label="%" />
                <Th2 label="Avg Score" />
                <Th label="Status"      col="status" />
                <Th2 label="Manage" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.map(a => (
                <tr key={a.id}
                  className={`transition-colors hover:bg-white/[0.025] ${selected.has(a.id) ? 'bg-gold/5' : ''}`}>
                  <td className="px-4 py-3.5">
                    <input type="checkbox" checked={selected.has(a.id)}
                      onChange={() => setSelected(prev => { const s = new Set(prev); s.has(a.id) ? s.delete(a.id) : s.add(a.id); return s; })}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 accent-gold cursor-pointer" />
                  </td>
                  <td className="px-4 py-3.5 text-white/30 text-xs">—</td>
                  <td className="px-4 py-3.5 font-medium text-white whitespace-nowrap">{a.first_name || '—'}</td>
                  <td className="px-4 py-3.5 text-white/80 whitespace-nowrap">{a.last_name || '—'}</td>
                  <td className="px-4 py-3.5 text-white/70 whitespace-nowrap text-xs">
                    {[a.first_name, a.last_name].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-4 py-3.5 text-white/50 text-xs whitespace-nowrap">{a.mobile || '—'}</td>
                  <td className="px-4 py-3.5 text-white/60 text-xs">{a.email || '—'}</td>
                  <td className="px-4 py-3.5 text-white/70 text-xs whitespace-nowrap">{a.org_name || '—'}</td>
                  <td className="px-4 py-3.5 text-white/50 text-xs whitespace-nowrap">{a.job_title || '—'}</td>
                  <td className="px-4 py-3.5 text-white/50 text-xs whitespace-nowrap">{a.industry || '—'}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-xs font-bold text-emerald-400">100</span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-white/30 text-xs">—</td>
                  <td className="px-4 py-3.5"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3.5">
                    <ActionMenu
                      app={a}
                      onStatusChange={changeStatus}
                      updating={updating === a.id}
                      onOpenModal={(type, app) => setModal({ type, app })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-white/25">
            {applications.length === 0
              ? 'No applicants found. Nominees must register an account and submit the full application form.'
              : 'No applicants match your filters.'}
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

      {/* Stats Modal */}
      {showStats && (
        <StatsModal applications={applications} onClose={() => setShowStats(false)} />
      )}

      {/* Category Stats Modal */}
      {showCatStats && (
        <CategoryStatsModal applications={applications} onClose={() => setShowCatStats(false)} />
      )}

      {/* Action Modals (Preview, Certificate, Comments, Email Trail, Schedule, Score) */}
      {modal && (
        <ApplicationModal type={modal.type} app={modal.app} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
