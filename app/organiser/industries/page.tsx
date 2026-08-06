import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { ensureOnce } from '@/lib/ensureOnce';
import { getSiteId } from '@/lib/site';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { IndustriesClient } from '@/components/organiser/IndustriesClient';
import type { QueryResultRow } from 'pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Event Industries' };

type IndustryRow = {
  id: number; name: string; code: string | null;
  description: string | null; created_at: string;
} & QueryResultRow;

export default async function IndustriesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') redirect('/login');

  // Ensure table exists (once per server process — see lib/ensureOnce).
  await ensureOnce('industries', () =>
    query(`
      CREATE TABLE IF NOT EXISTS industries (
        id SERIAL PRIMARY KEY,
        site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
        name TEXT NOT NULL, code TEXT, description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `).then(() => {}),
  );

  const siteId = await getSiteId();
  const { rows } = await query<IndustryRow>(
    `SELECT id, name, code, description, created_at FROM industries WHERE site_id=$1 ORDER BY name`,
    [siteId],
  );

  return (
    <main className="min-h-screen bg-ink grain px-5 pb-20 pt-24">
      <OrganiserNav />
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-luxe text-gold">Organiser</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-white">Event Industries</h1>
          <p className="mt-1 text-sm text-white/50">Add, edit or remove industry categories for this site.</p>
        </div>
        <IndustriesClient industries={rows} siteId={siteId} />
      </div>
    </main>
  );
}
