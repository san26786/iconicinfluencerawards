import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; qId: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, qId } = await params;
  const siteId = await getSiteId();

  const { rows: evRows } = await query(
    `SELECT id FROM events WHERE id = $1 AND site_id = $2`,
    [Number(id), siteId],
  );
  if (!evRows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as {
    question_type?: string;
    question_text?: string;
    field_type?: string;
    options?: string[] | null;
    is_required?: boolean;
    display_order?: number;
    is_active?: boolean;
  };

  const validTypes = ['eligibility', 'application'];
  const validFields = ['yes_no', 'text', 'number', 'select'];

  const { rows } = await query(
    `UPDATE event_questions
        SET question_type  = COALESCE(CASE WHEN $1 = ANY($2::text[]) THEN $1 END, question_type),
            question_text  = COALESCE($3, question_text),
            field_type     = COALESCE(CASE WHEN $4 = ANY($5::text[]) THEN $4 END, field_type),
            options        = CASE WHEN $6::boolean THEN $7 ELSE options END,
            is_required    = COALESCE($8, is_required),
            display_order  = COALESCE($9, display_order),
            is_active      = COALESCE($10, is_active),
            updated_at     = now()
      WHERE id = $11 AND event_id = $12
      RETURNING *`,
    [
      body.question_type ?? null,
      validTypes,
      body.question_text?.trim() ?? null,
      body.field_type ?? null,
      validFields,
      'options' in body,
      body.options ? JSON.stringify(body.options) : null,
      body.is_required  ?? null,
      body.display_order ?? null,
      body.is_active    ?? null,
      Number(qId),
      Number(id),
    ],
  );

  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ question: rows[0] });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; qId: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, qId } = await params;
  const siteId = await getSiteId();

  const { rows: evRows } = await query(
    `SELECT id FROM events WHERE id = $1 AND site_id = $2`,
    [Number(id), siteId],
  );
  if (!evRows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { rowCount } = await query(
    `DELETE FROM event_questions WHERE id = $1 AND event_id = $2`,
    [Number(qId), Number(id)],
  );

  if (!rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
