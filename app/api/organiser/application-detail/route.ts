import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const siteId = await getSiteId();
  const { rows } = await query(
    `SELECT a.*, e.title AS event_title
     FROM applications a
     LEFT JOIN events e ON e.id = a.event_id
     WHERE a.id = $1 AND a.site_id = $2`,
    [id, siteId],
  );
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}
