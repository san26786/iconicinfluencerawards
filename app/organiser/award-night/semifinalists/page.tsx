import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { AwardNightNav } from '@/components/organiser/AwardNightNav';
import { ApplicationsListClient, type Application } from '@/components/organiser/ApplicationsListClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Manage Semi Finalists' };

export default async function SemiFinalistsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const siteId = await getSiteId();
  let rows: Application[] = [];
  try {
    const result = await query<Application>(
      `SELECT a.id, a.ref_number, a.status, a.first_name, a.last_name, a.email, a.mobile,
              a.job_title, a.org_name, a.industry, e.title AS event_title, a.created_at::text AS created_at
       FROM applications a LEFT JOIN events e ON e.id = a.event_id
       WHERE a.site_id = $1 ORDER BY a.created_at DESC`,
      [siteId],
    );
    rows = result.rows;
  } catch { /* applications table may not exist yet — run /api/admin/migrate */ }

  return (
    <div className="min-h-screen bg-ink grain pt-24">
      <div className="container-luxe section-pad py-12">
        <OrganiserNav />
        <div className="mb-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Award Night</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">Manage Semi Finalists</h1>
          <p className="mt-1 text-sm text-white/40">Applications marked as semi finalist.</p>
        </div>
        <AwardNightNav />
        <ApplicationsListClient applications={rows} defaultStatus="semifinalist" />
      </div>
    </div>
  );
}
