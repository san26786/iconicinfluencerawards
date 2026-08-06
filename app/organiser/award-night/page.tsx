import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { AwardNightNav } from '@/components/organiser/AwardNightNav';
import { AwardNightClient } from '@/components/organiser/AwardNightClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Award Night Management' };

export default async function AwardNightPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const siteId = await getSiteId();

  // Email templates for the send-mail dropdown
  const { rows: templateRows } = await query<{ id: number; name: string }>(
    `SELECT id, name FROM email_templates ORDER BY name`,
    [],
  );

  // Nominations with judging data, ordered by avg_score desc
  const { rows } = await query<{
    id: number;
    nominee_name: string | null;
    nominee_email: string | null;
    business_name: string | null;
    award_categories: string[] | null;
    avg_score: string | null;
    is_shortlisted: boolean;
    is_semifinalist: boolean;
    is_finalist: boolean;
    judges_scored: string;
  }>(
    `SELECT
       n.id,
       TRIM(CONCAT(n.nominee_first_name, ' ', n.nominee_last_name)) AS nominee_name,
       n.nominee_email,
       n.business_name,
       n.award_categories,
       n.avg_score::text,
       n.is_shortlisted,
       n.is_semifinalist,
       n.is_finalist,
       COUNT(js.id)::text AS judges_scored
     FROM nominations n
     LEFT JOIN judge_scores js ON js.nomination_id = n.id
     WHERE n.deleted_at IS NULL AND n.site_id = $1
     GROUP BY n.id
     ORDER BY n.avg_score DESC NULLS LAST, n.id`,
    [siteId],
  );

  const nominations = rows.map((r) => ({
    id:              r.id,
    nomineeName:     r.nominee_name || 'Unknown',
    nomineeEmail:    r.nominee_email,
    businessName:    r.business_name,
    categories:      Array.isArray(r.award_categories) ? r.award_categories : [],
    avgScore:        r.avg_score ? Number(r.avg_score) : null,
    isShortlisted:   r.is_shortlisted,
    isSemifinalist:  r.is_semifinalist,
    isFinalist:      r.is_finalist,
    judgesScored:    Number(r.judges_scored),
  }));

  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-20 pt-32 sm:pt-36">
      <div className="mx-auto w-full max-w-6xl">
        <OrganiserNav />
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Award Night</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">Award Night Management</h1>
          <p className="mt-2 text-sm text-white/55">
            Mark nominations as shortlisted, semi-finalist, or finalist. Sorted by average judge score.
          </p>
        </div>
        <AwardNightNav />
        <AwardNightClient nominations={nominations} emailTemplates={templateRows} />
      </div>
    </main>
  );
}
