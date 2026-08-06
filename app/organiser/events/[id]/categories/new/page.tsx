import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import EventCategoryForm from '@/components/organiser/EventCategoryForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { QueryResultRow } from 'pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ThemeRow = { id: number; name: string; icon: string } & QueryResultRow;

export default async function NewCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const { id } = await params;
  const siteId = await getSiteId();

  const { rows: evRows } = await query(
    `SELECT id, title FROM events WHERE id = $1 AND site_id = $2`,
    [Number(id), siteId],
  );
  if (!evRows[0]) redirect('/organiser/events');
  const event = evRows[0];

  const { rows: themes } = await query<ThemeRow>(
    `SELECT id, name, icon FROM themes WHERE site_id = $1 ORDER BY display_order, name`,
    [siteId],
  );

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
          <h1 className="font-display text-3xl font-semibold text-white">Add New Category</h1>
          <p className="mt-1 text-sm text-white/40">{event.title}</p>
        </div>

        <div className="max-w-3xl">
          <EventCategoryForm
            eventId={Number(id)}
            themes={themes}
            backHref={backHref}
          />
        </div>
      </div>
    </div>
  );
}
