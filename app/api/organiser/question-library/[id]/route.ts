import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  const options = Array.isArray(body.options) ? body.options : null;

  const { rows } = await query(
    `UPDATE question_library SET
       question_text  = COALESCE($1, question_text),
       question_type  = COALESCE($2, question_type),
       field_type     = COALESCE($3, field_type),
       options        = COALESCE($4::jsonb, options),
       is_required    = COALESCE($5, is_required),
       display_order  = COALESCE($6, display_order),
       is_active      = COALESCE($7, is_active),
       updated_at     = now()
     WHERE id = $8
     RETURNING *`,
    [
      body.question_text ?? null,
      body.question_type ?? null,
      body.field_type ?? null,
      options ? JSON.stringify(options) : null,
      body.is_required ?? null,
      body.display_order ?? null,
      body.is_active ?? null,
      Number(id),
    ],
  );
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ question: rows[0] });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await query(`DELETE FROM question_library WHERE id = $1`, [Number(id)]);
  return NextResponse.json({ ok: true });
}
