import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — eligibility questions assigned to this site
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const siteId = await getSiteId();
  const { rows } = await query(
    `SELECT sel.id AS link_id, sel.display_order, sel.is_required,
            ql.id, ql.question_text, ql.question_type, ql.field_type, ql.options, ql.is_active
       FROM site_eligibility_links sel
       JOIN question_library ql ON ql.id = sel.question_library_id
      WHERE sel.site_id = $1
      ORDER BY sel.display_order, sel.id`,
    [siteId],
  );
  return NextResponse.json({ questions: rows });
}

// POST — assign an eligibility question to this site
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const siteId = await getSiteId();
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  const question_library_id = Number(body.question_library_id);
  const display_order = Number(body.display_order) || 0;
  const is_required = body.is_required !== false;

  if (!question_library_id) return NextResponse.json({ error: 'question_library_id required' }, { status: 400 });

  const { rows } = await query(
    `INSERT INTO site_eligibility_links (site_id, question_library_id, display_order, is_required)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (site_id, question_library_id) DO NOTHING
     RETURNING *`,
    [siteId, question_library_id, display_order, is_required],
  );
  return NextResponse.json({ link: rows[0] ?? null }, { status: 201 });
}

// DELETE ?linkId=X
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const siteId = await getSiteId();
  const { searchParams } = new URL(req.url);
  const linkId = Number(searchParams.get('linkId'));
  if (!linkId) return NextResponse.json({ error: 'linkId required' }, { status: 400 });

  await query(
    `DELETE FROM site_eligibility_links WHERE id = $1 AND site_id = $2`,
    [linkId, siteId],
  );
  return NextResponse.json({ ok: true });
}
