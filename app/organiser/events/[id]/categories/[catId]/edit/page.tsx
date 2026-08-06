import { redirect, notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import EventCategoryForm from '@/components/organiser/EventCategoryForm';
import type { CategoryFormValues } from '@/components/organiser/EventCategoryForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { QueryResultRow } from 'pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ThemeRow = { id: number; name: string; icon: string } & QueryResultRow;
type CatRow = {
  id: number; event_id: number; name: string; tagline: string | null; short_name: string | null;
  theme_id: number | null; short_summary: string | null; description: string | null;
  eligibility: string | null; judging_criteria: string | null; qualitative_criteria: string | null;
  metrics: string | null; additional_criteria: string | null; icon: string | null;
  entry_fee: string | null; display_order: number; is_active: boolean; promo: boolean;
} & QueryResultRow;

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string; catId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const { id, catId } = await params;
  const siteId = await getSiteId();

  const { rows: evRows } = await query(
    `SELECT id, title FROM events WHERE id = $1 AND site_id = $2`,
    [Number(id), siteId],
  );
  if (!evRows[0]) redirect('/organiser/events');
  const event = evRows[0];

  const [{ rows: cats }, { rows: themes }] = await Promise.all([
    query<CatRow>(
      `SELECT * FROM event_categories WHERE id = $1 AND event_id = $2`,
      [Number(catId), Number(id)],
    ),
    query<ThemeRow>(
      `SELECT id, name, icon FROM themes WHERE site_id = $1 ORDER BY display_order, name`,
      [siteId],
    ),
  ]);

  if (!cats[0]) notFound();
  const cat = cats[0];

  const initialValues: Partial<CategoryFormValues> = {
    name: cat.name,
    tagline: cat.tagline ?? '',
    short_name: cat.short_name ?? '',
    theme_id: cat.theme_id ?? '',
    short_summary: cat.short_summary ?? '',
    description: cat.description ?? '',
    eligibility: cat.eligibility ?? '',
    judging_criteria: cat.judging_criteria ?? '',
    qualitative_criteria: cat.qualitative_criteria ?? '',
    metrics: cat.metrics ?? '',
    additional_criteria: cat.additional_criteria ?? '',
    icon: cat.icon ?? '',
    entry_fee: cat.entry_fee ?? '0',
    display_order: String(cat.display_order),
    is_active: cat.is_active,
    promo: cat.promo,
  };

  const backHref = `/organiser/events/${id}`;

  return (
    <div className="min-h-screen bg-ink grain pt-24">
      <div className="container-luxe section-pad py-12">
        <OrganiserNav />

        <div className="mb-8">
          <Link
            href={backHref}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-gold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to {event.title}
          </Link>
          <h1 className="font-display text-3xl font-semibold text-white">Edit Category</h1>
          <p className="mt-1 text-sm text-white/40">{cat.name}</p>
        </div>

        <div className="max-w-3xl">
          <EventCategoryForm
            eventId={Number(id)}
            categoryId={Number(catId)}
            initialValues={initialValues}
            themes={themes}
            backHref={backHref}
          />
        </div>
      </div>
    </div>
  );
}
