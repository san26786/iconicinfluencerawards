import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { AwardNightNav } from '@/components/organiser/AwardNightNav';
import { ManageCategoriesClient } from '@/components/organiser/ManageCategoriesClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Manage Categories' };

export default async function CategoriesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const siteId = await getSiteId();
  const { rows } = await query(
    `SELECT * FROM award_categories WHERE site_id = $1 ORDER BY category_name`,
    [siteId],
  );

  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-20 pt-32 sm:pt-36">
      <div className="mx-auto w-full max-w-6xl">
        <OrganiserNav />
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Award Night</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">Manage Categories</h1>
          <p className="mt-2 text-sm text-white/55">
            Sync categories from nominations, then configure eligibility, graphing and judging settings per category.
          </p>
        </div>
        <AwardNightNav />
        <ManageCategoriesClient initialCategories={rows as never} />
      </div>
    </main>
  );
}
