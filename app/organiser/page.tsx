import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { contactsByEmail, contactsByEmailAndSite } from '@/lib/organiser/contacts';
import { getSite, getSiteId } from '@/lib/site';
import {
  OrganiserDashboard,
  type NominationItem,
  type VisitorItem,
} from '@/components/organiser/Dashboard';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';

// Uses pg → must run on the Node.js runtime, and must not be statically cached.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Organiser dashboard' };

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const fmt = (d: Date | string | null): string => (d ? dateFmt.format(new Date(d)) : '—');
const iso = (d: Date | string | null): string | null => (d ? new Date(d).toISOString() : null);
const fullName = (first: string | null, last: string | null) =>
  [first, last].filter(Boolean).join(' ');

export default async function OrganiserPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  // Organisers only ever see their own site's nominations.
  const siteId = await getSiteId();
  const site = await getSite().catch(() => null);

  const [visitorsRes, nominationsRes] = await Promise.all([
    query<{
      id: number;
      email: string;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      is_active: boolean;
      created_at: Date;
      site_id: number | null;
      site_name: string | null;
    }>(
      // Registered accounts are deliberately NOT scoped to one site: an account
      // is one person across the network, and an organiser looking one up needs
      // to find them whichever brand they signed up on. What the list has to
      // carry, then, is which brand that was — an unlabelled row leaves the
      // organiser guessing whether a stranger is theirs or another site's.
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_active, u.created_at,
              u.site_id, s.name AS site_name
         FROM users u
         LEFT JOIN sites s ON s.id = u.site_id
        WHERE u.role = 'visitor'
        ORDER BY u.created_at DESC`,
    ),
    query<{
      id: number;
      submitted_at: Date | null;
      created_at: Date;
      award_categories: string[] | null;
      self_nominate: boolean;
      anonymous: boolean;
      nominee_first_name: string | null;
      nominee_last_name: string | null;
      nominee_email: string | null;
      nominee_mobile: string | null;
      how_heard: string | null;
      nominator_first_name: string | null;
      nominator_last_name: string | null;
      nominator_email: string | null;
      business_name: string | null;
      business_location: string | null;
      business_category: string | null;
    }>(
      `SELECT id, submitted_at, created_at, award_categories, self_nominate, anonymous,
              nominee_first_name, nominee_last_name, nominee_email, nominee_mobile, how_heard,
              nominator_first_name, nominator_last_name, nominator_email,
              business_name, business_location, business_category
       FROM nominations
        WHERE deleted_at IS NULL AND site_id = $1
        ORDER BY created_at DESC`,
      [siteId],
    ),
  ]);

  // What the contact list already knows about these people, for the downloads.
  //
  // Both exports leave this screen for a call sheet or a CRM, and the row on
  // its own is thin: a nomination holds what the entrant typed into the form, an
  // account holds what somebody typed into a sign-up box. Where there is no
  // contact record the export still carries every field the row itself holds.
  //
  // Two lookups because the two lists are scoped differently: nominations are
  // this site's, so they match this site's contacts; accounts are network-wide,
  // so each one matches the contacts of the site it signed up on.
  const [nominationContacts, visitorContacts] = await Promise.all([
    contactsByEmail(
      nominationsRes.rows.map((n) => n.nominee_email || n.nominator_email || ''),
      siteId,
    ),
    contactsByEmailAndSite(
      visitorsRes.rows.map((v) => ({ email: v.email, siteId: v.site_id })),
    ),
  ]);

  const contactKey = (email: string | null) => (email ?? '').trim().toLowerCase();

  const visitors: VisitorItem[] = visitorsRes.rows.map((v) => ({
    id: v.id,
    name: fullName(v.first_name, v.last_name) || '—',
    email: v.email,
    phone: v.phone,
    active: v.is_active,
    registered: fmt(v.created_at),
    // Accounts predating the site_id column carry no site at all. "Unknown"
    // rather than this site's name: guessing would file another brand's
    // sign-ups under whoever happens to be looking.
    site: v.site_name ?? (v.site_id ? `Site ${v.site_id}` : 'Unknown'),
    ownSite: v.site_id === siteId,
    firstName: v.first_name,
    lastName: v.last_name,
    siteId: v.site_id,
    registeredIso: iso(v.created_at),
    contact: visitorContacts.get(`${v.site_id}:${contactKey(v.email)}`) ?? null,
  }));

  const nominations: NominationItem[] = nominationsRes.rows.map((n) => ({
    id: n.id,
    nominee: fullName(n.nominee_first_name, n.nominee_last_name) || '—',
    nomineeEmail: n.nominee_email,
    nomineeMobile: n.nominee_mobile,
    anonymous: n.anonymous,
    selfNominate: n.self_nominate,
    categories: Array.isArray(n.award_categories) ? n.award_categories : [],
    howHeard: n.how_heard,
    nominator: fullName(n.nominator_first_name, n.nominator_last_name) || '—',
    nominatorEmail: n.nominator_email,
    businessName: n.business_name,
    businessLocation: n.business_location,
    businessCategory: n.business_category,
    submitted: fmt(n.submitted_at ?? n.created_at),
    submittedIso: iso(n.submitted_at),
    createdIso: iso(n.created_at),
    contact:
      nominationContacts.get(contactKey(n.nominee_email || n.nominator_email)) ?? null,
  }));

  return (
    <main id="main" className="min-h-screen bg-ink grain px-5 pb-20 pt-32 sm:pt-36">
      <div className="mx-auto w-full max-w-6xl">
        <OrganiserNav />
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Organiser</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">Dashboard</h1>
          <p className="mt-2 text-sm text-white/55">
            Registered users and submitted nominations.
          </p>
        </div>

        <OrganiserDashboard
          visitors={visitors}
          nominations={nominations}
          site={site?.slug || site?.name || ''}
        />
      </div>
    </main>
  );
}
