// Orchestrates the "Email me my Find My Award results" send.
// Called by app/api/find-my-award/email/route.ts.

import { crytidEncryptForUrl } from '@/lib/crytid';
import type { SiteData } from '@/lib/site';
import { getBrandConfig } from './brand';
import {
  renderFindMyAwardResultsEmail,
  type RecommendedCategory,
} from './findmyaward-render';
import { sendMail, type SendResult } from './send';

export type SendFindMyAwardEmailArgs = {
  /** Recipient address. Required. */
  email: string;
  /** Optional first name for the greeting. */
  firstName?: string;
  /** Category names the matcher rated as "most popular" for this user. */
  topCategoryNames: string[];
  /** Category names the matcher recommended as secondary picks. */
  otherCategoryNames: string[];
  /** The tenant site this request came from — drives branding + sender mailbox. */
  site: SiteData;
};

/**
 * Build the URL the nominee will click to start ONE nomination for a
 * single recommended category. Format mirrors the existing form's
 * pre-select pattern (RegisterForm.tsx reads `?category=…` on mount).
 */
function buildNominateUrl(brandSiteUrl: string, categoryName: string): string {
  const base = brandSiteUrl.replace(/\/$/, '');
  return `${base}/register-interest?category=${encodeURIComponent(categoryName)}`;
}

/**
 * Build the "Nominate All" URL — opens the form with every recommended
 * category pre-selected. Long URL is fine for href targets (no real cap
 * in mail clients), and the form clears the param after handing the
 * list to its internal state.
 */
function buildNominateAllUrl(brandSiteUrl: string, allCategoryNames: string[]): string {
  const base = brandSiteUrl.replace(/\/$/, '');
  const csv = allCategoryNames.map((c) => c.trim()).filter(Boolean).join(',');
  return `${base}/register-interest?categories=${encodeURIComponent(csv)}`;
}

/**
 * Fire the results email. Never throws — returns a SendResult so the
 * route handler can surface a useful status to the client.
 */
export async function sendFindMyAwardResults(
  args: SendFindMyAwardEmailArgs,
): Promise<SendResult | null> {
  const brand = getBrandConfig(args.site);
  const top = args.topCategoryNames.filter(Boolean);
  const other = args.otherCategoryNames.filter(Boolean);

  if (!top.length && !other.length) {
    console.warn('[email/findmyaward] no categories provided; skipping');
    return null;
  }
  if (!args.email || !args.email.includes('@')) {
    console.warn('[email/findmyaward] invalid recipient; skipping');
    return null;
  }

  const allCats = [...top, ...other];

  const topCategories: RecommendedCategory[] = top.map((name) => ({
    name,
    nominateUrl: buildNominateUrl(brand.siteUrl, name),
  }));
  const otherCategories: RecommendedCategory[] = other.map((name) => ({
    name,
    nominateUrl: buildNominateUrl(brand.siteUrl, name),
  }));
  const nominateAllUrl = buildNominateAllUrl(brand.siteUrl, allCats);

  // Per-recipient unsubscribe link — encrypts the email so we identify the
  // subscriber without leaking PII in the URL.
  const unsubscribeUrl = `${brand.siteUrl}/unsubscribe?token=${crytidEncryptForUrl(
    args.email,
  )}`;

  const { subject, html, text } = renderFindMyAwardResultsEmail({
    brand,
    firstName: args.firstName,
    topCategories,
    otherCategories,
    nominateAllUrl,
    unsubscribeUrl,
  });

  return sendMail({
    to: args.email,
    subject,
    html,
    text,
    // Replies should route to the team mailbox, not the visitor's own
    // address (some clients try Reply-All).
    replyTo: brand.contactEmail,
    siteId: args.site.id,
  });
}
