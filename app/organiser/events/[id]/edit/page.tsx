import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { ensureOnce } from '@/lib/ensureOnce';
import { getSiteId } from '@/lib/site';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { EventForm, type EventData } from '@/components/organiser/EventForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const { id } = await params;
  const siteId = await getSiteId();

  // Ensure columns added after initial schema creation exist
  // (once per server process — see lib/ensureOnce).
  await ensureOnce('events-extra-columns', async () => {
    for (const col of ['pre_launch_date', 'nomination_opens','nomination_closes','application_deadline','judging_start','judging_end','winners_announced']) {
      await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS ${col} date`);
    }
    await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true`);
  });

  const { rows } = await query(
    `SELECT id, title, description, event_date, event_date_label, venue,
            venue_address, ticket_url, is_featured, is_public, status,
            pre_launch_date, nomination_opens, nomination_closes, application_deadline,
            judging_start, judging_end, winners_announced
       FROM events WHERE id = $1 AND site_id = $2 LIMIT 1`,
    [id, siteId],
  );
  if (!rows[0]) notFound();

  const event = rows[0] as EventData;

  return (
    <div className="min-h-screen bg-ink grain pt-24">
      <div className="container-luxe section-pad py-12">
        <OrganiserNav />

        <div className="mb-8">
          <Link
            href="/organiser/events"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-gold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All Events
          </Link>
          <h1 className="font-display text-3xl font-semibold text-white">{event.title}</h1>
          <p className="mt-1 text-sm text-white/40">Edit event details</p>
        </div>

        <EventForm initial={event} />
      </div>
    </div>
  );
}
