import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { CategoriesExplorer } from '@/components/CategoriesExplorer';
import { EventCategoriesExplorer, type DbCategoryItem } from '@/components/EventCategoriesExplorer';
import { Reveal } from '@/components/ui/Reveal';
import { getSite, getSiteId } from '@/lib/site';
import { query } from '@/lib/db';
import type { QueryResultRow } from 'pg';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const site = await getSite();
  return {
    title: 'Award Categories',
    description: `Explore every award category at ${site.name}. Find your category and put a name forward.`,
  };
}

type CategoryRow = DbCategoryItem & QueryResultRow;

async function loadDbCategories(siteId: number): Promise<DbCategoryItem[]> {
  try {
    // Ensure optional theme columns exist before querying
    await query(`ALTER TABLE themes ADD COLUMN IF NOT EXISTS linked_site_id integer`).catch(() => {});
    await query(`ALTER TABLE themes ADD COLUMN IF NOT EXISTS linked_site_ids integer[]`).catch(() => {});
    await query(`ALTER TABLE themes ADD COLUMN IF NOT EXISTS logo_url text`).catch(() => {});

    const { rows } = await query<CategoryRow>(
      `SELECT
         ec.id,
         ec.name,
         ec.description,
         ec.tagline,
         ec.short_summary,
         ec.eligibility,
         ec.promo,
         ec.display_order,
         ec.theme_id,
         t.name          AS theme_name,
         t.icon          AS theme_icon,
         t.tagline       AS theme_tagline,
         t.display_order AS theme_order
       FROM event_categories ec
       JOIN events e ON e.id = ec.event_id
       JOIN themes t ON t.id = ec.theme_id
       WHERE ec.is_active = true
         AND e.status != 'cancelled'
         AND (
           e.site_id = $1
           OR t.linked_site_id = $1
           OR $1 = ANY(COALESCE(t.linked_site_ids, '{}'::integer[]))
         )
       ORDER BY t.display_order, t.id, ec.display_order, ec.name`,
      [siteId],
    );
    return rows;
  } catch {
    return [];
  }
}

export default async function CategoriesPage() {
  const [site, siteId] = await Promise.all([getSite(), getSiteId()]);
  const dbCategories = await loadDbCategories(siteId);
  const hasDbCategories = dbCategories.length > 0;

  return (
    <main id="main">
      <PageHero
        eyebrow="The Honours, In Full"
        title={
          <>
            Award <span className="text-gold-gradient">Categories</span>
          </>
        }
        subtitle="Explore every category across our ceremonies. Find where you belong, then put a name forward."
      />

      {hasDbCategories ? (
        <EventCategoriesExplorer items={dbCategories} />
      ) : (
        <CategoriesExplorer />
      )}

      {/* Found your category? */}
      <section className="relative overflow-hidden bg-slate950 py-20 lg:py-24">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/15 blur-[140px] hidden sm:block" />
        <div className="container-luxe section-pad relative mx-auto max-w-3xl text-center">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-tight text-white text-balance">
              Found your <span className="text-gold-gradient">category?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-white/65">
              Put a name forward — completely free, takes minutes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register-interest"
                className="group inline-flex items-center gap-2 rounded-full bg-gold-gradient px-7 py-3.5 text-sm font-semibold text-ink shadow-gold transition-all duration-300 hover:-translate-y-0.5"
              >
                Start Nomination
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/#find-my-award"
                className="inline-flex items-center gap-2 rounded-full glass px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                Find My Award
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
