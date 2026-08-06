import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { AwardNightNav } from '@/components/organiser/AwardNightNav';
import { AllocateApplicantsClient } from '@/components/organiser/AllocateApplicantsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Allocate Applicants' };

export default async function AllocatePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const siteId = await getSiteId();

  const [nomRes, catRes, jcRes] = await Promise.all([
    // Nominations with already-allocated judges
    query<{
      nomination_id: number;
      nominee_name: string;
      nominee_email: string | null;
      business_name: string | null;
      award_categories: string[] | null;
      avg_score: string | null;
      judges: string; // JSON
    }>(
      `SELECT
         n.id AS nomination_id,
         TRIM(CONCAT(n.nominee_first_name, ' ', n.nominee_last_name)) AS nominee_name,
         n.nominee_email,
         n.business_name,
         n.award_categories,
         n.avg_score::text,
         COALESCE(
           json_agg(
             json_build_object(
               'allocation_id', ja.id,
               'judge_id',      j.id,
               'judge_name',    j.first_name || ' ' || j.last_name,
               'judge_email',   j.email
             )
           ) FILTER (WHERE ja.id IS NOT NULL),
           '[]'::json
         ) AS judges
       FROM nominations n
       LEFT JOIN judge_applicants ja ON ja.nomination_id = n.id
       LEFT JOIN judges j ON j.id = ja.judge_id
       WHERE n.deleted_at IS NULL AND n.site_id = $1
       GROUP BY n.id
       ORDER BY n.avg_score DESC NULLS LAST, n.id`,
      [siteId],
    ),
    // Categories
    query<{ category_id: string; category_name: string }>(
      `SELECT category_id, category_name FROM award_categories WHERE site_id = $1 ORDER BY category_name`,
      [siteId],
    ),
    // Judges per category
    query<{ category_id: string; judge_id: number; judge_name: string; judge_email: string }>(
      `SELECT jc.category_id,
              j.id AS judge_id,
              j.first_name || ' ' || j.last_name AS judge_name,
              j.email AS judge_email
         FROM judge_categories jc
         JOIN judges j ON j.id = jc.judge_id
        WHERE jc.site_id = $1 AND j.status = 'approved'`,
      [siteId],
    ),
  ]);

  const nominations = nomRes.rows.map((r) => ({
    ...r,
    avg_score: r.avg_score ? Number(r.avg_score) : null,
    judges: typeof r.judges === 'string' ? JSON.parse(r.judges) : r.judges,
  }));

  // Build judgesByCategory map
  const judgesByCategory: Record<string, { id: number; name: string; email: string }[]> = {};
  for (const jc of jcRes.rows) {
    if (!judgesByCategory[jc.category_id]) judgesByCategory[jc.category_id] = [];
    judgesByCategory[jc.category_id].push({ id: jc.judge_id, name: jc.judge_name, email: jc.judge_email });
  }

  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-20 pt-32 sm:pt-36">
      <div className="mx-auto w-full max-w-6xl">
        <OrganiserNav />
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Award Night</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">Allocate Applicants</h1>
          <p className="mt-2 text-sm text-white/55">
            Assign judges to individual applicants. Filter by category to see only judges assigned to that category.
          </p>
        </div>
        <AwardNightNav />
        <AllocateApplicantsClient
          nominations={nominations}
          categories={catRes.rows}
          judgesByCategory={judgesByCategory}
        />
      </div>
    </main>
  );
}
