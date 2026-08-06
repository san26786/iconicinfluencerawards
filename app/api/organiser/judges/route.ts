import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'pending';
  const siteId = await getSiteId();

  const { rows } = await query(
    `SELECT j.*, u.email AS user_email
       FROM judges j
       LEFT JOIN users u ON u.id = j.user_id
      WHERE j.site_id = $1 AND j.status = $2
      ORDER BY j.applied_at DESC`,
    [siteId, status],
  );

  return NextResponse.json({ judges: rows });
}
