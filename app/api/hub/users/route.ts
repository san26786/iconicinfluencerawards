import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireHubAdmin() {
  const user = await getSessionUser();
  if (!user) return null;
  const { rows } = await query<{ hub_admin: boolean }>(
    `SELECT hub_admin FROM users WHERE id = $1`,
    [user.sub],
  );
  return rows[0]?.hub_admin ? user : null;
}

export async function POST(req: Request) {
  const admin = await requireHubAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { email: string; password: string; role?: string; first_name?: string; last_name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!body.email?.trim()) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  if (!body.password || body.password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

  const email = body.email.trim().toLowerCase();
  const role = body.role === 'organiser' ? 'organiser' : 'visitor';

  try {
    const hash = await hashPassword(body.password);
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = $3, is_active = true
       RETURNING id, email, role`,
      [email, hash, role, body.first_name?.trim() || null, body.last_name?.trim() || null],
    );
    return NextResponse.json({ user: rows[0] }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    return NextResponse.json({ error: `Failed to create user: ${msg}` }, { status: 500 });
  }
}
