import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSite } from '@/lib/site';
import { RegisterForm } from '@/components/RegisterForm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Edit nomination' };

type FileMeta = { name: string; size: number; type: string };

export default async function EditMyNominationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role === 'organiser') redirect('/organiser');

  const numId = Number((await params).id);
  if (!Number.isInteger(numId)) notFound();

  const email = user.email.toLowerCase();
  const { rows } = await query<{
    id: number;
    award_categories: string[] | null;
    self_nominate: boolean;
    anonymous: boolean;
    nominee_first_name: string | null;
    nominee_last_name: string | null;
    nominee_email: string | null;
    nominee_mobile: string | null;
    nominee_work_phone: string | null;
    nominee_organisation: string | null;
    nominee_post_code: string | null;
    opening_statement: string | null;
    linked_in: string | null;
    how_heard: string | null;
    nominator_first_name: string | null;
    nominator_last_name: string | null;
    nominator_email: string | null;
    nominator_mobile: string | null;
    nominator_work_phone: string | null;
    business_name: string | null;
    business_location: string | null;
    business_category: string | null;
    agreed_to_terms: boolean;
    supporting: { documents?: FileMeta[]; videos?: FileMeta[]; videoLink?: string } | null;
  }>(
    `SELECT id, award_categories, self_nominate, anonymous,
            nominee_first_name, nominee_last_name, nominee_email, nominee_mobile,
            nominee_work_phone, nominee_organisation, nominee_post_code,
            opening_statement, linked_in, how_heard,
            nominator_first_name, nominator_last_name, nominator_email, nominator_mobile,
            nominator_work_phone, business_name, business_location, business_category,
            agreed_to_terms, supporting
       FROM nominations
      WHERE id = $1
        AND deleted_at IS NULL
        AND (user_id = $2 OR lower(nominator_email) = $3 OR lower(nominee_email) = $3)`,
    [numId, user.sub, email],
  );

  const r = rows[0];
  if (!r) notFound();

  const v = (x: string | null) => x ?? '';
  const initial = {
    awardCategories: Array.isArray(r.award_categories) ? r.award_categories : [],
    selfNominate: r.self_nominate,
    nomineeFirstName: v(r.nominee_first_name),
    nomineeLastName: v(r.nominee_last_name),
    nomineeEmail: v(r.nominee_email),
    nomineeMobile: v(r.nominee_mobile),
    nomineeWorkPhone: v(r.nominee_work_phone),
    nomineeOrganisation: v(r.nominee_organisation),
    nomineePostCode: v(r.nominee_post_code),
    anonymous: (r.anonymous ? 'yes' : 'no') as 'yes' | 'no',
    openingStatement: v(r.opening_statement),
    linkedInProfile: v(r.linked_in),
    howHeard: v(r.how_heard),
    videoLink: v(r.supporting?.videoLink ?? null),
    yourFirstName: v(r.nominator_first_name),
    yourLastName: v(r.nominator_last_name),
    yourEmail: v(r.nominator_email),
    yourMobile: v(r.nominator_mobile),
    yourWorkPhone: v(r.nominator_work_phone),
    yourBusinessName: v(r.business_name),
    yourBusinessLocation: v(r.business_location),
    yourBusinessCategory: v(r.business_category),
    agreedToTerms: r.agreed_to_terms,
  };

  const initialSupporting = {
    documents: r.supporting?.documents ?? [],
    videos: r.supporting?.videos ?? [],
  };

  const site = await getSite();

  return (
    <main id="main" className="min-h-screen px-5 pb-20 pt-28 sm:pt-36">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/account/nominations"
          className="inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my nominations
        </Link>
        <h1 className="mb-8 mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">
          Edit your nomination
        </h1>

        <RegisterForm
          mode="edit"
          nominationId={r.id}
          initial={initial}
          initialSupporting={initialSupporting}
          editEndpoint={`/api/account/nominations/${r.id}`}
          editBackHref="/account/nominations"
          siteName={site.name}
        />
      </div>
    </main>
  );
}
