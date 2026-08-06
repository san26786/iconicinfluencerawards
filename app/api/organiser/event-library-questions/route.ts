import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET ?eventId=X — which library questions are assigned to this event
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const eventId = Number(searchParams.get('eventId'));
  if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 });

  const { rows } = await query(
    `SELECT elql.id AS link_id, elql.question_library_id, elql.display_order, elql.is_required
       FROM event_library_question_links elql
      WHERE elql.event_id = $1
      ORDER BY elql.display_order, elql.id`,
    [eventId],
  );
  return NextResponse.json({ links: rows });
}

// POST — assign a library question to an event
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  const event_id = Number(body.event_id);
  const question_library_id = Number(body.question_library_id);
  const display_order = Number(body.display_order) || 0;
  const is_required = body.is_required !== false;

  if (!event_id || !question_library_id) {
    return NextResponse.json({ error: 'event_id and question_library_id required' }, { status: 400 });
  }

  const { rows } = await query(
    `INSERT INTO event_library_question_links (event_id, question_library_id, display_order, is_required)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (event_id, question_library_id) DO NOTHING
     RETURNING *`,
    [event_id, question_library_id, display_order, is_required],
  );
  return NextResponse.json({ link: rows[0] ?? null }, { status: 201 });
}

// DELETE ?linkId=X
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const linkId = Number(searchParams.get('linkId'));
  if (!linkId) return NextResponse.json({ error: 'linkId required' }, { status: 400 });

  await query(`DELETE FROM event_library_question_links WHERE id = $1`, [linkId]);
  return NextResponse.json({ ok: true });
}
