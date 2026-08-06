'use client';

import { useMemo, useState } from 'react';
import { Search, Star, ChevronDown, ChevronUp, X, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Icon, type IconName } from '@/components/ui/Icon';
import { NOMINATION_STORAGE_KEY } from '@/lib/content';

export type DbCategoryItem = {
  id: number;
  name: string;
  description: string | null;
  tagline: string | null;
  short_summary: string | null;
  eligibility: string | null;
  promo: boolean;
  display_order: number;
  theme_id: number;
  theme_name: string;
  theme_icon: string;
  theme_tagline: string | null;
  theme_order: number;
};

type ThemeGroup = {
  theme_id: number;
  theme_name: string;
  theme_icon: string;
  theme_tagline: string | null;
  popular: DbCategoryItem[];
  prime: DbCategoryItem[];
};

const POPULAR_LIMIT = 7;
const PRIME_LIMIT = 5;

function presetCategories(list: string[]) {
  try { sessionStorage.setItem(NOMINATION_STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export function EventCategoriesExplorer({ items }: { items: DbCategoryItem[] }) {
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<DbCategoryItem | null>(null);

  const groups = useMemo<ThemeGroup[]>(() => {
    const map = new Map<number, ThemeGroup>();
    for (const item of items) {
      if (!map.has(item.theme_id)) {
        map.set(item.theme_id, {
          theme_id:     item.theme_id,
          theme_name:   item.theme_name,
          theme_icon:   item.theme_icon,
          theme_tagline: item.theme_tagline,
          popular: [],
          prime:   [],
        });
      }
      const g = map.get(item.theme_id)!;
      if (item.promo) g.popular.push(item);
      else g.prime.push(item);
    }
    return Array.from(map.values());
  }, [items]);

  const isSearching = q.trim().length > 0;

  const filtered = useMemo(() => {
    if (!isSearching) return groups;
    const lower = q.trim().toLowerCase();
    const match = (c: DbCategoryItem) =>
      c.name.toLowerCase().includes(lower) ||
      (c.description ?? '').toLowerCase().includes(lower) ||
      (c.tagline ?? '').toLowerCase().includes(lower);
    return groups
      .map(g => ({ ...g, popular: g.popular.filter(match), prime: g.prime.filter(match) }))
      .filter(g => g.popular.length > 0 || g.prime.length > 0);
  }, [q, groups, isSearching]);

  const total = groups.reduce((n, g) => n + g.popular.length + g.prime.length, 0);

  const jump = (id: number) => {
    const el = document.getElementById(`theme-${id}`);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
  };

  const toggleExpand = (id: number) =>
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const nominate = (cats: string[]) => {
    presetCategories(cats);
    window.location.href = '/register-interest';
  };

  return (
    <div className="relative bg-ink">
      {/* ── Search + jump nav ────────────────────────────────────────────── */}
      <section className="relative bg-slate950 py-12 lg:py-16">
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px] hidden sm:block" />
        <div className="container-luxe section-pad relative mx-auto max-w-3xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gold/50" />
            <input
              type="search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search categories… e.g. 'photography', 'startup', 'innovation'"
              className="w-full rounded-full border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-5 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {groups.map(g => (
              <button
                key={g.theme_id}
                type="button"
                onClick={() => jump(g.theme_id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-gold/40 hover:text-gold"
              >
                <Icon name={g.theme_icon as IconName} className="h-3.5 w-3.5" />
                {g.theme_name}
              </button>
            ))}
          </div>

          <p className="mt-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
            {isSearching
              ? `${filtered.reduce((n, g) => n + g.popular.length + g.prime.length, 0)} results`
              : `${total} categories across ${groups.length} theme${groups.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </section>

      {/* ── Theme groups ─────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-24">
        <div className="container-luxe section-pad mx-auto max-w-5xl space-y-20">
          {filtered.length === 0 ? (
            <p className="text-center text-white/40">No categories match your search.</p>
          ) : filtered.map(g => {
            const exp        = expanded.has(g.theme_id) || isSearching;
            const visPopular = exp ? g.popular : g.popular.slice(0, POPULAR_LIMIT);
            const visPrime   = exp ? g.prime   : g.prime.slice(0, PRIME_LIMIT);
            const allCount   = g.popular.length + g.prime.length;
            const hasPromoSplit = g.popular.length > 0 && g.prime.length > 0;

            return (
              <div key={g.theme_id} id={`theme-${g.theme_id}`} className="scroll-mt-28">
                {/* Theme header */}
                <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10 text-gold">
                      <Icon name={g.theme_icon as IconName} className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="font-display text-xl font-semibold text-white">{g.theme_name}</h2>
                      {g.theme_tagline && (
                        <p className="text-xs text-white/45">{g.theme_tagline}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/35">
                      {allCount} {allCount === 1 ? 'category' : 'categories'}
                    </span>
                    <button
                      onClick={() => nominate([...g.popular, ...g.prime].map(c => c.name))}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink shadow-gold-sm transition-all hover:-translate-y-0.5 hover:opacity-90"
                    >
                      Nominate
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Most Popular */}
                {visPopular.length > 0 && (
                  <div className="mb-6">
                    <div className="mb-3 flex items-center gap-1.5">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold">Most Popular</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {visPopular.map(c => (
                        <CategoryCard key={c.id} cat={c} onDetail={setSelected} onNominate={nominate} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Prime Categories */}
                {visPrime.length > 0 && (
                  <div className="mb-4">
                    {hasPromoSplit && (
                      <div className="mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">
                          Prime Categories
                        </span>
                      </div>
                    )}
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {visPrime.map(c => (
                        <CategoryCard key={c.id} cat={c} onDetail={setSelected} onNominate={nominate} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Show all / Collapse */}
                {!isSearching && allCount > POPULAR_LIMIT + PRIME_LIMIT && (
                  <button
                    onClick={() => toggleExpand(g.theme_id)}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-semibold text-white/45 transition-colors hover:border-white/25 hover:text-white/70"
                  >
                    {exp
                      ? <><ChevronUp className="h-3.5 w-3.5" /> Collapse</>
                      : <><ChevronDown className="h-3.5 w-3.5" /> Show all {allCount} categories</>
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Detail modal ─────────────────────────────────────────────────── */}
      {selected && (
        <CategoryModal cat={selected} onClose={() => setSelected(null)} onNominate={nominate} />
      )}
    </div>
  );
}

// ── Category Card ─────────────────────────────────────────────────────────────

function CategoryCard({
  cat,
  onDetail,
  onNominate,
}: {
  cat: DbCategoryItem;
  onDetail: (c: DbCategoryItem) => void;
  onNominate: (cats: string[]) => void;
}) {
  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3.5 transition-all duration-200 hover:border-gold/25 hover:bg-gold/[0.04]">
      <button
        onClick={() => onDetail(cat)}
        className="min-w-0 flex-1 text-left"
      >
        <p className="line-clamp-2 text-sm font-medium leading-snug text-white/80 transition-colors group-hover:text-white">
          {cat.name}
        </p>
      </button>
      <button
        onClick={() => onNominate([cat.name])}
        className="shrink-0 whitespace-nowrap rounded-lg border border-gold/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gold/70 transition-all hover:border-gold hover:bg-gold/10 hover:text-gold"
      >
        Nominate →
      </button>
    </div>
  );
}

// ── Category Detail Modal ─────────────────────────────────────────────────────

function CategoryModal({
  cat,
  onClose,
  onNominate,
}: {
  cat: DbCategoryItem;
  onClose: () => void;
  onNominate: (cats: string[]) => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-slate950 p-7 shadow-2xl max-h-[85vh]">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 transition-colors hover:border-white/25 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Theme tag */}
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold/70">
            {cat.theme_name}
          </p>

          {/* Title */}
          <h3 className="mt-2 font-display text-2xl font-semibold leading-snug text-white pr-8">
            {cat.name}
          </h3>
          {cat.tagline && (
            <p className="mt-1.5 text-sm text-white/55">{cat.tagline}</p>
          )}

          {/* Description — only show if different from tagline */}
          {(cat.short_summary || cat.description) &&
            (cat.short_summary ?? cat.description) !== cat.tagline && (
            <p className="mt-5 text-sm leading-relaxed text-white/65">
              {cat.short_summary ?? cat.description}
            </p>
          )}

          {/* Eligibility */}
          {cat.eligibility && (
            <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/35">
                Eligibility
              </p>
              <p className="text-sm leading-relaxed text-white/60">{cat.eligibility}</p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => onNominate([cat.name])}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient py-3 text-sm font-semibold text-ink shadow-gold transition-all hover:-translate-y-0.5 hover:opacity-90"
            >
              Nominate for this Category
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white/50 transition-colors hover:border-white/25 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
