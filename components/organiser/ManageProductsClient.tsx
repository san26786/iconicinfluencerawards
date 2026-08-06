'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ChevronDown, Search, Save, ChevronRight,
  FileText, Trophy, Handshake, Network, Store, Megaphone, Ticket,
  Scale, Mic, Music, Newspaper, Radio, Crown, GraduationCap, Users,
  Briefcase, ShoppingBag, BookOpen, Target, BarChart2, BadgeCheck,
  Key, Monitor, Bot, Shirt, Star, Share2, LineChart, Download,
  CalendarDays, PoundSterling, CheckCircle, XCircle,
} from 'lucide-react';
import { PRODUCTS_SERVICES_CATEGORIES } from '@/lib/productsServicesData';

const CAT_ICONS: Record<string, React.ElementType> = {
  'Revenue from Nominees & Applicants': FileText,
  'Revenue from Winners':               Trophy,
  'Revenue from Sponsors':              Handshake,
  'Revenue from Partners':              Network,
  'Revenue from Exhibitors':            Store,
  'Revenue from Advertisers':           Megaphone,
  'Revenue from Attendees':             Ticket,
  'Revenue from Judges':                Scale,
  'Revenue from Speakers':              Mic,
  'Revenue from Performers':            Music,
  'Revenue from Media':                 Newspaper,
  'Revenue from Live Streaming':        Radio,
  'Memberships':                        Crown,
  'Education':                          GraduationCap,
  'Community':                          Users,
  'Recruitment':                        Briefcase,
  'Marketplace':                        ShoppingBag,
  'Awards Directory':                   BookOpen,
  'Lead Generation':                    Target,
  'Reports':                            BarChart2,
  'Certification':                      BadgeCheck,
  'Licensing':                          Key,
  'White Label Platform':               Monitor,
  'AI Services':                        Bot,
  'Merchandise':                        Shirt,
  'VIP Experiences':                    Star,
  'Networking':                         Share2,
  'Data & Analytics':                   LineChart,
  'Digital Assets':                     Download,
  'Year-Round Events':                  CalendarDays,
};

export type ProductRow = {
  id: number;
  event_id: number;
  category: string;
  subcategory: string;
  name: string;
  price: string | null;
  currency: string;
  status: 'active' | 'inactive';
  notes: string | null;
};

type EventOption = { id: number; title: string };

type DraftMap = Record<number, { price: string; status: string; notes: string; dirty: boolean }>;

export function ManageProductsClient({ events }: { events: EventOption[] }) {
  const [eventId, setEventId]   = useState<number | null>(events[0]?.id ?? null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState(PRODUCTS_SERVICES_CATEGORIES[0].id);
  const [search, setSearch]     = useState('');
  const [drafts, setDrafts]     = useState<DraftMap>({});
  const [saving, setSaving]     = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const activeCat = PRODUCTS_SERVICES_CATEGORIES.find(c => c.id === activeTab)!;
  const CatIcon   = CAT_ICONS[activeCat.label] ?? FileText;

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setDrafts({});
    fetch(`/api/organiser/products-services?event_id=${eventId}`)
      .then(r => r.json())
      .then(d => setProducts(d.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [eventId]);

  function getDraft(p: ProductRow) {
    return drafts[p.id] ?? { price: p.price ?? '', status: p.status, notes: p.notes ?? '', dirty: false };
  }

  function setDraft(id: number, key: string, val: string, p: ProductRow) {
    setDrafts(prev => {
      const base = prev[id] ?? { price: p.price ?? '', status: p.status, notes: p.notes ?? '', dirty: false };
      const next = { ...base, [key]: val };
      next.dirty = next.price !== (p.price ?? '') || next.status !== p.status || next.notes !== (p.notes ?? '');
      return { ...prev, [id]: next };
    });
  }

  async function save(p: ProductRow) {
    const d = getDraft(p);
    setSaving(p.id);
    try {
      const res  = await fetch(`/api/organiser/products-services/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: d.price ? Number(d.price) : null, status: d.status, notes: d.notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts(prev => prev.map(r => r.id === p.id ? { ...r, ...data.product } : r));
      setDrafts(prev => { const n = { ...prev }; delete n[p.id]; return n; });
    } finally {
      setSaving(null);
    }
  }

  const visibleProducts = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p => {
      if (p.category !== activeCat.label) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.subcategory.toLowerCase().includes(q);
    });
  }, [products, activeCat, search]);

  const activeCountByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of products) {
      if (p.status === 'active') m[p.category] = (m[p.category] ?? 0) + 1;
    }
    return m;
  }, [products]);

  const subcategories = useMemo(() => {
    const map: Record<string, ProductRow[]> = {};
    for (const p of visibleProducts) {
      if (!map[p.subcategory]) map[p.subcategory] = [];
      map[p.subcategory].push(p);
    }
    return map;
  }, [visibleProducts]);

  const totalActive = products.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <select
            value={eventId ?? ''}
            onChange={e => setEventId(Number(e.target.value))}
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
            placeholder="Search products & services…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none"
          />
        </div>

        <span className="ml-auto text-xs text-white/35">
          {totalActive} of {products.length} items active
        </span>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {PRODUCTS_SERVICES_CATEGORIES.map(cat => {
          const Icon   = CAT_ICONS[cat.label] ?? FileText;
          const active = activeTab === cat.id;
          const count  = activeCountByCategory[cat.label] ?? 0;
          return (
            <button
              key={cat.id}
              onClick={() => { setActiveTab(cat.id); setSearch(''); }}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                active
                  ? 'bg-gold-gradient text-ink shadow-gold-sm'
                  : 'glass text-white/65 hover:border-gold/30 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-ink/20' : 'bg-gold/15 text-gold'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3 border-b border-white/8 px-6 py-4">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-gold">
            <CatIcon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">{activeCat.label}</h2>
            <p className="text-[11px] text-white/40">
              {activeCountByCategory[activeCat.label] ?? 0} active
              &nbsp;·&nbsp;
              {visibleProducts.length} items
            </p>
          </div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {loading ? (
            <p className="px-6 py-10 text-center text-sm text-white/30">Loading…</p>
          ) : visibleProducts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CatIcon className="mx-auto h-8 w-8 mb-3 text-gold opacity-20" />
              <p className="text-sm text-white/30">{search ? 'No matches found.' : 'No items found.'}</p>
            </div>
          ) : (
            Object.entries(subcategories).map(([subName, items]) => (
              <div key={subName}>
                <div className="px-6 py-3 bg-white/[0.015]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/35">{subName}</p>
                </div>
                {items.map(p => {
                  const d        = getDraft(p);
                  const isActive = d.status === 'active';
                  const isExp    = expanded[p.id] ?? false;
                  return (
                    <div key={p.id} className="px-6 py-3 hover:bg-white/[0.015] transition-colors">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Name */}
                        <span className="flex-1 min-w-0 text-sm text-white/80 truncate">{p.name}</span>

                        {/* Price */}
                        <div className="relative flex items-center">
                          <PoundSterling className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-white/30" />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={d.price}
                            onChange={e => setDraft(p.id, 'price', e.target.value, p)}
                            placeholder="Price"
                            className="w-28 rounded-lg border border-white/10 bg-white/[0.04] pl-7 pr-3 py-1.5 text-xs text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none"
                          />
                        </div>

                        {/* Status toggle */}
                        <button
                          onClick={() => setDraft(p.id, 'status', isActive ? 'inactive' : 'active', p)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                            isActive
                              ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-400'
                              : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/60'
                          }`}
                        >
                          {isActive
                            ? <><CheckCircle className="h-3 w-3" />Active</>
                            : <><XCircle className="h-3 w-3" />Inactive</>}
                        </button>

                        {/* Notes toggle */}
                        <button
                          onClick={() => setExpanded(prev => ({ ...prev, [p.id]: !isExp }))}
                          className="rounded-lg p-1.5 text-white/25 hover:text-white/60 transition-colors"
                          title="Notes"
                        >
                          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExp ? 'rotate-90' : ''}`} />
                        </button>

                        {/* Save */}
                        {d.dirty && (
                          <button
                            onClick={() => save(p)}
                            disabled={saving === p.id}
                            className="inline-flex items-center gap-1 rounded-full bg-gold-gradient px-3 py-1.5 text-[11px] font-bold text-ink shadow-gold-sm transition hover:opacity-90 disabled:opacity-50"
                          >
                            <Save className="h-3 w-3" />
                            {saving === p.id ? 'Saving…' : 'Save'}
                          </button>
                        )}
                      </div>

                      {/* Notes */}
                      {isExp && (
                        <div className="mt-2">
                          <textarea
                            rows={2}
                            value={d.notes}
                            onChange={e => setDraft(p.id, 'notes', e.target.value, p)}
                            placeholder="Notes, pricing details, package info…"
                            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
