// Organiser-only: directly set a user's password (no current-password needed).

import { NextResponse } from 'next/server';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== 'organiser') {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }

  const numId = Number((await params).id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const password = String(body.password ?? '');
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  // Clear any outstanding reset token — the password is now known-good.
  const { rowCount } = await query(
    `UPDATE users
       SET password_hash = $1, reset_token_hash = NULL, reset_token_expires = NULL, updated_at = now()
     WHERE id = $2`,
    [passwordHash, numId],
  );

  if (!rowCount) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true, message: 'Password updated.' });
}
