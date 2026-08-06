import { redirect } from 'next/navigation';
import { Ban } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { UnsubscribeList, type SuppressionRow } from '@/components/organiser/UnsubscribeList';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Unsubscribe List' };

export default async function UnsubscribesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const { rows } = await query<SuppressionRow>(
    `SELECT s.id, s.email, s.reason, s.created_at, s.job_id, j.name AS job_name
       FROM email_suppressions s
       LEFT JOIN email_jobs j ON j.id = s.job_id
      WHERE s.deleted_at IS NULL
      ORDER BY s.created_at DESC, s.email`,
  );

  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-24 pt-28 sm:pt-36">
      <div className="mx-auto w-full max-w-5xl">
        <OrganiserNav />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Organiser</p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">Unsubscribe List</h1>
            <p className="mt-2 text-sm text-white/55">
              Manage the global suppression list. Emails on this list are skipped before sending.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/65">
            <Ban className="h-4 w-4 text-gold" /> {rows.length} blocked
          </span>
        </div>
        <UnsubscribeList initialRows={rows} />
      </div>
    </main>
  );
}
