import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { JudgeBoardClient } from '@/components/judge/JudgeBoardClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Judging Board' };

export default async function JudgeBoardPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'judge') redirect('/login');

  const siteId = await getSiteId();

  // Self-heal: ensure tables exist before querying
  await query(`
    CREATE TABLE IF NOT EXISTS judge_applicants (
      id           SERIAL PRIMARY KEY,
      judge_id     INTEGER NOT NULL,
      nomination_id INTEGER NOT NULL,
      allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (judge_id, nomination_id)
    )
  `).catch(() => {});
  await query(`
    CREATE TABLE IF NOT EXISTS judge_scores (
      id            SERIAL PRIMARY KEY,
      judge_id      INTEGER NOT NULL,
      nomination_id INTEGER NOT NULL,
      score         INTEGER,
      notes         TEXT,
      marked_first        BOOLEAN,
      marked_semifinalist BOOLEAN,
      marked_finalist     BOOLEAN,
      scored_at     TIMESTAMPTZ,
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (judge_id, nomination_id)
    )
  `).catch(() => {});

  const { rows: judgeRows } = await query<{ id: number }>(
    `SELECT id FROM judges WHERE user_id = $1 AND site_id = $2 LIMIT 1`,
    [user.sub, siteId],
  );
  const judge = judgeRows[0];
  if (!judge) {
    return (
      <main className="min-h-screen px-5 pb-20 pt-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-white/55">No judge record found for your account. Please contact the organiser.</p>
        </div>
      </main>
    );
  }

  const { rows } = await query<{
    nomination_id: number;
    nominee_name: string | null;
    nominee_email: string | null;
    business_name: string | null;
    award_categories: string[] | null;
    allocated_at: Date;
    score: number | null;
    notes: string | null;
    marked_first: boolean | null;
    marked_semifinalist: boolean | null;
    marked_finalist: boolean | null;
    scored_at: Date | null;
    has_questions: boolean;
  }>(
    `SELECT
       ja.nomination_id,
       TRIM(CONCAT(n.nominee_first_name, ' ', n.nominee_last_name)) AS nominee_name,
       n.nominee_email,
       n.business_name,
       n.award_categories,
       ja.allocated_at,
       js.score,
       js.notes,
       js.marked_first,
       js.marked_semifinalist,
       js.marked_finalist,
       js.scored_at,
       false AS has_questions
     FROM judge_applicants ja
     JOIN nominations n ON n.id = ja.nomination_id
     LEFT JOIN judge_scores js ON js.judge_id = ja.judge_id AND js.nomination_id = ja.nomination_id
     WHERE ja.judge_id = $1
     ORDER BY js.score NULLS FIRST, ja.allocated_at`,
    [judge.id],
  );

  const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const applicants = rows.map((r) => ({
    nominationId: r.nomination_id,
    nomineeName:  r.nominee_name || 'Unknown',
    nomineeEmail: r.nominee_email,
    businessName: r.business_name,
    categories:   Array.isArray(r.award_categories) ? r.award_categories : [],
    allocatedAt:  dateFmt.format(new Date(r.allocated_at)),
    score:        r.score,
    notes:        r.notes,
    markedFirst:  r.marked_first ?? false,
    markedSemifinalist: r.marked_semifinalist ?? false,
    markedFinalist:     r.marked_finalist ?? false,
    scoredAt:     r.scored_at ? dateFmt.format(new Date(r.scored_at)) : null,
    hasQuestions: r.has_questions ?? false,
  }));

  return (
    <main className="min-h-screen px-5 pb-20 pt-24">
      <div className="mx-auto w-full max-w-5xl">
        <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Judging</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">My Board</h1>
        <p className="mt-2 text-sm text-white/55">
          {applicants.length} applicant{applicants.length !== 1 ? 's' : ''} allocated to you.
        </p>
        <JudgeBoardClient applicants={applicants} judgeId={judge.id} />
      </div>
    </main>
  );
}
