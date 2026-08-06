import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { ensureOnce } from '@/lib/ensureOnce';
import { getSiteId } from '@/lib/site';
import { seedCeremonyRoles } from '@/lib/seedCeremonyRoles';

export const runtime = 'nodejs';

async function guard() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return null;
  return user;
}

function ensureColumns() {
  return ensureOnce('events-extra-columns', async () => {
    for (const col of ['pre_launch_date', 'nomination_opens', 'nomination_closes', 'application_deadline', 'judging_start', 'judging_end', 'winners_announced']) {
      await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS ${col} date`);
    }
    await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true`);
  });
}

export async function GET() {
  if (!await guard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const siteId = await getSiteId();
    await ensureColumns();
    const { rows } = await query(
      `SELECT id, title, description, event_date, event_date_label, venue,
              venue_address, ticket_url, is_featured, is_public, status,
              pre_launch_date, nomination_opens, nomination_closes, application_deadline,
              judging_start, judging_end, winners_announced, created_at
         FROM events WHERE site_id = $1 ORDER BY event_date ASC NULLS LAST, created_at DESC`,
      [siteId],
    );
    return NextResponse.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!await guard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const siteId = await getSiteId();
    await ensureColumns();
    const body = await req.json();
    const {
      title, description, event_date, event_date_label, venue, venue_address, ticket_url,
      is_featured, is_public, status,
      pre_launch_date,
      nomination_opens, nomination_closes, application_deadline, judging_start, judging_end, winners_announced,
    } = body;
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });

    const { rows } = await query(
      `INSERT INTO events (site_id, title, description, event_date, event_date_label,
                           venue, venue_address, ticket_url, is_featured, is_public, status,
                           pre_launch_date,
                           nomination_opens, nomination_closes, application_deadline,
                           judging_start, judging_end, winners_announced)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [siteId, title.trim(), description ?? null, event_date ?? null, event_date_label ?? null,
       venue ?? null, venue_address ?? null, ticket_url ?? null, is_featured ?? false, is_public ?? true, status ?? 'upcoming',
       pre_launch_date || null,
       nomination_opens || null, nomination_closes || null, application_deadline || null,
       judging_start || null, judging_end || null, winners_announced || null],
    );
    // Seed ceremony roles for the new event (non-blocking)
    seedCeremonyRoles(siteId, rows[0].id).catch(() => {});

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
