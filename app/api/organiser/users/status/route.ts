// Organiser-only: activate / deactivate one or many users in a single call.
// Deactivated users can't log in (enforced in app/api/auth/login). Organiser
// accounts are never affected — the filter is scoped to role='visitor' so an
// organiser can't accidentally lock themselves out.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== 'organiser') {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }

  let body: { ids?: unknown; active?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const ids = Array.isArray(body.ids)
    ? Array.from(new Set(body.ids.map(Number).filter((n) => Number.isInteger(n))))
    : [];
  const active = body.active === true;

  if (ids.length === 0) {
    return NextResponse.json({ error: 'No users selected.' }, { status: 400 });
  }

  const { rowCount } = await query(
    `UPDATE users
       SET is_active = $1, updated_at = now()
     WHERE id = ANY($2::int[]) AND role = 'visitor'`,
    [active, ids],
  );

  return NextResponse.json({ ok: true, updated: rowCount ?? 0, active });
}
