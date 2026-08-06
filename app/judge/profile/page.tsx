import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { JudgeProfileForm } from '@/components/judge/JudgeProfileForm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Profile' };

export default async function JudgeProfilePage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'judge') redirect('/login');

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
    facebook: string | null;
    twitter: string | null;
    profile_pic_url: string | null;
  }>(
    `SELECT id, first_name, last_name, email, phone, company, job_title, expertise, bio,
            linkedin, facebook, twitter, profile_pic_url
       FROM judges WHERE user_id = $1 AND site_id = $2 LIMIT 1`,
    [user.sub, siteId],
  );

  const judge = rows[0];
  if (!judge) {
    return (
      <main className="min-h-screen px-5 pb-20 pt-24">
        <div className="mx-auto max-w-xl">
          <p className="text-sm text-white/55">No profile found. Contact the organiser.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-20 pt-24">
      <div className="mx-auto w-full max-w-xl">
        <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Account</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">My Profile</h1>
        <p className="mt-2 text-sm text-white/55">Keep your details up to date.</p>
        <div className="mt-8">
          <JudgeProfileForm judge={judge} />
        </div>
      </div>
    </main>
  );
}
