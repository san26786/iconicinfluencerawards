import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET ?categoryId=X — questions assigned to a category for this site
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const siteId = await getSiteId();
  const { searchParams } = new URL(req.url);
  const categoryId = Number(searchParams.get('categoryId'));
  if (!categoryId) return NextResponse.json({ error: 'categoryId required' }, { status: 400 });

  const { rows } = await query(
    `SELECT cql.id AS link_id, cql.display_order, cql.is_required,
            ql.id, ql.question_text, ql.question_type, ql.field_type, ql.options, ql.is_active
       FROM category_question_links cql
       JOIN question_library ql ON ql.id = cql.question_library_id
      WHERE cql.site_id = $1 AND cql.event_category_id = $2
      ORDER BY cql.display_order, cql.id`,
    [siteId, categoryId],
  );
  return NextResponse.json({ questions: rows });
}

// POST — assign a library question to a category
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const siteId = await getSiteId();
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  const event_category_id = Number(body.event_category_id);
  const question_library_id = Number(body.question_library_id);
  const display_order = Number(body.display_order) || 0;
  const is_required = body.is_required !== false;

  if (!event_category_id || !question_library_id) {
    return NextResponse.json({ error: 'event_category_id and question_library_id required' }, { status: 400 });
  }

  const { rows } = await query(
    `INSERT INTO category_question_links (site_id, event_category_id, question_library_id, display_order, is_required)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (site_id, event_category_id, question_library_id) DO NOTHING
     RETURNING *`,
    [siteId, event_category_id, question_library_id, display_order, is_required],
  );
  return NextResponse.json({ link: rows[0] ?? null }, { status: 201 });
}
