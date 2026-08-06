import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { AwardNightNav } from '@/components/organiser/AwardNightNav';
import Link from 'next/link';
import { ArrowRight, HelpCircle } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Manage Questions' };

export default async function QuestionsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const siteId = await getSiteId();

  const { rows: events } = await query(
    `SELECT id, title FROM events WHERE site_id = $1 AND status IN ('upcoming','ongoing')
     ORDER BY is_featured DESC, created_at DESC`,
    [siteId],
  );

  return (
    <div className="min-h-screen bg-ink grain pt-24">
      <div className="container-luxe section-pad py-12">
        <OrganiserNav />
        <div className="mb-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Award Night</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">Manage Questions</h1>
          <p className="mt-1 text-sm text-white/40">Select an event to manage its eligibility and application questions.</p>
        </div>
        <AwardNightNav />

        <div className="rounded-3xl glass p-8 space-y-4">
          {events.length === 0 ? (
            <div className="py-12 text-center">
              <HelpCircle className="mx-auto h-10 w-10 text-white/15 mb-3" />
              <p className="text-sm text-white/30">No active events found.</p>
              <Link href="/organiser/events/new"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-2.5 text-sm font-semibold text-ink shadow-gold">
                Create Event
              </Link>
            </div>
          ) : (
            events.map(e => (
              <Link
                key={e.id}
                href={`/organiser/events/${e.id}?tab=questions`}
                className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-4 hover:border-gold/30 hover:bg-white/[0.04] transition-all group"
              >
                <div>
                  <p className="font-medium text-white group-hover:text-gold transition-colors">{e.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">Event ID #{e.id}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-white/30 group-hover:text-gold transition-colors" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
