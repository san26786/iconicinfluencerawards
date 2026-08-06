// Organiser-only access to ANY user's "My Awards Profile".
//   GET → { email, profile }   PUT → save that user's profile.
// Mirrors app/api/profile but keyed by the :id in the URL and gated to the
// organiser role.

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

async function requireOrganiser() {
  const session = await getSessionUser();
  if (!session || session.role !== 'organiser') return null;
  return session;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOrganiser())) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }
  const numId = Number((await params).id);
  if (!Number.isInteger(numId)) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const { rows } = await query<Row>(
    `SELECT email, first_name, last_name, phone, profile FROM users WHERE id = $1`,
    [numId],
  );
  const u = rows[0];
  if (!u) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  return NextResponse.json({ email: u.email, profile: profileFromRow(u) });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOrganiser())) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }
  const numId = Number((await params).id);
  if (!Number.isInteger(numId)) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const profile = sanitiseProfile(body);
  const { rowCount } = await query(
    `UPDATE users
       SET profile = $1::jsonb, first_name = $2, last_name = $3, phone = $4, updated_at = now()
     WHERE id = $5`,
    [
      JSON.stringify(profile),
      profile.firstName || null,
      profile.lastName || null,
      profile.phone || null,
      numId,
    ],
  );

  if (!rowCount) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
