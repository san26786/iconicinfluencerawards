import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser, hashPassword } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireHubAdmin() {
  const user = await getSessionUser();
  if (!user) return null;
  const { rows } = await query<{ hub_admin: boolean }>(
    `SELECT hub_admin FROM users WHERE id = $1`, [user.sub],
  );
  return rows[0]?.hub_admin ? user : null;
}

export async function POST(req: Request) {
  const admin = await requireHubAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { userId, newPassword } = await req.json();
  if (!userId || !newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'userId and newPassword (min 6 chars) required' }, { status: 400 });
  }

  const hash = await hashPassword(newPassword);
  const { rowCount } = await query(
    `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
    [hash, userId],
  );

  if (!rowCount) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
