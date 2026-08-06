'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Pencil, Trash2, X, Save, Search, CheckCircle, Clock, XCircle,
  UserPlus, Users, AlertTriangle, Info,
  Music, Mic2, Mic, Clapperboard, Camera, UtensilsCrossed, Shield, Star,
  ChevronDown, Trophy, Scale, Handshake, Network, Megaphone, Store,
  Newspaper, Ticket, CheckSquare, Heart, Package, Monitor, FileCheck,
  Archive, UserCog,
} from 'lucide-react';
import { CEREMONY_ROLE_CATEGORIES } from '@/lib/ceremonyRolesData';

// ── Category display metadata ──────────────────────────────────────────────────

const CAT_META: Record<string, { icon: React.ElementType; color: string; border: string; bg: string }> = {
  'Entertainment & Performance':     { icon: Music,           color: 'text-violet-400', border: 'border-violet-500/25', bg: 'bg-violet-500/10' },
  'Ceremony & Protocol':             { icon: Mic2,            color: 'text-gold',       border: 'border-gold/25',       bg: 'bg-gold/10'       },
  'Production & Stage Crew':         { icon: Clapperboard,    color: 'text-blue-400',   border: 'border-blue-500/25',   bg: 'bg-blue-500/10'   },
  'Photography & Content':           { icon: Camera,          color: 'text-pink-400',   border: 'border-pink-500/25',   bg: 'bg-pink-500/10'   },
  'Hospitality & Guest Experience':  { icon: UtensilsCrossed, color: 'text-emerald-400',border: 'border-emerald-500/25',bg: 'bg-emerald-500/10'},
  'Security & Safety':               { icon: Shield,          color: 'text-red-400',    border: 'border-red-500/25',    bg: 'bg-red-500/10'    },
  'Special Recognition':             { icon: Star,            color: 'text-amber-400',  border: 'border-amber-500/25',  bg: 'bg-amber-500/10'  },
  'Applicants & Award Participants': { icon: Trophy,          color: 'text-yellow-400', border: 'border-yellow-500/25', bg: 'bg-yellow-500/10' },
  'Judging Roles':                   { icon: Scale,           color: 'text-cyan-400',   border: 'border-cyan-500/25',   bg: 'bg-cyan-500/10'   },
  'Organising Team':                 { icon: Users,           color: 'text-indigo-400', border: 'border-indigo-500/25', bg: 'bg-indigo-500/10' },
  'Sponsors':                        { icon: Handshake,       color: 'text-gold',       border: 'border-gold/25',       bg: 'bg-gold/10'       },
  'Partners':                        { icon: Network,         color: 'text-teal-400',   border: 'border-teal-500/25',   bg: 'bg-teal-500/10'   },
  'Brand Promotion':                 { icon: Megaphone,       color: 'text-orange-400', border: 'border-orange-500/25', bg: 'bg-orange-500/10' },
  'Exhibitors':                      { icon: Store,           color: 'text-lime-400',   border: 'border-lime-500/25',   bg: 'bg-lime-500/10'   },
  'Advertising & Media':             { icon: Newspaper,       color: 'text-sky-400',    border: 'border-sky-500/25',    bg: 'bg-sky-500/10'    },
  'Speakers & VIP Guests':           { icon: Mic,             color: 'text-fuchsia-400',border: 'border-fuchsia-500/25',bg: 'bg-fuchsia-500/10'},
  'Attendees & Delegates':           { icon: Ticket,          color: 'text-rose-400',   border: 'border-rose-500/25',   bg: 'bg-rose-500/10'   },
  'Voting Roles':                    { icon: CheckSquare,     color: 'text-green-400',  border: 'border-green-500/25',  bg: 'bg-green-500/10'  },
  'Volunteers':                      { icon: Heart,           color: 'text-pink-400',   border: 'border-pink-500/25',   bg: 'bg-pink-500/10'   },
  'Vendors & Service Providers':     { icon: Package,         color: 'text-stone-400',  border: 'border-stone-500/25',  bg: 'bg-stone-500/10'  },
  'Technology Roles':                { icon: Monitor,         color: 'text-blue-400',   border: 'border-blue-500/25',   bg: 'bg-blue-500/10'   },
  'Governance & Compliance':         { icon: FileCheck,       color: 'text-emerald-400',border: 'border-emerald-500/25',bg: 'bg-emerald-500/10'},
  'Post-Event & Alumni':             { icon: Archive,         color: 'text-violet-400', border: 'border-violet-500/25', bg: 'bg-violet-500/10' },
  'Platform & Account Roles':        { icon: UserCog,         color: 'text-slate-400',  border: 'border-slate-500/25',  bg: 'bg-slate-500/10'  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export type CeremonyRole = {
  id: number;
  event_id: number;
  category: string;
  role: string;
  description: string | null;
  additional_details: string | null;
  person_name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: 'vacant' | 'pending' | 'confirmed' | 'cancelled';
};

type EventOption = { id: number; title: string };

type AssignForm = {
  person_name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  status: string;
};

const BLANK_FORM: AssignForm = { person_name: '', company: '', email: '', phone: '', notes: '', status: 'pending' };

const STATUS_STYLES = {
  vacant:    { icon: Users,        cls: 'text-white/40  bg-white/5       border-white/10',       label: 'Vacant'    },
  pending:   { icon: Clock,        cls: 'text-amber-400  bg-amber-400/10  border-amber-400/25',   label: 'Pending'   },
  confirmed: { icon: CheckCircle,  cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',label: 'Confirmed' },
  cancelled: { icon: XCircle,      cls: 'text-red-400    bg-red-400/10    border-red-400/25',     label: 'Cancelled' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ManageCeremonyRolesClient({ events }: { events: EventOption[] }) {
  const [eventId, setEventId]         = useState<number | null>(events[0]?.id ?? null);
  const [roles, setRoles]             = useState<CeremonyRole[]>([]);
  const [loading, setLoading]         = useState(false);
  const [activeTab, setActiveTab]     = useState(CEREMONY_ROLE_CATEGORIES[0].id);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openId, setOpenId]           = useState<number | null>(null);
  const [form, setForm]               = useState<AssignForm>(BLANK_FORM);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const activeCat   = CEREMONY_ROLE_CATEGORIES.find(c => c.id === activeTab)!;
  const activeMeta  = CAT_META[activeCat.label] ?? CAT_META['Ceremony & Protocol'];
  const ActiveIcon  = activeMeta.icon;

  // Load roles when event changes
  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    fetch(`/api/organiser/ceremony-roles?event_id=${eventId}`)
      .then(r => r.json())
      .then(d => setRoles(d.roles ?? []))
      .catch(() => setRoles([]))
      .finally(() => setLoading(false));
  }, [eventId]);

  // Filtered for active tab + search + status
  const visibleRoles = useMemo(() => {
    const q = search.toLowerCase();
    return roles.filter(r => {
      if (r.category !== activeCat.label) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.role.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        (r.person_name ?? '').toLowerCase().includes(q) ||
        (r.company ?? '').toLowerCase().includes(q)
      );
    });
  }, [roles, activeCat, search, statusFilter]);

  // Counts per category (assigned = non-vacant)
  const assignedByCategory = useMemo(() => {
    const m: Record<string, { assigned: number; total: number }> = {};
    for (const r of roles) {
      if (!m[r.category]) m[r.category] = { assigned: 0, total: 0 };
      m[r.category].total++;
      if (r.status !== 'vacant') m[r.category].assigned++;
    }
    return m;
  }, [roles]);

  const totalAssigned = useMemo(() => roles.filter(r => r.status !== 'vacant').length, [roles]);

  function field(k: keyof AssignForm, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function openAssign(r: CeremonyRole) {
    setForm(
      r.status !== 'vacant'
        ? { person_name: r.person_name ?? '', company: r.company ?? '', email: r.email ?? '', phone: r.phone ?? '', notes: r.notes ?? '', status: r.status }
        : { ...BLANK_FORM }
    );
    setOpenId(r.id);
    setError(null);
  }

  function closeForm() {
    setOpenId(null);
    setForm(BLANK_FORM);
    setError(null);
  }

  async function saveAssignment(roleId: number) {
    if (!form.person_name.trim()) { setError('Person / group name is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      const res  = await fetch(`/api/organiser/ceremony-roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status: form.status || 'pending' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setRoles(prev => prev.map(r => r.id === roleId ? { ...r, ...data.role } : r));
      closeForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function clearAssignment(roleId: number) {
    if (!confirm('Clear this role assignment and mark it vacant?')) return;
    const res  = await fetch(`/api/organiser/ceremony-roles/${roleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ person_name: null, company: null, email: null, phone: null, notes: null, status: 'vacant' }),
    });
    const data = await res.json();
    if (res.ok) setRoles(prev => prev.map(r => r.id === roleId ? { ...r, ...data.role } : r));
  }

  return (
    <div className="space-y-6">
      {/* Event selector + search */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <select
            value={eventId ?? ''}
            onChange={e => { setEventId(Number(e.target.value)); closeForm(); }}
            className="appearance-none rounded-xl border border-white/10 bg-white/[0.04] pl-4 pr-10 py-2.5 text-sm text-white focus:border-gold/40 focus:outline-none"
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id} className="bg-slate-900">{ev.title}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search roles, people, company…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none rounded-xl border border-white/10 bg-white/[0.04] pl-4 pr-10 py-2.5 text-sm text-white focus:border-gold/40 focus:outline-none"
          >
            <option value="all"       className="bg-slate-900">All statuses</option>
            <option value="vacant"    className="bg-slate-900">Vacant</option>
            <option value="pending"   className="bg-slate-900">Pending</option>
            <option value="confirmed" className="bg-slate-900">Confirmed</option>
            <option value="cancelled" className="bg-slate-900">Cancelled</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        </div>

        <span className="ml-auto text-xs text-white/35">
          {totalAssigned} of {roles.length} roles assigned
        </span>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CEREMONY_ROLE_CATEGORIES.map(cat => {
          const meta    = CAT_META[cat.label] ?? CAT_META['Ceremony & Protocol'];
          const CatIcon = meta.icon;
          const counts  = assignedByCategory[cat.label];
          const active  = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => { setActiveTab(cat.id); closeForm(); }}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                active
                  ? 'bg-gold-gradient text-ink shadow-gold-sm'
                  : 'glass text-white/65 hover:border-gold/30 hover:text-white'
              }`}
            >
              <CatIcon className="h-3.5 w-3.5" />
              {cat.label}
              {counts && counts.assigned > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-ink/20' : 'bg-gold/15 text-gold'}`}>
                  {counts.assigned}/{counts.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active category panel */}
      <div className={`rounded-2xl border ${activeMeta.border} bg-white/[0.02]`}>
        {/* Panel header */}
        <div className={`flex items-center gap-3 border-b border-white/8 px-6 py-4`}>
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${activeMeta.bg} ${activeMeta.color}`}>
            <ActiveIcon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">{activeCat.label}</h2>
            <p className="text-[11px] text-white/40">
              {(assignedByCategory[activeCat.label]?.assigned ?? 0)} assigned
              &nbsp;·&nbsp;
              {(assignedByCategory[activeCat.label]?.total ?? activeCat.roles.length)} roles
            </p>
          </div>
        </div>

        {/* Roles list */}
        <div className="divide-y divide-white/[0.06]">
          {loading ? (
            <p className="px-6 py-10 text-center text-sm text-white/30">Loading…</p>
          ) : visibleRoles.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <ActiveIcon className={`mx-auto h-8 w-8 mb-3 ${activeMeta.color} opacity-30`} />
              <p className="text-sm text-white/30">
                {search || statusFilter !== 'all' ? 'No matches found.' : 'No roles found.'}
              </p>
            </div>
          ) : (
            visibleRoles.map(r => {
              const st     = STATUS_STYLES[r.status] ?? STATUS_STYLES.vacant;
              const StIcon = st.icon;
              const isOpen = openId === r.id;

              return (
                <div key={r.id} className={isOpen ? 'bg-gold/[0.02]' : ''}>
                  {/* Role row */}
                  <div className={`flex items-start gap-4 px-6 py-4 transition-colors ${!isOpen ? 'hover:bg-white/[0.015]' : ''}`}>
                    <div className="min-w-0 flex-1">
                      {/* Role name + status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm font-semibold ${activeMeta.color}`}>{r.role}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${st.cls}`}>
                          <StIcon className="h-3 w-3" />
                          {st.label}
                        </span>
                      </div>

                      {/* Description */}
                      {r.description && (
                        <p className="mt-1 text-xs leading-relaxed text-white/45 max-w-2xl">{r.description}</p>
                      )}

                      {/* Additional details / warning */}
                      {r.additional_details && (
                        <div className="mt-1.5 flex items-start gap-1.5">
                          {r.additional_details.startsWith('⚠') ? (
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                          ) : (
                            <Info className="mt-0.5 h-3 w-3 shrink-0 text-sky-400" />
                          )}
                          <p className={`text-[11px] leading-snug ${r.additional_details.startsWith('⚠') ? 'text-amber-400/70' : 'text-sky-400/70'}`}>
                            {r.additional_details.replace(/^[⚠ ]+/, '')}
                          </p>
                        </div>
                      )}

                      {/* Assigned person info */}
                      {r.status !== 'vacant' && r.person_name && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-white">{r.person_name}</p>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                            {r.company && <span className="text-xs text-white/40">{r.company}</span>}
                            {r.email   && <a href={`mailto:${r.email}`} className="text-xs text-gold/55 hover:text-gold">{r.email}</a>}
                            {r.phone   && <span className="text-xs text-white/40">{r.phone}</span>}
                          </div>
                          {r.notes && (
                            <p className="mt-0.5 text-xs text-white/30 line-clamp-1">{r.notes}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1 pt-0.5">
                      {r.status === 'vacant' ? (
                        <button
                          onClick={() => openAssign(r)}
                          disabled={isOpen}
                          className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/8 px-3 py-1.5 text-[11px] font-semibold text-gold transition hover:bg-gold/15 disabled:opacity-50"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Assign
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => openAssign(r)}
                            disabled={isOpen}
                            className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/5 hover:text-gold"
                            title="Edit assignment"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => clearAssignment(r.id)}
                            className="rounded-lg p-1.5 text-white/30 transition hover:bg-red-500/10 hover:text-red-400"
                            title="Clear assignment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inline assign / edit form */}
                  {isOpen && (
                    <div className="border-t border-gold/10 bg-gold/[0.015] px-6 pb-5 pt-4">
                      <p className="mb-4 text-xs font-semibold text-gold/70 uppercase tracking-wider">
                        {r.status === 'vacant' ? `Assign Person — ${r.role}` : `Edit Assignment — ${r.role}`}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Person name */}
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-white/50">Person / Group Name *</label>
                          <input
                            type="text"
                            value={form.person_name}
                            onChange={e => field('person_name', e.target.value)}
                            placeholder="e.g. John Smith"
                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none"
                            autoFocus
                          />
                        </div>
                        {/* Company */}
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-white/50">Company / Agency</label>
                          <input
                            type="text"
                            value={form.company}
                            onChange={e => field('company', e.target.value)}
                            placeholder="e.g. Elite Events Ltd"
                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none"
                          />
                        </div>
                        {/* Status */}
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-white/50">Status</label>
                          <select
                            value={form.status}
                            onChange={e => field('status', e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-gold/40 focus:outline-none"
                          >
                            <option value="pending"   className="bg-slate-900">Pending</option>
                            <option value="confirmed" className="bg-slate-900">Confirmed</option>
                            <option value="cancelled" className="bg-slate-900">Cancelled</option>
                          </select>
                        </div>
                        {/* Email */}
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-white/50">Email</label>
                          <input
                            type="email"
                            value={form.email}
                            onChange={e => field('email', e.target.value)}
                            placeholder="contact@example.com"
                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none"
                          />
                        </div>
                        {/* Phone */}
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-white/50">Phone</label>
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={e => field('phone', e.target.value)}
                            placeholder="+44 7700 000000"
                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none"
                          />
                        </div>
                        {/* Notes */}
                        <div className="sm:col-span-2 lg:col-span-3">
                          <label className="mb-1 block text-xs font-semibold text-white/50">Notes</label>
                          <textarea
                            value={form.notes}
                            onChange={e => field('notes', e.target.value)}
                            rows={2}
                            placeholder="Performance time, requirements, fees, special instructions…"
                            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none"
                          />
                        </div>
                      </div>

                      {error && (
                        <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>
                      )}

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => saveAssignment(r.id)}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-bold text-ink shadow-gold-sm transition hover:opacity-90 disabled:opacity-50"
                        >
                          <Save className="h-3.5 w-3.5" />
                          {saving ? 'Saving…' : 'Save Assignment'}
                        </button>
                        <button
                          onClick={closeForm}
                          className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2.5 text-xs font-semibold text-white/60 transition hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
