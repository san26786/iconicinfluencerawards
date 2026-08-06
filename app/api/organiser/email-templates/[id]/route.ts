// Organiser-only: update or delete an email template.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function guard() {
  const s = await getSessionUser();
  return s && s.role === 'organiser' ? s : null;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  const numId = Number((await params).id);
  if (!Number.isInteger(numId)) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const design = Array.isArray(b.design) ? JSON.stringify(b.design) : null;
  const { rowCount } = await query(
    `UPDATE email_templates
       SET name=$1, subject=$2, html=$3, description=$4, design=$5::jsonb, updated_at=now()
     WHERE id=$6`,
    [
      String(b.name ?? '').trim() || 'Untitled template',
      String(b.subject ?? ''),
      String(b.html ?? ''),
      String(b.description ?? '') || null,
      design,
      numId,
    ],
  );
  if (!rowCount) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
  const numId = Number((await params).id);
  if (!Number.isInteger(numId)) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  // Soft delete: keep the row, hide it everywhere by stamping deleted_at.
  const { rowCount } = await query(
    'UPDATE email_templates SET deleted_at = now() WHERE id=$1 AND deleted_at IS NULL',
    [numId],
  );
  if (!rowCount) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
