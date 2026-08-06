import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { profileFromRow } from '@/lib/profile';
import { nominationsForUser } from '@/lib/nominations';
import { ProfileForm } from '@/components/account/ProfileForm';
import { NominationsList } from '@/components/account/NominationsList';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'User profile' };

export default async function OrganiserUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const numId = Number((await params).id);
  if (!Number.isInteger(numId)) notFound();

  const { rows } = await query<{
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    profile: unknown;
  }>(`SELECT email, first_name, last_name, phone, profile FROM users WHERE id = $1`, [numId]);
  const row = rows[0];
  if (!row) notFound();

  const nominations = await nominationsForUser(numId, row.email);
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email;

  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-24 pt-28 sm:pt-36">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/organiser"
          className="inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <p className="mt-3 text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">
          Editing profile
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">{name}</h1>
        <p className="mb-7 mt-1 text-sm text-white/55">{row.email}</p>

        <ProfileForm
          initial={profileFromRow(row)}
          email={row.email}
          endpoint={`/api/organiser/users/${numId}`}
        />

        <h2 className="mb-4 mt-12 font-display text-xl font-semibold text-white">
          Their nominations ({nominations.length})
        </h2>
        <NominationsList
          items={nominations}
          viewHref={(id) => `/organiser/nominations/${id}`}
        />
      </div>
    </main>
  );
}
