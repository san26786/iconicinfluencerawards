// Organiser-only global suppression list management. Addresses in this table
// are skipped when queueing and re-checked immediately before each send batch.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function guard() {
  const session = await getSessionUser();
  return session && session.role === 'organiser' ? session : null;
}

function cleanEmail(v: unknown): string {
  return String(v ?? '').trim().toLowerCase();
}

export async function POST(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const email = cleanEmail(b.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const { rows } = await query<{
    id: number;
    email: string;
    reason: string;
    created_at: Date;
  }>(
    `INSERT INTO email_suppressions (email, reason)
     VALUES ($1, 'manual')
     ON CONFLICT (email) DO UPDATE SET reason = EXCLUDED.reason, deleted_at = NULL
     RETURNING id, email, reason, created_at`,
    [email],
  );

  return NextResponse.json({ ok: true, suppression: rows[0] });
}

export async function DELETE(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  }

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const email = cleanEmail(b.email);
  if (!email) return NextResponse.json({ error: 'email_required' }, { status: 400 });

  // Soft delete: keep the row for history; a cleared deleted_at means the
  // address is no longer suppressed (and can be re-suppressed later).
  const { rowCount } = await query(
    'UPDATE email_suppressions SET deleted_at = now() WHERE email=$1 AND deleted_at IS NULL',
    [email],
  );
  if (!rowCount) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
