// The signed-in user's own "My Awards Profile".
//   GET → { email, profile }   PUT → save profile (and mirror name/phone onto
//   the account columns so the header/dashboard stay in sync).

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { profileFromRow, sanitiseProfile } from '@/lib/profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Row = {
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  profile: unknown;
};

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const { rows } = await query<Row>(
    `SELECT email, first_name, last_name, phone, profile FROM users WHERE id = $1`,
    [session.sub],
  );
  const u = rows[0];
  if (!u) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  return NextResponse.json({ email: u.email, profile: profileFromRow(u) });
}

export async function PUT(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const profile = sanitiseProfile(body);
  await query(
    `UPDATE users
       SET profile = $1::jsonb, first_name = $2, last_name = $3, phone = $4, updated_at = now()
     WHERE id = $5`,
    [
      JSON.stringify(profile),
      profile.firstName || null,
      profile.lastName || null,
      profile.phone || null,
      session.sub,
    ],
  );

  return NextResponse.json({ ok: true });
}
