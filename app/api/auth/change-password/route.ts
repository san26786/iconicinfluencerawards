// Change password for the signed-in user. Requires the current password.

import { NextResponse } from 'next/server';
import { getSessionUser, verifyPassword, hashPassword } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const currentPassword = String(body.currentPassword ?? '');
  const newPassword = String(body.newPassword ?? '');

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'New password must be at least 8 characters.' },
      { status: 400 },
    );
  }

  const { rows } = await query<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = $1',
    [session.sub],
  );
  const user = rows[0];
  if (!user || !(await verifyPassword(currentPassword, user.password_hash))) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await query(
    'UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2',
    [passwordHash, session.sub],
  );

  return NextResponse.json({ ok: true, message: 'Your password has been changed.' });
}
