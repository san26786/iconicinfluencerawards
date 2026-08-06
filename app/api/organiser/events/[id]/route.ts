import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';

async function guard() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return null;
  return user;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await guard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const siteId = await getSiteId();
    const { id } = await params;
    // Ensure columns added after initial schema creation exist
    for (const col of ['pre_launch_date', 'nomination_opens','nomination_closes','application_deadline','judging_start','judging_end','winners_announced']) {
      await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS ${col} date`).catch(() => {});
    }
    await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true`).catch(() => {});
    const body = await req.json();
    const {
      title, description, event_date, event_date_label, venue, venue_address, ticket_url,
      is_featured, is_public, status,
      pre_launch_date,
      nomination_opens, nomination_closes, application_deadline, judging_start, judging_end, winners_announced,
    } = body;
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });

    const { rows } = await query(
      `UPDATE events SET
         title=$3, description=$4, event_date=$5, event_date_label=$6,
         venue=$7, venue_address=$8, ticket_url=$9, is_featured=$10, is_public=$11, status=$12,
         pre_launch_date=$13,
         nomination_opens=$14, nomination_closes=$15, application_deadline=$16,
         judging_start=$17, judging_end=$18, winners_announced=$19,
         updated_at=now()
       WHERE id=$1 AND site_id=$2 RETURNING *`,
      [id, siteId, title.trim(), description ?? null, event_date ?? null, event_date_label ?? null,
       venue ?? null, venue_address ?? null, ticket_url ?? null, is_featured ?? false, is_public ?? true, status ?? 'upcoming',
       pre_launch_date || null,
       nomination_opens || null, nomination_closes || null, application_deadline || null,
       judging_start || null, judging_end || null, winners_announced || null],
    );
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await guard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const siteId = await getSiteId();
    const { id } = await params;
    await query(`DELETE FROM events WHERE id=$1 AND site_id=$2`, [id, siteId]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
