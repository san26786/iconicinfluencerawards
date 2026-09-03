// The person behind an email address, for the organiser screens that list
// addresses: unsubscribes, bounces, email activity.
//
// Written as "fetch the rows, then fetch their contacts" rather than a LATERAL
// join per row, because the join does not scale with the list. On the email
// activity log — 1,500 events on a page — the lateral form took 32 seconds
// against the live database; the same page as two queries takes about one, and
// the second query only asks for the few hundred distinct addresses the first
// one actually returned.
//
// Always scoped to one site. The suppression and bounce lists are global, but
// the contact record behind an address belongs to whichever tenant imported it,
// and joining across sites would put another tenant's contact data on this
// screen.

import { query } from '@/lib/db';
import { fieldsFromCustom, type ContactFull } from '@/lib/organiser/contactExport';

type Row = {
  key: string;
  id: number;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  title: string | null;
  position: string | null;
  company: string | null;
  gender: string | null;
  source: string | null;
  external_source: string | null;
  external_id: string | null;
  import_batch_id: string | null;
  phone_e164: string | null;
  phone_type: string | null;
  phone_valid: boolean | null;
  visit_count: number | null;
  first_visit_at: Date | null;
  last_visit_at: Date | null;
  last_visit_path: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  assigned_categories: unknown;
  custom: Record<string, unknown> | null;
};

/** Timestamps cross to the browser as strings, so they leave here as strings. */
const iso = (d: Date | string | null): string | null => (d ? new Date(d).toISOString() : null);

/**
 * Every column of the contact row, not the handful the card renders.
 *
 * The exports on these screens carry the whole record, so the lookup that feeds
 * them fetches the whole record — a column left out here is a column somebody
 * has to come back to the screen for.
 */
const COLUMNS = `p.id, p.email, p.first_name, p.last_name, p.phone, p.title, p.position,
            p.company, p.gender, p.source, p.external_source, p.external_id,
            p.import_batch_id, p.phone_e164, p.phone_type, p.phone_valid,
            p.visit_count, p.first_visit_at, p.last_visit_at, p.last_visit_path,
            p.created_at, p.updated_at, p.assigned_categories, p.custom`;

/**
 * A row as the screens want it.
 *
 * Null for a row carrying nothing but the address it was matched on: the
 * screens read "is there a contact?" as "do we know who this is?", and a record
 * holding one email address does not answer that.
 */
function toContact(r: Row): ContactFull | null {
  if (!(r.first_name || r.last_name || r.company || r.phone || r.position)) return null;
  const c = r.custom ?? null;
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone,
    title: r.title,
    position: r.position,
    company: r.company,
    ...fieldsFromCustom(c),
    categories: Array.isArray(r.assigned_categories)
      ? (r.assigned_categories as unknown[]).filter((x): x is string => typeof x === 'string')
      : [],
    gender: r.gender,
    source: r.source,
    externalSource: r.external_source,
    externalId: r.external_id,
    importBatch: r.import_batch_id,
    phoneE164: r.phone_e164,
    phoneType: r.phone_type,
    phoneValid: r.phone_valid,
    visitCount: r.visit_count,
    firstVisitAt: iso(r.first_visit_at),
    lastVisitAt: iso(r.last_visit_at),
    lastVisitPath: r.last_visit_path,
    addedAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    // The whole blob, so an export can carry every column the import brought
    // rather than only the handful mapped above.
    custom: c,
  };
}

/**
 * Contacts for these addresses, keyed by the lowercased address.
 *
 * An address missing from the map has no contact record on this site — which is
 * ordinary: a bounce can come from an address nobody ever imported.
 */
export async function contactsByEmail(
  emails: string[],
  siteId: number,
): Promise<Map<string, ContactFull>> {
  const keys = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (keys.length === 0) return new Map();

  const { rows } = await query<Row>(
    // DISTINCT ON keeps one row per address — the newest — because the same
    // list can be imported twice and one address must not become two people.
    `SELECT DISTINCT ON (lower(btrim(p.email)))
            lower(btrim(p.email)) AS key,
            ${COLUMNS}
       FROM potential_users p
      WHERE p.site_id = $2
        AND p.deleted_at IS NULL
        AND lower(btrim(p.email)) = ANY($1::text[])
      ORDER BY lower(btrim(p.email)), p.id DESC`,
    [keys, siteId],
  );

  const out = new Map<string, ContactFull>();
  for (const r of rows) {
    const contact = toContact(r);
    if (contact) out.set(r.key, contact);
  }
  return out;
}

/**
 * Contacts for (site, address) pairs, keyed `"<siteId>:<address>"`.
 *
 * The one list on the dashboard that is deliberately network-wide — registered
 * accounts — needs this. Every other lookup here asks "who is this, on my
 * site?"; this one asks "who is this, on the site they signed up on?", which is
 * the only question that has an answer for a row belonging to another brand.
 *
 * Note what it still refuses to do: an address is matched against its OWN
 * site's contact list and no other. Widening it to "any site that happens to
 * know this address" would be how one tenant's imported contact detail ends up
 * in another tenant's download.
 */
export async function contactsByEmailAndSite(
  pairs: { email: string | null; siteId: number | null }[],
): Promise<Map<string, ContactFull>> {
  const seen = new Set<string>();
  const sites: number[] = [];
  const emails: string[] = [];
  for (const p of pairs) {
    const email = (p.email ?? '').trim().toLowerCase();
    if (!email || p.siteId === null || p.siteId === undefined) continue;
    const key = `${p.siteId}:${email}`;
    if (seen.has(key)) continue;
    seen.add(key);
    sites.push(p.siteId);
    emails.push(email);
  }
  if (sites.length === 0) return new Map();

  const { rows } = await query<Row & { key: string }>(
    // unnest of the two arrays in step, so one pair matches one site — passing
    // the sites and the addresses as separate IN lists would cross them, and
    // every organiser would get every other organiser's contact for a shared
    // address.
    `SELECT DISTINCT ON (p.site_id, lower(btrim(p.email)))
            p.site_id || ':' || lower(btrim(p.email)) AS key,
            ${COLUMNS}
       FROM potential_users p
       JOIN unnest($1::int[], $2::text[]) AS w(site_id, email)
         ON w.site_id = p.site_id
        AND w.email = lower(btrim(p.email))
      WHERE p.deleted_at IS NULL
      ORDER BY p.site_id, lower(btrim(p.email)), p.id DESC`,
    [sites, emails],
  );

  const out = new Map<string, ContactFull>();
  for (const r of rows) {
    const contact = toContact(r);
    if (contact) out.set(r.key, contact);
  }
  return out;
}

/**
 * Contacts for these phone match keys — the last nine digits, the same rule the
 * do-not-contact list matches on.
 *
 * The list of objections is a list of numbers, and a number on its own cannot
 * be checked against anything: an organiser working a call sheet needs to know
 * whose number it is. Matched on the digits rather than on the text, because
 * "+44 7700 900123" and "07700 900123" are one person.
 */
export async function contactsByPhoneKey(
  keys: string[],
  siteId: number,
  matchDigits = 9,
): Promise<Map<string, ContactFull>> {
  const wanted = [...new Set(keys.map((k) => k.trim()).filter(Boolean))];
  if (wanted.length === 0) return new Map();
  // Interpolated into the SQL below rather than bound to a parameter, so it is
  // pinned to a sane integer here.
  const digits = Math.min(Math.max(Math.trunc(matchDigits), 4), 15);

  const { rows } = await query<Row>(
    // The newest row per number, for the same reason as the address lookup: one
    // list imported twice must not turn one person into two.
    `SELECT DISTINCT ON (right(regexp_replace(p.phone, '[^0-9]', '', 'g'), ${digits}))
            right(regexp_replace(p.phone, '[^0-9]', '', 'g'), ${digits}) AS key,
            ${COLUMNS}
       FROM potential_users p
      WHERE p.site_id = $2
        AND p.deleted_at IS NULL
        AND p.phone IS NOT NULL
        AND right(regexp_replace(p.phone, '[^0-9]', '', 'g'), ${digits}) = ANY($1::text[])
      ORDER BY right(regexp_replace(p.phone, '[^0-9]', '', 'g'), ${digits}), p.id DESC`,
    [wanted, siteId],
  );

  const out = new Map<string, ContactFull>();
  for (const r of rows) {
    const contact = toContact(r);
    if (contact) out.set(r.key, contact);
  }
  return out;
}
