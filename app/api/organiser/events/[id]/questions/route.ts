import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function verifyEventOwner(eventId: number, siteId: number) {
  const { rows } = await query(
    `SELECT id FROM events WHERE id = $1 AND site_id = $2`,
    [eventId, siteId],
  );
  return rows[0] ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const siteId = await getSiteId();
  if (!await verifyEventOwner(Number(id), siteId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { rows } = await query(
    `SELECT * FROM event_questions WHERE event_id = $1 ORDER BY question_type, display_order, id`,
    [Number(id)],
  );
  return NextResponse.json({ questions: rows });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const siteId = await getSiteId();
  if (!await verifyEventOwner(Number(id), siteId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as {
    question_type?: string;
    question_text?: string;
    field_type?: string;
    options?: string[];
    is_required?: boolean;
    display_order?: number;
  };

  if (!body.question_text?.trim()) return NextResponse.json({ error: 'Question text is required.' }, { status: 400 });

  const validTypes = ['eligibility', 'application'];
  const validFields = ['yes_no', 'text', 'number', 'select'];
  const qType = validTypes.includes(body.question_type ?? '') ? body.question_type : 'eligibility';
  const fType = validFields.includes(body.field_type ?? '') ? body.field_type : 'yes_no';

  const { rows } = await query(
    `INSERT INTO event_questions
       (event_id, question_type, question_text, field_type, options, is_required, display_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      Number(id),
      qType,
      body.question_text.trim(),
      fType,
      body.options ? JSON.stringify(body.options) : null,
      body.is_required ?? true,
      body.display_order ?? 0,
    ],
  );
  return NextResponse.json({ question: rows[0] }, { status: 201 });
}
