import { cache } from 'react';
import { headers } from 'next/headers';
import { query } from './db';

// --------------------------------------------------------------------------
// Type
// --------------------------------------------------------------------------

export interface SiteData {
  id: number;
  domain: string;
  /** Extra domains that should resolve to this same site (e.g. a retired
   *  subdomain kept alive for old bookmarks/backlinks). See getSite(). */
  alt_domains: string[] | null;
  name: string;
  slug: string;
  tagline: string | null;
  year: string;
  legal: string | null;
  // Event
  event_date: string | null;
  event_date_long: string | null;
  event_date_iso: string | null;
  event_deadline_iso: string | null;
  event_deadline_label: string | null;
  event_city: string | null;
  venue: string | null;
  venue_short: string | null;
  ceremonies_count: number;
  // Contact
  email: string | null;
  phone_display: string | null;
  phone_href: string | null;
  company: string | null;
  address: string | null;
  official_site: string | null;
  // Social
  social_facebook: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  social_x: string | null;
  // Theme (RGB triplets e.g. "204 27 27")
  theme_primary: string;
  theme_light: string;
  theme_deep: string;
  theme_50: string;
  theme_bg: string;
  theme_bg_slate: string;
  theme_bg_warm: string;
  theme_bg_darkest: string;
  // Content
  hero_image_id: string | null;
  /** Optional hero background video — takes priority over hero_image_id when set. */
  hero_video_url: string | null;
  categories: unknown[];
  ga_id: string | null;
  is_active: boolean;
  design_variant: 'luxury' | 'sport' | 'corporate';
  logo_url: string | null;
  /** Variant shown in light mode only — for logos that don't read well on white. */
  logo_url_light: string | null;
  font_display: string | null;
  font_body: string | null;
}

// --------------------------------------------------------------------------
// Iconic Influencer Awards defaults — used as fallback when the DB is
// unavailable or the domain is unknown. The colours mirror the token defaults
// in app/globals.css so a DB outage doesn't repaint the site.
// --------------------------------------------------------------------------

const PEA_DEFAULTS: Omit<SiteData, 'id'> = {
  domain: 'iconicinfluencerawards.com',
  alt_domains: null,
  name: 'Iconic Influencer Awards',
  slug: 'iconic-influencer-awards',
  tagline: 'Celebrating the Creators, Brands and Platforms Shaping Digital Influence.',
  year: '2026',
  legal: null,
  // Venue, date and contact details are not confirmed yet. These stay null
  // rather than being guessed — a guess here would republish invented facts
  // into the page copy, the sitemap and the Event JSON-LD the moment the DB
  // is unreachable.
  event_date: null,
  event_date_long: null,
  event_date_iso: null,
  event_deadline_iso: null,
  event_deadline_label: null,
  event_city: null,
  venue: null,
  venue_short: null,
  ceremonies_count: 1,
  email: null,
  phone_display: null,
  phone_href: null,
  company: null,
  address: null,
  official_site: 'https://iconicinfluencerawards.com/',
  social_facebook: null,
  social_instagram: null,
  social_linkedin: null,
  social_x: null,
  theme_primary: '217 70 239',
  theme_light: '240 171 252',
  theme_deep: '134 25 143',
  theme_50: '250 245 255',
  theme_bg: '17 10 26',
  theme_bg_slate: '13 8 20',
  theme_bg_warm: '24 12 30',
  theme_bg_darkest: '8 5 13',
  hero_image_id: '/iconic.png',
  hero_video_url: null,
  categories: [],
  ga_id: null,
  is_active: true,
  design_variant: 'luxury',
  logo_url: '/Iconic-Influencer-Awards-Logo-Dark.png',
  logo_url_light: '/Iconic-Influencer-Awards-Logo-Light.png',
  font_display: 'playfair',
  font_body: 'inter',
};

// --------------------------------------------------------------------------
// getSite() — the main server-side helper
//
// React.cache() deduplicates identical calls within a single render tree, so
// calling getSite() in layout, SiteHeader, SiteFooter, and Hero all costs
// only one DB round-trip per request.
// --------------------------------------------------------------------------

// Map local test hostnames → production domains so a tenant can be exercised
// under its real domain by editing the hosts file (see README dev section).
const LOCAL_DOMAIN_MAP: Record<string, string> = {
  'iia.local': 'iconicinfluencerawards.com',
  '192.168.0.105': 'iconicinfluencerawards.com',
};

export const getSite = cache(async (): Promise<SiteData> => {
  let domain = '';
  try {
    const headersList = await headers();
    domain = headersList.get('x-site-domain') ?? '';
  } catch {
    // headers() unavailable (e.g. during static pre-rendering) — fall through
  }

  // Resolve localhost dev to this site (or override via DEV_SITE_DOMAIN env var).
  // Also resolve .local test domains → real production domains.
  const effectiveDomain =
    !domain || domain === 'localhost'
      ? (process.env.DEV_SITE_DOMAIN ?? 'iconicinfluencerawards.com')
      : (LOCAL_DOMAIN_MAP[domain] ?? domain);

  try {
    const { rows } = await query<SiteData>(
      `SELECT * FROM sites
        WHERE is_active = true
          AND (domain = $1 OR $1 = ANY(COALESCE(alt_domains, '{}'::text[])))
        LIMIT 1`,
      [effectiveDomain]
    );
    if (rows[0]) {
      const row = rows[0];
      // pg returns timestamptz columns as Date objects at runtime even though
      // the query is typed as SiteData (string | null). Coerce here so callers
      // can safely treat these fields as strings.
      const toISO = (v: unknown) => (v instanceof Date ? v.toISOString() : v as string | null);
      row.event_date_iso = toISO(row.event_date_iso);
      row.event_deadline_iso = toISO(row.event_deadline_iso);
      return row;
    }
  } catch {
    // DB unavailable — fall through to defaults so the site still renders
  }

  // id: 0 is a deliberate sentinel, NOT a real tenant. This branch is reached
  // when the domain is unknown or the DB is unreachable. Returning a real
  // site's id here would let a transient DB error attribute nominations,
  // registrations and email jobs to a tenant that didn't submit them.
  return { id: 0, ...PEA_DEFAULTS };
});

// --------------------------------------------------------------------------
// siteMatchesDomain() — checks a candidate domain against a site's primary
// domain OR any of its alt_domains. Use this instead of a raw
// `site.domain === '...'` comparison anywhere code needs to recognise a
// specific site — that breaks the moment the primary domain changes, even
// though the site itself (and its alt_domains) didn't.
// --------------------------------------------------------------------------

export function siteMatchesDomain(site: SiteData, domain: string): boolean {
  return site.domain === domain || (site.alt_domains ?? []).includes(domain);
}

// --------------------------------------------------------------------------
// getSiteById() — used in API routes where the domain header isn't available
// but we have a site_id from a DB record (e.g. email job processing)
// --------------------------------------------------------------------------

export async function getSiteById(id: number): Promise<SiteData | null> {
  try {
    const { rows } = await query<SiteData>(
      `SELECT * FROM sites WHERE id = $1 AND is_active = true LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------
// getSiteId() — lightweight helper for API routes that only need the id
// --------------------------------------------------------------------------

export const getSiteId = cache(async (): Promise<number> => {
  const site = await getSite();
  return site.id;
});
