// Everything known about a person, as spreadsheet columns.
//
// Three screens list email addresses with a contact behind them — unsubscribes,
// bounces, email activity — and each exported the same seven fields: name,
// position, company, phone, linkedin, website, location. The contact record
// behind those addresses holds far more, because the import that created it
// carried far more: gender, seniority, industry, profile summary, the source
// list it came from, the batch it arrived in, whether the phone number is a
// mobile, and whatever other columns that particular file had. All of it was
// dropped on the way to the file, so an organiser working the export in a CRM
// had to come back to the screen for anything the seven columns did not answer.
//
// One list of columns, shared by all three exports, so the files line up with
// each other and a person exported from one screen is the same person exported
// from another.

/**
 * The fields a contact is worth showing on screen.
 *
 * Declared here rather than imported from a contact card component, as it is on
 * the platform build: this site has no such component yet, and a type that only
 * exists inside a `"use client"` module cannot be read by the route handlers
 * that also build these files.
 */
export type ContactDetails = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  position: string | null;
  company: string | null;
  linkedin: string | null;
  website: string | null;
  industries: string | null;
  seniority: string | null;
  location: string | null;
  summary: string | null;
  categories: string[];
};

/** The whole contact record, not just the fields a card would render. */
export type ContactFull = ContactDetails & {
  id: number | null;
  gender: string | null;
  /** The list this contact was imported from. */
  source: string | null;
  externalSource: string | null;
  externalId: string | null;
  importBatch: string | null;
  /** The number as dialled internationally, and what kind of line it is. */
  phoneE164: string | null;
  phoneType: string | null;
  phoneValid: boolean | null;
  visitCount: number | null;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
  lastVisitPath: string | null;
  addedAt: string | null;
  updatedAt: string | null;
  /** Everything the import carried that has no column of its own. */
  custom: Record<string, unknown> | null;
};

/**
 * Contact columns, in the order they appear after a screen's own columns.
 *
 * `contact_email` rather than `email`: every one of these exports already leads
 * with the address the row is about, and two columns of the same name make a
 * file that spreadsheets and importers both read wrong.
 */
export const CONTACT_HEADERS = [
  'name', 'first_name', 'last_name', 'contact_email', 'title', 'position', 'company',
  'phone', 'phone_e164', 'phone_type', 'phone_valid', 'linkedin', 'website',
  'industries', 'seniority', 'location', 'gender', 'assigned_categories',
  'profile_summary', 'contact_source', 'external_source', 'external_id',
  'import_batch', 'site_visits', 'first_visit', 'last_visit', 'last_visit_page',
  'contact_id', 'contact_added', 'contact_updated',
];

/**
 * Anything carrying an import's leftover columns: a contact record, or a
 * visitor row with one joined onto it.
 */
type WithCustom = { custom?: Record<string, unknown> | null };

/**
 * First non-empty value among the given keys of a contact's custom blob.
 *
 * The import puts whatever the source file carried into `custom`, under
 * whichever of several names that source used — LinkedIn arrives as
 * personalLinkedin on one list and linkedin on another.
 */
function pick(custom: Record<string, unknown> | null, ...keys: string[]): string | null {
  if (!custom) return null;
  for (const k of keys) {
    const v = custom[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return null;
}

/**
 * The fields that live in the custom blob rather than in a column of their own.
 *
 * One reading of those blobs, shared by the lookup that feeds the screens and
 * by the exports that read a contact off a joined row — otherwise "which key
 * holds the LinkedIn profile" gets answered twice and drifts.
 */
export function fieldsFromCustom(custom: Record<string, unknown> | null) {
  return {
    linkedin: pick(custom, 'personalLinkedin', 'linkedin', 'linkedIn', 'companyLinkedin'),
    website: pick(custom, 'website', 'companyWebsite', 'domain'),
    industries: pick(custom, 'industries', 'industry'),
    seniority: pick(custom, 'seniority', 'departments'),
    location: pick(custom, 'personAddress', 'walesLocation', 'city', 'country', 'personCountry'),
    summary: pick(custom, 'profileSummary'),
  };
}

/**
 * Beyond this the file stops being a spreadsheet and starts being a problem.
 *
 * Generous rather than tight: a contact import routinely carries forty or fifty
 * columns, and the point of the cap is to survive one pathological file, not to
 * decide for an organiser which of their own fields matter.
 */
const MAX_CUSTOM_COLUMNS = 60;

/**
 * A bare handle or domain made into something clickable.
 *
 * The same rule `asUrl` applies on the contact card, spelled out again here
 * rather than imported from it: that module is a client component, and this one
 * is read by route handlers too, where importing a client module would leave a
 * function that cannot be called on the server.
 */
function link(value: string | null | undefined): string {
  const v = (value ?? '').trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v.replace(/^\/+/, '')}`;
}

/** A cell's worth of whatever the import put in `custom`. */
function flat(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  // Arrays and nested objects do exist in these blobs; JSON keeps them readable
  // in one cell rather than printing "[object Object]".
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

/** The date part alone — a spreadsheet sorts these, and nobody reads the seconds. */
const day = (iso: string | null): string => (iso ? iso.slice(0, 10) : '');

/** Date and time to the minute, for the things that happen more than once a day. */
const stamp = (iso: string | null): string => (iso ? iso.slice(0, 16).replace('T', ' ') : '');

/** The contact half of one export row. Every column present, blank when unknown. */
export function contactCells(c: ContactFull | null | undefined): Record<string, unknown> {
  if (!c) return Object.fromEntries(CONTACT_HEADERS.map((h) => [h, '']));
  return {
    name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || '',
    first_name: c.firstName ?? '',
    last_name: c.lastName ?? '',
    contact_email: c.email ?? '',
    title: c.title ?? '',
    position: c.position ?? '',
    company: c.company ?? '',
    phone: c.phone ?? '',
    phone_e164: c.phoneE164 ?? '',
    phone_type: c.phoneType ?? '',
    // Three states, not two: no answer is not the same as "we checked and it is
    // not a working number".
    phone_valid: c.phoneValid === null || c.phoneValid === undefined ? '' : c.phoneValid ? 'Yes' : 'No',
    linkedin: link(c.linkedin),
    website: link(c.website),
    industries: c.industries ?? '',
    seniority: c.seniority ?? '',
    location: c.location ?? '',
    gender: c.gender ?? '',
    // Semicolons: category names have commas in them.
    assigned_categories: (c.categories ?? []).join('; '),
    profile_summary: c.summary ?? '',
    contact_source: c.source ?? '',
    external_source: c.externalSource ?? '',
    external_id: c.externalId ?? '',
    import_batch: c.importBatch ?? '',
    site_visits: c.visitCount ?? '',
    first_visit: stamp(c.firstVisitAt),
    last_visit: stamp(c.lastVisitAt),
    last_visit_page: c.lastVisitPath ?? '',
    contact_id: c.id ?? '',
    contact_added: day(c.addedAt),
    contact_updated: day(c.updatedAt),
  };
}

/**
 * The extra columns these particular contacts were imported with.
 *
 * Discovered from the rows being exported rather than assumed, because every
 * import brings a different set — one list carries "walesLocation" and
 * "profileSummary", the next carries "employeeCount" and "technologies".
 * Ordered by how many rows actually have a value, so the columns worth reading
 * come first when the cap bites.
 *
 * Keys that would collide with a column the file already has are left out: they
 * are the same value under its own heading, and a duplicate header makes the
 * file ambiguous.
 */
export function customColumns(
  contacts: (WithCustom | null | undefined)[],
  reserved: string[],
): string[] {
  const taken = new Set(reserved.map((h) => h.trim().toLowerCase()));
  const counts = new Map<string, number>();
  for (const c of contacts) {
    if (!c?.custom) continue;
    for (const [k, v] of Object.entries(c.custom)) {
      if (!k.trim() || taken.has(k.trim().toLowerCase())) continue;
      if (flat(v).trim() === '') continue;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_CUSTOM_COLUMNS)
    .map(([k]) => k);
}

/** Those extra columns for one row. */
export function customCells(
  c: WithCustom | null | undefined,
  keys: string[],
): Record<string, unknown> {
  const custom = c?.custom ?? null;
  return Object.fromEntries(keys.map((k) => [k, custom ? flat(custom[k]) : '']));
}
