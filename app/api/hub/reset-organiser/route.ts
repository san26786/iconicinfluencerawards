import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET ?email=x — check if user exists
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { rows: adminRows } = await query<{ hub_admin: boolean }>(
    `SELECT hub_admin FROM users WHERE id = $1`, [user.sub],
  );
  if (!adminRows[0]?.hub_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const email = new URL(req.url).searchParams.get('email') ?? '';
  const { rows } = await query(
    `SELECT id, email, role, is_active FROM users WHERE email = $1`, [email.toLowerCase()],
  );
  return NextResponse.json({ exists: rows.length > 0, user: rows[0] ?? null });
}

// Hub-admin-only: force-reset an organiser account password.
// POST { email, password } — upserts the user unconditionally.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rows: adminRows } = await query<{ hub_admin: boolean }>(
    `SELECT hub_admin FROM users WHERE id = $1`,
    [user.sub],
  );
  if (!adminRows[0]?.hub_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as { email: string; password: string };
  if (!body.email || !body.password || body.password.length < 8) {
    return NextResponse.json({ error: 'email and password (min 8 chars) required' }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const hash = await hashPassword(body.password);

  const { rows } = await query(
    `INSERT INTO users (email, password_hash, role, is_active)
     VALUES ($1, $2, 'organiser', true)
     ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           role = 'organiser',
           is_active = true
     RETURNING id, email, role, is_active`,
    [email, hash],
  );

  return NextResponse.json({ ok: true, user: rows[0] });
}
