import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureOnce } from '@/lib/ensureOnce';
import { getSessionUser } from '@/lib/auth';
import { getSiteId } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ensureTable() {
  return ensureOnce('judge_question_scores', async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS judge_question_scores (
        id            serial PRIMARY KEY,
        site_id       int NOT NULL,
        judge_id      int NOT NULL,
        nomination_id int NOT NULL,
        question_id   int NOT NULL,
        score         int NOT NULL CHECK (score >= 0 AND score <= 10),
        created_at    timestamptz NOT NULL DEFAULT now(),
        updated_at    timestamptz NOT NULL DEFAULT now(),
        UNIQUE (judge_id, nomination_id, question_id)
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS jqs_nomination ON judge_question_scores(nomination_id)`);
  });
}

// GET /api/judge/question-scores?nominationId=X&judgeId=Y
// Returns event questions + this judge's existing per-question scores
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'judge') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const nominationId = Number(searchParams.get('nominationId'));
  const judgeId      = Number(searchParams.get('judgeId'));
  if (!nominationId || !judgeId) return NextResponse.json({ error: 'nominationId and judgeId required' }, { status: 400 });

  const siteId = await getSiteId();

  // Verify this judge belongs to the session user
  const { rows: judgeRows } = await query<{ id: number }>(
    `SELECT id FROM judges WHERE id = $1 AND user_id = $2 AND site_id = $3 LIMIT 1`,
    [judgeId, user.sub, siteId],
  );
  if (!judgeRows[0]) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await ensureTable();

  // Get application questions for this nomination's event
  const { rows: questions } = await query<{ id: number; question_text: string; display_order: number }>(
    `SELECT eq.id, eq.question_text, eq.display_order
       FROM event_questions eq
       JOIN award_categories ac ON ac.event_id = eq.event_id AND ac.site_id = $2
       JOIN nominations n ON n.id = $1
         AND ac.name = ANY(SELECT jsonb_array_elements_text(n.award_categories))
      WHERE eq.question_type = 'application'
      GROUP BY eq.id, eq.question_text, eq.display_order
      ORDER BY eq.display_order, eq.id`,
    [nominationId, siteId],
  );

  // Get existing scores for this judge + nomination
  const { rows: existing } = await query<{ question_id: number; score: number }>(
    `SELECT question_id, score FROM judge_question_scores
      WHERE judge_id = $1 AND nomination_id = $2`,
    [judgeId, nominationId],
  );

  const scoreMap: Record<number, number> = {};
  for (const r of existing) scoreMap[r.question_id] = r.score;

  return NextResponse.json({
    questions: questions.map(q => ({
      id: q.id,
      text: q.question_text,
      order: q.display_order,
      existingScore: scoreMap[q.id] ?? null,
    })),
  });
}

// POST /api/judge/question-scores
// Body: { nominationId, judgeId, scores: [{ questionId, score }], notes? }
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'judge') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const siteId = await getSiteId();
  const body = await req.json() as {
    nominationId: number;
    judgeId: number;
    scores: { questionId: number; score: number }[];
    notes?: string;
  };
  const { nominationId, judgeId, scores, notes } = body;

  if (!nominationId || !judgeId || !Array.isArray(scores) || scores.length === 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Verify judge
  const { rows: judgeRows } = await query<{ id: number }>(
    `SELECT id FROM judges WHERE id = $1 AND user_id = $2 AND site_id = $3 LIMIT 1`,
    [judgeId, user.sub, siteId],
  );
  if (!judgeRows[0]) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Verify allocation
  const { rows: allocRows } = await query<{ id: number }>(
    `SELECT id FROM judge_applicants WHERE judge_id = $1 AND nomination_id = $2 LIMIT 1`,
    [judgeId, nominationId],
  );
  if (!allocRows[0]) return NextResponse.json({ error: 'Not allocated' }, { status: 403 });

  await ensureTable();

  // Upsert each question score
  for (const { questionId, score } of scores) {
    if (score < 0 || score > 10) continue;
    await query(
      `INSERT INTO judge_question_scores (site_id, judge_id, nomination_id, question_id, score, updated_at)
       VALUES ($1,$2,$3,$4,$5,now())
       ON CONFLICT (judge_id, nomination_id, question_id) DO UPDATE
         SET score = EXCLUDED.score, updated_at = now()`,
      [siteId, judgeId, nominationId, questionId, score],
    );
  }

  // Compute average of per-question scores for this judge, use as the overall score
  const { rows: avgRows } = await query<{ avg: string }>(
    `SELECT ROUND(AVG(score)::numeric, 1) AS avg
       FROM judge_question_scores
      WHERE judge_id = $1 AND nomination_id = $2`,
    [judgeId, nominationId],
  );
  const overallScore = Math.round(Number(avgRows[0]?.avg ?? 0));

  // Upsert into judge_scores for backward compatibility (organiser views)
  await query(
    `INSERT INTO judge_scores
       (judge_id, nomination_id, site_id, score, notes, marked_first, marked_semifinalist, marked_finalist, scored_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,false,false,false,now(),now())
     ON CONFLICT (judge_id, nomination_id) DO UPDATE SET
       score      = EXCLUDED.score,
       notes      = COALESCE(EXCLUDED.notes, judge_scores.notes),
       updated_at = now()`,
    [judgeId, nominationId, siteId, overallScore, notes ?? null],
  );

  // Update nomination avg_score
  await query(
    `UPDATE nominations SET avg_score = (
       SELECT ROUND(AVG(js.score)::numeric, 2)
       FROM judge_scores js WHERE js.nomination_id = $1
     ) WHERE id = $1`,
    [nominationId],
  );

  return NextResponse.json({ ok: true, overallScore });
}
