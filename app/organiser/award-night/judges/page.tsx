import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { AwardNightNav } from '@/components/organiser/AwardNightNav';
import { CategoryJudgesClient, type JudgeAllocation } from '@/components/organiser/CategoryJudgesClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Manage Category Judges' };

export default async function CategoryJudgesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const siteId = await getSiteId();

  const [allocRes, catRes, judgeRes, tmplRes] = await Promise.all([
    // All allocations with scored/unscored candidate counts
    query<JudgeAllocation>(
      `SELECT
         jc.id,
         jc.category_id,
         COALESCE(ac.category_name, jc.category_id) AS category_name,
         j.id        AS judge_id,
         j.first_name || ' ' || j.last_name AS judge_name,
         j.company   AS business,
         j.email     AS judge_email,
         COUNT(ja.id)                                       AS scored_count,
         COUNT(DISTINCT ap.id) - COUNT(ja.id)               AS unscored_count
       FROM judge_categories jc
       JOIN judges j ON j.id = jc.judge_id
       LEFT JOIN award_categories ac
              ON ac.site_id = jc.site_id AND ac.category_id = jc.category_id
       LEFT JOIN judge_applicants ap
              ON ap.judge_id = jc.judge_id AND ap.site_id = jc.site_id
       LEFT JOIN judge_scores ja
              ON ja.judge_id = jc.judge_id AND ja.nomination_id = ap.nomination_id
             AND ja.score IS NOT NULL
       WHERE jc.site_id = $1
       GROUP BY jc.id, jc.category_id, ac.category_name, j.id,
                j.first_name, j.last_name, j.company, j.email
       ORDER BY COALESCE(ac.category_name, jc.category_id), j.last_name`,
      [siteId],
    ),

    // All award categories (for filter + allocate modal)
    query<{ category_id: string; category_name: string }>(
      `SELECT category_id, category_name FROM award_categories WHERE site_id = $1 ORDER BY category_name`,
      [siteId],
    ),

    // All approved judges (for filter + allocate modal)
    query<{ id: number; first_name: string; last_name: string; email: string; company: string | null }>(
      `SELECT id, first_name, last_name, email, company FROM judges WHERE site_id = $1 AND status = 'approved' ORDER BY last_name`,
      [siteId],
    ),

    // Email templates for the send-mail dropdown
    query<{ id: number; name: string }>(
      `SELECT id, name FROM email_templates ORDER BY name`,
      [],
    ),
  ]);

  const allocations: JudgeAllocation[] = allocRes.rows.map(r => ({
    ...r,
    scored_count:   Number(r.scored_count),
    unscored_count: Math.max(0, Number(r.unscored_count)),
  }));

  const allCategories = catRes.rows.map(r => ({ id: r.category_id, name: r.category_name }));
  const approvedJudges = judgeRes.rows.map(r => ({
    id: r.id,
    name: `${r.first_name} ${r.last_name}`,
    email: r.email,
    company: r.company,
  }));
  const emailTemplates = tmplRes.rows;

  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-20 pt-32 sm:pt-36">
      <div className="mx-auto w-full max-w-7xl">
        <OrganiserNav />
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Award Night</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">Manage Category Judges</h1>
          <p className="mt-2 text-sm text-white/55">
            Allocate approved judges to award categories and track scoring progress.
          </p>
        </div>
        <AwardNightNav />
        <CategoryJudgesClient
          allocations={allocations}
          allCategories={allCategories}
          approvedJudges={approvedJudges}
          emailTemplates={emailTemplates}
        />
      </div>
    </main>
  );
}
