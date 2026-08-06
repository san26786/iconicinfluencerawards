import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST { domain, logo_url } — hub admin sets logo_url directly in DB
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rows: adminRows } = await query<{ hub_admin: boolean }>(
    `SELECT hub_admin FROM users WHERE id = $1`, [user.sub],
  );
  if (!adminRows[0]?.hub_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { domain, logo_url } = await req.json() as { domain: string; logo_url: string };
  const { rows } = await query(
    `UPDATE sites SET logo_url = $1, updated_at = now() WHERE domain = $2 RETURNING id, domain, logo_url`,
    [logo_url, domain],
  );
  if (!rows[0]) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  return NextResponse.json({ ok: true, site: rows[0] });
}
