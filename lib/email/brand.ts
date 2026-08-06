// Build a BrandConfig (consumed by render.ts) from the requesting tenant's
// own row in the `sites` table — so every email (nomination, contact,
// password reset, judge notification…) is branded as the site the recipient
// actually interacted with, not a single hardcoded identity.
//
// Call sites that already have a SiteData (from getSite()/getSiteById())
// should pass it straight through — no extra DB round-trip. Falling back to
// the static lib/content.ts constants only happens if no SiteData is given
// (kept for any caller not yet migrated) — SITE/SOCIAL there reflect this
// specific repo's original single-tenant identity and is now a safety net,
// not the source of truth.

import { SITE, SOCIAL, OFFICIAL_SITE } from '@/lib/content';
import type { SiteData } from '@/lib/site';
import type { BrandConfig } from './render';

function socialLinksFromSite(site: SiteData) {
  return [
    site.social_facebook && { label: 'Facebook', href: site.social_facebook },
    site.social_instagram && { label: 'Instagram', href: site.social_instagram },
    site.social_linkedin && { label: 'LinkedIn', href: site.social_linkedin },
    site.social_x && { label: 'X', href: site.social_x },
  ].filter((s): s is { label: string; href: string } => Boolean(s));
}

export function getBrandConfig(site?: SiteData): BrandConfig {
  if (site) {
    const siteUrl =
      (site.official_site || `https://${site.domain}`).replace(/\/$/, '');
    // Any field this site hasn't filled in is left EMPTY rather than borrowed
    // from the static SITE constants — an email headed with one brand's name
    // but carrying another's phone number, venue and legal line is worse than
    // one with the detail simply omitted.
    return {
      name: site.name,
      year: site.year,
      siteUrl,
      contactEmail: site.email ?? '',
      contactPhone: site.phone_display ?? '',
      venue: site.venue ?? '',
      eventDate: site.event_date_long ?? '',
      social: socialLinksFromSite(site),
      legal: site.legal ?? '',
      guidelinePath: '/nomination-guideline',
    };
  }

  // Fallback — no SiteData supplied (legacy call site not yet updated).
  const siteUrl =
    process.env.PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    OFFICIAL_SITE.replace(/\/$/, '');

  return {
    name: SITE.name,
    year: SITE.year,
    siteUrl,
    contactEmail: SITE.email,
    contactPhone: SITE.phoneDisplay,
    venue: SITE.venue,
    eventDate: SITE.eventDateLong,
    social: SOCIAL.map((s) => ({ label: s.label, href: s.href })),
    legal: SITE.legal,
    guidelinePath: '/nomination-guideline',
  };
}
