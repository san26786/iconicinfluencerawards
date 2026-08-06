import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { AwardNightNav } from '@/components/organiser/AwardNightNav';
import { ApplicantsPageClient } from '@/components/organiser/ApplicantsPageClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Manage Applicants' };

export default async function ApplicationsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  return (
    <div className="min-h-screen bg-ink grain pt-24">
      <div className="container-luxe section-pad py-12">
        <OrganiserNav />
        <div className="mb-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Award Night</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">Manage Applicants</h1>
          <p className="mt-1 text-sm text-white/40">
            Nominees who registered an account and submitted the full application form.
          </p>
        </div>
        <AwardNightNav />
        <ApplicantsPageClient />
      </div>
    </div>
  );
}
