// Orchestrates the two nomination emails (nominee + nominator) from a parsed
// nomination payload. Keeps the route handler thin.

import {
  ALL_AWARD_CATEGORIES,
  THEME_APPLICATION_URLS,
  type ThemeId,
} from '@/lib/content';
import { crytidEncryptForUrl } from '@/lib/crytid';
import type { SiteData } from '@/lib/site';
import { getBrandConfig } from './brand';
import {
  renderNomineeEmail,
  renderNominatorEmail,
  type ThemeApplication,
} from './render';
import { sendMany, type SendResult } from './send';

// Shape we expect the multipart `payload` field to carry. Mirrors what
// RegisterForm.tsx builds.
export type NominationPayload = {
  awardCategories?: string[];
  selfNominate?: boolean;
  nominee?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    mobile?: string;
    workPhone?: string;
    organisation?: string;
    postCode?: string;
    anonymous?: boolean | 'yes' | 'no';
    openingStatement?: string;
    linkedIn?: string;
    howHeard?: string;
  };
  nominator?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    mobile?: string;
    workPhone?: string;
    businessName?: string;
    businessLocation?: string;
    businessCategory?: string;
  };
};

function isAnonymous(value: NominationPayload['nominee'] extends infer N ? N : never): boolean {
  const v = (value as { anonymous?: boolean | string } | undefined)?.anonymous;
  if (typeof v === 'boolean') return v;
  return v === 'yes';
}

/**
 * Build the deep-link an entrant clicks to start their application for one
 * theme. We deliberately link per-theme — never per-category — so a nominee
 * across 20 categories doesn't see 20 buttons. There are exactly four themes
 * (influencer / women / legacy / business), so at most four buttons.
 *
 * Each theme runs on its own canonical domain (see THEME_APPLICATION_URLS
 * in lib/content.ts). We append the application path + the encrypted
 * nomination id so the destination site can resolve which categories the
 * nominee has been nominated for under its theme.
 *
 * Final URL shape:
 *   {themeDomain}/application_process
 *     ?nominated_id=<crytid-encrypted nomination id>
 *     &step=profile
 *
 * The `theme=` query param is no longer needed — the domain identifies it.
 */
function buildThemeApplicationUrl(opts: {
  nominationId: string | null;
  themeId: ThemeId;
  nomineeEmail: string;
}): string {
  const themeBase = THEME_APPLICATION_URLS[opts.themeId].replace(/\/$/, '');
  const idSource =
    opts.nominationId && opts.nominationId.trim()
      ? opts.nominationId.trim()
      : `${opts.nomineeEmail}|${Date.now()}`;
  const encrypted = crytidEncryptForUrl(idSource);
  return `${themeBase}/application_process?nominated_id=${encrypted}&step=profile`;
}

// Reverse lookup: category name -> theme metadata. Built once at module
// load from the AWARD_CATEGORIES taxonomy. Centralised so the email and
// future consumers all agree on which theme a category belongs to.
type ThemeMeta = { id: ThemeId; name: string };
const CATEGORY_TO_THEME: ReadonlyMap<string, ThemeMeta> = (() => {
  const m = new Map<string, ThemeMeta>();
  for (const group of ALL_AWARD_CATEGORIES) {
    for (const name of [...group.popular, ...group.prime, ...group.more]) {
      m.set(name, { id: group.id, name: group.name });
    }
  }
  return m;
})();

/**
 * Group the user's nominated categories by their parent theme. Themes appear
 * in the order they first show up in the input list (so the order roughly
 * tracks how the user chose them in the form). Categories within a theme
 * preserve the input ordering too.
 *
 * Returns ≤ 4 entries (one per theme). Categories whose name isn't in the
 * taxonomy get bucketed under a synthesized fallback theme so we never lose
 * a nomination — the application URL falls back to a category-keyed link.
 */
function groupCategoriesByTheme(categoryNames: string[]): {
  themeId: ThemeId | 'unknown';
  themeName: string;
  categories: string[];
}[] {
  const buckets = new Map<string, { themeId: ThemeId | 'unknown'; themeName: string; categories: string[] }>();
  for (const name of categoryNames) {
    const meta = CATEGORY_TO_THEME.get(name);
    const key = meta?.id ?? 'unknown';
    const existing = buckets.get(key);
    if (existing) {
      existing.categories.push(name);
    } else {
      buckets.set(key, {
        themeId: meta?.id ?? 'unknown',
        themeName: meta?.name ?? 'Other Awards',
        categories: [name],
      });
    }
  }
  return Array.from(buckets.values());
}

/**
 * Send both nomination emails. Returns the per-recipient SendResults so the
 * caller can log them. Never throws — failures are reflected in the results.
 */
export async function sendNominationEmails(
  payload: NominationPayload,
  nominationId: string | null,
  site?: SiteData,
): Promise<{
  nomineeResult: SendResult | null;
  nominatorResult: SendResult | null;
}> {
  const brand = getBrandConfig(site);
  const siteId = site?.id;
  const applicationBase =
    process.env.APPLICATION_BASE_URL?.replace(/\/$/, '') ||
    'https://b2bgrowthhub.org';

  const nomineeEmail = (payload.nominee?.email || '').trim();
  const nominatorEmail = (payload.nominator?.email || '').trim();
  const selfNomination = !!payload.selfNominate;
  const anonymous = isAnonymous(payload.nominee);
  const categories = (payload.awardCategories ?? []).filter(Boolean);

  // No categories means there's nothing to apply for — skip silently.
  if (!categories.length) {
    console.warn('[email/nomination] no categories on payload; skipping email send');
    return { nomineeResult: null, nominatorResult: null };
  }

  // Per-THEME application deep links. The nominee email shows one card per
  // theme — with the list of categories nominated under that theme — and a
  // single "Complete Your Application" button per theme. Hard cap: 4 cards.
  // Each theme has its own dedicated domain (THEME_APPLICATION_URLS), so the
  // four buttons fan out to four different sites.
  const themeApps: ThemeApplication[] = groupCategoriesByTheme(categories).map(
    (group) => ({
      themeId: group.themeId,
      themeName: group.themeName,
      categories: group.categories,
      applicationUrl:
        group.themeId === 'unknown'
          ? // Defensive fallback for a category whose name isn't in the
            // taxonomy. Shouldn't trigger for in-form selections. Link goes
            // to the central application URL so the user still has a path
            // forward, with the unmapped category name in the query.
            `${applicationBase.replace(/\/$/, '')}/application_process?nominated_id=${crytidEncryptForUrl(
              nominationId && nominationId.trim()
                ? nominationId.trim()
                : `${nomineeEmail}|${Date.now()}`,
            )}&category=${encodeURIComponent(group.categories[0])}&step=profile`
          : buildThemeApplicationUrl({
              nominationId,
              themeId: group.themeId,
              nomineeEmail,
            }),
    }),
  );

  // Per-recipient unsubscribe link. Encrypts the email so the upstream
  // unsubscribe page can identify the subscriber without exposing PII in the URL.
  const unsubFor = (email: string): string =>
    `${applicationBase}/unsubscribe.php?token=${crytidEncryptForUrl(email)}`;

  // --- Nominee email -----------------------------------------------------
  // When self-nominating, the "nominee" address IS the nominator. We still
  // send this email so the entrant has the application links.
  let nomineeResult: SendResult | null = null;
  if (nomineeEmail) {
    const nominatorName =
      [payload.nominator?.firstName, payload.nominator?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() || undefined;

    const { subject, html } = renderNomineeEmail({
      brand,
      nomineeFirstName: payload.nominee?.firstName ?? '',
      themes: themeApps,
      categoryCount: categories.length,
      reason: payload.nominee?.openingStatement ?? '',
      anonymous,
      isSelfNomination: selfNomination,
      // Anonymity rule: never include the nominator's identity in the email
      // delivered to the nominee, regardless of whether we know it.
      nominatorName: anonymous ? undefined : nominatorName,
      unsubscribeUrl: unsubFor(nomineeEmail),
    });

    [nomineeResult] = await sendMany([
      { to: nomineeEmail, subject, html, siteId },
    ]);
  }

  // --- Nominator thank-you email -----------------------------------------
  // Skip when self-nominating (would duplicate the nominee email) or when
  // we have no separate nominator address.
  let nominatorResult: SendResult | null = null;
  const distinctNominator =
    !!nominatorEmail &&
    !selfNomination &&
    nominatorEmail.toLowerCase() !== nomineeEmail.toLowerCase();

  if (distinctNominator) {
    const nomineeName = [payload.nominee?.firstName, payload.nominee?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    const { subject, html } = renderNominatorEmail({
      brand,
      nominatorFirstName: payload.nominator?.firstName ?? '',
      nomineeName: nomineeName || 'your nominee',
      categories: categories.map((name) => ({ name })),
      unsubscribeUrl: unsubFor(nominatorEmail),
    });

    [nominatorResult] = await sendMany([
      { to: nominatorEmail, subject, html, siteId },
    ]);
  }

  return { nomineeResult, nominatorResult };
}

/**
 * Try to extract a numeric/string nomination id from the upstream PHP API's
 * JSON response. Returns null if the response wasn't JSON or didn't include
 * any of the recognised id fields.
 */
export function extractNominationId(upstreamBody: string): string | null {
  try {
    const j = JSON.parse(upstreamBody);
    const candidates = [
      j?.nomination_id,
      j?.nominationId,
      j?.id,
      j?.data?.nomination_id,
      j?.data?.id,
      j?.result?.id,
    ];
    for (const c of candidates) {
      if (c != null && c !== '') return String(c);
    }
  } catch {
    // Not JSON — that's fine, fall through.
  }
  return null;
}
