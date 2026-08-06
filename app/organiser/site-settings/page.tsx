import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getSite } from '@/lib/site';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { SiteSettingsForm } from './SiteSettingsForm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Site Settings' };

export default async function SiteSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const site = await getSite();

  return (
    <div className="min-h-screen bg-ink grain pt-24">
      <div className="container-luxe section-pad py-12">
        <OrganiserNav />
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-luxe text-gold">Organiser</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-white">Site Settings</h1>
          <p className="mt-1 text-sm text-white/50">
            Manage event details, contact info, branding and more for {site.name}.
          </p>
        </div>
        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.02] p-7 sm:p-10">
          <SiteSettingsForm site={site} />
        </div>
      </div>
    </div>
  );
}
