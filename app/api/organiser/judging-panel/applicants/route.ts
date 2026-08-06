import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/organiser/judging-panel/applicants?category=X&search=Y&status=Z
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const siteId = await getSiteId();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') ?? '';
  const search   = searchParams.get('search') ?? '';
  const status   = searchParams.get('status') ?? '';

  const args: unknown[] = [siteId];
  let where = `a.site_id = $1 AND a.deleted_at IS NULL`;

  if (category) { args.push(category); where += ` AND a.industry = $${args.length}`; }
  if (status)   { args.push(status);   where += ` AND a.status = $${args.length}`; }
  if (search) {
    args.push(`%${search.toLowerCase()}%`);
    where += ` AND (LOWER(a.first_name) LIKE $${args.length} OR LOWER(a.last_name) LIKE $${args.length} OR LOWER(a.email) LIKE $${args.length} OR LOWER(a.org_name) LIKE $${args.length})`;
  }

  const { rows } = await query<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    mobile: string | null;
    org_name: string | null;
    job_title: string | null;
    industry: string | null;
    status: string;
    created_at: string;
    avg_score: number | null;
    judge_count: string;
    confirm_votes: string;
    unconfirm_votes: string;
  }>(
    `SELECT
       a.id, a.first_name, a.last_name, a.email, a.mobile,
       a.org_name, a.job_title, a.industry, a.status, a.created_at,
       -- avg score across all judges who scored this application
       ROUND(AVG(js.score)::numeric, 1)                        AS avg_score,
       COUNT(DISTINCT js.judge_id)                             AS judge_count,
       COUNT(js.id) FILTER (WHERE js.marked_first = true)      AS confirm_votes,
       COUNT(js.id) FILTER (WHERE js.marked_finalist = false AND js.score IS NOT NULL) AS unconfirm_votes
     FROM applications a
     LEFT JOIN judge_scores js ON js.nomination_id = a.id
     WHERE ${where}
     GROUP BY a.id
     ORDER BY avg_score DESC NULLS LAST, a.created_at`,
    args,
  ).catch(() => ({ rows: [] }));

  return NextResponse.json({ applicants: rows });
}
