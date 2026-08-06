import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'judge') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    nominationId: number;
    judgeId: number;
    score: number;
    notes?: string;
    markedFirst?: boolean;
    markedSemifinalist?: boolean;
    markedFinalist?: boolean;
  };

  const { nominationId, judgeId, score, notes, markedFirst, markedSemifinalist, markedFinalist } = body;

  if (!nominationId || !judgeId || !score || score < 1 || score > 10) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const siteId = await getSiteId();

  // Verify judge belongs to this user
  const { rows: judgeRows } = await query<{ id: number }>(
    `SELECT id FROM judges WHERE id = $1 AND user_id = $2 AND site_id = $3 LIMIT 1`,
    [judgeId, user.sub, siteId],
  );
  if (!judgeRows[0]) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Verify applicant is allocated to this judge
  const { rows: allocRows } = await query<{ id: number }>(
    `SELECT id FROM judge_applicants WHERE judge_id = $1 AND nomination_id = $2 LIMIT 1`,
    [judgeId, nominationId],
  );
  if (!allocRows[0]) return NextResponse.json({ error: 'Not allocated' }, { status: 403 });

  await query(
    `INSERT INTO judge_scores
       (judge_id, nomination_id, site_id, score, notes, marked_first, marked_semifinalist, marked_finalist, scored_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),now())
     ON CONFLICT (judge_id, nomination_id) DO UPDATE SET
       score               = EXCLUDED.score,
       notes               = EXCLUDED.notes,
       marked_first        = EXCLUDED.marked_first,
       marked_semifinalist = EXCLUDED.marked_semifinalist,
       marked_finalist     = EXCLUDED.marked_finalist,
       updated_at          = now()`,
    [judgeId, nominationId, siteId, score, notes ?? null, markedFirst ?? false, markedSemifinalist ?? false, markedFinalist ?? false],
  );

  // Update nomination avg_score
  await query(
    `UPDATE nominations n
        SET avg_score = (
          SELECT ROUND(AVG(js.score)::numeric, 2)
          FROM judge_scores js WHERE js.nomination_id = n.id
        )
      WHERE n.id = $1`,
    [nominationId],
  );

  return NextResponse.json({ ok: true });
}
