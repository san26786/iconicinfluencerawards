import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { ManageJudgeClient } from '@/components/organiser/ManageJudgeClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Manage Judges' };

export default async function ManageJudgePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const { status: rawStatus } = await searchParams;
  const status = rawStatus === 'approved' ? 'approved' : rawStatus === 'rejected' ? 'rejected' : 'pending';

  const siteId = await getSiteId();

  const { rows } = await query<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    company: string | null;
    job_title: string | null;
    expertise: string | null;
    bio: string | null;
    linkedin: string | null;
    status: string;
    applied_at: Date;
    approved_at: Date | null;
  }>(
    `SELECT id, first_name, last_name, email, phone, company, job_title,
            expertise, bio, linkedin, status, applied_at, approved_at
       FROM judges
      WHERE site_id = $1 AND status = $2
      ORDER BY applied_at DESC`,
    [siteId, status],
  );

  const dateFmt = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const judges = rows.map((j) => ({
    id: j.id,
    name: `${j.first_name} ${j.last_name}`.trim(),
    email: j.email,
    phone: j.phone,
    company: j.company,
    jobTitle: j.job_title,
    expertise: j.expertise,
    bio: j.bio,
    linkedin: j.linkedin,
    status: j.status,
    appliedAt: dateFmt.format(new Date(j.applied_at)),
    approvedAt: j.approved_at ? dateFmt.format(new Date(j.approved_at)) : null,
  }));

  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-20 pt-32 sm:pt-36">
      <div className="mx-auto w-full max-w-6xl">
        <OrganiserNav />
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Judges</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">Manage Judges</h1>
          <p className="mt-2 text-sm text-white/55">Review, approve or reject judge applications.</p>
        </div>
        <ManageJudgeClient key={status} judges={judges} activeStatus={status} />
      </div>
    </main>
  );
}
