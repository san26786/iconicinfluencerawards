// Returns the currently signed-in user (or null). Used by the header to
// decide between the "Sign in" link and the user menu. Names are read fresh
// from the DB so initials/labels stay correct even after a profile change.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ user: null });

  const { rows } = await query<{
    id: number;
    email: string;
    role: 'visitor' | 'organiser' | 'judge';
    first_name: string | null;
    last_name: string | null;
  }>('SELECT id, email, role, first_name, last_name FROM users WHERE id = $1', [session.sub]);

  const u = rows[0];
  if (!u) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: {
      id: u.id,
      email: u.email,
      role: u.role,
      firstName: u.first_name,
      lastName: u.last_name,
    },
  });
}
