import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  const siteId = await getSiteId();

  try {
    const { rows } = await query(
      `SELECT
         js.score,
         js.notes,
         js.scored_at::text AS scored_at,
         j.first_name       AS judge_first,
         j.last_name        AS judge_last,
         j.email            AS judge_email,
         n.id               AS nomination_id,
         js.judge_id
       FROM judge_scores js
       JOIN judges     j ON j.id = js.judge_id
       JOIN nominations n ON n.id = js.nomination_id
       WHERE js.site_id = $1
         AND LOWER(n.email) = LOWER($2)
         AND n.deleted_at IS NULL
       ORDER BY js.scored_at DESC`,
      [siteId, email],
    );

    const sum = rows.reduce((s: number, r) => s + Number(r.score), 0);
    const avg = rows.length ? Math.round((sum / rows.length) * 10) / 10 : null;

    // Fetch per-question breakdown for each judge (if available)
    const questionScoresByJudge: Record<number, { question_id: number; question_text: string; score: number }[]> = {};
    for (const row of rows) {
      try {
        const { rows: qRows } = await query<{ question_id: number; question_text: string; score: number }>(
          `SELECT jqs.question_id, eq.question_text, jqs.score
             FROM judge_question_scores jqs
             JOIN event_questions eq ON eq.id = jqs.question_id
            WHERE jqs.judge_id = $1 AND jqs.nomination_id = $2
            ORDER BY eq.display_order, eq.id`,
          [row.judge_id, row.nomination_id],
        );
        if (qRows.length > 0) questionScoresByJudge[row.judge_id] = qRows;
      } catch { /* table may not exist yet */ }
    }

    const enriched = rows.map(r => ({
      ...r,
      questionScores: questionScoresByJudge[r.judge_id] ?? [],
    }));

    return NextResponse.json({ scores: enriched, average: avg, count: rows.length });
  } catch {
    return NextResponse.json({ scores: [], average: null, count: 0 });
  }
}
