import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { AllocateJudgeClient, type Nomination } from '@/components/organiser/AllocateJudgeClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Allocate Applicants – Judge #${id}` };
}

export default async function AllocateApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const { id } = await params;
  const siteId = await getSiteId();

  // Load judge
  const { rows: judgeRows } = await query(
    `SELECT id, first_name, last_name FROM judges
      WHERE id = $1 AND site_id = $2 AND status = 'approved' LIMIT 1`,
    [id, siteId],
  );
  if (!judgeRows[0]) notFound();
  const judge = judgeRows[0] as { id: number; first_name: string; last_name: string };
  const judgeName = `${judge.first_name} ${judge.last_name}`.trim();

  // Already-allocated nomination IDs for this judge
  const { rows: allocRows } = await query(
    `SELECT nomination_id FROM judge_applicants WHERE judge_id = $1 AND site_id = $2`,
    [id, siteId],
  );
  const allocatedIds = new Set(allocRows.map((r) => (r as { nomination_id: number }).nomination_id));

  // All nominations for this site
  const { rows: nomRows } = await query(
    `SELECT id,
            TRIM(CONCAT(nominee_first_name, ' ', nominee_last_name)) AS name,
            nominee_mobile  AS mobile,
            nominee_email   AS email,
            business_name   AS business,
            award_categories,
            is_finalist,
            is_semifinalist,
            is_shortlisted
       FROM nominations
      WHERE site_id = $1 AND deleted_at IS NULL
      ORDER BY nominee_last_name, nominee_first_name`,
    [siteId],
  );

  function deriveStatus(row: { is_finalist: boolean; is_semifinalist: boolean; is_shortlisted: boolean }): string {
    if (row.is_finalist)     return 'finalist';
    if (row.is_semifinalist) return 'semifinalist';
    if (row.is_shortlisted)  return 'shortlisted';
    return 'in progress';
  }

  const nominations: Nomination[] = (nomRows as unknown as Array<{
    id: number; name: string; mobile: string | null; email: string | null;
    business: string | null; award_categories: string[] | null;
    is_finalist: boolean; is_semifinalist: boolean; is_shortlisted: boolean;
  }>).map((r) => ({
    id:         r.id,
    name:       r.name,
    mobile:     r.mobile,
    email:      r.email,
    business:   r.business,
    categories: Array.isArray(r.award_categories) ? r.award_categories : [],
    status:     deriveStatus(r),
    allocated:  allocatedIds.has(r.id),
  }));

  // Categories from award_categories table (same source as the categories page)
  // Fall back to categories found in nominations if the table has no entries yet
  const { rows: catRows } = await query(
    `SELECT COALESCE(category_name, category_id) AS label,
            COALESCE(category_name, category_id) AS value
       FROM award_categories WHERE site_id = $1 ORDER BY category_name`,
    [siteId],
  );

  let categories: { label: string; value: string }[];
  if (catRows.length > 0) {
    categories = (catRows as { label: string; value: string }[]);
  } else {
    // Derive from nominations as fallback
    const catSet = new Set<string>();
    nominations.forEach(n => n.categories.forEach(c => catSet.add(c)));
    categories = [...catSet].sort().map(c => ({ label: c, value: c }));
  }

  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-24 pt-32 sm:pt-36">
      <div className="mx-auto w-full max-w-7xl">
        <OrganiserNav />

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">
              Judges / Allocate Applicants
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
              Allocate Applicants to{' '}
              <span className="text-gold">{judgeName}</span>
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Select a category, check applicants from the list, then click Allocate.
            </p>
          </div>

          {/* Judge badge */}
          <div className="flex items-center gap-3 rounded-2xl glass px-5 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15">
              <span className="text-sm font-bold text-gold">
                {judge.first_name[0]}{judge.last_name[0]}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Judge</p>
              <p className="font-semibold text-white">{judgeName}</p>
            </div>
          </div>
        </div>

        <AllocateJudgeClient
          judgeId={judge.id}
          judgeName={judgeName}
          nominations={nominations}
          categories={categories}
        />
      </div>
    </main>
  );
}
