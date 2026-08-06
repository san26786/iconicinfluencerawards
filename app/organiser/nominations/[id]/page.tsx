import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getSiteId } from '@/lib/site';
import { NominationDetail, type NominationFull } from '@/components/organiser/NominationDetail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Nomination detail' };

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default async function NominationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const { rows } = await query<{
    id: number;
    site: string | null;
    submitted_at: Date | null;
    created_at: Date;
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
    supporting: NominationFull['supporting'];
    agreed_to_terms: boolean;
  }>(
    `SELECT id, site, submitted_at, created_at, award_categories, self_nominate, anonymous,
            nominee_first_name, nominee_last_name, nominee_email, nominee_mobile,
            nominee_work_phone, nominee_organisation, nominee_post_code,
            opening_statement, linked_in, how_heard,
            nominator_first_name, nominator_last_name, nominator_email, nominator_mobile,
            nominator_work_phone, business_name, business_location, business_category,
            supporting, agreed_to_terms
     FROM nominations
      WHERE id = $1 AND deleted_at IS NULL AND site_id = $2`,
    [numId, await getSiteId()],
  );

  const r = rows[0];
  if (!r) notFound();

  const nomination: NominationFull = {
    id: r.id,
    site: r.site,
    submitted: dateFmt.format(new Date(r.submitted_at ?? r.created_at)),
    awardCategories: Array.isArray(r.award_categories) ? r.award_categories : [],
    selfNominate: r.self_nominate,
    anonymous: r.anonymous,
    nomineeFirstName: r.nominee_first_name,
    nomineeLastName: r.nominee_last_name,
    nomineeEmail: r.nominee_email,
    nomineeMobile: r.nominee_mobile,
    nomineeWorkPhone: r.nominee_work_phone,
    nomineeOrganisation: r.nominee_organisation,
    nomineePostCode: r.nominee_post_code,
    openingStatement: r.opening_statement,
    linkedIn: r.linked_in,
    howHeard: r.how_heard,
    nominatorFirstName: r.nominator_first_name,
    nominatorLastName: r.nominator_last_name,
    nominatorEmail: r.nominator_email,
    nominatorMobile: r.nominator_mobile,
    nominatorWorkPhone: r.nominator_work_phone,
    businessName: r.business_name,
    businessLocation: r.business_location,
    businessCategory: r.business_category,
    supporting: r.supporting,
    agreedToTerms: r.agreed_to_terms,
  };

  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-20 pt-32 sm:pt-36">
      <div className="mx-auto w-full max-w-3xl">
        <NominationDetail nomination={nomination} />
      </div>
    </main>
  );
}
