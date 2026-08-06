// Reset-password: consume a valid, unexpired token and set a new password.

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, sha256 } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const token = String(body.token ?? '');
  const password = String(body.password ?? '');

  if (!token) {
    return NextResponse.json({ error: 'Missing reset token.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 },
    );
  }

  const tokenHash = sha256(token);
  const { rows } = await query<{ id: number }>(
    `SELECT id FROM users
     WHERE reset_token_hash = $1 AND reset_token_expires > now()`,
    [tokenHash],
  );
  const user = rows[0];
  if (!user) {
    return NextResponse.json(
      { error: 'This reset link is invalid or has expired.' },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);
  await query(
    `UPDATE users
     SET password_hash = $1,
         reset_token_hash = NULL,
         reset_token_expires = NULL,
         updated_at = now()
     WHERE id = $2`,
    [passwordHash, user.id],
  );

  return NextResponse.json({ ok: true, message: 'Your password has been reset.' });
}
