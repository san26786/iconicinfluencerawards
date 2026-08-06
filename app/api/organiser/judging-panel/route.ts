import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — categories with application counts per stage
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const siteId = await getSiteId();

  // Categories with count breakdown by status
  const { rows: cats } = await query<{
    category: string;
    total: string;
    reviewing: string;
    shortlisted: string;
    semifinalist: string;
    finalist: string;
    winner: string;
  }>(
    `SELECT
       industry AS category,
       COUNT(*)                                          AS total,
       COUNT(*) FILTER (WHERE status = 'reviewing')     AS reviewing,
       COUNT(*) FILTER (WHERE status = 'shortlisted')   AS shortlisted,
       COUNT(*) FILTER (WHERE status = 'semifinalist')  AS semifinalist,
       COUNT(*) FILTER (WHERE status = 'finalist')      AS finalist,
       COUNT(*) FILTER (WHERE status = 'winner')        AS winner
     FROM applications
     WHERE site_id = $1 AND deleted_at IS NULL
     GROUP BY industry
     ORDER BY industry`,
    [siteId],
  ).catch(() => ({ rows: [] }));

  return NextResponse.json({
    categories: cats.map(c => ({
      name: c.category || 'Uncategorised',
      total: Number(c.total),
      reviewing: Number(c.reviewing),
      shortlisted: Number(c.shortlisted),
      semifinalist: Number(c.semifinalist),
      finalist: Number(c.finalist),
      winner: Number(c.winner),
    })),
  });
}
