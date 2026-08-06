import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: list allocations — filter by ?category=X or ?judge=Y
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryFilter = searchParams.get('category');
  const siteId = await getSiteId();

  // Nominations with their allocated judges, optionally filtered by category
  const { rows } = await query(
    `SELECT
       n.id AS nomination_id,
       TRIM(CONCAT(n.nominee_first_name, ' ', n.nominee_last_name)) AS nominee_name,
       n.nominee_email,
       n.business_name,
       n.award_categories,
       n.avg_score,
       COALESCE(
         json_agg(
           json_build_object(
             'allocation_id', ja.id,
             'judge_id',      j.id,
             'judge_name',    j.first_name || ' ' || j.last_name,
             'judge_email',   j.email
           )
         ) FILTER (WHERE ja.id IS NOT NULL),
         '[]'
       ) AS judges
     FROM nominations n
     LEFT JOIN judge_applicants ja ON ja.nomination_id = n.id
     LEFT JOIN judges j ON j.id = ja.judge_id
     WHERE n.deleted_at IS NULL
       AND n.site_id = $2
       AND ($1::text IS NULL OR $1 = ANY(n.award_categories))
     GROUP BY n.id
     ORDER BY n.avg_score DESC NULLS LAST, n.id`,
    [categoryFilter, siteId],
  );

  return NextResponse.json({ nominations: rows });
}

// POST: allocate a judge to a nomination
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { judgeId, nominationId } = await req.json() as { judgeId: number; nominationId: number };
  if (!judgeId || !nominationId) return NextResponse.json({ error: 'judgeId and nominationId required' }, { status: 400 });

  const siteId = await getSiteId();

  await query(
    `INSERT INTO judge_applicants (judge_id, nomination_id, site_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (judge_id, nomination_id) DO NOTHING`,
    [judgeId, nominationId, siteId],
  );

  return NextResponse.json({ ok: true });
}

// DELETE: remove a judge from a nomination
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { judgeId, nominationId } = await req.json() as { judgeId: number; nominationId: number };
  const siteId = await getSiteId();

  await query(
    `DELETE FROM judge_applicants WHERE judge_id = $1 AND nomination_id = $2 AND site_id = $3`,
    [judgeId, nominationId, siteId],
  );

  return NextResponse.json({ ok: true });
}
