import { redirect, notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { AgendaFormClient } from '@/components/organiser/AgendaFormClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function NewAgendaPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const { id } = await params;
  const siteId = await getSiteId();

  const { rows } = await query<{ id: number; title: string }>(
    `SELECT id, title FROM events WHERE id = $1 AND site_id = $2`,
    [Number(id), siteId],
  );
  if (!rows[0]) notFound();

  const { rows: siteRows } = await query<{ id: number }>(
    `SELECT id FROM sites WHERE id = $1`,
    [siteId],
  );

  return (
    <div className="min-h-screen bg-ink grain pt-24">
      <div className="container-luxe section-pad py-12">
        <OrganiserNav />

        <div className="mb-8">
          <Link
            href={`/organiser/events/${id}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-gold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Event
          </Link>
          <h1 className="font-display text-2xl font-semibold text-white mt-2">Add Agenda</h1>
          <p className="mt-1 text-sm text-white/40">{rows[0].title}</p>
        </div>

        <AgendaFormClient
          eventId={Number(id)}
          siteId={siteRows[0]?.id ?? siteId}
          backUrl={`/organiser/events/${id}`}
        />
      </div>
    </div>
  );
}
