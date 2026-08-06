import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { ManageEventsClient } from '@/components/organiser/ManageEventsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Manage Events' };

export default async function EventsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const siteId = await getSiteId();
  const { rows } = await query(
    `SELECT id, title, description, event_date, event_date_label, venue,
            venue_address, ticket_url, is_featured, status, created_at
       FROM events WHERE site_id = $1 ORDER BY event_date ASC NULLS LAST, created_at DESC`,
    [siteId],
  );

  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-20 pt-32 sm:pt-36">
      <div className="mx-auto w-full max-w-4xl">
        <OrganiserNav />
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Organiser</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">Manage Events</h1>
          <p className="mt-2 text-sm text-white/55">
            Add, edit or remove award ceremonies and related events for this site.
          </p>
        </div>
        <ManageEventsClient initialEvents={rows as never} />
      </div>
    </main>
  );
}
