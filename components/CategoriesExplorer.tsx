'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Star, ChevronDown, ArrowUpRight } from 'lucide-react';
import { AWARD_CATEGORIES, NOMINATION_STORAGE_KEY, SITE, IMG } from '@/lib/content';

// Store the picked categories in sessionStorage so the nomination form can
// read them without bloating the URL with a long ?categories=… list.
function presetCategories(list: string[]) {
  try {
    sessionStorage.setItem(NOMINATION_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* sessionStorage unavailable — Link still navigates, form just opens blank */
  }
}
import { Icon, type IconName } from './ui/Icon';

const ALL_TOTAL = AWARD_CATEGORIES.reduce(
  (n, g) => n + g.popular.length + g.prime.length + g.more.length,
  0,
);

export function CategoriesExplorer() {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return AWARD_CATEGORIES.map((g) => ({ ...g, hits: 0 }));
    return AWARD_CATEGORIES.map((g) => {
      const match = (s: string) => s.toLowerCase().includes(q);
      const popular = g.popular.filter(match);
      const prime = g.prime.filter(match);
      const more = g.more.filter(match);
      return { ...g, popular, prime, more, hits: popular.length + prime.length + more.length };
    });
  }, [q]);

  const visibleTotal = q
    ? filtered.reduce((n, g) => n + g.hits, 0)
    : ALL_TOTAL;

  const jump = (id: string) => {
    const el = document.getElementById(`cat-${id}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative bg-ink">
      {/* Search + Jump nav */}
      <section className="relative bg-slate950 py-12 lg:py-16">
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px] hidden sm:block" />
        <div className="container-luxe section-pad relative mx-auto max-w-4xl">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gold">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…  e.g. ‘photography’, ‘startup’, ‘women in tech’"
              aria-label="Search categories"
              className="w-full rounded-full border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-5 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {AWARD_CATEGORIES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => jump(g.id)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
              >
                <Icon name={g.icon as IconName} className="h-3.5 w-3.5 text-gold" />
                {g.name.replace(' Awards', '')}
              </button>
            ))}
          </div>

          <p className="mt-5 text-center text-xs uppercase tracking-luxe text-white/50">
            {q
              ? `${visibleTotal} matching ${visibleTotal === 1 ? 'category' : 'categories'}`
              : `${ALL_TOTAL} categories across ${AWARD_CATEGORIES.length} award${AWARD_CATEGORIES.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </section>

      {/* Groups */}
      <section className="relative bg-ink py-16 lg:py-20">
        <div className="container-luxe section-pad space-y-14">
          {filtered.map((g) => {
            // While searching, reveal everything so matches are not hidden
            const showMore = q ? true : !!expanded[g.id];
            const hide = q && g.hits === 0;
            if (hide) return null;

            return (
              <section key={g.id} id={`cat-${g.id}`} className="scroll-mt-28">
                {/* Banner image header */}
                <div className="relative mb-6 overflow-hidden rounded-2xl h-44 sm:h-52">
                  <Image
                    src={IMG(g.image, 1200, 75)}
                    alt={g.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 900px"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-ink/20" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center px-6 sm:px-8">
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gold-gradient shadow-gold">
                        <Icon name={g.icon as IconName} className="h-6 w-6 text-ink" />
                      </span>
                      <div>
                        <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl drop-shadow-lg">
                          {g.name}
                        </h2>
                        <p className="mt-1 max-w-lg text-sm leading-relaxed text-white/75">{g.blurb}</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-5 flex items-center gap-3">
                    <span className="text-xs uppercase tracking-wider text-white/60">
                      {g.popular.length + g.prime.length + g.more.length} categories
                    </span>
                    <Link
                      href={SITE.nominateUrl}
                      onClick={() => presetCategories([...g.popular, ...g.prime, ...g.more])}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-2 text-xs font-semibold text-ink shadow-gold-sm transition-transform hover:-translate-y-0.5"
                    >
                      Nominate
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Popular */}
                {g.popular.length > 0 && (
                  <>
                    {!q && (
                      <h3 className="mt-7 flex items-center gap-2 text-xs font-semibold uppercase tracking-luxe text-gold">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        Most Popular
                      </h3>
                    )}
                    <ChipGrid items={g.popular} popular />
                  </>
                )}

                {/* Prime */}
                {g.prime.length > 0 && (
                  <>
                    {!q && (
                      <h3 className="mt-6 text-xs font-semibold uppercase tracking-luxe text-white/55">
                        Prime Categories
                      </h3>
                    )}
                    <ChipGrid items={g.prime} />
                  </>
                )}

                {/* More */}
                {g.more.length > 0 && (
                  <>
                    {showMore && (
                      <>
                        {!q && (
                          <h3 className="mt-6 text-xs font-semibold uppercase tracking-luxe text-white/55">
                            All Other Categories
                          </h3>
                        )}
                        <ChipGrid items={g.more} />
                      </>
                    )}
                    {!q && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((s) => ({ ...s, [g.id]: !s[g.id] }))
                        }
                        className="mt-5 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs font-semibold text-white/75 transition-colors hover:border-gold/40 hover:text-gold"
                        aria-expanded={showMore}
                      >
                        {showMore
                          ? `Show fewer categories`
                          : `Show all ${g.popular.length + g.prime.length + g.more.length} categories`}
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            showMore ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </>
                )}
              </section>
            );
          })}

          {q && visibleTotal === 0 && (
            <p className="text-center text-sm text-white/55">
              No categories match your search. Try a different term.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function ChipGrid({ items, popular = false }: { items: string[]; popular?: boolean }) {
  return (
    <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <li
          key={it}
          className={`group flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-colors duration-200 ${
            popular
              ? 'border-gold/30 bg-gold/[0.05] hover:border-gold/60'
              : 'border-white/10 bg-white/[0.025] hover:border-gold/30'
          }`}
        >
          <span className="text-sm font-medium leading-snug text-white">{it}</span>
          <Link
            href={SITE.nominateUrl}
            onClick={() => presetCategories([it])}
            aria-label={`Nominate for ${it}`}
            className="flex-shrink-0 rounded-full bg-gold/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-gold opacity-70 transition-all duration-200 group-hover:bg-gold/25 group-hover:opacity-100"
          >
            Nominate →
          </Link>
        </li>
      ))}
    </ul>
  );
}
