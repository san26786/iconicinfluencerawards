import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { EmailSetupClient } from '@/components/organiser/EmailSetupClient';
import { SiteEmailSetupClient } from '@/components/organiser/SiteEmailSetupClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Email Setup' };

export default async function EmailSetupPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  return (
    <div className="min-h-screen bg-ink grain pt-24">
      <div className="container-luxe section-pad py-12">
        <OrganiserNav />
        <div className="mb-8">
          <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Settings</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">Email Setup</h1>
          <p className="mt-1 text-sm text-white/40">Configure SMTP credentials for sending emails.</p>
        </div>

        <div className="mb-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/30">This Site</p>
          <SiteEmailSetupClient />
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/30">Platform Default (fallback for every site)</p>
          <EmailSetupClient />
        </div>
      </div>
    </div>
  );
}
