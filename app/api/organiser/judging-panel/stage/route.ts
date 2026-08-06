import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_STAGES = ['submitted', 'reviewing', 'shortlisted', 'semifinalist', 'finalist', 'winner', 'rejected'];

// PATCH — update application stage/status
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const siteId = await getSiteId();
  const body = await req.json() as { applicationId: number; stage: string };

  if (!body.applicationId || !VALID_STAGES.includes(body.stage)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { rows } = await query<{ id: number }>(
    `UPDATE applications SET status = $1 WHERE id = $2 AND site_id = $3 RETURNING id`,
    [body.stage, body.applicationId, siteId],
  );

  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
