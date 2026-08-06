import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { profileFromRow } from '@/lib/profile';
import { ProfileForm } from '@/components/account/ProfileForm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'My Awards Profile' };

export default async function MyProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role === 'organiser') redirect('/organiser');

  const { rows } = await query<{
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    profile: unknown;
  }>(`SELECT email, first_name, last_name, phone, profile FROM users WHERE id = $1`, [user.sub]);
  const row = rows[0];
  if (!row) redirect('/login');

  return (
    <main id="main" className="min-h-screen px-5 pb-24 pt-28 sm:pt-36">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to account
        </Link>
        <h1 className="mb-7 mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">
          My Awards Profile
        </h1>

        <ProfileForm initial={profileFromRow(row)} email={row.email} endpoint="/api/profile" redirectTo="/apply" />
      </div>
    </main>
  );
}
