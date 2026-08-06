import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { nominationsForUser } from '@/lib/nominations';
import { NominationsList } from '@/components/account/NominationsList';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'My Nominations' };

export default async function MyNominationsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role === 'organiser') redirect('/organiser');

  const items = await nominationsForUser(user.sub, user.email);

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
        <h1 className="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">
          My Nominations
        </h1>
        <p className="mb-7 mt-2 text-sm text-white/55">
          {items.length} {items.length === 1 ? 'nomination' : 'nominations'} linked to your account.
        </p>

        <NominationsList items={items} editHref={(id) => `/account/nominations/${id}/edit`} />
      </div>
    </main>
  );
}
