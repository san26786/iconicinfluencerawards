import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: list all judge-category allocations for this site
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('category');
  const judgeId    = searchParams.get('judge');
  const siteId     = await getSiteId();

  let sql = `SELECT jc.*, j.first_name, j.last_name, j.email
               FROM judge_categories jc
               JOIN judges j ON j.id = jc.judge_id
              WHERE jc.site_id = $1`;
  const args: unknown[] = [siteId];

  if (categoryId) { args.push(categoryId); sql += ` AND jc.category_id = $${args.length}`; }
  if (judgeId)    { args.push(Number(judgeId)); sql += ` AND jc.judge_id = $${args.length}`; }

  sql += ' ORDER BY jc.category_id, j.last_name';

  const { rows } = await query(sql, args);
  return NextResponse.json({ allocations: rows });
}

// POST: allocate a judge to a category
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { judgeId, categoryId } = await req.json() as { judgeId: number; categoryId: string };
  if (!judgeId || !categoryId) return NextResponse.json({ error: 'judgeId and categoryId required' }, { status: 400 });

  const siteId = await getSiteId();

  await query(
    `INSERT INTO judge_categories (judge_id, site_id, category_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (judge_id, category_id) DO NOTHING`,
    [judgeId, siteId, categoryId],
  );

  // Keep judges_count in sync
  await query(
    `UPDATE award_categories
        SET judges_count = (SELECT COUNT(*) FROM judge_categories jc WHERE jc.site_id = $1 AND jc.category_id = $2)
      WHERE site_id = $1 AND category_id = $2`,
    [siteId, categoryId],
  );

  return NextResponse.json({ ok: true });
}

// DELETE: remove a judge from a category
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { judgeId, categoryId } = await req.json() as { judgeId: number; categoryId: string };
  const siteId = await getSiteId();

  await query(
    `DELETE FROM judge_categories WHERE judge_id = $1 AND site_id = $2 AND category_id = $3`,
    [judgeId, siteId, categoryId],
  );

  await query(
    `UPDATE award_categories
        SET judges_count = (SELECT COUNT(*) FROM judge_categories jc WHERE jc.site_id = $1 AND jc.category_id = $2)
      WHERE site_id = $1 AND category_id = $2`,
    [siteId, categoryId],
  );

  return NextResponse.json({ ok: true });
}
