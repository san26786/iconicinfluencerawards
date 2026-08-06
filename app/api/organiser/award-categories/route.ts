import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const siteId = await getSiteId();
  const { rows } = await query(
    `SELECT * FROM award_categories WHERE site_id = $1 ORDER BY category_name`,
    [siteId],
  );
  return NextResponse.json({ categories: rows });
}

// POST = sync categories from nominations
export async function POST() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const siteId = await getSiteId();

  await query(
    `INSERT INTO award_categories (site_id, category_id, category_name, nominations_count, applications_count, judges_count)
     SELECT
       $1,
       cat,
       cat,
       COUNT(*)::int,
       COUNT(*) FILTER (WHERE n.opening_statement IS NOT NULL)::int,
       (SELECT COUNT(*)::int FROM judge_categories jc WHERE jc.site_id = $1 AND jc.category_id = cat)
     FROM nominations n, jsonb_array_elements_text(n.award_categories) AS cat
     WHERE n.deleted_at IS NULL
       AND n.award_categories IS NOT NULL
       AND jsonb_array_length(n.award_categories) > 0
     GROUP BY cat
     ON CONFLICT (site_id, category_id) DO UPDATE SET
       nominations_count  = EXCLUDED.nominations_count,
       applications_count = EXCLUDED.applications_count,
       judges_count       = EXCLUDED.judges_count`,
    [siteId],
  );

  const { rows } = await query(
    `SELECT * FROM award_categories WHERE site_id = $1 ORDER BY category_name`,
    [siteId],
  );
  return NextResponse.json({ synced: rows.length, categories: rows });
}
