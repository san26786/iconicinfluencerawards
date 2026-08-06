import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';
import { query } from '@/lib/db';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { ManageProductsClient } from '@/components/organiser/ManageProductsClient';
import type { QueryResultRow } from 'pg';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Products & Services' };

type EventRow = { id: number; title: string } & QueryResultRow;

export default async function ProductsServicesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') redirect('/login');

  const siteId = await getSiteId();

  const { rows: events } = await query<EventRow>(
    `SELECT id, title FROM events WHERE site_id = $1 AND status != 'cancelled' ORDER BY created_at DESC`,
    [siteId],
  );

  return (
    <div className="min-h-screen bg-ink grain pt-24">
      <div className="container-luxe section-pad py-12">
        <OrganiserNav />

        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-white">Products & Services</h1>
          <p className="mt-1 text-white/50">
            Manage your revenue streams — entry fees, sponsorships, winner products, memberships, and more.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-8 py-16 text-center">
            <p className="text-white/40">No events found. Create an event first under <strong className="text-white/60">Manage Event</strong>.</p>
          </div>
        ) : (
          <ManageProductsClient events={events} />
        )}
      </div>
    </div>
  );
}
