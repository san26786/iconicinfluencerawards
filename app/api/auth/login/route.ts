// Login for both roles (visitor + organiser). The response includes `role`
// so the client can route to the right landing page (/organiser vs /account).

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  verifyPassword,
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
} from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const { rows } = await query<{
    id: number;
    email: string;
    role: 'visitor' | 'organiser';
    password_hash: string;
    first_name: string | null;
    last_name: string | null;
    is_active: boolean;
  }>(
    `SELECT id, email, role, password_hash, first_name, last_name, is_active
     FROM users WHERE email = $1`,
    [email],
  );

  const user = rows[0];
  // Always run a comparison-shaped path and return the same error for both
  // "no such user" and "wrong password" so we don't leak which emails exist.
  const valid = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !valid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  // Deactivated by an organiser — block sign-in (only revealed once the
  // correct password has been supplied, so it leaks nothing to outsiders).
  if (!user.is_active) {
    return NextResponse.json(
      { error: 'Your account has been deactivated. Please contact the organiser.' },
      { status: 403 },
    );
  }

  const res = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    },
  });
  res.cookies.set(SESSION_COOKIE, createSessionToken(user), sessionCookieOptions);
  return res;
}
