// Visitor self-registration. Creates a 'visitor' user, signs them in by
// setting the session cookie, and returns the public user shape.
//
// Organiser accounts are NOT created here — they are seeded via migration.

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  hashPassword,
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
} from '@/lib/auth';
import { getSite } from '@/lib/site';
import { sendTemplateEmail } from '@/lib/email/system';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const firstName = String(body.firstName ?? '').trim();
  const lastName = String(body.lastName ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const phone = String(body.phone ?? '').trim() || null;
  const password = String(body.password ?? '');

  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'Please enter your first and last name.' }, { status: 400 });
  }
  if (!emailOk(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);

  try {
    const { rows } = await query<{ id: number; email: string; role: 'visitor' | 'organiser' }>(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, 'visitor', $3, $4, $5)
       RETURNING id, email, role`,
      [email, passwordHash, firstName, lastName, phone],
    );
    const user = rows[0];

    // Welcome email (editable template, slug 'welcome'). Never throws.
    // prefill → {{nominationLink}} opens the nomination form with their details.
    const site = await getSite();
    await sendTemplateEmail(
      'welcome',
      email,
      { firstName, lastName, email },
      { prefill: { source: 'user', refId: user.id }, site },
    );

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, role: user.role, firstName, lastName },
    });
    res.cookies.set(SESSION_COOKIE, createSessionToken(user), sessionCookieOptions);
    return res;
  } catch (err: unknown) {
    // 23505 = unique_violation (email already registered)
    if (typeof err === 'object' && err && (err as { code?: string }).code === '23505') {
      return NextResponse.json(
        { error: 'An account with that email already exists.' },
        { status: 409 },
      );
    }
    console.error('[/api/auth/register] failed', err);
    return NextResponse.json({ error: 'Could not create your account.' }, { status: 500 });
  }
}
